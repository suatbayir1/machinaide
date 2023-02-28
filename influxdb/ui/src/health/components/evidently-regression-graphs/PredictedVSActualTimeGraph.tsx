import React, {PureComponent} from 'react'
import Chart from 'react-apexcharts'

interface Props {
    report: object
}

class PredictedVSActualTimeGraph extends PureComponent<Props>{
    state = {
        series: [],
        options: {
            
            chart: {
            height: 350,
            type: 'line',
            foreColor: "white"
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth'
          },
          xaxis: {
            type: 'datetime',
            title: {
                text: "Time",
            }
            //categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
          },
          yaxis: {
            title: {
                text: "Value"
            }
          },
          tooltip: {
            /* x: {
              format: 'dd/MM/yy HH:mm'
            }, */
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
          },
          }
        
        
    };

    generateGraphData = () => {
        let report = this.props.report
        console.log("report", report)
        let predictions = JSON.parse(report["prediction"])
        let feedback = JSON.parse(report["feedback"])
        let series = [{name: "Predicted", data: predictions, color: "#DC4E58"},{name: "Actual", data: feedback, color: "#00A3FF"}]
        let cats = []
        let now = new Date()
        for(let i=0;i<predictions.length;i++){
            let date = new Date(now.getTime() + (i+1)*30*60000).toISOString()
            //console.log(date)
            cats.push(date)
            //series.push([feedback[i], predictions[i]])
        }
        console.log("series ", series)
        this.setState({series: series, options: {...this.state.options, xaxis: {
            type: 'datetime',
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
                <Chart options={this.state.options} series={this.state.series} type="line" height={350} style={{color: "black"}} />
            </div>
        )
    }
}

export default PredictedVSActualTimeGraph

