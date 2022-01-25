import React, { PureComponent } from 'react'
import {
    Page, Grid, Columns, Panel,
    Overlay, ComponentColor, ComponentSize, IconFont, Icon, InfluxColors, TechnoSpinner,
    WaitingText, Button, ButtonType, SelectDropdown, 
    BorderType, Table, SlideToggle, InputLabel, Label,
} from '@influxdata/clockface'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import AnomalyMetricGraph from '../anomalyMonitor/AnomalyMetricGraph'
import AnomalyMetricTimelineGraph from '../anomalyMonitor/AnomalyMetricTimelineGraph'
import MetricsTable from '../monitorComponents/MetricsTable'
import ReportWrapper from '../monitorComponents/ReportWrapper'
import InfluxDataWrapper from '../monitorComponents/InfluxDataWrapper'
import ProbabilityGraph from './ProbabilityGraph'
import {TimeRange} from 'src/types'

// Services
import AutoMLService from 'src/shared/services/AutoMLService';

interface Props {
}

interface State {
    timeRange: TimeRange
    activeGraph: string
    reportPath: string
    publicReportPath: string
    report: string
    probabilities: object[]
    shownProbabilities: object[]
    machine: string
    component: string
    sensor: string
    selectedPoint: object
}

class POFMonitorPage extends PureComponent<Props, State>{
    state = {
        timeRange: {
            seconds: 86400,
            lower: "now() - 24h",
            upper: null,
            label: "Past 24h",
            duration: "24h",
            type: "selectable-duration",
            windowPeriod: 240000
        },
        activeGraph: "graph1",
        reportPath: "iris_model_performance_dashboard.html",
        publicReportPath: "",
        report: "",
        probabilities: [{date: "2022-01-10T07:30:24.27835414Z", probability: "0.25"},
        {date: "2022-01-12T17:20:24.27835414Z", probability: "0.33"},{date: "2022-01-15T07:30:24.27835414Z", probability: "0.30"},
        {date: "2022-01-17T21:10:24.27835414Z", probability: "0.42"},{date: "2022-01-18T14:30:24.27835414Z", probability: "0.45"},
        {date: "2022-01-18T17:20:24.27835414Z", probability: "0.33"},{date: "2022-01-19T07:30:24.27835414Z", probability: "0.30"},
        {date: "2022-01-19T14:10:24.27835414Z", probability: "0.42"},{date: "2022-01-20T08:30:24.27835414Z", probability: "0.45"},
        {date: "2022-01-20T14:10:24.27835414Z", probability: "0.42"},{date: "2022-01-20T20:30:24.27835414Z", probability: "0.45"},],
        shownProbabilities: [],
        machine: "Ermetal",
        component: "Press030",
        sensor: "Deng_hava_debi_act",
        selectedPoint: null,
    }

    async componentDidMount() {
        const report = await AutoMLService.getMLReport(this.state.reportPath)
        this.handleChooseTimeRange(this.state.timeRange)
        this.setState({report: report["report"], publicReportPath: "public/" + this.state.reportPath})
        
    }

    createGraphData = () => {
        let data = this.state.shownProbabilities
        let gdata = []
        let points = {"id": "Failure Probability"}
        for(let point of data){
            let p = {}
            p["x"] = point["date"]
            p["y"] = point["probability"]
            gdata.push(p)
        }
        points["data"] = gdata
        return [points]
    }

    checkDate = (from, to, date) =>{
        if(date<=to && date>=from){
            return true
        }
        return false
    }

    handleChooseTimeRange = (timeRange: TimeRange) => {
        this.setState({ timeRange: timeRange })
        let to = new Date()
        let from = new Date(to.getTime()-60*60**24*1000) // -1h
        if(timeRange.type == "selectable-duration"){
            to = new Date()
            from = new Date(to.getTime()-timeRange.seconds*1000)
        }
        else if(timeRange.type == "custom"){
            to = new Date(timeRange.upper)
            from = new Date(timeRange.lower)
        }
        let probabilities = this.state.probabilities
        let shownProbabilities = []
        for(let probability of probabilities){
            if(this.checkDate(from, to, new Date(probability["date"]))){
                shownProbabilities.push(probability)
            }
        }
        this.setState({shownProbabilities: shownProbabilities})
        console.log(shownProbabilities, timeRange)
    }

    setSelectedPoint = (point) => {
        console.log(point)
        this.setState({selectedPoint: point})
    }

