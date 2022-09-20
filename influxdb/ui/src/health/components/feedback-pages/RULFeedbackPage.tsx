import React, {PureComponent} from 'react'

import {
    Page, Grid, Columns, Panel, TechnoSpinner, WaitingText,
    Overlay, ComponentColor, ComponentSize, IconFont, Icon, InfluxColors,
    Button, ButtonType, SelectDropdown, Notification, Gradients, SquareButton,
    BorderType, Table, SlideToggle, InputLabel, Label, DapperScrollbars
} from '@influxdata/clockface'

import uuid from 'uuid'
import {TimeRange, CancelBox, AutoRefreshStatus, AppState} from 'src/types'
import {Row} from 'src/eventViewer/types'
import { Link } from "react-router-dom";
import { FACTORY_NAME } from 'src/config';

// Flux query
import {runQuery, RunQueryResult} from 'src/shared/apis/query'
import {fromFlux} from '@influxdata/giraffe'
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import AutoMLService from 'src/shared/services/AutoMLService'
import DTService from 'src/shared/services/DTService';

// material-ui components
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import HomeIcon from '@material-ui/icons/Home';
import Typography from '@material-ui/core/Typography';
import AnomalyBrushGraph from 'src/health/components/AnomalyBrushGraph'
import FailureBrushGraph from 'src/health/components/feedback-pages/FailureBrushGraph'
import AnomalyGraphTimeRangeDropdown from 'src/health/components/AnomalyGraphTimeRangeDropdown';


interface Props {
    match: any
}

interface State {
    timeRange: TimeRange
    machineSensorData: object[]
    graphData: object
    originalData: object
    selectedScale: string
    chartID: string
    isFeedbackSelected: boolean
    normalizedType1GraphData: object
    normalizedType2GraphData: object
    dtData: object
    aggregatePeriod: string
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    isDataLoaded: boolean
    activeAnomalyModel: string
    sensorNames: string[]
    selectedModelID: string
    windowStart: number
    windowEnd: number
    models: object[]
    autoRefresh: {  status: AutoRefreshStatus
        interval: number}
}

const aggregatePeriods = ["5s", "10s", "20s", "30s", "60s"]

class RULFeedbackPage extends PureComponent<Props, State>{
    state = {
        timeRange: {
            seconds: 3600,
            lower: "now() - 1h",
            upper: null,
            label: "Past 1h",
            duration: "1h",
            type: "selectable-duration",
            windowPeriod: 10000
        },
        machineSensorData: [],
        graphData: {},
        originalData: {},
        selectedScale: "Original Data",
        chartID: uuid.v4(),
        isFeedbackSelected: false,
        normalizedType1GraphData: {},
        normalizedType2GraphData: {},
        dtData: {},
        aggregatePeriod: "1s",
        notificationVisible: false,
        notificationType: '',
        notificationMessage: '',
        isDataLoaded: false,
        activeAnomalyModel: "",
        sensorNames: [],
        selectedModelID: "",
        windowStart: new Date("2021-05-22T12:36").getTime(),
        windowEnd: new Date("2021-05-29T21:22").getTime(),
        autoRefresh: {status: AutoRefreshStatus.Paused, interval: 0},
        models: [],
        modelsLogsData: []
    }

    private intervalID: number
    async componentDidMount(){
        console.log(this.props)
        this.getDTData()
        this.getMLModels()
        if (this.state.autoRefresh.status === AutoRefreshStatus.Active) {
            this.intervalID = window.setInterval(() => {
              this.getMLModels()
            }, this.state.autoRefresh.interval)
        }      
    }


    getMLModels = async () => {
        let modelID = this.props.match.params.MODELID
        const models = await HealthAssessmentService.getMLModelsWithID({"modelID": modelID})
        console.log("ml models: ", this.props.match.params.MID, models)
        let allModels = [...models] 
        this.setState({models: allModels})
    }

