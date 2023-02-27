// Libraries
import React, { PureComponent } from "react";

// Components
import GaugeChart from "src/shared/components/GaugeChart";
import {
    Grid, Columns, SpinnerContainer,
    ComponentSize, FlexBox, TechnoSpinner, WaitingText,
    Icon, IconFont, RemoteDataState, InfluxColors
} from "@influxdata/clockface"
import React, {PureComponent} from 'react'
import Chart from 'react-apexcharts'

// Types
import { GaugeViewProperties } from 'src/types/dashboards'

// Helpers
import { defaultViewQuery } from 'src/views/helpers'

// Utils
import { Color } from 'src/types'

// Services
import FactoryService from 'src/shared/services/FactoryService';

// Constants
import {
    THRESHOLD_COLORS,
    COLOR_TYPE_MIN,
    COLOR_TYPE_MAX,
    COLOR_TYPE_THRESHOLD,
} from 'src/shared/constants/thresholds'
import "src/side_nav/components/constants/factoryDashboard.css";
import SummaryService from "src/shared/services/SummaryService";

interface Props {
    orgID: string
    productionLine: object
    selectedMachine: string
}
interface State {
    properties: GaugeViewProperties
    uptimeAndDowntimeData: object
    isemriCount: object
    isemriDistribution: object
    loading: boolean
    pageState: RemoteDataState
    machines: string[]
    kalinlikSeries: object[]
    kaliteSeries: object[]
    kalinlikOptions: object
    kaliteOptions: object
}

