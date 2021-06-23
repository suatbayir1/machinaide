// Libraries
import React, { PureComponent } from "react";

// Components
import GaugeChart from 'src/shared/components/GaugeChart';
import {
    Grid, Columns,
    ComponentSize,
    FlexBox,
    Icon, IconFont,
} from '@influxdata/clockface'

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

interface Props {
    orgID: string
    productionLine: object
}
interface State {
    properties: GaugeViewProperties
    machines: object[]
}

class FactoryDashboardPanel extends PureComponent<Props, State> {
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
            machines: [],
        };
    }

    async componentDidMount() {
        await this.getAllFactories();
    }

    getAllFactories = async () => {
        const factories = await FactoryService.getFactories();
        const machines = [];

        factories?.[0]?.productionLines.map(pl => {
            if (pl["@id"] === this.props.productionLine["id"]) {
                pl?.machines.map(machine => {
                    machines.push({
                        "id": machine["@id"],
                        "displayName": machine["displayName"],
                        "uptime": "1d-2h-45m"
                    })
                })
            }
        })

        this.setState({
            machines
        })
    }

    render() {
        const { machines } = this.state;

        return (
            <>
                <Grid.Column widthXS={Columns.Three} style={{ borderRight: '1px solid white' }}>
                    <div
                        className="cell--view"
                        style={{ marginBottom: '10px' }}
                    >
                        <h2 style={{ textAlign: 'center', padding: '0px', margin: '0px' }}>Productivity</h2>
                        <div style={{ width: 'auto', height: '200px' }}>
                            <GaugeChart
                                value={70}
                                properties={this.state.properties}
                                theme={'dark'}
                            />
                        </div>
                    </div>


                    <div style={{ fontSize: '15px', marginTop: '30px' }}>
                        <h2 style={{ textAlign: 'center', margin: '0px' }}>Uptime</h2>
                        {
                            machines.map(machine =>
                                <FlexBox margin={ComponentSize.Large} key={machine["id"]}>
                                    <Icon
                                        glyph={IconFont.Checkmark}
                                        style={{ color: 'green' }}
                                    />
                                    <p>{machine["displayName"]}</p>
                                    <div className="tabbed-page--header-right">
                                        <p>{machine["uptime"]}</p>
                                    </div>
                                </FlexBox>
                            )
                        }
                    </div>
                </Grid.Column>

                <Grid.Column widthXS={Columns.Three} style={{ borderRight: '1px solid white' }}>
                    <div
                        className="cell--view"
                        style={{ marginBottom: '50px', textAlign: 'center' }}
                    >
                        <h2 style={{ marginTop: '0px' }}>Summary</h2>
                        <h3 style={{ margin: '0px' }}>42</h3>
                        <h5 style={{ margin: '0px' }}>Injury free days</h5>
                    </div>


                    {/* <table id={"summaryTable"}>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Total</th>
                                <th>SA</th>
                                <th>LH</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                [...Array(10)].map((_, i) =>
                                    <tr key={i}>
                                        <td>
                                            Logs
                                        </td>
                                        <td>5,556</td>
                                        <td>6,666</td>
                                        <td>900</td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table> */}

                    <div
                        className="cell--view"
                        style={{ marginBottom: '0px', textAlign: 'center' }}
                    >
                        <h2 style={{ marginBottom: '20px' }}>Last Week Total</h2>

                        {
                            <div>
                                <FlexBox margin={ComponentSize.Large} style={{ marginBottom: '30px' }}>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>7</h2>
                                        <h6 style={{ margin: '0px' }}>Failure</h6>
                                    </div>

                                    <div style={{ marginRight: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>6</h2>
                                        <h6 style={{ margin: '0px' }}>Maintenance</h6>
                                    </div>
                                </FlexBox>
                                <FlexBox margin={ComponentSize.Large} style={{ marginBottom: '30px' }}>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>15</h2>
                                        <h6 style={{ margin: '0px' }}>Alert</h6>
                                    </div>

                                    <div style={{ marginRight: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>14</h2>
                                        <h6 style={{ margin: '0px' }}>Completed Job</h6>
                                    </div>
                                </FlexBox>
                            </div>
                        }

                    </div>


                    <div
                        className="cell--view"
                        style={{ marginBottom: '20px', textAlign: 'center' }}
                    >
                        <h2 style={{ marginBottom: '20px' }}>Last Month Total</h2>

                        {
                            <div>
                                <FlexBox margin={ComponentSize.Large} style={{ marginBottom: '30px' }}>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>7</h2>
                                        <h6 style={{ margin: '0px' }}>Failure</h6>
                                    </div>

                                    <div style={{ marginRight: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>6</h2>
                                        <h6 style={{ margin: '0px' }}>Maintenance</h6>
                                    </div>
                                </FlexBox>
                                <FlexBox margin={ComponentSize.Large} style={{ marginBottom: '30px' }}>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>15</h2>
                                        <h6 style={{ margin: '0px' }}>Alert</h6>
                                    </div>

                                    <div style={{ marginRight: 'auto' }}>
                                        <h2 style={{ margin: '0px' }}>14</h2>
                                        <h6 style={{ margin: '0px' }}>Completed Job</h6>
                                    </div>
                                </FlexBox>
                            </div>
                        }

                    </div>
                </Grid.Column>

                <Grid.Column widthXS={Columns.Three} style={{ borderRight: '1px solid white' }}>
                    <div
                        className="cell--view"
                        style={{ marginBottom: '10px', textAlign: 'center' }}
                    >
                        <h2 style={{ marginTop: '0px' }}>Production</h2>
                    </div>

                    <FlexBox margin={ComponentSize.Large} style={{ marginBottom: '10px', textAlign: 'center' }}>
                        <div style={{ marginLeft: 'auto' }}>
                            <h2 style={{ margin: '0px' }}>412</h2>
                            <h6 style={{ margin: '0px' }}>Product 1</h6>
                        </div>

                        <div>
                            <h2 style={{ margin: '0px' }}>240</h2>
                            <h6 style={{ margin: '0px' }}>Product 2</h6>
                        </div>

                        <div style={{ marginRight: 'auto' }}>
                            <h2 style={{ margin: '0px' }}>129</h2>
                            <h6 style={{ margin: '0px' }}>Product 3</h6>
                        </div>
                    </FlexBox>

                    <table id={"summaryTable"} style={{ marginBottom: '30px', marginTop: '30px' }}>
                        <caption style={{ fontSize: '15px' }}>Distribution %</caption>
                        <thead>
                        </thead>
                        <tbody>
                            {
                                [...Array(7)].map((_, i) =>
                                    <tr key={i}>
                                        <td>
                                            8,44
                                        </td>
                                        <td>5,556</td>
                                        <td>6,666</td>
                                        <td>900</td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>

                    <table id={"summaryTable"} style={{ marginBottom: '30px' }}>
                        <caption style={{ fontSize: '15px' }}>Current Shift</caption>
                        <thead>
                            <tr>
                                <th></th>
                                <th>FBM</th>
                                <th>LRF</th>
                                <th>L Size</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                [...Array(5)].map((_, i) =>
                                    <tr key={i}>
                                        <td>
                                            8,44
                                        </td>
                                        <td>5,556</td>
                                        <td>6,666</td>
                                        <td>900</td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                </Grid.Column>

                <Grid.Column widthXS={Columns.Three} style={{ borderRight: '1px solid white' }}>
                    {/* <div
                        className="cell--view"
                        style={{ marginBottom: '10px' }}
                    >
                        <h2 style={{ textAlign: 'center', padding: '0px', margin: '0px' }}>Debarkers</h2>

                        <div style={{ width: 'auto', height: '200px' }}>
                            <GaugeChart
                                value={58}
                                properties={this.state.properties}
                                theme={'dark'}
                            />
                        </div>
                        <h2 style={{ textAlign: 'center', margin: '0px' }}>Uptime</h2>
                    </div> */}

                    {/* <div style={{ width: 'auto', height: '200px' }}>
                        <GaugeChart
                            value={5}
                            properties={this.state.properties}
                            theme={'dark'}
                        />
                    </div> */}

                    <h2 style={{ textAlign: 'center', margin: '0px' }}>Total</h2>


                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '50px', color: 'green' }}>
                            <h5 style={{ margin: '0px' }}>12,116</h5>
                        </div>
                        <h4 style={{ margin: '0px' }}>Piece products produced</h4>
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '50px', color: 'red' }}>
                            <h5 style={{ margin: '0px' }}>222,540</h5>
                        </div>
                        <h4 style={{ margin: '0px' }}>TL maintenance cost</h4>
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '50px', color: 'yellow' }}>
                            <h5 style={{ margin: '0px' }}>100</h5>
                        </div>
                        <h4 style={{ margin: '0px' }}>Hours maintenance time</h4>
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '50px', color: 'white' }}>
                            <h5 style={{ margin: '0px' }}>400</h5>
                        </div>
                        <h4 style={{ margin: '0px' }}>Hours estimated saving time</h4>
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '50px', color: 'white' }}>
                            <h5 style={{ margin: '0px' }}>140,000</h5>
                        </div>
                        <h4 style={{ margin: '0px' }}>TL estimated saving money</h4>
                    </div>
                </Grid.Column>
            </>
        )
    }
}