    getMachineAnomalies = async () => {
        const anomalies = await HealthAssessmentService.getMachineAnomalies(this.props.match.params.MID)
        let models = Object.keys(anomalies)
        if(models.length){
            this.setState({activeAnomalyModel: models[0], 
                selectedModelID: models[0]},()=>console.log("machines ", this.state))
        }
        
    }

    getDTData = async () => {
        let dt = await DTService.getAllDT();
        let assets = {"productionLines": {}, "machines": {}, "components": {}, "sensors": {}, "fields": {}}
        dt = dt[0] ? dt[0] : {}
        let pls = dt["productionLines"] ? dt["productionLines"] : []
        console.log(dt, pls)
        for(let pl of pls){
            console.log(pl)
            assets["productionLines"][pl["@id"]] = {"name": pl["name"], "object": pl}
            let machines = pl["machines"]
            for(let machine of machines){
                assets["machines"][machine["@id"]] = {"name": pl["name"] + "." + machine["name"], "object": machine}
                let contents = machine["contents"]
                for(let content of contents){
                    if(content["@type"] === "Component"){
                        assets["components"][content["@id"]] = {"name": pl["name"] + "." + machine["name"] + "." + content["name"], "object": content}
                        let sensors = content["sensors"]
                        for(let sensor of sensors){
                            assets["sensors"][sensor["@id"]] = {"name": pl["name"] + "." + machine["name"] + "." + content["name"] + "." + sensor["name"], "object": sensor}
                            let fields = sensor["fields"]
                            for(let field of fields){
                            field["database"] = dt["bucket"]
                            assets["fields"][field["@id"]] = {"name": pl["name"] + "." + machine["name"] + "." + content["name"] + "." + sensor["name"] + "." + field["name"], "object": field}
                            }
                        }
                    }
                }
            }        
        }
        this.setState({dtData: assets}, ()=>{
            console.log("dt data", assets)
            this.getMachineData()
            this.getMachineAnomalies()
        })
    }

    isComponent = () => {
        if(this.props["match"].params["CID"]){
            return true
        }
        return false
    }

    changeWindowPoints = (windowStart, windowEnd) => {
        this.setState({windowStart: windowStart, windowEnd: windowEnd})
    }

    public handleChangeNotification = (type, message) => {
        this.setState({
            notificationVisible: true,
            notificationType: type,
            notificationMessage: message,
        })
    }

