// Libraries
import React, { PureComponent } from 'react'
import ReactHover, { Trigger, Hover } from "react-hover";

// Components
import {
    Form, Input, Button, ButtonType, ComponentColor, Overlay,
    IconFont, Grid, Columns, SelectDropdown, TextArea, InfluxColors,
    DapperScrollbars, ComponentSize, Table, BorderType, List,
    FlexDirection, Gradients, FlexBox, InputType, QuestionMarkTooltip,
} from '@influxdata/clockface'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import { TabbedPageTab } from 'src/shared/tabbedPage/TabbedPageTabs'

// Utilities
import { BACKEND } from "src/config";

// Services
import DTService from 'src/shared/services/DTService';

// Constants
import {
    tipStyle, addNewNodeHeader, addNewMachine, addNewComponent, addNewSensor,
    sensorType, sensorUnit, sensorDataSource, addFieldToSensor,
} from 'src/shared/constants/tips';

interface Props {
    visibleAddNodeOverlay: boolean
    handleDismissAddNode: () => void
    refreshGraph: () => void
    refreshGeneralInfo: () => void
    refreshVisualizePage: () => void
    handleChangeNotification: (type, message) => void
}

interface State {
    productionLineList: string[]
    machineList: string[]
    componentList: string[]
    activeTab: string
    productionLine: string
    mMachineName: string
    mComponentName: string
    mDescription: string
    sAddedFieldList: object[]
    cParent: string
    cComponentName: string
    cDescription: string
    cSensorName: string
    cSensorType: string
    cSensorUnit: string
    cSensorDescription: string
    cComponentObject: object
    sParent: string
    sSensorName: string
    sSensorType: string
    sSensorUnit: string
    sDescription: string
    sSensorTypeList: string[]
    sSensorUnitList: string[]
    sSelectedObject: object
    sDataSourceList: string[]
    sSelectedDataSource: string
    sMinValue: number
    sMaxValue: number
    objectList: object[]
    sFieldName: string
}

class AddNewNodeOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            productionLineList: [],
            machineList: [],
            componentList: [],
            activeTab: "machine",
            productionLine: "",
            mMachineName: "",
            mComponentName: "",
            mDescription: "",
            cParent: "",
            cComponentName: "",
            cDescription: "",
            cSensorName: "",
            cSensorType: "Temperature",
            cSensorUnit: "real",
            cSensorDescription: "",
            cComponentObject: {},
            sParent: "",
            sSensorName: "",
            sSensorType: "Temperature",
            sSensorUnit: "real",
            sDescription: "",
            sSensorTypeList: ['Temperature', 'Vibration', 'Pressure', 'AirFlow'],
            sSensorUnitList: ['real', 'bit', 'double', 'float', 'integer'],
            sSelectedObject: {},
            sDataSourceList: ["sensors_data"],
            sSelectedDataSource: "sensors_data",
            sMinValue: 0,
            sMaxValue: 0,
            objectList: [],
            sFieldName: "",
            sAddedFieldList: [],
        };
    }

    async componentDidMount(): Promise<void> {
        await this.setGeneralInfo();
        this.getObjectList();
    }

    getObjectList = async () => {
        const url = `${BACKEND.API_URL}object/getObjectPool`;

        const request = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            }
        })

        try {
            const response = await request;
            const res = await response.json();

            if (res.data.success !== true) return;
            const result = JSON.parse(res.data.data);

            this.setState({
                objectList: result
            })
        } catch (err) {
            console.error(err);
        }
    }

    clearForm = () => {
        this.setState({
            activeTab: "machine",
            productionLine: "",
            mMachineName: "",
            mComponentName: "",
            mDescription: "",
            cParent: "",
            cComponentName: "",
            cDescription: "",
            cSensorName: "",
            cSensorType: "Temperature",
            cSensorUnit: "real",
            cSensorDescription: "",
            sParent: "",
            sSensorName: "",
            sSensorType: "Temperature",
            sSensorUnit: "real",
            sDescription: "",
        })
    }

    setGeneralInfo = async () => {
        let generalInfo = await DTService.getGeneralInfo();

        this.setState({
            productionLineList: generalInfo.productionLineList,
            machineList: generalInfo.machineList,
            componentList: generalInfo.componentList,
            cParent: generalInfo.machineList[0],
            sParent: generalInfo.componentList[0],
            productionLine: generalInfo.productionLineList[0],
        })
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    addFieldToSensor = () => {
        if (this.handleValidation(this.state.sFieldName) !== null) {
            this.props.handleChangeNotification('error', 'Field Name cannot be empty');
            return;
        }

        let isAlreadyExistsField = false;
        this.state.sAddedFieldList.forEach(item => {
            if (item['name'] === this.state.sFieldName) {
                this.props.handleChangeNotification('error', 'This field has already been added');
                isAlreadyExistsField = true;
                return;
            }
        })

        if (isAlreadyExistsField) {
            return;
        }


        const field = {
            "name": this.state.sFieldName,
            "type": "Field",
            "parent": this.state.sSensorName,
            "minValue": this.state.sMinValue,
            "maxValue": this.state.sMaxValue,
            "unit": this.state.sSensorUnit,
            "dataSource": this.state.sSelectedDataSource
        }


        this.setState({
            sAddedFieldList: [...this.state.sAddedFieldList, field]
        });
    }

    removeFieldFromSensor = (field) => {
        const tempFieldList = this.state.sAddedFieldList.filter(item =>
            item['name'] !== field['name']
        )
        this.setState({
            sAddedFieldList: tempFieldList,
        })
    }

    private get machineElements(): JSX.Element[] {
        return [
            <Grid key="machine">
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <FlexBox margin={ComponentSize.Small}>
                            <Form.Element label="Production Line">
                                <SelectDropdown
                                    options={this.state.productionLineList}
                                    selectedOption={this.state.productionLine}
                                    onSelect={(e) => this.setState({ productionLine: e })}
                                />
                            </Form.Element>
                            <QuestionMarkTooltip
                                style={{ marginTop: '5px' }}
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"How to add new machine:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {addNewMachine}
                                </div>}
                            />
                        </FlexBox>
                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element
                            label="Machine Name"
                            errorMessage={this.handleValidation(this.state.mMachineName)}
                            required={true}
                        >
                            <Input
                                name="mMachineName"
                                placeholder="Machine name.."
                                onChange={this.handleChangeInput}
                                value={this.state.mMachineName}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element label="Description">
                            <TextArea
                                name="mDescription"
                                value={this.state.mDescription}
                                placeholder="Description.."
                                onChange={this.handleChangeInput}
                                rows={5}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
            </Grid>

        ]
    }

    private get componentElements(): JSX.Element[] {
        return [
            <Grid key="component">
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <FlexBox margin={ComponentSize.Small}>
                            <Form.Element label="Parent">
                                <SelectDropdown
                                    options={this.state.machineList}
                                    selectedOption={this.state.cParent}
                                    onSelect={(e) => this.setState({ cParent: e })}
                                />
                            </Form.Element>
                            <QuestionMarkTooltip
                                style={{ marginTop: '7px' }}
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"How to add new component:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {addNewComponent}
                                </div>}
                            />
                        </FlexBox>
                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element
                            label="Component Name"
                            errorMessage={this.handleValidation(this.state.cComponentName)}
                            required={true}
                        >
                            <Input
                                name="cComponentName"
                                placeholder="Component name.."
                                onChange={this.handleChangeInput}
                                value={this.state.cComponentName}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element label="Description">
                            <TextArea
                                name="cDescription"
                                value={this.state.cDescription}
                                placeholder="Description.."
                                onChange={this.handleChangeInput}
                                rows={5}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element label="Visual">
                            <DapperScrollbars
                                autoHide={false}
                                autoSizeHeight={true} style={{ maxHeight: '150px' }}
                                className="data-loading--scroll-content"
                            >
                                <List>
                                    {
                                        this.state.objectList.map((object) => {
                                            return (
                                                <List.Item
                                                    key={object["name"]}
                                                    value={object["name"]}
                                                    onClick={() => this.handleClickObject('component', object)}
                                                    title={object["name"]}
                                                    gradient={Gradients.GundamPilot}
                                                    wrapText={true}
                                                    selected={this.state.cComponentObject["name"] === object["name"] ? true : false}
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
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        ]
    }

    private get sensorElements(): JSX.Element[] {
        return [
            <Grid key="sensor">
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <FlexBox margin={ComponentSize.Small}>
                            <Form.Element label="Parent">
                                <SelectDropdown
                                    options={this.state.componentList}
                                    selectedOption={this.state.sParent}
                                    onSelect={(e) => this.setState({ sParent: e })}
                                />
                            </Form.Element>

                            <QuestionMarkTooltip
                                style={{ marginTop: '7px' }}
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"How to add new sensor:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {addNewSensor}
                                </div>}
                            />
                        </FlexBox>

                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element
                            label="Sensor Name"
                            errorMessage={this.handleValidation(this.state.sSensorName)}
                            required={true}
                        >
                            <Input
                                name="sSensorName"
                                placeholder="Sensor name.."
                                onChange={this.handleChangeInput}
                                value={this.state.sSensorName}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Four}>
                        <FlexBox margin={ComponentSize.Small}>
                            <Form.Element label="Type">
                                <SelectDropdown
                                    options={this.state.sSensorTypeList}
                                    selectedOption={this.state.sSensorType}
                                    onSelect={(e) => this.setState({ sSensorType: e })}
                                />
                            </Form.Element>

                            <QuestionMarkTooltip
                                style={{ marginTop: '7px' }}
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"Sensor measurement type:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {sensorType}
                                </div>}
                            />
                        </FlexBox>
                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Four}>
                        <FlexBox margin={ComponentSize.Small}>
                            <Form.Element label="Unit">
                                <SelectDropdown
                                    options={this.state.sSensorUnitList}
                                    selectedOption={this.state.sSensorUnit}
                                    onSelect={(e) => this.setState({ sSensorUnit: e })}
                                />
                            </Form.Element>

                            <QuestionMarkTooltip
                                style={{ marginTop: '7px' }}
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"Sensor data type:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {sensorUnit}
                                </div>}
                            />
                        </FlexBox>
                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Four}>
                        <FlexBox margin={ComponentSize.Small}>
                            <Form.Element label="Data Source">
                                <SelectDropdown
                                    options={this.state.sDataSourceList}
                                    selectedOption={this.state.sSelectedDataSource}
                                    onSelect={(e) => this.setState({ sSelectedDataSource: e })}
                                />
                            </Form.Element>

                            <QuestionMarkTooltip
                                style={{ marginTop: '7px' }}
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"Sensor data source:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {sensorDataSource}
                                </div>}
                            />
                        </FlexBox>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element label="Visual">
                            <DapperScrollbars
                                autoHide={false}
                                autoSizeHeight={true} style={{ maxHeight: '150px' }}
                                className="data-loading--scroll-content"
                            >
                                <List>
                                    {
                                        this.state.objectList.map((object) => {
                                            return (
                                                <List.Item
                                                    key={object["name"]}
                                                    value={object["name"]}
                                                    onClick={() => this.handleClickObject('sensor', object)}
                                                    title={object["name"]}
                                                    gradient={Gradients.GundamPilot}
                                                    wrapText={true}
                                                    selected={this.state.sSelectedObject["name"] === object["name"] ? true : false}
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
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element
                            label="Description"
                        >
                            <TextArea
                                name="sDescription"
                                value={this.state.sDescription}
                                placeholder="Description.."
                                onChange={this.handleChangeInput}
                                rows={3}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    <Grid.Column widthSM={Columns.Four}>
                        <FlexBox margin={ComponentSize.Small}>
                            <Form.Element label="">
                                <Button
                                    text="Add Field"
                                    icon={IconFont.Plus}
                                    onClick={this.addFieldToSensor}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Primary}
                                />
                            </Form.Element>

                            <QuestionMarkTooltip
                                style={{ marginBottom: '8px' }}
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"Add field to sensor:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {addFieldToSensor}
                                </div>}
                            />
                        </FlexBox>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element
                            label="Field Name"
                            errorMessage={this.handleValidation(this.state.sFieldName)}
                            required={true}
                        >
                            <Input
                                name="sFieldName"
                                placeholder="Field name.."
                                onChange={this.handleChangeInput}
                                value={this.state.sFieldName}
                            />
                        </Form.Element>
                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Three}>
                        <Form.Element label="Min Value">
                            <Input
                                name="sMinValue"
                                placeholder="0"
                                onChange={this.handleChangeInput}
                                value={this.state.sMinValue}
                                type={InputType.Number}
                            />
                        </Form.Element>
                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Three}>
                        <Form.Element label="Max Value">
                            <Input
                                name="sMaxValue"
                                placeholder="0"
                                onChange={this.handleChangeInput}
                                value={this.state.sMaxValue}
                                type={InputType.Number}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    {
                        this.state.sAddedFieldList.length > 0 ? (
                            <DapperScrollbars
                                autoHide={false}
                                autoSizeHeight={true}
                                style={{ maxHeight: '150px' }}
                                className="data-loading--scroll-content"
                            >
                                <Table
                                    borders={BorderType.Vertical}
                                    fontSize={ComponentSize.ExtraSmall}
                                    cellPadding={ComponentSize.ExtraSmall}
                                >
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>Field Name</Table.HeaderCell>
                                            <Table.HeaderCell>Min Value</Table.HeaderCell>
                                            <Table.HeaderCell>Max Value</Table.HeaderCell>
                                            <Table.HeaderCell></Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {
                                            this.state.sAddedFieldList.map((field, index) => (
                                                <Table.Row key={index}>
                                                    <Table.Cell>{field["name"]}</Table.Cell>
                                                    <Table.Cell>{field["minValue"]}</Table.Cell>
                                                    <Table.Cell>{field["maxValue"]}</Table.Cell>
                                                    <Table.Cell>
                                                        <Button
                                                            size={ComponentSize.ExtraSmall}
                                                            icon={IconFont.Remove}
                                                            color={ComponentColor.Danger}
                                                            type={ButtonType.Submit}
                                                            onClick={() => this.removeFieldFromSensor(field)}
                                                        />
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))
                                        }
                                    </Table.Body>
                                </Table>
                            </DapperScrollbars>
                        ) : (
                            null
                        )
                    }
                    <br />
                </Grid.Row>
            </Grid>
        ]
    }

    handleClickObject = (type, object) => {
        if (type === 'sensor') {
            this.setState({
                sSelectedObject: object
            })
        } else if (type === 'component') {
            this.setState({
                cComponentObject: object
            })
        }

    }

    handleValidation = (value: string): string | null => {
        if (value.trim() === '') {
            return 'This field cannot be empty'
        }

        if (value.length >= 51) {
            return 'Must be 50 characters or less'
        }
        return null
    }

    checkIfEveryThingRight = () => {
        let isCorrect = true;
        switch (this.state.activeTab) {
            case 'machine':
                if (this.handleValidation(this.state.mMachineName) !== null) {
                    isCorrect = false;
                }
                break;
            case 'component':
                if (this.handleValidation(this.state.cComponentName) !== null) {
                    isCorrect = false;
                }
                break;
            case 'sensor':
                if (this.handleValidation(this.state.sSensorName) !== null) {
                    isCorrect = false;
                }
                if (this.state.sAddedFieldList.length < 1) {
                    isCorrect = false;
                }
                break;
        }
        return isCorrect;
    }

    handleSaveAddNode = async () => {
        let isFormRight = await this.checkIfEveryThingRight();
        if (!isFormRight) {
            this.props.handleChangeNotification('error', 'Please fill in the form completely and accurately');
            return;
        }

        let payload;
        switch (this.state.activeTab) {
            case 'machine':
                payload = {
                    "@id": this.state.mMachineName,
                    "type": "Machine",
                    "parent": this.state.productionLine,
                    "@type": "Interface",
                    "displayName": this.state.mMachineName,
                    "name": this.state.mMachineName,
                    "contents": [],
                    "description": this.state.mDescription,
                }
                break;
            case 'component':
                payload = {
                    "@id": this.state.cComponentName,
                    "@type": "Component",
                    "name": this.state.cComponentName,
                    "displayName": this.state.cComponentName,
                    "description": this.state.cDescription,
                    "type": "Component",
                    "parent": this.state.cParent,
                    "sensors": [],
                    "visual": this.state.cComponentObject["children"],
                }
                break;
            case 'sensor':
                let sensorVisual = this.state.sSelectedObject;
                delete sensorVisual["_id"];

                let fieldList = this.state.sAddedFieldList;

                if (fieldList.length > 0) {
                    fieldList.forEach(field => {
                        field['parent'] = this.state.sSensorName
                    })
                }

                payload = {
                    "@id": this.state.sSensorName,
                    "@type": ["Telemetry", this.state.sSensorType],
                    "name": this.state.sSensorName,
                    "schema": this.state.sSensorUnit,
                    "type": "Sensor",
                    "parent": this.state.sParent,
                    "unit": this.state.sSensorUnit,
                    "displayName": this.state.sSensorName,
                    "description": this.state.sDescription,
                    "status": "Working",
                    "visual": sensorVisual,
                    "fields": fieldList,
                }
        }

        const result = await this.addNewNode(payload);

        this.notificationManager(result);
    }

    notificationManager = (result) => {
        switch (result) {
            case 'Added_Sensor_Successfully':
                this.props.handleDismissAddNode();
                this.props.handleChangeNotification('success', 'Sensor added successfully');
                this.props.refreshGraph();
                this.props.refreshGeneralInfo();
                this.props.refreshVisualizePage();
                this.setGeneralInfo();
                this.clearForm();
                break;
            case 'Sensor_Already_Exists':
                this.props.handleChangeNotification('error', 'Sensor has already exists');
                break;
            case 'Component_Already_Exists':
                this.props.handleChangeNotification('error', 'Component has already exists');
                break;
            case 'Added_Component_Successfully':
                this.props.handleDismissAddNode();
                this.props.handleChangeNotification('success', 'Component added successfully');
                this.props.refreshGraph();
                this.props.refreshGeneralInfo();
                this.props.refreshVisualizePage();
                this.setGeneralInfo();
                this.clearForm();
                break;
            case 'Machine_Already_Exists':
                this.props.handleChangeNotification('error', 'Machine has already exists');
                break;
            case 'Added_Machine_Successfully':
                this.props.handleDismissAddNode();
                this.props.handleChangeNotification('success', 'Machine added successfully');
                this.props.refreshGraph();
                this.props.refreshGeneralInfo();
                this.props.refreshVisualizePage();
                this.setGeneralInfo();
                this.clearForm();
                break;
        }
    }

    addNewNode = async (payload) => {
        const url = `${BACKEND.API_URL}dt/add`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(payload),
        })

        try {
            const response = await request;
            const res = await response.json();

            if (response.status !== 200) {
                throw new Error(res.data.message.text);
            }

            return res.data.message.text;
        } catch (err) {
            alert(err);
            console.error(err);
        }
    }

    handleOnTabClick = (activeTab) => {
        this.setState({
            activeTab,
        })
    }

    private get headerChildren(): JSX.Element[] {
        return [
            <QuestionMarkTooltip
                diameter={20}
                tooltipStyle={{ width: '400px' }}
                color={ComponentColor.Secondary}
                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                    <div style={{ color: InfluxColors.Star }}>{"How to add DT object:"}
                        <hr style={tipStyle} />
                    </div>
                    {addNewNodeHeader}
                </div>}
            />
        ]
    }

    render() {
        const { activeTab } = this.state;
        const { visibleAddNodeOverlay, handleDismissAddNode } = this.props;

        const tabs: TabbedPageTab[] = [
            {
                text: 'Machine',
                id: 'machine',
            },
            {
                text: 'Component',
                id: 'component',
            },
            {
                text: 'Sensor',
                id: 'sensor',
            },
        ]

        let renderElements;
        switch (activeTab) {
            case 'machine':
                renderElements = this.machineElements;
                break
            case 'component':
                renderElements = this.componentElements;
                break
            case 'sensor':
                renderElements = this.sensorElements;
                break
            default:
                console.error('Error active tab', activeTab)
        }

        return (
            <>
                <Overlay visible={visibleAddNodeOverlay}>
                    <Overlay.Container maxWidth={600}>
                        <Overlay.Header
                            title="Add New Node"
                            onDismiss={handleDismissAddNode}
                            children={this.headerChildren}
                        />

                        <Overlay.Body>
                            <TabbedPageTabs
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabClick={this.handleOnTabClick}
                            />
                            <br />

                            <Form>
                                {renderElements}

                                <Form.Footer>
                                    <Button
                                        text="Cancel"
                                        icon={IconFont.Remove}
                                        onClick={handleDismissAddNode}
                                    />

                                    <ReactHover options={{
                                        followCursor: true,
                                        shiftX: 50,
                                        shiftY: 0
                                    }}>
                                        <Trigger type="trigger">
                                            <Button
                                                text="Save"
                                                icon={IconFont.Checkmark}
                                                color={ComponentColor.Success}
                                                type={ButtonType.Submit}
                                                onClick={this.handleSaveAddNode}
                                            />
                                        </Trigger>
                                        <Hover type="hover">
                                            <span>hello world</span>
                                        </Hover>
                                    </ReactHover>


                                </Form.Footer>
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        );
    }
}

export default AddNewNodeOverlay;