import { Button, 
    ButtonType, 
    Columns, 
    ComponentColor, 
    ComponentStatus, 
    Dropdown, 
    Grid, 
    IconFont, 
    Page, 
    Panel, 
    DateRangePicker,
    DapperScrollbars,
    Appearance,
    PopoverPosition,
    PopoverInteraction,
    Popover,
    FlexBox,
    ComponentSize,
} from '@influxdata/clockface'
import React, { createRef, PureComponent } from 'react'
import * as api from '../components/api'
import SessionsTable from '../components/SessionsTable'
import TabGroup from '../components/ParameterModal'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import BucketsDropdown from 'src/shared/components/DeleteDataForm/BucketsDropdown'
import { extractBoxedCol } from "src/timeMachine/apis/queryBuilder"
import { runQuery } from "src/shared/apis/query"
import GetResources from 'src/resources/components/GetResources'
import {AppState, ResourceType} from 'src/types'
import DeleteDataForm from 'src/shared/components/DeleteDataForm/DeleteDataForm'
import MLBucketSelector from '../components/MLBucketSelector'
import ModelSection from '../components/ModelSection'
import FailureService from 'src/shared/services/FailureService'


interface Props { }

interface State {
    selectedBucket: string,
    sessions: any[],
    measurements: (string | number)[],
    mlinfo: Object,
    listMode: Boolean
    dataLoaded: Boolean
    from: string,
    to: string,
    sessionID: string,
    timeRange: any,
    measurementToSensors: any,
    job: string,
    selectedMeasurement: string
    trainTimeRangeOpen: boolean,
    dropdownData: any[]
    databases: string[]
    models: any[]
}

// let modelSectionModels = [{
//     Algorithm: "LSTM",
//     Job: "Anomaly Detection",
//     sessionID: "1620042106052",
//     modelID: "535a33afbc1c415094dac9426c49eedc",
//     Status: "idle",
//     Parameters: {
//         "Epochs": 100,
//         "Input Vector Size": 20,
//         "Output Vector Size": 1,
//         "Scaling-Max": 1,
//         "Scaling-Min": -1
//     },
//     MetaInfo: {
//         Creator: "creator@mail.com",
//         Created: new Date().toISOString(),
//         Job: "Anomaly Detection",
//         Hardware: ["Sensor1, Sensor2, Sensor3"]
//     }
//     // Hardware: ["Sensor1", "Sensor2", "Sensor3"]
// }, {
//     Algorithm: "SVM",
//     Job: "Anomaly Detection",
//     sessionID: "1620042106052",
//     modelID: "535a33afbc1c415094dac9426c49eegf",
//     Status: "running",
//     Parameters: {
//         "Epochs": 100,
//         "Input Vector Size": 20,
//         "Output Vector Size": 1,
//         "Scaling-Max": 1,
//         "Scaling-Min": -1
//     },
//     MetaInfo: {
//         Creator: "creator@mail.com",
//         Created: new Date().toISOString(),
//         Job: "Anomaly Detection",
//         Hardware: ["Sensor1, Sensor2, Sensor3"]
//     }
//     // Hardware: ["Sensor1", "Sensor2", "Sensor3"]    
// }, {
//     Algorithm: "Deep-LSTM",
//     Job: "Anomaly Detection",
//     sessionID: "1620042106052",
//     modelID: "535a33afbc1c415094dac9426c49eess",
//     Status: "training",
//     Parameters: {
//         "Epochs": 100,
//         "Input Vector Size": 20,
//         "Output Vector Size": 1,
//         "Scaling-Max": 1,
//         "Scaling-Min": -1
//     },
//     MetaInfo: {
//         Creator: "creator@mail.com",
//         Created: new Date().toISOString(),
//         Job: "Anomaly Detection",
//         Hardware: ["Sensor1, Sensor2, Sensor3"]
//     }
//     // Hardware: ["Sensor1", "Sensor2", "Sensor3"]
// }]

