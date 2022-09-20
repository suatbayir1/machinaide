import React, { PureComponent } from 'react';
import Chart from "react-apexcharts";

type Props = {
    type: string
    data: object[]
    colors: string[]
    maxLifetime: number
}

type State = {
    options: object
}

class AllPartsTimelineGraph extends PureComponent<Props, State> {
    state = {
        options: {}
    }

    componentDidMount() {
        this.setState({
            options: {
                chart: {
                    height: 450,
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
                colors: this.props.colors,
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
                    max: undefined,
                    title: {
                        text: 'Days'
                    }
                },
                yaxis: {
                    title: {
                        text: this.props.type + "s"
                    }
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
                    custom: function (opts) {
                        const fromYear = new Date(opts.y1).getFullYear()
                        const toYear = new Date(opts.y2).getFullYear()
                        const values = opts.ctx.rangeBar.getTooltipValues(opts)

                        return (
                            "Day count: " + opts.y2
                        )
                    }
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


        })
    }

    render() {
        return (
            <div id="chart" style={{ background: '#292933', fontSize: '15px' }}>
                <Chart options={this.state.options} series={this.props.data} type="rangeBar" height={450} />
            </div>
        )
    }
}

export default AllPartsTimelineGraph;