    public render(){
        //var htmlModule = require(this.state.reportPath);
        //var html = htmlModule.default
        return(
            <Page
                titleTag="Probability of Failure Model Monitor Page"
                className="alert-history-page"
            >
                <Page.Header fullWidth={true}>
                    <Page.Title
                        title="Probability of Failure Model Monitor Page"
                        testID="alert-history-title"
                    />
                </Page.Header>
                <Page.ControlBar fullWidth={true}>
                    <Page.ControlBarRight> 
                        <TimeRangeDropdown
                            onSetTimeRange={this.handleChooseTimeRange}
                            timeRange={this.state.timeRange}
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
                            <Grid.Column widthXS={Columns.Twelve}>
                                <Panel>
                                    <Panel.Header size={ComponentSize.Medium}>
                                        <h5 className="preview-data-margins">Model's Probability Estimation Graph</h5>
                                    </Panel.Header>
                                    <Panel.Body size={ComponentSize.Small}>
                                        <div style={{ height: '475px', background: "white", color: "black" }}>
                                            <ProbabilityGraph data={this.createGraphData()} setSelectedPoint={this.setSelectedPoint}/>
                                        </div>
                                    </Panel.Body>
                                </Panel>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Twelve}>
                                {this.state.selectedPoint ? (
                                    <InfluxDataWrapper 
                                        orgID={this.props.match.params.orgID}
                                        date={this.state.selectedPoint["data"]["x"]}
                                        machine={this.state.machine}
                                        component={this.state.component}
                                        sensor={this.state.sensor}
                                    />
                                ) : (<></>)}                                
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Twelve}>
                                <MetricsTable timeRange={this.state.timeRange} metricNames={metricNames} modelMetrics={modelMetrics}/>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>                            
                            {this.state.report.length ? 
                                (
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <ReportWrapper 
                                        html={this.state.report} 
                                        path={this.state.publicReportPath}
                                    />
                                </Grid.Column>) : (
                                <Grid.Column widthXS={Columns.Twelve} style={{textAlign: "-webkit-center"}}>
                                    <TechnoSpinner style={{ width: "75px", height: "75px" }} />
                                    <WaitingText text="Report is loading" />
                                </Grid.Column>
                            )}                            
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Twelve}>
                                <Panel>
                                    <Panel.Header size={ComponentSize.Medium}>
                                        <h5 className="preview-data-margins">Model Graphs</h5>
                                    </Panel.Header>
                                    <Panel.Body size={ComponentSize.Small}>
                                        <TabbedPageTabs
                                            tabs={[{
                                                text: 'Graph1',
                                                id: 'graph1',
                                            },
                                            {
                                                text: 'Graph2',
                                                id: 'graph2',
                                            },]}
                                            activeTab={this.state.activeGraph}
                                            onTabClick={(e) => this.setState({ activeGraph: e })}
                                        />
                                        <br />
                                        {this.state.activeGraph === "graph1" &&
                                        <Grid.Row style={{textAlign: "-webkit-center", background: InfluxColors.Obsidian}}>
                                            <Grid.Column widthXS={Columns.Twelve}>
                                            <div style={{ height: "450px", width: "1000px", alignSelf: "center", color: "black"}}>
                                                <AnomalyMetricGraph data={modeldata} models={["training", "production"]} />
                                            </div>
                                            </Grid.Column>
                                        </Grid.Row>                      
                                        }
                                        {this.state.activeGraph === "graph2" &&                      
                                            <AnomalyMetricTimelineGraph data={timelineData} onClick={(e)=>console.log(e)}/>
                                        }
                                        <div>Content for {this.state.activeGraph}</div>
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

export default POFMonitorPage

const modelMetrics = [
    { "anomalyCount": 15, "correctAnomalyCount": 11, "incorrectAnomalyCount": 4, "temporalDistance": 320, "fprecision": 0.6, "frecall": 0.8 },
    { "anomalyCount": 7, "correctAnomalyCount": 3, "incorrectAnomalyCount": 4, "temporalDistance": 150, "fprecision": 0.5, "frecall": 0.56 },
    { "anomalyCount": 0, "correctAnomalyCount": 0, "incorrectAnomalyCount": 0, "temporalDistance": 0, "fprecision": 0, "frecall": 0 },
    { "anomalyCount": 20, "correctAnomalyCount": 16, "incorrectAnomalyCount": 4, "temporalDistance": 130, "fprecision": 0.82, "frecall": 0.83 },
    { "anomalyCount": 17, "correctAnomalyCount": 2, "incorrectAnomalyCount": 15, "temporalDistance": 520, "fprecision": 0.25, "frecall": 0.3 },
    { "anomalyCount": 15, "correctAnomalyCount": 11, "incorrectAnomalyCount": 4, "temporalDistance": 320, "fprecision": 0.6, "frecall": 0.8 },
    { "anomalyCount": 7, "correctAnomalyCount": 3, "incorrectAnomalyCount": 4, "temporalDistance": 150, "fprecision": 0.5, "frecall": 0.56 },
    { "anomalyCount": 0, "correctAnomalyCount": 0, "incorrectAnomalyCount": 0, "temporalDistance": 0, "fprecision": 0, "frecall": 0 },
    { "anomalyCount": 20, "correctAnomalyCount": 16, "incorrectAnomalyCount": 4, "temporalDistance": 130, "fprecision": 0.82, "frecall": 0.83 },
    { "anomalyCount": 17, "correctAnomalyCount": 2, "incorrectAnomalyCount": 15, "temporalDistance": 520, "fprecision": 0.25, "frecall": 0.3 },
  ]

