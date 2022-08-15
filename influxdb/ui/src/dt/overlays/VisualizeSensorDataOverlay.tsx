// Libraries
import React, { PureComponent } from 'react'

// Components
import {
    Overlay, Grid, Form, Columns, SelectDropdown, IconFont, Button,
    ComponentColor, Dropdown,
} from '@influxdata/clockface'
import LineChart from 'src/shared/charts/LineChart';
import VerticalBarChart from 'src/shared/charts/VerticalBarChart';
import AreaChart from 'src/shared/charts/AreaChart';
import HorizontalBar from 'src/shared/charts/HorizontalBar';
import ScatterChart from 'src/shared/charts/ScatterChart';

// Services
import FluxService from "src/shared/services/FluxService";

// Utils
import { csvToJSON } from 'src/shared/helpers/FileHelper';

// Constants
import autoRefreshOptions, {
    AutoRefreshOption,
    AutoRefreshOptionType,
} from 'src/shared/data/autoRefreshes'
// Constants
import {
    SELECTABLE_TIME_RANGES,
} from 'src/shared/constants/timeRanges'

// Types
import {
    TimeRange,
} from 'src/types'

interface Props {
    visible: boolean
    onClose: () => void
    field: object
    dt: any[]
    orgID: string
}

interface State {
    bucket: string
    jsonResult: any[]
    graphTypes: string[]
    graphType: string
    data: Number[],
    xaxis: string[],
    timeRange: TimeRange
    windowPeriods: object
    autoRefresh: AutoRefreshOption
}

class VisualizeSensorDataOverlay extends PureComponent<Props, State> {
    private intervalID: NodeJS.Timer

    constructor(props) {
        super(props);

        this.state = {
            bucket: "",
            jsonResult: [],
            graphTypes: ["Line", "Area", "Vertical Bar", "Horizontal Bar", "Scatter"],
            graphType: "Line",
            data: [],
            xaxis: [],
            timeRange: {
                seconds: 300,
                lower: 'now() - 5m',
                upper: null,
                label: 'Past 5m',
                duration: '5m',
                type: 'selectable-duration',
                windowPeriod: 10000, // 10s
            },
            windowPeriods: {
                "5m": "10s",
                "15m": "30s",
                "1h": "2m",
                "6h": "12m",
                "12h": "24m",
                "24h": "48m",
                "2d": "2h",
                "7d": "6h",
                "30d": "1d",
            },
            autoRefresh: {
                id: 'auto-refresh-paused',
                milliseconds: 0,
                label: 'Paused',
                type: AutoRefreshOptionType.Option,
            },
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.visible !== this.props.visible && this.props.visible) {
            this.findBucket();
        }
    }

