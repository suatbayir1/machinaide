import React, {PureComponent} from 'react'
import Chart from 'react-apexcharts'

interface Props {
    report: object
}

class ErrorDistributionGraph extends PureComponent<Props>{
    state = {
        series: [],
        options: {            
          chart: {
            height: 350,
            type: 'line',
            foreColor: "white",
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth'
          },
          xaxis: {
            title: {
                text: "Error (Predicted - Actual)",
                //offsetY: 50
            },
            //categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
          },
          yaxis: {
            title: {
                text: "Error"
            },
            labels: {
                formatter: (value) => {return value.toFixed(0)}
            },
          },
          tooltip: {
            /* x: {
              format: 'dd/MM/yy HH:mm'
            }, */
            y: {
                title: {
                    formatter: (seriesName, config) => { 
                      let index = config["dataPointIndex"]
                      let x = config["w"]["config"]["series"]["0"]["data"][index]["x"]
                      let range = parseInt(x) + 20 + ""
                      return `(${x}) - (${range}):` 
                    },
                },
                formatter: function (val) {
                    return val.toFixed(2);
                  },
              },
          }
        }
    }

    generateGraphData = () => {
        let report = this.props.report
        let predictions = JSON.parse(report["prediction"])
        let feedback = JSON.parse(report["feedback"])
        let errors = []
        for(let i=0;i<predictions.length;i++){
            errors.push(predictions[i]-feedback[i])
        }
        let minError = Math.min.apply(Math,errors)-10
        let maxError = Math.max.apply(Math,errors)
        console.log("min max", minError, maxError)
        let errDict = {}
        for (let rangeStart = minError; rangeStart < maxError+1; rangeStart+=20) {
            errDict[rangeStart] = 0            
        }
        for(let i=0; i<errors.length; i++){
            for (let rangeStart = minError; rangeStart < maxError+1; rangeStart+=20) {
                if(errors[i]>rangeStart && errors[i]<=rangeStart+20){
                    errDict[rangeStart] = errDict[rangeStart] + 1
                    break
                }           
            }
        }
        
        let cats = Object.keys(errDict).sort((a,b) => parseInt(a)-parseInt(b))
        let data = []

        for(let key of Object.keys(errDict)){
            data.push({x: key, y: (errDict[key]/errors.length)*100})
        }
        data.sort((a,b) => parseInt(a["x"])-parseInt(b["x"]))
        let series = [{name: "Error", data: data, color: "#DC4E58"}]        
        console.log("error series", series)
        this.setState({series: series, options: {...this.state.options, xaxis: {
            type: 'category',
            categories: cats
        }}})
    }

    componentDidMount(){
        let report = this.props.report
        if(report){
            this.generateGraphData()
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any): void {
        if(!prevProps.report && this.props.report){
            this.generateGraphData()
        }
    }

    render(){
        return(
            <div id="chart" style={{ background: '#292933', fontSize: '15px' }}>
                <Chart options={this.state.options} series={this.state.series} type="bar" height={350} style={{color: "black"}} />
            </div>
        )
    }
}

export default ErrorDistributionGraph

