// Libraries
import { Appearance, BorderType, Button, ButtonShape, ButtonType, Columns, ComponentColor, ComponentSize, ComponentStatus, DapperScrollbars, DateRangePicker, Dropdown, FlexBox, FlexDirection, Grid, IconFont, Input, InputLabel, InputType, Page, Panel, Popover, PopoverInteraction, PopoverPosition, SelectGroup, SlideToggle, Table } from '@influxdata/clockface';
import React, { createRef, PureComponent } from 'react'
import GetResources from 'src/resources/components/GetResources';
import { runQuery } from 'src/shared/apis/query';
import { extractBoxedCol } from 'src/timeMachine/apis/queryBuilder';
import { ResourceType } from 'src/types';
import TaskSection from '../components/TaskSection'

//Components
import * as api from '../components/api'
import MLBucketSelector from '../components/MLBucketSelector';


interface Props {}

interface State {
    models: any[],
    measurements: any[],
    dropdownData: any[],
    databases: any[],
    partitionSpecs: any[],
    measurementToSensors: Object,
    selectedPartitionSpecs: Object,
    selectedModelObject: any,
    from: string,
    to: string,
    timeRange: any,
    selectedModel: string,
    selectedFramework: string,
    selectedDatabase: string,
    selectedScheduler: string,
    selectedPartition: string,
    nodeCount: number,
    cpuCount: number,
    taskPerNode: number,
    cpusPerTask: number,
    timeOut: String,
    type: String,
    creatingTask: boolean
    trainTimeRangeOpen: boolean
}

