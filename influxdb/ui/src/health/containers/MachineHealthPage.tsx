import React, { PureComponent, createRef } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { Link } from "react-router-dom";
import {
    Page, Grid, Columns, Panel, Notification, ResourceCard, TechnoSpinner, RemoteDataState, InputType, Input,
    ComponentColor, ComponentSize, Gradients, IconFont, Icon, InfluxColors, WaitingText, QuestionMarkTooltip,
    Button, ButtonType, SelectDropdown, Alignment, ButtonBase, ButtonShape, ButtonBaseRef, SparkleSpinner,
    BorderType, Table, DapperScrollbars, SlideToggle, InputLabel, Label, SquareButton, CTAButton, GridColumn,
    AlignItems, InputToggleType, Toggle, FlexBox
} from '@influxdata/clockface'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import {TimeRange, AppState, AutoRefreshStatus} from 'src/types'
import { Context } from 'src/clockface'
import CreateModelOverlay from '../components/CreateModelOverlay'
import GaugeChart from 'src/shared/components/GaugeChart'
import SingleStat from 'src/shared/components/SingleStat';
import AnomalyBrushGraph from 'src/health/components/AnomalyBrushGraph'
import { FACTORY_NAME } from 'src/config';
import AnomalyGraphTimeRangeDropdown from 'src/health/components/AnomalyGraphTimeRangeDropdown';
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import AutoMLService from 'src/shared/services/AutoMLService'
import DTService from 'src/shared/services/DTService';
import ModelLogGraphOverlay from 'src/health/components/ModelLogGraphOverlay';
import TimeMachineRefreshDropdown from 'src/timeMachine/components/RefreshDropdown'
import RefreshLogsDropdown from 'src/health/components/RefreshLogsDropdown'
// Flux query
import {runQuery, RunQueryResult} from 'src/shared/apis/query'
import {fromFlux} from '@influxdata/giraffe'
import FluxService from "src/shared/services/FluxService";
import { csvToJSON } from 'src/shared/helpers/FileHelper';
import {
    CancelBox,
    StatusRow,
    NotificationRow,
    AlertHistoryType,
  } from 'src/types'
  
  import {
    LoadRowsOptions,
    Row,
    SearchExpr,
    SearchTagExpr,
  } from 'src/eventViewer/types'

import {ANOMALY_DETECTION_TASK, RULREG_TASK, RUL_TASK, POF_TASK} from '../constants'
import uuid from 'uuid'
import { GaugeViewProperties, SingleStatViewProperties } from 'src/types/dashboards'
// Components
import Gauge from 'src/shared/components/Gauge'
// Constants
import {
    GAUGE_THEME_LIGHT,
    GAUGE_THEME_DARK,
  } from 'src/shared/constants/gaugeSpecs'
import { defaultViewQuery, defaultSingleStatViewProperties } from 'src/views/helpers'
import RootCauseAnalysisOverlay from '../components/RootCauseAnalysisOverlay';
import { Color } from 'src/types'
import {Plot} from '@influxdata/giraffe'
import {
    DEFAULT_GAUGE_COLORS,
    DEFAULT_THRESHOLDS_LIST_COLORS,
    DEFAULT_THRESHOLDS_TABLE_COLORS,
  } from 'src/shared/constants/thresholds'

// material-ui components
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import HomeIcon from '@material-ui/icons/Home';
import Typography from '@material-ui/core/Typography';

interface Props {
    match: any
}

interface State {
    timeRange: TimeRange
    machine: string
    activeAnomalyModel: string
    models: object[]
    displayedModels: object[]
    createModelOverlay: boolean
    rootCauseAnalysisOverlay: boolean
    gaugeProperties: GaugeViewProperties
    selectedFailure: object
    windowStart: number
    windowEnd: number
    aggregatePeriod: string
    machineSensorData: object[]
    chartID: string
    sensorNames: string[]
    graphData: object
    originalData: object
    normalizedType1GraphData: object
    normalizedType2GraphData: object
    selectedScale: string
    selectedModelID: string
    anomalyModels: string[]
    isAnomalySelected: boolean
    isDataLoaded: boolean
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    showEnabledModels: boolean
    modelLogGraphOverlay: boolean
    selectedModel: object
    modelsLastLogs: object
    pofDays: number
    pofDaysSent: number
    dtData: object
    autoRefresh: {  status: AutoRefreshStatus
                    interval: number}
}

const aggregatePeriods = ["5s", "10s", "20s", "30s", "60s"]

const sampleModels = [
    {task:"rul", modelName: "model1", lastLog: "1", trainingDone: true}, 
    {task:"pof", modelName: "model2", lastLog: "0.35", trainingDone: true}, 
    {task:"pof", modelName: "model3", lastLog: "-", trainingDone: true},
    {task:"rulreg", modelName: "model4", lastLog: "36", trainingDone: true},
    {task:"rul", modelName: "model5", lastLog: "0", trainingDone: true}, 
    {task:"pof", modelName: "model6", lastLog: "0.75", trainingDone: true}, 
    {task:"pof", modelName: "model7", lastLog: "0.666", trainingDone: true},
    {task:"rulreg", modelName: "model8", lastLog: "17", trainingDone: true},
    {task:"rulreg", modelName: "model9", lastLog: "5", trainingDone: true},
]
 
function generateDayWiseTimeSeries(baseval, count, yrange) {
    var i = 0;
    var series = [];
    while (i < count) {
        var x = baseval;
        var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
        series.push([x, y]);
        baseval += 86400000;
        i++;
    }
    return series;
}

