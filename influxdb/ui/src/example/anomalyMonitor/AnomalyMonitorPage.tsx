import React, { PureComponent } from 'react'
import {
  Page, Grid, Columns, Panel,
  Overlay, ComponentColor, ComponentSize, IconFont, Icon, InfluxColors,
  Button, ButtonType, SelectDropdown, TechnoSpinner, WaitingText,
  BorderType, Table, SlideToggle, InputLabel, Label, DapperScrollbars,
} from '@influxdata/clockface'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import MetricsTable from '../monitorComponents/MetricsTable'
import { getTimeRange } from 'src/dashboards/selectors'
import { connect, ConnectedProps } from 'react-redux'
import ReportWrapper from '../monitorComponents/ReportWrapper'
import AnomalyMetricGraph from './AnomalyMetricGraph'
import AnomalyMetricTimelineGraph from './AnomalyMetricTimelineGraph'
import { InfluxChart } from './InfluxGraphWrapper'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import HorizontalTimeline from 'react-horizontal-timeline'
import {
  updateQueryParams as updateQueryParamsAction,
} from 'src/dashboards/actions/ranges'

// Services
import AutoMLService from 'src/shared/services/AutoMLService';

// Types
import {
  AppState,
  TimeRange,
} from 'src/types'
import uuid from 'uuid'

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
  data: any
  timeRange: TimeRange
  part: string
  machine: string
  component: string
  sensor: string
  query: string
  allData: boolean
  date: string
  hour: string
  minute: string
  selectedOptions: string[]
  anomalies: any[]
  shownAnomalies: any[]
  dateInfo: string
  selectedAnomaly: object
  anomalyFound: boolean
  reportPath: string
  publicReportPath: string
  report: string
  currentAnomaly: number
  previousAnomaly: number
  anomalySelectionOverlay: boolean
  overlayAnomalies: any[]
  overlayAnomalyObjects: object
  selectedAnomalyPoint: object
  listedAnomalies: any[]
}

const ANOMS = [
  {
    axis: 'x',
    value: "2022-01-04T05:30:17.520899904Z",
    sensor: "Ana_hava_sic_act_1",
    lineStyle: { stroke: '#b0413e', strokeWidth: 20, strokeDasharray: "4 4", strokeOpacity: 0.7, strokeLinecap: "round", height: "50%"},
    legend: 'Anomaly',
  },
  {
    axis: 'x',
    value: "2022-01-04T17:45:17.520899904Z",
    sensor: "Ana_hava_sic_act_1",
    lineStyle: { stroke: '#b0413e', strokeWidth: 20, strokeDasharray: "4 4", strokeOpacity: 0.7, strokeLinecap: "round", height: "50%"},
    legend: 'Anomaly',
  },
  {
    axis: 'x',
    value: "2022-01-11T06:56:09.840607692Z",
    sensor: "Ana_hava_sic_act_1",
    lineStyle: { stroke: '#b0413e', strokeWidth: 20, strokeDasharray: "4 4", strokeOpacity: 0.7, strokeLinecap: "round", height: "50%"},
    legend: 'Anomaly',
  },
  {
    axis: 'x',
    value: "2022-01-19T07:30:43.857267649Z",
    sensor: "Ana_hava_sic_act_1",
    lineStyle: { stroke: '#b0413e', strokeWidth: 20, strokeDasharray: "4 4", strokeOpacity: 0.7, strokeLinecap: "round", height: "50%"},
    legend: 'Anomaly',
  },
  {
    axis: 'x',
    value: "2022-01-19T17:30:17.060099138Z",
    sensor: "Ana_hava_sic_act_1",
    lineStyle: { stroke: '#b0413e', strokeWidth: 20, strokeDasharray: "4 4", strokeOpacity: 0.7, strokeLinecap: "round", height: "50%"},
    legend: 'Anomaly',
  },
  {
    axis: 'x',
    value: "2022-01-19T20:30:49.445503913Z",
    sensor: "Ana_hava_sic_act_1",
    lineStyle: { stroke: '#b0413e', strokeWidth: 20, strokeDasharray: "4 4", strokeOpacity: 0.7, strokeLinecap: "round", height: "50%"},
    legend: 'Anomaly',
  },
]