    /*
      Convert a Flux CSV response into a list of objects.
    */
      processResponse = ({
        promise: queryPromise,
        cancel,
        }: CancelBox<RunQueryResult>, start?, stop?): CancelBox<Row[]> => {
        const promise = queryPromise.then<Row[]>(resp => {
            if (resp.type !== 'SUCCESS') {
                return Promise.reject(new Error(resp.message))
            }

            const {table} = fromFlux(resp.csv)
            console.log("csv data, ", table.length)
            const rows: Row[] = []

            for (let i = 0; i < table.length; i++) {
                const row = {}

                for (const key of table.columnKeys) {
                    row[key] = table.getColumn(key)[i]
                }

                rows.push(row)
            }
            // console.log("rows: ", rows)
            let graphData = {}
            for(let row of rows){
                if(`${row["_measurement"]}_${row["_field"]}` in graphData){
                    graphData[`${row["_measurement"]}_${row["_field"]}`]["data"].push([row["_time"], row["_value"].toFixed(2)])
                }
                else{
                    graphData[`${row["_measurement"]}_${row["_field"]}`] = {
                        name: `${row["_measurement"]}_${row["_field"]}`,
                        data: [[row["_time"], row["_value"].toFixed(2)]]
                    }
                }
            }
            let gdata = Object.values(graphData)
            let sensorNames = Object.keys(graphData)
            let minmaxType1 = {} // 0-1 normalization
            let minmaxType2 = {} // -1-1 normalization
            for(let sensor of sensorNames){
                let data =  graphData[sensor].data
                let dataVals = graphData[sensor].data.map(li=>li[1])
                let maxData = Math.max(...dataVals)
                let minData = Math.min(...dataVals)
                let normalizedDataType1 = []
                let normalizedDataType2 = []
                for(let d of data){
                    //console.log(minData, maxData, d)
                    if(minData === maxData){
                        let res = 0
                        normalizedDataType1.push([d[0], res.toFixed(2)])
                        normalizedDataType2.push([d[0], res.toFixed(2)])
                    }
                    else{
                        let normalizedValType1 = (d[1]-minData)/(maxData-minData)
                        let normalizedValType2 = (-1) + ((d[1] - minData)*2)/(maxData - minData)
                        normalizedDataType1.push([d[0], normalizedValType1.toFixed(2)])
                        normalizedDataType2.push([d[0], normalizedValType2.toFixed(2)])
                    }
                }
                minmaxType1[sensor] = {name: sensor, data: normalizedDataType1}
                minmaxType2[sensor] = {name: sensor, data: normalizedDataType2}
            }
            console.log("normalized 1: ", minmaxType1)
            console.log("normalized 2: ", minmaxType2)
            if(start){
                let windowStart = new Date(new Date(start).getTime() + 27 * 60 * 1000).getTime()
                let windowEnd = new Date(new Date(stop).getTime() - 27 * 60 * 1000).getTime()
                console.log("timerange", windowStart, windowEnd)
                this.setState({machineSensorData: gdata, chartID: uuid.v4(), sensorNames: sensorNames, graphData: graphData,
                    originalData: graphData, normalizedType1GraphData: minmaxType1, normalizedType2GraphData: minmaxType2, selectedScale: "Original Data",
                    windowStart: windowStart, windowEnd: windowEnd, isFeedbackSelected: true, isDataLoaded: true})
            }
            else{
                this.setState({machineSensorData: gdata, chartID: uuid.v4(), sensorNames: sensorNames, graphData: graphData,
                    originalData: graphData, normalizedType1GraphData: minmaxType1, normalizedType2GraphData: minmaxType2, selectedScale: "Original Data",
                    isFeedbackSelected: false, isDataLoaded: true})
            }
            
            //console.log(gdata)
            return gdata
            // return rows
        })

        return {
            promise,
            cancel,
        }
    }

    getMachineData = () => {
        let timeRange = this.state.timeRange
        let start = ""
        let stop = ""
        let machineID = this.props.match.params.MID
        let assets = this.state.dtData["machines"]
        console.log(machineID, assets)
        let machineMeasurements = assets[machineID] ? assets[machineID]["object"]["measurements"] : [] 
        let measurementStringArray = []
        console.log("568 ",machineMeasurements, assets, this.state.dtData)
        for(let m of machineMeasurements){
            measurementStringArray.push(`r["_measurement"] == "${m}"`)
        }
        let measurementString = measurementStringArray.join(" or ")
        if(timeRange.type === "selectable-duration"){
            stop = new Date().toISOString()
            start = new Date(new Date().getTime() - timeRange.seconds * 1000).toISOString()
        }
        else if(timeRange.type === "custom"){
            start = timeRange.lower
            stop = timeRange.upper
        }
        let factory = this.props.match.params.FID

        let query = `from(bucket: "${factory}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => ${measurementString})
        |> aggregateWindow(every: ${this.state.aggregatePeriod}, fn: last, createEmpty: false)
        |> yield(name: "last")`
        console.log(query, this.props.match.params.orgID)
        let results = this.processResponse(runQuery(this.props.match.params.orgID, query))
        console.log("results", results)

        /* 
        //same result with flux service
        const csvResult = await FluxService.fluxQuery(this.props.orgID, query);
        const jsonResult = await csvToJSON(csvResult);
        console.log("flex service results: ", jsonResult) 
        */
    }