class RetrainControlPage extends PureComponent<Props, State> {
    // setSelectedBucket: (selectedDatabase: string) => void;
    // onDropdownTreeChange: (_: any, selectedNodes: any) => void;
    private trainDateTimeRangeRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props)

        this.state = {
            creatingTask: true,
            trainTimeRangeOpen: false,
            models: [],
            measurements: [],
            dropdownData: [],
            databases: [],
            partitionSpecs: [],
            measurementToSensors: {},
            selectedPartitionSpecs: {},
            from: "",
            to: "",
            timeRange: {},
            selectedModelObject: {modelName: ""},
            selectedModel: "",
            selectedFramework: "",
            selectedDatabase: "",
            selectedScheduler: "",
            selectedPartition: "",
            nodeCount: 0,
            cpuCount: 0,
            taskPerNode: 0,
            cpusPerTask: 0,
            timeOut: "",
            type: ""
        }
    }

    setSelectedBucket = (selectedDatabase) => {
        this.setState({selectedDatabase: selectedDatabase})
        this.constructDropdownData(selectedDatabase)
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

    componentDidMount() {
        console.log(this.props);

        api.getPartitionSpecs().then(partitionSpecs => {
            console.log(partitionSpecs)
            this.setState({partitionSpecs: partitionSpecs})
        })
        // this.getModels();
    }

    handleRadioClick (e) {
        console.log(this.state.selectedModelObject)
        let pkg = {
            retrainMethod: e,
            modelID: this.state.selectedModelObject.modelID
        }

        // api.updateRetrainMethod(pkg).then(() => {this.getModels()})

        // this.getModels()
    }

    getModels() {
        api.getBasicModels().then(models => {
            this.setState({ models: models })
        })    
    }

    onModelChange = (e) => {
        console.log(e)
        let modelObject = this.state.models.find(obj => obj.modelID === e)
        this.setState({ selectedModel: modelObject.modelName, selectedModelObject: modelObject})
    }

    onFrameworkChange = (e) => {
        this.setState({ selectedFramework: e})
    }

    onSchedulerChange = (e) => {
        this.setState({ selectedScheduler: e})
    }

    onPartitionChange = (e) => {
        this.setState({ selectedPartition: e})
        let currentSpec = this.state.partitionSpecs.find(x => x["Partition Name"] === e)
        this.setState({selectedPartitionSpecs: currentSpec})
    }

    isCreateReady = () => {
        if(this.state.selectedFramework !== "" && this.state.selectedScheduler !== "" &&
           this.state.selectedPartition !== "" && this.state.nodeCount != 0 &&
           this.state.cpuCount != 0 && this.state.taskPerNode != 0 && this.state.cpusPerTask != 0 &&
           this.state.selectedDatabase !== "" && Object.keys(this.state.measurementToSensors).length != 0) {
               return true
           }
        
        return false
    }

    private get frameworkItems(): JSX.Element[] {
        return [
                <Dropdown.Item
                    testID="dropdown-item-tensorflow"
                    id="tensorflow"
                    key="tensorflow"
                    value="Tensorflow"
                    onClick={this.onFrameworkChange}>
                        Tensorflow
                </Dropdown.Item>,
                <Dropdown.Item
                    testID="dropdown-item-pytorch"
                    id="pytorch"
                    key="pytorch"
                    value="PyTORCH"
                    onClick={this.onFrameworkChange}>
                        PyTORCH
                </Dropdown.Item>
            ]
    }

    private get schedulerItems(): JSX.Element[] {
        return [
                <Dropdown.Item
                    testID="dropdown-item-slurm"
                    id="slurm"
                    key="slurm"
                    value="SLURM"
                    onClick={this.onSchedulerChange}>
                        SLURM
                </Dropdown.Item>,
                <Dropdown.Item
                    testID="dropdown-item-pbs"
                    id="pbs"
                    key="pbs"
                    value="PBS"
                    onClick={this.onSchedulerChange}>
                        PBS
                </Dropdown.Item>
            ]
    }

    private get partitionItems(): JSX.Element[] {
        return this.state.partitionSpecs.map(spec => {
            return <Dropdown.Item
                    id={spec["Partition Name"]}
                    key={spec["Partition Name"]}
                    value={spec["Partition Name"]}
                    onClick={this.onPartitionChange}>
                {spec["Partition Name"]}
            </Dropdown.Item>
        })
    }

    private get modelItems(): JSX.Element[] {
        return this.state.models.map((model) => {
            return <Dropdown.Item
                    testID="dropdown-item generate-token--read-write"
                    id={model.modelID}
                    key={model.modelID}
                    value={model.modelID}
                    onClick={this.onModelChange}>
                        {model.modelName}
                    </Dropdown.Item>
        })
        // return [
        //     <Dropdown.Item
        //         testID="dropdown-item generate-token--read-write"
        //         id={"option1"}
        //         key={"option1"}
        //         value={"Perform anomaly detection"}
        //         onClick={this.onTaskChange}
        //     >
        //         Perform anomaly detection
        //       </Dropdown.Item>,
        //     <Dropdown.Item
        //         testID="dropdown-item generate-token--all-access"
        //         id={"option2"}
        //         key={"option2"}
        //         value={"Learn the remaining useful lifetime"}
        //         onClick={this.onTaskChange}
        //     >
        //         Learn the remaining useful lifetime
        //       </Dropdown.Item>,
        //     <Dropdown.Item
        //         testID="dropdown-item generate-token--all-access"
        //         id={"option3"}
        //         key={"option3"}
        //         value={"Learn the probability of failure"}
        //         onClick={this.onTaskChange}
        //     >
        //         Learn the probability of failure
        //     </Dropdown.Item>,
        // ]
    }

    onSetTimeRange = (e: any) => {
        // let from = e.lower.replace("T", " ")
        // from = from.replace("Z", "")
        // let to = e.upper.replace("T", " ")
        // to = to.replace("Z", "")

        let timeRange = {
            lower: e.lower,
            upper: e.upper
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

    onCreateTask = () => {
        let task = {
            id: Date.now().toString(),
            type: "train",
            framework: this.state.selectedFramework,
            database: this.state.selectedDatabase,
            features: this.state.measurementToSensors,
            optional: this.state.timeRange,
            job_specs: {
                partition: this.state.selectedPartition,
                nodes: this.state.nodeCount.toString(),
                cpus: this.state.cpuCount.toString(),
                ntasks_per_node: this.state.taskPerNode.toString(),
                cpus_per_task: this.state.cpusPerTask.toString()
            }
        }

        // console.log(task)

        api.createTask(task)
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

    public render(): JSX.Element {
        console.log(this.state.selectedModelObject)
        // let nodeCountController = 0

        return <Page>
            <Page.Header fullWidth={true}>
                <Page.Title title={"Retrain Control Panel"} />
            </Page.Header>

            <Page.Contents fullWidth={true} scrollable={true}>
                <Grid>
                    <Grid.Row>
                        <Grid.Column
                            widthXS={Columns.Four}
                            widthSM={Columns.Four}
                            widthMD={Columns.Four}
                            widthLG={Columns.Four}
                            style={{ marginTop: '20px' }}
                        >
                            <Panel>
                                <Panel.Header size={ComponentSize.ExtraSmall}>
                                    <p className="preview-data-margins">Training Options</p>
                                    <FlexBox
                                        key="tog-flex"
                                        direction={FlexDirection.Row}
                                        margin={ComponentSize.Small}
                                        >
                                        <SlideToggle
                                            active={this.state.creatingTask}
                                            size={ComponentSize.ExtraSmall}
                                            onChange={() => this.setState({ creatingTask: !this.state.creatingTask })}
                                            testID="rule-card--slide-toggle"
                                        />
                                        <InputLabel>Task Creation</InputLabel>

                                        </FlexBox><br />
                                    {this.state.creatingTask ? (
                                        <Button
                                            text="Create"
                                            type={ButtonType.Submit}
                                            status={this.isCreateReady() ? (ComponentStatus.Default) : (ComponentStatus.Disabled)}
                                            onClick={this.onCreateTask}
                                            icon={IconFont.Checkmark}
                                            color={ComponentColor.Secondary}
                                        />):(null)}
                                </Panel.Header>
                                {this.state.creatingTask ? (
                                    <Panel.Body size={ComponentSize.ExtraSmall}>
                                    <Table
                                        borders={BorderType.Vertical}
                                        fontSize={ComponentSize.ExtraSmall}
                                        cellPadding={ComponentSize.ExtraSmall}
                                    >
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell>Framework</Table.HeaderCell>
                                                <Table.HeaderCell>Scheduler</Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell>
                                                <Dropdown
                                                    testID="dropdown--gen-token"
                                                    style={{width: '160px'}}
                                                    button={(active, onClick) => (
                                                        <Dropdown.Button
                                                            active={active}
                                                            onClick={onClick}
                                                            color={ComponentColor.Secondary}
                                                            testID="dropdown-button--gen-token">
                                                                {this.state.selectedFramework}
                                                            </Dropdown.Button>
                                                    )}
                                                    menu={onCollapse => (
                                                        <Dropdown.Menu onCollapse={onCollapse}>
                                                            {this.frameworkItems}
                                                        </Dropdown.Menu>
                                                    )}/>
                                                </Table.Cell>
                                                <Table.Cell>
                                                <Dropdown
                                                    testID="dropdown--gen-token"
                                                    style={{width: '160px'}}
                                                    button={(active, onClick) => (
                                                        <Dropdown.Button
                                                            active={active}
                                                            onClick={onClick}
                                                            color={ComponentColor.Secondary}
                                                            testID="dropdown-button--gen-token">
                                                                {this.state.selectedScheduler}
                                                            </Dropdown.Button>
                                                    )}
                                                    menu={onCollapse => (
                                                        <Dropdown.Menu onCollapse={onCollapse}>
                                                            {this.schedulerItems}
                                                        </Dropdown.Menu>
                                                    )}/>
                                                </Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell>Partition</Table.HeaderCell>
                                                <Table.HeaderCell>Node Count</Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell>
                                                <Dropdown
                                                    testID="dropdown--gen-token"
                                                    style={{width: '160px'}}
                                                    button={(active, onClick) => (
                                                        <Dropdown.Button
                                                            active={active}
                                                            onClick={onClick}
                                                            color={ComponentColor.Secondary}
                                                            testID="dropdown-button--gen-token">
                                                                {this.state.selectedPartition}
                                                            </Dropdown.Button>
                                                    )}
                                                    menu={onCollapse => (
                                                        <Dropdown.Menu onCollapse={onCollapse}>
                                                            {this.partitionItems}
                                                        </Dropdown.Menu>
                                                    )}/>
                                                </Table.Cell>
                                                <Table.Cell>
                                                <Input
                                                    placeholder="placeholder"
                                                    name="nodecount"
                                                    autoFocus={true}
                                                    type={InputType.Number}
                                                    value={this.state.nodeCount}
                                                    onChange={(e) => this.setState({nodeCount: Number(e.target.value)})}
                                                    testID="bucket-form-nodecount"
                                                />
                                                </Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell>CPU Count</Table.HeaderCell>
                                                <Table.HeaderCell>Task/Node</Table.HeaderCell>
                                                <Table.HeaderCell>CPU/Task</Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell>
                                                <Input
                                                    placeholder="placeholder"
                                                    name="cpucount"
                                                    autoFocus={true}
                                                    type={InputType.Number}
                                                    value={this.state.cpuCount}
                                                    onChange={(e) => this.setState({cpuCount: Number(e.target.value)})}
                                                    testID="bucket-form-cpucount"
                                                />
                                                </Table.Cell>
                                                <Table.Cell>
                                                <Input
                                                    placeholder="placeholder"
                                                    name="nodetask"
                                                    autoFocus={true}
                                                    type={InputType.Number}
                                                    value={this.state.taskPerNode}
                                                    onChange={(e) => this.setState({taskPerNode: Number(e.target.value)})}
                                                    testID="bucket-form-nodetask"
                                                />
                                                </Table.Cell>
                                                <Table.Cell>
                                                <Input
                                                    placeholder="placeholder"
                                                    name="taskcpu"
                                                    autoFocus={true}
                                                    type={InputType.Number}
                                                    value={this.state.cpusPerTask}
                                                    onChange={(e) => this.setState({cpusPerTask: Number(e.target.value)})}
                                                    testID="bucket-form-taskcpu"
                                                />
                                                </Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>
                                </Panel.Body>
                                ):(<Panel.Body size={ComponentSize.ExtraSmall}>
                                    <Table
                                        borders={BorderType.Vertical}
                                        fontSize={ComponentSize.ExtraSmall}
                                        cellPadding={ComponentSize.ExtraSmall}
                                    >
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell>Models</Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell>
                                                <Dropdown
                                                    testID="dropdown--gen-token"
                                                    style={{width: '160px'}}
                                                    button={(active, onClick) => (
                                                        <Dropdown.Button
                                                            active={active}
                                                            onClick={onClick}
                                                            color={ComponentColor.Primary}
                                                            testID="dropdown-button--gen-token">
                                                                {this.state.selectedModel}
                                                            </Dropdown.Button>
                                                    )}
                                                    menu={onCollapse => (
                                                        <Dropdown.Menu onCollapse={onCollapse}>
                                                            {this.modelItems}
                                                        </Dropdown.Menu>
                                                    )}/>
                                                </Table.Cell>
                                                <Table.Cell>
                                                <SelectGroup
                                                    shape={ButtonShape.StretchToFit}
                                                    className="retention--radio"
                                                    >
                                                    <SelectGroup.Option
                                                        name="bucket-retention"
                                                        id="never"
                                                        testID="retention-never--button"
                                                        active={this.state.selectedModelObject.retrainMethod === "nothing"}
                                                        onClick={this.handleRadioClick.bind(this)}
                                                        value="nothing"
                                                        titleText="Never delete data"
                                                    >
                                                        Do nothing
                                                    </SelectGroup.Option>
                                                    <SelectGroup.Option
                                                        name="bucket-retention"
                                                        id="intervals"
                                                        active={this.state.selectedModelObject.retrainMethod === "retrain"}
                                                        onClick={this.handleRadioClick.bind(this)}
                                                        value="retrain"
                                                        testID="retention-intervals--button"
                                                        titleText="Delete data older than a duration"
                                                    >
                                                        Retrain
                                                    </SelectGroup.Option>
                                                    <SelectGroup.Option
                                                        name="bucket-retention"
                                                        id="intervals"
                                                        active={this.state.selectedModelObject.retrainMethod === "retrain-hpc"}
                                                        onClick={this.handleRadioClick.bind(this)}
                                                        value="retrain-hpc"
                                                        testID="retention-intervals--button"
                                                        titleText="Delete data older than a duration"
                                                    >
                                                        HPC
                                                    </SelectGroup.Option>
                                                </SelectGroup>
                                                </Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>
                                    <br />
                                </Panel.Body>)}
                            </Panel>
                            <br></br>
                            <br></br>
                            {this.state.creatingTask ? (
                                <Panel>
                                    <Panel.Body>
                                        {this.optionsComponents}
                                        <p style={{ fontSize: '12px', fontWeight: 600 }}>{"From: " + this.state.from}</p>
                                        <p style={{ fontSize: '12px', fontWeight: 600 }}>{"To: " + this.state.to}</p>
                                    </Panel.Body>
                                </Panel>

                            ):(null)}
                            <br></br>
                            <br></br>
                            {this.state.creatingTask ? (
                                <Panel>
                                    <Panel.Body>
                                        <Table
                                            borders={BorderType.Vertical}
                                            fontSize={ComponentSize.ExtraSmall}
                                            cellPadding={ComponentSize.ExtraSmall}
                                        >
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell>State</Table.HeaderCell>
                                                <Table.HeaderCell>Total CPUs</Table.HeaderCell>
                                                <Table.HeaderCell>Total Nodes</Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell>
                                                    {this.state.selectedPartitionSpecs["State"]}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {this.state.selectedPartitionSpecs["Total CPUs"]}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {this.state.selectedPartitionSpecs["Total Nodes"]}
                                                </Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell>Minimum Nodes</Table.HeaderCell>
                                                <Table.HeaderCell>Default Timeout</Table.HeaderCell>
                                                <Table.HeaderCell>Maximum Timeout</Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell>
                                                    {this.state.selectedPartitionSpecs["Minimum Nodes"]}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {this.state.selectedPartitionSpecs["Default Timeout"]}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {this.state.selectedPartitionSpecs["Maximum Timeout"]}
                                                </Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                        </Table>
                                    </Panel.Body>
                                </Panel>

                            ):(null)}
                        </Grid.Column>
                        <Grid.Column
                            widthXS={Columns.Three}
                            widthSM={Columns.Three}
                            widthMD={Columns.Three}
                            widthLG={Columns.Three}
                            style={{ marginTop: '20px' }}>
                            <Panel>
                                {this.state.creatingTask ? (
                                    // <Panel.Header>
                                    //     Set Database and Fields
                                    // </Panel.Header>
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
                                                        selectedDatabase={this.state.selectedDatabase}
                                                        onDropdownTreeChange={this.onDropdownTreeChange}
                                                        />
                                                </GetResources>
                                            </Grid>
                                        </Panel.Body>
                                    </DapperScrollbars>
                                ):(
                                <Panel.Body size={ComponentSize.ExtraSmall}>
                                <Table
                                    borders={BorderType.Vertical}
                                    fontSize={ComponentSize.ExtraSmall}
                                    cellPadding={ComponentSize.ExtraSmall}
                                >
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>Models</Table.HeaderCell>
                                            <Table.HeaderCell>Hardware</Table.HeaderCell>
                                            <Table.HeaderCell>Task</Table.HeaderCell>
                                            <Table.HeaderCell>Algorithm</Table.HeaderCell>
                                            <Table.HeaderCell>Status</Table.HeaderCell>

                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        <Table.Row>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.modelName}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.hardware}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.task}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.algorithm}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {this.state.selectedModelObject.status}
                                            </Table.Cell>
                                        </Table.Row></Table.Body></Table>
                                </Panel.Body>
                                )} 
                                
                            </Panel>
                        </Grid.Column>
                        <Grid.Row>
                                <Grid.Column
                                    widthXS={Columns.Three}
                                    widthSM={Columns.Three}
                                    widthMD={Columns.Three}
                                    widthLG={Columns.Three}>
                                        <Panel>
                                        <DapperScrollbars
                                        autoHide={true}
                                        autoSizeHeight={true} style={{ maxHeight: '480px' }}
                                        className="data-loading--scroll-content"
                                        >
                                            <Panel.Body style={{height: '480px'}}>
                                                <TaskSection/>
                                            </Panel.Body>
                                        </DapperScrollbars>
                                                
                                        </Panel>
                                </Grid.Column>
                        </Grid.Row>
                        </Grid.Row></Grid></Page.Contents></Page>
    }

}