/*
Format: YYYY-MM-DD
Note: Make sure dates are sorted in increasing order
*/
const VALUES = [
  {
      data: "2019-12-05",
      status: "status",
      statusB: "anomaly1",
      statusE: "Admission Open"
    },
    {
      data: "2020-01-21",
      status: "status",
      statusB: "anomaly2",
      statusE: "Open for Fillup"
    },
    {
      data: "2020-02-25",
      status: "status",
      statusB: "anomaly3",
      statusE: "process"
    },
    {
      data: "2020-03-16",
      status: "status",
      statusB: "anomaly4",
      statusE: "Done"
    },
    {
      data: "2020-04-19",
      status: "status",
      statusB: "anomaly5",
      statusE: "Done"
    },
    {
      data: "2020-05-23",
      status: "status",
      statusB: "anomaly6",
      statusE: "Done"
    }
];

class AnomalyMonitorPage extends PureComponent<Props, State>{
  state = {
    point: null,
    anomalyFeedbackOverlay: false,
    activeGraph: "graph1",
    redirect: false,
    modelMetrics: [
      { "anomalyCount": 15, "correctAnomalyCount": 11, "incorrectAnomalyCount": 4, "temporalDistance": 320, "fprecision": 0.6, "frecall": 0.8 },
      { "anomalyCount": 7, "correctAnomalyCount": 3, "incorrectAnomalyCount": 4, "temporalDistance": 150, "fprecision": 0.5, "frecall": 0.56 },
      { "anomalyCount": 0, "correctAnomalyCount": 0, "incorrectAnomalyCount": 0, "temporalDistance": 0, "fprecision": 0, "frecall": 0 },
      { "anomalyCount": 20, "correctAnomalyCount": 16, "incorrectAnomalyCount": 4, "temporalDistance": 130, "fprecision": 0.82, "frecall": 0.83 },
      { "anomalyCount": 17, "correctAnomalyCount": 2, "incorrectAnomalyCount": 15, "temporalDistance": 520, "fprecision": 0.25, "frecall": 0.3 },
    ],
    data: null,
    timeRange: {
      "seconds": 3600,
      "lower": "now() - 1h",
      "upper": null,
      "label": "Past 1h",
      "duration": "1h",
      "type": "selectable-duration",
      "windowPeriod": 10000
    },
    hours: ["00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23"],
    minutes: ["00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15",
    "16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31",
    "32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47",
    "48","49","50","51","52","53","54","55","56","57","58","59"],
    part: "sensor",
    machine: "Ermetal",
    component: "Press030",
    sensor: "Deng_hava_debi_act",
    query: "",
    allData: false,
    date: new Date().toISOString().substring(0,10),
    hour: "00",
    minute: "00",
    selectedOptions: [],
    anomalies: ANOMS,
    shownAnomalies: [],
    dateInfo: "",
    selectedAnomaly: null,
    anomalyFound: false,
    reportPath: "iris_model_performance_dashboard.html",
    publicReportPath: "",
    report: "",
    currentAnomaly: 0,
    previousAnomaly: -1,
    anomalySelectionOverlay: false,
    overlayAnomalies: [],
    overlayAnomalyObjects: {},
    selectedAnomalyPoint: null,
    listedAnomalies: []
  }

  async componentDidMount() {
    //console.log("anomaly monitor", this.props, this.state)
    let now = new Date()
    let hour = now.getHours()
    let minute = now.getMinutes() 
    if(minute == 0)
      minute = 59
    else
      minute -= 1
    let hourStr = ""
    let minuteStr = ""
    if(hour<10){
      hourStr = "0" + hour
    }
    else{
      hourStr += hour
    }
    if(minute<10){
      minuteStr = "0" + minute
    }
    else{
      minuteStr += minute
    }
    const report = await AutoMLService.getMLReport(this.state.reportPath)
    this.getAnomalyDays()
    let query = `from(bucket: "${this.state.machine}")
            |> range(start: -1m)
            |> filter(fn: (r) => r._measurement == "${this.state.component}")
            |> filter(fn: (r) => r["_field"] == "${this.state.sensor}")
            |> limit(n: 60)`
    this.setState({date: now.toISOString().substring(0,10), hour: hourStr, minute: minuteStr, query: query,
      report: report["report"], publicReportPath: "public/" + this.state.reportPath}, ()=>this.setDateInfo())
  }

