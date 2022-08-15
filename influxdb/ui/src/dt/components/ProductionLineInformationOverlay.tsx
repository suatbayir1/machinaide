// Libraries
import React, { PureComponent } from "react";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors, SelectDropdown,
    DapperScrollbars, List, Gradients, ConfirmationButton,
    IconFont, ComponentColor, Appearance, TextArea, Input, Overlay
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";

// Services
import DTService from "src/shared/services/DTService";
import FactoryService from 'src/shared/services/FactoryService';

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";

// Constants
import { deleteProductionLineConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    refreshGeneralInfo: () => void
    isProductionLineInformationOverlayVisible: boolean
    handleDismissProductionLineInformationOverlay: () => void
    generalInfo: string[],
}

type State = {
    displayName: string
    operationType: "delete" | "update"
    description: string
    visibleConfirmationOverlay: boolean
    sections: object[]
    section: string
}

class ProductionLineInformationOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            displayName: "",
            description: "",
            operationType: "update",
            visibleConfirmationOverlay: false,
            sections: [],
            section: "",
        }
    }

    public componentDidMount(): void {
        this.setForm();
    }

    public async componentDidUpdate(prevProps: Readonly<Props>): Promise<void> {
        if (prevProps.selectedGraphNode !== this.props.selectedGraphNode) {
            this.setForm();
            this.getSections();
        }
    }

    public getSections = async () => {
        const sections = await FactoryService.getSectionsByFactory({ "factoryID": this.props.generalInfo["factoryID"] });
        this.setState({ sections })
    }

    private setForm = (): void => {
        const { selectedGraphNode } = this.props;

        this.setState({
            displayName: selectedGraphNode["displayName"],
            description: selectedGraphNode["description"],
            section: selectedGraphNode["section"] || ""
        })
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    private deleteProductionLine = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;

        const payload = {
            "id": selectedGraphNode["@id"]
        }

        const deletedResult = await DTService.deleteProductionLine(payload);

        if (deletedResult.summary.code === 200) {
            handleChangeNotification("success", deletedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", deletedResult.message.text);
        }
    }

    private updateProductionLine = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;
        const { displayName, description, section } = this.state;

        if (displayName.trim() === "" || description.trim() === "", section.trim() === "") {
            handleChangeNotification("error", "Production line name, section and description cannot be empty");
            return;
        }

        const payload = {
            "id": selectedGraphNode["@id"],
            displayName,
            description,
            section
        }
        const updatedResult = await DTService.updateProductionLine(payload);

        if (updatedResult.summary.code === 200) {
            this.props.handleDismissProductionLineInformationOverlay()
            handleChangeNotification("success", updatedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", updatedResult.message.text);
        }
    }

    public render() {
        const { selectedGraphNode, isProductionLineInformationOverlayVisible, handleDismissProductionLineInformationOverlay } = this.props;
        const { description, displayName, visibleConfirmationOverlay, sections, section } = this.state;

        return (
            <>
                <Overlay visible={isProductionLineInformationOverlayVisible}>
                    <Overlay.Container maxWidth={750}>
                        <Overlay.Header
                            title="Edit Production Line"
                            onDismiss={handleDismissProductionLineInformationOverlay}
                        //children={this.headerChildren}
                        />
                        <Overlay.Body>
                            <DangerConfirmationOverlay
                                title={"Are you sure ?"}
                                message={deleteProductionLineConfirmationText}
                                visible={visibleConfirmationOverlay}
                                onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                                onConfirm={() => { this.deleteProductionLine() }}
                            />

                            <Form key={selectedGraphNode["id"]}>
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Six}>
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
                                        <Grid.Column widthXS={Columns.Six}>
                                            <Form.Element label="Parent">
                                                <Label
                                                    size={ComponentSize.Small}
                                                    name={selectedGraphNode["parent"]}
                                                    description="Parent Factory"
                                                    color={InfluxColors.Ocean}
                                                    id={selectedGraphNode["parent"]}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Six}>
                                            <Form.Element
                                                label="Production Line Name"
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
                                        <Grid.Column widthSM={Columns.Six}>
                                            <Form.Element
                                                label="Section"
                                                errorMessage={handleValidation(displayName)}
                                                required={true}
                                            >
                                                <SelectDropdown
                                                    options={sections.map(s => s["name"])}
                                                    selectedOption={section}
                                                    onSelect={(e) => this.setState({ section: e })}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
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
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label={`Machine List (${selectedGraphNode["machines"] ? selectedGraphNode["machines"].length : 0})`}>
                                                {
                                                    selectedGraphNode["machines"] && selectedGraphNode["machines"].length > 0 ?
                                                        <DapperScrollbars
                                                            autoHide={false}
                                                            autoSizeHeight={true}
                                                            style={{ maxHeight: '150px' }}
                                                            className="data-loading--scroll-content"
                                                        >
                                                            {
                                                                selectedGraphNode["machines"].map(machine => {
                                                                    return (
                                                                        <List.Item
                                                                            key={machine["@id"]}
                                                                            value={machine["displayName"]}
                                                                            title="Machine Name"
                                                                            gradient={Gradients.GundamPilot}
                                                                            wrapText={true}
                                                                        >
                                                                            <List.Indicator type="dot" />
                                                                            <div className="selectors--item-value selectors--item__measurement">
                                                                                {machine["displayName"]}
                                                                            </div>
                                                                        </List.Item>
                                                                    )
                                                                })
                                                            }
                                                        </DapperScrollbars>
                                                        : <h6>No machine found</h6>
                                                }
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <div className="dt-information-buttons">
                                            {
                                                ["admin"].includes(localStorage.getItem("userRole")) &&
                                                <ConfirmationButton
                                                    icon={IconFont.Checkmark}
                                                    onConfirm={this.updateProductionLine}
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
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        )
    }
}

export default ProductionLineInformationOverlay;