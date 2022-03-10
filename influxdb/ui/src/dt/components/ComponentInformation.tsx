// Libraries
import React, { PureComponent } from "react";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    DapperScrollbars, List, Gradients, ConfirmationButton,
    IconFont, ComponentColor, Appearance, Button, ButtonType,
    Input, TextArea, FlexBox, FlexDirection,
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";

// Services
import DTService from "src/shared/services/DTService";

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";

// Constants
import { deleteComponentConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    clickPartDetail: () => void
    clickBrands: () => void
    refreshGeneralInfo: () => void
    objectList: object[]
}

type State = {
    displayName: string
    description: string
    visibleConfirmationOverlay: boolean
    selectedObject: string
}

class ComponentInformation extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            displayName: "",
            description: "",
            visibleConfirmationOverlay: false,
            selectedObject: "",
        }
    }

    public async componentDidMount(): Promise<void> {
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
            selectedObject: selectedGraphNode["visual"] !== "" && selectedGraphNode["visual"] !== undefined ? selectedGraphNode["visual"]["id"] : "",
            displayName: selectedGraphNode["displayName"],
            description: selectedGraphNode["description"],
        })
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    private updateComponent = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshGeneralInfo, refreshVisualizePage } = this.props;
        const { displayName, description, selectedObject } = this.state;

        if (displayName.trim() == "") {
            handleChangeNotification("error", "Display name cannot be empty");
            return;
        }

        const payload = {
            "id": selectedGraphNode["@id"],
            "visual": selectedObject,
            displayName,
            description,
        }

        const updatedResult = await DTService.updateComponent(payload);

        if (updatedResult.summary.code === 200) {
            handleChangeNotification("success", updatedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", updatedResult.message.text);
        }
    }

    private deleteComponent = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;

        const payload = {
            "id": selectedGraphNode["id"]
        }

        const deletedResult = await DTService.deleteComponent(payload);

        if (deletedResult.summary.code === 200) {
            handleChangeNotification("success", deletedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", deletedResult.message.text);
        }
    }

    public render() {
        const { selectedGraphNode, clickPartDetail, clickBrands, objectList } = this.props;
        const { displayName, description, visibleConfirmationOverlay, selectedObject } = this.state;

        return (
            <>
                <DangerConfirmationOverlay
                    title={"Are you sure ?"}
                    message={deleteComponentConfirmationText}
                    visible={visibleConfirmationOverlay}
                    onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                    onConfirm={() => { this.deleteComponent() }}
                />

                <Form key={selectedGraphNode["id"]}>
                    <Grid>
                        <Grid.Row>
                            <DapperScrollbars
                                autoHide={false}
                                autoSizeHeight={true} style={{ maxHeight: '450px' }}
                                className="data-loading--scroll-content"
                            >

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
                                    widthSM={Columns.Four}
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
                                <Grid.Column widthSM={Columns.Twelve}>
                                    <Form.Element label="Visual">
                                        {
                                            objectList.length > 0 ?
                                                < DapperScrollbars
                                                    autoHide={false}
                                                    autoSizeHeight={true} style={{ maxHeight: '100px' }}
                                                    className="data-loading--scroll-content"
                                                >
                                                    <List>
                                                        {
                                                            objectList.map((object) => {
                                                                return (
                                                                    <List.Item
                                                                        key={object["name"]}
                                                                        value={object["name"]}
                                                                        onClick={() => {
                                                                            this.setState({
                                                                                selectedObject: object["_id"]["$oid"]
                                                                            })
                                                                        }}
                                                                        title={object["name"]}
                                                                        gradient={Gradients.GundamPilot}
                                                                        wrapText={true}
                                                                        selected={selectedObject === object["_id"]["$oid"] ? true : false}
                                                                    >
                                                                        <FlexBox
                                                                            direction={FlexDirection.Row}
                                                                            margin={ComponentSize.Small}
                                                                        >
                                                                            <List.Indicator type="dot" />
                                                                            <List.Indicator type="checkbox" />
                                                                            <div className="selectors--item-value selectors--item__measurement">
                                                                                {object["name"]}
                                                                            </div>
                                                                        </FlexBox>
                                                                    </List.Item>
                                                                )
                                                            })
                                                        }
                                                    </List>
                                                </DapperScrollbars>
                                                : <h6>No visual record found</h6>
                                        }
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <Form.Element label={`Sensor List (${selectedGraphNode["sensors"].length})`}>
                                        {
                                            selectedGraphNode["sensors"].length > 0 ?
                                                <DapperScrollbars
                                                    autoHide={false}
                                                    autoSizeHeight={true}
                                                    style={{ maxHeight: '100px' }}
                                                    className="data-loading--scroll-content"
                                                >
                                                    {
                                                        selectedGraphNode["sensors"].map((sensor, idx) => {
                                                            return (
                                                                <List.Item
                                                                    key={idx}
                                                                    value={sensor.displayName}
                                                                    title="Sensor Name"
                                                                    gradient={Gradients.GundamPilot}
                                                                    wrapText={true}
                                                                >
                                                                    <List.Indicator type="dot" />
                                                                    <div className="selectors--item-value selectors--item__measurement">
                                                                        {sensor.displayName}
                                                                    </div>
                                                                </List.Item>
                                                            )
                                                        })
                                                    }
                                                </DapperScrollbars>
                                                : <h6>No sensor found</h6>
                                        }
                                    </Form.Element>
                                </Grid.Column>
                            </DapperScrollbars>
                        </Grid.Row>
                        <Grid.Row>
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
                                        onConfirm={this.updateComponent}
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

export default ComponentInformation;