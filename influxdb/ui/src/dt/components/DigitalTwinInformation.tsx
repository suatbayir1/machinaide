// Libraries
import React, { PureComponent } from 'react'

// Components
import {
    Panel, Form, ComponentSize, Grid, Columns, Label, InfluxColors, List, Gradients, Button,
    SpinnerContainer, TechnoSpinner, RemoteDataState, FlexBox, SlideToggle, ButtonType,
    DapperScrollbars, ComponentColor, ConfirmationButton, IconFont, Appearance,
    Notification, SelectDropdown, Input, InputType, ComponentStatus, QuestionMarkTooltip,
} from '@influxdata/clockface'

// Styles
import "src/style/custom.css"

// Services
import DTService from "src/shared/services/DTService";

// Constants
import {
    tipStyle, showAllSensorValues, updateSensor,
} from 'src/shared/constants/tips';

// Overlays
import AddBrandsAndModels from "src/shared/overlays/AddBrandsAndModels";

interface Props {
    selectedGraphNode: object
    generalInfo: string[]
    spinnerLoading: RemoteDataState
    changeShowAllSensorValues: () => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    showAllSensorValues: boolean
}

interface State {
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    sSelectedDataSource: string
    sMinValue: number
    sMaxValue: number
    visibleAddBrandsAndModels: boolean
}

class DigitalTwinInformation extends PureComponent<Props, State> {

