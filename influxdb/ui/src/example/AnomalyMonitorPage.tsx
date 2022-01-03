import React, { PureComponent } from 'react'
import {Page, Grid, Columns, Panel,
        Overlay, ComponentColor, ComponentSize,
        Button, ButtonType, ButtonShape, Orientation,
        BorderType, Table, Dropdown} from '@influxdata/clockface'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import TimeZoneDropdown from 'src/shared/components/TimeZoneDropdown'
import { getTimeRange } from 'src/dashboards/selectors'
import { connect, ConnectedProps } from 'react-redux'
import {Route, Redirect} from "react-router-dom"
import { TabbedPageTab } from 'src/shared/tabbedPage/TabbedPageTabs'
import ReportWrapper from './ReportWrapper'
import AnomalyMetricGraph from './AnomalyMetricGraph'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import {
  updateQueryParams as updateQueryParamsAction,
} from 'src/dashboards/actions/ranges'
// Types
import {
  AppState,
  TimeRange,
} from 'src/types'
import uuid from 'uuid'
import AnomalyLine from 'src/example/AnomalyGraph'
var htmlModule = require('raw-loader!./iris_model_performance_dashboard.html');
var html = htmlModule.default

// Apis
import {runQuery} from 'src/shared/apis/query'
import { InfluxDB } from "@influxdata/influxdb-client"

const script = `from(bucket: "Ermetal")
      |> range(start: -1m)`

interface OwnProps {
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps & RouteComponentProps<{ orgID: string }>


interface State {
  point: object
  anomalyFeedbackOverlay: boolean
  modelMetrics: object
  activeGraph: string
  redirect: boolean
}

class AnomalyMonitorPage extends PureComponent<Props, State>{
    state={
      point: null,
      anomalyFeedbackOverlay: false,
      activeGraph: "graph1",
      redirect: false,
      modelMetrics: [
        {"anomalyCount": 15, "correctAnomalyCount": 11, "incorrectAnomalyCount": 4, "temporalDistance": 320, "fprecision": 0.6, "frecall": 0.8},
        {"anomalyCount": 7, "correctAnomalyCount": 3, "incorrectAnomalyCount": 4, "temporalDistance": 150, "fprecision": 0.5, "frecall": 0.56},
        {"anomalyCount": 0, "correctAnomalyCount": 0, "incorrectAnomalyCount": 0, "temporalDistance": 0, "fprecision": 0, "frecall": 0},
        {"anomalyCount": 20, "correctAnomalyCount": 16, "incorrectAnomalyCount": 4, "temporalDistance": 130, "fprecision": 0.82, "frecall": 0.83},
        {"anomalyCount": 17, "correctAnomalyCount": 2, "incorrectAnomalyCount": 15, "temporalDistance": 520, "fprecision": 0.25, "frecall": 0.3},
      ]
    }
    componentDidMount(){
        console.log("anomaly monitor", this.props)
        let res = [];
        const influxQuery = async () => {
          //create InfluxDB client
          //const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);
          const queryApi = await runQuery(this.props.match.params.orgID, script).promise
          console.log("--", queryApi)
        
        };

        influxQuery();
    }

    clicked = () =>{
      this.setState({redirect: true})
    }

    handleChooseTimeRange = (timeRange: TimeRange) => {
      this.props.updateQueryParams({
        lower: timeRange.lower,
        upper: timeRange.upper,
      })
      console.log(timeRange)
    }

    printpoint = (e) => {
      console.log(e)
      this.setState({point: e, anomalyFeedbackOverlay: true})
    }