  setDateInfo = () => {
    let dateInfo = this.state.date + " " + this.state.hour + ":" + this.state.minute
    this.setState({dateInfo: dateInfo})
  }

  setSelectedFromChild = (selected) => {
    this.setState({selectedOptions: selected})//, ()=>this.setAnomalies())
  }

  createFluxQuery = () => {
    if (this.state.part == "sensor") {
      let tr = "-7m"
      if (this.state.timeRange.type == "selectable-duration") {
        tr = "-" + this.state.timeRange.duration
      }
      else if (this.state.timeRange.type == "custom") {
        tr = this.state.timeRange.lower + ", stop: " + this.state.timeRange.upper
      }
      let query_field = `from(bucket: "${this.state.machine}")
            |> range(start: ${tr})
            |> filter(fn: (r) => r._measurement == "${this.state.component}")
            ${!this.state.allData ? `|> filter(fn: (r) => r["_field"] == "${this.state.sensor}")` : ``}
            |> limit(n: 60)`
      this.setState({ query: query_field })
    }
    else if (this.state.part == "component") {
      let tr = "-7m"
      if (this.state.timeRange.type == "selectable-duration") {
        tr = "-" + this.state.timeRange.duration
      }
      else if (this.state.timeRange.type == "custom") {
        tr = this.state.timeRange.lower + ", stop: " + this.state.timeRange.upper
      }
      let query_field = `from(bucket: "${this.state.machine}")
            |> range(start: ${tr})
            |> filter(fn: (r) => r._measurement == "${this.state.component}")
            ${!this.state.allData ? `|> filter(fn: (r) => r["_field"] == "${this.state.sensor}")` : ``}
            |> limit(n: 25)`
      this.setState({ query: query_field })
    }
  }
  clicked = () => {
    this.setState({ redirect: true })
  }

  handleChooseTimeRange = (timeRange: TimeRange) => {
    this.setState({ timeRange: timeRange }, () => this.createFluxQuery())
    console.log(timeRange)
    /* this.props.updateQueryParams({
      lower: timeRange.lower,
      upper: timeRange.upper,
    })
    console.log(timeRange) */
  }

  printpoint = (point) => {
    let shownAnomalies = this.state.shownAnomalies
    console.log(point, shownAnomalies)
    let anomalyFound = false
    let selectedAnomaly = null
    for(let anomaly of shownAnomalies){
      if(anomaly.sensor === point.serieId){
        if(anomaly.value === point.data.x){
          anomalyFound = true
          selectedAnomaly = anomaly
          break
        }
      }
    }

    this.setState({ point: point, anomalyFeedbackOverlay: true, anomalyFound: anomalyFound, selectedAnomaly: selectedAnomaly })
  }

  arrayOfObjectToArray = (arrayOfObject) => {
    let array = arrayOfObject.map(item => item.name);
    return array;
  }

  before = () => {
    let minutes = this.state.minutes
    let hours = this.state.hours
    let index = minutes.findIndex((x)=>x===this.state.minute)
    if(index>0){
      this.setState({minute: minutes[index-1]},()=>this.setFluxQuery())
    }
    else if(index==0){
      let hourIndex = hours.findIndex((x)=>x===this.state.hour)
      if(hourIndex>0){
        this.setState({minute: minutes[minutes.length-1], hour: hours[hourIndex-1]},()=>this.setFluxQuery())
      }
      else if(hourIndex == 0){
        // get one day before
        let date = new Date(this.state.date)
        date.setDate(date.getDate() - 1)
        let newDateStr = date.toISOString().substring(0,10)
        this.setState({minute: minutes[minutes.length-1], hour: hours[hours.length-1], date: newDateStr},()=>this.setFluxQuery())
      }      
    }
  }