class ProductionLineSummaryDashboard extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            properties: {
                queries: [defaultViewQuery()],
                colors: [
                    {
                        type: COLOR_TYPE_MIN,
                        hex: THRESHOLD_COLORS[6].hex,
                        id: '0',
                        name: THRESHOLD_COLORS[6].name,
                        value: 0,
                    },
                    {
                        type: COLOR_TYPE_THRESHOLD,
                        hex: THRESHOLD_COLORS[1].hex,
                        id: '4',
                        name: THRESHOLD_COLORS[1].name,
                        value: 50,
                    },
                    {
                        type: COLOR_TYPE_MAX,
                        hex: THRESHOLD_COLORS[1].hex,
                        id: '5',
                        name: THRESHOLD_COLORS[1].name,
                        value: 100,
                    },
                ] as Color[],
                prefix: '%',
                tickPrefix: '',
                suffix: '',
                tickSuffix: '',
                note: '',
                showNoteWhenEmpty: false,
                decimalPlaces: {
                    isEnforced: false,
                    digits: 2,
                },
                type: 'gauge',
                shape: 'chronograf-v2',
                legend: {}
            } as GaugeViewProperties,
            uptimeAndDowntimeData: {},
            isemriCount: {},
            isemriDistribution: {},
            loading: true,
            pageState: RemoteDataState.Loading,
            machines: [],
            kalinlikSeries: [],
            kaliteSeries: [],
            kaliteOptions: {            
                chart: {
                    id: "kaliteChart",
                    height: 300,
                    type: 'bar',
                    foreColor: "white",
                },
                dataLabels: {
                    enabled: false
                },
                xaxis: {
                    title: {
                        text: "Kalite",
                        //offsetY: 50
                    },
                    //categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
                },
                yaxis: {
                    title: {
                        text: "Count"
                    },
                    /* labels: {
                        formatter: (value) => {return value.toFixed(0)}
                    }, */
                },
                tooltip: {
                    /* x: {
                    format: 'dd/MM/yy HH:mm'
                    }, */
                    y: {
                        title: {
                            formatter: (seriesName, config) => { 
                                let index = config["dataPointIndex"]
                                let x = config["w"]["config"]["series"]["0"]["data"][index]["x"]
                                return `Kalite: ${x} -` 
                            },
                        },
                        formatter: function (val) {
                            return `Count: ${val}`;
                        },
                    },
                }
            },
            kalinlikOptions: {            
                chart: {
                    id: "kalinlikChart",
                    height: 300,
                    type: 'bar',
                    foreColor: "white",
                },
                dataLabels: {
                    enabled: false
                },
                stroke: {
                    curve: 'smooth'
                },
                xaxis: {
                    title: {
                        text: "Kalınlık",
                        //offsetY: 50
                    },
                    //categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
                },
                yaxis: {
                    title: {
                        text: "Count"
                    },
                    /* labels: {
                        formatter: (value) => {return value.toFixed(0)}
                    }, */
                },
                tooltip: {
                    /* x: {
                    format: 'dd/MM/yy HH:mm'
                    }, */
                    y: {
                        title: {
                            formatter: (seriesName, config) => { 
                                let index = config["dataPointIndex"]
                                let x = config["w"]["config"]["series"]["0"]["data"][index]["x"]
                                return `Kalınlık: ${x} -` 
                            },
                        },
                        formatter: function (val) {
                            return `Count: ${val}`;
                        },
                    },
                }
            }
        };
    }

    generateGraphData = () => {
        const {isemriDistribution} = this.state
        let kalinlikData = []
        let kaliteData = []
        if("kalinlik" in isemriDistribution){
            delete isemriDistribution["kalinlik"]["none"]
            for(let key of Object.keys(isemriDistribution["kalinlik"])){
                kalinlikData.push({x: key, y: isemriDistribution["kalinlik"][key]})
            }
        }
        if("kalite" in isemriDistribution){
            delete isemriDistribution["kalite"]["none"]
            for(let key of Object.keys(isemriDistribution["kalite"])){
                kaliteData.push({x: key, y: isemriDistribution["kalite"][key]})
            }
        }
        this.setState({kalinlikSeries: kalinlikData, kaliteSeries: kaliteData, pageState: RemoteDataState.Done}, ()=>console.log("-->", this.state))
    }

    getAllSummaryData = async () => {
        let uptimeAndDowntimeData = await SummaryService.getUptimeAndDowntime()
        let isemriCount = await SummaryService.getIsemriCount()
        let isemriDistribution = await SummaryService.getIsemriDistribution()
        this.setState({uptimeAndDowntimeData, isemriCount, isemriDistribution, 
            loading: false, machines: Object.keys(uptimeAndDowntimeData)}, ()=>{this.generateGraphData(); console.log(this.state)})
    }

    private intervalID: number
    async componentDidMount() {
        this.getAllSummaryData() 
        this.intervalID = window.setInterval(() => {
            this.getAllSummaryData() 
        }, 300000) 
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any): void {
        if(prevProps.selectedMachine !== this.props.selectedMachine){
            console.log(prevProps.selectedMachine, this.props.selectedMachine)
            this.setState({pageState: RemoteDataState.Loading}, ()=>this.generateGraphData())
        }
    }

    returnSpinner = () => {
        return(
            <div>
                <TechnoSpinner style={{textAlign: "-webkit-center"}}/>
                <WaitingText text="Loading the summary report data" />
            </div>
        )
    }

    convertMinsToHrsMins = (mins) => {
        console.log(mins)
        let d = Math.floor(mins/(60*24))
        let h = Math.floor(mins%(60*24)/60);
        let m = mins % 60.0;
        h = h < 10 ? '0' + h : h; // (or alternatively) h = String(h).padStart(2, '0')
        m = m < 10 ? '0' + m : m; // (or alternatively) m = String(m).padStart(2, '0')
        return `${d>0 ? `${d}d ` : ''}${h}h ${m}m`;
    }

    render(): React.ReactNode {
        let selectedMachine = this.props.selectedMachine
        let lastFailureRecord = "-"
        let lastDayFailures = "-"
        let lastWeekFailures = "-"
        let lastMonthFailures = "-"
        let lastDayMaintenance = "-"
        let lastWeekMaintenance  = "-"
        let lastMonthMaintenance = "-"
        /* let totalFailureCount = 0
        let totalMaintenanceCount = 0
        let totalFailureDurationTime = "00:00"
        let totalMaintenanceDurationTime = "00:00"
        let totalFailureDowntime = "00:00"
        let totalMaintenanceDowntime = "00:00" */
        let lastMonthFailureCount = 0
        let lastMonthMaintenanceCount = 0
        let lastMonthFailureDurationTime = "00d 00h 00m"
        let lastMonthMaintenanceDurationTime = "00d 00h 00m"
        let lastMonthFailureDowntime = "00:00"
        let lastMonthMaintenanceDowntime = "00:00" 
        let last7daysJobs = 0
        let next7daysJobs = 0
        if(this.state.pageState === RemoteDataState.Done){
            lastFailureRecord = new Date(this.state.uptimeAndDowntimeData[selectedMachine]["last_record_of_failure"])
            lastDayFailures = this.state.uptimeAndDowntimeData[selectedMachine]["last_day_failure_result"]
            lastWeekFailures = this.state.uptimeAndDowntimeData[selectedMachine]["last_week_failure_result"]
            lastMonthFailures = this.state.uptimeAndDowntimeData[selectedMachine]["last_month_failure_result"]
            lastDayMaintenance = this.state.uptimeAndDowntimeData[selectedMachine]["last_day_maintenance_records"]
            lastWeekMaintenance  = this.state.uptimeAndDowntimeData[selectedMachine]["last_week_maintenance_records"]
            lastMonthMaintenance = this.state.uptimeAndDowntimeData[selectedMachine]["last_month_maintenance_records"]
            // totalFailureCount = this.state.uptimeAndDowntimeData[selectedMachine]["all_failure_result"]["count"]
            // totalMaintenanceCount = this.state.uptimeAndDowntimeData[selectedMachine]["all_maintenance_result"]["count"]
            // totalFailureDurationTime = this.convertMinsToHrsMins(this.state.uptimeAndDowntimeData[selectedMachine]["all_failure_result"]["durationTime"])
            // totalMaintenanceDurationTime = this.convertMinsToHrsMins(this.state.uptimeAndDowntimeData[selectedMachine]["all_maintenance_result"]["durationTime"])
            // totalFailureDowntime = this.convertMinsToHrsMins(this.state.uptimeAndDowntimeData[selectedMachine]["all_failure_result"]["recordedDowntimeMinutes"])
            // totalMaintenanceDowntime = this.convertMinsToHrsMins(this.state.uptimeAndDowntimeData[selectedMachine]["all_maintenance_result"]["recordedDowntimeMinutes"])
            lastMonthFailureCount = this.state.uptimeAndDowntimeData[selectedMachine]["last_month_failure_result"]["count"]
            lastMonthMaintenanceCount = this.state.uptimeAndDowntimeData[selectedMachine]["last_month_maintenance_records"]["count"]
            lastMonthFailureDurationTime = this.convertMinsToHrsMins(this.state.uptimeAndDowntimeData[selectedMachine]["last_month_failure_result"]["durationTime"])
            lastMonthMaintenanceDurationTime = this.convertMinsToHrsMins(this.state.uptimeAndDowntimeData[selectedMachine]["last_month_maintenance_records"]["durationTime"])
            lastMonthFailureDowntime = this.convertMinsToHrsMins(this.state.uptimeAndDowntimeData[selectedMachine]["last_month_failure_result"]["recordedDowntimeMinutes"])
            lastMonthMaintenanceDowntime = this.convertMinsToHrsMins(this.state.uptimeAndDowntimeData[selectedMachine]["last_month_maintenance_records"]["recordedDowntimeMinutes"])
            last7daysJobs = this.state.isemriCount["last7"]
            next7daysJobs = this.state.isemriCount["next7"]
        }
        return(
            <SpinnerContainer
                loading={this.state.pageState}
                spinnerComponent={this.returnSpinner()}
            >
                <Grid>
                    <Grid.Column
                        widthXS={Columns.Twelve}
                        widthSM={Columns.Six}
                        widthMD={Columns.Three}
                        widthLG={Columns.Three}
                        id="summary-column"
                    >   
                        <div
                            style={{ marginBottom: '50px', textAlign: 'center' }}
                        >
                            <h2 style={{ marginTop: '0px' }}>{selectedMachine} Summary</h2>
                            <h3 style={{ margin: '0px' }}>{(lastFailureRecord instanceof Date && !isNaN(lastFailureRecord.valueOf())) ? lastFailureRecord.toLocaleString() : "-"}</h3>
                            <h5 style={{ margin: '0px' }}>Last Failure Date</h5>
                        </div>
                        <div
                            style={{textAlign: 'center' }}
                        >
                            <h2 style={{ marginBottom: '20px' }}>Last 24 Hour Total</h2>                                        
                            <div>
                                <FlexBox margin={ComponentSize.Large} style={{ marginBottom: '30px' }}>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>{lastDayFailures["count"]}</h2>
                                        <h6 style={{ margin: '0px' }}>Failure</h6>
                                    </div>
                                    <div>
                                        <h2 style={{ margin: '0px' }}>{lastDayMaintenance["count"]}</h2>
                                        <h6 style={{ margin: '0px' }}>Maintenance</h6>
                                    </div>
                                    <div style={{ marginRight: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>-</h2>
                                        <h6 style={{ margin: '0px' }}>Alert</h6>
                                    </div>
                                </FlexBox>
                            </div>
                        </div>
                        <div
                            style={{textAlign: 'center' }}
                        >
                            <h2 style={{ marginBottom: '20px' }}>Last Week Total</h2>                                        
                            <div>
                                <FlexBox margin={ComponentSize.Large} style={{ marginBottom: '30px' }}>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>{lastWeekFailures["count"]}</h2>
                                        <h6 style={{ margin: '0px' }}>Failure</h6>
                                    </div>
                                    <div>
                                        <h2 style={{ margin: '0px' }}>{lastWeekMaintenance["count"]}</h2>
                                        <h6 style={{ margin: '0px' }}>Maintenance</h6>
                                    </div>
                                    <div style={{ marginRight: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>-</h2>
                                        <h6 style={{ margin: '0px' }}>Alert</h6>
                                    </div>
                                </FlexBox>
                            </div>
                        </div>
                        <div
                            style={{textAlign: 'center' }}
                        >
                            <h2 style={{ marginBottom: '20px' }}>Last Month Total</h2>                                        
                            <div>
                                <FlexBox margin={ComponentSize.Large} style={{ marginBottom: '30px' }}>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>{lastMonthFailures["count"]}</h2>
                                        <h6 style={{ margin: '0px' }}>Failure</h6>
                                    </div>
                                    <div>
                                        <h2 style={{ margin: '0px' }}>{lastMonthMaintenance["count"]}</h2>
                                        <h6 style={{ margin: '0px' }}>Maintenance</h6>
                                    </div>
                                    <div style={{ marginRight: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>-</h2>
                                        <h6 style={{ margin: '0px' }}>Alert</h6>
                                    </div>
                                </FlexBox>
                            </div>
                        </div>
                        <div
                            style={{textAlign: 'center' }}
                        >                                      
                            <div>
                                <FlexBox margin={ComponentSize.Large} style={{ marginBottom: '30px' }}>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <h2 style={{ margin: '0px', color: InfluxColors.Rainforest}}>{last7daysJobs}</h2>
                                        <h6 style={{ margin: '0px' }}>Last 7 Day Job Count</h6>
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 'auto', color: InfluxColors.Pineapple}}>{next7daysJobs}</h2>
                                        <h6 style={{ margin: '0px' }}>Next 7 Day Job Count</h6>
                                    </div>
                                </FlexBox>
                            </div>
                        </div>
                    </Grid.Column>
                    <Grid.Column
                        widthXS={Columns.Twelve}
                        widthSM={Columns.Six}
                        widthMD={Columns.Three}
                        widthLG={Columns.Three}
                        id="total-column"
                    >
                        <h2 style={{ textAlign: 'center', margin: '0px' }}>Total (Last Month)</h2>
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <div className="production-line-total-font-size" style={{ color: InfluxColors.Amethyst }}>
                                <h5 style={{ margin: '0px' }}>{lastMonthFailureCount}</h5>
                            </div>
                            <h4 style={{ margin: '0px' }}>Total Failure Count</h4>
                        </div>
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <div className="production-line-total-font-size" style={{ color: InfluxColors.Pineapple }}>
                                <h5 style={{ margin: '0px' }}>{lastMonthFailureDurationTime}</h5>
                            </div>
                            <h4 style={{ margin: '0px' }}>Total Failure Duration Time</h4>
                        </div>
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <div className="production-line-total-font-size" style={{ color: InfluxColors.Fire }}>
                                <h5 style={{ margin: '0px' }}>{lastMonthFailureDowntime}</h5>
                            </div>
                            <h4 style={{ margin: '0px' }}>Total Failure Downtime</h4>
                        </div>
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <div className="production-line-total-font-size" style={{ color: InfluxColors.Amethyst }}>
                                <h5 style={{ margin: '0px' }}>{lastMonthMaintenanceCount}</h5>
                            </div>
                            <h4 style={{ margin: '0px' }}>Total Maintenance Count</h4>
                        </div>
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <div className="production-line-total-font-size" style={{ color: InfluxColors.Pineapple }}>
                                <h5 style={{ margin: '0px' }}>{lastMonthMaintenanceDurationTime}</h5>
                            </div>
                            <h4 style={{ margin: '0px' }}>Total Maintenance Duration Time</h4>
                        </div>
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <div className="production-line-total-font-size" style={{ color: InfluxColors.Fire }}>
                                <h5 style={{ margin: '0px' }}>{lastMonthMaintenanceDowntime}</h5>
                            </div>
                            <h4 style={{ margin: '0px' }}>Total Maintenance Downtime</h4>
                        </div>
                    </Grid.Column>
                    <Grid.Column
                        widthXS={Columns.Twelve}
                        widthSM={Columns.Six}
                        widthMD={Columns.Six}
                        widthLG={Columns.Six}
                        id="distribution-column"
                    >
                        <div id="kalinlikChart" style={{ background: '#292933', fontSize: '15px', borderBottom: '1px solid'}}>
                            <Chart options={this.state.kalinlikOptions} series={[{data: this.state.kalinlikSeries}]} type="bar" height={300} style={{color: "black"}} />
                        </div>
                        <div id="kaliteChart" style={{ background: '#292933', fontSize: '15px' }}>
                            <Chart options={this.state.kaliteOptions} series={[{data: this.state.kaliteSeries, color: InfluxColors.Amethyst}]} type="bar" height={300} style={{color: "black"}} />
                        </div>
                    </Grid.Column>
                </Grid>
            </SpinnerContainer>
        )
    }
}

export default ProductionLineSummaryDashboard