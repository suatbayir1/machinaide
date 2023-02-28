import React, { PureComponent } from 'react'
import {
    Page, Grid, Columns, Panel, TechnoSpinner, WaitingText,
    Overlay, ComponentColor, ComponentSize, IconFont, Icon, InfluxColors,
    Button, ButtonType, SelectDropdown, 
    BorderType, Table, SlideToggle, InputLabel, Label,
} from '@influxdata/clockface'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import AnomalyMetricGraph from '../anomalyMonitor/AnomalyMetricGraph'
import AnomalyMetricTimelineGraph from '../anomalyMonitor/AnomalyMetricTimelineGraph'
import MetricsTable from '../monitorComponents/MetricsTable'
import ReportWrapper from '../monitorComponents/ReportWrapper'
import {TimeRange} from 'src/types'
import RULFeedbackTable from './RULFeedbackTable'
import RULReportedFailuresTable from './RULReportedFailuresTable'
import InfluxDataWrapper from '../monitorComponents/InfluxDataWrapper'

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
    failures: object[]
    machine: string
    component: string
    sensor: string
    selectedPoint: object
}

class RULMonitorPage extends PureComponent<Props, State>{
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
        activeGraph: "graph1",
        reportPath: "iris_model_performance_dashboard.html",
        publicReportPath: "",
        report: "",
        machine: "Ermetal",
        component: "Press030",
        sensor: "Deng_hava_debi_act",
        selectedPoint: null,
        failures: [{date: "2022-01-19T10:01:30.369910224Z"},{date: "2021-11-06T12:01:30.369910224Z"},{date: "2021-12-23T00:01:30.369910224Z"}]
    }

    async componentDidMount(){
        const report = await AutoMLService.getMLReport(this.state.reportPath)
        this.setState({report: report["report"], publicReportPath: "public/" + this.state.reportPath})
    }

    changeFailures = (failures) => {
        this.setState({failures: failures})
    }

    handleChooseTimeRange = (timeRange: TimeRange) => {
        this.setState({ timeRange: timeRange })
        console.log(timeRange)
    }

    setSelectedPoint = (point) => {
        this.setState({selectedPoint: point})
    }

    public render(){
        //var htmlModule = require(this.state.reportPath);
        //var html = htmlModule.default
        return(
            <Page
                titleTag="Remaining Useful Lifetime Model Monitor Page"
                className="alert-history-page"
            >
                <Page.Header fullWidth={true}>
                    <Page.Title
                        title="Remaining Useful Lifetime Model Monitor Page"
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
                                <RULFeedbackTable 
                                    timeRange={this.state.timeRange} 
                                    predictions={predictions}
                                    setSelectedPoint={this.setSelectedPoint}
                                />
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Twelve}>
                                {this.state.selectedPoint ? (
                                    <InfluxDataWrapper 
                                        orgID={this.props.match.params.orgID}
                                        date={this.state.selectedPoint["logDate"]}
                                        machine={this.state.machine}
                                        component={this.state.component}
                                        sensor={this.state.sensor}
                                    />
                                ) : (<></>)} 
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Twelve}>
                                <RULReportedFailuresTable timeRange={this.state.timeRange} failures={this.state.failures} changeFailures={this.changeFailures}/>
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

export default RULMonitorPage

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

const predictions = [
    {"logDate": "2022-01-07T09:31:30.369910224Z", "result": "no failure in 30 days"},
    {"logDate": "2022-01-19T10:01:30.369910224Z", "result": "no failure in 30 days"},
    {"logDate": "2022-01-20T17:01:30.369910224Z", "result": "FAILURE IN 30 DAYS"}
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