    findBucket = async () => {
        const { field, dt } = this.props;
        let bucket;

        for (const factory of dt) {
            for (const pl of factory["productionLines"]) {
                for (const machine of pl["machines"]) {
                    for (const component of machine["contents"]) {
                        if (component["type"] === "Component") {
                            for (const sensor of component["sensors"]) {
                                for (const f of sensor["fields"]) {
                                    if (f["@id"] === field["@id"]) {
                                        bucket = factory["bucket"] || ""
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        this.setState({ bucket }, () => this.executeQuery())
    }

    executeQuery = async () => {
        const { orgID, field } = this.props;
        const { bucket, timeRange, windowPeriods } = this.state;

        const query = `
        from(bucket: "${bucket}")
            |> range(start: -${timeRange["duration"]}, stop: now())
            |> filter(fn: (r) => r["_measurement"] == "${field["measurement"]}")
            |> filter(fn: (r) => r["_field"] == "${field["dataSource"]}")
            |> aggregateWindow(every: ${windowPeriods[timeRange["duration"]]}, fn: mean, createEmpty: false)
            |> yield(name: "mean")
        `

        const csvResult = await FluxService.fluxQuery(orgID, query);
        const jsonResult = await csvToJSON(csvResult);

        let data = [], xaxis = [];
        jsonResult.map(item => {
            if (item["_value"] !== undefined || item["_time"] !== undefined) {
                var today = new Date(item["_time"]).toLocaleString();
                xaxis.push(today);
                data.push(Number(item["_value"]).toFixed(2));
            }
        });

        this.setState({ data, xaxis })
    }

    getFieldsFromSelectedNode = async (node) => {
        const fields = [];

        findField(node);

        function findField(child) {
            if (child.type === "Field") {
                fields.push({ name: child.name, displayName: child.displayName, dataSource: child.dataSource });
            }

            if (child["children"]) {
                child["children"].forEach(subChild => {
                    findField(subChild);
                })
            }
        }

        return fields;
    }

    handleTimeRangeChange = (timeRange) => {
        this.setState({ timeRange }, () => this.executeQuery());
    }

    handleAutoRefreshChange = async (autoRefresh) => {
        this.setState({ autoRefresh });

        await clearInterval(this.intervalID);

        if (autoRefresh.label === "Paused") { return }

        this.intervalID = setInterval(() => {
            console.log("run", autoRefresh.milliseconds);
            this.executeQuery();
        }, autoRefresh.milliseconds)
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    renderChart = (field) => {
        const { graphType, data, xaxis, } = this.state;

        switch (graphType) {
            case "Line":
                return <LineChart
                    id={field.name}
                    dataList={data}
                    xaxis={xaxis}
                    graphType={"line"}
                    field={field}
                />
            case "Area":
                return <AreaChart
                    dataList={data}
                    xaxis={xaxis}
                    graphType={"area"}
                    field={field}
                />
            case "Vertical Bar":
                return <VerticalBarChart
                    dataList={data}
                    xaxis={xaxis}
                    graphType={"bar"}
                    field={field}
                />
            case "Horizontal Bar":
                return <HorizontalBar
                    dataList={data}
                    xaxis={xaxis}
                    graphType={"bar"}
                    field={field}
                />
            case "Scatter":
                return <ScatterChart
                    dataList={data}
                    xaxis={xaxis}
                    graphType={"scatter"}
                    field={field}
                />
            default:
                break;
        }
    }

    private get dropdownIcon(): IconFont {
        if (this.state.autoRefresh.label === "Paused") {
            return IconFont.Pause
        }

        return IconFont.Refresh
    }

    render() {
        const { visible, onClose, field } = this.props;
        const { graphTypes, graphType, timeRange, autoRefresh } = this.state;

        return (
            <Overlay visible={visible}>
                <Overlay.Container maxWidth={1500}>
                    <Overlay.Header
                        title={"Data Explorer"}
                        onDismiss={onClose}
                    />
                    <Overlay.Body>
                        <Grid>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Two}>
                                    <Form.Element
                                        label="Graph Type"
                                    >
                                        <SelectDropdown
                                            options={graphTypes}
                                            selectedOption={graphType}
                                            onSelect={(e) => { this.setState({ graphType: e }) }}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Two}>
                                    <Form.Element
                                        label="Time Range"
                                    >
                                        <Dropdown
                                            button={(active, onClick) => (
                                                <Dropdown.Button active={active} onClick={onClick}>
                                                    {timeRange["label"]}
                                                </Dropdown.Button>
                                            )}
                                            menu={onCollapse => (
                                                <Dropdown.Menu
                                                    onCollapse={onCollapse}
                                                >
                                                    <Dropdown.Divider
                                                        key="Time Range"
                                                        text="Time Range"
                                                        id="Time Range"
                                                    />
                                                    {SELECTABLE_TIME_RANGES.map((t) => {
                                                        return (
                                                            <Dropdown.Item
                                                                key={t["label"]}
                                                                value={t}
                                                                selected={t["label"] === timeRange["label"]}
                                                                onClick={this.handleTimeRangeChange}
                                                            >
                                                                {t["label"]}
                                                            </Dropdown.Item>
                                                        )
                                                    })}
                                                </Dropdown.Menu>
                                            )}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Two}>
                                    <Form.Element
                                        label="Auto Refresh"
                                    >
                                        <Dropdown
                                            button={(active, onClick) => (
                                                <Dropdown.Button
                                                    active={active}
                                                    onClick={onClick}
                                                    icon={this.dropdownIcon}
                                                >
                                                    {autoRefresh["label"]}
                                                </Dropdown.Button>
                                            )}
                                            menu={onCollapse => (
                                                <Dropdown.Menu
                                                    onCollapse={onCollapse}
                                                >
                                                    {autoRefreshOptions.map(option => {
                                                        if (option.type === AutoRefreshOptionType.Header) {
                                                            return (
                                                                <Dropdown.Divider
                                                                    key={option.id}
                                                                    id={option.id}
                                                                    text={option.label}
                                                                />
                                                            )
                                                        }

                                                        return (
                                                            <Dropdown.Item
                                                                key={option.id}
                                                                id={option.id}
                                                                value={option}
                                                                selected={option.id === autoRefresh.id}
                                                                onClick={this.handleAutoRefreshChange}
                                                            >
                                                                {option.label}
                                                            </Dropdown.Item>
                                                        )
                                                    })}
                                                </Dropdown.Menu>
                                            )}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.One}>
                                    <Form.Element
                                        label="Refresh"
                                    >
                                        <Button
                                            text="Refresh"
                                            icon={IconFont.Refresh}
                                            color={ComponentColor.Default}
                                            onClick={this.executeQuery}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                            </Grid.Row>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Twelve} >
                                    {
                                        this.renderChart(field)
                                    }
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay >
        )
    }
}

export default VisualizeSensorDataOverlay;
