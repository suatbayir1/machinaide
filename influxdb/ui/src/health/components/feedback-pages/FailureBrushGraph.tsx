import React, {Component, useRef} from 'react'
import Chart from 'react-apexcharts'
import ApexCharts from 'apexcharts'
import FailureAnnotationOverlay from './FailureAnnotationOverlay'
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import { Grid, Columns, DapperScrollbars, Input, Toggle, InputType, Table, BorderType,
  InputLabel, FlexBox, FlexDirection, JustifyContent, AlignItems, ComponentSize, InputToggleType,
  InfluxColors, Label, ComponentColor, ButtonType, Button, IconFont, SquareButton, QuestionMarkTooltip,
  MultiSelectDropdown, SlideToggle
} from '@influxdata/clockface'
import uuid from 'uuid'
import {TimeRange} from 'src/types'
import FilterTimeRangeDropdown from "../FilterTimeRangeDropdown"
import FailureService from 'src/shared/services/FailureService'
import AutoMLService from 'src/shared/services/AutoMLService'
import FeedbackOverlay from 'src/health/components/feedback-pages/FeedbackOverlay'

interface Props {
    name: string
    orgID: string
    machineID: string
    data: object[]
    graphData: object
    windowStart: number
    windowEnd: number
    modelID: string
    model: object
    /* timeRange: object
    aggregatePeriod: string */
    chartID: string
    sensorNames: string[]
    isFeedbackSelected: boolean
    user: object
    changeWindowPoints: (start: number, end: number) => void
    goToAnomaly: (timeRange: TimeRange) => void
}

interface State {
    overlay: boolean
    annotationTimestamps: number[]
    options: object
    optionsLine: object
    series: object[],
    allSeries: object,
    annotation: object,
    lineAnnotation: object,
    selectedLog: object,
    selectedTimestamp: number,
    windowStartX: number
    windowEndX: number
    seriesToggle: object
    annotationObject: object
    filterType: string[]
    filterCode: string[]
    filterUserFeedback: string
    filterFeedback: string
    filterTimeRange: TimeRange
    filterTimeRangeLogs: TimeRange
    showFilters: boolean
    searchSensorQuery: string
    relatedFailures: object[]
    shownRelatedFailures: object[]
    showModelLogs: boolean
    modelsLogsData: object[]
    shownModelsLogsData: object[]
    filterSeverity: string[]
}

//const lineChartRef = useRef(null)
//const brushChartRef = useRef(null)

