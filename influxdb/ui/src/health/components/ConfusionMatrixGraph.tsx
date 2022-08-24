import React, {PureComponent} from 'react'
import Chart from 'react-apexcharts'

interface Props {
    report: object
}

class ConfusionMatrixGraph extends PureComponent<Props>{
    state = {
        options: options,
        series: [],
    }

    componentDidMount(){
        let report = this.props.report
        let confusionMatrix = report["classification_performance"]["data"]["metrics"]["reference"]["confusion_matrix"]["values"]

        let tn = confusionMatrix[0][0]
        let fp = confusionMatrix[0][1]
        let fn = confusionMatrix[1][0]
        let tp = confusionMatrix[1][1]

        let series = []
        series.push({
            name: '00-10',
            data: [{x: "0", y: tn}, {x: "1", y: fp}]
        })
        series.push({
            name: '01-11',
            data: [{x: "0", y: fn}, {x: "1", y: tp}]
        })

        let numbers = [tn, fp, fn, tp].sort((a,b)=>a-b)
        let colors = ["#0000ff", "#4600b9", "#a2005d", "#ff0000"]
        let ranges = []
        for(let i=0; i<numbers.length; i++){
            if(i===0)
                ranges.push({from:0, to:numbers[i]+1, name: i + "", color: colors[i]})
            else
                ranges.push({from:numbers[i-1]+2, to:numbers[i]+1, name: i + "", color: colors[i]})
        }
        console.log("ranges: ", ranges)
        this.setState({series: series, options: {...this.state.options, plotOptions: {...this.state.options.plotOptions, heatmap: {...this.state.options.plotOptions.heatmap, colorScale: {ranges: ranges}}}}}, ()=> console.log("new options: ",this.state))

    }

    render(){
        return(
            <div id="chart" style={{ background: '#292933', fontSize: '15px' }}>
                <Chart options={this.state.options} series={this.state.series} type="heatmap" height={350}  style={{color: "black"}}/>
            </div>
        )
    }
}

export default ConfusionMatrixGraph


var options = {
    chart: {
        height: 350,
        type: 'heatmap',
        foreColor: "white"
    },
    plotOptions: {
        heatmap: {
            shadeIntensity: 0.5,
            radius: 2,
            useFillColorAsStroke: false,       
        }
    },
    dataLabels: {
        enabled: true
    },
    stroke: {
        width: 1
    },
    title: {
        text: ''
    },
    tooltip: {
        theme: "dark",
        y: {
            title: {
                formatter: (seriesName, config) => {                    
                    if(config["seriesIndex"] === 0 && config["dataPointIndex"] === 0)
                        return "TN:"
                    else if(config["seriesIndex"] === 0 && config["dataPointIndex"] === 1)
                        return "FP:"
                    else if(config["seriesIndex"] === 1 && config["dataPointIndex"] === 0)
                        return "FN:"
                    else if(config["seriesIndex"] === 1 && config["dataPointIndex"] === 1)
                        return "TP:"
                },
            },
            formatter: function (val) {
                return val;
              },
        },
    },
    legend: {
        show: false
    },
    yaxis: {
        labels: {
            formatter: (value) => { 
                if(value === "01-11")
                    return "1"
                else if(value === "00-10")
                    return "0"
            }
        },
        title: {
            text: "Actual Value",
            offsetX: 20,
        }
    },
    xaxis: {
        title: {
            text: "Predicted Value"
        }  
    }
};