import React, {PureComponent} from 'react'
import Chart from 'react-apexcharts'

interface Props {
    report: object
}

class PredictedVSActualPerGroupGraph extends PureComponent<Props>{
    state = {
        series: [{
            color: "#DC4E58",
            name: "Predicted vs Actual",
            data: []
          }],
        options: {
            chart: {
                height: 350,
                type: 'scatter',
                zoom: {
                enabled: true,
                type: 'xy'
                },
                foreColor: "white"
            },
            xaxis: {
                tickAmount: 10,
                labels: {
                    formatter: function(val) {
                        return val
                        // return parseFloat(val).toFixed(1)
                }},
                title: {
                    text: "Actual Value"
                } 
                
            },
            yaxis: {
                title: {
                    text: "Predicted Value"
                }
            },
            tooltip: {
                theme: "dark",
                y: {
                  title: {
                      formatter: (seriesName, config) => { 
                          return `Actual: ${config["dataPointIndex"]} vs Predicted:` 
                      },
                  },
                  formatter: function (val) {
                      return val;
                    },
                },
            }
        },
        
        
    };

    generateGraphData = () => {
        let report = this.props.report
        console.log("report", report)
        
        let predictions = JSON.parse(report["prediction"])
        let feedback = JSON.parse(report["feedback"])

        let majoritySeries = []
        let overestimationSeries = []
        let underestimationSeries = []


        // 25.08.22
        let errors = []
        for(let i=0;i<predictions.length;i++){
            errors.push({prediction: predictions[i], feedback: feedback[i], error: predictions[i]-feedback[i]})
        }

        errors.sort((a,b) => a.error-b.error)
        console.log("errors", errors)

        let top5 = Math.round(errors.length*(5/100))
        let last5 = Math.round(errors.length-(errors.length*(5/100)))

        console.log(top5, last5)
        let underestimatesArr = errors.slice(0, top5)
        let majorityArr = errors.slice(top5, last5)
        let overestimatesArr = errors.slice(last5, errors.length)

        /* console.log("lengths", underestimatesArr.length, underestimatesArr[0], underestimatesArr[underestimatesArr.length-1])
        console.log("lengths", majorityArr.length, majorityArr[0], majorityArr[majorityArr.length-1])
        console.log("lengths", overestimatesArr.length, overestimatesArr[0], overestimatesArr[overestimatesArr.length-1]) */

        for (let i = 0; i < underestimatesArr.length; i++) {
            underestimationSeries.push([underestimatesArr[i]["feedback"], underestimatesArr[i]["prediction"]])            
        }
        for (let i = 0; i < majorityArr.length; i++) {
            majoritySeries.push([majorityArr[i]["feedback"], majorityArr[i]["prediction"]])            
        }
        for (let i = 0; i < overestimatesArr.length; i++) {
            overestimationSeries.push([overestimatesArr[i]["feedback"], overestimatesArr[i]["prediction"]])            
        }

        /* for(let i=0;i<predictions.length;i++){
            let error = predictions[i] - feedback[i]
            if(predictions[i]<feedback[i]){
                let merr = Math.abs(error-majority)
                let oerr = Math.abs(error-overestimation)
                let uerr = Math.abs(error-underestimation)
                let minerr = Math.min(merr, oerr, uerr)
                if(minerr === uerr){
                    underestimationSeries.push([feedback[i], predictions[i]])
                }
                else{
                    majoritySeries.push([feedback[i], predictions[i]])
                }
            }
            else if(predictions[i]>feedback[i]){
                let merr = Math.abs(error-majority)
                let oerr = Math.abs(error-overestimation)
                let uerr = Math.abs(error-underestimation)
                let minerr = Math.min(merr, oerr, uerr)
                if(minerr === oerr){
                    overestimationSeries.push([feedback[i], predictions[i]])
                }
                else{
                    majoritySeries.push([feedback[i], predictions[i]])
                }
            }
        } */

        this.setState({series: [{
            color: "#34BB55",
            name: "Majority",
            data: majoritySeries
          },{
            color: "#DC4E58",
            name: "Overestimation",
            data: overestimationSeries
          },{
            color: "#00A3FF",
            name: "Underestimation",
            data: underestimationSeries
          }]})
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
                <Chart options={this.state.options} series={this.state.series} type="scatter" height={350} style={{color: "black"}} />
            </div>
        )
    }
}

export default PredictedVSActualPerGroupGraph