const metricNames = ["anomalyCount", "incorrectAnomalyCount"]

const timelineData = [
    {
        "id": "temporal distance",
        "data": [
            {
                "x": "2022-01-10T07:30:24.27835414Z",
                "y": 64.12
            },
            {
                "x": "2022-01-10T07:30:25.954648097Z",
                "y": 64.12
            },
            {
                "x": "2022-01-10T07:30:27.92506958Z",
                "y": 64.12
            },
            {
                "x": "2022-01-10T07:30:29.802074191Z",
                "y": 69.74
            },
            {
                "x": "2022-01-10T07:30:31.322805406Z",
                "y": 69.74
            },
            {
                "x": "2022-01-10T07:30:32.790265092Z",
                "y": 69.82
            },
            {
                "x": "2022-01-10T07:30:34.349504513Z",
                "y": 69.82
            },
            {
                "x": "2022-01-10T07:30:35.860973179Z",
                "y": 69.82
            },
            {
                "x": "2022-01-10T07:30:37.325655612Z",
                "y": 65.14
            },
            {
                "x": "2022-01-10T07:30:38.756877153Z",
                "y": 59.13
            },
        ]
    },
    {
        "id": "ttc",
        "data": [
            {
                "x": "2022-01-10T07:30:24.27835414Z",
                "y": 44.12
            },
            {
                "x": "2022-01-10T07:30:25.954648097Z",
                "y": 76.12
            },
            {
                "x": "2022-01-10T07:30:27.92506958Z",
                "y": 54.12
            },
            {
                "x": "2022-01-10T07:30:29.802074191Z",
                "y": 76.74
            },
            {
                "x": "2022-01-10T07:30:31.322805406Z",
                "y": 69.74
            },
            {
                "x": "2022-01-10T07:30:32.790265092Z",
                "y": 44.82
            },
            {
                "x": "2022-01-10T07:30:34.349504513Z",
                "y": 100.82
            },
            {
                "x": "2022-01-10T07:30:35.860973179Z",
                "y": 49.82
            },
            {
                "x": "2022-01-10T07:30:37.325655612Z",
                "y": 65.14
            },
            {
                "x": "2022-01-10T07:30:38.756877153Z",
                "y": 57.13
            },
        ]
    },
    {
        "id": "missed anomalies",
        "data": [
            {
                "x": "2022-01-10T07:30:24.27835414Z",
                "y": 25
            },
            {
                "x": "2022-01-10T07:30:25.954648097Z",
                "y": 28
            },
            {
                "x": "2022-01-10T07:30:27.92506958Z",
                "y": 28
            },
            {
                "x": "2022-01-10T07:30:29.802074191Z",
                "y": 32
            },
            {
                "x": "2022-01-10T07:30:31.322805406Z",
                "y": 32
            },
            {
                "x": "2022-01-10T07:30:32.790265092Z",
                "y": 33
            },
            {
                "x": "2022-01-10T07:30:34.349504513Z",
                "y": 46
            },
            {
                "x": "2022-01-10T07:30:35.860973179Z",
                "y": 46
            },
            {
                "x": "2022-01-10T07:30:37.325655612Z",
                "y": 47
            },
            {
                "x": "2022-01-10T07:30:38.756877153Z",
                "y": 50
            },
        ]
    }
  ]
  
  const modeldata = [
    {
      "data": "training",
      "temporalDistance": 450,
      "ttc": 200,
      "ctt": 250,
      "exactMatch": 20,
      "detectedAnomaly": 30,
      "missedAnomaly": 10,
      "falseAnomaly": 5,
      "tdir": 0.6,
      "dair": 0.7,
    },
    {
      "data": "production",
      "temporalDistance": 370,
      "ttc": 270,
      "ctt": 100,
      "exactMatch": 5,
      "detectedAnomaly": 15,
      "missedAnomaly": 10,
      "falseAnomaly": 6,
      "tdir": 0.4,
      "dair": 0.6,
    },
    /* {
      "modelNo": "model3",
      "temporalDistance": 140,
      "ttc": 70,
      "ctt": 70,
      "exactMatch": 6,
      "detectedAnomaly": 12,
      "missedAnomaly": 6,
      "falseAnomaly": 8,
      "tdir": 0.56,
      "dair": 0.77,
    }, */
  ]