// Libraries
import React, { PureComponent } from "react";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    DapperScrollbars, List, Gradients, ConfirmationButton,
    IconFont, ComponentColor, Appearance, Button, ButtonType,
    SelectDropdown, Input, TextArea, FlexBox, FlexDirection, Overlay
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";

// Services
import DTService from "src/shared/services/DTService";

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";

// Constants
import { deleteSensorConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    refreshGeneralInfo: () => void
    clickPartDetail: () => void
    clickBrands: () => void
    objectList: object[]
    isSensorInformationOverlayVisible: boolean
    handleDismissSensorInformationOverlay: () => void
}

type State = {
    typeList: string[]
    type: string
    units: string[]
    unit: string
    statusList: string[]
    status: string
    displayName: string
    description: string
    visibleConfirmationOverlay: boolean
    selectedObject: string
}

class SensorInformationOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            typeList: ['Temperature', 'Vibration', 'Pressure', 'AirFlow'],
            type: "",
            units: ['real', 'bit', 'double', 'float', 'integer'],
            unit: "",
            statusList: ["enable", "disable"],
            status: "",
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
            unit: selectedGraphNode["unit"],
            status: selectedGraphNode["status"],
            type: selectedGraphNode["@type"][1],
            displayName: selectedGraphNode["displayName"],
            description: selectedGraphNode["description"],
            selectedObject: selectedGraphNode["visual"] !== "" && selectedGraphNode["visual"] !== undefined ? selectedGraphNode["visual"]["id"] : "",
        })
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    private updateSensor = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshGeneralInfo, refreshVisualizePage } = this.props;
        const { unit, status, type, displayName, description, selectedObject } = this.state;

        if (displayName.trim() == "") {
            handleChangeNotification("error", "Display name cannot be empty");
            return;
        }

        const payload = {
            "id": selectedGraphNode["@id"],
            unit,
            status,
            "@type": ["Telemetry", type],
            displayName,
            description,
            "visual": selectedObject,
        }

        const updatedResult = await DTService.updateSensor(payload);

        if (updatedResult.summary.code === 200) {
            this.props.handleDismissSensorInformationOverlay()
            handleChangeNotification("success", updatedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", updatedResult.message.text);
        }
    }

    private deleteSensor = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;

        const payload = {
            "id": selectedGraphNode["@id"]
        }

        const deletedResult = await DTService.deleteSensor(payload);

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
        const { selectedGraphNode, clickPartDetail, clickBrands, objectList, isSensorInformationOverlayVisible, handleDismissSensorInformationOverlay } = this.props;
        const { units, unit, statusList, status, displayName, description, typeList,
            type, visibleConfirmationOverlay, selectedObject
        } = this.state;

        return (
            <>
                <Overlay visible={isSensorInformationOverlayVisible}>
                    <Overlay.Container maxWidth={750}>
                        <Overlay.Header
                            title="Edit Sensor"
                            onDismiss={handleDismissSensorInformationOverlay}
                            //children={this.headerChildren}
                        />
                        <Overlay.Body>
                            <DangerConfirmationOverlay
                                title={"Are you sure ?"}
                                message={deleteSensorConfirmationText}
                                visible={visibleConfirmationOverlay}
                                onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                                onConfirm={() => { this.deleteSensor() }}
                            />

                            <Form key={selectedGraphNode["@id"]}>
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
                                                    description="Parent"
                                                    color={InfluxColors.Ocean}
                                                    id={selectedGraphNode["parent"]}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Three}>
                                            <Form.Element
                                                label="Unit"
                                            >
                                                <SelectDropdown
                                                    options={units}
                                                    selectedOption={unit}
                                                    onSelect={(e) => this.setState({ unit: e })}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                        <Grid.Column widthXS={Columns.Three}>
                                            <Form.Element
                                                label="Status"
                                            >
                                                <SelectDropdown
                                                    options={statusList}
                                                    selectedOption={status}
                                                    onSelect={(e) => this.setState({ status: e })}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                        <Grid.Column widthXS={Columns.Six}>
                                            <Form.Element label="Data Type">
                                                <SelectDropdown
                                                    options={typeList}
                                                    selectedOption={type}
                                                    onSelect={(e) => this.setState({ type: e })}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
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
                                    </Grid.Row>        
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label={`Field List (${selectedGraphNode["fields"] ? selectedGraphNode["fields"].length : 0})`}>
                                                {
                                                    selectedGraphNode["fields"] && selectedGraphNode["fields"].length > 0 ?
                                                        <DapperScrollbars
                                                            autoHide={false}
                                                            autoSizeHeight={true}
                                                            style={{ maxHeight: '100px' }}
                                                            className="data-loading--scroll-content"
                                                        >
                                                            {
                                                                selectedGraphNode["fields"].map((field, idx) => {
                                                                    return (
                                                                        <List.Item
                                                                            key={idx}
                                                                            value={field.name}
                                                                            title="Field Name"
                                                                            gradient={Gradients.GundamPilot}
                                                                            wrapText={true}
                                                                        >
                                                                            <List.Indicator type="dot" />
                                                                            <div className="selectors--item-value selectors--item__measurement">
                                                                                {field.name}
                                                                            </div>
                                                                        </List.Item>
                                                                    )
                                                                })
                                                            }
                                                        </DapperScrollbars>
                                                        : <h6>No field found</h6>
                                                }
                                            </Form.Element>
                                        </Grid.Column>
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
                                                    onConfirm={this.updateSensor}
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
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        )
    }
}

export default SensorInformationOverlay;