class MachineHealthPage extends PureComponent<Props, State>{
    private popoverTrigger = createRef<ButtonBaseRef>()
    constructor(props) {
        super(props);
        this.state = {
            timeRange: {
                seconds: 3600,
                lower: "now() - 1h",
                upper: null,
                label: "Past 1h",
                duration: "1h",
                type: "selectable-duration",
                windowPeriod: 10000
            },
            machine: "Ermetal",
            activeAnomalyModel: "",
            models:[],
            displayedModels:[],
            createModelOverlay: false,
            rootCauseAnalysisOverlay: false,
            gaugeProperties: {
                queries: [],
                colors: [{
                    id: uuid.v4(),
                    type: 'min' ,
                    hex: "#34BB55",
                    name: 'rainforest',
                    value: 0,
                  }, {
                    id: uuid.v4(),
                    type: 'max' ,
                    hex: "#DC4E58",
                    name: 'fire',
                    value: 1,
                  }],
                prefix: '',
                tickPrefix: '',
                suffix: '',
                tickSuffix: '',
                note: 'no log found yet',
                showNoteWhenEmpty: true,
                decimalPlaces: {
                    isEnforced: true,
                    digits: 2,
                },
                type: 'gauge',
                shape: 'chronograf-v2',
                legend: {orientation: "right"}
            } as GaugeViewProperties,
            selectedFailure: null,
            windowStart: new Date("2021-05-22T12:36").getTime(),
            windowEnd: new Date("2021-05-29T21:22").getTime(),
            aggregatePeriod: "1s",
            machineSensorData: [],
            chartID: uuid.v4(),
            sensorNames: [],
            graphData: {},
            originalData: {},
            normalizedType1GraphData: {},
            normalizedType2GraphData: {},
            selectedScale: "Original Data",
            selectedModelID: "",
            anomalyModels: [],
            isAnomalySelected: false,
            isDataLoaded: false,
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            showEnabledModels: false,
            modelLogGraphOverlay: false,
            selectedModel: null,
            modelsLastLogs: {},
            pofDays: 30,
            pofDaysSent: 30,
            dtData: {"productionLines": {}, "machines": {}, "components": {}, "sensors": {}, "fields": {}},
            autoRefresh: {status: AutoRefreshStatus.Paused, interval: 0}
        }
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
      
        // this.setState({})
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

    findProbability = (alpha, beta, days=30) => {
        if(alpha !== 0 || alpha !== "0"){
            alpha = parseFloat(alpha)
            beta = parseFloat(beta)
            let probability = 1 - Math.E ** (-1 * (days/alpha)**beta)
            return probability
        }
        else{
            let probability = 0
            return probability
        }
    }

    getMLModels = async () => {
        if(this.isComponent()){
            let assetName = `${this.props.match.params.MID}.${this.props.match.params.CID}`
            const models = await HealthAssessmentService.getMLModels({"assetName": assetName})
            console.log("ml models: ", this.props.match.params.MID, this.props.match.params.CID, models)
            let allModels = [...models] // [...sampleModels, ...models]
            let enabledModels = []
            let disabledModels = []
            allModels.map(model => {
                if(model["enabled"]){
                    enabledModels.push(model)
                }
                else{
                    disabledModels.push(model)
                }
            })
            let modelsLastLogs = this.state.modelsLastLogs
            for(let model of allModels){ 
                if(model["pipelineID"]){
                    let lastLog = await AutoMLService.getModelLastLog(model["pipelineID"])
                    if(lastLog){
                        modelsLastLogs[model["pipelineID"]] = lastLog
                    }
                }    
                else if(model["modelID"]){
                    let lastLog = await AutoMLService.getModelLastLog(model["modelID"])
                    if(lastLog){
                        modelsLastLogs[model["modelID"]] = lastLog
                    }
                }            
            }
            this.setState({models: [...enabledModels, ...disabledModels], displayedModels: [...enabledModels, ...disabledModels], modelsLastLogs: modelsLastLogs})
        }
        else{
            const models = await HealthAssessmentService.getMLModels({"assetName": this.props.match.params.MID})
            console.log("ml models: ", this.props.match.params.MID, models)
            // this.setState({models: [...sampleModels, ...models]})
            let allModels = [...models] // [...sampleModels, ...models]
            let enabledModels = []
            let disabledModels = []
            allModels.map(model => {
                if(model["enabled"]){
                    enabledModels.push(model)
                }
                else{
                    disabledModels.push(model)
                }
            })
            let modelsLastLogs = this.state.modelsLastLogs
            for(let model of allModels){
                if(model["pipelineID"]){
                    let lastLog = await AutoMLService.getModelLastLog(model["pipelineID"])
                    if(lastLog){
                        modelsLastLogs[model["pipelineID"]] = lastLog
                    }
                }    
                else if(model["modelID"]){
                    let lastLog = await AutoMLService.getModelLastLog(model["modelID"])
                    if(lastLog){
                        modelsLastLogs[model["modelID"]] = lastLog
                    }
                }               
            }
            this.setState({models: [...enabledModels, ...disabledModels], displayedModels: [...enabledModels, ...disabledModels], modelsLastLogs: modelsLastLogs}, ()=>console.log("-->", this.state))
        }
    }

    public handleChangeNotification = (type, message) => {
        this.setState({
            notificationVisible: true,
            notificationType: type,
            notificationMessage: message,
        })
    }

    createTabs = () => {
        [{
            text: 'anomaly1',
            id: 'anomaly1',
        },
        {
            text: 'anomaly2',
            id: 'anomaly2',
        },
        {
            text: 'anomaly3',
            id: 'anomaly3',
        },]
        let models = this.state.anomalyModels
        let tabs = []
        let count = 1
        for(let model of models){
            tabs.push({text: "anomaly model "+ count, id: model})
            count += 1
        }

        return tabs
    }

    testToken = async () => {
        let settings = {
            "assetName": "Press031", "type": "sensor", "database": "Ermetal", "measurement": "Press031", "field": "Ana_hava_debi_act",
            "minDataPoints": "200", "customMetricEquation": "-", "customMetricDirection": "-",
            "timeout": "2h", "numberOfEpochs": "50", "sessionID": Date.now(), "experimentName": "test_from_ui_rul_16_06", "creator": this.props.me.name,
            "tunerType": "hyperband", "optimizer": "val_accuracy", "windowLength": "30", "productID": "-1", "token": window.localStorage.getItem("token")
        }
        const test = await HealthAssessmentService.startRULAutoMLSession(settings)
        console.log("test token res:", test)
    }

    getMachineAnomalies = async () => {
        const anomalies = await HealthAssessmentService.getMachineAnomalies(this.props.match.params.MID)
        let models = Object.keys(anomalies)
        if(models.length){
            this.setState({activeAnomalyModel: models[0], 
                selectedModelID: models[0],
                anomalyModels: models},()=>console.log("machines ", this.state))
        }
        else{
            this.setState({
                anomalyModels: models,
            },()=>console.log("machines ", this.state));
        }
        
    }

    normalizeDataType1 = () => {
        this.setState({machineSensorData: Object.values(this.state.normalizedType1GraphData), 
                graphData: this.state.normalizedType1GraphData, chartID: uuid.v4(), isAnomalySelected: true})
    }

    normalizeDataType2 = () => {
        this.setState({machineSensorData: Object.values(this.state.normalizedType2GraphData), 
                graphData: this.state.normalizedType2GraphData, chartID: uuid.v4(), isAnomalySelected: true})
    }

    getOriginalData = () => {
        this.setState({machineSensorData: Object.values(this.state.originalData), 
            graphData: this.state.originalData, chartID: uuid.v4(), isAnomalySelected: true})
    }

    handleChooseTimeRange = (timeRange: TimeRange) => {
        this.setState({ timeRange: timeRange })
        console.log(timeRange)
    }

    private failureIcon(level): JSX.Element {
        let iconType;

        switch (level) {
            case 'acceptable':
                iconType = "Checkmark"
                break;
            case 'major':
                iconType = "Bell";
                break;
            case 'critical':
                iconType = "Alerts";
                break;
        }

        return (
            <Icon style={{color: "white"}} glyph={IconFont[iconType]} />
        )
    }

    getBackgroundColor = (level) => {
        if (level === "acceptable") {
            return "#0000b3";
        }

        if (level === "major") {
            return "#e69500";
        }

        if (level === "critical") {
            return "#b30000";
        }
    }

    getFailureRootCause = (failure) => {
        this.setState({selectedFailure: failure, rootCauseAnalysisOverlay: !this.state.rootCauseAnalysisOverlay})
    }

    changeWindowPoints = (windowStart, windowEnd) => {
        this.setState({windowStart: windowStart, windowEnd: windowEnd})
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
                    windowStart: windowStart, windowEnd: windowEnd, isAnomalySelected: true, isDataLoaded: true})
            }
            else{
                this.setState({machineSensorData: gdata, chartID: uuid.v4(), sensorNames: sensorNames, graphData: graphData,
                    originalData: graphData, normalizedType1GraphData: minmaxType1, normalizedType2GraphData: minmaxType2, selectedScale: "Original Data",
                    isAnomalySelected: false, isDataLoaded: true})
            }
            
            console.log(gdata)
            return gdata
            // return rows
        })

        return {
            promise,
            cancel,
        }
    }

    setTimeRange = (timeRange) => {
        let start = timeRange.lower
        let stop = timeRange.upper
        let machineID = this.props.match.params.MID
        let assets = this.state.dtData["machines"]
        let machineMeasurements = assets[machineID] ? assets[machineID]["object"]["measurements"] : []
        let measurementStringArray = []
        console.log("568 ",machineMeasurements, assets, this.state.dtData)
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

    getMachineData = () => {
        let timeRange = this.state.timeRange
        let start = ""
        let stop = ""
        let machineID = this.props.match.params.MID
        let assets = this.state.dtData["machines"]
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

        let query = `from(bucket: "${FACTORY_NAME}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => ${measurementString})
        |> aggregateWindow(every: ${this.state.aggregatePeriod}, fn: last, createEmpty: false)
        |> yield(name: "last")`
        console.log("--425--",query, this.props.match.params.orgID)
        let results = this.processResponse(runQuery(this.props.match.params.orgID, query))
        console.log("results", results)

        /* 
        //same result with flux service
        const csvResult = await FluxService.fluxQuery(this.props.orgID, query);
        const jsonResult = await csvToJSON(csvResult);
        console.log("flex service results: ", jsonResult) 
        */
    }

    scaleData = (e) => {
        let selectedScale = e
        switch(selectedScale) {
            case "Original Data":
                this.setState({machineSensorData: Object.values(this.state.originalData), 
                    graphData: this.state.originalData, chartID: uuid.v4(), selectedScale: e, isAnomalySelected: false})
                break
            case "Scale to [0,1]":
                this.setState({machineSensorData: Object.values(this.state.normalizedType1GraphData), 
                    graphData: this.state.normalizedType1GraphData, chartID: uuid.v4(), selectedScale: e, isAnomalySelected: false})
                break
            case "Scale to [-1,1]":
                this.setState({machineSensorData: Object.values(this.state.normalizedType2GraphData), 
                    graphData: this.state.normalizedType2GraphData, chartID: uuid.v4(), selectedScale: e, isAnomalySelected: false})
                break
            default:
                // default = original data
                this.setState({machineSensorData: Object.values(this.state.originalData), 
                graphData: this.state.originalData, chartID: uuid.v4(), selectedScale: e, isAnomalySelected: false})
        }
    }

    generateData = (activeGraph) => {
        let dates = {
            "anomaly1": "2021-04-22",
            "anomaly2": "2022-01-05",
            "anomaly3": "2021-12-16"
        }
        let date = dates[activeGraph] ? dates[activeGraph] : "2022-02-22"
        let data1 = generateDayWiseTimeSeries(new Date(date).getTime(), 115, {
            min: 30,
            max: 90
        })
        
        let data2 = generateDayWiseTimeSeries(new Date(date).getTime(), 115, {
            min: 0,
            max: 100
        })

        let data3 = generateDayWiseTimeSeries(new Date(date).getTime(), 115, {
            min: 50,
            max: 150
        })

        let data4 = generateDayWiseTimeSeries(new Date(date).getTime(), 115, {
            min: -20,
            max: 20
        })
        // console.log(date, "data: ", data)
        let series = [
            {
                name: "sensor1",
                data: data1
            },
            {
                name: "sensor2",
                data: data2
            },
            {
                name: "sensor3",
                data: data3
            },
            {
                name: "sensor4",
                data: data4
            }
        ]

        return series
    }

    isComponent = () => {
        if(this.props["match"].params["CID"]){
            return true
        }
        return false
    }

    updateAutoRefresh = () => {
        if(this.state.autoRefresh.status === AutoRefreshStatus.Paused || this.state.autoRefresh.status === AutoRefreshStatus.Disabled){
            clearInterval(this.intervalID)
            this.intervalID = null
        }
        else if(this.state.autoRefresh.status === AutoRefreshStatus.Active){
            clearInterval(this.intervalID)
            this.intervalID = null
            this.intervalID = window.setInterval(() => {
                this.getMLModels()
            }, this.state.autoRefresh.interval)
        }
    }

    onSetAutoRefresh = (selected) => {
        console.log("set auto refresh", selected)
        this.setState({autoRefresh: selected}, () => this.updateAutoRefresh())
    }

    private handleChooseAutoRefresh = (interval: number) => {
    
        if (interval === 0) {
          this.onSetAutoRefresh({
            ...this.state.autoRefresh,
            status: AutoRefreshStatus.Paused,
            interval,
          })
          return
        }
    
        this.onSetAutoRefresh({
          ...this.state.autoRefresh,
          interval,
          status: AutoRefreshStatus.Active,
        })
      
      console.log("autofresh changed")
    
      /* private executeQueries = () => {
        this.props.onExecuteQueries()
      } */
    }

    deleteModel = async (model) => {
        if("modelName" in model){
            let result = confirm(`Are you sure you want to delete ${model["modelName"]}`)
            if(result){
                if("pipelineID" in model){
                    await AutoMLService.deleteMLPipeline(model["pipelineID"])
                    this.getMLModels()
                }
                else{
                    if("modelID" in model){
                        await AutoMLService.deleteMLModel(model["modelID"])
                        this.getMLModels()
                    }
                }
            }
        }        
    }

    contextMenu = (modelName, enabled, modelTask, model) =>{
        if(("trainingDone" in model) && model["trainingDone"]){
            return (
                <Context>
                  <Context.Menu
                    icon={enabled ? IconFont.Stop : IconFont.Play}
                    color={ComponentColor.Warning}
                  >
                    {enabled ? <Context.Item
                      label="Stop Model"
                      action={() => {
                          HealthAssessmentService.startStopModel({"modelName": modelName, "enabled": false})
                          this.getMLModels()
                      }}
                    /> : <Context.Item
                      label="Start Model"
                      action={() =>{
                          HealthAssessmentService.startStopModel({"modelName": modelName, "enabled": true})
                          this.getMLModels()
                      }}
                      />}
                  </Context.Menu>
                  <Context.Menu icon={IconFont.GraphLine}>
                    <Context.Item
                      label="View Log Chart"
                      action={() => this.setState({modelLogGraphOverlay: true, selectedModel: model}, ()=>this.onSetAutoRefresh({status: 'paused', interval: 0}))}
                    />
                  </Context.Menu>
                  <Context.Menu
                    icon={IconFont.BarChart}
                    color={ComponentColor.Secondary}
                  >
                    <Context.Item
                      label="View AutoML results"
                      action={() => {
                          if(modelTask === "rulreg"){
                              this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/rulreg-automl/${model["pipelineID"]}/duration`)
                          }
                          else{
                              this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/automl/${modelName}/duration`)
                          }
                      }}
                    />
                  </Context.Menu>
                  <Context.Menu
                    icon={IconFont.Cubo}
                    color={ComponentColor.Default}
                  >
                    <Context.Item
                      label="View Model Performance"
                      action={() => {
                        if(modelTask === "rulreg"){
                            let fid = this.props["match"]["params"]["FID"]
                            let plid = this.props["match"]["params"]["PLID"]
                            let mid = this.props["match"]["params"]["MID"]
                            if(this.isComponent()){
                                let cid = this.props["match"]["params"]["CID"]
                                this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/health/rulreg-feedback/${fid}/${plid}/${mid}/${cid}/${model["pipelineID"]}`)
                            }
                            else
                                this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/health/rulreg-feedback/${fid}/${plid}/${mid}/${model["pipelineID"]}`)
                        }
                        else if(modelTask === "pof"){
                            let fid = this.props["match"]["params"]["FID"]
                            let plid = this.props["match"]["params"]["PLID"]
                            let mid = this.props["match"]["params"]["MID"]
                            if(this.isComponent()){
                                let cid = this.props["match"]["params"]["CID"]
                                this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/health/pof-feedback/${fid}/${plid}/${mid}/${cid}/${model["modelID"]}`)
                            }
                            else
                                this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/health/pof-feedback/${fid}/${plid}/${mid}/${model["modelID"]}`)
                        }
                        else if(modelTask === "rul"){
                            let fid = this.props["match"]["params"]["FID"]
                            let plid = this.props["match"]["params"]["PLID"]
                            let mid = this.props["match"]["params"]["MID"]
                            if(this.isComponent()){
                                let cid = this.props["match"]["params"]["CID"]
                                this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/health/rul-feedback/${fid}/${plid}/${mid}/${cid}/${model["modelID"]}`)
                            }
                            else
                                this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/health/rul-feedback/${fid}/${plid}/${mid}/${model["modelID"]}`)
                        }
                      }}
                    />
                  </Context.Menu>
                  <Context.Menu
                    icon={IconFont.Trash}
                    color={ComponentColor.Danger}
                  >
                    <Context.Item
                      label="Delete Model"
                      action={() => this.deleteModel(model)}
                    />
                  </Context.Menu>
                </Context>
              )
        }
        else{
            return(<></>)
        }
      }

    public render(){
        //var htmlModule = require(this.state.reportPath);
        //var html = htmlModule.default
        /* const {
            colors,
            prefix,
            tickPrefix,
            suffix,
            tickSuffix,
            decimalPlaces,
          } = this.state.gaugeProperties */
        const {modelsLastLogs} = this.state
        return(
            <Page
                titleTag="Health Assessment"
                className="alert-history-page"
            >
                <Page.Header fullWidth={true}>
                    <Page.Title
                        title="Health Assessment"
                    />
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
                        <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>{this.props["match"].params.CID} Health Assessment</Typography>
                    ) : (
                        <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>{this.props["match"].params.MID} Health Assessment</Typography>
                    )}
                    
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
                        {/* <Button
                            color={ComponentColor.Secondary}
                            titleText="Query Database"
                            text="Scale to [0,1]"
                            type={ButtonType.Button}
                            onClick={() => this.normalizeDataType1()}
                        />
                        <Button
                            color={ComponentColor.Secondary}
                            titleText="Query Database"
                            text="Scale to [-1,1]"
                            type={ButtonType.Button}
                            onClick={() => this.normalizeDataType2()}
                        />
                        <Button
                            color={ComponentColor.Secondary}
                            titleText="Query Database"
                            text="Original Data"
                            type={ButtonType.Button}
                            onClick={() => this.getOriginalData()}
                        /> */}
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
                            <Grid.Column widthXS={Columns.Two} style={{border: 'solid 2px #999dab', borderRadius: '4px'}}>
                                <img
                                    src="../../../../assets/images/machine-image.jpg"
                                    className="machine-image"
                                    style={{width: "100%"}}
                                />
                                <br/>
                                <div style={{display: "flex"}}>
                                    {/* <img
                                        src='../../../assets/icons/machine-card-icon.png'
                                        className="machine-icon"
                                        style={{width: "25px"}}
                                    /> */}
                                    <h2>
                                        {this.props.match.params.MID}
                                    </h2>
                                </div>
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Ten}>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Twelve} style={{height: "800px"}}>
                                <Panel style={{border: 'solid 2px #999dab', borderRadius: '4px', height: "inherit"}}>
                                    <Panel.Header size={ComponentSize.Medium} style={{padding: "10px"}}>
                                        <h5 className="preview-data-margins">Anomaly Charts</h5>
                                    </Panel.Header>
                                    <Panel.Body size={ComponentSize.Small}>
                                        {this.state.anomalyModels.length && (
                                            <TabbedPageTabs
                                                tabs={this.createTabs()}
                                                activeTab={this.state.activeAnomalyModel}
                                                onTabClick={(id) => this.setState({ activeAnomalyModel: id, selectedModelID: id })}
                                            />
                                        )}
                                        
                                        <br />
                                        
                                        <div>
                                            {this.state.isDataLoaded ? <AnomalyBrushGraph  /* this.state.machineSensorData.length */
                                                chartID={this.state.chartID}
                                                name={this.state.activeAnomalyModel}
                                                sensorNames={this.state.sensorNames}
                                                modelID={this.state.selectedModelID}
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
                                                isAnomalySelected={this.state.isAnomalySelected}
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
                        <Grid.Row style={{marginTop: "20px"}}>
                            <Grid.Column widthXS={Columns.Twelve} style={{height: "350px"}}>  
                                <RootCauseAnalysisOverlay 
                                    createModelOverlay={this.state.rootCauseAnalysisOverlay}
                                    closeOverlay={() => this.setState({ rootCauseAnalysisOverlay: !this.state.rootCauseAnalysisOverlay })}
                                    failure={this.state.selectedFailure}
                                />                              
                                <Panel style={{border: 'solid 2px #999dab', borderRadius: '4px', height: "inherit"}}>
                                    <Panel.Header size={ComponentSize.ExtraSmall}>
                                        <p className="preview-data-margins">Failure list</p>
                                    </Panel.Header>
                                    <Panel.Body size={ComponentSize.ExtraSmall}>
                                        <Table
                                            borders={BorderType.Vertical}
                                            fontSize={ComponentSize.ExtraSmall}
                                            cellPadding={ComponentSize.ExtraSmall}
                                        >
                                            <Table.Header>
                                                <Table.Row>
                                                    <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                                    <Table.HeaderCell style={{width: "120px"}}>Asset Name</Table.HeaderCell>
                                                    <Table.HeaderCell style={{width: "120px"}}>Start Time</Table.HeaderCell>
                                                    <Table.HeaderCell style={{width: "120px"}}>End Time</Table.HeaderCell>
                                                    <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                                </Table.Row>
                                            </Table.Header>
                                        </Table>
                                        <DapperScrollbars
                                            autoHide={false}
                                            autoSizeHeight={true}
                                            style={{ maxHeight: '250px' }}
                                            className="data-loading--scroll-content"
                                        >
                                            <Table
                                                borders={BorderType.Vertical}
                                                fontSize={ComponentSize.ExtraSmall}
                                                cellPadding={ComponentSize.ExtraSmall}
                                            >
                                                <Table.Body>
                                                    {[{severity: "critical", sourceName: "failure1", startTime: "2021-02-14T21:55", endTime: "2021-02-15T21:55"}, 
                                                    {severity: "major", sourceName: "failure2", startTime: "2021-01-07T16:30", endTime: "2021-01-07T21:55"}, 
                                                    {severity: "acceptable", sourceName: "failure3", startTime: "2021-03-01T07:27", endTime: "2021-03-02T21:55"},
                                                    {severity: "acceptable", sourceName: "failure4", startTime: "2021-03-03T07:27", endTime: ""},
                                                    {severity: "acceptable", sourceName: "failure5", startTime: "2021-03-04T07:27", endTime: "2021-03-04T21:55"},
                                                    {severity: "acceptable", sourceName: "failure6", startTime: "2021-03-06T07:27", endTime: "2021-03-07T21:55"},
                                                    {severity: "major", sourceName: "failure2", startTime: "2021-01-07T16:30", endTime: ""}, 
                                                    {severity: "acceptable", sourceName: "failure3", startTime: "2021-03-01T07:27", endTime: "2021-03-03T21:55"},
                                                    {severity: "acceptable", sourceName: "failure4", startTime: "2021-03-03T07:27", endTime: "2021-03-04T21:55"},
                                                    {severity: "acceptable", sourceName: "failure5", startTime: "2021-03-04T07:27", endTime: ""},
                                                    {severity: "acceptable", sourceName: "failure6", startTime: "2021-03-06T07:27", endTime: "2021-03-07T21:55"}].map((failure, i) => (
                                                        <Table.Row key={uuid.v4()}>
                                                            <Table.Cell style={{width: "30px", textAlign: "center", backgroundColor: this.getBackgroundColor(failure.severity)}}>{this.failureIcon(failure.severity)}</Table.Cell>
                                                            <Table.Cell style={{width: "120px"}}>{failure.sourceName}</Table.Cell>
                                                            <Table.Cell style={{width: "120px"}}>{failure.startTime}</Table.Cell>
                                                            <Table.Cell style={{width: "120px"}}>{failure.endTime}</Table.Cell>
                                                            <Table.Cell style={{width: "30px"}}>
                                                                <SquareButton
                                                                    icon={IconFont.EyeOpen}
                                                                    onClick={()=>this.getFailureRootCause(failure)}
                                                                    size={ComponentSize.ExtraSmall}
                                                                    titleText={"View Root Cause"}
                                                                    color={ComponentColor.Primary}
                                                                />
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    ))}
                                                </Table.Body>
                                            </Table>
                                        </DapperScrollbars>
                                    </Panel.Body>
                                </Panel>
                            </Grid.Column>
                        </Grid.Row>
                        {/* <Grid.Row style={{marginTop: "20px"}}>
                            <Grid.Column widthXS={Columns.Twelve} style={{height: "350px"}}>
                                <Panel style={{border: 'solid 2px #999dab', borderRadius: '4px', height: "inherit"}}>
                                    <Panel.Header size={ComponentSize.ExtraSmall}>
                                        <p className="preview-data-margins">Model list</p>
                                    </Panel.Header>
                                    <Panel.Body size={ComponentSize.ExtraSmall}>
                                        <Table
                                            borders={BorderType.Vertical}
                                            fontSize={ComponentSize.ExtraSmall}
                                            cellPadding={ComponentSize.ExtraSmall}
                                        >
                                            <Table.Header>
                                                <Table.Row>
                                                    <Table.HeaderCell style={{width: "50px"}}>Model Task</Table.HeaderCell>
                                                    <Table.HeaderCell style={{width: "120px"}}>Model Name</Table.HeaderCell>   
                                                    <Table.HeaderCell style={{width: "100px"}}>Last Log</Table.HeaderCell>     
                                                    <Table.HeaderCell style={{width: "150px"}}></Table.HeaderCell>                                      
                                                </Table.Row>
                                            </Table.Header>
                                        </Table>
                                        <DapperScrollbars
                                            autoHide={false}
                                            autoSizeHeight={true}
                                            style={{ maxHeight: '250px' }}
                                            className="data-loading--scroll-content"
                                        >
                                            <Table
                                                borders={BorderType.Vertical}
                                                fontSize={ComponentSize.ExtraSmall}
                                                cellPadding={ComponentSize.ExtraSmall}
                                            >
                                                <Table.Body>
                                                    {this.state.models.map((model, i) => (
                                                        <Table.Row key={uuid.v4()}>
                                                            <Table.Cell style={{width: "50px"}}>{model.modelTask}</Table.Cell>
                                                            <Table.Cell style={{width: "120px"}}>{model.modelName}</Table.Cell>
                                                            <Table.Cell style={{width: "100px"}}>{model.lastLog}</Table.Cell>
                                                            <Table.Cell style={{width: "150px"}} horizontalAlignment={Alignment.Center}>
                                                                <Context align={Alignment.Center}>
                                                                    <Context.Menu icon={IconFont.GraphLine} color={ComponentColor.Primary}>
                                                                        <Context.Item
                                                                            label="View Log Chart"
                                                                            action={() => console.log("log click")}
                                                                            testID="context-menu-item-export"
                                                                        />
                                                                    </Context.Menu>
                                                                    <Context.Menu icon={IconFont.BarChart} color={ComponentColor.Secondary}>
                                                                        <Context.Item
                                                                            label="View AutoML Results"
                                                                            action={() => console.log("automl click")}
                                                                            testID="context-menu-item-export"
                                                                        />
                                                                    </Context.Menu>
                                                                    <Context.Menu icon={IconFont.Stop} color={ComponentColor.Danger} >
                                                                        <Context.Item
                                                                            label="View Stop Model"
                                                                            action={() => console.log("stop click")}
                                                                            testID="context-menu-item-export"
                                                                        />
                                                                    </Context.Menu> 
                                                                </Context>
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    ))}
                                                </Table.Body>
                                            </Table>
                                        </DapperScrollbars>
                                    </Panel.Body>
                                </Panel>
                            </Grid.Column>
                        </Grid.Row> */}
                        {/* <Grid.Row style={{marginTop: "20px"}}>
                            <Grid.Column widthXS={Columns.Three}>
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Nine}>
                                <Panel style={{border: 'solid 2px #999dab', borderRadius: '4px', height: "inherit"}}>
                                    <Panel.Header size={ComponentSize.ExtraSmall}>
                                        <p className="preview-data-margins">Root Cause Analysis</p>
                                    </Panel.Header>
                                    <Panel.Body size={ComponentSize.ExtraSmall}></Panel.Body>
                                </Panel>
                            </Grid.Column>
                        </Grid.Row> */}
                        <Page
                            titleTag=""
                            style={{height: "500px", marginTop: "20px", border: 'solid 2px #999dab', borderRadius: '4px'}}
                        >
                            <Page.Header fullWidth={false}>
                                <Page.Title title="ML Models" />       
                                <div className="tabbed-page--header-left" style={{marginLeft: "20px"}}>
                                    <InputLabel>Number of Days: </InputLabel>
                                    <Input
                                        onChange={(e) => this.setState({ pofDays: parseInt(e.target.value) })}
                                        name="pofDays"
                                        type={InputType.Number}
                                        value={this.state.pofDays}
                                        style={{width: "15%"}}
                                    />
                                    <SquareButton
                                        icon={IconFont.Play}
                                        onClick={()=>this.setState({pofDaysSent: this.state.pofDays})}
                                        size={ComponentSize.ExtraSmall}
                                        titleText={"Get Probability"}
                                        color={ComponentColor.Primary}
                                    />
                                    {/* <FlexBox
                                        alignItems={AlignItems.Center}
                                        margin={ComponentSize.Small}
                                        className="view-options--checkbox"
                                        key={uuid.v4()}
                                        style={{margin: "0px", marginLeft: "20px"}}
                                    >
                                        <Input
                                            onChange={(e) => this.setState({ pofDays: parseInt(e.target.value) })}
                                            name="pofDays"
                                            type={InputType.Number}
                                            value={this.state.pofDays}
                                        />
                                        <SquareButton
                                            icon={IconFont.Play}
                                            onClick={()=>this.setState({pofDaysSent: this.state.pofDays})}
                                            size={ComponentSize.ExtraSmall}
                                            titleText={"Get Probability"}
                                            color={ComponentColor.Primary}
                                        />
                                    </FlexBox>  */}                                   
                                </div>
                                <div className="tabbed-page--header-right">
                                    <FlexBox
                                        alignItems={AlignItems.Center}
                                        margin={ComponentSize.Small}
                                        className="view-options--checkbox"
                                        key={uuid.v4()}
                                        style={{margin: "0px", marginRight: "25px"}}
                                    >
                                        <Toggle
                                            id="prefixoptional"
                                            checked={this.state.showEnabledModels}
                                            name={"showEnabledModels"}
                                            type={InputToggleType.Checkbox}
                                            onChange={() => {
                                                if(this.state.showEnabledModels){
                                                    this.setState({displayedModels: this.state.models, showEnabledModels: false})
                                                }
                                                else{
                                                    let enabledModels = this.state.models.filter(m=>m["enabled"])
                                                    this.setState({displayedModels: enabledModels, showEnabledModels: true})
                                                }
                                            }}
                                            size={ComponentSize.ExtraSmall}
                                        />
                                        <InputLabel>Show only enabled models</InputLabel>
                                    </FlexBox>
                                    <RefreshLogsDropdown
                                        selected={this.state.autoRefresh}
                                        onChoose={this.handleChooseAutoRefresh}
                                        onManualRefresh={()=>this.getMLModels()}
                                        showManualRefresh={true}
                                    />
                                </div>                    
                            </Page.Header>
                            <ModelLogGraphOverlay
                                modelLogGraphOverlay={this.state.modelLogGraphOverlay}
                                closeOverlay={()=>this.setState({modelLogGraphOverlay: !this.state.modelLogGraphOverlay})}
                                model={this.state.selectedModel}
                            />
                            <Page.Contents
                                className="models-index__page-contents"
                                fullWidth={false}
                                scrollable={true}
                            >
                                <div style={{ height: '100%'}}> {/* , display: 'grid' */} 
                                    <div className="models-card-grid">
                                        {this.state.displayedModels.length === 0 && (
                                            <div>There are no models created yet</div>
                                        )}
                                        {this.state.displayedModels.map((model, i) => (
                                            <ResourceCard
                                                key={uuid.v4()}
                                                contextMenu={this.contextMenu(model["modelName"], model["enabled"], model["task"], model)}
                                                style={model["enabled"] ? {background: "#afdf80", color:"red !important"} : {}}
                                            >
                                                <ResourceCard.Name
                                                    name={`Task: ${model["task"]}`}
                                                    style={{color: "red !important"}}
                                                >
                                                    <div>Test children</div>
                                                </ResourceCard.Name>
                                                {("trainingDone" in model) && !model["trainingDone"] && (<>
                                                    <SparkleSpinner style={{alignSelf: "center"}} loading={RemoteDataState.Loading} />
                                                    <WaitingText style={{textAlign: "center"}} text="Training process is running" />
                                                </>) }
                                                {model["trainingDone"] && (model["task"] === "rul") && 
                                                    (modelsLastLogs[model["modelID"]] ? parseInt(modelsLastLogs[model["modelID"]]["prediction"]) === 1 ? <Button
                                                        shape={ButtonShape.Default}
                                                        color={ComponentColor.Danger}
                                                        titleText=""
                                                        icon={IconFont.Stop}
                                                        text="Danger"
                                                        type={ButtonType.Button}
                                                        onClick={() => console.log("click action")}
                                                        style={{top: "30%", height: "50px"}}
                                                    /> :
                                                    <Button
                                                        shape={ButtonShape.Default}
                                                        color={ComponentColor.Success}
                                                        titleText=""
                                                        icon={IconFont.Sun}
                                                        text="Healthy"
                                                        type={ButtonType.Button}
                                                        onClick={() => console.log("click action")}
                                                        style={{marginTop: "12.5%", marginBottom: "12.5%", height: "50px"}}
                                                    /> : <Button
                                                            shape={ButtonShape.Default}
                                                            color={ComponentColor.Default}
                                                            titleText=""
                                                            icon={IconFont.Clock}
                                                            text="No Log Found"
                                                            type={ButtonType.Button}
                                                            onClick={() => console.log("click action")}
                                                            style={{marginTop: "12.5%", marginBottom: "12.5%", height: "50px"}}
                                                        />)
                                                } 
                                                {model["trainingDone"] && (model["task"] === "rulreg" )&& 
                                                    <div style={{ width: 'auto', height: '150px' }}>
                                                        <SingleStat
                                                            key={uuid.v4()}
                                                            stat={modelsLastLogs[model["pipelineID"]] ? modelsLastLogs[model["pipelineID"]]["prediction"] : "-"}
                                                            style={{width: "90%", height: "90%", top: "auto", bottom: "-5px", right: "auto", left: "auto"}}
                                                            properties={{
                                                                queries: [],
                                                                colors: [
                                                                    {
                                                                        type: "text",
                                                                        hex: "#34BB55",
                                                                        id: "base",
                                                                        name: "rainforest",
                                                                        value: 15,
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        hex: "#DC4E58",
                                                                        id: uuid.v4(),
                                                                        name: "fire",
                                                                        value: 0,
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        hex: "#513CC6",
                                                                        id: uuid.v4(),
                                                                        name: "pulsar",
                                                                        value: -99999999999999,
                                                                    }
                                                                ],
                                                                prefix: '',
                                                                tickPrefix: '',
                                                                suffix: ' days',
                                                                tickSuffix: '',
                                                                note: '',
                                                                showNoteWhenEmpty: false,
                                                                decimalPlaces: {
                                                                isEnforced: false,
                                                                digits: 0,
                                                                },
                                                            }}
                                                            theme={'dark'}
                                                        />
                                                    </div>                                                    
                                                }   
                                                {model["trainingDone"] && (model["task"] === "pof") && 
                                                    <>
                                                        <div style={{ width: 'auto', height: '150px' }}>
                                                            <GaugeChart
                                                                key={uuid.v4()}
                                                                value={modelsLastLogs[model["modelID"]] ? this.findProbability(modelsLastLogs[model["modelID"]]["prediction"][0], modelsLastLogs[model["modelID"]]["prediction"][1], this.state.pofDaysSent) : ""}
                                                                properties={this.state.gaugeProperties}
                                                                theme={'dark'}
                                                                style={{height: "150px", width: "auto"}}
                                                            />
                                                            {/* <div className="gauge">
                                                                <Gauge
                                                                    width={150}
                                                                    height={150}
                                                                    colors={colors}
                                                                    prefix={prefix}
                                                                    tickPrefix={tickPrefix}
                                                                    suffix={suffix}
                                                                    tickSuffix={tickSuffix}
                                                                    gaugePosition={parseFloat(model.lastLog) ? parseFloat(model.lastLog) : ""}
                                                                    decimalPlaces={decimalPlaces}
                                                                    theme={GAUGE_THEME_DARK}
                                                                />
                                                            </div> */}                                                    
                                                        </div>
                                                        <Grid>
                                                            <Grid.Row>
                                                                <Grid.Column widthXS={Columns.Six}>
                                                                    <div className="tabbed-page--header-left">
                                                                        <Label
                                                                            size={ComponentSize.Small}
                                                                            name={"Healthy"}
                                                                            description={"Fail is unlikely"}
                                                                            color={InfluxColors.Rainforest}
                                                                            id={"icon-label"} 
                                                                        />
                                                                    </div>
                                                                </Grid.Column>
                                                                <Grid.Column widthXS={Columns.Six}>
                                                                    <div className="tabbed-page--header-right">
                                                                        <Label
                                                                            size={ComponentSize.Small}
                                                                            name={"Danger"}
                                                                            description={"High failure risk"}
                                                                            color={InfluxColors.Fire}
                                                                            id={"icon-label"} 
                                                                        />
                                                                    </div>
                                                                </Grid.Column>
                                                            </Grid.Row> 
                                                            {/* <Grid.Row>
                                                                <Grid.Column widthXS={Columns.Six}>
                                                                    <Input
                                                                        onChange={(e) => this.setState({ pofDays: parseInt(e.target.value) })}
                                                                        name="modelNamae"
                                                                        type={InputType.Number}
                                                                        value={this.state.pofDays}
                                                                    />
                                                                </Grid.Column>
                                                            </Grid.Row> */}
                                                        </Grid>
                                                    </>
                                                }                                                   
                                                <ResourceCard.Meta>
                                                    <QuestionMarkTooltip
                                                        diameter={15}
                                                        /* tooltipStyle={{ width: '400px' }} */
                                                        color={ComponentColor.Secondary}
                                                        tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                            <div style={{ color: InfluxColors.Star }}>{"Model Meta Data"}
                                                                <hr style={{ borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#BE2EE4', boxShadow: '0 0 5px 0 #8E1FC3', margin: '3px' }} />
                                                            </div>
                                                            <div>
                                                                <span style={{color: InfluxColors.Pool}}>
                                                                    Model Name:
                                                                </span> {model["modelName"] ? model["modelName"] : "-"}
                                                            </div>
                                                            <div>
                                                                <span style={{color: InfluxColors.Rainforest}}>
                                                                    Creator: 
                                                                </span> {model["creator"] ? model["creator"] : "-"}
                                                            </div>
                                                            <div>
                                                                <span style={{color: InfluxColors.Topaz}}>
                                                                    Algorithm: 
                                                                </span> {model["algorithm"] ? model["algorithm"] : "-"}
                                                            </div>
                                                        </div>}
                                                    />
                                                </ResourceCard.Meta>
                                            </ResourceCard>
                                        ))}
                                    </div>
                                </div>
                            </Page.Contents>
                        </Page>
                        <Grid.Row style={{marginTop: "20px"}}>
                            <Grid.Column widthXS={Columns.Two}>
                                <div className="tabbed-page--header-left">
                                    <CTAButton
                                        icon={IconFont.TextBlock}
                                        color={ComponentColor.Secondary}
                                        text={"Generate Report"}
                                        onClick={()=>console.log("generate report")}
                                    />
                                </div>
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Eight}/>
                            <Grid.Column widthXS={Columns.Two}>
                                <CTAButton
                                    icon={IconFont.Plus}
                                    color={ComponentColor.Success}
                                    text={"Add Model"}
                                    onClick={()=>this.setState({createModelOverlay: !this.state.createModelOverlay})}
                                />
                                <CreateModelOverlay 
                                    handleChangeNotification={this.handleChangeNotification}
                                    username={this.props.me.name}
                                    isComponent={this.isComponent()}
                                    parentParams={this.props["match"].params}
                                    createModelOverlay={this.state.createModelOverlay}
                                    closeOverlay={() => this.setState({ createModelOverlay: !this.state.createModelOverlay })}
                                />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                    
                </Page.Contents>
            </Page>
        )
    }
}

const mstp = (state: AppState) => {
    const { me } = state  
    return { me }
}

const connector = connect(mstp)

export default connector(MachineHealthPage)