export default FactoryDashboardPanel;



















// // Libraries
// import React, { PureComponent } from "react";

// // Components
// import GaugeChart from 'src/shared/components/GaugeChart';
// import SingleStat from 'src/shared/components/SingleStat';
// import ViewLoadingSpinner from 'src/shared/components/ViewLoadingSpinner'
// import {
//     Grid, Columns,
// } from '@influxdata/clockface'

// // Types
// import { RemoteDataState } from 'src/types'

// // Helpers
// import { defaultViewQuery } from 'src/views/helpers'
// import { csvToJSON } from 'src/shared/helpers/FileHelper';

// // Utils
// import {
//     DEFAULT_GAUGE_COLORS,
// } from 'src/shared/constants/thresholds'
// import { Color } from 'src/types'

// // Services
// import FactoryDashboardService from 'src/side_nav/components/factoriesPanel/services/FactoryDashboardService';

// // Constants
// import {
//     THRESHOLD_COLORS,
//     COLOR_TYPE_MIN,
//     COLOR_TYPE_MAX,
//     COLOR_TYPE_THRESHOLD,
// } from 'src/shared/constants/thresholds'

// interface Props {
//     orgID: string
// }
// interface State {
//     fluxQueries: object[]
//     fluxResults: object
//     intervalId: number
// }

