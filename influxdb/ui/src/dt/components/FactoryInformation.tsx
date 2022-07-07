// Libraries
import React, { PureComponent } from "react";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    SelectDropdown, ComponentStatus, DapperScrollbars, List,
    Gradients, ConfirmationButton, IconFont, ComponentColor,
    Appearance, Input, TextArea, TextBlock
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";

// Services
import DTService from "src/shared/services/DTService";

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";

// Constants
import { bucketConfirmationText, deleteFactoryConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    bucketNames: string[]
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    refreshGeneralInfo: () => void
}

type State = {
    factoryName: string
    location: string
    bucket: string
    description: string
    visibleConfirmationOverlay: boolean
    operationType: "delete" | "update"
}

class FactoryInformation extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            factoryName: "",
            location: "",
            bucket: "",
            description: "",
            visibleConfirmationOverlay: false,
            operationType: "update",
        }
    }

    public componentDidMount(): void {
        this.setForm();
    }

    public async componentDidUpdate(prevProps: Readonly<Props>): Promise<void> {
        if (prevProps.selectedGraphNode !== this.props.selectedGraphNode) {
            this.setForm();
        }
    }

    private setForm = (): void => {
        const { selectedGraphNode } = this.props;

        this.setState({
            factoryName: selectedGraphNode["factoryName"],
            location: selectedGraphNode["location"],
            bucket: selectedGraphNode["bucket"],
            description: selectedGraphNode["description"],
        })
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    private deleteFactory = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;

        const payload = {
            "id": selectedGraphNode["id"]
        }

        const deletedResult = await DTService.deleteFactory(payload);

        if (deletedResult.summary.code === 200) {
            handleChangeNotification("success", deletedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", deletedResult.message.text);
        }
    }

    private updateFactoryConfirmed = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;
        const { factoryName, location, bucket, description } = this.state;

        const payload = {
            "id": selectedGraphNode["id"],
            factoryName,
            location,
            bucket,
            description
        }

        const updatedResult = await DTService.updateFactory(payload);

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

    private updateFactory = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification } = this.props;
        const { factoryName, location, bucket } = this.state;

        if (factoryName.trim() === "" || location.trim() === "") {
            handleChangeNotification("error", "Factory name and Location cannot be empty");
            return;
        }

        if (bucket != selectedGraphNode["bucket"]) {
            this.setState({ visibleConfirmationOverlay: true })
        } else {
            this.updateFactoryConfirmed();
        }
    }

    public render(): JSX.Element {
        const { selectedGraphNode, bucketNames } = this.props;
        const { factoryName, location, bucket, description, visibleConfirmationOverlay, operationType } = this.state;

        return (
            <>
                <DangerConfirmationOverlay
                    title={"Are you sure ?"}
                    message={operationType == "update" ? bucketConfirmationText : deleteFactoryConfirmationText}
                    visible={visibleConfirmationOverlay}
                    onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                    onConfirm={() => { operationType == "update" ? this.updateFactoryConfirmed() : this.deleteFactory() }}
                />

                <Form>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Six}
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
                                widthSM={Columns.Six}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element
                                    label="Factory Name"
                                    errorMessage={handleValidation(factoryName)}
                                    required={true}
                                >
                                    {/* <Input
                                        name="factoryName"
                                        placeholder="Factory Name.."
                                        onChange={this.handleChangeInput}
                                        value={factoryName}
                                    /> */}
                                    <Label
                                        size={ComponentSize.Small}
                                        name={factoryName}
                                        description="Factory Name"
                                        color={InfluxColors.Ocean}
                                        id={factoryName}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Six}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element
                                    label="Location"
                                    errorMessage={handleValidation(location)}
                                    required={true}
                                >
                                    {/* <Input
                                        name="location"
                                        placeholder="Location.."
                                        onChange={this.handleChangeInput}
                                        value={location}
                                    /> */}
                                    {/* <Label
                                        size={ComponentSize.Small}
                                        name={location}
                                        description="Location"
                                        color={InfluxColors.Ocean}
                                        id={location}
                                    /> */}
                                    <TextArea
                                        name="location"
                                        value={location}
                                        placeholder="Location.."
                                        rows={2}
                                        status={ComponentStatus.Disabled}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Six}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Bucket">
                                    {/* <SelectDropdown
                                        buttonStatus={["admin"].includes(localStorage.getItem("userRole"))
                                            ? ComponentStatus.Valid
                                            : ComponentStatus.Disabled
                                        }
                                        options={bucketNames}
                                        selectedOption={bucket}
                                        onSelect={(e) => this.setState({ bucket: e })}
                                    /> */}
                                    <Label
                                        size={ComponentSize.Small}
                                        name={bucket}
                                        description="Bucket"
                                        color={InfluxColors.Ocean}
                                        id={bucket}
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
                                        rows={4}
                                        status={ComponentStatus.Disabled}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Twelve}>
                                <Form.Element label={`Production Line List (${selectedGraphNode["productionLines"].length})`}>
                                    {
                                        selectedGraphNode["productionLines"].length > 0 ?
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true}
                                                style={{ maxHeight: '150px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                {
                                                    selectedGraphNode["productionLines"].map(pl => {
                                                        return (
                                                            <List.Item
                                                                key={pl["@id"]}
                                                                value={pl["displayName"]}
                                                                title="Production Line Name"
                                                                gradient={Gradients.GundamPilot}
                                                                wrapText={true}
                                                            >
                                                                <List.Indicator type="dot" />
                                                                <div className="selectors--item-value selectors--item__measurement">
                                                                    {pl["displayName"]}
                                                                </div>
                                                            </List.Item>
                                                        )
                                                    })
                                                }
                                            </DapperScrollbars>
                                            : <h6>No production line found</h6>
                                    }
                                </Form.Element>
                            </Grid.Column>
                        </Grid.Row>
                        {/* <Grid.Row>
                            <div className="dt-information-buttons">
                                {
                                    ["admin"].includes(localStorage.getItem("userRole")) &&
                                    <ConfirmationButton
                                        icon={IconFont.Checkmark}
                                        onConfirm={() => {
                                            this.setState({ operationType: "update" },
                                                () => this.updateFactory())
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

export default FactoryInformation;