  after = () => {
    let minutes = this.state.minutes
    let hours = this.state.hours
    let index = minutes.findIndex((x)=>x===this.state.minute)
    if(index<minutes.length-1){
      this.setState({minute: minutes[index+1]},()=>this.setFluxQuery())
    }
    else if(index==minutes.length-1){
      let hourIndex = hours.findIndex((x)=>x===this.state.hour)
      if(hourIndex<hours.length-1){
        // get next hour
        this.setState({minute: minutes[0], hour: hours[hourIndex + 1]},()=>this.setFluxQuery())
      }
      else if(hourIndex == hours.length-1){
        // get next day
        let date = new Date(this.state.date)
        date.setDate(date.getDate() + 1)
        let newDateStr = date.toISOString().substring(0,10)
        this.setState({minute: minutes[0], hour: hours[0], date: newDateStr},()=>this.setFluxQuery())

      }
    }
  }


  setFluxQuery = () => {
    if (this.state.part == "sensor") {
      let date = this.state.date
      let hour = this.state.hour
      let minute = this.state.minute
      let nextMinute = minute
      let nextHour = hour
      let nextDate = date
      let trDate = new Date(date + "T" + hour + ":" + minute)
      let tr = trDate.toISOString()
      if(minute == "59"){
        nextMinute = "00"
        if(hour == "23"){
          nextHour = "00"
          let dateObj = new Date(date)
          dateObj.setDate(dateObj.getDate() + 1)
          nextDate = dateObj.toISOString().substring(0,10)
        }
        else{
          let hourIndex = this.state.hours.findIndex((x)=>x===hour)
          nextHour = this.state.hours[hourIndex + 1]
        }
      }
      else{
        let minuteIndex = this.state.minutes.findIndex((x)=>x===minute)
        nextMinute = this.state.minutes[minuteIndex + 1]
      }
      let tr2Date = new Date(nextDate + "T" + nextHour + ":" + nextMinute) 
      //console.log("dates", trDate, tr2Date)
      let tr2 = tr2Date.toISOString()
      /* let nextMin = parseInt(minute) + 1
      let tr2 = ""
      if(nextMin<10){
        let tr2Date = new Date(date + "T" + hour + ":0" + (parseInt(minute) + 1)) 
        tr2 = tr2Date.toISOString()
      }
      else{
        let tr2Date = new Date(date + "T" + hour + ":" + (parseInt(minute) + 1))
        tr2 = tr2Date.toISOString()
      } */
      let querytr = tr + ", stop: " + tr2
      let query_field = `from(bucket: "${this.state.machine}")
          |> range(start: ${querytr})
          |> filter(fn: (r) => r._measurement == "${this.state.component}")
          ${!this.state.allData ? `|> filter(fn: (r) => r["_field"] == "${this.state.sensor}")` : ``}`
          //|> limit(n: 50)`
      this.setState({ query: query_field }, ()=>{this.setAnomalies(); this.setDateInfo()})
    }    
  }

  datesAreOnSameDay = (first, second) =>{
    first = new Date(first)
    second = new Date(second)
    return first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  }

  getAnomalyDays = () => {
    let anomalies = this.state.anomalies
    let overlayAnomalyObjects = {}
    for(let i=0; i<anomalies.length; i++){
      let flag = false
      for(let key of Object.keys(overlayAnomalyObjects)){
        if(this.datesAreOnSameDay(anomalies[i].value, key)){
          overlayAnomalyObjects[key].push(anomalies[i])
          console.log(key, overlayAnomalyObjects)
          flag = true
          break
        }        
      }
      if(!flag){
        overlayAnomalyObjects[anomalies[i].value] = [anomalies[i]]
      }
    }
    this.setState({overlayAnomalies: Object.keys(overlayAnomalyObjects), overlayAnomalyObjects: overlayAnomalyObjects})

  }

  getAnomaliesForSelectedDay = () => {
    let selected = this.state.overlayAnomalyObjects[this.state.overlayAnomalies[this.state.currentAnomaly]]
    this.setState({listedAnomalies: selected})
  }

  goToAnomaly = () => {
    let val = this.state.selectedAnomalyPoint.value
    let date = new Date(val)
    let z = date.getTimezoneOffset() * 60 * 1000
    let tLocal = date-z
    tLocal = new Date(tLocal)
    let newDateStr = tLocal.toISOString()
    let dateStr = newDateStr.substring(0,10)
    let hourStr = newDateStr.substring(11,13)
    let minStr = newDateStr.substring(14,16)
    console.log(dateStr, hourStr, minStr)
    this.setState({ minute: minStr, hour: hourStr, date: dateStr },()=>this.setFluxQuery());
  }