export default class MLAdvancedContainer extends PureComponent<Props, State> {
    private trainDateTimeRangeRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props)
        this.state = {
            selectedBucket: "Select Database",
            sessionID: "",
            from: new Date().toISOString(),
            to: new Date().toISOString(),
            sessions: [],
            job: "Select Job",
            measurements: [],
            trainTimeRangeOpen: false,
            timeRange: {},
            measurementToSensors: {},
            dropdownData: [],
            databases: [],
            models: [],
            selectedMeasurement: "",
            mlinfo:  {},
            listMode: true,
            dataLoaded: false
        }
    }

    componentDidMount = () => {

        api.getParams().then(mlinfo => {
            api.getSessions().then(sessions => {
            this.setState({sessions: sessions, mlinfo: mlinfo.data, dataLoaded: true})
            })
            // this.setState({mlinfo: mlinfo.data, dataLoaded: true})
        })
        
        // this.getDatabases().then(databases => {
        //     this.setState({databases: databases})
        // })
    }

    onSessionSelect = (sessionID: string, from: string, to: string, database: string, mlinfo: any) => {
        this.setState({sessionID: sessionID, 
            from: from,
            to: to,
            selectedBucket: database,
            mlinfo: mlinfo,
            listMode: false
        })
    }   
    onCreateSession = () => {
        this.setState({listMode: false})
    }
    setSelectedBucket = (selectedBucket: string) => {
        this.setState({selectedBucket: selectedBucket})
        this.constructDropdownData(selectedBucket)
    }
    setMeasurements = (measurements: (string | number)[]) => {
        this.setState({measurements: measurements})
    }

    setSelectedMeasurement = (measurement: string) => {
        this.setState({selectedMeasurement: measurement})
    }

    constructDropdownData = (selectedBucket: string) => {
        const orgID = this.props["match"].params["orgID"]
        const measurementQuery = `import "influxdata/influxdb/v1" v1.measurements(bucket: "${selectedBucket}")`
        async function asyncForEach(array, callback) {
            for (let index = 0; index < array.length; index++) {
              await callback(array[index], index, array);
            }
        }
        let dropdownData = []
        extractBoxedCol(runQuery(orgID, measurementQuery), '_value').promise.then(async(measurements) => {
            this.setState({measurements: measurements})
                asyncForEach(measurements, async(msr) => {
                    const fieldQuery = `import "influxdata/influxdb/v1" v1.measurementFieldKeys(bucket: "${selectedBucket}", \ 
                    measurement: "${msr}")`
                    let obj = {
                        label: msr,
                        value: msr,
                        selected: msr,
                        children: []
                    }
                    let fields = await extractBoxedCol(runQuery(orgID, fieldQuery), '_value').promise

                    fields.forEach(field => {
                        let childrenObj = {
                            label: field,
                            value: field,
                            selected: field,
                            measurement: msr
                        }
                        obj.children.push(childrenObj)
                    })
                    dropdownData.push(obj)

                }).then(() => {
                    this.setState({dropdownData: dropdownData})
                })
            })
    }

    setCellCountAndIDs = (pkg) => {
        let cellCount = 0
        pkg.forEach(_ => {
            cellCount += 1
        })
        if (cellCount != 0) {
            this.setState({models: pkg})
        }

        // this.setState({cellCount: cellCount, sessionPhase: "train", modelData: md})
    }

    cellDataReceived = (pkg, modelID) => {
        let newModels = []
        // console.log(pkg)
        if (pkg !== undefined || pkg !== null) {
            const {models} = this.state

            models.forEach(model => {
                if (model.modelID === modelID) {
                    let newModel = pkg
                    newModels.push(newModel)
                } else {
                    newModels.push(model)
                }
            })
            this.setState({models: newModels})
        }
    }

    onJobSelection = (job: string) => {
        this.setState({job: job})
    }

    onSetTimeRange = (e: any) => {
        let from = e.lower.replace("T", " ")
        from = from.replace("Z", "")
        let to = e.lower.replace("T", " ")
        to = from.replace("Z", "")

        let timeRange = {
            lower: from,
            upper: to
        }

        this.setState({from: e.lower, to: e.upper, timeRange: timeRange, trainTimeRangeOpen: false})
    }

    onCloseTimeRangePopover = () => {
        this.setState({trainTimeRangeOpen: false})
    }

    onOpenTimeRangePopover = () => {
        this.setState({trainTimeRangeOpen: true})
    }

    resetTimeRange = () => {
        this.setState({from: new Date().toISOString(), to: new Date().toISOString()})
    }

    onStartSession = async () => {
        let sessionID = new Date().getTime()
        let newSession = {sessionID: sessionID, from:this.state.from, to: this.state.to,
            database: this.state.selectedBucket, mlinfo: this.state.mlinfo}
        await api.postSession(newSession)
        let types = ""
        if (this.state.job === "Anomaly Detection") {
            types = "AD"
        } else if (this.state.job === "RUL Estimation") {
            types = "RUL"
        } else {
            types = "FP"
        }
        let pkg = {
            types: types,
            creator: "creator",
            sessionID: sessionID,
            dbSettings: {
                host: "localhost",
                port: 8080,
                db: this.state.selectedBucket,
                rp: "autogen"
            },
            startTime: this.state.from,
            endTime: this.state.to,
            sensors: {
                Input: this.state.measurementToSensors,
                Output: this.state.measurementToSensors
            },
            params: this.state.mlinfo["Parameters"]
        }

        api.issueTrainingJob(pkg)
        let sessions = await api.getSessions()
        this.setState({sessions: sessions, listMode: true})
    }

    onDropdownTreeChange = (_, selectedNodes) => {
        let m2s = {}
        // console.log(selectedNodes)
        selectedNodes.forEach(node => {
            if(node._children) {
                m2s[node.value] = []
                node._children.forEach(field => {
                    m2s[node.value].push(field.value)
                })
            } else {
                if (m2s[node.measurement] === undefined) {
                    m2s[node.measurement] = []
                }
                m2s[node.measurement].push(node.value)
            }
        })
        this.setState({measurementToSensors: m2s})
    }

    private get optionsComponents(): JSX.Element {
        return (
            <React.Fragment>
                <FlexBox margin={ComponentSize.Small} style={{ marginRight: '10%' }}>
                    <Popover
                        appearance={Appearance.Outline}
                        position={PopoverPosition.Below}
                        triggerRef={this.trainDateTimeRangeRef}
                        visible={this.state.trainTimeRangeOpen}
                        showEvent={PopoverInteraction.None}
                        hideEvent={PopoverInteraction.None}
                        distanceFromTrigger={8}
                        testID="timerange-popover"
                        enableDefaultStyles={false}
                        contents={() => (
                            <DateRangePicker
                                timeRange={{
                                    lower: this.state.from,
                                    upper: this.state.to
                                }}
                                onSetTimeRange={this.onSetTimeRange}
                                // onClose={this.onCloseTimeRangePopover}
                                // position={
                                //     { position: 'relative' }
                                // }
                            />
                        )}
                    />
                    <Button
                        ref={this.trainDateTimeRangeRef}
                        text="Time Range"
                        onClick={this.onOpenTimeRangePopover}
                        type={ButtonType.Button}
                        icon={IconFont.Calendar}
                        color={ComponentColor.Secondary}
                    />
                    <Button
                        icon={IconFont.Remove}
                        text="Reset Time Range"
                        color={ComponentColor.Danger}
                        onClick={this.resetTimeRange}
                        style={{marginLeft: "10px"}}
                    />
                </FlexBox>
            </React.Fragment>
        )
    }
    
    private get jobDescriptions(): JSX.Element[] {
        return [
        <Dropdown.Item
            testID="dropdown-item generate-token--read-write"
            id={"option1"}
            key={"option1"}
            value={"Anomaly Detection"}
            onClick={this.onJobSelection}
            >
                Anomaly Detection
        </Dropdown.Item>,
        <Dropdown.Item
            testID="dropdown-item generate-token--read-write"
            id={"option1"}
            key={"option1"}
            value={"RUL Estimation"}
            onClick={this.onJobSelection}
            >
                RUL Estimation
        </Dropdown.Item>,
        <Dropdown.Item
            testID="dropdown-item generate-token--read-write"
            id={"option1"}
            key={"option1"}
            value={"Failure Probability"}
            onClick={this.onJobSelection}
            >
                Failure Probability
        </Dropdown.Item>
        ]
    }
    public render(): JSX.Element {
        if (this.state.dataLoaded) {
            return (
                <Page>
                    <Page.Header fullWidth={true}>
                        <Page.Title title={"Advanced ML"} />
                        <div>
                        <Button 
                            color={ComponentColor.Secondary}
                            titleText="Create session"
                            text="Create Session"
                            type={ButtonType.Button}
                            status={this.state.listMode ? ComponentStatus.Valid : ComponentStatus.Disabled}
                            onClick={() => this.onCreateSession()}
                            style={{marginRight: 10}}/>
                        <Button 
                            color={ComponentColor.Secondary}
                            titleText="See sessions"
                            text="Sessions Table"
                            type={ButtonType.Button}
                            status={this.state.listMode ? ComponentStatus.Disabled : ComponentStatus.Valid}
                            onClick={() => this.setState({listMode: true})}/>
                        </div>
                        
                    </Page.Header>
                    <Page.Contents fullWidth={true} scrollable={true}>
                    {this.state.listMode ? (
                        <SessionsTable
                            sessions={this.state.sessions}
                            onSessionSelect={this.onSessionSelect}
                            onCreateSession={this.onCreateSession}/>
                    ) : (
                        <Grid>
                            <Grid.Column
                                widthXS={Columns.Nine}
                                widthSM={Columns.Nine}
                                widthMD={Columns.Nine}
                                widthLG={Columns.Nine}
                                >
                                <Grid.Row>
                                    <Grid.Column 
                                        widthXS={Columns.Three}
                                        widthSM={Columns.Three}
                                        widthMD={Columns.Three}
                                        widthLG={Columns.Three}
                                    >
                                        <Panel>
                                        <Panel.Header>
                                            Set Job Type and Parameters
                                        </Panel.Header>
                                            <Panel.Body>
                                                <Dropdown
                                                    button={(active, onClick) => (
                                                    <Dropdown.Button
                                                        active={active}
                                                        onClick={onClick}
                                                        color={ComponentColor.Default}
                                                        testID="dropdown-button--gen-token"
                                                    >
                                                        {this.state.job}
                                                    </Dropdown.Button>)}
                                                    menu={onCollapse => (
                                                    <Dropdown.Menu onCollapse={onCollapse}>
                                                        {this.jobDescriptions}
                                                    </Dropdown.Menu>
                                                )}/>
                                                <br/>
                                                <TabGroup
                                                    tabinfo={{info: this.state.mlinfo, selectedClass: "AD"}}/>
                                            </Panel.Body>
                                        </Panel>
                                    </Grid.Column>
                                    <Grid.Column
                                        widthXS={Columns.Four}
                                        widthSM={Columns.Four}
                                        widthMD={Columns.Four}
                                        widthLG={Columns.Four}
                                    >
                                        <Panel>
                                        <Panel.Header>
                                            Set Time Range
                                        </Panel.Header>
                                            <Panel.Body>
                                                {this.optionsComponents}
                                                <p style={{ fontSize: '12px', fontWeight: 600 }}>{"From: " + this.state.from}</p>
                                                <p style={{ fontSize: '12px', fontWeight: 600 }}>{"To: " + this.state.to}</p>
                                            </Panel.Body>
                                        </Panel>
                                    </Grid.Column>
                                    <Grid.Column
                                        widthXS={Columns.Three}
                                        widthSM={Columns.Three}
                                        widthMD={Columns.Three}
                                        widthLG={Columns.Three}
                                    >
                                        <Panel>
                                        <Panel.Header>
                                            Actions
                                        </Panel.Header>
                                            <Panel.Body>
                                                <Button
                                                    color={ComponentColor.Secondary}
                                                    text="Start Session"
                                                    icon={IconFont.Wand}
                                                    type={ButtonType.Button}
                                                    onClick={this.onStartSession}/>
                                                <br/>
                                                <Button
                                                    color={ComponentColor.Danger}
                                                    text="Stop Session"
                                                    icon={IconFont.Stop}
                                                    type={ButtonType.Button}
                                                    onClick={() => console.log("click action")}
                                                    status={ComponentStatus.Disabled}/>
                                            </Panel.Body>
                                        </Panel>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column
                                        widthXS={Columns.Twelve}
                                        widthSM={Columns.Twelve}
                                        widthMD={Columns.Twelve}
                                        widthLG={Columns.Twelve}>
                                            <Panel>
                                            <DapperScrollbars
                                            autoHide={true}
                                            autoSizeHeight={true} style={{ maxHeight: '480px' }}
                                            className="data-loading--scroll-content"
                                            >
                                                <Panel.Body style={{height: '480px'}}>
                                                    <ModelSection
                                                        models={this.state.models}
                                                        sessionID={this.state.sessionID}
                                                        setCellCountAndIDs={this.setCellCountAndIDs}/>
                                                </Panel.Body>
                                            </DapperScrollbars>
                                                
                                            </Panel>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid.Column>
                            <Grid.Column
                                    widthXS={Columns.Three}
                                    widthSM={Columns.Three}
                                    widthMD={Columns.Three}
                                    widthLG={Columns.Three}
                                    style={{height: '605px'}}
                                >
                                    <Panel>
                                    <Panel.Header>
                                        Set Database and Fields
                                    </Panel.Header>
                                    <DapperScrollbars
                                            autoHide={true}
                                            autoSizeHeight={true} style={{ maxHeight: '605px' }}
                                            className="data-loading--scroll-content"
                                            >
                                        <Panel.Body style={{height: '605px'}}>
                                            <Grid>
                                                <GetResources resources={[ResourceType.Buckets]}>
                                                    <MLBucketSelector
                                                        setSelectedDatabase={this.setSelectedBucket}
                                                        dropdownData={this.state.dropdownData}
                                                        databases={this.state.databases}
                                                        selectedDatabase={this.state.selectedBucket}
                                                        onDropdownTreeChange={this.onDropdownTreeChange}
                                                        />
                                                </GetResources>
                                            </Grid>
                                        </Panel.Body>
                                    </DapperScrollbars>
                                    </Panel>
                            </Grid.Column>
                        </Grid>
                    )}
                    </Page.Contents>
                </Page>
            )
        } else {
            return null
        }
    }
}

// export default MLAdvancedContainer