export default RetrainControlPage




























// // Libraries
// import { BorderType, Button, ButtonShape, Columns, ComponentColor, ComponentSize, Dropdown, Grid, Page, Panel, SelectGroup, Table } from '@influxdata/clockface';
// import React, { PureComponent } from 'react'

// //Components
// import * as api from '../components/api'


// interface Props {}

// interface State {
//     models: any[],
//     selectedModelObject: any,
//     selectedModel: String,
//     type: String
// }

// class RetrainControlPage extends PureComponent<Props, State> {
//     constructor(props) {
//         super(props)

//         this.state = {
//             models: [],
//             selectedModelObject: {modelName: ""},
//             selectedModel: "",
//             type: ""
//         }
//     }


//     componentDidMount() {
//         console.log(this.props);

//         this.getModels();
//     }

//     handleRadioClick (e) {
//         console.log(this.state.selectedModelObject)
//         let pkg = {
//             retrainMethod: e,
//             modelID: this.state.selectedModelObject.modelID
//         }

//         api.updateRetrainMethod(pkg).then(() => {this.getModels()})

//         // this.getModels()
//     }

//     getModels() {
//         api.getBasicModels().then(models => {
//             this.setState({ models: models })
//         })    
//     }

//     onModelChange = (e) => {
//         console.log(e)
//         let modelObject = this.state.models.find(obj => obj.modelID === e)
//         this.setState({ selectedModel: modelObject.modelName, selectedModelObject: modelObject})
//     }

