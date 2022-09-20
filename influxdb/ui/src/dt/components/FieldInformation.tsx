// Libraries
import React, { PureComponent } from "react";
import i18next from "i18next";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    SlideToggle, FlexBox, InputLabel
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";

// Services
import DTService from "src/shared/services/DTService";
import FluxService from "src/shared/services/FluxService";

// Utils
import { csvToJSON } from 'src/shared/helpers/FileHelper';

// Constants
import { updateFieldConfirmationText, deleteFieldConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    refreshGeneralInfo: () => void
    orgID: string
}

type State = {
    bucket: string
    measurements: string[]
    measurement: string
    dataSource: string
    minValue: number
    maxValue: number
    fields: string[]
    displayName: string
    description: string
    operationType: "update" | "delete"
    visibleConfirmationOverlay: boolean
    isFillNullActive: boolean
    defaultValue: string
    isOperationActive: boolean
    operation: string
    operationValue: string
}

class FieldInformation extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            bucket: "",
            measurements: [],
            measurement: "",
            dataSource: "",
            minValue: 0,
            maxValue: 0,
            fields: [],
            displayName: "",
            description: "",
            operationType: "update",
            visibleConfirmationOverlay: false,
            isFillNullActive: false,
            defaultValue: "0",
            isOperationActive: false,
            operation: "*",
            operationValue: "1"
        }
    }

    public async componentDidMount(): Promise<void> {
        await this.getMeasurement();
        await this.setForm();
    }

    public async componentDidUpdate(prevProps: Readonly<Props>): Promise<void> {
        if (prevProps.selectedGraphNode !== this.props.selectedGraphNode) {
            await this.getMeasurement();
            this.setForm();
        }
    }

    private getMeasurement = async (): Promise<void> => {
        const { selectedGraphNode } = this.props;

        const treeStructure = await DTService.getAllDT();

        let bucket;
        let measurements;
        treeStructure?.[0]?.["productionLines"].map(pl => {
            pl?.["machines"].map(machine => {
                machine?.["contents"].map(component => {
                    if (component["@type"] === "Component") {
                        component?.["sensors"].map(sensor => {
                            sensor?.["fields"].map(field => {
                                if (selectedGraphNode["@id"] == field["@id"]) {
                                    bucket = treeStructure[0]?.["bucket"];
                                    measurements = machine?.["measurements"];
                                }
                            })
                        })
                    }
                })
            })
        })

        if (bucket == undefined || measurements == undefined) {
            return;
        }

        this.setState({ bucket, measurements })
    }

    private setForm = () => {
        const { selectedGraphNode } = this.props;

        this.setState({
            description: selectedGraphNode["description"],
            displayName: selectedGraphNode["displayName"],
            dataSource: selectedGraphNode["dataSource"],
            measurement: selectedGraphNode["measurement"],
            minValue: selectedGraphNode["minValue"],
            maxValue: selectedGraphNode["maxValue"],
            isFillNullActive: selectedGraphNode["isFillNullActive"] ? selectedGraphNode["isFillNullActive"] : false,
            defaultValue: selectedGraphNode["defaultValue"] ? selectedGraphNode["defaultValue"] : "0",
            isOperationActive: selectedGraphNode["isOperationActive"] ? selectedGraphNode["isOperationActive"] : false,
            operation: selectedGraphNode["operation"] ? selectedGraphNode["operation"] : "*",
            operationValue: selectedGraphNode["operationValue"] ? selectedGraphNode["operationValue"] : "1",
        }, () => { this.handleChangeMeasurement() })
    }

    private deleteField = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage } = this.props;

        const payload = {
            "id": selectedGraphNode["@id"]
        }

        const deletedResult = await DTService.deleteField(payload);

        if (deletedResult.summary.code === 200) {
            handleChangeNotification("success", deletedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
        } else {
            handleChangeNotification("error", deletedResult.message.text);
        }
    }

    private updateFieldConfirmed = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;
        const { displayName, description, dataSource, minValue, maxValue, measurement,
            isFillNullActive, defaultValue, isOperationActive, operation, operationValue } = this.state;

        const payload = {
            "id": selectedGraphNode["@id"],
            displayName,
            description,
            measurement,
            dataSource,
            "minValue": Number(minValue),
            "maxValue": Number(maxValue),
            "isFillNullActive": isFillNullActive,
            "defaultValue": defaultValue,
            "isOperationActive": isOperationActive,
            "operation": operation,
            "operationValue": operationValue
        }

        const updatedResult = await DTService.updateField(payload);

        if (updatedResult.summary.code === 200) {
            handleChangeNotification("success", updatedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", updatedResult.message.text);
        }

        this.setState({ visibleConfirmationOverlay: false })
    }

    private handleChangeMeasurement = async (): Promise<void> => {
        const { orgID } = this.props;
        const { bucket, measurement } = this.state;

        if (bucket == "" || measurement == "") {
            return;
        }

        const query = `
            from(bucket: "${bucket}")
            |> range(start: -1h, stop: now())
            |> filter(fn: (r) => (r["_measurement"] == "${measurement}"))
            |> keep(columns: ["_field"])
            |> group()
            |> distinct(column: "_field")
            |> limit(n: 200)
            |> sort()
        `
        const csvResult = await FluxService.fluxQuery(orgID, query);
        const jsonResult = await csvToJSON(csvResult);

        let fields = [];
        jsonResult.map(item => {
            if (item["_value\r"] != undefined) {
                fields = [...fields, item["_value\r"].replace('\r', '')];
            }
        });

        this.setState({ fields })
    }

    public render() {
        const { selectedGraphNode } = this.props;
        const {
            dataSource, minValue, maxValue, measurement, displayName, description, operationType,
            visibleConfirmationOverlay, isFillNullActive, defaultValue, isOperationActive, operation, operationValue
        } = this.state;

        return (
            <>
                <DangerConfirmationOverlay
                    title={i18next.t('warning.are_you_sure')}
                    message={operationType == "update" ? updateFieldConfirmationText : deleteFieldConfirmationText}
                    visible={visibleConfirmationOverlay}
                    onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                    onConfirm={() => { operationType == "update" ? this.updateFieldConfirmed() : this.deleteField() }}
                />

                <Form key={selectedGraphNode["name"]}>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Three}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.type')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={selectedGraphNode["type"]}
                                        description={i18next.t('dt.type')}
                                        color={InfluxColors.Ocean}
                                        id={selectedGraphNode["type"]}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Three}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.parent')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={selectedGraphNode["parent"]}
                                        description={i18next.t('dt.parent')}
                                        color={InfluxColors.Ocean}
                                        id={selectedGraphNode["parent"]}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Six}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.display_name')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={displayName}
                                        description={i18next.t('dt.display_name')}
                                        color={InfluxColors.Ocean}
                                        id={displayName}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Three}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.measurement')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={measurement}
                                        description={i18next.t('dt.measurement')}
                                        color={InfluxColors.Ocean}
                                        id={measurement}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Three}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.data_source')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={dataSource}
                                        description={i18next.t('dt.data_source')}
                                        color={InfluxColors.Ocean}
                                        id={dataSource}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Three}
                                widthSM={Columns.Three}
                                widthMD={Columns.Six}
                                widthLG={Columns.Six}
                            >
                                <Form.Element label={i18next.t('dt.min_value')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={minValue ? minValue.toString() : "-"}
                                        description={i18next.t('dt.min_value')}
                                        color={InfluxColors.Ocean}
                                        id={minValue ? minValue.toString() : "noMinValue"}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Three}
                                widthSM={Columns.Three}
                                widthMD={Columns.Six}
                                widthLG={Columns.Six}
                            >
                                <Form.Element label={i18next.t('dt.max_value')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={maxValue ? maxValue.toString() : "-"}
                                        description={i18next.t('dt.max_value')}
                                        color={InfluxColors.Ocean}
                                        id={maxValue ? maxValue.toString() : "noMaxValue"}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Row>
                                <Grid.Column
                                    widthXS={Columns.Three}
                                    widthSM={Columns.Three}
                                    widthMD={Columns.Six}
                                    widthLG={Columns.Six}
                                >
                                    <FlexBox margin={ComponentSize.Small}>
                                        <InputLabel>{i18next.t('dt.do_operation_on_data')}</InputLabel>
                                        <SlideToggle
                                            active={isOperationActive}
                                            size={ComponentSize.ExtraSmall}
                                            onChange={() => this.setState({ isOperationActive: !this.state.isOperationActive })}
                                            disabled={true}
                                        />
                                    </FlexBox>
                                </Grid.Column>
                            </Grid.Row>
                            {isOperationActive && <Grid.Row><br /><Grid.Column
                                widthXS={Columns.Three}
                                widthSM={Columns.Three}
                                widthMD={Columns.Six}
                                widthLG={Columns.Six}
                            >
                                <Form.Element label={i18next.t('dt.operation')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={operation}
                                        description={i18next.t('dt.operation')}
                                        color={InfluxColors.Ocean}
                                        id={operation}
                                    />
                                </Form.Element>
                            </Grid.Column>
                                <Grid.Column
                                    widthXS={Columns.Three}
                                    widthSM={Columns.Three}
                                    widthMD={Columns.Six}
                                    widthLG={Columns.Six}
                                >
                                    <Form.Element label={i18next.t('dt.value')}>
                                        <Label
                                            size={ComponentSize.Small}
                                            name={operationValue}
                                            description={i18next.t('dt.value')}
                                            color={InfluxColors.Ocean}
                                            id={operationValue}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                            </Grid.Row>}
                            <Grid.Row>
                                <Grid.Column
                                    widthXS={Columns.Three}
                                    widthSM={Columns.Three}
                                    widthMD={Columns.Six}
                                    widthLG={Columns.Six}
                                >
                                    <FlexBox margin={ComponentSize.Small}>
                                        <InputLabel>{i18next.t('dt.fill_nan_values')}</InputLabel>
                                        <SlideToggle
                                            active={isFillNullActive}
                                            size={ComponentSize.ExtraSmall}
                                            onChange={() => this.setState({ isFillNullActive: !this.state.isFillNullActive })}
                                            disabled={true}
                                        />
                                    </FlexBox>
                                </Grid.Column>
                            </Grid.Row>
                            {isFillNullActive && (
                                <Grid.Row><br />
                                    <Grid.Column
                                        widthXS={Columns.Three}
                                        widthSM={Columns.Three}
                                        widthMD={Columns.Six}
                                        widthLG={Columns.Six}
                                    >
                                        <Form.Element label={i18next.t('dt.default_value')}>
                                            <Label
                                                size={ComponentSize.Small}
                                                name={defaultValue}
                                                description={i18next.t('dt.default_value')}
                                                color={InfluxColors.Ocean}
                                                id={defaultValue}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>
                            )}
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Twelve}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.description')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={description}
                                        description={i18next.t('dt.description')}
                                        color={InfluxColors.Ocean}
                                        id={description}
                                    />
                                </Form.Element>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Form>
            </>
        )
    }
}

export default FieldInformation;