// class FactoryDashboardPanel extends PureComponent<Props, State> {
//     constructor(props) {
//         super(props);
//         this.state = {
//             fluxResults: {},
//             intervalId: 0,
//             fluxQueries: [
//                 {
//                     key: "mem_used_percent",
//                     display: "Memory Used Percent",
//                     type: 'gauge',
//                     loading: RemoteDataState.Loading,
//                     query: `
//                         from(bucket: "system")
//                         |> range(start: -1m,)
//                         |> filter(fn: (r) => r["_measurement"] == "mem")
//                         |> filter(fn: (r) => r["_field"] == "used_percent")
//                         |> last()
//                     `,
//                     properties: {
//                         queries: [defaultViewQuery()],
//                         colors: DEFAULT_GAUGE_COLORS as Color[],
//                         prefix: '%',
//                         tickPrefix: '',
//                         suffix: '',
//                         tickSuffix: '',
//                         note: '',
//                         showNoteWhenEmpty: false,
//                         decimalPlaces: {
//                             isEnforced: false,
//                             digits: 2,
//                         },
//                         type: 'gauge',
//                         shape: 'chronograf-v2',
//                         legend: {}
//                     }
//                 },
//                 {
//                     key: "disk_used_percent",
//                     display: "Disk Used Percent",
//                     type: 'gauge',
//                     loading: RemoteDataState.Loading,
//                     query: `
//                         from(bucket: "system")
//                         |> range(start: -1m)
//                         |> filter(fn: (r) => r["_measurement"] == "disk")
//                         |> filter(fn: (r) => r["_field"] == "used_percent")
//                         |> last()
//                     `,
//                     properties: {
//                         queries: [defaultViewQuery()],
//                         colors: [
//                             {
//                                 type: COLOR_TYPE_MIN,
//                                 hex: THRESHOLD_COLORS[6].hex,
//                                 id: '0',
//                                 name: THRESHOLD_COLORS[6].name,
//                                 value: 0,
//                             },
//                             {
//                                 type: COLOR_TYPE_THRESHOLD,
//                                 hex: THRESHOLD_COLORS[1].hex,
//                                 id: '4',
//                                 name: THRESHOLD_COLORS[1].name,
//                                 value: 50,
//                             },
//                             {
//                                 type: COLOR_TYPE_MAX,
//                                 hex: THRESHOLD_COLORS[1].hex,
//                                 id: '5',
//                                 name: THRESHOLD_COLORS[1].name,
//                                 value: 100,
//                             },
//                         ] as Color[],
//                         prefix: '%',
//                         tickPrefix: '',
//                         suffix: '',
//                         tickSuffix: '',
//                         note: '',
//                         showNoteWhenEmpty: false,
//                         decimalPlaces: {
//                             isEnforced: false,
//                             digits: 2,
//                         },
//                         type: 'gauge',
//                         shape: 'chronograf-v2',
//                         legend: {}
//                     }
//                 },
//                 {
//                     key: "system_load15",
//                     display: "System Load",
//                     type: 'single-stat',
//                     loading: RemoteDataState.Loading,
//                     query: `
//                         from(bucket: "system")
//                         |> range(start: -1h)
//                         |> filter(fn: (r) => r["_measurement"] == "system")
//                         |> filter(fn: (r) => r["_field"] == "load15")
//                         |> filter(fn: (r) => r["host"] == "vmi474601.contaboserver.net")
//                         |> last()
//                     `,
//                     properties: {
//                         type: 'single-stat',
//                         queries: [defaultViewQuery()],
//                         colors: [
//                             {
//                                 type: 'text',
//                                 hex: THRESHOLD_COLORS[6].hex,
//                                 id: '0',
//                                 name: THRESHOLD_COLORS[6].name,
//                                 value: 0,
//                             },
//                             {
//                                 type: 'background',
//                                 hex: THRESHOLD_COLORS[6].hex,
//                                 id: '0',
//                                 name: THRESHOLD_COLORS[6].name,
//                                 value: 0,
//                             }
//                         ] as Color[],
//                         prefix: '',
//                         tickPrefix: '',
//                         suffix: '',
//                         tickSuffix: '',
//                         note: '',
//                         showNoteWhenEmpty: false,
//                         decimalPlaces: {
//                             isEnforced: false,
//                             digits: 2,
//                         },
//                         shape: 'chronograf-v2',
//                         legend: {}
//                     }
//                 },
//                 {
//                     key: "cpu_usage_system",
//                     display: "CPU Usage Percent",
//                     type: 'gauge',
//                     loading: RemoteDataState.Loading,
//                     query: `
//                         from(bucket: "system")
//                         |> range(start: -1m)
//                         |> filter(fn: (r) => r["_measurement"] == "cpu")
//                         |> filter(fn: (r) => r["_field"] == "usage_system")
//                         |> filter(fn: (r) => r["host"] == "vmi474601.contaboserver.net")
//                         |> filter(fn: (r) => r["cpu"] == "cpu-total")
//                         |> last()
//                     `,
//                     properties: {
//                         queries: [defaultViewQuery()],
//                         colors: [
//                             {
//                                 type: COLOR_TYPE_MIN,
//                                 hex: THRESHOLD_COLORS[6].hex,
//                                 id: '0',
//                                 name: THRESHOLD_COLORS[6].name,
//                                 value: 0,
//                             },
//                             {
//                                 type: COLOR_TYPE_THRESHOLD,
//                                 hex: THRESHOLD_COLORS[5].hex,
//                                 id: '1',
//                                 name: THRESHOLD_COLORS[5].name,
//                                 value: 20,
//                             },
//                             {
//                                 type: COLOR_TYPE_THRESHOLD,
//                                 hex: THRESHOLD_COLORS[3].hex,
//                                 id: '2',
//                                 name: THRESHOLD_COLORS[3].name,
//                                 value: 40,
//                             },
//                             {
//                                 type: COLOR_TYPE_THRESHOLD,
//                                 hex: THRESHOLD_COLORS[13].hex,
//                                 id: '3',
//                                 name: THRESHOLD_COLORS[13].name,
//                                 value: 60,
//                             },
//                             {
//                                 type: COLOR_TYPE_THRESHOLD,
//                                 hex: THRESHOLD_COLORS[1].hex,
//                                 id: '4',
//                                 name: THRESHOLD_COLORS[1].name,
//                                 value: 80,
//                             },
//                             {
//                                 type: COLOR_TYPE_MAX,
//                                 hex: THRESHOLD_COLORS[1].hex,
//                                 id: '5',
//                                 name: THRESHOLD_COLORS[1].name,
//                                 value: 100,
//                             },
//                         ] as Color[],
//                         prefix: '%',
//                         tickPrefix: '',
//                         suffix: '',
//                         tickSuffix: '',
//                         note: '',
//                         showNoteWhenEmpty: false,
//                         decimalPlaces: {
//                             isEnforced: false,
//                             digits: 2,
//                         },
//                         type: 'gauge',
//                         shape: 'chronograf-v2',
//                         legend: {}
//                     }
//                 }
//             ],
//         };
//     }