class FailureBrushGraph extends Component<Props, State> {
    constructor(props){
        super(props)
        // console.log(props)
        let stop = new Date().toISOString()
        let start = new Date(new Date().getTime() - 24*60*60*30*1000).toISOString()
        this.state = {
            filterTimeRange: {
              lower: start,
              upper: stop,
              type: 'custom'
            },
            filterTimeRangeLogs: {
              lower: start,
              upper: stop,
              type: 'custom'
            },
            showModelLogs: false,
            relatedFailures: [],
            shownRelatedFailures: [],
            modelsLogsData: [],
            shownModelsLogsData: [],
            searchSensorQuery: "",
            filterSeverity: [],
            filterType: [],
            filterCode: [],
            filterUserFeedback: "",
            filterFeedback: "",
            showFilters: false,
            overlay: false,
            annotationTimestamps: [],
            options: {
                legend: {
                  show: false
                },
                noData: {
                  text: "There is no data. Try selecting a sensor or a failure timestamp from the list.",
                  align: 'center',
                  verticalAlign: 'middle',
                  offsetX: 0,
                  offsetY: 0,
                  style: {
                    color: undefined,
                    fontSize: '14px',
                    fontFamily: undefined
                  }
                },
                chart: {
                  id: "anomalyChart",
                  type: "area",
                  height: 230,
                  foreColor: "#ccc",
                  toolbar: {
                    autoSelected: "pan",
                    show: false
                  },
                  animations: {
                    enabled: false
                  },
                  events: {
                    click: (event, chartContext, config) => {
                      // console.log("click first graph", chartContext, config);
                      // console.log(config.config.series[config.seriesIndex])
                      // console.log(config.config.series[config.seriesIndex].name)
                      // console.log(config.config.series[config.seriesIndex].data[config.dataPointIndex])
                      // console.log("onclick", event.target.tagName)
                      if(config.config.series[config.seriesIndex]){
                        let anno = {
                          x: config.config.series[config.seriesIndex].data[config.dataPointIndex][0],
                          borderColor: '#DC4E58',
                          opacity: 1,
                          borderWidth: 4,
                          strokeDashArray: 0,
                          label: {
                            style: {
                              color: 'white',
                              background: '#DC4E58',
                              fontWeight: 500,
                            },
                            text: 'anomaly'
                          }
                        }
      
                        let lineAnno = {
                          x: config.config.series[config.seriesIndex].data[config.dataPointIndex][0],
                          borderColor: '#DC4E58',
                          opacity: 1,
                          borderWidth: 2,
                          strokeDashArray: 0,
                          label: {
                            borderWidth: 5,
                            style: {
                              color: '#DC4E58',
                            },
                            text: ''
                          }
                        }
                        this.onPointClick(anno, lineAnno)

                      }    
                      //this.setState({showButtons: !this.state.showButtons,})
                      /* xaxis: [...this.state.xaxis, anno] */
                    }
                  },
                },
                colors: ["#00A3FF", "#8E1FC3", "#34BB55", "#FFB94A"],//["#00BAEC"],
                stroke: {
                  width: 3,
                  curve: "straight"
                },
                grid: {
                  borderColor: "#555",
                  clipMarkers: false,
                  yaxis: {
                    lines: {
                      show: false
                    }
                  }
                },
                dataLabels: {
                  enabled: false
                },
                annotations: {
                  xaxis: [/* {
                    x: new Date('2021-05-13').getTime(),
                    borderColor: '#DC4E58',
                    opacity: 1,
                    borderWidth: 4,
                    strokeDashArray: 0,
                    label: {
                      style: {
                        color: 'white',
                        background: '#DC4E58',
                        fontWeight: 500,
                      },
                      text: 'anomaly'
                    }
                  } */]
                },
                fill: {
                  gradient: {
                    enabled: true,
                    opacityFrom: 0.55,
                    opacityTo: 0
                  }
                },
                markers: {
                  /* size: 4,
                  colors: ["#00A3FF", "#8E1FC3", "#34BB55", "#FFB94A"],//["#000524"],
                  strokeColor: "#FFFFFF",
                  strokeWidth: 1 */
                  size: 0
                },
                tooltip: {
                  theme: "dark",
                  x: {
                    show: true,
                    format: 'dd MMM yy HH:mm:ss',
                    formatter: undefined,
                  },
                  shared: true,
                  /* custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                    const hoverXaxis = w.globals.seriesX[seriesIndex][dataPointIndex];
                    const hoverIndexes = w.globals.seriesX.map(seriesX => {
                      return seriesX.findIndex(xData => xData === hoverXaxis);
                    });
              
                    let hoverList = '';
                    hoverIndexes.forEach((hoverIndex, seriesEachIndex) => {
                      if (hoverIndex >= 0) {
                        hoverList += `<span>${w.globals.seriesNames[seriesEachIndex]}: ${series[seriesEachIndex][hoverIndex]}</span><br />`;
                      }
                    });
                    
                    const formatHoverX = new Date(hoverXaxis).toISOString().replace(/T/, ' ').replace(/\..+/, '')
              
                    return `<div class="card">
                      <div class="card-header p-1">${formatHoverX}</div>
                      <div class="card-body p-1">
                        ${hoverList}
                      </div>
                    </div>`;
                  }, */
                  //intersect: true
                },
                xaxis: {
                  type: "datetime",
                  labels: {
                    datetimeUTC: false
                  }
                },
                yaxis: {
                  min: 0,
                  tickAmount: 4,
                  /* labels: {
                    formatter: function(val, index) {
                      return val.toFixed(2);
                    }
                  } */
                }
            },
            optionsLine: { 
                legend: {
                  show: false
                }, 
                noData: {
                  text: "-",
                  align: 'center',
                  verticalAlign: 'middle',
                  offsetX: 0,
                  offsetY: 0,
                  style: {
                    color: undefined,
                    fontSize: '14px',
                    fontFamily: undefined
                  }
                },
                chart: {
                  id: "brushChart",
                  height: 130,
                  type: "bar",
                  foreColor: "#ccc",
                  brush: {
                    target: "anomalyChart",
                    enabled: true,
                    autoScaleYaxis: true
                  },
                  animations: {
                    enabled: false
                  },
                  events: {
                    brushScrolled: (hartContext, { xaxis, yaxis }) => {
                      this.setWindowPosition(xaxis.min, xaxis.max)
                    },
                  },
                  selection: {
                    enabled: true,
                    fill: {
                      color: "#fff",
                      opacity: 0.4
                    },
                    xaxis: {
                      min: null, // this.props.windowStart, //this.props.data[0][0],//new Date("27 Jul 2017 10:00:00").getTime(),
                      max: null // this.props.windowEnd //this.props.data[10][0]
                    }
                  },
                },
                colors: ["#00A3FF", "#8E1FC3", "#34BB55", "#FFB94A"],//["#FF0080"],
                stroke: {
                  width: 2,
                  curve: "straight"
                },
                grid: {
                  borderColor: "#444"
                },
                markers: {
                  size: 0
                },
                xaxis: {
                  type: "datetime",
                  tooltip: {
                    enabled: false
                  },
                  labels: {
                    datetimeUTC: false
                  }
                },
                yaxis: {
                  tickAmount: 2
                },
                dataLabels: {
                  enabled: false
                },
                annotations: {
                  xaxis: [
                    /* {
                      x: new Date('2021-05-13').getTime(),
                      borderColor: '#DC4E58',
                      opacity: 1,
                      borderWidth: 2,
                      strokeDashArray: 0,
                      label: {
                        borderWidth: 5,
                        style: {
                          color: '#DC4E58',
                        },
                        text: ''
                      }
                    } */
                  ]
                },
            },
            series: [],
            allSeries: this.props.graphData,
            annotation: null,
            lineAnnotation: null,
            selectedLog: {timestamp: "", prediiction: ""},
            selectedTimestamp: 0,
            windowStartX: null,
            windowEndX: null,
            seriesToggle: {},
            annotationObject: null
        }
    }