    setTimeRange = (timeRange) => {
        let start = timeRange.lower
        let stop = timeRange.upper
        let machineID = this.props.match.params.MID
        let assets = this.state.dtData["machines"]
        let machineMeasurements = assets[machineID] ? assets[machineID]["object"]["measurements"] : []
        let measurementStringArray = []
        console.log(machineMeasurements, assets, this.state.dtData)
        for(let m of machineMeasurements){
            measurementStringArray.push(`r["_measurement"] == "${m}"`)
        }
        let measurementString = measurementStringArray.join(" or ")
        this.setState({timeRange: {
                lower: start,
                upper: stop,
                type: "custom",
        }})
        let query = `from(bucket: "${FACTORY_NAME}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => ${measurementString})
        |> aggregateWindow(every: ${this.state.aggregatePeriod}, fn: last, createEmpty: false)
        |> yield(name: "last")`
        let results = this.processResponse(runQuery(this.props.match.params.orgID, query), start, stop)
    }

    scaleData = (e) => {
        let selectedScale = e
        switch(selectedScale) {
            case "Original Data":
                this.setState({machineSensorData: Object.values(this.state.originalData), 
                    graphData: this.state.originalData, chartID: uuid.v4(), selectedScale: e, isFeedbackSelected: false})
                break
            case "Scale to [0,1]":
                this.setState({machineSensorData: Object.values(this.state.normalizedType1GraphData), 
                    graphData: this.state.normalizedType1GraphData, chartID: uuid.v4(), selectedScale: e, isFeedbackSelected: false})
                break
            case "Scale to [-1,1]":
                this.setState({machineSensorData: Object.values(this.state.normalizedType2GraphData), 
                    graphData: this.state.normalizedType2GraphData, chartID: uuid.v4(), selectedScale: e, isFeedbackSelected: false})
                break
            default:
                // default = original data
                this.setState({machineSensorData: Object.values(this.state.originalData), 
                graphData: this.state.originalData, chartID: uuid.v4(), selectedScale: e, isFeedbackSelected: false})
        }
    }

    handleChooseTimeRange = (timeRange: TimeRange) => {
        this.setState({ timeRange: timeRange })
        console.log(timeRange)
    }