  getAnomalyTimestamp = (index) => {
    this.setState({ currentAnomaly: index, previousAnomaly: this.state.currentAnomaly, 
      anomalySelectionOverlay: !this.state.anomalySelectionOverlay}, ()=>this.getAnomaliesForSelectedDay())
  }

  setAnomalies = () => {
    let shownAnomalies = []
    let selectedOptions = this.state.selectedOptions
    let anomalies = this.state.anomalies
    let date1 = new Date(this.state.date + "T" + this.state.hour + ":" + this.state.minute) //+ ":00.000000000Z")
    let date2 = new Date(date1.getTime() + 1*60000)
    for(let anomaly of anomalies){
      //if(selectedOptions.includes(anomaly.sensor)){
        let anomalyDate = new Date(anomaly["value"])
        console.log(date1, date2, anomalyDate)
        if(anomalyDate<date2 && anomalyDate>date1){
          shownAnomalies.push(anomaly)
        }
      //}      
    }
    this.setState({shownAnomalies: shownAnomalies})
  }
  

  public render() {
    const { modelMetrics, overlayAnomalies } = this.state
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
          <Page.ControlBarLeft>
            <Label
              size={ComponentSize.Small}
              name={"Date"}
              description={""}
              color={InfluxColors.Castle}
              id={"icon-label"} 
            />
            <input
                type='date'
                value={this.state.date}
                onChange={(e) => { this.setState({date: e.target.value})}}
                style={{ background: '#383846', color: '#ffffff' }}
            /> 
            <Label
              size={ComponentSize.Small}
              name={"Hour:"}
              description={""}
              color={InfluxColors.Castle}
              id={"icon-label"} 
            />         
            <SelectDropdown
              style={{width: "10%"}}
              options={this.state.hours}
              selectedOption={this.state.hour}
              onSelect={(e) => {this.setState({hour: e})}}
            />     
            <Label
              size={ComponentSize.Small}
              name={"Minute:"}
              description={""}
              color={InfluxColors.Castle}
              id={"icon-label"} 
            />
            <SelectDropdown
              style={{width: "10%"}}
              options={this.state.minutes}
              selectedOption={this.state.minute}
              onSelect={(e) => {this.setState({minute: e})}} //, ()=>this.setFluxQuery()
            /> 
            <Button
              color={ComponentColor.Success}
              titleText=""
              text="Get Data"
              type={ButtonType.Submit}
              onClick={() => this.setFluxQuery()}
            />
          </Page.ControlBarLeft>
          <Page.ControlBarRight> 
            <SlideToggle
              active={this.state.allData}
              size={ComponentSize.ExtraSmall}
              onChange={() => this.setState({ allData: !this.state.allData, selectedOptions: [],
                       date: new Date().toISOString().substring(0,10), hour:"00", minute:"00" }, () => this.setFluxQuery())}
              testID="rule-card--slide-toggle"
            />
            <InputLabel> Get all data</InputLabel>
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
              {this.state.query.length ? (<Grid.Column widthXS={Columns.Twelve}>
                <div style={{ height: '475px', background: "white", color: "black" }}>
                  {/* <AnomalyLine onClick={this.printpoint}/> */}
                  <InfluxChart 
                    orgID={this.props.match.params.orgID} 
                    query={this.state.query} 
                    onClick={this.printpoint} 
                    selectedSensors={this.state.selectedOptions}
                    setSelectedInParent={this.setSelectedFromChild}
                    anomalies={this.state.shownAnomalies}
                  />
                </div>
              </Grid.Column>) : (
                <Grid.Column widthXS={Columns.Twelve} style={{textAlign: "-webkit-center"}}>
                    <TechnoSpinner style={{ width: "75px", height: "75px" }} />
                    <WaitingText text="Graph is loading" />
                </Grid.Column>
              )}
            </Grid.Row>
            <br/><br/><br/><br/>
            <Grid.Row>
              <Grid.Column widthXS={Columns.One}>
                <Button
                  icon={IconFont.CaretLeft}
                  color={ComponentColor.Secondary}
                  titleText=""
                  text=""
                  type={ButtonType.Submit}
                  onClick={() => this.before()}
                />
              </Grid.Column>
              <Grid.Column widthXS={Columns.Ten} style={{textAlign: "center"}}>
                <Label
                  size={ComponentSize.Small}
                  name={"Date: " + this.state.dateInfo}
                  description={""}
                  color={InfluxColors.Castle}
                  id={"icon-label"} 
                />
              </Grid.Column>
              <Grid.Column widthXS={Columns.One} style={{textAlign: "right"}}>
                <Button
                  icon={IconFont.CaretRight}
                  color={ComponentColor.Secondary}
                  titleText=""
                  text=""
                  type={ButtonType.Submit}
                  onClick={() => this.after()}
                />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column widthXS={Columns.Twelve}>
                {/* <div style={{ height: '475px', background: "white", color: "black" }}>
                        <AnomalyLine onClick={this.printpoint}/>
                      </div> */}
                {/* <div style={{height: "450px", width: "1000px", alignSelf: "center", color: "black"}}>
                              <AnomalyMetricGraph data={modeldata} models={["training", "production"]}/>
                            </div>  */}
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
                        <Grid.Column widthXS={Columns.Four} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">
                            Sensor: {this.state.point ? this.state.point["serieId"] : "-"}
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.One}>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Four} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">
                            Date: {this.state.point ? this.state.point["data"]["xFormatted"] : "-"}
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                      <br />
                      <Grid.Row style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }}>
                        <Grid.Column widthXS={Columns.Four} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">
                            Feedback: "-"
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                      <br />
                      <Grid.Row>
                        {this.state.anomalyFound ? (
                          <Grid.Column widthXS={Columns.Twelve} style={{ margin: "7px" }}>
                            <div className="tabbed-page--header-left">
                              Send Feedback. Prediction is:
                              <Button
                                color={ComponentColor.Success}
                                titleText=""
                                text="Correct"
                                type={ButtonType.Submit}
                                onClick={() => console.log("click action")}
                                style={{ marginLeft: "10px", marginRight: "10px" }}
                              />
                              <Button
                                color={ComponentColor.Danger}
                                titleText=""
                                text="Incorrect"
                                type={ButtonType.Submit}
                                onClick={() => console.log("click action")}
                              />
                            </div>
                          </Grid.Column>
                        ) : (
                          <Grid.Column widthXS={Columns.Twelve} style={{ margin: "7px" }}>
                            <div className="tabbed-page--header-left">
                              Send Feedback.
                              <Button
                                color={ComponentColor.Secondary}
                                titleText=""
                                text="Anomaly missed"
                                type={ButtonType.Submit}
                                onClick={() => console.log("click action")}
                                style={{ marginLeft: "10px", marginRight: "10px" }}
                              />
                            </div>
                          </Grid.Column>
                        )}
                      </Grid.Row>
                      <br />
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Two} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">

                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Two} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">

                          </div>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Overlay.Body>
                </Overlay.Container>
              </Overlay>
            </Grid.Row>
            <br />
            <br />
            <Grid.Row>
              {this.state.overlayAnomalies.length ? (<Grid.Column widthXS={Columns.Twelve}>
                <Overlay visible={this.state.anomalySelectionOverlay}>
                  <Overlay.Container maxWidth={600}>
                    <Overlay.Header
                      title="Select An Anomaly"
                      onDismiss={() => this.setState({ anomalySelectionOverlay: !this.state.anomalySelectionOverlay })}
                    />
                    <Overlay.Body>
                      <Grid>
                        <Grid.Row style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }}>
                          <Grid.Column widthXS={Columns.Twelve}>
                            <Table
                                borders={BorderType.Vertical}
                                fontSize={ComponentSize.ExtraSmall}
                                cellPadding={ComponentSize.ExtraSmall}
                            >
                                <Table.Header>
                                  <Table.Row>
                                    <Table.HeaderCell style={{width: "150px"}}>Date</Table.HeaderCell>
                                    <Table.HeaderCell style={{width: "50px"}}></Table.HeaderCell> 
                                  </Table.Row>
                                </Table.Header>                    
                            </Table>
                            <DapperScrollbars
                                autoHide={false}
                                autoSizeHeight={true} style={{ maxHeight: '250px' }}
                                className="data-loading--scroll-content"
                            >
                                <Table
                                    borders={BorderType.Vertical}
                                    fontSize={ComponentSize.ExtraSmall}
                                    cellPadding={ComponentSize.ExtraSmall}
                                >                            
                                    <Table.Body>    
                                      {this.state.listedAnomalies.map((anomaly)=> (
                                          <Table.Row key={uuid.v4()}>
                                             <Table.Cell style={{width: "150px"}}>{new Date(anomaly.value).toDateString().substring(4,10) + "-" + new Date(anomaly.value).toLocaleTimeString().substring(0,5)}</Table.Cell> 
                                             <Table.Cell style={{width: "50px"}}>
                                              <Button
                                                  text=""
                                                  onClick={()=>this.setState({selectedAnomalyPoint: anomaly, anomalySelectionOverlay: false}, ()=>this.goToAnomaly())}
                                                  type={ButtonType.Button}
                                                  size={ComponentSize.ExtraSmall}
                                                  icon={IconFont.Eye}
                                                  color={ComponentColor.Secondary}
                                              />
                                            </Table.Cell>                                          
                                          </Table.Row>   
                                      ))}                          
                                    </Table.Body>                            
                                </Table>
                            </DapperScrollbars>
                          </Grid.Column>
                        </Grid.Row>
                      </Grid>
                    </Overlay.Body>
                  </Overlay.Container>
                </Overlay>
                <div>
                  {/* Bounding box for the Timeline */}
                  <div style={{
                      width: "60%",
                      height: "150px",
                      margin: "0 auto",
                      fontSize: "15px"
                  }}>
                    <HorizontalTimeline
                      styles={{
                          background: InfluxColors.Wolf,
                          foreground: InfluxColors.Ruby,
                          outline: InfluxColors.Pearl
                      }}
                      getLabel={(date) => { let d = new Date(date); return d.toDateString().substring(4)+" count: "+`${this.state.overlayAnomalyObjects[date].length}` }}
                      labelWidth={120}
                      index={this.state.currentAnomaly}
                      indexClick={this.getAnomalyTimestamp}
                      values={ overlayAnomalies.map((x) => x) }
                      isOpenBeginning={false}
                      isOpenEnding={false}
                  />
                  </div>
                  <div className='text-center' style={{width: "60%", margin: "auto", position: "relative"}}>
                      <div className='text-center' style={{display: "flex", justifyContent: "space-between"}}>
                          <p>From: {(new Date(ANOMS[0].value)).toLocaleDateString().substring(0,5) + " " + (new Date(ANOMS[0].value)).toLocaleTimeString()}</p>
                          <p>Selected Anomaly Date: {this.state.selectedAnomalyPoint ? (new Date(this.state.selectedAnomalyPoint.value)).toLocaleDateString().substring(0,5) + " " + (new Date(this.state.selectedAnomalyPoint.value)).toLocaleTimeString() : "-"}</p>
                          <p>To: {(new Date(ANOMS[ANOMS.length-1].value)).toLocaleDateString().substring(0,5) + " " + (new Date(ANOMS[ANOMS.length-1].value)).toLocaleTimeString()}</p>              
                      </div>
                    
                  </div>
                </div>
              </Grid.Column>) : (
                <Grid.Column widthXS={Columns.Twelve} style={{textAlign: "-webkit-center"}}>
                    <TechnoSpinner style={{ width: "75px", height: "75px" }} />
                    <WaitingText text="Anomalies are loading" />
                </Grid.Column>
              )}
            </Grid.Row>
            <Grid.Row>
              <Grid.Column widthXS={Columns.Twelve}>
                <MetricsTable
                  timeRange={this.state.timeRange}
                  metricNames={modelMetrics[0] ? Object.keys(modelMetrics[0]) : []}
                  modelMetrics={modelMetrics}
                />
              </Grid.Column>
            </Grid.Row>            
            <br /><br />
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