    public render() {
        const { modelMetrics } = this.state
        return (
            <Page
              titleTag="Anomaly Model Monitor Page"
              className="alert-history-page"
            >
              <Page.Header fullWidth={true}>
                <Page.Title
                  title="Anomaly Model Monitor Page"
                  testID="alert-history-title"
                />
              </Page.Header>
              <Page.ControlBar fullWidth={true}>
                <Page.ControlBarRight>
                  <TimeZoneDropdown />
                    <TimeRangeDropdown
                        onSetTimeRange={this.handleChooseTimeRange}
                        timeRange={this.props.timeRange}
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
                      <div style={{ height: '475px', background: "white", color: "black" }}>
                        <AnomalyLine onClick={this.printpoint}/>
                      </div>
                    </Grid.Column>                    
                  </Grid.Row>
                  <Grid.Row>
                    <Overlay visible={this.state.anomalyFeedbackOverlay}>
                      <Overlay.Container maxWidth={600}>
                        <Overlay.Header
                          title="Anomaly Info"
                          onDismiss={() => this.setState({ anomalyFeedbackOverlay: !this.state.anomalyFeedbackOverlay })}
                        />
                        <Overlay.Body>
                          <Grid>
                            <Grid.Row style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }}>
                              <Grid.Column widthXS={Columns.Four} style={{margin: "7px"}}>
                                <div className="tabbed-page--header-left">
                                  country: {this.state.point ? this.state.point["serieId"] : "-"}
                                </div>                                
                              </Grid.Column>
                              <Grid.Column widthXS={Columns.One}>
                              </Grid.Column>
                              <Grid.Column widthXS={Columns.Four} style={{margin: "7px"}}>
                                <div className="tabbed-page--header-left">
                                  data: {this.state.point ? this.state.point["data"]["xFormatted"] : "-"}
                                </div>                                  
                              </Grid.Column>
                            </Grid.Row>
                            <br/>
                            <Grid.Row style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }}>
                              <Grid.Column widthXS={Columns.Four} style={{margin: "7px"}}>
                                <div className="tabbed-page--header-left">
                                  Feedback: "-"
                                </div>                                 
                              </Grid.Column>
                            </Grid.Row>
                            <br/>
                            <Grid.Row>
                              <Grid.Column widthXS={Columns.Twelve} style={{margin: "7px"}}>
                                <div className="tabbed-page--header-left">
                                  Send Feedback. Prediction is:
                                  <Button
                                    color={ComponentColor.Success}
                                    titleText="Learn more about alerting"
                                    text="Correct"
                                    type={ButtonType.Submit}
                                    onClick={() => console.log("click action")}
                                    style={{marginLeft: "10px", marginRight: "10px"}}
                                  />
                                  <Button
                                    color={ComponentColor.Danger}
                                    titleText="Learn more about alerting"
                                    text="Incorrect"
                                    type={ButtonType.Submit}
                                    onClick={() => console.log("click action")}
                                  />
                                </div>                                 
                              </Grid.Column>                              
                            </Grid.Row>
                            <br/>
                            <Grid.Row>
                              <Grid.Column widthXS={Columns.Two} style={{margin: "7px"}}>
                                <div className="tabbed-page--header-left">
                                  
                                </div>                                 
                              </Grid.Column>
                              <Grid.Column widthXS={Columns.Two} style={{margin: "7px"}}>
                                <div className="tabbed-page--header-left">
                                  
                                </div>                                
                              </Grid.Column>
                            </Grid.Row>
                          </Grid>
                        </Overlay.Body>
                      </Overlay.Container>
                    </Overlay>
                  </Grid.Row>
                  <br/>
                  <br/>
                  <Grid.Row>
                    <Grid.Column widthXS={Columns.Twelve}>
                      <Panel>
                        <Panel.Header size={ComponentSize.Medium}>
                            <h5 className="preview-data-margins">Model Metrics</h5>
                        </Panel.Header>
                        <Panel.Body size={ComponentSize.Small}>
                          <Table
                            borders={BorderType.Vertical}
                            fontSize={ComponentSize.ExtraSmall}
                            cellPadding={ComponentSize.ExtraSmall}
                          >
                            <Table.Header>
                              <Table.Row>
                                <Table.HeaderCell>Number of Anomalies Found</Table.HeaderCell>
                                <Table.HeaderCell>Correctly Predicted Anomalies</Table.HeaderCell>
                                <Table.HeaderCell>Incorrectly Predicted Anomalies</Table.HeaderCell>
                                <Table.HeaderCell>Temporal Distance</Table.HeaderCell>
                                <Table.HeaderCell>Forgiving Precision</Table.HeaderCell>
                                <Table.HeaderCell>Forgiving Recall</Table.HeaderCell>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {modelMetrics.map((metric) => (
                                <Table.Row key={uuid.v4()}>
                                  <Table.Cell>{metric["anomalyCount"]}</Table.Cell>
                                  <Table.Cell>{metric["correctAnomalyCount"]}</Table.Cell>
                                  <Table.Cell>{metric["incorrectAnomalyCount"]}</Table.Cell>
                                  <Table.Cell>{metric["temporalDistance"]}</Table.Cell>
                                  <Table.Cell>{metric["fprecision"]}</Table.Cell>
                                  <Table.Cell>{metric["frecall"]}</Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table>
                        </Panel.Body>
                      </Panel>
                    </Grid.Column> 
                  </Grid.Row>
                  <br/>
                  <Grid.Row>
                    <Grid.Column widthXS={Columns.Twelve}>
                      <br/>
                      <a href="/public/iris_model_performance_dashboard.html" target="_blank">View report</a>
                      <br/>
                      <a href="/public/iris_model_performance_dashboard.html" download>Download report</a>
                      <br/>
                      <ReportWrapper html={html}/>
                      {/* <Button
                        color={ComponentColor.Success}
                        titleText="Learn more about alerting"
                        text="get report"
                        type={ButtonType.Submit}
                        onClick={this.clicked}
                        style={{marginLeft: "10px", marginRight: "10px"}}
                      />
                      {this.state.redirect && 
                        <Redirect push to={"/public/iris_model_performance_dashboard"} />
                      } */}
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
                            },
                            {
                              text: 'Graph3',
                              id: 'graph3',
                            },
                            {
                              text: 'Graph4',
                              id: 'graph4',
                            }]}
                            activeTab={this.state.activeGraph}
                            onTabClick={(e) => this.setState({ activeGraph: e })}
                          />
                          <br />
                          {this.state.activeGraph === "graph1" &&
                            <div style={{height: "450px", width: "1000px", alignSelf: "center"}}>
                              <AnomalyMetricGraph data={modeldata} models={["training", "production"]}/>
                            </div> 
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

const modeldata  =[
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
            /* let mdata = {}
            let results = model["results"][sensor]
            mdata["modelNo"] = model["modelID"]
            mdata["temporalDistance"] = parseFloat((parseFloat(results["ttc"]) + parseFloat(results["ctt"])).toFixed(3))
            mdata["ttc"] = parseFloat(parseFloat(results["ttc"]).toFixed(3))
            mdata["ctt"] = parseFloat(parseFloat(results["ctt"]).toFixed(3))
            mdata["exactMatch"] = parseFloat(results["exact_match"])
            mdata["detectedAnomaly"] = parseFloat(results["detected_anomaly"])
            mdata["missedAnomaly"] = parseFloat(results["missed_anomaly"])
            mdata["falseAnomaly"] = parseFloat(results["false_anomaly"])
            mdata["tdir"] = parseFloat(parseFloat(results["tdir"]).toFixed(3))
            mdata["dair"] = parseFloat(parseFloat(results["dair"]).toFixed(3)) */

const mstp = (state: AppState) => {

  const timeRange = getTimeRange(state)

  return {
    timeRange,
  }
}

const mdtp = {
  updateQueryParams: updateQueryParamsAction,
}

const connector = connect(mstp, mdtp)
export default connector(withRouter(AnomalyMonitorPage))