    render(): React.ReactNode {
        return(
            <Page
                titleTag="Remaining Useful Lifetime Model Feedback"
                className="alert-history-page"
            >
                <Page.Header fullWidth={true}>
                    <Page.Title
                        title="Remaining Useful Lifetime Model Feedback"
                    />
                    <div className="tabbed-page--header-right">
                        <Button
                            color={ComponentColor.Secondary}
                            titleText=""
                            text="EvalML Report"
                            type={ButtonType.Button}
                            icon={IconFont.TextBlock}
                            onClick={() => this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/health/classification-report/${this.props.match.params["MODELID"]}`)}
                        />
                    </div>
                </Page.Header>
                <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                    <Link color="inherit" to="/">
                        <HomeIcon style={{ marginTop: '4px' }} />
                    </Link>
                    <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/allFactories`}>
                        Factories
                    </Link>
                    <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/production-line/${this.props["match"].params.FID}/${this.props["match"].params.PLID}`}>
                        Production Lines
                    </Link>
                    <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/machines/${this.props["match"].params.FID}/${this.props["match"].params.PLID}`}>
                        Machines
                    </Link>
                    {this.isComponent() && (
                        <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/components/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${this.props["match"].params.MID}`}>
                            Components
                        </Link>
                    )}
                    {this.isComponent() ? (
                        <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/health/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${this.props["match"].params.MID}/${this.props["match"].params.CID}`}>
                            {this.props["match"].params.CID} Health Assessment
                        </Link>
                    ) : (
                        <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/health/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${this.props["match"].params.MID}`}>
                            {this.props["match"].params.MID} Health Assessment
                        </Link>
                    )}   
                    <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>{this.props["match"].params.MID} RUL Model Feedback</Typography>                 
                </Breadcrumbs>
                <Page.ControlBar fullWidth={true}>
                    <Page.ControlBarLeft>
                        <SelectDropdown
                            style={{width: "150px"}}
                            options={["Original Data", "Scale to [0,1]", "Scale to [-1,1]"]}
                            selectedOption={this.state.selectedScale}
                            onSelect={this.scaleData}
                        />
                    </Page.ControlBarLeft>
                    <Page.ControlBarRight>
                        <Label
                            size={ComponentSize.Small}
                            name={"Time Range"}
                            description={""}
                            color={InfluxColors.Pool}
                            id={"icon-label"} 
                        />
                        <AnomalyGraphTimeRangeDropdown
                            onSetTimeRange={this.handleChooseTimeRange}
                            timeRange={this.state.timeRange}
                        />
                        <Label
                            size={ComponentSize.Small}
                            name={"Aggregation Window Period"}
                            description={""}
                            color={InfluxColors.Pool}
                            id={"icon-label"}
                            style={{marginLeft: "20px"}} 
                        />
                        <SelectDropdown
                            style={{width: "70px"}}
                            options={aggregatePeriods}
                            selectedOption={this.state.aggregatePeriod}
                            onSelect={(e) => {this.setState({aggregatePeriod: e})}}
                        />
                        <Button
                            color={ComponentColor.Secondary}
                            titleText="Query Database"
                            text="Submit"
                            type={ButtonType.Button}
                            onClick={() => this.getMachineData()}
                        />
                    </Page.ControlBarRight>
                </Page.ControlBar>
                <Page.Contents
                    fullWidth={true}
                    scrollable={true}
                    className="alert-history-page--contents"
                >
                    <Grid>
                        <Grid.Row>
                            <Notification
                                key={"id"}
                                id={"id"}
                                icon={
                                    this.state.notificationType === 'success'
                                        ? IconFont.Checkmark
                                        : IconFont.Alerts
                                }
                                duration={5000}
                                size={ComponentSize.Small}
                                visible={this.state.notificationVisible}
                                gradient={
                                    this.state.notificationType === 'success'
                                        ? Gradients.HotelBreakfast
                                        : Gradients.DangerDark
                                }
                                onTimeout={() => this.setState({ notificationVisible: false })}
                                onDismiss={() => this.setState({ notificationVisible: false })}
                            >
                                <span className="notification--message">{this.state.notificationMessage}</span>
                            </Notification>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Twelve} style={{height: "700px"}}>
                                <Panel style={{border: 'solid 2px #999dab', borderRadius: '4px', height: "inherit"}}>
                                    <Panel.Header size={ComponentSize.Medium} style={{padding: "10px"}}>
                                        <h5 className="preview-data-margins">Sensor Data Chart</h5>
                                    </Panel.Header>
                                    <Panel.Body size={ComponentSize.Small}>
                                        <div>
                                            {this.state.isDataLoaded ? <FailureBrushGraph  /* this.state.machineSensorData.length */
                                                chartID={this.state.chartID}
                                                name={this.state.activeAnomalyModel}
                                                sensorNames={this.state.sensorNames}
                                                modelID={this.state.selectedModelID}
                                                model={this.state.models.length ? this.state.models[0] : null}
                                                /* timeRange={this.state.timeRange}
                                                aggregatePeriod={this.state.aggregatePeriod} */
                                                goToAnomaly={this.setTimeRange}
                                                orgID={this.props.match.params.orgID}
                                                machineID={this.props.match.params.MID}
                                                data={this.state.machineSensorData} //{this.generateData(this.state.activeAnomalyModel)} //this.state.machineSensorData
                                                graphData={this.state.graphData}
                                                windowStart={this.state.windowStart} 
                                                windowEnd={this.state.windowEnd}
                                                changeWindowPoints={this.changeWindowPoints}
                                                isFeedbackSelected={this.state.isFeedbackSelected}
                                                user={this.props.me}
                                            /> : 
                                            <div style={{textAlign: "-webkit-center", marginTop: "60px"}}>
                                                <TechnoSpinner style={{ width: "75px", height: "75px"}} />
                                                <WaitingText text="Graph is loading" />
                                            </div>}
                                            {/* Chart of {this.state.activeAnomalyModel} */}
                                        </div>
                                    </Panel.Body>
                                </Panel>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Page.Contents>

            </Page>
        )
    }
}

export default RULFeedbackPage