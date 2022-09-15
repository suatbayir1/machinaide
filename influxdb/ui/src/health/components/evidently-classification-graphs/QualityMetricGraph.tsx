import React, {PureComponent} from 'react'
import Chart from 'react-apexcharts'
import { InfluxColors} from '@influxdata/clockface';


interface Props {
    report: object
}

class QualityMetricGraph extends PureComponent<Props>{
    state = {
        options: options,
        series: [],
    }

    componentDidMount(){
        let report = this.props.report
        let classValues = report["classification_performance"]["data"]["metrics"]["reference"]["metrics_matrix"]
        
        let precision0 = 0
        let precision1 = 0
        let recall0 = 0
        let recall1 = 0
        let f1Score0 = 0
        let f1Score1 = 0

        if("0" in classValues){
            precision0 = classValues["0"]["precision"]
            recall0 = classValues["0"]["recall"]
            f1Score0 = classValues["0"]["f1-score"]
        }
        else if("0.0" in classValues){
            precision0 = classValues["0.0"]["precision"]
            recall0 = classValues["0.0"]["recall"]
            f1Score0 = classValues["0.0"]["f1-score"]
        }
        if("1" in classValues){
            precision1 = classValues["1"]["precision"]
            recall1 = classValues["1"]["recall"]
            f1Score1 = classValues["1"]["f1-score"]
        }
        else if("1.0" in classValues){
            precision1 = classValues["1.0"]["precision"]
            recall1 = classValues["1.0"]["recall"]
            f1Score1 = classValues["1.0"]["f1-score"]
        }

        let series = []
        series.push({
            name: 'precison',
            data: [{x: "0", y: precision0.toFixed(3)}, {x: "1", y: precision1.toFixed(3)}]
        })
        series.push({
            name: 'recall',
            data: [{x: "0", y: recall0.toFixed(3)}, {x: "1", y: recall1.toFixed(3)}]
        })
        series.push({
            name: 'f1Score',
            data: [{x: "0", y: f1Score0.toFixed(3)}, {x: "1", y: f1Score1.toFixed(3)}]
        })

        let numbers = [precision0, precision1, recall0, recall1, f1Score0, f1Score1].sort((a,b)=>a-b)
        let colors = [InfluxColors.Pool, InfluxColors.Magenta, InfluxColors.Amethyst, InfluxColors.Rainforest, InfluxColors.Pineapple, InfluxColors.Fire ]
        let ranges = []
        for(let i=0; i<numbers.length; i++){
            if(i===0)
                ranges.push({from:0, to:numbers[i]+ 0.001, name: i + "", color: colors[i]})
            else
                ranges.push({from:numbers[i-1]+ 0.002, to:numbers[i]+ 0.001, name: i + "", color: colors[i]})
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

export default QualityMetricGraph


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
                    return `${seriesName} - class: ${config["dataPointIndex"]}` 
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
                return value
            }
        },
        title: {
            text: "Metric",
            offsetX: 10,
        }
    },
    xaxis: {
        title: {
            text: "Class"
        }  
    }
};