import React, { PureComponent } from 'react'
import {
    Form,
    Input,
    Button,
    ButtonType,
    ComponentColor,
    Overlay,
    IconFont,
    Grid,
    ComponentStatus,
    Columns,
    SelectDropdown,
    TextArea,
    DapperScrollbars,
    ComponentSize,
    Table,
    BorderType,
    List,
    FlexDirection,
    Gradients,
    FlexBox,
    InputType,
} from '@influxdata/clockface'
import { BACKEND } from "src/config";
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import { TabbedPageTab } from 'src/shared/tabbedPage/TabbedPageTabs'

interface Props {
    visibleAddNodeOverlay: boolean
    handleDismissAddNode: () => void
    refreshGraph: () => void
    refreshGeneralInfo: () => void
    refreshVisualizePage: () => void
    handleChangeNotification: (type, message) => void
}

interface State {
    machineList: string[]
    componentList: string[]
    activeTab: string
    mFactoryName: string
    mMachineName: string
    mComponentName: string
    mComponentDescription: string
    mAddedComponentList: object[]
    cParent: string
    cComponentName: string
    cDescription: string
    cSensorName: string
    cSensorType: string
    cSensorUnit: string
    cSensorDescription: string
    cAddedSensorList: object[]
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
}

class AddNewNodeOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            machineList: [],
            componentList: [],
            activeTab: "machine",
            mFactoryName: "",
            mMachineName: "",
            mComponentName: "",
            mComponentDescription: "",
            mAddedComponentList: [],
            cParent: "",
            cComponentName: "",
            cDescription: "",
            cSensorName: "",
            cSensorType: "Temperature",
            cSensorUnit: "real",
            cSensorDescription: "",
            cAddedSensorList: [],
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
            console.log(err);
        }
    }

    clearForm = () => {
        this.setState({
            activeTab: "machine",
            mFactoryName: "",
            mMachineName: "",
            mComponentName: "",
            mComponentDescription: "",
            mAddedComponentList: [],
            cParent: "",
            cComponentName: "",
            cDescription: "",
            cSensorName: "",
            cSensorType: "Temperature",
            cSensorUnit: "real",
            cSensorDescription: "",
            cAddedSensorList: [],
            sParent: "",
            sSensorName: "",
            sSensorType: "Temperature",
            sSensorUnit: "real",
            sDescription: "",
        })
    }

    setGeneralInfo = async () => {
        let generalInfo = await this.getGeneralInfo();

        this.setState({
            machineList: generalInfo.machineList,
            componentList: generalInfo.componentList,
            mFactoryName: generalInfo.factoryID,
            cParent: generalInfo.machineList[0],
            sParent: generalInfo.componentList[0],
        })
    }

    getGeneralInfo = async () => {
        const url = `${BACKEND.API_URL}dt/getGeneralInfo`;

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
            const result = JSON.parse(res.data.data)

            return result;
        } catch (err) {
            console.log(err);
        }
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    addComponentToMachine = () => {
        if (this.handleValidation(this.state.mMachineName) !== null) {
            this.props.handleChangeNotification('error', 'Machine Name cannot be empty');
            return;
        }

        if (this.handleValidation(this.state.mComponentName) !== null) {
            this.props.handleChangeNotification('error', 'Component Name cannot be empty');
            return;
        }

        let isAlreadyExistsSensor = false;
        this.state.mAddedComponentList.forEach(item => {
            if (item['name'] === this.state.mComponentName) {
                this.props.handleChangeNotification('error', 'This component has already been added');
                isAlreadyExistsSensor = true;
                return;
            }
        })

        if (isAlreadyExistsSensor) {
            return;
        }


        const component = {
            "@id": this.state.mComponentName,
            "@type": "Component",
            "name": this.state.mComponentName,
            "displayName": this.state.mComponentName,
            "description": this.state.mComponentDescription,
            "type": "Component",
            "parent": this.state.mMachineName,
            "sensors": [],
        }


        this.setState({
            mAddedComponentList: [...this.state.mAddedComponentList, component]
        });
    }

    removeComponentFromMachine = (component) => {
        const tempComponentList = this.state.mAddedComponentList.filter(item =>
            item['name'] !== component['name']
        )
        this.setState({
            mAddedComponentList: tempComponentList,
        })
    }

    addSensorToComponent = () => {
        if (this.handleValidation(this.state.cSensorName) !== null) {
            this.props.handleChangeNotification('error', 'Sensor Name cannot be empty');
            return;
        }

        if (this.handleValidation(this.state.cComponentName) !== null) {
            this.props.handleChangeNotification('error', 'Component Name cannot be empty');
            return;
        }

        let isAlreadyExistsSensor = false;
        this.state.cAddedSensorList.forEach(item => {
            if (item['name'] === this.state.cSensorName) {
                this.props.handleChangeNotification('error', 'This sensor has already been added');
                isAlreadyExistsSensor = true;
                return;
            }
        })

        if (isAlreadyExistsSensor) {
            return;
        }

        const sensor = {
            "@id": this.state.cSensorName,
            "@type": ["Telemetry", this.state.cSensorType],
            "name": this.state.cSensorName,
            "schema": this.state.cSensorUnit,
            "type": "Sensor",
            "parent": this.state.cComponentName,
            "unit": this.state.cSensorUnit,
            "displayName": this.state.cSensorName,
            "description": this.state.cSensorDescription,
            "status": "Working"
        }


        this.setState({
            cAddedSensorList: [...this.state.cAddedSensorList, sensor]
        });
    }

    removeSensorFromComponent = (sensor) => {
        const tempSensorList = this.state.cAddedSensorList.filter(item =>
            item['name'] !== sensor['name']
        )
        this.setState({
            cAddedSensorList: tempSensorList,
        })
    }

    private get machineElements(): JSX.Element[] {
        return [
            <Grid key="machine">
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element label="Factory Name">
                            <Input
                                name="factoryName"
                                value={this.state.mFactoryName}
                                status={ComponentStatus.Disabled}
                            />
                        </Form.Element>
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
                    <Grid.Column widthSM={Columns.Four}>
                        <Form.Element label="">
                            <Button
                                text="Add Component"
                                icon={IconFont.Plus}
                                onClick={this.addComponentToMachine}
                                type={ButtonType.Button}
                                color={ComponentColor.Primary}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element
                            label="Component Name"
                        >
                            <Input
                                name="mComponentName"
                                placeholder="Component name.."
                                onChange={this.handleChangeInput}
                                value={this.state.mComponentName}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element label="Description">
                            <TextArea
                                name="mComponentDescription"
                                value={this.state.mComponentDescription}
                                placeholder="Description.."
                                onChange={this.handleChangeInput}
                                rows={5}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    {
                        this.state.mAddedComponentList.length > 0 ? (
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
                                            <Table.HeaderCell>Name</Table.HeaderCell>
                                            <Table.HeaderCell>Description</Table.HeaderCell>
                                            <Table.HeaderCell></Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {
                                            this.state.mAddedComponentList.map((component, index) => (
                                                <Table.Row key={index}>
                                                    <Table.Cell>{component["name"]}</Table.Cell>
                                                    <Table.Cell>{component["description"]}</Table.Cell>
                                                    <Table.Cell>
                                                        <Button
                                                            size={ComponentSize.ExtraSmall}
                                                            icon={IconFont.Remove}
                                                            color={ComponentColor.Danger}
                                                            type={ButtonType.Submit}
                                                            onClick={() => this.removeComponentFromMachine(component)}
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

    private get componentElements(): JSX.Element[] {
        return [
            <Grid key="component">
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element label="Parent">
                            <SelectDropdown
                                options={this.state.machineList}
                                selectedOption={this.state.cParent}
                                onSelect={(e) => this.setState({ cParent: e })}
                            />
                        </Form.Element>
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

                <Grid.Row>
                    <Grid.Column widthSM={Columns.Three}>
                        <Form.Element label="">
                            <Button
                                text="Add Sensor"
                                icon={IconFont.Plus}
                                onClick={this.addSensorToComponent}
                                type={ButtonType.Button}
                                color={ComponentColor.Primary}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element
                            label="Sensor Name"
                        >
                            <Input
                                name="cSensorName"
                                placeholder="Sensor name.."
                                onChange={this.handleChangeInput}
                                value={this.state.cSensorName}
                            />
                        </Form.Element>
                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Three}>
                        <Form.Element label="Type">
                            <SelectDropdown
                                options={this.state.sSensorTypeList}
                                selectedOption={this.state.cSensorType}
                                onSelect={(e) => this.setState({ cSensorType: e })}
                            />
                        </Form.Element>
                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Three}>
                        <Form.Element label="Unit">
                            <SelectDropdown
                                options={this.state.sSensorUnitList}
                                selectedOption={this.state.cSensorUnit}
                                onSelect={(e) => this.setState({ cSensorUnit: e })}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element label="Description">
                            <TextArea
                                name="cSensorDescription"
                                value={this.state.cSensorDescription}
                                placeholder="Description.."
                                onChange={this.handleChangeInput}
                                rows={5}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    {
                        this.state.cAddedSensorList.length > 0 ? (
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
                                            <Table.HeaderCell>Name</Table.HeaderCell>
                                            <Table.HeaderCell>Type</Table.HeaderCell>
                                            <Table.HeaderCell>Unit</Table.HeaderCell>
                                            <Table.HeaderCell></Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {
                                            this.state.cAddedSensorList.map((sensor, index) => (
                                                <Table.Row key={index}>
                                                    <Table.Cell>{sensor["name"]}</Table.Cell>
                                                    <Table.Cell>{sensor["@type"][1]}</Table.Cell>
                                                    <Table.Cell>{sensor["unit"]}</Table.Cell>
                                                    <Table.Cell>
                                                        <Button
                                                            size={ComponentSize.ExtraSmall}
                                                            icon={IconFont.Remove}
                                                            color={ComponentColor.Danger}
                                                            type={ButtonType.Submit}
                                                            onClick={() => this.removeSensorFromComponent(sensor)}
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

    private get sensorElements(): JSX.Element[] {
        return [
            <Grid key="sensor">
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element label="Parent">
                            <SelectDropdown
                                options={this.state.componentList}
                                selectedOption={this.state.sParent}
                                onSelect={(e) => this.setState({ sParent: e })}
                            />
                        </Form.Element>
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
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element label="Type">
                            <SelectDropdown
                                options={this.state.sSensorTypeList}
                                selectedOption={this.state.sSensorType}
                                onSelect={(e) => this.setState({ sSensorType: e })}
                            />
                        </Form.Element>
                    </Grid.Column>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element label="Unit">
                            <SelectDropdown
                                options={this.state.sSensorUnitList}
                                selectedOption={this.state.sSensorUnit}
                                onSelect={(e) => this.setState({ sSensorUnit: e })}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    <Grid.Column widthSM={Columns.Six}>
                        <Form.Element label="Data Source">
                            <SelectDropdown
                                options={this.state.sDataSourceList}
                                selectedOption={this.state.sSelectedDataSource}
                                onSelect={(e) => this.setState({ sSelectedDataSource: e })}
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
                                rows={5}
                            />
                        </Form.Element>
                    </Grid.Column>
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
                let componentList = this.state.mAddedComponentList;

                if (componentList.length > 0) {
                    componentList.forEach(component => {
                        component['parent'] = this.state.mMachineName
                    })
                }

                payload = {
                    "@id": this.state.mMachineName,
                    "type": "Machine",
                    "parent": this.state.mFactoryName,
                    "@type": "Interface",
                    "displayName": this.state.mMachineName,
                    "name": this.state.mMachineName,
                    "contents": componentList,
                    "description": "",
                }
                break;
            case 'component':
                let sensorList = this.state.cAddedSensorList;

                if (sensorList.length > 0) {
                    sensorList.forEach(sensor => {
                        sensor['parent'] = this.state.cComponentName
                    })
                }

                payload = {
                    "@id": this.state.cComponentName,
                    "@type": "Component",
                    "name": this.state.cComponentName,
                    "displayName": this.state.cComponentName,
                    "description": this.state.cDescription,
                    "type": "Component",
                    "parent": this.state.cParent,
                    "sensors": sensorList,
                    "visual": this.state.cComponentObject["children"],
                }
                break;
            case 'sensor':
                let sensorVisual = this.state.sSelectedObject;
                delete sensorVisual["_id"];

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
                    "visual": sensorVisual,
                    "minValue": Number(this.state.sMinValue),
                    "maxValue": Number(this.state.sMaxValue),
                    "dataSource": this.state.sSelectedDataSource
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
            return res.data.message.text;
        } catch (err) {
            console.log(err);
        }
    }

    handleOnTabClick = (activeTab) => {
        this.setState({
            activeTab,
        })
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

                                    <Button
                                        text="Save"
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                        onClick={this.handleSaveAddNode}
                                    />
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