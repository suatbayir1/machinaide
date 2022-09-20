import React, { PureComponent } from 'react';
import Chart from "react-apexcharts";

type Props = {
    type: string
    data: object[]
    colors: string[]
}

type State = {
    options: object
}

class TimelineGraph extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            options: {
                chart: {
                    height: 350,
                    type: 'rangeBar',
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
                plotOptions: {
                    bar: {
                        horizontal: true,
                        barHeight: '50%',
                        rangeBarGroupRows: true
                    }
                },
                colors: props.colors,
                fill: {
                    type: 'solid',
                    opacity: 1,
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
                xaxis: {
                    type: 'datetime',
                    title: {
                        text: 'Date'
                    }
                },
                yaxis: {
                },
                legend: {
                    position: 'right'
                },
                tooltip: {
                    enabled: true,
                    shared: false,
                    followCursor: true,
                    theme: "dark",
                    onDatasetHover: {
                        highlightDataSeries: true,
                    },
                    /* custom: function(opts) {
                      const fromYear = new Date(opts.y1).getFullYear()
                      const toYear = new Date(opts.y2).getFullYear()
                      const values = opts.ctx.rangeBar.getTooltipValues(opts)
                  
                      return (
                        new Date(opts.y2).toISOString() + "--", new Date(opts.y1).toISOString()
                      )
                    } */
                },
                stroke: {
                    show: true,
                    curve: 'smooth',
                    lineCap: 'butt',
                    colors: undefined,
                    width: 2,
                    dashArray: 0,
                },
            },


        };
    }



    render() {
        return (

            <div id="chart" style={{ background: '#292933', fontSize: '15px' }}>
                <Chart options={this.state.options} series={this.props.data} type="rangeBar" height={350} />
            </div>
        )
    }
}

export default TimelineGraph