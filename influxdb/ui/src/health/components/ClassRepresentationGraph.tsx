import React, {PureComponent} from 'react'
import Chart from 'react-apexcharts'

interface Props {
    report: object
}

interface State {
    series: object[]
    options: object
}

class ClassRepresentationGraph extends PureComponent<Props, State>{
    state = {
        series: [],
        options: {
          chart: {
            height: 350,
            type: 'bar',
            foreColor: "white"
          },
          plotOptions: {
            bar: {
              borderRadius: 10,
              dataLabels: {
                position: 'top', // top, center, bottom
              },
              colors:{
                  backgroundOpacity:1
              }
            }
          },
          dataLabels: {
            /* enabled: true,
            formatter: function (val) {
              return val + "%";
            },
            offsetY: -20,
            style: {
              fontSize: '12px',
              colors: ["#304758"]
            } */
          },
          
          xaxis: {
            axisBorder: {
              show: false
            },
            axisTicks: {
              show: false
            },
            crosshairs: {
              fill: {
                type: 'gradient',
                gradient: {
                  colorFrom: '#D8E3F0',
                  colorTo: '#BED1E6',
                  stops: [0, 100],
                  opacityFrom: 0.4,
                  opacityTo: 0.5,
                }
              }
            },
            tooltip: {
              enabled: true,
            },
            title:{
              text: "Class",
              align: 'center',
              style: {
                  color: 'white'
              }
            }
          },
          yaxis: {
            axisBorder: {
              show: false
            },
            axisTicks: {
              show: false,
            },
            labels: {
              show: false,
              formatter: function (val) {
                return val;
              }
            },
            title:{
              text: "Number of Objects",
              floating: true,
              offsetX: 10,
              align: 'center',
              style: {
                  color: 'white'
              }
            }
          
          },
          tooltip: {
              theme: "dark",
              y: {
                title: {
                    formatter: (seriesName, config) => { 
                        return `class ${seriesName}:` 
                    },
                },
                formatter: function (val) {
                    return val;
                  },
            },
          }
        },
          
            
    }

    componentDidMount(): void {
      if(this.props.report){
        let report = this.props.report 
        let confusionMatrix = report["classification_performance"]["data"]["metrics"]["reference"]["confusion_matrix"]["values"]

        let class0 = confusionMatrix[0][0] + confusionMatrix[0][1]
        let class1 = confusionMatrix[1][0] + confusionMatrix[1][1]

        let data = [{x: "0", y: class0},{x: "1", y: class1}]
        this.setState({series: [{data: data}]})
      }
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
      if(prevProps.report === null && this.props.report !== null ){
        let report = this.props.report 
        let confusionMatrix = report["classification_performance"]["data"]["metrics"]["reference"]["confusion_matrix"]["values"]

        let class0 = confusionMatrix[0][0] + confusionMatrix[0][1]
        let class1 = confusionMatrix[1][0] + confusionMatrix[1][1]

        let data = [{x: "0", y: class0},{x: "1", y: class1}]
        this.setState({series: [{data: data}]})
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

export default ClassRepresentationGraph

