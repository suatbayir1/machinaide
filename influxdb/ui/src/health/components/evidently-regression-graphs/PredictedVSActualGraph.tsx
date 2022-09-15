import React, {PureComponent} from 'react'
import Chart from 'react-apexcharts'

interface Props {
    report: object
}

class PredictedVSActualGraph extends PureComponent<Props>{
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
        let series = []
        for(let i=0;i<predictions.length;i++){
            //console.log([feedback[i], predictions[i]])
            series.push([feedback[i], predictions[i]])
        }
        this.setState({series: [{
            color: "#DC4E58",
            name: "Predicted vs Actual",
            data: series
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
                {this.props.report ? <Chart options={this.state.options} series={this.state.series} type="scatter" height={350} style={{color: "black"}} /> : <></>}
            </div>
        )
    }
}

export default PredictedVSActualGraph