    setWindowPosition = (start, end) => {
      this.setState({windowStartX: start, windowEndX: end})
    }

    handleChooseTimeRange = (timeRange: TimeRange) => {
      this.setState({ filterTimeRange: timeRange }, () => this.filterFailures())
      console.log(timeRange)
    }

    handleChooseTimeRangeLogs = (timeRange: TimeRange) => {
      this.setState({filterTimeRangeLogs: timeRange}, () => this.filterModelLogs())
      console.log(timeRange)
    }

    onSelectFilterSeverity = (option: string) => {
      const { filterSeverity } = this.state
      const optionExists = filterSeverity.find(opt => opt === option)
      let updatedOptions = filterSeverity
  
      if (optionExists) {
        updatedOptions = filterSeverity.filter(fo => fo !== option)
      } else {
        updatedOptions = [...filterSeverity, option]
      }
  
      this.setState({ filterSeverity: updatedOptions }, ()=>this.filterFailures())
    }

    filterFailures = () => {
      let allFailures = this.state.relatedFailures
      const {filterSeverity} = this.state
      let filteredFailures = []
      if(allFailures){
        for(let failure of allFailures){
          let lower = new Date(this.state.filterTimeRange.lower).getTime()
          let upper = new Date(this.state.filterTimeRange.upper).getTime()
          if(filterSeverity.length === 0 || filterSeverity.includes(failure["severity"])){
            let failureStartTime = new Date(failure["startTime"]).getTime()
            if(failureStartTime>=lower && failureStartTime<=upper){
                  filteredFailures.push(failure)
            }
          }
        }
        this.setState({shownRelatedFailures: filteredFailures})
      }
    }

    filterModelLogs = () => {
      let allModelLogs = this.state.modelsLogsData
      let filteredModelLogs = []
      if(allModelLogs){
        for(let log of allModelLogs){
          let lower = new Date(this.state.filterTimeRangeLogs.lower).getTime()
          let upper = new Date(this.state.filterTimeRangeLogs.upper).getTime()
          let modelTime = new Date(log["time"]).getTime()
          if(modelTime>=lower && modelTime<=upper)
            filteredModelLogs.push(log)
        }
        this.setState({shownModelsLogsData: filteredModelLogs})
      }
    }

    onClickFailure = (timestamp) => {
      if(timestamp){
        let start = new Date(timestamp - 1800 * 1000).toISOString()
        let stop = new Date(timestamp + 1800 * 1000).toISOString()
        let timeRange: TimeRange = {
          lower: start,
          upper: stop,
          type: 'custom'

        }
        this.props.goToAnomaly(timeRange)
      }      
    }

