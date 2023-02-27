import React, { PureComponent, createRef, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { Link } from "react-router-dom";
import Slider from '@material-ui/core/Slider'
import { makeStyles, styled  } from '@material-ui/core/styles'
import ForceGraph2D from "react-force-graph-2d"
// import Typography from '@material-ui/core/Typography'
import {
    Page, Grid, Columns, Panel, Notification, ResourceCard, TechnoSpinner, RemoteDataState, InputType, Input,
    ComponentColor, ComponentSize, Gradients, IconFont, Icon, InfluxColors, WaitingText, QuestionMarkTooltip,
    Button, ButtonType, SelectDropdown, SquareGrid, ButtonBase, ButtonShape, ButtonBaseRef, SparkleSpinner,
    BorderType, Table, DapperScrollbars, GradientBox, InputLabel, Label, SquareButton, CTAButton, GridColumn,
    AlignItems, InputToggleType, Toggle, FlexBox, ProgressBar, RangeSlider, ComponentStatus, Heading, Typeface,
    HeadingElement, FontWeight, Tabs, SpinnerContainer
} from '@influxdata/clockface'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import {TimeRange, AppState, AutoRefreshStatus} from 'src/types'
import { Context } from 'src/clockface'
import CreateModelOverlay from '../components/CreateModelOverlay'
import MLReportOverlay from '../components/MLReportOverlay'
import GaugeChart from 'src/shared/components/GaugeChart'
import SingleStat from 'src/shared/components/SingleStat';
import AnomalyBrushGraph from 'src/health/components/AnomalyBrushGraph'
import { FACTORY_NAME } from 'src/config';
import AnomalyGraphTimeRangeDropdown from 'src/health/components/AnomalyGraphTimeRangeDropdown';
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import AutoMLService from 'src/shared/services/AutoMLService'
import DTService from 'src/shared/services/DTService';
import FailureService from 'src/shared/services/FailureService'
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
import {anomalyCountDailyThreshold, rulDangerValue, rulDangerValueThreshold, rulregCycleDangerThreshold, pofProbabilityThreshold} from 'src/health/constants'
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

const ScoreSlider = styled(Slider)((props)=>({
    color: props.scoreColor,// InfluxColors.Amethyst, //color of the slider between thumbs
    "& .MuiSlider-thumb": {
        backgroundColor: InfluxColors.Cloud, //color of thumbs,
        height: "18px",
        width: "18px"
    },
    "& .MuiSlider-rail": {
        // color: InfluxColors.Comet, ////color of the slider outside  teh area between thumbs
        height: "10px",
        backgroundImage: "linear-gradient(90deg, red, green)",
        opacity: 0.75
    },
    "& .MuiSlider-markLabelActive": {
        color: InfluxColors.Cloud
    },
    '& .MuiSlider-track': {
        height: "10px",
        backgroundImage: props.scoreColor
    },
    "& .MuiSlider-mark": {
        height: "0px",
        width: "0px"
    },
    "& .PrivateValueLabel-circle-6": {
        width: "45px",
        height: "45px"
    },
    "& .PrivateValueLabel-offset-5": {
        fontSize: "18px"
    }
    /* color: '#52af77',
    height: 8,
    '& .MuiSlider-track': {
      border: 'none',
    },
    '& .MuiSlider-thumb': {
      height: 24,
      width: 24,
      backgroundColor: '#fff',
      border: '2px solid currentColor',
      '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
        boxShadow: 'inherit',
      },
      '&:before': {
        display: 'none',
      },
    },
    '& .MuiSlider-valueLabel': {
      lineHeight: 1.2,
      fontSize: 12,
      background: 'unset',
      padding: 0,
      width: 32,
      height: 32,
      borderRadius: '50% 50% 50% 0',
      backgroundColor: '#52af77',
      transformOrigin: 'bottom left',
      transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
      '&:before': { display: 'none' },
      '&.MuiSlider-valueLabelOpen': {
        transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
      },
      '& > *': {
        transform: 'rotate(45deg)',
      },
    }, */
}))

const rootCauseModelParameters = {
    "HDBSCAN": {
        "prev_hours": {
            "Type": "Number",
            "Value": 72
        },
        "window_size": {
            "Type": "Number",
            "Value": 30
        },
        "bucket_minutes": {
            "Type": "Number",
            "Value": 5
        }
    }
}

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
    mlReportOverlay: boolean
    rootCauseAnalysisOverlay: boolean
    rootCauseTreeLoading: RemoteDataState
    rootCauseGraphData: object
    rootCausePossibleComps: string[]
    rootCauseModels: string[]
    rootCauseParams: any[]
    rootCauseMeasurementSensorInfo: object
    selectedRootCauseModel: string
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
    failureToAnalyze: string
    rootCauseEndDate: string
    topLevelTreeComponent: string
    compToAnalyze: string
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
    showMLModelsSection: boolean
    showFailureListSection: boolean
    showAnomalyChartSection: boolean
    showRootCauseSection: boolean
    failures: object[]
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

function ParameterTable (props) {
    // console.log("PARAMTABLE", selectedRootCauseModel)
    const selectedRootCauseModel = props.selectedRootCauseModel
    const rootCauseParams = props.rootCauseParams
    const setRootCauseParams = props.setRootCauseParams
    if(selectedRootCauseModel != "") {
        // const [rootCauseParams, setRootCauseParams] = useState(Array(Object.keys(rootCauseModelParameters[selectedRootCauseModel]).length).fill(0))
        function handleChange(index, newValue) {
            const newValues = rootCauseParams.map((value, j) => {
              if (j === index) {
                // Increment the clicked counter
                return newValue;
              } else {
                // The rest haven't changed
                return value;
              }
            });
            setRootCauseParams(newValues);
        }
        // console.log(rootCauseModelParameters[selectedRootCauseModel])
        return(
            <Table>
            <Table.Header>
                <Table.Row>
                    {Object.keys(rootCauseModelParameters[selectedRootCauseModel]).map(parameter => {
                        return <Table.HeaderCell style={{width: "100px"}}>{parameter}</Table.HeaderCell>
                    })}
                    {/* <Table.HeaderCell style={{width: "100px"}}>Selected Failure</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>Top Level Component</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>Model</Table.HeaderCell> */}
                    {/* <Table.HeaderCell style={{width: "100px"}}>RUL</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>RULREG</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>POF</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>Critical</Table.HeaderCell> */}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Table.Row>
                    {Object.keys(rootCauseModelParameters[selectedRootCauseModel]).map((parameter,i)  => {
                        return <Table.Cell style={{width: "100px"}}>{<Input type={rootCauseModelParameters[selectedRootCauseModel][parameter]["Type"]}
                        value={rootCauseParams[i]} onChange={(e) => {
                            handleChange(i, e.target.value)
                        }}></Input>}</Table.Cell>
                    })}
                    {/* <Table.Cell style={{width: "100px"}}>{this.state.failureToAnalyze}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{this.state.topLevelTreeComponent}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{
                        <SelectDropdown
                        style={{width: "100px"}}
                        buttonColor={ComponentColor.Secondary}
                        options={this.state.rootCauseModels}
                        selectedOption={this.state.selectedRootCauseModel}
                        onSelect={(e) => {
                            this.setState({selectedRootCauseModel: e})
                        }}
                    />
                    }</Table.Cell> */}

                    {/* <Table.Cell style={{width: "100px"}}>{rulModelsCount}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{rulregModelsCount}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{pofModelsCount}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{criticalCount}</Table.Cell> */}
                </Table.Row>
            </Table.Body>
        </Table>
        )
    } else {
        return(<></>)
    }
}


class MachineHealthPage extends PureComponent<Props, State>{
    private graphRef: React.RefObject<HTMLInputElement>;
    private paramTableRef: React.RefObject<HTMLInputElement>;
    private popoverTrigger = createRef<ButtonBaseRef>()
    constructor(props) {
        super(props);
        this.graphRef = React.createRef();
        this.paramTableRef = React.createRef();

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
            mlReportOverlay: false,
            rootCauseAnalysisOverlay: false,
            rootCauseTreeLoading: RemoteDataState.Loading,
            rootCausePossibleComps: [],
            rootCauseModels: ["HDBSCAN"],
            selectedRootCauseModel: "",
            rootCauseGraphData: {},
            rootCauseParams: [],
            rootCauseMeasurementSensorInfo: {},
            rootCauseEndDate: "",
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
            failureToAnalyze: "",
            topLevelTreeComponent: "",
            compToAnalyze: "",
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
            showMLModelsSection: false,
            showFailureListSection: false,
            showAnomalyChartSection: false,
            showRootCauseSection: false,
            failures: [],
            autoRefresh: {status: AutoRefreshStatus.Paused, interval: 0}
        }
    }
    private intervalID: number
    async componentDidMount(){
        console.log(this.props)
        this.getDTData()
        this.getMLModels()
        this.getMachineFailures()
        if (this.state.autoRefresh.status === AutoRefreshStatus.Active) {
            this.intervalID = window.setInterval(() => {
              this.getMLModels()
            }, this.state.autoRefresh.interval)
        }
      
        // this.setState({})
    }

    getMachineFailures = async () => {
        let failures = await FailureService.getFailures({sourceName: this.props.match.params.MID})
        failures.sort((a, b) => new Date(b["startTime"]).getTime() - new Date(a["startTime"]).getTime())
        this.setState({failures: failures}, ()=>console.log("failures: ", this.state))
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
            return (probability*100).toFixed(2)
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
                        // if(model["modelID"] == "3c09027f9e224199af1356d07756f13d") {
                        //     console.log("ad model", lastLog)
                        // }
                    }
                }               
            }
            this.setState({models: [...enabledModels, ...disabledModels], displayedModels: [...enabledModels, ...disabledModels], modelsLastLogs: modelsLastLogs}, ()=>console.log("-->", this.state))
        }
    }

    bringPossibleComps = () => {
        // function similarity(s1, s2) {
        //     var longer = s1;
        //     var shorter = s2;
        //     if (s1.length < s2.length) {
        //       longer = s2;
        //       shorter = s1;
        //     }
        //     var longerLength = longer.length;
        //     if (longerLength == 0) {
        //       return 1.0;
        //     }
        //     return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
        //   }
        // function editDistance(s1, s2) {
        //     s1 = s1.toLowerCase();
        //     s2 = s2.toLowerCase();
          
        //     var costs = new Array();
        //     for (var i = 0; i <= s1.length; i++) {
        //       var lastValue = i;
        //       for (var j = 0; j <= s2.length; j++) {
        //         if (i == 0)
        //           costs[j] = j;
        //         else {
        //           if (j > 0) {
        //             var newValue = costs[j - 1];
        //             if (s1.charAt(i - 1) != s2.charAt(j - 1))
        //               newValue = Math.min(Math.min(newValue, lastValue),
        //                 costs[j]) + 1;
        //             costs[j - 1] = lastValue;
        //             lastValue = newValue;
        //           }
        //         }
        //       }
        //       if (i > 0)
        //         costs[s2.length] = lastValue;
        //     }
        //     return costs[s2.length];
        //   }
        // // console.log(this.state.dtData)
        // // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
        // // console.log(this.state.failureToAnalyze)
        let possibleComps = []
        if (this.state.failureToAnalyze != "")
            possibleComps = Object.keys(this.state.dtData["machines"])
            
        // Object.keys(this.state.dtData["components"]).forEach(comp => {

        //     if (similarity(comp, this.state.failureToAnalyze) > .3) {
        //         possibleComps.push(comp)
        //     }
        //     // console.log(comp, this.state.failureToAnalyze, similarity(comp, this.state.failureToAnalyze))
        // })

        this.setState({rootCausePossibleComps: possibleComps, compToAnalyze: "", rootCauseTreeLoading: RemoteDataState.Done})


        // if (possibleComps.length > 0) 
        //     this.setState({rootCausePossibleComps: possibleComps})
        // } else {
        //     possibleComps.
        // }
    }

    createRootCauseGraph = async () => {
        const nodes = []
        const links =  []
        console.log(this.state.dtData, "dt")
        if (Object.keys(this.state.dtData["machines"]).includes(this.state.compToAnalyze)) {
            let itemOfInterest = this.state.dtData["machines"][this.state.compToAnalyze]
            nodes.push(Object.assign({
                id: this.state.compToAnalyze,
                color: "red",
                size: 400,
                symbolType: "circle",
                src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/machine.jpg",
            }, itemOfInterest));
            itemOfInterest["object"]["contents"].map(component => {
                if (component["@type"] !== "Component") {
                    return;
                }

                nodes.push(Object.assign({
                    id: component?.name,
                    color: "green",
                    size: 300,
                    symbolType: "square",
                    src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/component.png",
                }, component))

                links.push({
                    source: component?.parent,
                    target: component?.name
                })

                component["sensors"].map(sensor => {
                    nodes.push(Object.assign({
                        id: sensor?.name,
                        color: "orange",
                        size: 300,
                        symbolType: "triangle",
                        src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/sensor.jpg",
                    }, sensor))

                    links.push({
                        source: sensor?.parent,
                        target: sensor?.name
                    })
                    sensor["fields"].map(field => {
                        // fields.push(field);

                        nodes.push(Object.assign({
                            id: field?.["name"],
                            color: "purple",
                            size: 300,
                            symbolType: "triangle",
                            src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/measurement.jpg",
                        }, field))

                        links.push({
                            source: field?.parent,
                            target: field?.name
                        })
                    })
                })
            })

            const returnData = {
                nodes,
                links
            }

            this.setState({rootCauseGraphData: returnData})

            await this.initialCameraPosition();
        } else if(Object.keys(this.state.dtData["components"]).includes(this.state.compToAnalyze)) {
            let itemOfInterest = this.state.dtData["components"][this.state.compToAnalyze]

            nodes.push(Object.assign({
                id: this.state.compToAnalyze,
                color: "green",
                size: 400,
                symbolType: "circle",
                src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/component.jpg",
            }, itemOfInterest));
            itemOfInterest["object"]["sensors"].map(sensor => {
                nodes.push(Object.assign({
                    id: sensor?.name,
                    color: "orange",
                    size: 300,
                    symbolType: "triangle",
                    src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/sensor.jpg",
                }, sensor))

                links.push({
                    source: sensor?.parent,
                    target: sensor?.name
                })
                sensor["fields"].map(field => {
                    // fields.push(field);

                    nodes.push(Object.assign({
                        id: field?.["name"],
                        color: "purple",
                        size: 300,
                        symbolType: "triangle",
                        src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/measurement.jpg",
                    }, field))

                    links.push({
                        source: field?.parent,
                        target: field?.name
                    })
                })
            })

            const returnData = {
                nodes,
                links
            }

            this.setState({rootCauseGraphData: returnData})

            await this.initialCameraPosition();
        }
    }

    handleNodeClick = async (node) => {
        const currentParamTable = this.paramTableRef.current;

        console.log(currentParamTable, "CURRPARAMTABLE")
        console.log("hello")
        let m2s = {}
        // let settings = {
        //     sessionID: Date.now(),
        //     m2s: {},
        //     prev_hours: 72,
        //     window_size: 30,
        //     bucket_minutes: 5
        // }
        // console.log(node)
        this.setState({topLevelTreeComponent: node.id, compToAnalyze: node.id})
        if (Object.keys(node).includes("object")) {
            if (node.object["@type"] == "Interface") {
                node.object.contents.map(component => {
                    component.sensors.map(sensor => {
                        sensor.fields.map(field => {
                            if (!Object.keys(m2s).includes(field.measurement)) {
                                m2s[field.measurement] = [];
                            }
                            m2s[field.measurement].push(field["@id"].replace("F_", ""))
                        })
                    })
                })
            } else if(node.object["@type"] == "Component") {
                node.object.sensors.map(sensor => {
                    sensor.fields.map(field => {
                        if (!Object.keys(m2s).includes(field.measurement)) {
                            m2s[field.measurement] = [];
                        }
                        m2s[field.measurement].push(field["@id"].replace("F_", ""))
                    })
                })
            }

        } else if(node["@type"] == "Component") {
            node.sensors.map(sensor => {
                sensor.fields.map(field => {
                    if (!Object.keys(m2s).includes(field.measurement)) {
                        m2s[field.measurement] = [];
                    }
                    m2s[field.measurement].push(field["@id"].replace("F_", ""))
                })
            })
        } else if(node.type == "Sensor") {
            node.fields.map(field => {
                if (!Object.keys(m2s).includes(field.measurement)) {
                    m2s[field.measurement] = [];
                }
                m2s[field.measurement].push(field["@id"].replace("F_", ""))
            })
        } else if(node.type == "Field") {
            if (!Object.keys(m2s).includes(node.measurement)) {
                m2s[node.measurement] = [];
            }
            m2s[node.measurement].push(node["@id"].replace("F_", ""))
        }

        this.setState({rootCauseMeasurementSensorInfo: m2s})
        // 
        this.createRootCauseGraph()

    }

    startRootCauseAnalysis = async () => {
        let settings = {
            sessionID: Date.now().toString(),
            m2s: this.state.rootCauseMeasurementSensorInfo,
            end_date: this.state.rootCauseEndDate
        }
        Object.keys(rootCauseModelParameters[this.state.selectedRootCauseModel]).forEach((parameter, i) => {
            settings[parameter] = this.state.rootCauseParams[i]
        })

        console.log(settings)
        const test = await HealthAssessmentService.startRootCauseAnalysis(settings)
    }

    initialCameraPosition = async () => {
        // this.graphRef.zoom(1, 2000);
        this.graphRef.centerAt(0, 0, 2000)
        this.graphRef.d3Force('collide', d3.forceCollide(5));
    }

    handleInputChange = (index) => {
        
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
        let models = []
        if(anomalies){
            models = Object.keys(anomalies)
        }        
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

    dataToPush = (row) => {
        let valueKey = "_value" in row ? "_value" : "_value (number)" in row ? "_value (number)" : ""
        if(valueKey.length){
            if(row[valueKey] && row[valueKey].toFixed()){
                return {pushData: true, valueKey: valueKey, value: row[valueKey].toFixed()}
            }
            else{
                return {pushData: false}
            }
        }
        else{
            return {pushData: false}
        }
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
            console.log("rows: ", rows)
            let graphData = {}
            for(let row of rows){
                if(`${row["_measurement"]}_${row["_field"]}` in graphData){
                    let resultData = this.dataToPush(row)
                    if(resultData["pushData"]){
                        graphData[`${row["_measurement"]}_${row["_field"]}`]["data"].push([row["_time"], resultData["value"]])
                    }                 
                }
                else{
                    let resultData = this.dataToPush(row)
                    if(resultData["pushData"]){
                        graphData[`${row["_measurement"]}_${row["_field"]}`] = {
                            name: `${row["_measurement"]}_${row["_field"]}`,
                            data: [[row["_time"], resultData["value"]]]
                        }
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

    getMLReportData = () => {
        // will update ml report section
        const {modelsLastLogs, models} = this.state
        let enabledModelsList = models.filter(m=>m["enabled"])
        let enabledModelCount = enabledModelsList.length
        let rulModels = []
        let rulregModels = []
        let pofModels = []
        let adModels = []
        let enabledModelsLogs = enabledModelsList.map(model=>{
            if(model["task"] === "rulreg"){
                if(model["pipelineID"] in modelsLastLogs && "prediction" in modelsLastLogs[model["pipelineID"]]){
                    let log = {task: "rulreg", log: modelsLastLogs[model["pipelineID"]]["prediction"]}
                    rulregModels.push(log)
                    return log
                }                
            }
            if(model["task"] === "rul"){
                if(model["modelID"] in modelsLastLogs && "prediction" in modelsLastLogs[model["modelID"]]){
                    let log = {task: "rul", log: modelsLastLogs[model["modelID"]]["prediction"]}
                    rulModels.push(log)
                    return log
                }                
            }
            if(model["task"] === "pof"){
                if(model["modelID"] in modelsLastLogs && "prediction" in modelsLastLogs[model["modelID"]]){
                    let log = {task: "pof", log: this.findProbability(modelsLastLogs[model["modelID"]]["prediction"][0], modelsLastLogs[model["modelID"]]["prediction"][1], this.state.pofDaysSent)}
                    pofModels.push(log)
                    return log
                }                
            }
            if(model["task"] === "ad"){ // write a function that takes last day anomaly count?
                if(model["modelID"] in modelsLastLogs && "prediction" in modelsLastLogs[model["modelID"]]){
                    let log = {task: "pof", log: model["modelID"] in modelsLastLogs ? modelsLastLogs[model["modelID"]]["prediction"] : 0}
                    adModels.push(log)
                    return log
                }                
            }
        })
        let criticalCount = 0
        enabledModelsLogs.forEach(log => {
            console.log("--? ", log)
            if(log && ("task" in log)){
                if(log["task"] === "rulreg"){
                    if(log["log"] <= rulregCycleDangerThreshold){
                        criticalCount += 1
                    }
                }
                if(log["task"] === "rul"){
                    if(log["log"] === 0){
                        criticalCount += 1
                    }
                }
                if(log["task"] === "pof"){
                    if(log["log"] >= pofProbabilityThreshold){
                        criticalCount += 1
                    }
                }
            }            
        })
        let likelyToFail = enabledModelCount>0 ? ((criticalCount/enabledModelCount) * 100).toFixed(2) : 0
        let anomalyModelsCount = enabledModelsList.filter(m=>m["task"]==="ad").length
        let rulModelsCount = enabledModelsList.filter(m=>m["task"]==="rul").length
        let rulregModelsCount = enabledModelsList.filter(m=>m["task"]==="rulreg").length
        let pofModelsCount = enabledModelsList.filter(m=>m["task"]==="pof").length

        // avg anomaly models result
        let avgAnomalyModelsResult = 0
        let anomalyModelsResultScore = 0
        adModels.forEach(log => {
            avgAnomalyModelsResult += log["log"]
            if(log["log"] >= anomalyCountDailyThreshold){
                anomalyModelsResultScore -= 1
            }
            else{
                anomalyModelsResultScore += 1
            }
        })
        if(adModels.length)
            avgAnomalyModelsResult /= adModels.length
        
        // avg rul models result
        let avgRulModelsResult = 0
        let rulModelsResultScore = 0
        rulModels.forEach(log => {
            avgRulModelsResult += log["log"]
            if(log["log"] == rulDangerValue){
                rulModelsResultScore -= 1
            }
            else{
                rulModelsResultScore += 1
            }
        })
        if(rulModels.length)
            avgRulModelsResult /= rulModels.length
        
        // avg rulreg models result
        let avgRulregModelsResult = 0
        let rulregModelsResultScore = 0
        rulregModels.forEach(log => {
            avgRulregModelsResult += log["log"]
            if(log["log"] <= rulregCycleDangerThreshold){
                rulregModelsResultScore -= 1
            }
            else{
                rulregModelsResultScore += 1
            }
        })
        if(rulregModels.length)
            avgRulregModelsResult /= rulregModels.length
        
        // avg pof models result
        let avgPofModelsResult = 0
        let pofModelsResultScore = 0
        pofModels.forEach(log => {
            avgPofModelsResult += log["log"]
            if(log["log"] >= pofProbabilityThreshold){
                pofModelsResultScore -= 1
            }
            else{
                pofModelsResultScore += 1
            }
        })
        if(pofModels.length)
            avgPofModelsResult /= pofModels.length
        
        let isAnomalyInDanger = avgAnomalyModelsResult >= anomalyCountDailyThreshold ? true : false
        let isRulInDanger = avgRulModelsResult >= rulDangerValueThreshold ? true : false
        let isRulregInDanger = avgRulregModelsResult <= rulregCycleDangerThreshold ? true : false
        let isPofInDanger = avgPofModelsResult >= pofProbabilityThreshold ? true : false


        return {enabledModelCount, criticalCount, likelyToFail, anomalyModelsCount, rulModelsCount, rulregModelsCount, pofModelsCount,
                isAnomalyInDanger, isRulInDanger, isRulregInDanger, isPofInDanger, anomalyModelsResultScore, rulModelsResultScore, rulregModelsResultScore, pofModelsResultScore}
    }

    returnSpanColor = (score) => {
        if(score === 0)
            return InfluxColors.Pineapple
        else if(score < 0)
            return InfluxColors.Fire
        else if(score > 0)
            return InfluxColors.Rainforest
        else
            return InfluxColors.Mist
    }

    returnFooterColor = (score) => {
        if(score === 0)
            return InfluxColors.Pineapple
        else if(score >= 50)
            return InfluxColors.Fire
        else if(score < 50)
            return InfluxColors.Rainforest
        else
            return InfluxColors.Mist
    }

    returnSliderColor = (score) => {
        if(score === 0)
            return ComponentColor.Warning
        else if(score > 0)
            return ComponentColor.Success
        else if(score < 0)
            return ComponentColor.Danger
        else
            return ComponentColor.Default
    }

    returnSliderColorCode = (score) => {
        if(score === 0)
            return InfluxColors.Pineapple
        else if(score > 0)
            return InfluxColors.Rainforest
        else if(score < 0)
            return InfluxColors.Rainforest
        else
            return InfluxColors.Mist
    }

    returnSliderText = (score) => {
        if(score === 0)
            return "AVERAGE"
        else if(score > 0)
            return "GOOD"
        else if(score < 0)
            return "BAD"
        else
            return "AVERAGE"
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
                              this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/rulreg-automl/${this.props["match"]["params"]["FID"]}/${this.props["match"]["params"]["PLID"]}/${this.props["match"]["params"]["MID"]}/${model["pipelineID"]}/duration`)
                          }
                          else{
                              this.props["history"].push(`/orgs/${this.props["match"]["params"]["orgID"]}/automl/${this.props["match"]["params"]["FID"]}/${this.props["match"]["params"]["PLID"]}/${this.props["match"]["params"]["MID"]}/${modelName}/duration`)
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
    
    setRootCauseParameters = (newParameters) => {
        this.setState({rootCauseParams: newParameters})
    }

    renderParameterTable = (selectedRootCauseModel) => {
        console.log(selectedRootCauseModel)
        if(selectedRootCauseModel != "") {
            this.setState({rootCauseParams: Array(Object.keys(rootCauseModelParameters[selectedRootCauseModel]).length).fill(0)})
            // const [rootCauseParams, setRootCauseParams] = useState(Array(Object.keys(rootCauseModelParameters[selectedRootCauseModel]).length).fill(0))
        
            return <ParameterTable rootCauseParams={this.state.rootCauseParams} setRootCauseParams={this.setRootCauseParameters} selectedRootCauseModel={selectedRootCauseModel}/>
        } else {
            return <></>
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
        const {enabledModelCount, criticalCount, likelyToFail, anomalyModelsCount, rulModelsCount, rulregModelsCount, pofModelsCount,
            isAnomalyInDanger, isRulInDanger, isRulregInDanger, isPofInDanger, anomalyModelsResultScore, rulModelsResultScore, rulregModelsResultScore, pofModelsResultScore} = this.getMLReportData()
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
                            <Grid.Column widthXS={Columns.One}>
                                <Page
                                    titleTag=""
                                    style={{height: "250px", border: 'solid 2px #999dab', borderRadius: '4px'}}
                                >
                                    <Panel.Body size={ComponentSize.Small}>
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
                                            <h4>
                                                {this.props.match.params.MID}
                                            </h4>
                                        </div>
                                        <Button
                                            shape={ButtonShape.Default}
                                            color={ComponentColor.Success}
                                            titleText="Refresh ML Report"
                                            icon={IconFont.Refresh}
                                            text={"Report"}
                                            type={ButtonType.Button}
                                            onClick={() => this.getMLReportData()}
                                        />
                                    </Panel.Body>
                                </Page>
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Eleven}>
                                <Page
                                    titleTag=""
                                    style={{height: "250px", border: 'solid 2px #999dab', borderRadius: '4px'}}
                                >
                                    {/* <Page.Header fullWidth={false}>
                                        <h5 className="preview-data-margins">ML Report</h5>
                                    </Page.Header> */}
                                    <Page.Contents
                                        fullWidth={true}
                                        scrollable={false}
                                        className="alert-history-page--contents"
                                    >
                                        <div style={{ height: '100%'}}>
                                            <Grid>
                                                <Grid.Row style={{marginTop: "10px", marginBottom: "10px"}}>
                                                    <Grid.Column widthXS={Columns.Twelve}>
                                                        <h5 className="preview-data-margins">ML Report</h5>
                                                    </Grid.Column>
                                                </Grid.Row>
                                                <Grid.Row style={{height: "125px"}}>
                                                    <Grid.Column widthXS={Columns.Five}>
                                                        <div style={{fontSize: "15px", color: InfluxColors.Amethyst}}>Number of Models:</div>
                                                        <Table>
                                                            <Table.Header>
                                                                <Table.Row>
                                                                    <Table.HeaderCell style={{width: "100px"}}>All</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{width: "100px"}}>Anomaly</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{width: "100px"}}>RUL</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{width: "100px"}}>RULREG</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{width: "100px"}}>POF</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{width: "100px"}}>Critical</Table.HeaderCell>
                                                                </Table.Row>
                                                            </Table.Header>
                                                            <Table.Body>
                                                                <Table.Row>
                                                                    <Table.Cell style={{width: "100px"}}>{enabledModelCount}</Table.Cell>
                                                                    <Table.Cell style={{width: "100px"}}>{anomalyModelsCount}</Table.Cell>
                                                                    <Table.Cell style={{width: "100px"}}>{rulModelsCount}</Table.Cell>
                                                                    <Table.Cell style={{width: "100px"}}>{rulregModelsCount}</Table.Cell>
                                                                    <Table.Cell style={{width: "100px"}}>{pofModelsCount}</Table.Cell>
                                                                    <Table.Cell style={{width: "100px"}}>{criticalCount}</Table.Cell>
                                                                </Table.Row>
                                                            </Table.Body>
                                                        </Table>
                                                        <div style={{color: this.returnFooterColor(likelyToFail), fontSize: "15px"}}>Likely to fail (%): {likelyToFail}</div>
                                                        {/* <Label
                                                            size={ComponentSize.Small}
                                                            name={`Enabled Model Count: ${enabledModelCount}`}
                                                            description={""}
                                                            color={InfluxColors.Pool}
                                                            id={"icon-label"} 
                                                        />
                                                        <Label
                                                            size={ComponentSize.Small}
                                                            name={`Critical Result Count: ${criticalCount}`}
                                                            description={""}
                                                            color={InfluxColors.Fire}
                                                            id={"icon-label"} 
                                                            style={{marginLeft: "5px"}}
                                                        />
                                                        <br/><br/>
                                                        <Label
                                                            size={ComponentSize.Small}
                                                            name={`Anomaly Model Count: ${anomalyModelsCount}`}
                                                            description={""}
                                                            color={InfluxColors.Moonstone}
                                                            id={"icon-label"} 
                                                            //style={{marginLeft: "5px"}}
                                                        />
                                                        <Label
                                                            size={ComponentSize.Small}
                                                            name={`RUL Model Count:: ${rulModelsCount}`}
                                                            description={""}
                                                            color={InfluxColors.Magenta}
                                                            id={"icon-label"} 
                                                            style={{marginLeft: "5px"}}
                                                        />
                                                        <br/><br/>
                                                        <Label
                                                            size={ComponentSize.Small}
                                                            name={`RULREG Model Count:: ${rulregModelsCount}`}
                                                            description={""}
                                                            color={InfluxColors.Pulsar}
                                                            id={"icon-label"} 
                                                            // style={{marginLeft: "5px"}}
                                                        />
                                                        <Label
                                                            size={ComponentSize.Small}
                                                            name={`POF Model Count:: ${pofModelsCount}`}
                                                            description={""}
                                                            color={InfluxColors.Galaxy}
                                                            id={"icon-label"} 
                                                            style={{marginLeft: "5px"}}
                                                        />
                                                        <br/><br/>
                                                        <Label
                                                            size={ComponentSize.Small}
                                                            name={`Likely to fail (%): ${likelyToFail}`}
                                                            description={""}
                                                            color={InfluxColors.Topaz}
                                                            id={"icon-label"} 
                                                        /> */}
                                                    </Grid.Column>  
                                                    <Grid.Column widthXS={Columns.Seven} style={{border: `solid 2px ${InfluxColors.Galaxy}`}}>
                                                        <Panel backgroundColor={InfluxColors.Raven} style={{fontSize: "13px"}}>
                                                            {/* <Panel.Header>
                                                                <h2></h2>
                                                            </Panel.Header> */}
                                                            <Panel.Body>
                                                                <Grid>
                                                                    <Grid.Row>
                                                                        <Grid.Column widthXS={Columns.Twelve}>
                                                                            <div>There are <span style={{color: InfluxColors.Pool, fontWeight: 500}}>{enabledModelCount}</span> models enabled. The score calculated for models as <span style={{color: InfluxColors.Fire, fontWeight: 500}}>"-1"</span> if failure is predicted to be happen and <span style={{color: InfluxColors.Honeydew, fontWeight: 500}}>"+1"</span> if no failure is predicted.</div><br/>
                                                                        </Grid.Column>
                                                                    </Grid.Row>
                                                                    <Grid.Row>
                                                                        <Grid.Column widthXS={Columns.Six}>
                                                                            <div>Total Score of Anomaly Models: <span style={{color: this.returnSpanColor(anomalyModelsResultScore), fontWeight: 500}}>{anomalyModelsResultScore}</span></div>
                                                                            <div>Total Score of RUL Models: <span style={{color: this.returnSpanColor(rulModelsResultScore), fontWeight: 500}}>{rulModelsResultScore}</span></div>
                                                                            <div>Total Score of RULReg Models: <span style={{color: this.returnSpanColor(rulregModelsResultScore), fontWeight: 500}}>{rulregModelsResultScore}</span></div>
                                                                            <div>Total Score of POF Models: <span style={{color: this.returnSpanColor(pofModelsResultScore), fontWeight: 500}}>{pofModelsResultScore}</span></div>
                                                                            <div><span style={{color: InfluxColors.Laser}}>Total Score of All Models in the</span> <span style={{color: InfluxColors.Pool, fontWeight: 500}}>(+{enabledModelCount},-{enabledModelCount})</span> <span style={{color: InfluxColors.Laser}}>range:</span> <span style={{color: this.returnSpanColor(anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore), fontWeight: 500}}>{anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore}</span></div>
                                                                        </Grid.Column>
                                                                        <Grid.Column widthXS={Columns.Six}>
                                                                            <ScoreSlider
                                                                                aria-label="Always visible"
                                                                                defaultValue={0}
                                                                                value={anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore}
                                                                                getAriaValueText={()=>anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore + ""}
                                                                                step={enabledModelCount*2}
                                                                                /* marks={[{
                                                                                    value: -1*enabledModelCount,
                                                                                    label: `${-1*enabledModelCount}`,
                                                                                },{
                                                                                    value: enabledModelCount,
                                                                                    label: `${enabledModelCount}`,
                                                                                }]} */
                                                                                valueLabelDisplay="on"
                                                                                min={-1*enabledModelCount} 
                                                                                max={enabledModelCount} 
                                                                                style={{marginBottom: "0px", marginTop: "10px"}}
                                                                                scoreColor={this.returnSliderColorCode(anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore)}
                                                                                //disabled={true}
                                                                                //color={this.returnSliderColor(anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore)}
                                                                            />
                                                                            <div>
                                                                                <span style={{float: "left"}}>{-1*enabledModelCount}</span>
                                                                                <span style={{float: "right"}}>{enabledModelCount}</span>
                                                                            </div>
                                                                            <Heading
                                                                                element={HeadingElement.H1}
                                                                                type={Typeface.Rubik}
                                                                                weight={FontWeight.Regular}
                                                                                //className="cf-funnel-page--title"
                                                                                style={{textAlign: "center", color: this.returnFooterColor(anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore)}}
                                                                            >{this.returnSliderText(anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore)}
                                                                            </Heading>
                                                                        </Grid.Column>
                                                                    </Grid.Row>
                                                                </Grid>
                                                                    {/* <RangeSlider 
                                                                        color={this.returnSliderColor(anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore)} 
                                                                        onChange={(e)=>console.log(e)} 
                                                                        //status={ComponentStatus.Disabled} 
                                                                        value={anomalyModelsResultScore + rulModelsResultScore + rulregModelsResultScore + pofModelsResultScore} 
                                                                        min={-1*enabledModelCount} 
                                                                        max={enabledModelCount} 
                                                                        step={enabledModelCount*2} 
                                                                    /> */}
                                                                
                                                                {/* <div><span style={{color: InfluxColors.Galaxy}}>Class 0</span> shows the number of non-failure examples we have: <span style={{color: InfluxColors.Galaxy}}>{}</span></div><br/>
                                                                <div><span style={{color: InfluxColors.Ruby}}>Class 1</span> shows the number of failure examples we have: <span style={{color: InfluxColors.Ruby}}>{}</span></div> */}
                                                            </Panel.Body>
                                                        </Panel>
                                                        {/* <GradientBox
                                                            borderGradient={Gradients.MiyazakiSky}
                                                            borderColor={InfluxColors.Raven}
                                                        >                                                            
                                                            <DapperScrollbars
                                                                autoHide={false}
                                                                autoSizeHeight={false}
                                                                style={{height: "125px", maxHeight: '125px' }}
                                                                className="data-loading--scroll-content"
                                                            >
                                                                
                                                            </DapperScrollbars>
                                                        </GradientBox> */}
                                                    </Grid.Column> 
                                                    {/* <Grid.Column widthXS={Columns.Two}>
                                                        
                                                    </Grid.Column>
                                                    <Grid.Column widthXS={Columns.Two}>
                                                        
                                                    </Grid.Column>
                                                    <Grid.Column widthXS={Columns.Two}>
                                                        
                                                    </Grid.Column>
                                                    <Grid.Column widthXS={Columns.Two}>
                                                        
                                                    </Grid.Column> */}
                                                </Grid.Row>
                                                <Grid.Row style={{marginTop: "10px"}}>
                                                    
                                                </Grid.Row>
                                            </Grid>
                                        </div>
                                    </Page.Contents>
                                </Page>    
                            </Grid.Column>                        
                        </Grid.Row>
                        <Page
                            titleTag=""
                            style={{height: this.state.showAnomalyChartSection ? "800px" : "100px", marginTop: "20px", border: 'solid 2px #999dab', borderRadius: '4px'}}
                        >
                            <Page.Header fullWidth={false}>
                                <Page.Title title="Anomaly Charts" />
                                <div className="tabbed-page--header-right">
                                    <Button
                                        shape={ButtonShape.Default}
                                        color={ComponentColor.Secondary}
                                        titleText=""
                                        icon={this.state.showAnomalyChartSection ? IconFont.Collapse : IconFont.Plus}
                                        text={this.state.showAnomalyChartSection ? "Minimize" : "Maximize"}
                                        type={ButtonType.Button}
                                        onClick={() => this.setState({showAnomalyChartSection: !this.state.showAnomalyChartSection})}
                                    />
                                </div>
                            </Page.Header>
                            {this.state.showAnomalyChartSection ?
                            <Page.Contents
                                className="models-index__page-contents"
                                fullWidth={false}
                                scrollable={true}
                            >
                                {this.state.anomalyModels.length ? (
                                    <TabbedPageTabs
                                        tabs={this.createTabs()}
                                        activeTab={this.state.activeAnomalyModel}
                                        onTabClick={(id) => this.setState({ activeAnomalyModel: id, selectedModelID: id })}
                                    />
                                ) : <></>}
                                
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
                            </Page.Contents> : <></> }
                        </Page>
                        <Page
                            titleTag=""
                            style={{height: this.state.showFailureListSection ? "400px" : "100px", marginTop: "20px", border: 'solid 2px #999dab', borderRadius: '4px'}}
                        >
                            <Page.Header fullWidth={false}>
                                <Page.Title title="Failure List" />
                                <div className="tabbed-page--header-right">
                                    <Button
                                        shape={ButtonShape.Default}
                                        color={ComponentColor.Secondary}
                                        titleText=""
                                        icon={this.state.showFailureListSection ? IconFont.Collapse : IconFont.Plus}
                                        text={this.state.showFailureListSection ? "Minimize" : "Maximize"}
                                        type={ButtonType.Button}
                                        onClick={() => this.setState({showFailureListSection: !this.state.showFailureListSection})}
                                    />
                                </div>
                            </Page.Header>
                            <RootCauseAnalysisOverlay 
                                createModelOverlay={this.state.rootCauseAnalysisOverlay}
                                closeOverlay={() => this.setState({ rootCauseAnalysisOverlay: !this.state.rootCauseAnalysisOverlay })}
                                failure={this.state.selectedFailure}
                                rootCauseModels={this.state.rootCauseModels}
                                dtData={this.state.dtData}
                            />  
                            {this.state.showFailureListSection ?
                            <Page.Contents
                                className="models-index__page-contents"
                                fullWidth={false}
                                scrollable={true}
                            >
                                {/* <DapperScrollbars
                                    autoHide={false}
                                    autoSizeHeight={true}
                                    style={{ maxHeight: '50px' }}
                                    className="data-loading--scroll-content"
                                >
                                    <Table
                                        borders={BorderType.Vertical}
                                        fontSize={ComponentSize.ExtraSmall}
                                        cellPadding={ComponentSize.ExtraSmall}
                                    >
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell style={{width: "100px"}}>Start Time</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>End Time</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "70px"}}>Type</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "70px"}}>Varlık Kodu</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>İş Tipi Tanımı</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Arıza Komp Tanım</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                    </Table>
                                </DapperScrollbars> */}
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
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell style={{width: "100px"}}>Start Time</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>End Time</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "70px"}}>Type</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "70px"}}>Asset Code</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Job Type</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Target Component</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {this.state.failures.map((failure, i) => {
                                                let startTimeDate = new Date(failure["startTime"])
                                                let endTimeDate = new Date(failure["endTime"])
                                                return (
                                                <Table.Row key={uuid.v4()}>
                                                    <Table.Cell style={{width: "100px"}}>
                                                        {(startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.toLocaleString() : "-"}
                                                    </Table.Cell>
                                                    <Table.Cell style={{width: "100px"}}>
                                                        {(endTimeDate instanceof Date && !isNaN(endTimeDate.valueOf())) ? endTimeDate.toLocaleString() : "-"}
                                                    </Table.Cell>
                                                    <Table.Cell style={{width: "70px"}}>
                                                        {failure["type"]}
                                                    </Table.Cell>
                                                    <Table.Cell style={{width: "70px"}}>
                                                        {failure["VARLIKKODU"]}
                                                    </Table.Cell>
                                                    <Table.Cell style={{width: "100px"}}>
                                                        {failure["ISTIPITANIMI"]}
                                                    </Table.Cell>
                                                    <Table.Cell style={{width: "100px"}}>
                                                        {failure["ARZKOMPTANIM"]}
                                                    </Table.Cell>
                                                    <Table.Cell style={{width: "30px"}}>
                                                        <QuestionMarkTooltip
                                                            style={{ marginLeft: "5px" }}
                                                            diameter={15}
                                                            color={ComponentColor.Secondary}
                                                            tooltipContents={failure["description"]}
                                                        />
                                                    </Table.Cell>
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
                                            )})}
                                        </Table.Body>
                                    </Table>
                                </DapperScrollbars>
                            </Page.Contents> : <></> }
                        </Page>
                        <Page
                            className="load-data-page"
                            titleTag=""
                            style={{height: this.state.showMLModelsSection ? "500px" : "100px", marginTop: "20px", border: 'solid 2px #999dab', borderRadius: '4px'}}
                        >
                            <Page.Header fullWidth={false}>
                                <Page.Title title="ML Models" />
                                {this.state.showMLModelsSection ? <>     
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
                                        <CreateModelOverlay 
                                            handleChangeNotification={this.handleChangeNotification}
                                            username={this.props.me.name}
                                            isComponent={this.isComponent()}
                                            parentParams={this.props["match"].params}
                                            createModelOverlay={this.state.createModelOverlay}
                                            closeOverlay={() => this.setState({ createModelOverlay: !this.state.createModelOverlay })}
                                        />
                                        <MLReportOverlay 
                                            handleChangeNotification={this.handleChangeNotification}
                                            username={this.props.me.name}
                                            parentParams={this.props["match"].params}
                                            mlReportOverlay={this.state.mlReportOverlay}
                                            closeOverlay={() => this.setState({ mlReportOverlay: !this.state.mlReportOverlay })}
                                        />
                                        <RefreshLogsDropdown
                                            selected={this.state.autoRefresh}
                                            onChoose={this.handleChooseAutoRefresh}
                                            onManualRefresh={()=>this.getMLModels()}
                                            showManualRefresh={true}
                                        />
                                        <Button
                                            icon={IconFont.Plus}
                                            color={ComponentColor.Success}
                                            text={"Add Model"}
                                            onClick={()=>this.setState({createModelOverlay: !this.state.createModelOverlay})}
                                        />
                                        <Button
                                            shape={ButtonShape.Default}
                                            color={ComponentColor.Secondary}
                                            titleText=""
                                            icon={this.state.showMLModelsSection ? IconFont.Collapse : IconFont.Plus}
                                            text={this.state.showMLModelsSection ? "Minimize" : "Maximize"}
                                            type={ButtonType.Button}
                                            onClick={() => this.setState({showMLModelsSection: !this.state.showMLModelsSection})}
                                        />
                                    </div> 
                                </> : <><Button
                                    shape={ButtonShape.Default}
                                    color={ComponentColor.Secondary}
                                    titleText=""
                                    icon={this.state.showMLModelsSection ? IconFont.Collapse : IconFont.Plus}
                                    text={this.state.showMLModelsSection ? "Minimize" : "Maximize"}
                                    type={ButtonType.Button}
                                    onClick={() => this.setState({showMLModelsSection: !this.state.showMLModelsSection})}
                                /></>}                     
                            </Page.Header>
                            <ModelLogGraphOverlay
                                modelLogGraphOverlay={this.state.modelLogGraphOverlay}
                                closeOverlay={()=>this.setState({modelLogGraphOverlay: !this.state.modelLogGraphOverlay})}
                                model={this.state.selectedModel}
                            />
                            {this.state.showMLModelsSection ? 
                            <Page.Contents
                                //className="models-index__page-contents"
                                fullWidth={false}
                                scrollable={true}
                            >
                                {this.state.displayedModels.length === 0 && (
                                            <h4>There are no models created yet</h4>
                                        )}
                                <Tabs.TabContents>
                                <div
                                    className="write-data--section"
                                    data-testid={`write-model-section`}
                                >
                                    <SquareGrid cardSize="200px" gutter={ComponentSize.Small}>
                                    
                                            {this.state.displayedModels.map((model, i) => (
                                                <ResourceCard
                                                    key={uuid.v4()}
                                                    contextMenu={this.contextMenu(model["modelName"], model["enabled"], model["task"], model)}
                                                    style={model["enabled"] ? {background: "#afdf80", color:"red !important", height: "170px"} : {height: "170px"}}
                                                >
                                                    <ResourceCard.Name
                                                        name={`Task: ${model["task"]}`}
                                                        style={{color: "red !important"}}
                                                    >
                                                        <div>Test children</div>
                                                    </ResourceCard.Name>
                                                    {((("trainingDone" in model) && !model["trainingDone"]) || (!("trainingDone" in model))) && (<>
                                                        <SparkleSpinner style={{alignSelf: "center"}} sizePixels={75} loading={RemoteDataState.Loading} />
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
                                                            style={{marginTop: "12.5%", marginBottom: "12.5%", height: "50px"}}
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
                                                        <div style={{ width: 'auto', height: '85px' }}>
                                                            <SingleStat
                                                                key={uuid.v4()}
                                                                stat={modelsLastLogs[model["pipelineID"]] ? modelsLastLogs[model["pipelineID"]]["prediction"] : "-"}
                                                                style={{width: "90%", height: "100%", top: "auto", bottom: "-5px", right: "auto", left: "auto"}}
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
                                                                    suffix: ' cycles',
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
                                                            <div style={{ width: 'auto', height: '55px' }}>
                                                                {/* <GaugeChart
                                                                    key={uuid.v4()}
                                                                    value={modelsLastLogs[model["modelID"]] ? this.findProbability(modelsLastLogs[model["modelID"]]["prediction"][0], modelsLastLogs[model["modelID"]]["prediction"][1], this.state.pofDaysSent) : ""}
                                                                    properties={this.state.gaugeProperties}
                                                                    theme={'dark'}
                                                                />    */}     
                                                                <ProgressBar
                                                                    label=""
                                                                    value={modelsLastLogs[model["modelID"]] ? this.findProbability(modelsLastLogs[model["modelID"]]["prediction"][0], modelsLastLogs[model["modelID"]]["prediction"][1], this.state.pofDaysSent) : 0}
                                                                    color={InfluxColors.Comet}
                                                                    barGradient={Gradients.JungleDusk}
                                                                    max={100}
                                                                />   
                                                                {/* <ProgressBar
                                                                    label=""
                                                                    value={99}
                                                                    color={InfluxColors.Comet}
                                                                    barGradient={Gradients.JungleDusk} //{start: InfluxColors.Rainforest, stop: InfluxColors.Fire}
                                                                    max={100}
                                                                />   */}                                     
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
                                                    }{
                                                        model["trainingDone"] && (model["task"] === "ad" )&& 
                                                        <>
                                                            <div style={{ width: 'auto', height: '100px' }}>
                                                                <Grid>
                                                                <Grid.Column widthXS={Columns.Three} >

                                                                    <Grid.Row>
                                                                    {/* <Grid.Column>
                                                                        Previous Cycle:
                                                                    </Grid.Column> */}
                                                                        <div className="tabbed-page--header-left">
                                                                            <Label
                                                                                size={ComponentSize.ExtraSmall}
                                                                                name={modelsLastLogs[model["modelID"]]["prevCount"]}
                                                                                description={"Anomaly Count for Previous Cycle"}
                                                                                color={InfluxColors.Rainforest}
                                                                                id={"icon-label"} 
                                                                            />
                                                                        </div>
                                                                    </Grid.Row>
                                                                    <div></div>
                                                                    <Grid.Row></Grid.Row>
                                                                    <Grid.Row>
                                                                    {/* <Grid.Column>
                                                                        Most Recent Cycle:
                                                                    </Grid.Column> */}
                                                                    {/* <Grid.Column> */}
                                                                        <div className="tabbed-page--header-left">
                                                                            <Label
                                                                                size={ComponentSize.ExtraSmall}
                                                                                name={modelsLastLogs[model["modelID"]]["count"]}
                                                                                description={"Anomaly Count for Most Recent Cycle"}
                                                                                color={InfluxColors.Rainforest}
                                                                                id={"icon-label"} 
                                                                            />
                                                                        </div>
                                                                    {/* </Grid.Column> */}
                                                                    </Grid.Row>
                                                                    {/* </Grid.Column> */}
                                                                </Grid.Column>
                                                                    <Grid.Column widthXS={Columns.Three}>
                                                                    <Grid.Row></Grid.Row>
                                                                    <Grid.Row>
                                                                    <div className="tabbed-page--header-left">
                                                                            <Label
                                                                                size={ComponentSize.ExtraSmall}
                                                                                name={(100*(modelsLastLogs[model["modelID"]]["count"] - modelsLastLogs[model["modelID"]]["prevCount"]) / modelsLastLogs[model["modelID"]]["prevCount"]).toString()}
                                                                                description={"Change as Percentage"}
                                                                                color={InfluxColors.Rainforest}
                                                                                id={"icon-label"} 
                                                                            />
                                                                        </div>
                                                                    </Grid.Row>
                                                                    </Grid.Column>
                                                                </Grid>
                                                            </div>

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
                                    </SquareGrid>
                                </div>
                                </Tabs.TabContents>
                            </Page.Contents> : <></>}
                        </Page>
                        <Page
                            className="load-data-page"
                            titleTag=""
                            style={{height: this.state.showRootCauseSection ? "500px" : "100px", marginTop: "20px", border: 'solid 2px #999dab', borderRadius: '4px'}}
                        >
                            <Page.Header fullWidth={false}>
                                <Page.Title title="Root Cause Analysis" />
                                <div className="tabbed-page--header-right">
                                <Button
                                        shape={ButtonShape.Default}
                                        color={ComponentColor.Secondary}
                                        titleText=""
                                        icon={this.state.showRootCauseSection ? IconFont.Collapse : IconFont.Plus}
                                        text={this.state.showRootCauseSection ? "Minimize" : "Maximize"}
                                        type={ButtonType.Button}
                                        onClick={() => this.setState({showRootCauseSection: !this.state.showRootCauseSection})}
                                    />
                                </div>
                                {this.state.showRootCauseSection ? <>

                                    {/* <div className="tabbed-page--header-right">
                                    </div>  */}
                                </> : <></>}                     
                            </Page.Header>
                            <ModelLogGraphOverlay
                                modelLogGraphOverlay={this.state.modelLogGraphOverlay}
                                closeOverlay={()=>this.setState({modelLogGraphOverlay: !this.state.modelLogGraphOverlay})}
                                model={this.state.selectedModel}
                            />
                            {this.state.showRootCauseSection ? 
                            <Page.Contents
                                //className="models-index__page-contents"
                                fullWidth={false}
                                scrollable={true}
                            >
                                <Grid>
                                <Grid.Row>
                                <Grid.Column
                                    widthXS={Columns.Two}
                                    widthSM={Columns.Two}
                                    widthMD={Columns.Two}
                                    widthLG={Columns.Two}
                                    style={{ marginTop: '20px' }}
                                >
                                    <SelectDropdown
                                        style={{width: "150px"}}
                                        options={this.state.failures.map(failure => {
                                            let failureStart = new Date(failure["startTime"])
                                            let failureEnd = new Date(failure["endTime"])
                                            
                                            return failure["ARZKOMPTANIM"]
                                        })}
                                        selectedOption={this.state.failureToAnalyze}
                                        onSelect={(e) => {
                                            this.setState({failureToAnalyze: e, topLevelTreeComponent: ""})
                                            this.state.failures.forEach((failure) => {
                                                if(failure["ARZKOMPTANIM"] === e) {
                                                    this.setState({rootCauseEndDate: failure["startTime"]})
                                                }
                                            })
                                            this.bringPossibleComps()
                                        }}
                                    />
                                    <br></br>
                                    <br></br>
                                    <SelectDropdown
                                        style={{width: "150px"}}
                                        options={this.state.rootCausePossibleComps}
                                        selectedOption={this.state.compToAnalyze}
                                        onSelect={(e) => {
                                            this.setState({compToAnalyze: e})
                                            this.createRootCauseGraph()
                                        }}
                                    />
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Six}
                                    widthSM={Columns.Six}
                                    widthMD={Columns.Six}
                                    widthLG={Columns.Six}
                                    style={{ marginTop: '20px' }}>
                                <Panel>
                                    <Panel.Header size={ComponentSize.ExtraSmall}>
                                    </Panel.Header>
                                    <Panel.Body size={ComponentSize.ExtraSmall} id={"graphDiv"}>
                                        {Object.keys(this.state.rootCauseGraphData).length == 0 ? (
                                            <SpinnerContainer
                                            loading={this.state.rootCauseTreeLoading}
                                            spinnerComponent={<TechnoSpinner />}
                                            />
                                        ):(
                                            <ForceGraph2D
                                            ref={element => { this.graphRef = element }}
                                            onNodeClick={this.handleNodeClick}
                                            width={750}
                                            height={500}
                                            linkDirectionalParticles={3}
                                            linkDirectionalParticleWidth={5}
                                            linkDirectionalArrowRelPos={1}
                                            dagMode={'td'}
                                            dagLevelDistance={50}
                                            graphData={this.state.rootCauseGraphData}/>
                                        ) }
                                    </Panel.Body>
                                </Panel>
                                </Grid.Column>
                                <Grid.Column
                                    widthXS={Columns.Four}
                                    widthSM={Columns.Four}
                                    widthMD={Columns.Four}
                                    widthLG={Columns.Four}
                                    style={{ marginTop: '20px' }}
                                >
                                    <Table>
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell style={{width: "100px"}}>Selected Failure</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Top Level Component</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Model</Table.HeaderCell>
                                                {/* <Table.HeaderCell style={{width: "100px"}}>RUL</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>RULREG</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>POF</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Critical</Table.HeaderCell> */}
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell style={{width: "100px"}}>{this.state.failureToAnalyze}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{this.state.topLevelTreeComponent}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{
                                                    <SelectDropdown
                                                    style={{width: "100px"}}
                                                    buttonColor={ComponentColor.Secondary}
                                                    options={this.state.rootCauseModels}
                                                    selectedOption={this.state.selectedRootCauseModel}
                                                    onSelect={(e) => {
                                                        this.setState({selectedRootCauseModel: e, rootCauseParams: Array(Object.keys(rootCauseModelParameters[e]).length).fill(0)})
                                                    }}
                                                />
                                                }</Table.Cell>

                                                {/* <Table.Cell style={{width: "100px"}}>{rulModelsCount}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{rulregModelsCount}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{pofModelsCount}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{criticalCount}</Table.Cell> */}
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>
                                    <br></br>
                                    <br></br>
                                    {this.state.selectedRootCauseModel !== "" ? (
                                        // this.setState({rootCauseParams: Array(Object.keys(rootCauseModelParameters[selectedRootCauseModel]).length).fill(0)})
                                        <ParameterTable rootCauseParams={this.state.rootCauseParams} setRootCauseParams={this.setRootCauseParameters} selectedRootCauseModel={this.state.selectedRootCauseModel}/>

                                    ):(<></>)}
                                    <br></br>
                                    <br></br>
                                    <Button
                                        color={ComponentColor.Secondary}
                                        titleText="Start Root Cause Analysis"
                                        text="START"
                                        type={ButtonType.Button}
                                        onClick={this.startRootCauseAnalysis}
                                    />
                                </Grid.Column>
                                </Grid.Row></Grid>
                                    

                            </Page.Contents> : <></>}
                        </Page>
                        {/* <Grid.Row style={{marginTop: "20px"}}>
                            <Grid.Column widthXS={Columns.Two}>
                                <div className="tabbed-page--header-left">
                                    <CTAButton
                                        icon={IconFont.TextBlock}
                                        color={ComponentColor.Secondary}
                                        text={"Generate Report"}
                                        onClick={()=>this.setState({mlReportOverlay: !this.state.mlReportOverlay})}
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
                                <MLReportOverlay 
                                    handleChangeNotification={this.handleChangeNotification}
                                    username={this.props.me.name}
                                    parentParams={this.props["match"].params}
                                    mlReportOverlay={this.state.mlReportOverlay}
                                    closeOverlay={() => this.setState({ mlReportOverlay: !this.state.mlReportOverlay })}
                                />
                            </Grid.Column>
                        </Grid.Row> */}
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

