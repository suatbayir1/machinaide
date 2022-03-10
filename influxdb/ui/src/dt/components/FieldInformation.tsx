// Libraries
import React, { PureComponent } from "react";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    ConfirmationButton, IconFont, ComponentColor, Appearance,
    SelectDropdown, ComponentStatus, InputType, Input, TextArea,
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";

// Services
import DTService from "src/shared/services/DTService";
import FluxService from "src/shared/services/FluxService";

// Utils
import { csvToJSON } from 'src/shared/helpers/FileHelper';
import { handleValidation } from "src/shared/helpers/FormValidator";

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

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    private setForm = () => {
        const { selectedGraphNode } = this.props;

        console.log("selectedGraphNode", selectedGraphNode);

        this.setState({
            description: selectedGraphNode["description"],
            displayName: selectedGraphNode["displayName"],
            dataSource: selectedGraphNode["dataSource"],
            measurement: selectedGraphNode["measurement"],
            minValue: selectedGraphNode["minValue"],
            maxValue: selectedGraphNode["maxValue"],
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
        const { displayName, description, dataSource, minValue, maxValue, measurement } = this.state;

        const payload = {
            "id": selectedGraphNode["@id"],
            displayName,
            description,
            measurement,
            dataSource,
            "minValue": Number(minValue),
            "maxValue": Number(maxValue)
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

    private updateField = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification } = this.props;
        const { displayName, dataSource, minValue, maxValue, measurement } = this.state;

        if (
            displayName.trim() == "" ||
            measurement.trim() == "" ||
            dataSource.trim() == "" ||
            String(minValue) == "" ||
            String(maxValue) == ""
        ) {
            handleChangeNotification("error", "Display name, measurement, data source, min value and max value cannot be empty");
            return;
        }

        if (Number(minValue) > Number(maxValue)) {
            handleChangeNotification("error", "Min value cannot greater than max value.");
            return;
        }

        if (dataSource !== selectedGraphNode["dataSource"] || measurement !== selectedGraphNode["measurement"]) {
            this.setState({ visibleConfirmationOverlay: true })
        } else {
            this.updateFieldConfirmed();
        }
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
            dataSource, minValue, maxValue, measurements, measurement, fields,
            displayName, description, operationType, visibleConfirmationOverlay
        } = this.state;

        return (
            <>
                <DangerConfirmationOverlay
                    title={"Are you sure ?"}
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
                                <Form.Element label="Type">
                                    <Label
                                        size={ComponentSize.Small}
                                        name={selectedGraphNode["type"]}
                                        description="Node type"
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
                                <Form.Element label="Parent">
                                    <Label
                                        size={ComponentSize.Small}
                                        name={selectedGraphNode["parent"]}
                                        description="Parent"
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
                                <Form.Element
                                    label="Display Name"
                                    errorMessage={handleValidation(displayName)}
                                    required={true}
                                >
                                    <Input
                                        name="displayName"
                                        placeholder="Display Name.."
                                        onChange={this.handleChangeInput}
                                        value={displayName}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Three}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Measurement">
                                    <SelectDropdown
                                        buttonStatus={["admin"].includes(localStorage.getItem("userRole"))
                                            ? ComponentStatus.Valid
                                            : ComponentStatus.Disabled
                                        }
                                        options={measurements}
                                        selectedOption={measurement}
                                        onSelect={(e) => { this.setState({ measurement: e }, () => this.handleChangeMeasurement()) }}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Three}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Data Source">
                                    <SelectDropdown
                                        buttonStatus={["admin"].includes(localStorage.getItem("userRole"))
                                            ? ComponentStatus.Valid
                                            : ComponentStatus.Disabled
                                        }
                                        options={fields}
                                        selectedOption={dataSource}
                                        onSelect={(e) => this.setState({ dataSource: e })}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Three}
                                widthSM={Columns.Three}
                                widthMD={Columns.Six}
                                widthLG={Columns.Six}
                            >
                                <Form.Element label="Min Value">
                                    <Input
                                        name="minValue"
                                        onChange={this.handleChangeInput}
                                        value={minValue}
                                        type={InputType.Number}
                                        status={["admin"].includes(localStorage.getItem("userRole"))
                                            ? ComponentStatus.Default
                                            : ComponentStatus.Disabled
                                        }
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Three}
                                widthSM={Columns.Three}
                                widthMD={Columns.Six}
                                widthLG={Columns.Six}
                            >
                                <Form.Element label="Max Value">
                                    <Input
                                        name="maxValue"
                                        onChange={this.handleChangeInput}
                                        value={maxValue}
                                        type={InputType.Number}
                                        status={["admin"].includes(localStorage.getItem("userRole"))
                                            ? ComponentStatus.Default
                                            : ComponentStatus.Disabled
                                        }
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Twelve}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Description">
                                    <TextArea
                                        name="description"
                                        value={description}
                                        placeholder="Description.."
                                        onChange={this.handleChangeInput}
                                        rows={4}
                                    />
                                </Form.Element>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <div className="dt-information-buttons">
                                {
                                    ["admin"].includes(localStorage.getItem("userRole")) &&
                                    <ConfirmationButton
                                        icon={IconFont.Checkmark}
                                        onConfirm={() => {
                                            this.setState({ operationType: "update" },
                                                () => this.updateField())
                                        }}
                                        text={"Update"}
                                        popoverColor={ComponentColor.Success}
                                        popoverAppearance={Appearance.Outline}
                                        color={ComponentColor.Success}
                                        confirmationLabel="Do you want to update ?"
                                        confirmationButtonColor={ComponentColor.Success}
                                        confirmationButtonText="Yes"
                                    />
                                }
                                {
                                    ["admin"].includes(localStorage.getItem("userRole")) &&
                                    <ConfirmationButton
                                        icon={IconFont.Remove}
                                        onConfirm={() => {
                                            this.setState({
                                                operationType: "delete",
                                                visibleConfirmationOverlay: true
                                            })
                                        }}
                                        text={"Delete"}
                                        popoverColor={ComponentColor.Danger}
                                        popoverAppearance={Appearance.Outline}
                                        color={ComponentColor.Danger}
                                        confirmationLabel="Do you want to delete ?"
                                        confirmationButtonColor={ComponentColor.Danger}
                                        confirmationButtonText="Yes"
                                    />
                                }
                            </div>
                        </Grid.Row>
                    </Grid>
                </Form>
            </>
        )
    }
}

export default FieldInformation;