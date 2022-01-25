import React, { PureComponent } from 'react';
import Chart from "react-apexcharts";

type Props = {
    type: string
    data: object[]
    currentState: number
    cats: any[]
}

type State = {
    options: object
}

class StepLineGraph extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        //console.log("step line", props, )
        this.state = {
            options: {
                chart: {
                    //type: 'line',
                    type: 'area',
                    height: 350,
                    foreColor: "#999dab"
                },
                grid: {
                    show: true,
                    strokeDashArray: 0,
                    position: 'back',
                    xaxis: {
                        lines: {
                            show: true
                        }
                    },
                    borderColor: '#999dab',
                },
                stroke: {
                    curve: 'stepline',
                },
                colors: ['#22ADF6'],
                dataLabels: {
                    enabled: false
                },
                title: {
                    text: 'Probability Chart',
                    align: 'left'
                },
                markers: {
                    hover: {
                        sizeOffset: 4
                    }
                },
                yaxis: {
                    min: 0,
                    max: 1.001,
                    tickAmount: 10,
                    title: {
                        text: 'Probability'
                    },
                    labels: {
                        /**
                        * Allows users to apply a custom formatter function to yaxis labels.
                        *
                        * @param { String } value - The generated value of the y-axis tick
                        * @param { index } index of the tick / currently executing iteration in yaxis labels array
                        */
                        formatter: function (val, index) {
                            return val.toFixed(2);
                        }
                    }
                },
                xaxis: {
                    title: {
                        text: 'Days'
                    },
                    type: "numeric",
                    //categories: props.cats,
                    labels: {
                        /**
                        * Allows users to apply a custom formatter function to yaxis labels.
                        *
                        * @param { String } value - The generated value of the y-axis tick
                        * @param { index } index of the tick / currently executing iteration in yaxis labels array
                        */
                        formatter: function (val, index) {
                            return val.toFixed(0);
                        }
                    }
                },
                fill: {
                    colors: [function ({ value, seriesIndex, w }) {
                        return "#22ADF6"
                    }],
                    opacity: 0.5,
                    type: 'solid',
                },
                noData: {
                    text: "No data is available",
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
                annotations: {
                    xaxis: [{
                        x: props.currentState,
                        strokeDashArray: 2,
                        borderWidth: 5,
                        borderColor: '#67D74E',
                        label: {
                            borderColor: '#67D74E',
                            style: {
                                color: '#fff',
                                background: '#67D74E',
                            },
                            text: 'Current ' + props.type + ' is here: ' + props.currentState + ' days',
                        }
                    },]
                },
                tooltip: {
                    enabled: true,
                    shared: false,
                    followCursor: true,
                    theme: "dark",
                    onDatasetHover: {
                        highlightDataSeries: true,
                    },
                    custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                        return series[seriesIndex][dataPointIndex].toFixed(2) * 100 + "% of the " + props.type + "s failed at this point"
                    },
                },
            },


        };
        //console.log("- ", this.state)
    }

    render() {
        return (
            <div id="chart" style={{ background: '#292933', fontSize: '15px' }}>
                <Chart options={this.state.options} series={this.props.data} type="area" height={350} />
            </div>
        );
    }
}

export default StepLineGraph