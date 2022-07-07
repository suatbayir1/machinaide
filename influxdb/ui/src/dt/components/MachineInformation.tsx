// Libraries
import React, { PureComponent } from "react";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    DapperScrollbars, List, Gradients, ConfirmationButton,
    IconFont, ComponentColor, Appearance, Button, ButtonType,
    MultiSelectDropdown, Input, TextArea, ComponentStatus
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";

// Services
import DTService from "src/shared/services/DTService";
import FluxService from "src/shared/services/FluxService";

// Utils
import { csvToJSON } from 'src/shared/helpers/FileHelper';
import { handleValidation } from "src/shared/helpers/FormValidator";

// Constants
import { updateMachineConfirmationText, deleteMachineConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    refreshGeneralInfo: () => void
    clickPartDetail: () => void
    clickBrands: () => void
    orgID: string
}

type State = {
    displayName: string
    description: string
    measurements: string[]
    selectedMeasurements: string[]
    operationType: "update" | "delete"
    visibleConfirmationOverlay: boolean
}

class MachineInformation extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            displayName: "",
            description: "",
            measurements: [],
            selectedMeasurements: [],
            operationType: "update",
            visibleConfirmationOverlay: false,
        }
    }

    public async componentDidMount(): Promise<void> {
        await this.getMeasurements();
        this.setForm();
    }

    public async componentDidUpdate(prevProps: Readonly<Props>): Promise<void> {
        if (prevProps.selectedGraphNode !== this.props.selectedGraphNode) {
            await this.getMeasurements();
            this.setForm();
        }
    }

    private setForm = (): void => {
        const { selectedGraphNode } = this.props;
        console.log("selectedGraphNode", selectedGraphNode);

        this.setState({
            displayName: selectedGraphNode["displayName"],
            description: selectedGraphNode["description"],
            selectedMeasurements: selectedGraphNode["measurements"],
        })
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    public getMeasurements = async (): Promise<void> => {
        const { selectedGraphNode, orgID } = this.props;

        const treeStructure = await DTService.getAllDT();

        let bucket;
        treeStructure[0]["productionLines"].map(pl => {
            pl["machines"].map(machine => {
                if (selectedGraphNode["@id"] === machine["@id"]) {
                    bucket = treeStructure[0]["bucket"];
                }
            })
        })

        const query = `
        from(bucket: "${bucket}")
            |> range(start: -1h, stop: now())
            |> filter(fn: (r) => true)
            |> keep(columns: ["_measurement"])
            |> group()
            |> distinct(column: "_measurement")
            |> limit(n: 200)
            |> sort()
        `
        const csvResult = await FluxService.fluxQuery(orgID, query);
        const jsonResult = await csvToJSON(csvResult);

        let measurements = [];
        jsonResult.map(item => {
            if (item["_value\r"] != undefined) {
                measurements = [...measurements, item["_value\r"].replace('\r', '')];
            }
        });

        this.setState({ measurements });
    }

    private deleteMachine = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;

        const payload = {
            "id": selectedGraphNode["@id"]
        }

        const deletedResult = await DTService.deleteMachine(payload);

        if (deletedResult.summary.code === 200) {
            handleChangeNotification("success", deletedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", deletedResult.message.text);
        }
    }

    private updateMachineConfirmed = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;
        const { displayName, description, selectedMeasurements } = this.state;

        const payload = {
            "id": selectedGraphNode["id"],
            displayName,
            description,
            "measurements": selectedMeasurements
        }

        const updatedResult = await DTService.updateMachine(payload);

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

    private updateMachine = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification } = this.props;
        const { displayName, selectedMeasurements } = this.state;

        if (displayName.trim() == "") {
            handleChangeNotification("error", "Display name cannot be empty");
            return;
        }

        if (selectedGraphNode["measurements"].sort().join(',') !== selectedMeasurements.sort().join(',')) {
            this.setState({ visibleConfirmationOverlay: true })
        } else {
            this.updateMachineConfirmed();
        }
    }

    private getComponentCount = (content): number => {
        let components = content.filter(c => c?.["@type"] === "Component");
        return components.length;
    }

    public handleChangeMeasurements = (option: string) => {
        const { selectedMeasurements } = this.state
        const optionExists = selectedMeasurements.find(opt => opt === option)
        let updatedOptions = selectedMeasurements

        if (optionExists) {
            updatedOptions = selectedMeasurements.filter(fo => fo !== option)
        } else {
            updatedOptions = [...selectedMeasurements, option]
        }

        this.setState({ selectedMeasurements: updatedOptions })
    }

    public render() {
        const { selectedGraphNode, clickPartDetail, clickBrands } = this.props;
        const {
            displayName, description, selectedMeasurements, measurements,
            operationType, visibleConfirmationOverlay
        } = this.state;

        return (
            <>
                <DangerConfirmationOverlay
                    title={"Are you sure ?"}
                    message={operationType == "update" ? updateMachineConfirmationText : deleteMachineConfirmationText}
                    visible={visibleConfirmationOverlay}
                    onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                    onConfirm={() => { operationType == "update" ? this.updateMachineConfirmed() : this.deleteMachine() }}
                />

                <Form key={selectedGraphNode["id"]}>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Four}
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
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Four}
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
                                widthSM={Columns.Four}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element
                                    label="Display Name"
                                    errorMessage={handleValidation(displayName)}
                                    required={true}
                                >
                                    {/* <Input
                                        name="displayName"
                                        placeholder="Display Name.."
                                        onChange={this.handleChangeInput}
                                        value={displayName}
                                    /> */}
                                    <Label
                                        size={ComponentSize.Small}
                                        name={displayName}
                                        description="Display Name"
                                        color={InfluxColors.Ocean}
                                        id={displayName}
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
                                        status={ComponentStatus.Disabled}
                                        rows={4}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Four}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Measurements">
                                    {/* <MultiSelectDropdown
                                        emptyText={"Select measurement"}
                                        options={measurements}
                                        selectedOptions={selectedMeasurements}
                                        onSelect={this.handleChangeMeasurements}
                                        buttonStatus={ComponentStatus.Disabled}
                                    /> */}
                                    {
                                        selectedMeasurements.length > 0 ?
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true}
                                                style={{ maxHeight: '100px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                {
                                                    selectedMeasurements.map((measurement, idx) => {
                                                        return (
                                                            <List.Item
                                                                key={idx}
                                                                value={measurement}
                                                                title="Measurements"
                                                                gradient={Gradients.GundamPilot}
                                                                wrapText={true}
                                                            >
                                                                <List.Indicator type="dot" />
                                                                <div className="selectors--item-value selectors--item__measurement">
                                                                    {measurement}
                                                                </div>
                                                            </List.Item>
                                                        )
                                                    })
                                                }
                                            </DapperScrollbars>
                                            : <h6>No measurement is selected</h6>
                                    }
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Twelve}>
                                <Form.Element label={`Component List (${this.getComponentCount(selectedGraphNode["contents"])})`}>
                                    {
                                        this.getComponentCount(selectedGraphNode["contents"]) > 0 ?
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true}
                                                style={{ maxHeight: '100px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                {
                                                    selectedGraphNode["contents"].map((component, idx) => {
                                                        return (
                                                            <List.Item
                                                                key={idx}
                                                                value={component.displayName}
                                                                title="Component Name"
                                                                gradient={Gradients.GundamPilot}
                                                                wrapText={true}
                                                            >
                                                                <List.Indicator type="dot" />
                                                                <div className="selectors--item-value selectors--item__measurement">
                                                                    {component.displayName}
                                                                </div>
                                                            </List.Item>
                                                        )
                                                    })
                                                }
                                            </DapperScrollbars>
                                            : <h6>No component found</h6>
                                    }
                                </Form.Element>
                            </Grid.Column>
                        </Grid.Row>
                        {/* <Grid.Row>
                            <div className="dt-information-buttons">
                                <Button
                                    text="Summary"
                                    icon={IconFont.CogThick}
                                    onClick={clickPartDetail}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Primary}
                                />

                                <Button
                                    text="Brands"
                                    icon={IconFont.Plus}
                                    onClick={clickBrands}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Secondary}
                                />
                                {
                                    ["admin"].includes(localStorage.getItem("userRole")) &&
                                    <ConfirmationButton
                                        icon={IconFont.Checkmark}
                                        onConfirm={() => {
                                            this.setState({ operationType: "update" },
                                                () => this.updateMachine())
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
                        </Grid.Row> */}
                    </Grid>
                </Form>
            </>
        )
    }
}

export default MachineInformation;