//     async componentDidMount() {
//         await this.generateChartValues();

//         let intervalId = window.setInterval(this.generateChartValues, 5000);
//         this.setState({ intervalId });
//     }

//     componentWillUnmount() {
//         clearInterval(this.state.intervalId);
//     }

//     generateChartValues = async () => {
//         await this.loadingCharts();
//         this.state.fluxQueries.map(query => {
//             this.fluxQueryResult(query);
//         })
//     }

//     loadingCharts = () => {
//         let queries = [...this.state.fluxQueries];
//         queries = queries.map(q => {
//             q["loading"] = RemoteDataState.Loading
//             return q;
//         })
//         this.setState({
//             fluxQueries: queries
//         })
//     }

//     fluxQueryResult = async (query) => {
//         const csvResult = await FactoryDashboardService.fluxQuery(this.props.orgID, query["query"]);
//         const jsonResult = await csvToJSON(csvResult);

//         let queries = [...this.state.fluxQueries];
//         queries = queries.map(q => {
//             if (q["key"] === query["key"]) {
//                 q["loading"] = RemoteDataState.Done
//             }
//             return q;
//         })

//         this.setState({
//             fluxResults: {
//                 ...this.state.fluxResults,
//                 [query["key"]]: jsonResult[0] !== undefined ? Number(Number(jsonResult[0]["_value"]).toFixed(2)) : 0,
//             },
//             fluxQueries: queries
//         })
//     }