    addAnnotationsOnGraph = () => {
      let failures = this.state.relatedFailures
      let modelsLogs = this.state.modelsLogsData
      let annotations = []
      let lineAnnotations = []
      if(failures){
        for(let failure of failures){
          let startTimeDate = new Date(failure["startTime"])
          if(failure["startTime"] && startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())){
            let anno = {
              x: startTimeDate.getTime(),
              borderColor: '#DC4E58',
              opacity: 1,
              borderWidth: 4,
              strokeDashArray: 0,
              label: {
                style: {
                  color: 'white',
                  background: '#DC4E58',
                  fontWeight: 500,
                },
                text: "Failure"
              }
            }
  
            let lineAnno = {
              x: startTimeDate.getTime(),
              borderColor: '#DC4E58',
              opacity: 1,
              borderWidth: 2,
              strokeDashArray: 0,
              label: {
                borderWidth: 5,
                style: {
                  color: '#DC4E58',
                },
                text: ''
              }
            }
  
            annotations.push(anno)
            lineAnnotations.push(lineAnno)
          }
        }
      }    
      if(modelsLogs){
        for(let log of modelsLogs){
          let startTimeDate = new Date(log["time"])
          if(log["time"] && startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())){
            let anno = {
              x: startTimeDate.getTime(),
              borderColor: log["prediction"] ? "#FFB94A" : "#00A3FF",
              opacity: 1,
              borderWidth: 4,
              strokeDashArray: 0,
              label: {
                style: {
                  color: 'white',
                  background: log["prediction"] ? "#FFB94A" : "#00A3FF",
                  fontWeight: 500,
                },
                text: `Model log: ${log["prediction"]}`
              }
            }
  
            let lineAnno = {
              x: startTimeDate.getTime(),
              borderColor: log["prediction"] ? "#FFB94A" : "#00A3FF",
              opacity: 1,
              borderWidth: 2,
              strokeDashArray: 0,
              label: {
                borderWidth: 5,
                style: {
                  color: log["prediction"] ? "#FFB94A" : "#00A3FF",
                },
                text: ''
              }
            }
  
            annotations.push(anno)
            lineAnnotations.push(lineAnno)
          }
        } 
      }
      this.setState({
        options: {
          ...this.state.options,
          annotations: {
            xaxis: annotations,
          }
        },
        optionsLine: {
          ...this.state.optionsLine,
          annotations: {
            xaxis: lineAnnotations
          }
        }
      }, ()=>console.log("annotations 2:", this.state.options, this.state.optionsLine)) 
    }

    

    async componentDidMount() {
      //this.props.data[0][0] this.props.data[10][0]
      // 2022-04-20T13:00:00Z, stop: 2022-04-20T15:00:00Z
      // -12s, stop: now()
      // |> aggregateWindow(every: 20s, fn: mean, createEmpty: false)
      // |> window(every: 20s)
      console.log("PROPS", this.props)
      this.getFailures()
      this.setWindowAtStart(this.props.data)
      if(this.props.sensorNames.length){
        this.setState({series: [this.props.data[0]], allSeries: {[this.props.data[0]["name"]]: this.props.data[0]}
        }, () => this.selectOneSeries())
      }
    }

    getFailures = async () => {
        let model = this.props.model
        if(model){
            let assetName = model["assetName"]
            let failures = await FailureService.getLastFailures({"sourceName": assetName})
            let relatedFailures = []
            failures.forEach(failure=>{
                // if(failure["sourceName"].toLowerCase() === assetName.toLowerCase())
                relatedFailures.push(failure)
            })

            this.setState({relatedFailures: relatedFailures, shownRelatedFailures: relatedFailures}, ()=>this.getModelLogsData())
        }
    }

    getModelLogsData = async (days=30, groupIn="None") => {
      let model = this.props.model
      // 1 hour has 2 logs - 1 day has 48 logs - 1 week has 336 logs
      if(model){
          if(model["pipelineID"]){
              AutoMLService.getModelLogsOnContion(model["pipelineID"], "rulreg").then(res=>{
                  //console.log(res)
                  if(model["task"] === "rulreg"){
                  this.setState({modelsLogsData: res, shownModelsLogsData: res}, () => this.addAnnotationsOnGraph())
              }        
              }).catch(err=>console.log(err))
          }
          else{
              if(model["modelID"]){
                  AutoMLService.getModelLogsOnContion(model["modelID"], model["task"]).then(res=>{
                      //console.log(res)
                      if(model["task"] === "pof"){
                          this.setState({modelsLogsData: res, shownModelsLogsData: res}, () => this.addAnnotationsOnGraph())
                      }
                      else if(model["task"] === "rul"){
                          this.setState({modelsLogsData: res, shownModelsLogsData: res}, () => {this.addAnnotationsOnGraph(); console.log("--", this.state)})
                  }    
              }).catch(err=>console.log(err))
              }
              else{
                this.setState({modelsLogsData: [], shownModelsLogsData: []})
              }
          }
      }        
    }

    selectOneSeries = () => {
      let sensorNames = this.props.sensorNames
      let seriesToggle = {}
      for(let sensor of sensorNames){
        seriesToggle[sensor] = false
      }
      let keys = Object.keys(seriesToggle)
      if(keys.length){
        seriesToggle[keys[0]] = true
      }
      this.setState({seriesToggle: seriesToggle}, ()=> console.log(this.state))
    }

    reselectSeriesAtUpdate = () => {
      let seriesToggle = this.state.seriesToggle
      let keys = Object.keys(seriesToggle)
      let graphData = this.props.graphData
      let allSeries = {}
      for(let key of keys){
        if(seriesToggle[key]){
          allSeries[key] = graphData[key]
        }
      }
      this.setState({series: Object.values(allSeries), allSeries: allSeries})
    }

    setWindowAtStart = (data) => {
      if(data.length > 0 && data[0].data.length){
        if(data[0].data.length < 10){
          console.log("starting points <10: ", data[0].data[0][0], data[0].data[data.length-1][0])
          this.setState({optionsLine: 
            {...this.state.optionsLine, 
              chart: {
                  ...this.state.optionsLine.chart, 
                  selection: {
                      ...this.state.optionsLine.chart.selection, 
                      xaxis: {min: data[0].data[0][0], max: data[0].data[data.length-1][0]}
                  }
              }
            },
            windowStartX: data[0].data[0][0],
            windowEndX: data[0].data[data.length-1][0]
          })
        }
        else{
          console.log("starting points >10: ", data[0].data[0][0], data[0].data[10][0])
          this.setState({optionsLine: 
            {...this.state.optionsLine, 
              chart: {
                  ...this.state.optionsLine.chart, 
                  selection: {
                      ...this.state.optionsLine.chart.selection, 
                      xaxis: {min: data[0].data[0][0], max: data[0].data[10][0]}
                  }
              }
            },
            windowStartX: data[0].data[0][0],
            windowEndX: data[0].data[10][0]
          })
        }
      }
    }

    setWindowAtPlace = () => {
      this.setState({optionsLine: 
        {...this.state.optionsLine, 
          chart: {
              ...this.state.optionsLine.chart, 
              selection: {
                  ...this.state.optionsLine.chart.selection, 
                  xaxis: {min: this.props.windowStart, max: this.props.windowEnd}
              }
          }
        },
        windowStartX: this.props.windowStart,
        windowEndX: this.props.windowEnd
      })
    }

    componentWillUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): void {
      if(this.props.windowStart !== nextProps.windowStart && this.props.windowEnd !== nextProps.windowEnd){
        // console.log("after update: ", nextProps.windowStart, nextProps.windowEnd)
        this.setState({optionsLine: 
          {...this.state.optionsLine, 
            chart: {
                ...this.state.optionsLine.chart, 
                selection: {
                    ...this.state.optionsLine.chart.selection, 
                    xaxis: {min: nextProps.windowStart, max: nextProps.windowEnd}
                }
            }
          }
        })
      }
      // || this.props.aggregatePeriod !== nextProps.aggregatePeriod || JSON.stringify(this.props.timeRange) !== JSON.stringify(nextProps.timeRange)
      if(this.props.name !== nextProps.name || this.props.chartID !== nextProps.chartID){
        this.setState({
            overlay: false,
            annotationTimestamps: [],
            options: {
                legend: {
                  show: false
                },
                noData: {
                  text: "There is no data. Try selecting a sensor or a failure timestamp from the list.",
                  align: 'center',
                  verticalAlign: 'middle',
                  offsetX: 0,
                  offsetY: 0,
                  style: {
                    color: undefined,
                    fontSize: '14px',
                    fontFamily: undefined
                  }
                },
                chart: {
                  id: "anomalyChart",
                  type: "area",
                  height: 230,
                  foreColor: "#ccc",
                  toolbar: {
                    autoSelected: "pan",
                    show: false
                  },
                  animations: {
                    enabled: false
                  },
                  events: {
                    click: (event, chartContext, config) => {
                      // console.log("click first graph", chartContext, config);
                      // console.log(config.config.series[config.seriesIndex])
                      // console.log(config.config.series[config.seriesIndex].name)
                      // console.log(config.config.series[config.seriesIndex].data[config.dataPointIndex])
                      // console.log("onclick", event.target.tagName)
                      if(config.config.series[config.seriesIndex]){
                        let anno = {
                          x: config.config.series[config.seriesIndex].data[config.dataPointIndex][0],
                          borderColor: '#DC4E58',
                          opacity: 1,
                          borderWidth: 4,
                          strokeDashArray: 0,
                          label: {
                            style: {
                              color: 'white',
                              background: '#DC4E58',
                              fontWeight: 500,
                            },
                            text: 'anomaly'
                          }
                        }
      
                        let lineAnno = {
                          x: config.config.series[config.seriesIndex].data[config.dataPointIndex][0],
                          borderColor: '#DC4E58',
                          opacity: 1,
                          borderWidth: 2,
                          strokeDashArray: 0,
                          label: {
                            borderWidth: 5,
                            style: {
                              color: '#DC4E58',
                            },
                            text: ''
                          }
                        }
                        this.onPointClick(anno, lineAnno)
                      }                     
    
                      //this.setState({showButtons: !this.state.showButtons,})
                      /* xaxis: [...this.state.xaxis, anno] */
                    }
                  },
                },
                colors: ["#00A3FF", "#8E1FC3", "#34BB55", "#FFB94A"],//["#00BAEC"],
                stroke: {
                  width: 3,
                  curve: "straight"
                },
                grid: {
                  borderColor: "#555",
                  clipMarkers: false,
                  yaxis: {
                    lines: {
                      show: false
                    }
                  }
                },
                dataLabels: {
                  enabled: false
                },
                annotations: {
                  xaxis: [...this.state.options.annotations.xaxis]
                },
                fill: {
                  gradient: {
                    enabled: true,
                    opacityFrom: 0.55,
                    opacityTo: 0
                  }
                },
                markers: {
                  /* size: 4,
                  colors: ["#00A3FF", "#8E1FC3", "#34BB55", "#FFB94A"],//["#000524"],
                  strokeColor: "#FFFFFF",
                  strokeWidth: 1 */
                  size: 0
                },
                tooltip: {
                  theme: "dark",
                  x: {
                    show: true,
                    format: 'dd MMM yy HH:mm:ss',
                    formatter: undefined,
                  },
                  shared: true,
                },
                xaxis: {
                  type: "datetime",
                  labels: {
                    datetimeUTC: false
                  }
                },
                yaxis: {
                  min: 0,
                  tickAmount: 4,
                }
            },
            optionsLine: { 
                legend: {
                  show: false
                }, 
                noData: {
                  text: "-",
                  align: 'center',
                  verticalAlign: 'middle',
                  offsetX: 0,
                  offsetY: 0,
                  style: {
                    color: undefined,
                    fontSize: '14px',
                    fontFamily: undefined
                  }
                },
                chart: {
                  id: "brushChart",
                  height: 130,
                  type: "bar",
                  foreColor: "#ccc",
                  brush: {
                    target: "anomalyChart",
                    enabled: true,
                    autoScaleYaxis: true
                  },
                  animations: {
                    enabled: false
                  },
                  events: {
                    brushScrolled: (hartContext, { xaxis, yaxis }) => {
                      this.setWindowPosition(xaxis.min, xaxis.max)
                    },
                  },
                  selection: {
                    enabled: true,
                    fill: {
                      color: "#fff",
                      opacity: 0.4
                    },
                    xaxis: {min: nextProps.windowStart, max: nextProps.windowEnd}
                  },
                },
                colors: ["#00A3FF", "#8E1FC3", "#34BB55", "#FFB94A"],//["#FF0080"],
                stroke: {
                  width: 2,
                  curve: "straight"
                },
                grid: {
                  borderColor: "#444"
                },
                markers: {
                  size: 0
                },
                xaxis: {
                  type: "datetime",
                  tooltip: {
                    enabled: false
                  },
                  labels: {
                    datetimeUTC: false
                  }
                },
                yaxis: {
                  tickAmount: 2,
                },
                dataLabels: {
                  enabled: false
                },
                annotations: {
                  xaxis: [...this.state.optionsLine.annotations.xaxis]
                },
            },
            series: nextProps.data,
            annotation: null,
            lineAnnotation: null,
            selectedLog: {timestamp: "", prediiction: ""},
            selectedTimestamp: 0,
            windowStartX: null,
            windowEndX: null,
        }, () => {
          if(!this.props.isFeedbackSelected){
            this.setWindowAtStart(nextProps.data)
          }
          else{
            this.setWindowAtPlace()
          }          
          this.getFailures()
          this.reselectSeriesAtUpdate()
        })
      }      
    }

    deselectAllSeries = () => {
      let seriesToggle = this.state.seriesToggle
      for(let key of Object.keys(seriesToggle)){
        seriesToggle[key] = false
      }
      this.setState({allSeries: {}, series: [], seriesToggle: seriesToggle,
        options: {
          ...this.state.options,
          annotations: {
            xaxis: [],
          }
        },
        optionsLine: {
          ...this.state.optionsLine,
          annotations: {
            xaxis: []
          }
        },
        annotationTimestamps: []})
    }

    selectAllSeries = () => {
      let seriesToggle = this.state.seriesToggle
      for(let key of Object.keys(seriesToggle)){
        seriesToggle[key] = true
      }
      if(this.state.series.length === 0){
        this.getFailures()
      }
      this.setState({allSeries: this.props.graphData, series: Object.values(this.props.graphData), seriesToggle: seriesToggle})
    }

    toggle = (e, sensor) => {
      this.setState({seriesToggle: {...this.state.seriesToggle, [sensor]: !this.state.seriesToggle[sensor]}})
      let allSeries = this.state.allSeries
      if(sensor in allSeries){
        delete allSeries[sensor]
        this.setState({series: Object.values(allSeries), optionsLine: 
          {...this.state.optionsLine, 
            chart: {
                ...this.state.optionsLine.chart, 
                selection: {
                    ...this.state.optionsLine.chart.selection, 
                    xaxis: {min: this.state.windowStartX, max: this.state.windowEndX}
                }
            }
          }
        }, ()=>{
          if(this.state.series.length === 0){
            this.setState({
              options: {
                ...this.state.options,
                annotations: {
                  xaxis: [],
                }
              },
              optionsLine: {
                ...this.state.optionsLine,
                annotations: {
                  xaxis: []
                }
              },
              annotationTimestamps: []})
          }
          console.log(this.state)
        })
      }
      else{
        // console.log("sensor data:", this.props.graphData[sensor])
        if(this.state.series.length === 0){
          this.getFailures()
        }
        this.setState({series: [...this.state.series, this.props.graphData[sensor]], 
          allSeries: {...this.state.allSeries, [sensor]: this.props.graphData[sensor]}, optionsLine: 
          {...this.state.optionsLine, 
            chart: {
                ...this.state.optionsLine.chart, 
                selection: {
                    ...this.state.optionsLine.chart.selection, 
                    xaxis: {min: this.state.windowStartX, max: this.state.windowEndX}
                }
            }
          }}, ()=>{console.log(this.state)})
      }
      //ApexCharts.exec("anomalyChart", 'toggleSeries', sensor)
      //ApexCharts.exec("brushChart", 'toggleSeries', sensor)
    }

    filterSensorNames = () => {
      let sensorNames = this.props.sensorNames
      let query = this.state.searchSensorQuery
      if(query.length){
        let filtered = sensorNames.filter(sn => sn.includes(query))
        return filtered
      }
      return sensorNames
    }

    getInRangeFailures = (log) => {
      if(log){
        let failures = this.state.relatedFailures
        let logDate = new Date(log["time"])
        let startRange = new Date(logDate.getTime() - 60*60*24*7*1000)  // 7 days before 
        let endRange = new Date(logDate.getTime() + 60*60*24*7*1000)  // 7 days later 
        let inRangeFailures = []
        for(let failure of failures){
          let failureDate = new Date(failure["startTime"])
          if(failureDate >= startRange && failureDate <= endRange){
            inRangeFailures.push(failure)
          } 
        }
        console.log("inRangeFailures", inRangeFailures)
        return inRangeFailures
      }
      else{
        return []
      }
    }

    render(){
        return(
          <div className="app" style={{textAlign: "-webkit-center", background: "#000524"}}>
            <div className="row">
              {/* <FailureAnnotationOverlay 
                visible={this.state.overlay}
                onDismiss={()=>this.setState({overlay: !this.state.overlay})}
                annotation={this.state.selectedAnnotation}
                annotationObject={this.state.annotationObject}
                timestamp={this.state.selectedTimestamp}
                addAnnotation={this.addAnnotation}
                deleteAnnotation={this.deleteAnnotation}
                updateAnnotation={this.updateAnnotation}
                changeFeedback={this.changeFeedback}
                user={this.props.user}
              /> */}
              <FeedbackOverlay
                modelID={this.props.modelID}
                log={this.state.selectedLog}
                failures={this.getInRangeFailures(this.state.selectedLog)}
                visible={this.state.overlay}
                onDismiss={()=>this.setState({overlay: !this.state.overlay})}
                getModelLogsData={this.getModelLogsData}
              />
              <Grid>
                  <Grid.Row>
                      <Grid.Column widthXS={Columns.Nine}>
                        <div className="mixed-chart">
                          {this.state.options && <Chart
                            options={this.state.options}
                            series={this.state.series}
                            type="area"
                            width="900"
                            height="450"
                            // ref={lineChartRef}
                          />}
                          {this.state.optionsLine && <Chart
                            options={this.state.optionsLine}
                            series={this.state.series}
                            type="line"
                            width="900"
                            height="150"
                            // ref={brushChartRef}
                          />}
                        </div>
                      </Grid.Column>
                      
                      <Grid.Column 
                        widthXS={Columns.Three}
                        style={{position: "absolute", left: "85%", top: "50%", transform: "translate(-50%, -50%)"}}
                      >
                        <div style={{border: "2px solid #B9B9C5", borderRadius: "5px"}}>
                          <div className="tabbed-page--header-right">
                            <Input
                                onChange={(e) => this.setState({ searchSensorQuery: e.target.value })}
                                name="searchSensorQuery"
                                type={InputType.Text}
                                value={this.state.searchSensorQuery}
                                icon={IconFont.Search}
                                placeholder={"Filter sensor names"}
                                // style={{width: "15%"}}
                            />
                          </div>
                          <br/>
                          <div style={{display: "flex"}}>
                            <div className="tabbed-page--header-left">
                              <Label
                                size={ComponentSize.Small}
                                name={"Sensors"}
                                description={""}
                                color={InfluxColors.Amethyst}
                                id={"sensor-label"} 
                              />
                            </div>
                            <div className="tabbed-page--header-right">
                              <Button
                                color={ComponentColor.Secondary}
                                titleText=""
                                text="Select All"
                                type={ButtonType.Button}
                                onClick={() => this.selectAllSeries()}
                              />
                              <Button
                                color={ComponentColor.Warning}
                                titleText=""
                                text="Deselect All"
                                type={ButtonType.Button}
                                onClick={() => this.deselectAllSeries()}
                              />
                            </div>
                          </div>
                          <br/>
                          <DapperScrollbars
                              autoHide={false}
                              autoSizeHeight={false}
                              style={{ height: "200px", background: InfluxColors.Castle}}
                              className="data-loading--scroll-content"
                          >
                            {this.filterSensorNames().map(sensor => {
                              return(                              
                                <FlexBox
                                  alignItems={AlignItems.Center}
                                  margin={ComponentSize.Small}
                                  className="view-options--checkbox"
                                  key={uuid.v4()}
                                >
                                  <Toggle
                                    id="prefixoptional"
                                    testID="tickprefix-input"
                                    checked={this.state.seriesToggle[sensor]}
                                    name={sensor}
                                    type={InputToggleType.Checkbox}
                                    value={this.state.seriesToggle[sensor]}
                                    onChange={(e)=>this.toggle(e, sensor)}
                                    size={ComponentSize.ExtraSmall}
                                  />
                                  <InputLabel active={this.state.seriesToggle[sensor]}>{sensor}</InputLabel>
                                </FlexBox>
                              )
                            })}
                          </DapperScrollbars>
                        </div>
                        <br/><br/>
                          
                        <div style={{border: "2px solid #B9B9C5", borderRadius: "5px"}}>
                          <div style={{display: "flex"}}>
                            <div className="tabbed-page--header-left">
                              <Label
                                size={ComponentSize.Small}
                                name={this.state.showModelLogs ? "Model Logs" : "Failures"}
                                description={""}
                                color={InfluxColors.Amethyst}
                                id={"failures-label"} 
                              />
                              <Button
                                color={ComponentColor.Primary}
                                titleText=""
                                text={this.state.showModelLogs ? "Show Failures" : "Show Model Logs"}
                                type={ButtonType.Button}
                                onClick={() => {this.setState({showModelLogs: !this.state.showModelLogs})}}
                              />
                            </div>
                            <div className="tabbed-page--header-right"> 
                              <FlexBox
                                key="tog-flex"
                                direction={FlexDirection.Row}
                                margin={ComponentSize.Small}
                              >
                                <SlideToggle
                                  active={this.state.showFilters}
                                  size={ComponentSize.ExtraSmall}
                                  onChange={() => this.setState({ showFilters: !this.state.showFilters })}
                                  testID="rule-card--slide-toggle"
                                />
                                <InputLabel>Filters</InputLabel>

                              </FlexBox>
                            </div>
                          </div>
                          {this.state.showFilters && !this.state.showModelLogs && (
                            <Grid>
                              <br/>
                              <Grid.Row>
                                <Grid.Column widthXS={Columns.Four}>
                                  <div className="tabbed-page--header-left">
                                      <Label
                                        size={ComponentSize.Small}
                                        name={"Severity"}
                                        description={""}
                                        color={InfluxColors.Wasabi}
                                        id={"severity-label"} 
                                      />
                                    </div>                                
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Four}>
                                    <div className="tabbed-page--header-left">
                                      <MultiSelectDropdown
                                          emptyText={"Select Severity"}
                                          options={["acceptable", "major", "critical"]}
                                          selectedOptions={this.state.filterSeverity}
                                          onSelect={this.onSelectFilterSeverity}
                                          style={{width:"100px"}}
                                      />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Four}></Grid.Column>
                              </Grid.Row>
                              <Grid.Row>
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <div className="tabbed-page--header-left">
                                      <FilterTimeRangeDropdown
                                          onSetTimeRange={this.handleChooseTimeRange}
                                          timeRange={this.state.filterTimeRange}
                                      />
                                    </div>                                
                                </Grid.Column>
                              </Grid.Row>                         
                          </Grid>
                          )}
                          {this.state.showFilters && this.state.showModelLogs && (
                            <Grid>
                              <br/>
                              <Grid.Row>
                                <Grid.Column widthXS={Columns.Twelve}>
                                  <div className="tabbed-page--header-right">
                                    <FilterTimeRangeDropdown
                                      onSetTimeRange={this.handleChooseTimeRangeLogs}
                                      timeRange={this.state.filterTimeRangeLogs}
                                    />
                                  </div>                                
                                </Grid.Column>
                              </Grid.Row>                         
                            </Grid>
                          )}
                          <br/>
                          <DapperScrollbars
                              autoHide={false}
                              autoSizeHeight={false}
                              style={{ height: '250px', background: InfluxColors.Castle}}
                              className="data-loading--scroll-content"
                          >
                            {/* {this.state.machineAnomalies.map(anomaly => {
                              return(                              
                                <FlexBox
                                  alignItems={AlignItems.Center}
                                  margin={ComponentSize.Small}
                                  className="view-options--checkbox"
                                  key={uuid.v4()}
                                >
                                  <SquareButton
                                    icon={IconFont.EyeOpen}
                                    onClick={() => this.onClickAnomaly(anomaly["timestamp"] ? anomaly["timestamp"] : undefined)}
                                    titleText={"Go to this timestamp on graph"}
                                    //status={status}
                                    className="flow-move-cell-button"
                                    color={ComponentColor.Success}
                                  />
                                  <InputLabel>{anomaly["timestamp"] ? new Date(anomaly["timestamp"]).toLocaleString() : "-"}</InputLabel>                                
                                </FlexBox>
                              )
                            })} */}
                            {this.state.showModelLogs ? (
                              <Table
                                  borders={BorderType.Vertical}
                                  fontSize={ComponentSize.ExtraSmall}
                                  cellPadding={ComponentSize.ExtraSmall}
                              >
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell style={{width: "100px"}}>Time</Table.HeaderCell>
                                        <Table.HeaderCell style={{width: "70px"}}>Result</Table.HeaderCell>
                                        <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                        <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {this.state.shownModelsLogsData.map((log, i) => {
                                        let startTimeDate = new Date(log["time"])
                                        return (
                                        <Table.Row key={uuid.v4()}>
                                            <Table.Cell style={{width: "100px"}}>{(startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.toLocaleString() : ""}</Table.Cell>
                                            <Table.Cell style={{width: "70px"}}>{log["prediction"]}</Table.Cell>
                                            <Table.Cell style={{width: "30px"}}>
                                                <SquareButton
                                                    icon={IconFont.EyeOpen}
                                                    onClick={() => this.onClickFailure((startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.getTime() : undefined)} 
                                                    titleText={"Go to this timestamp on graph"}
                                                    //status={status}
                                                    className="flow-move-cell-button"
                                                    color={ComponentColor.Success}
                                                />
                                            </Table.Cell>
                                            <Table.Cell style={{width: "30px"}}>
                                                <SquareButton
                                                    icon={IconFont.Annotate}
                                                    onClick={() => {
                                                      this.setState({selectedLog: log, overlay: true})
                                                      //console.log((startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.getTime() : undefined)
                                                    }} 
                                                    titleText={"Give feedback to this log"}
                                                    //status={status}
                                                    className="flow-move-cell-button"
                                                    color={ComponentColor.Secondary}
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                        )
                                    }
                                    )}
                                </Table.Body>
                              </Table>
                            ) : (
                            <Table
                                borders={BorderType.Vertical}
                                fontSize={ComponentSize.ExtraSmall}
                                cellPadding={ComponentSize.ExtraSmall}
                            >
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell style={{width: "70px"}}>Severity</Table.HeaderCell>
                                        <Table.HeaderCell style={{width: "100px"}}>Time</Table.HeaderCell>
                                        <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                        <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {this.state.shownRelatedFailures.map((failure, i) => {
                                      let startTimeDate = new Date(failure["startTime"])
                                      return (
                                        <Table.Row key={uuid.v4()}>
                                            <Table.Cell style={{width: "70px"}}>{failure["severity"]}</Table.Cell>
                                            <Table.Cell style={{width: "100px"}}>{(startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.toLocaleString() : ""}</Table.Cell>
                                            
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
                                                onClick={() => this.onClickFailure((startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.getTime() : undefined)}
                                                titleText={"Go to this timestamp on graph"}
                                                //status={status}
                                                className="flow-move-cell-button"
                                                color={ComponentColor.Success}
                                              />
                                            </Table.Cell>
                                        </Table.Row>
                                      )
                                    }
                                    )}
                                </Table.Body>
                            </Table>)}
                          </DapperScrollbars>
                        </div>
                      </Grid.Column>
                  </Grid.Row> 
              </Grid>
            </div>
          </div>
        )
    }
}

export default FailureBrushGraph