import React, {PureComponent} from 'react'
import ReactApexChart from 'react-apexcharts'

interface Props {
    report: object
}

class ErrorNormalityGraph extends PureComponent<Props>{
    state = {
        series: [],
        options: {
            grid: {
                xaxis: {
                    lines: {
                        show: true
                    }
                },   
                yaxis: {
                    lines: {
                        show: true
                    }
                },
            },
            chart: {
                height: 350,
                type: 'line',
                zoom: {
                    enabled: true,
                    type: 'xy'
                },
                foreColor: "white"
            },
            
          markers: {
            size: [6, 0]
          },
            xaxis: {
                tickAmount: 10,
                labels: {
                    formatter: function(val) {
                        return val.toFixed(2)
                        // return parseFloat(val).toFixed(1)
                }},
                title: {
                    text: "Theoretical Quantiles"
                } ,
                type:"numeric"
                
            },
            yaxis: {
                title: {
                    text: "Dataset Quantiles"
                },
                labels: {
                    formatter: function(val) {
                        return val.toFixed(2)
                        // return parseFloat(val).toFixed(1)
                }},
            },
            tooltip: {
                theme: "dark",
                y: {
                  title: {
                      formatter: (seriesName, config) => { 
                        let index = config["dataPointIndex"]
                        let x = config["w"]["config"]["series"]["0"]["data"][index][0].toFixed(2)
                        return `(${x} - ` 
                      },
                  },
                  formatter: function (val) {
                      return val.toFixed(2) + ")";
                    },
                },
            }
        },
    }

    generateGraphData = () => {
        let report = this.props.report
        let ys = report["regression_performance"]["data"]["metrics"]["reference"]["error_normality"]["order_statistic_medians_y"]
        let xs = report["regression_performance"]["data"]["metrics"]["reference"]["error_normality"]["order_statistic_medians_x"]
        let slope = report["regression_performance"]["data"]["metrics"]["reference"]["error_normality"]["slope"]

        let firstY = ys[0]
        let firstX = xs[0]
        let lastX = xs[xs.length-1]

        let distanceX = Math.abs(lastX-firstX)
        let distanceY = distanceX * slope

        let lastY = 0

        if(firstY>=0)
            lastY = distanceY - firstY
        else if(firstY<0)
            lastY = distanceY + firstY

        console.log("xs",firstX,lastX)
        console.log("ys",firstY,lastY)
        
        let series = []
        for(let i=0;i<ys.length;i++){
            //console.log([feedback[i], predictions[i]])
            series.push([xs[i], ys[i]])
        }
        this.setState({series: [{
            color: "#DC4E58",
            name: "Dataset Quantiles",
            type: 'scatter',
            data: series
        }, {
            color: "#00A3FF",
            name: 'Theoretical Quantiles',
            type: 'line',
            data: [[firstX, firstY], [lastX, lastY]]
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
                <ReactApexChart options={this.state.options} series={this.state.series} type="line" height={350} style={{color: "black"}} />
            </div>
        )
    }
}

export default ErrorNormalityGraph