//     render() {
//         return (
//             <>
//                 {
//                     this.state.fluxQueries.map(query => {
//                         switch (query["type"]) {
//                             case 'gauge':
//                                 return (
//                                     <Grid.Column widthXS={Columns.Six} key={query["key"]}>
//                                         <div
//                                             className="cell--view"
//                                             style={{ background: '#0f0e15', marginBottom: '10px' }}
//                                         >
//                                             <h2 style={{ textAlign: 'center' }}>{query["display"]}</h2>
//                                             <div style={{ width: 'auto', height: '250px' }}>
//                                                 <ViewLoadingSpinner loading={query["loading"]} />
//                                                 <GaugeChart
//                                                     value={this.state.fluxResults[query["key"]] !== undefined ? this.state.fluxResults[query["key"]] : 0}
//                                                     properties={query["properties"]}
//                                                     theme={'dark'}
//                                                 />
//                                             </div>
//                                         </div>
//                                     </Grid.Column>
//                                 )
//                             case 'single-stat':
//                                 return (
//                                     <Grid.Column widthXS={Columns.Six} key={query["key"]}>
//                                         <div
//                                             className="cell--view"
//                                             style={{ background: '#0f0e15', marginBottom: '10px' }}
//                                         >
//                                             <h2 style={{ textAlign: 'center' }}>{query["display"]}</h2>
//                                             <div style={{ width: 'auto', height: '250px' }}>
//                                                 <ViewLoadingSpinner loading={query["loading"]} />
//                                                 <SingleStat
//                                                     stat={this.state.fluxResults[query["key"]] !== undefined ? this.state.fluxResults[query["key"]] : 0}
//                                                     properties={query["properties"]}
//                                                     theme={'dark'}
//                                                 />
//                                             </div>
//                                         </div>
//                                     </Grid.Column>
//                                 )
//                         }
//                     })
//                 }

//             </>
//         )
//     }
// }

// export default FactoryDashboardPanel;