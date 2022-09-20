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
import { cellConfiguration, viewConfiguration } from 'src/dashboards/constants/cellConfigurations'

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
class DashboardRouter extends Component<Props, State> {
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
                "name": this.props["match"].params.id,
                "description": `${this.props["match"].params.id} specific dashboard`
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

        const dashboardType = await this.getDashboardType(structure);

        let xAxisCounter;
        switch (dashboardType) {
            case "Factory":
                xAxisCounter = 0;

                for (let pl of structure[0].productionLines) {
                    for (let machine of pl.machines) {
                        let cellName = `Production Line: ${pl["name"]}, Machine: ${machine["name"]}`

                        if (!existsCells.includes(cellName)) {
                            let measurements = "";

                            machine.measurements.map((m, idx) => {
                                measurements += `r[\"_measurement\"] == \"${m}\"`;
                                if (idx !== machine.measurements.length - 1) {
                                    measurements += " or ";
                                }
                            })

                            measurements = machine.measurements.length > 0 ? `|> filter(fn: (r) => ${measurements})\n` : ""

                            let query;
                            if (machine.measurements.length > 0) {
                                query = `from(bucket: \"${structure[0].bucket}\")\n  
                                    |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  
                                    ${measurements}
                                    |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  
                                    |> yield(name: \"mean\")
                                `
                            } else {
                                query = "";
                            }

                            let params = {
                                dashboardID,
                                cellName,
                                "measurements": machine.measurements,
                                "fields": [],
                                "xAxis": xAxisCounter % 2 === 0 ? 0 : 6,
                                "bucket": structure[0].bucket,
                                "query": query,
                            }

                            await this.createCell(params);
                            xAxisCounter++;
                        }
                    }
                }
                break;
            case "ProductionLine":
                xAxisCounter = 0;

                for (let pl of structure[0].productionLines) {
                    if (pl["@id"] === this.props["match"].params.id) {
                        for (let machine of pl.machines) {
                            let cellName = `Production Line: ${pl["name"]}, Machine: ${machine["name"]}`

                            if (!existsCells.includes(cellName)) {
                                let measurements = "";

                                machine.measurements.map((m, idx) => {
                                    measurements += `r[\"_measurement\"] == \"${m}\"`;
                                    if (idx !== machine.measurements.length - 1) {
                                        measurements += " or ";
                                    }
                                })

                                measurements = machine.measurements.length > 0 ? `|> filter(fn: (r) => ${measurements})\n` : ""

                                let query;
                                if (machine.measurements.length > 0) {
                                    query = `from(bucket: \"${structure[0].bucket}\")\n  
                                    |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  
                                    ${measurements}
                                    |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  
                                    |> yield(name: \"mean\")
                                `
                                } else {
                                    query = "";
                                }

                                let params = {
                                    dashboardID,
                                    cellName,
                                    "measurements": machine.measurements,
                                    "fields": [],
                                    "xAxis": xAxisCounter % 2 === 0 ? 0 : 6,
                                    "bucket": structure[0].bucket,
                                    "query": query,
                                }

                                await this.createCell(params);
                                xAxisCounter++;
                            }
                        }
                    }
                }
                break;
            case "Machine":
                xAxisCounter = 0;

                console.log("Machine");

                for (let pl of structure[0].productionLines) {
                    console.log("pl", pl);
                    for (let machine of pl.machines) {
                        console.log("machine", machine);
                        if (machine["@id"] === this.props["match"].params.id) {
                            console.log("id matched");
                            for (let comp of machine.contents) {
                                console.log("comp", comp);
                                if (comp["@type"] === "Component") {
                                    for (let sensor of comp.sensors) {
                                        console.log("sensor", sensor);

                                        let cellName = `Component: ${comp["name"]}, Sensor: ${sensor["name"]}`

                                        if (!existsCells.includes(cellName)) {
                                            // Iterate measurements
                                            let measurements = "";
                                            machine.measurements.map((m, idx) => {
                                                measurements += `r[\"_measurement\"] == \"${m}\"`;
                                                if (idx !== machine.measurements.length - 1) {
                                                    measurements += " or ";
                                                }
                                            })
                                            measurements = machine.measurements.length > 0 ? `|> filter(fn: (r) => ${measurements})\n` : ""

                                            // Iterate fields
                                            let fields = "";
                                            sensor.fields.map((field, idx) => {
                                                fields += `r[\"_field\"] == \"${field["dataSource"]}\"`;
                                                if (idx !== sensor.fields.length - 1) {
                                                    fields += " or ";
                                                }
                                            })
                                            fields = sensor.fields.length > 0 ? `|> filter(fn: (r) => ${fields})\n` : ""

                                            let query;
                                            if (machine.measurements.length > 0) {
                                                query = `from(bucket: \"${structure[0].bucket}\")\n  
                                                |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  
                                                ${measurements}
                                                ${fields} 
                                                |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  
                                                |> yield(name: \"mean\")
                                            `
                                            } else {
                                                query = "";
                                            }

                                            let params = {
                                                dashboardID,
                                                cellName,
                                                "measurements": machine.measurements,
                                                "fields": sensor.fields.map(f => f["dataSource"]),
                                                "xAxis": xAxisCounter % 2 === 0 ? 0 : 6,
                                                "bucket": structure[0].bucket,
                                                "query": query,
                                            }

                                            console.log({ params });

                                            await this.createCell(params);
                                            xAxisCounter++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            case "Component":
                xAxisCounter = 0;

                for (let pl of structure[0].productionLines) {
                    for (let machine of pl.machines) {
                        for (let comp of machine.contents) {
                            if (comp["@type"] === "Component" && comp["@id"] === this.props["match"].params.id) {
                                for (let sensor of comp.sensors) {
                                    for (let field of sensor.fields) {
                                        let cellName = `Sensor: ${sensor["name"]}, Field: ${field["name"]}`

                                        if (!existsCells.includes(cellName)) {
                                            // Iterate measurements
                                            let measurements = "";
                                            machine.measurements.map((m, idx) => {
                                                measurements += `r[\"_measurement\"] == \"${m}\"`;
                                                if (idx !== machine.measurements.length - 1) {
                                                    measurements += " or ";
                                                }
                                            })
                                            measurements = machine.measurements.length > 0 ? `|> filter(fn: (r) => ${measurements})\n` : ""

                                            // Iterate fields
                                            // let fields = "";
                                            // sensor.fields.map((field, idx) => {
                                            //     fields += `r[\"_field\"] == \"${field["name"]}\"`;
                                            //     if (idx !== sensor.fields.length - 1) {
                                            //         fields += " or ";
                                            //     }
                                            // })
                                            // fields = sensor.fields.length > 0 ? `|> filter(fn: (r) => ${fields})\n` : ""

                                            let query;
                                            if (machine.measurements.length > 0) {
                                                query = `from(bucket: \"${structure[0].bucket}\")\n  
                                                    |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  
                                                    ${measurements}
                                                    |> filter(fn: (r) => r[\"_field\"] == \"${field["dataSource"]}\")\n
                                                    |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  
                                                    |> yield(name: \"mean\")
                                                `
                                            } else {
                                                query = "";
                                            }

                                            let params = {
                                                dashboardID,
                                                cellName,
                                                "measurements": machine.measurements,
                                                "fields": [field["dataSource"]],
                                                "xAxis": xAxisCounter % 2 === 0 ? 0 : 6,
                                                "bucket": structure[0].bucket,
                                                "query": query,
                                            }

                                            await this.createCell(params);
                                            xAxisCounter++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            case "Sensor":
                xAxisCounter = 0;

                for (let pl of structure[0].productionLines) {
                    for (let machine of pl.machines) {
                        for (let comp of machine.contents) {
                            if (comp["@type"] === "Component") {
                                for (let sensor of comp.sensors) {
                                    if (sensor["@id"] === this.props["match"].params.id) {
                                        for (let field of sensor.fields) {
                                            let cellName = `Field: ${field["name"]}`

                                            if (!existsCells.includes(cellName)) {
                                                // Iterate measurements
                                                let measurements = "";
                                                machine.measurements.map((m, idx) => {
                                                    measurements += `r[\"_measurement\"] == \"${m}\"`;
                                                    if (idx !== machine.measurements.length - 1) {
                                                        measurements += " or ";
                                                    }
                                                })
                                                measurements = machine.measurements.length > 0 ? `|> filter(fn: (r) => ${measurements})\n` : ""

                                                let query;
                                                if (machine.measurements.length > 0) {
                                                    query = `from(bucket: \"${structure[0].bucket}\")\n  
                                                            |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  
                                                            ${measurements}
                                                            |> filter(fn: (r) => r[\"_field\"] == \"${field["dataSource"]}\")\n
                                                            |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  
                                                            |> yield(name: \"mean\")
                                                        `
                                                } else {
                                                    query = "";
                                                }

                                                let params = {
                                                    dashboardID,
                                                    cellName,
                                                    "measurements": machine.measurements,
                                                    "fields": [field["dataSource"]],
                                                    "xAxis": xAxisCounter % 2 === 0 ? 0 : 6,
                                                    "bucket": structure[0].bucket,
                                                    "query": query,
                                                }

                                                await this.createCell(params);
                                                xAxisCounter++;
                                            }
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

    createCell = async (params) => {
        const cellConfig = await cellConfiguration(params);
        const createdCell = await DashboardService.createCellOfDashboard(cellConfig, params.dashboardID);
        const viewConfig = await viewConfiguration(params);
        await DashboardService.updateViewOfCell(viewConfig, params.dashboardID, createdCell?.id);
        return true;
    }

    getDashboardType = (structure) => {
        let paramID = this.props["match"].params.id;
        let dashboardType;

        if (structure[0].id === paramID) {
            dashboardType = structure[0].type
        } else {
            structure[0].productionLines.forEach(pl => {
                if (pl["@id"] === paramID) {
                    dashboardType = pl.type;
                    return;
                }
                pl.machines.forEach(machine => {
                    if (machine["@id"] === paramID) {
                        dashboardType = machine.type;
                        return;
                    }
                    machine.contents.forEach(comp => {
                        if (comp["@type"] === "Component") {
                            if (comp["@id"] === paramID) {
                                dashboardType = comp.type;
                                return;
                            }
                            comp.sensors.forEach(sensor => {
                                if (sensor["@id"] === paramID) {
                                    dashboardType = sensor.type
                                    return;
                                }
                            })
                        }
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

export default connector(DashboardRouter)