    constructor(props) {
        super(props);

        this.state = {
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            sSelectedDataSource: "",
            sMinValue: 0,
            sMaxValue: 0,
            visibleAddBrandsAndModels: false,
        }
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.selectedGraphNode !== this.props.selectedGraphNode) {
            await this.handleChangeSelectedGraphNode(this.props.selectedGraphNode);
        }
    }

    handleChangeSelectedGraphNode = async (node) => {
        if (node["type"] === "Field") {
            this.setState({
                sSelectedDataSource: node["dataSource"],
                sMinValue: node["minValue"],
                sMaxValue: node["maxValue"]
            })
        }
    }

    private get factoryElements(): JSX.Element[] {
        const { selectedGraphNode } = this.props;

        return [
            <Form key={selectedGraphNode["id"]}>
                <Grid>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Factory Name">
                                <Label
                                    size={ComponentSize.Small}
                                    name={selectedGraphNode["factoryName"]}
                                    description="Factory Name"
                                    color={InfluxColors.Ocean}
                                    id={selectedGraphNode["factoryName"]}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label={`Production Line List (${selectedGraphNode["productionLines"].length})`}>
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
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Form>
        ]
    }

    private get productionLineElements(): JSX.Element[] {
        const { selectedGraphNode } = this.props;

        return [
            <Form key={selectedGraphNode["id"]}>
                <Grid>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Production Line">
                                <Label
                                    size={ComponentSize.Small}
                                    name={selectedGraphNode["displayName"]}
                                    description="Production Line Name"
                                    color={InfluxColors.Ocean}
                                    id={selectedGraphNode["displayName"]}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label={`Machine List (${selectedGraphNode["machines"].length})`}>
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
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Form>
        ]
    }

    private get machineElements(): JSX.Element[] {
        const { selectedGraphNode } = this.props;

        return [
            <Form key={selectedGraphNode["id"]}>
                <Grid>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Display Name">
                                <Label
                                    size={ComponentSize.Small}
                                    name={selectedGraphNode["displayName"]}
                                    description="Display Name"
                                    color={InfluxColors.Ocean}
                                    id={selectedGraphNode["displayName"]}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label={`Component List (${this.getComponentCount(selectedGraphNode["contents"])})`}>
                                <DapperScrollbars
                                    autoHide={false}
                                    autoSizeHeight={true}
                                    style={{ maxHeight: '150px' }}
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
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Form>
        ]
    }

    private get componentElements(): JSX.Element[] {
        const { selectedGraphNode } = this.props;

        return [
            <Form key={selectedGraphNode["id"]}>
                <Grid>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Display Name">
                                <Label
                                    size={ComponentSize.Small}
                                    name={selectedGraphNode["displayName"]}
                                    description="Display Name"
                                    color={InfluxColors.Ocean}
                                    id={selectedGraphNode["displayName"]}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Description">
                                <Label
                                    size={ComponentSize.Small}
                                    name={selectedGraphNode["description"]}
                                    description="Description"
                                    color={InfluxColors.Ocean}
                                    id={selectedGraphNode["description"]}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label={`Sensor List (${selectedGraphNode["sensors"].length})`}>
                                <DapperScrollbars
                                    autoHide={false}
                                    autoSizeHeight={true}
                                    style={{ maxHeight: '150px' }}
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
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Form>
        ]
    }

    private get sensorElements(): JSX.Element[] {
        const { selectedGraphNode } = this.props;

        return [
            <Form key={selectedGraphNode["@id"]}>
                <Grid>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Display Name">
                                <Label
                                    size={ComponentSize.Small}
                                    name={selectedGraphNode["displayName"]}
                                    description="Display Name"
                                    color={InfluxColors.Ocean}
                                    id={selectedGraphNode["displayName"]}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                    {/* <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Data Source">
                                <SelectDropdown
                                    buttonStatus={["admin"].includes(localStorage.getItem("userRole")) ? ComponentStatus.Valid : ComponentStatus.Disabled}
                                    options={["sensors_data"]}
                                    selectedOption={this.state.sSelectedDataSource}
                                    onSelect={(e) => this.setState({ sSelectedDataSource: e })}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Six}>
                            <Form.Element label="Min Value">
                                <Input
                                    name="sMinValue"
                                    onChange={this.handleChangeInput}
                                    value={this.state.sMinValue}
                                    type={InputType.Number}
                                    status={["admin"].includes(localStorage.getItem("userRole")) ? ComponentStatus.Default : ComponentStatus.Disabled}
                                />
                            </Form.Element>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Six}>
                            <Form.Element label="Max Value">
                                <Input
                                    name="sMaxValue"
                                    onChange={this.handleChangeInput}
                                    value={this.state.sMaxValue}
                                    type={InputType.Number}
                                    status={["admin"].includes(localStorage.getItem("userRole")) ? ComponentStatus.Default : ComponentStatus.Disabled}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row> */}
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Data Type">
                                {
                                    selectedGraphNode["@type"].map(type => {
                                        return (
                                            <List.Item
                                                key={type}
                                                value={type}
                                                title="Type"
                                                gradient={Gradients.GundamPilot}
                                                wrapText={true}
                                            >
                                                <List.Indicator type="dot" />
                                                <div className="selectors--item-value selectors--item__measurement">
                                                    {type}
                                                </div>
                                            </List.Item>
                                        )
                                    })
                                }
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Unit">
                                <Label
                                    size={ComponentSize.Small}
                                    name={selectedGraphNode["unit"]}
                                    description="Unit"
                                    color={InfluxColors.Ocean}
                                    id={selectedGraphNode["unit"]}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Form>
        ]
    }

    private get fieldElements(): JSX.Element[] {
        const { selectedGraphNode } = this.props;

        return [
            <Form key={selectedGraphNode["name"]}>
                <Grid>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Name">
                                <Label
                                    size={ComponentSize.Small}
                                    name={selectedGraphNode["name"]}
                                    description="Name"
                                    color={InfluxColors.Ocean}
                                    id={selectedGraphNode["name"]}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
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
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Data Source">
                                <SelectDropdown
                                    buttonStatus={["admin"].includes(localStorage.getItem("userRole")) ? ComponentStatus.Valid : ComponentStatus.Disabled}
                                    options={["sensors_data"]}
                                    selectedOption={this.state.sSelectedDataSource}
                                    onSelect={(e) => this.setState({ sSelectedDataSource: e })}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Six}>
                            <Form.Element label="Min Value">
                                <Input
                                    name="sMinValue"
                                    onChange={this.handleChangeInput}
                                    value={this.state.sMinValue}
                                    type={InputType.Number}
                                    status={["admin"].includes(localStorage.getItem("userRole")) ? ComponentStatus.Default : ComponentStatus.Disabled}
                                />
                            </Form.Element>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Six}>
                            <Form.Element label="Max Value">
                                <Input
                                    name="sMaxValue"
                                    onChange={this.handleChangeInput}
                                    value={this.state.sMaxValue}
                                    type={InputType.Number}
                                    status={["admin"].includes(localStorage.getItem("userRole")) ? ComponentStatus.Default : ComponentStatus.Disabled}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <Form.Element label="Unit">
                                <Label
                                    size={ComponentSize.Small}
                                    name={selectedGraphNode["unit"]}
                                    description="Unit"
                                    color={InfluxColors.Ocean}
                                    id={selectedGraphNode["unit"]}
                                />
                            </Form.Element>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Form>
        ]
    }

    getComponentCount = (content) => {
        let components = content.filter(c => c?.["@type"] === "Component");
        return components.length;
    }

    handleDeleteNode = async () => {
        const payload = {
            "type": this.props.selectedGraphNode["type"],
            "name": this.props.selectedGraphNode["name"]
        }

        const result = await DTService.deleteDT(payload);

        if (result.data.message.text === "component_deleted_successfully") {
            this.handleChangeNotification("success", "Component deleted successfully");
        } else if (result.data.message.text === "sensor_deleted_successfully") {
            this.handleChangeNotification("success", "Sensor deleted successfully");
        } else if (result.data.message.text === "machine_deleted_successfully") {
            this.handleChangeNotification("success", "Machine deleted successfully");
        }

        this.props.refreshGraph();
        this.props.refreshVisualizePage();
    }

    handleUpdateSensor = async () => {
        const payload = {
            "name": this.props.selectedGraphNode["name"],
            "dataSource": this.state.sSelectedDataSource,
            "minValue": Number(this.state.sMinValue),
            "maxValue": Number(this.state.sMaxValue)
        }

        const result = await DTService.updateSensor(payload);

        if (result.data.summary.code === 200) {
            this.handleChangeNotification("success", "Sensor updated successfully");
            this.props.refreshGraph();
            this.props.refreshVisualizePage();
        } else {
            this.handleChangeNotification("error", result.data.message.text);
        }
    }

    handleChangeNotification = (type, message) => {
        this.setState({
            notificationVisible: true,
            notificationType: type,
            notificationMessage: message,
        })
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    public render() {
        const { selectedGraphNode, generalInfo, spinnerLoading } = this.props;
        const { visibleAddBrandsAndModels } = this.state;

        return (
            <>
                <AddBrandsAndModels
                    visible={visibleAddBrandsAndModels}
                    onDismiss={() => { this.setState({ visibleAddBrandsAndModels: false }) }}
                    selectedPart={selectedGraphNode}
                />

                <Panel>
                    <Notification
                        key={"id"}
                        id={"id"}
                        icon={
                            this.state.notificationType === 'success'
                                ? IconFont.Checkmark
                                : IconFont.Alerts
                        }
                        duration={5000}
                        size={ComponentSize.Small}
                        visible={this.state.notificationVisible}
                        gradient={
                            this.state.notificationType === 'success'
                                ? Gradients.HotelBreakfast
                                : Gradients.DangerDark
                        }
                        onTimeout={() => this.setState({ notificationVisible: false })}
                        onDismiss={() => this.setState({ notificationVisible: false })}
                    >
                        <span className="notification--message">{this.state.notificationMessage}</span>
                    </Notification>

                    <SpinnerContainer loading={spinnerLoading} spinnerComponent={<TechnoSpinner />} />
                    <Panel.Header size={ComponentSize.ExtraSmall}>
                        <Grid>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <Form.Element label="Factory">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={generalInfo["factory"]}
                                            description="Factory Name"
                                            color={InfluxColors.Viridian}
                                            id={generalInfo["factoryName"]}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                            </Grid.Row>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Four}>
                                    <Form.Element label="Machine Count">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={generalInfo["machineCount"]}
                                            description="Machine Count"
                                            color={InfluxColors.Viridian}
                                            id={generalInfo["machineCount"]}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Four}>
                                    <Form.Element label="Component Count">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={generalInfo["componentCount"]}
                                            description="Component Count"
                                            color={InfluxColors.Viridian}
                                            id={generalInfo["componentCount"]}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Four}>
                                    <Form.Element label="Sensor Count">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={generalInfo["sensorCount"]}
                                            description="Sensor Count"
                                            color={InfluxColors.Viridian}
                                            id={generalInfo["sensorCount"]}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                            </Grid.Row>

                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <FlexBox margin={ComponentSize.Large}>
                                        <h5>Show All Sensor Values</h5>
                                        <SlideToggle
                                            active={this.props.showAllSensorValues}
                                            size={ComponentSize.Small}
                                            color={ComponentColor.Success}
                                            onChange={this.props.changeShowAllSensorValues}
                                        />
                                        <QuestionMarkTooltip
                                            diameter={20}
                                            tooltipStyle={{ width: '400px' }}
                                            color={ComponentColor.Secondary}
                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                <div style={{ color: InfluxColors.Star }}>{"Show all sensor values:"}
                                                    <hr style={tipStyle} />
                                                </div>
                                                {showAllSensorValues}
                                            </div>}
                                        />
                                    </FlexBox>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Panel.Header>
                    <Panel.Body size={ComponentSize.ExtraSmall}>
                        {
                            this.props.selectedGraphNode["type"] === "Factory" && this.factoryElements
                        }

                        {
                            this.props.selectedGraphNode["type"] === "ProductionLine" && this.productionLineElements
                        }

                        {
                            this.props.selectedGraphNode["type"] === "Machine" && this.machineElements
                        }

                        {
                            this.props.selectedGraphNode["type"] === "Component" && this.componentElements
                        }

                        {
                            this.props.selectedGraphNode["type"] === "Sensor" && this.sensorElements
                        }

                        {
                            this.props.selectedGraphNode["type"] === "Field" && this.fieldElements
                        }

                        <Grid.Row>
                            <FlexBox margin={ComponentSize.Medium} style={{ float: 'right' }}>
                                {
                                    Object.keys(selectedGraphNode).length !== 0 &&
                                    selectedGraphNode["type"] === "Field" &&
                                    <>
                                        <QuestionMarkTooltip
                                            diameter={20}
                                            tooltipStyle={{ width: '400px' }}
                                            color={ComponentColor.Secondary}
                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                <div style={{ color: InfluxColors.Star }}>{"Update sensor:"}
                                                    <hr style={tipStyle} />
                                                </div>
                                                {updateSensor}
                                            </div>}
                                        />
                                        <div style={{ float: 'right' }}>
                                            {
                                                ["admin"].includes(localStorage.getItem("userRole")) &&
                                                <ConfirmationButton
                                                    icon={IconFont.Checkmark}
                                                    onConfirm={this.handleUpdateSensor}
                                                    text={"Update"}
                                                    popoverColor={ComponentColor.Success}
                                                    popoverAppearance={Appearance.Outline}
                                                    color={ComponentColor.Success}
                                                    confirmationLabel="Do you want to update ?"
                                                    confirmationButtonColor={ComponentColor.Success}
                                                    confirmationButtonText="Yes"
                                                />
                                            }
                                        </div>
                                    </>
                                }

                                {
                                    Object.keys(selectedGraphNode).length !== 0 &&
                                    ["Component", "Sensor"].includes(selectedGraphNode["type"]) &&
                                    <div style={{ float: 'right' }}>
                                        {
                                            <Button
                                                text="Brands & Models"
                                                icon={IconFont.Plus}
                                                onClick={() => { this.setState({ visibleAddBrandsAndModels: true }) }}
                                                type={ButtonType.Button}
                                                color={ComponentColor.Secondary}
                                            />
                                        }
                                    </div>
                                }

                                {
                                    Object.keys(selectedGraphNode).length !== 0 &&
                                    selectedGraphNode["type"] !== "Factory" &&
                                    <div style={{ float: 'right' }}>
                                        {
                                            ["admin"].includes(localStorage.getItem("userRole")) &&
                                            <ConfirmationButton
                                                icon={IconFont.Remove}
                                                onConfirm={this.handleDeleteNode}
                                                text={"Delete"}
                                                popoverColor={ComponentColor.Danger}
                                                popoverAppearance={Appearance.Outline}
                                                color={ComponentColor.Danger}
                                                confirmationLabel="Do you want to delete ?"
                                                confirmationButtonColor={ComponentColor.Success}
                                                confirmationButtonText="Yes"
                                            />
                                        }
                                    </div>
                                }
                            </FlexBox>

                        </Grid.Row>
                    </Panel.Body>
                </Panel>
            </>
        )
    }
}

export default DigitalTwinInformation