import React, {Component, useRef} from 'react'
import Chart from 'react-apexcharts'
import ApexCharts from 'apexcharts'
import AnnotationOverlay from './AnnotationOverlay'
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import { Grid, Columns, DapperScrollbars, Input, Toggle, InputType, Table, BorderType,
  InputLabel, FlexBox, FlexDirection, JustifyContent, AlignItems, ComponentSize, InputToggleType,
  InfluxColors, Label, ComponentColor, ButtonType, Button, IconFont, SquareButton, QuestionMarkTooltip,
  MultiSelectDropdown, SlideToggle
} from '@influxdata/clockface'
import uuid from 'uuid'
import {TimeRange} from 'src/types'
import FilterTimeRangeDropdown from "./FilterTimeRangeDropdown"

interface Props {
    name: string
    orgID: string
    machineID: string
    data: object[]
    graphData: object
    windowStart: number
    windowEnd: number
    modelID: string
    /* timeRange: object
    aggregatePeriod: string */
    chartID: string
    sensorNames: string[]
    isAnomalySelected: boolean
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
    selectedAnnotation: object,
    selectedTimestamp: number,
    windowStartX: number
    windowEndX: number
    machineAnomalies: object[]
    shownMachineAnomalies: object[]
    seriesToggle: object
    annotationObject: object
    filterType: string[]
    filterCode: string[]
    filterUserFeedback: string
    filterFeedback: string
    filterTimeRange: TimeRange
    showFilters: boolean
    searchSensorQuery: string
}

//const lineChartRef = useRef(null)
//const brushChartRef = useRef(null)

