// Libraries
import React, { Component } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    SpinnerContainer, TechnoSpinner, RemoteDataState,
} from '@influxdata/clockface'

// Actions
import { getDashboards } from 'src/dashboards/actions/thunks'

// Decorators
import { ErrorHandling } from 'src/shared/decorators/errors'

// Types
import { Dashboard, AppState, ResourceType } from 'src/types'
import { Sort } from '@influxdata/clockface'
import { getAll } from 'src/resources/selectors'
import { SortTypes } from 'src/shared/utils/sort'
import { DashboardSortKey } from 'src/shared/components/resource_sort_dropdown/generateSortItems'

// Services
import DashboardService from 'src/shared/services/DashboardService';
import DTService from 'src/shared/services/DTService';


// Utilities
import { cellConfiguration, viewConfiguration, gaugeChartConfiguration, tableChartConfiguration } from 'src/dashboards/constants/cellConfigurations'

interface OwnProps {
    onFilterChange: (searchTerm: string) => void
    searchTerm: string
    dashboardType: string
    filterComponent?: JSX.Element
    sortDirection: Sort
    sortType: SortTypes
    sortKey: DashboardSortKey
}

interface State {
    spinnerLoading: RemoteDataState
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = ReduxProps & OwnProps

@ErrorHandling
class SnapshotRouter extends Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            spinnerLoading: RemoteDataState.Loading,
        };
    }

    public async componentDidMount() {
        await this.props.getDashboards();
        this.createOrUpdateDashboard();
    }

    createOrUpdateDashboard = async () => {
        const dtDashboards = await DashboardService.getDTDashboards();
        const isExists = dtDashboards.find(d => d.dtID === this.props["match"].params.id);

        let dashboardId;

        if (isExists === undefined) {
            const dashboard = {
                "orgID": this.props["match"].params.orgID,
                "name": `${this.props["match"].params.id.split("-")[1]}-snapshots`,
                "description": `${this.props["match"].params.id} snapshots`
            }

            const result = await DashboardService.createDashboard(dashboard);

            const payload = {
                "dtID": this.props["match"].params.id,
                "dashboardID": result?.id,
                "name": result?.name
            }

            await DashboardService.createDTDashboard(payload);

            dashboardId = result?.id;
        } else {
            dashboardId = isExists?.dashboardID;
        }

        await this.createCellsOfDashboard(dashboardId);

        this.props["history"].push(`/orgs/${this.props["match"].params.orgID}/dashboards/${dashboardId}`)
    }

    createCellsOfDashboard = async (dashboardID) => {
        const { dashboards } = this.props;
        const structure = await DTService.getAllDT();
        const dashboard = dashboards.find(d => d.id === dashboardID);

        let existsCells: string[] = [];
        if (dashboard !== undefined) {
            existsCells = await Promise.all(dashboard?.cells.map(async (cellID): Promise<string> => {
                let cell = await DashboardService.getCell(dashboardID, cellID);
                return cell.name;
            }));
        }

        let xAxisCounter;
        let totalWidth;


        switch (this.props["match"].params.id.split("-")[0]) {
            case "component":
                xAxisCounter = 0;
                totalWidth = 0;

                for (let pl of structure[0].productionLines) {
                    for (let machine of pl.machines) {
                        for (let comp of machine.contents) {
                            if (comp["@type"] === "Component" && comp["@id"] === this.props["match"].params.id.split("-")[1]) {

                                let measurements = "";

                                machine.measurements.map((m, idx) => {
                                    measurements += `r[\"_measurement\"] == \"${m}\"`;
                                    if (idx !== machine.measurements.length - 1) {
                                        measurements += " or ";
                                    }
                                })

                                measurements = machine.measurements.length > 0 ? `|> filter(fn: (r) => ${measurements})\n` : ""

                                for (let sensor of comp.sensors) {
                                    // iterate each field
                                    for (let field of sensor.fields) {
                                        let cellName = field;

                                        console.log("sensor field");

                                        if (!existsCells.includes(cellName)) {

                                            let query;
                                            if (machine.measurements.length > 0) {
                                                query = `from(bucket: \"${structure[0].bucket}\")\n  
                                            |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  
                                            ${measurements}
                                            |> filter(fn: (r) => r[\"_field\"] == \"${field}\")\n
                                            |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  
                                            |> yield(name: \"mean\")
                                        `
                                            } else {
                                                query = "";
                                            }

                                            let xAxis = this.calculateXAxis(xAxisCounter)

                                            let params = {
                                                dashboardID,
                                                cellName,
                                                "xAxis": xAxis,
                                                "yAxis": 0,
                                                "weight": 2,
                                                "height": 3,
                                                "bucket": structure[0].bucket,
                                                "query": query,
                                                "chartType": "gauge",
                                                "minValue": sensor.minValue,
                                                "maxValue": sensor.maxValue
                                            }

                                            await this.createCell(params);
                                            xAxisCounter++;
                                            totalWidth += 2;
                                        }
                                    }
                                }


                                // iterate sensor groups
                                if (comp.sensorGroups !== undefined) {
                                    for (let group of comp?.sensorGroups) {
                                        let cellName = group.name;

                                        console.log("group");


                                        if (!existsCells.includes(cellName)) {
                                            // Iterate fields
                                            let fields = "";
                                            group.fields.map((field, idx) => {
                                                fields += `r[\"_field\"] == \"${field}\"`;
                                                if (idx !== group.fields.length - 1) {
                                                    fields += " or ";
                                                }
                                            })
                                            fields = group.fields.length > 0 ? `|> filter(fn: (r) => ${fields})\n` : ""


                                            let query;
                                            if (machine.measurements.length > 0) {
                                                query = `from(bucket: \"${structure[0].bucket}\")\n  
                                                        |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  
                                                        ${measurements}
                                                        ${fields}
                                                        |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  
                                                        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
                                                        |> limit(n: 10)
                                                        |> drop(columns: ["host", "_measurement", "_start", "_stop"])
                                                        |> yield(name: \"mean\")
                                                    `

                                                // from(bucket: "Ermetal")
                                                //     |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
                                                //     |> filter(fn: (r) => r["_measurement"] == "Press31_DB1" or r["_measurement"] == "Press31_DB2")
                                                //     |> filter(fn: (r) => r["_field"] == "mean_AM_Arka_Acc" or r["_field"] == "mean_AM_Arka_Balans" or r["_field"] == "mean_AM_Arka_Bosluk" or r["_field"] == "mean_AM_Arka_Eks_kac")
                                                //     |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
                                                //     |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
                                                //     |> limit(n: 5)
                                                //     |> drop(columns: ["host", "_measurement", "_start", "_stop"])
                                                //     |> yield(name: "mean")
                                            } else {
                                                query = "";
                                            }

                                            console.log("totalWidth", Math.floor(totalWidth / 12));

                                            let params = {
                                                dashboardID,
                                                cellName,
                                                "xAxis": 0,
                                                "yAxis": Math.floor(totalWidth / 12),
                                                "weight": 12,
                                                "height": 4,
                                                "bucket": structure[0].bucket,
                                                "query": query,
                                                "chartType": "table",
                                            }

                                            await this.createCell(params);
                                            xAxisCounter++;
                                            totalWidth += 12;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            default:
                break;
        }
    }

    calculateXAxis = (xAxisCounter) => {
        let modSix = (xAxisCounter % 6) * 2;
        return modSix;
    }

    createCell = async (params) => {
        const cellConfig = await cellConfiguration(params);
        const createdCell = await DashboardService.createCellOfDashboard(cellConfig, params.dashboardID);
        let viewConfig;

        switch (params.chartType) {
            case "gauge":
                viewConfig = await gaugeChartConfiguration(params);
                break;
            case "table":
                viewConfig = await tableChartConfiguration(params);
                break;
            default:
                viewConfig = await viewConfiguration(params);
                break;
        }

        // const viewConfig = await viewConfiguration(params);
        await DashboardService.updateViewOfCell(viewConfig, params.dashboardID, createdCell?.id);
        return true;
    }

    getDashboardType = (structure) => {
        let paramID = this.props["match"].params.id;

        let dashboardType;
        if (structure.id === paramID) {
            dashboardType = structure.type
        } else {
            structure.productionLines.forEach(pl => {
                if (pl.id === paramID) {
                    dashboardType = pl.type;
                    return;
                }
                pl.machines.forEach(machine => {
                    if (machine.id === paramID) {
                        dashboardType = machine.type;
                        return;
                    }
                    machine.components.forEach(comp => {
                        if (comp.id === paramID) {
                            dashboardType = comp.type;
                            return;
                        }
                        comp.sensors.forEach(sensor => {
                            if (sensor.id === paramID) {
                                dashboardType = sensor.type
                                return;
                            }
                        })
                    })
                })
            })
        }

        return dashboardType;
    }

    public render() {
        const { spinnerLoading } = this.state;

        return (
            <SpinnerContainer
                loading={spinnerLoading}
                spinnerComponent={<TechnoSpinner />}
            >
            </SpinnerContainer>
        )
    }
}

const mstp = (state: AppState) => {
    return {
        dashboards: getAll<Dashboard>(state, ResourceType.Dashboards),
    }
}

const mdtp = {
    getDashboards: getDashboards,
}

const connector = connect(mstp, mdtp)

export default connector(SnapshotRouter)