//     private get modelItems(): JSX.Element[] {
//         return this.state.models.map((model) => {
//             return <Dropdown.Item
//                     testID="dropdown-item generate-token--read-write"
//                     id={model.modelID}
//                     key={model.modelID}
//                     value={model.modelID}
//                     onClick={this.onModelChange}>
//                         {model.modelName}
//                     </Dropdown.Item>
//         })
//         // return [
//         //     <Dropdown.Item
//         //         testID="dropdown-item generate-token--read-write"
//         //         id={"option1"}
//         //         key={"option1"}
//         //         value={"Perform anomaly detection"}
//         //         onClick={this.onTaskChange}
//         //     >
//         //         Perform anomaly detection
//         //       </Dropdown.Item>,
//         //     <Dropdown.Item
//         //         testID="dropdown-item generate-token--all-access"
//         //         id={"option2"}
//         //         key={"option2"}
//         //         value={"Learn the remaining useful lifetime"}
//         //         onClick={this.onTaskChange}
//         //     >
//         //         Learn the remaining useful lifetime
//         //       </Dropdown.Item>,
//         //     <Dropdown.Item
//         //         testID="dropdown-item generate-token--all-access"
//         //         id={"option3"}
//         //         key={"option3"}
//         //         value={"Learn the probability of failure"}
//         //         onClick={this.onTaskChange}
//         //     >
//         //         Learn the probability of failure
//         //     </Dropdown.Item>,
//         // ]
//     }