class AnomalyBrushGraph extends Component<Props, State> {
    constructor(props){
        super(props)
        // console.log(props)
        let stop = new Date().toISOString()
        let start = new Date(new Date().getTime() - 24*60*60*365*1000).toISOString()
        this.state = {
            filterTimeRange: {
              lower: start,
              upper: stop,
              type: 'custom'
            },
            searchSensorQuery: "",
            filterType: [],
            filterCode: [],
            filterUserFeedback: "",
            filterFeedback: "",
            showFilters: false,
            machineAnomalies: [],
            shownMachineAnomalies: [],
            overlay: false,
            annotationTimestamps: [],
            options: {
                legend: {
                  show: false
                },
                noData: {
                  text: "There is no data. Try selecting a sensor or an anomaly timestamp from the list.",
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
            selectedAnnotation: null,
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
      this.setState({ filterTimeRange: timeRange }, ()=>this.filterAnomalies())
      console.log(timeRange)
    }

    onSelectFilterType = (option: string) => {
      const { filterType } = this.state
      const optionExists = filterType.find(opt => opt === option)
      let updatedOptions = filterType
  
      if (optionExists) {
        updatedOptions = filterType.filter(fo => fo !== option)
      } else {
        updatedOptions = [...filterType, option]
      }
  
      this.setState({ filterType: updatedOptions }, ()=>this.filterAnomalies())
    }

    onSelectFilterCode = (option: string) => {
      const { filterCode } = this.state
      const optionExists = filterCode.find(opt => opt === option)
      let updatedOptions = filterCode
  
      if (optionExists) {
        updatedOptions = filterCode.filter(fo => fo !== option)
      } else {
        updatedOptions = [...filterCode, option]
      }
  
      this.setState({ filterCode: updatedOptions }, ()=>this.filterAnomalies())
    }
  

    isInOneSecondRange = (annotationTimestamp) => {
      let oneAhead = new Date(annotationTimestamp + 1000).getTime()
      let oneBehind = new Date(annotationTimestamp - 1000).getTime()
      
      let timestamps = this.state.annotationTimestamps
      for(let timestamp of timestamps){
        if(timestamp <= oneAhead && timestamp >= oneBehind){
          return [true, timestamp]
        }
        if(timestamp - annotationTimestamp > 2000){
          break
        }
      }
      return [false, annotationTimestamp]
    }

    onPointClick = (annotation, lineAnnotation) => {
      
      if(this.state.annotationTimestamps.includes(annotation.x)){
        console.log("ALREADY ANNOTATED", annotation.x, this.state.annotationTimestamps)
        let annotations = this.state.options.annotations.xaxis
        let annotationObject = this.state.machineAnomalies.find(x => x.timestamp === annotation.x)
        let selectedAnotation = annotations.find(a => a.x === annotation.x)
        this.setState({overlay: true, annotation: annotation, lineAnnotation: lineAnnotation, 
            selectedAnnotation: selectedAnotation, selectedTimestamp: annotation.x, annotationObject: annotationObject}, ()=> console.log("--", this.state))
      }
      else{
        let checkCloseness = this.isInOneSecondRange(annotation.x)
        if(checkCloseness[0]){
          console.log("old x", annotation.x)
          annotation.x = checkCloseness[1]
          console.log("ALREADY ANNOTATED NEARLY", annotation.x, this.state.annotationTimestamps)
          let annotations = this.state.options.annotations.xaxis
          let annotationObject = this.state.machineAnomalies.find(x => x.timestamp === annotation.x)
          let selectedAnotation = annotations.find(a => a.x === annotation.x)
          this.setState({overlay: true, annotation: annotation, lineAnnotation: lineAnnotation, 
              selectedAnnotation: selectedAnotation, selectedTimestamp: annotation.x, annotationObject: annotationObject}, ()=> console.log("--", this.state))
        }
        else{
          console.log("ADD NEW ANNOTAION", annotation.x, this.state.annotationTimestamps)
          this.setState({overlay: true, annotation: annotation, lineAnnotation: lineAnnotation, 
              selectedAnnotation: null, selectedTimestamp: annotation.x, annotationObject: null}, ()=> console.log("**", this.state))
        }
      }
    }

    changeFeedback = (timestamp, feedback) => {
      let anomaly = {
        "timestamp": timestamp,
        "feedback": feedback
      }
      HealthAssessmentService.updateAnomalyFeedback(this.props.machineID, this.props.modelID, {"anomaly": anomaly}).then(res=> {
        this.setState({annotationObject: {...this.state.annotationObject, "feedback": feedback}},()=>{
          this.getMachineAnomalies()
          this.props.changeWindowPoints(this.state.windowStartX, this.state.windowEndX)
        })          
      }).catch(err=>console.log(err))
    }

    filterAnomalies = () => {
      let allAnomalies = this.state.machineAnomalies
      const {filterCode, filterType, filterUserFeedback} = this.state
      let filteredAnomalies = []
      if(allAnomalies){
        for(let anomaly of allAnomalies){
          let lower = new Date(this.state.filterTimeRange.lower).getTime()
          let upper = new Date(this.state.filterTimeRange.upper).getTime()
          if(filterCode.length === 0 || filterCode.includes(anomaly["code"])){
            if(filterType.length === 0 || filterType.includes(anomaly["type"])){
              if(anomaly["feedback"]){
                if(anomaly["feedback"].includes(filterUserFeedback)){
                  if(anomaly["timestamp"]>=lower && anomaly["timestamp"]<=upper)
                    filteredAnomalies.push(anomaly)
                }
              }
              else if(anomaly["user"]){
                if(anomaly["user"].includes(filterUserFeedback)){
                  if(anomaly["timestamp"]>=lower && anomaly["timestamp"]<=upper)
                    filteredAnomalies.push(anomaly)
                }
              }
              else{
                if(anomaly["timestamp"]>=lower && anomaly["timestamp"]<=upper)
                  filteredAnomalies.push(anomaly)
              }
            }
          }
        }
        this.setState({shownMachineAnomalies: filteredAnomalies})
      }
    }

    addAnnotation = (type, code, description, user) => {
      let annotation = this.state.annotation
      let lineAnnotation = this.state.lineAnnotation
      if(annotation && lineAnnotation){
        let anomaly = {
          "type": "manual",
          "timestamp": annotation.x, 
          "code": code, 
          "description": description,
          "user": user
        }
        HealthAssessmentService.addMachineAnomaly(this.props.machineID, this.props.modelID, {"anomaly": anomaly}).then(res=> {
          this.setState({overlay: !this.state.overlay}, () => {
            this.getMachineAnomalies()
            // this.props.changeWindowPoints(this.state.windowStartX, this.state.windowEndX)
          })
        }).catch(err=>console.log(err))
        // console.log("window while addition: ", this.state.windowStartX, this.state.windowEndX)
        /* this.setState({options: {...this.state.options, annotations: {xaxis: [...this.state.options.annotations.xaxis, annotation]}},
          optionsLine: {...this.state.optionsLine, annotations: {xaxis: [...this.state.optionsLine.annotations.xaxis, lineAnnotation]}}, 
          annotationTimestamps: [...this.state.annotationTimestamps, annotation.x],
          overlay: !this.state.overlay}, () => {this.props.changeWindowPoints(this.state.windowStartX, this.state.windowEndX); console.log("after addition", this.state)}) */
      }
    }

    onClickAnomaly = (timestamp) => {
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

    setWindowOnDataChange = () => {
      this.props.changeWindowPoints(this.state.windowStartX, this.state.windowEndX)
    }

    updateAnnotation = (timestamp, anomaly) => {
      console.log(timestamp, anomaly)
      let changedAnomaly = {
        "timestamp": timestamp,
        "code": anomaly["code"],
        "description": anomaly["description"]
      }
      HealthAssessmentService.updateManualAnomaly(this.props.machineID, this.props.modelID, {"anomaly": changedAnomaly}).then(res=> {
        this.setState({annotationObject: {...this.state.annotationObject, "code": anomaly["code"], "description": anomaly["description"]}},()=>{
          this.getMachineAnomalies()
          // this.props.changeWindowPoints(this.state.windowStartX, this.state.windowEndX)
        })          
      }).catch(err=>console.log(err))
    }

    deleteAnnotation = (timestamp) => {
      let anomaly = {"timestamp": timestamp}
      HealthAssessmentService.deleteMachineAnomaly(this.props.machineID, this.props.modelID, {"anomaly": anomaly}).then(res=> {
        this.setState({overlay: !this.state.overlay}, () => {
          this.getMachineAnomalies()
          this.props.changeWindowPoints(this.state.windowStartX, this.state.windowEndX)
        })
      }).catch(err=>console.log(err))
      /* let annotations = this.state.options.annotations.xaxis
      let brushAnnotations = this.state.optionsLine.annotations.xaxis
      let annotationTimestamps = this.state.annotationTimestamps
      let selectedAnotation = annotations.find(a => a.x === timestamp)
      if(selectedAnotation){
        let newAnnotations = annotations.filter(a => a.x !== timestamp)
        let newBrushAnnotations = brushAnnotations.filter(a => a.x !== timestamp)
        let newAnnotationTimestamps = annotationTimestamps.filter(a => a !== timestamp)
        this.setState({
          options: {
            ...this.state.options,
            annotations: {
              xaxis: newAnnotations,
            }
          },
          optionsLine: {
            ...this.state.optionsLine,
            annotations: {
              xaxis: newBrushAnnotations
            }
          },
          annotationTimestamps: newAnnotationTimestamps, overlay: !this.state.overlay
        }, () => {this.props.changeWindowPoints(this.state.windowStartX, this.state.windowEndX); console.log("after deletion", this.state)})
      } */
    }

    getMachineAnomalies = async () => {
      const anomalies = await HealthAssessmentService.getMachineAnomalies(this.props.machineID)
      this.setState({
          machineAnomalies: anomalies[this.props.modelID],
          //shownMachineAnomalies: anomalies[this.props.modelID]
      }, ()=>{
        this.putAnomalyAnnotationsOnGraph(); 
        this.filterAnomalies(); 
        console.log("brush anomalies", this.state.machineAnomalies)
        this.props.changeWindowPoints(this.state.windowStartX, this.state.windowEndX)
      });
    }

    returnFeedbackText = (feedback) => {
      if(feedback === "unlabeled")
        return "Unlabeled"
      else if(feedback === "fp")
        return "False Positive"
      else if(feedback === "tp")
        return "True Positive"
    }

    getAnnotationText = (type, anomaly) => {
      if(type === "model"){
        return this.returnFeedbackText(anomaly["feedback"])
      }
      else{
        return "Manual"
      }
    }

    putAnomalyAnnotationsOnGraph = () => {
      let anomalies = this.state.machineAnomalies
      console.log("anomaliess", anomalies)
      let annotations = []
      let lineAnnotations = []
      let anomalyTimestamps = []
      if(anomalies){
        for(let anomaly of anomalies){
          let anno = {
            x: anomaly["timestamp"],
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
              text: this.getAnnotationText(anomaly["type"], anomaly)
            }
          }

          let lineAnno = {
            x: anomaly["timestamp"],
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
          anomalyTimestamps.push(anomaly["timestamp"])
        }
        console.log(anomalyTimestamps)

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
          },
          annotationTimestamps: anomalyTimestamps
        }, () => console.log("-annotations-", this.state.options, this.state.optionsLine))  
      }    
    }

    

    async componentDidMount() {
      //this.props.data[0][0] this.props.data[10][0]
      // 2022-04-20T13:00:00Z, stop: 2022-04-20T15:00:00Z
      // -12s, stop: now()
      // |> aggregateWindow(every: 20s, fn: mean, createEmpty: false)
      // |> window(every: 20s)
      console.log("PROPS", this.props)
      this.getMachineAnomalies()
      this.setWindowAtStart(this.props.data)
      if(this.props.sensorNames.length){
        this.setState({series: [this.props.data[0]], allSeries: {[this.props.data[0]["name"]]: this.props.data[0]}
        }, () => this.selectOneSeries())
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

    getTooltip = (type, info) => {
      if(type === "model"){
        return(
          <div className="flux-function-docs" style={{width: "250px", height: "100px"}}>
            <div className="flux-toolbar--popover">
              <article className="flux-functions-toolbar--description">
                <div className="flux-function-docs--heading">Anomaly Info</div>
                {/* <span>{description}</span> */}
              </article>
              <div className="flux-function-docs--arguments" key={uuid.v4()}>
                <span>{"Feedback"}:</span>
                <span>{info}</span>
                {/* <div>{a.desc}</div> */}
              </div>
            </div>
          </div>
        )
      }
      if(type === "manual"){
        return(
          <div className="flux-function-docs" style={{width: "250px", height: "100px"}}>
            <div className="flux-toolbar--popover">
              <article className="flux-functions-toolbar--description">
                <div className="flux-function-docs--heading">Anomaly Info</div>
                {/* <span>{description}</span> */}
              </article>
              <div className="flux-function-docs--arguments" key={uuid.v4()}>
                <span>{"User"}:</span>
                <span>{info}</span>
                {/* <div>{a.desc}</div> */}
              </div>
            </div>
          </div>
        )
      }
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
                  text: "There is no data. Try selecting a sensor or an anomaly timestamp from the list.",
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
                  xaxis: []
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
                  xaxis: [
                    {
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
                    }
                  ]
                },
            },
            series: nextProps.data,
            annotation: null,
            lineAnnotation: null,
            selectedAnnotation: null,
            selectedTimestamp: 0,
            windowStartX: null,
            windowEndX: null,
        }, () => {
          if(!this.props.isAnomalySelected){
            this.setWindowAtStart(nextProps.data)
          }
          else{
            this.setWindowAtPlace()
          }          
          this.getMachineAnomalies()
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
        this.getMachineAnomalies()
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
          this.getMachineAnomalies()
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

    render(){
        return(
          <div className="app" style={{textAlign: "-webkit-center", background: "#000524"}}>
            <div className="row">
              <AnnotationOverlay 
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
                        style={{position: "absolute", left: "85%", top: "53%", transform: "translate(-50%, -50%)"}}
                      >
                        
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
                        <br/><br/>

                        <div style={{display: "flex"}}>
                          <div className="tabbed-page--header-left">
                            <Label
                              size={ComponentSize.Small}
                              name={"Anomalies"}
                              description={""}
                              color={InfluxColors.Amethyst}
                              id={"anomalies-label"} 
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
                        {this.state.showFilters && (
                          <Grid>
                            <br/>
                            <Grid.Row>
                              <Grid.Column widthXS={Columns.Four}>
                                <div className="tabbed-page--header-left">
                                  <MultiSelectDropdown
                                    emptyText={"Type"}
                                    options={["model", "manual"]}
                                    selectedOptions={this.state.filterType}
                                    onSelect={this.onSelectFilterType}
                                    style={{width:"100px"}}
                                  />
                                </div>
                              </Grid.Column>
                              <Grid.Column widthXS={Columns.Eight}>
                                <div className="tabbed-page--header-left">
                                  <Input
                                    onChange={(e) => this.setState({ filterUserFeedback: e.target.value}, ()=>this.filterAnomalies())}
                                    name=""
                                    type={InputType.Text}
                                    value={this.state.filterUserFeedback}
                                    placeholder="User/Feedback"
                                  />
                                </div>                                
                              </Grid.Column>
                            </Grid.Row>
                            <Grid.Row>
                              <Grid.Column widthXS={Columns.Four}>
                                <div className="tabbed-page--header-left">
                                  <MultiSelectDropdown
                                    emptyText={"Code"}
                                    options={["type1", "type2", "type3"]}
                                    selectedOptions={this.state.filterCode}
                                    onSelect={this.onSelectFilterCode}
                                    style={{width:"100px"}}
                                  />
                                </div>
                              </Grid.Column>
                              <Grid.Column widthXS={Columns.Eight}>
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
                          <Table
                              borders={BorderType.Vertical}
                              fontSize={ComponentSize.ExtraSmall}
                              cellPadding={ComponentSize.ExtraSmall}
                          >
                              <Table.Header>
                                  <Table.Row>
                                      <Table.HeaderCell style={{width: "70px"}}>Type</Table.HeaderCell>
                                      <Table.HeaderCell style={{width: "100px"}}>Time</Table.HeaderCell>
                                      <Table.HeaderCell style={{width: "70px"}}>Code</Table.HeaderCell>
                                      {/* <Table.HeaderCell style={{width: "70px"}}>User</Table.HeaderCell>
                                      <Table.HeaderCell style={{width: "50px"}}>Feedback</Table.HeaderCell> */}
                                      <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                      <Table.HeaderCell style={{width: "30px"}}></Table.HeaderCell>
                                  </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                  {this.state.shownMachineAnomalies.map((anomaly, i) => {
                                    if(anomaly["type"] === "model"){
                                      return (
                                        <Table.Row key={uuid.v4()}>
                                            <Table.Cell style={{width: "70px"}}>Model</Table.Cell>
                                            <Table.Cell style={{width: "100px"}}>{anomaly["timestamp"] ? new Date(anomaly["timestamp"]).toLocaleString() : "-"}</Table.Cell>
                                            <Table.Cell style={{width: "70px"}}>{anomaly["code"]}</Table.Cell>
                                            {/* <Table.Cell style={{width: "70px"}}>{"-"}</Table.Cell>
                                            <Table.Cell style={{width: "50px"}}>{anomaly["feedback"]}</Table.Cell> */}
                                            <Table.Cell style={{width: "30px"}}>
                                            <QuestionMarkTooltip
                                                style={{ marginLeft: "5px" }}
                                                diameter={15}
                                                color={ComponentColor.Secondary}
                                                tooltipContents={this.getTooltip("model", anomaly["feedback"])}
                                            />
                                            </Table.Cell>
                                            <Table.Cell style={{width: "30px"}}>
                                              <SquareButton
                                                icon={IconFont.EyeOpen}
                                                onClick={() => this.onClickAnomaly(anomaly["timestamp"] ? anomaly["timestamp"] : undefined)}
                                                titleText={"Go to this timestamp on graph"}
                                                //status={status}
                                                className="flow-move-cell-button"
                                                color={ComponentColor.Success}
                                              />
                                            </Table.Cell>
                                        </Table.Row>
                                      )
                                    }
                                    else if(anomaly["type"] === "manual"){
                                      return (
                                        <Table.Row key={uuid.v4()}>
                                            <Table.Cell style={{width: "70px"}}>Manual</Table.Cell>
                                            <Table.Cell style={{width: "100px"}}>{anomaly["timestamp"] ? new Date(anomaly["timestamp"]).toLocaleString() : "-"}</Table.Cell>
                                            <Table.Cell style={{width: "70px"}}>{anomaly["code"]}</Table.Cell>
                                            {/* <Table.Cell style={{width: "70px"}}>{anomaly["user"]}</Table.Cell>
                                            <Table.Cell style={{width: "50px"}}>{"-"}</Table.Cell> */}
                                            <Table.Cell style={{width: "30px"}}>
                                            <QuestionMarkTooltip
                                                style={{ marginLeft: "5px" }}
                                                diameter={15}
                                                color={ComponentColor.Secondary}
                                                tooltipContents={this.getTooltip("manual", anomaly["user"])}
                                            />
                                            </Table.Cell>
                                            <Table.Cell style={{width: "30px"}}>
                                              <SquareButton
                                                icon={IconFont.EyeOpen}
                                                onClick={() => this.onClickAnomaly(anomaly["timestamp"] ? anomaly["timestamp"] : undefined)}
                                                titleText={"Go to this timestamp on graph"}
                                                //status={status}
                                                className="flow-move-cell-button"
                                                color={ComponentColor.Success}
                                              />
                                            </Table.Cell>
                                        </Table.Row>
                                      )
                                    }
                                  }
                                  )}
                              </Table.Body>
                          </Table>
                        </DapperScrollbars>

                      </Grid.Column>
                  </Grid.Row> 
              </Grid>
            </div>
          </div>
        )
    }
}

export default AnomalyBrushGraph