//     public render(): JSX.Element {
//         console.log(this.state.selectedModelObject)
//         return <Page>
//             <Page.Header fullWidth={true}>
//                 <Page.Title title={"Retrain Control Panel"} />
//             </Page.Header>

//             <Page.Contents fullWidth={true} scrollable={true}>
//                 <Grid>
//                     <Grid.Row>
//                         <Grid.Column
//                             widthXS={Columns.Four}
//                             widthSM={Columns.Four}
//                             widthMD={Columns.Four}
//                             widthLG={Columns.Four}
//                             style={{ marginTop: '20px' }}
//                         >
//                             <Panel>
//                                 <Panel.Header size={ComponentSize.ExtraSmall}>
//                                     <p className="preview-data-margins">Training Options</p>
//                                 </Panel.Header>
//                                 <Panel.Body size={ComponentSize.ExtraSmall}>
//                                     <Table
//                                         borders={BorderType.Vertical}
//                                         fontSize={ComponentSize.ExtraSmall}
//                                         cellPadding={ComponentSize.ExtraSmall}
//                                     >
//                                         <Table.Header>
//                                             <Table.Row>
//                                                 <Table.HeaderCell>Models</Table.HeaderCell>
//                                             </Table.Row>
//                                         </Table.Header>
//                                         <Table.Body>
//                                             <Table.Row>
//                                                 <Table.Cell>
//                                                 <Dropdown
//                                                     testID="dropdown--gen-token"
//                                                     style={{width: '160px'}}
//                                                     button={(active, onClick) => (
//                                                         <Dropdown.Button
//                                                             active={active}
//                                                             onClick={onClick}
//                                                             color={ComponentColor.Primary}
//                                                             testID="dropdown-button--gen-token">
//                                                                 {this.state.selectedModel}
//                                                             </Dropdown.Button>
//                                                     )}
//                                                     menu={onCollapse => (
//                                                         <Dropdown.Menu onCollapse={onCollapse}>
//                                                             {this.modelItems}
//                                                         </Dropdown.Menu>
//                                                     )}/>
//                                                 </Table.Cell>
//                                                 <Table.Cell>
//                                                 <SelectGroup
//                                                     shape={ButtonShape.StretchToFit}
//                                                     className="retention--radio"
//                                                     >
//                                                     <SelectGroup.Option
//                                                         name="bucket-retention"
//                                                         id="never"
//                                                         testID="retention-never--button"
//                                                         active={this.state.selectedModelObject.retrainMethod === "nothing"}
//                                                         onClick={this.handleRadioClick.bind(this)}
//                                                         value="nothing"
//                                                         titleText="Never delete data"
//                                                     >
//                                                         Do nothing
//                                                     </SelectGroup.Option>
//                                                     <SelectGroup.Option
//                                                         name="bucket-retention"
//                                                         id="intervals"
//                                                         active={this.state.selectedModelObject.retrainMethod === "retrain"}
//                                                         onClick={this.handleRadioClick.bind(this)}
//                                                         value="retrain"
//                                                         testID="retention-intervals--button"
//                                                         titleText="Delete data older than a duration"
//                                                     >
//                                                         Retrain
//                                                     </SelectGroup.Option>
//                                                     <SelectGroup.Option
//                                                         name="bucket-retention"
//                                                         id="intervals"
//                                                         active={this.state.selectedModelObject.retrainMethod === "retrain-hpc"}
//                                                         onClick={this.handleRadioClick.bind(this)}
//                                                         value="retrain-hpc"
//                                                         testID="retention-intervals--button"
//                                                         titleText="Delete data older than a duration"
//                                                     >
//                                                         HPC
//                                                     </SelectGroup.Option>
//                                                 </SelectGroup>
//                                                 </Table.Cell>
//                                             </Table.Row>
//                                         </Table.Body>
//                                     </Table>
//                                     <br />
//                                 </Panel.Body>
//                             </Panel>
//                         </Grid.Column>
//                         <Grid.Column
//                             widthXS={Columns.Five}
//                             widthSM={Columns.Five}
//                             widthMD={Columns.Five}
//                             widthLG={Columns.Five}
//                             style={{ marginTop: '20px' }}>
//                             <Panel>
//                                 <Panel.Body size={ComponentSize.ExtraSmall}>
//                                 <Table
//                                     borders={BorderType.Vertical}
//                                     fontSize={ComponentSize.ExtraSmall}
//                                     cellPadding={ComponentSize.ExtraSmall}
//                                 >
//                                     <Table.Header>
//                                         <Table.Row>
//                                             <Table.HeaderCell>Models</Table.HeaderCell>
//                                             <Table.HeaderCell>Hardware</Table.HeaderCell>
//                                             <Table.HeaderCell>Task</Table.HeaderCell>
//                                             <Table.HeaderCell>Algorithm</Table.HeaderCell>
//                                             <Table.HeaderCell>Status</Table.HeaderCell>

//                                         </Table.Row>
//                                     </Table.Header>
//                                     <Table.Body>
//                                         <Table.Row>
//                                             <Table.Cell>
//                                                 {this.state.selectedModelObject.modelName}
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 {this.state.selectedModelObject.hardware}
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 {this.state.selectedModelObject.task}
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 {this.state.selectedModelObject.algorithm}
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 {this.state.selectedModelObject.status}
//                                             </Table.Cell>
//                                         </Table.Row></Table.Body></Table>
//                                 </Panel.Body>
//                             </Panel>
//                         </Grid.Column>
//                         </Grid.Row></Grid></Page.Contents></Page>;
//     }

// }

// export default RetrainControlPage