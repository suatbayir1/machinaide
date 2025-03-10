// Libraries
import React, { PureComponent, createRef } from "react";
import { Link } from "react-router-dom"

// Components
import {
    Page, Grid, IconFont, Icon, ComponentColor, ComponentSize, Button, ButtonType, Table,
    DapperScrollbars, BorderType, Popover, Appearance, PopoverPosition, PopoverInteraction,
    DateRangePicker, Form, Columns, FlexBox, MultiSelectDropdown, SelectDropdown, SquareButton,
    Notification, Gradients, SpinnerContainer, TechnoSpinner, RemoteDataState, ConfirmationButton,
    Dropdown,
} from '@influxdata/clockface'
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import ImportDataForm from 'src/side_nav/components/newAdd/modules/ImportDataForm';
import AddUpdateFailureOverlay from 'src/side_nav/components/newAdd/modules/AddUpdateFailureOverlay';
import FailureAlarmScene from 'src/failures/components/FailureAlarmScene';

// Styles
import 'src/side_nav/components/newAdd/customCss/general.css';

// Services
import FactoryService from 'src/shared/services/FactoryService';
import FailureService from 'src/shared/services/FailureService';

// Helpers
import { dataToCSV, dataToXLSX } from 'src/shared/parsing/dataToCsv';
import download from 'src/external/download.js';

interface Props { }
interface State {
    startTimeRangeOpen: boolean,
    endTimeRangeOpen: boolean,
    filtersForm: boolean,
    filteredSeverity: string[],
    options: string[],
    option: string,
    tableData: object[],
    filteredData: object[],
    dialogBox: boolean,
    overlay: boolean,
    factories: string[],
    machines: string[],
    components: string[],
    sensors: string[],
    selectedFactory: string,
    selectedMachine: string,
    selectedComponent: string,
    selectedSensor: string,
    allParts: object[],
    selectedPart: object,
    selectedSeverity: string,
    costToFix: number,
    description: string,
    startTime: string,
    endTime: string,
    editMode: boolean,
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    editRowId: string
    openAddUpdateFailureOverlay: boolean
    updateData: object
    spinnerLoading: RemoteDataState,
    isLoading: boolean,
    startTimeRange: object,
    endTimeRange: object,
    visibleFailureAlarmScene: boolean
}

class FailureTable extends PureComponent<Props, State> {
    private startDateTimeRangeRef = createRef<HTMLButtonElement>();
    private endDateTimeRangeRef = createRef<HTMLButtonElement>();
    private importButtonRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props);
        this.state = {
            startTimeRangeOpen: false,
            endTimeRangeOpen: false,
            filtersForm: false,
            filteredSeverity: ["acceptable", "major", "critical"],
            options: ["option1", "option2", "option3", "option4"],
            option: "option1",
            tableData: [],
            filteredData: [],
            dialogBox: false,
            overlay: false,
            factories: [],
            machines: [],
            components: [],
            sensors: [],
            selectedFactory: "ALL",
            selectedMachine: "ALL",
            selectedComponent: "ALL",
            selectedSensor: "ALL",
            allParts: [],
            selectedPart: {},
            selectedSeverity: "acceptable",
            costToFix: null,
            description: "",
            startTime: "",
            endTime: "",
            editMode: false,
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            editRowId: "",
            openAddUpdateFailureOverlay: false,
            updateData: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
            startTimeRange: {},
            endTimeRange: {},
            visibleFailureAlarmScene: false,
        };
    }

    async componentDidMount() {
        await this.getAllFailures();
        await this.getAllFactories();
        this.setState({
            isLoading: true,
            spinnerLoading: RemoteDataState.Done,
        });
    }

    getAllFailures = async () => {
        const failures = await FailureService.getAllFailures();
        this.setState({
            tableData: failures,
            filteredData: failures,
        });
    }

    getFailuresByFilter = async () => {
        const filteredRows = [];

        const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        const previousYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

        const startLower = this.state.startTimeRange["lower"] === undefined ? previousYear : new Date(this.state.startTimeRange["lower"]);
        const startUpper = this.state.startTimeRange["upper"] === undefined ? nextYear : new Date(this.state.startTimeRange["upper"]);
        const endLower = this.state.endTimeRange["lower"] === undefined ? previousYear : new Date(this.state.endTimeRange["lower"]);
        const endUpper = this.state.endTimeRange["upper"] === undefined ? nextYear : new Date(this.state.endTimeRange["upper"]);

        // get all data
        if (this.state.selectedFactory === "ALL") {
            this.state.tableData.map(row => {
                let rowStartTime = new Date(row["startTime"]);
                let rowEndTime = row["endTime"] === "" || row["endTime"] === null ? Date.now() : new Date(row["endTime"]);

                if (this.state.filteredSeverity.includes(row["severity"])
                    && rowStartTime >= startLower && rowStartTime <= startUpper
                    && rowEndTime >= endLower && rowEndTime <= endUpper
                ) {
                    filteredRows.push(row);
                }
            });
            this.setState({
                filteredData: filteredRows,
            })
            return;
        }

        // get all data of selected factory
        if (this.state.selectedMachine === "ALL" && this.state.selectedComponent === "ALL" && this.state.selectedSensor === "ALL") {
            this.state.tableData.map(row => {
                let rowStartTime = new Date(row["startTime"]);
                let rowEndTime = row["endTime"] === "" || row["endTime"] === null ? Date.now() : new Date(row["endTime"]);

                if (row["factoryID"] === this.state.selectedFactory
                    && this.state.filteredSeverity.includes(row["severity"])
                    && rowStartTime >= startLower && rowStartTime <= startUpper
                    && rowEndTime >= endLower && rowEndTime <= endUpper
                ) {
                    filteredRows.push(row);
                }
            })
            this.setState({
                filteredData: filteredRows
            })
            return;
        }

        // get all data of selected factory and machine
        if (this.state.selectedComponent === "ALL" && this.state.selectedSensor === "ALL") {
            this.state.tableData.map(row => {
                let rowStartTime = new Date(row["startTime"]);
                let rowEndTime = row["endTime"] === "" || row["endTime"] === null ? Date.now() : new Date(row["endTime"]);
                let splitSource = row["sourceName"].split(".");

                if (row["factoryID"] === this.state.selectedFactory
                    && splitSource[0] === this.state.selectedMachine
                    && this.state.filteredSeverity.includes(row["severity"])
                    && rowStartTime >= startLower && rowStartTime <= startUpper
                    && rowEndTime >= endLower && rowEndTime <= endUpper
                ) {
                    filteredRows.push(row);
                }
            })
            this.setState({
                filteredData: filteredRows,
            })
            return;
        }

        // get all data of selected factory, machine and component
        if (this.state.selectedSensor === "ALL") {
            this.state.tableData.map(row => {
                let rowStartTime = new Date(row["startTime"]);
                let rowEndTime = row["endTime"] === "" || row["endTime"] === null ? Date.now() : new Date(row["endTime"]);
                let splitSource = row["sourceName"].split(".");

                if (row["factoryID"] === this.state.selectedFactory
                    && splitSource[0] === this.state.selectedMachine
                    && splitSource[1] === this.state.selectedComponent
                    && this.state.filteredSeverity.includes(row["severity"])
                    && rowStartTime >= startLower && rowStartTime <= startUpper
                    && rowEndTime >= endLower && rowEndTime <= endUpper
                ) {
                    filteredRows.push(row);
                }
            })
            this.setState({
                filteredData: filteredRows,
            })
            return;
        }

        // get all data of selected factory, machine, component and sensor
        this.state.tableData.map(row => {
            let rowStartTime = new Date(row["startTime"]);
            let rowEndTime = row["endTime"] === "" || row["endTime"] === null ? Date.now() : new Date(row["endTime"]);
            let splitSource = row["sourceName"].split(".");

            if (row["factoryID"] === this.state.selectedFactory
                && splitSource[0] === this.state.selectedMachine
                && splitSource[1] === this.state.selectedComponent
                && splitSource[2] === this.state.selectedSensor
                && this.state.filteredSeverity.includes(row["severity"])
                && rowStartTime >= startLower && rowStartTime <= startUpper
                && rowEndTime >= endLower && rowEndTime <= endUpper
            ) {
                filteredRows.push(row);
            }
        })
        this.setState({
            filteredData: filteredRows,
        })
    }

    handleChangeFactoryDropdown = (e) => {
        this.setState({ selectedFactory: e }, () => this.getFailuresByFilter());
        if (e === "ALL") {
            this.setState({
                machines: [],
                components: [],
                sensors: [],
                selectedMachine: "ALL",
                selectedComponent: "ALL",
                selectedSensor: "ALL",
            });
        } else {
            this.getAllMachines(e);
        }
    }

    handleChangeMachineDropdown = (e) => {
        this.setState({ selectedMachine: e }, () => this.getFailuresByFilter());
        if (e === "ALL") {
            this.setState({
                components: [],
                sensors: [],
                selectedComponent: "ALL",
                selectedSensor: "ALL",
            });
        } else {
            this.getAllComponents(e);
        }
    }

    handleChangeComponentDropdown = (e) => {
        this.setState({ selectedComponent: e }, () => this.getFailuresByFilter());
        if (e === "ALL") {
            this.setState({
                sensors: [],
                selectedSensor: "ALL",
            });
        } else {
            this.getAllSensors(e);
        }
    }

    handleChangeSensorDropdown = (e) => {
        this.setState({ selectedSensor: e }, () => this.getFailuresByFilter());
    }

    getAllFactories = async () => {
        const factories = await FactoryService.getFactories();
        const allFactories = [];

        allFactories.push("ALL");

        factories.forEach(factory => {
            allFactories.push(factory["id"]);
        })

        this.setState({ factories: allFactories });
    }

    getAllMachines = async (factoryId) => {
        const payload = {
            "factoryId": factoryId,
            "plId": "all"
        }

        const machines = await FactoryService.getMachines(payload);
        const allMachines = [];

        allMachines.push("ALL");

        machines.forEach(machine => {
            allMachines.push(machine["id"]);
        })

        this.setState({ machines: allMachines });
    }

    getAllComponents = async (machineId) => {
        const payload = {
            "factoryId": this.state.selectedFactory,
            "machineId": machineId
        }

        const components = await FactoryService.getComponents(payload);
        const allComponents = [];

        allComponents.push("ALL");

        components.forEach(component => {
            allComponents.push(component["id"]);
        })

        this.setState({ components: allComponents });
    }

    getAllSensors = async (componentId) => {
        const payload = {
            "factoryId": this.state.selectedFactory,
            "machineId": this.state.selectedMachine,
            "componentId": componentId
        };

        const sensors = await FactoryService.getSensors(payload);
        const allSensors = [];

        allSensors.push("ALL");

        sensors.forEach(sensor => {
            allSensors.push(sensor["id"]);
        })

        this.setState({ sensors: allSensors });
    }

    handleChangeSelectedPart = (e) => {
        this.setState({ selectedPart: e });
    }

    handleClickEditRow = (editRow) => {
        const updateData = {
            "selectedPart": { id: editRow.sid, text: editRow.sourceName },
            "selectedSeverity": editRow.severity,
            "costToFix": editRow.cost,
            "startTime": editRow.startTime,
            "endTime": editRow.endTime,
            "description": editRow.description,
            "editRowId": editRow._id.$oid,
        }

        this.setState({
            editMode: true,
            updateData: updateData,
            openAddUpdateFailureOverlay: true,
        })
    }

    setOpen = (stateVal) => {
        this.setState({
            dialogBox: stateVal
        })
    }

    handleChangeDropdownFilter = (option: string) => {
        const { filteredSeverity } = this.state
        const optionExists = filteredSeverity.find(opt => opt === option)
        let updatedOptions = filteredSeverity

        if (optionExists) {
            updatedOptions = filteredSeverity.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filteredSeverity, option]
        }

        this.setState({ filteredSeverity: updatedOptions }, () => { this.getFailuresByFilter() })
    }

    handlePrintFailure = () => {
        this.setState({ dialogBox: true })
    }

    handleCloseImportDataForm = () => {
        this.setState({ overlay: false });
    }

    handleDismissAddUpdateFailure = () => {
        this.setState({
            openAddUpdateFailureOverlay: false,
            editMode: false,
        });
    }

    handleDismissFailureAlarmScene = () => {
        this.setState({ visibleFailureAlarmScene: false });
    }

    removeFailureRecord = async (removeRow) => {
        const payload = {
            "recordId": removeRow._id.$oid
        }

        const result = await FailureService.removeFailure(payload);

        if (result.data.message.text === "removed_failure") {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: "Fault record deleted successfully",
            });
            this.getAllFailures();
        }
    }

    handleChangeStartTimeRange = (e) => {
        this.setState({
            startTimeRangeOpen: false,
            startTimeRange: e,
        }, () => { this.getFailuresByFilter() });
    }

    handleChangeEndTimeRange = (e) => {
        this.setState({
            endTimeRangeOpen: false,
            endTimeRange: e
        }, () => { this.getFailuresByFilter() })
    }

    resetStartTimeRange = () => {
        this.setState({
            startTimeRange: {
                lower: Date.now(),
                upper: Date.now(),
            }
        }, () => this.getFailuresByFilter());
    }

    resetEndTimeRange = () => {
        this.setState({
            endTimeRange: {
                lower: Date.now(),
                upper: Date.now(),
            }
        }, () => this.getFailuresByFilter())
    }

    handleChangeExportType = (exportType) => {
        if (exportType === "csv") {
            this.createCSV();
        } else if (exportType === "xlsx") {
            this.createXLSX();
        }
    }

    createCSV = () => {
        const { filteredData } = this.state;
        let now = new Date().toISOString();
        let headers = ["Source Name,Severity,Start Time,End Time,Cost to fix,Description"];

        let data = filteredData.map(failure => {
            let startTime = failure['startTime'] ? new Date(failure["startTime"]) : "";
            let endTime = failure['endTime'] ? new Date(failure["startTime"]) : "";
            return [failure['sourceName'], failure['severity'], startTime, endTime, failure['cost'], failure['description']];
        });

        let csv = dataToCSV([headers, ...data]);

        try {
            download(csv, `failures-${now}.csv`, 'text/plain')
        } catch (error) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: error,
            });
        }
    }

    createXLSX = () => {
        const { filteredData } = this.state;
        let now = new Date().toISOString();
        let headers = ["Source Name,Severity,Start Time,End Time,Cost to fix,Description"];

        let data = filteredData.map(failure => {
            let startTime = failure['startTime'] ? new Date(failure["startTime"]) : "";
            let endTime = failure['endTime'] ? new Date(failure["startTime"]) : "";
            return [failure['sourceName'], failure['severity'], startTime, endTime, failure['cost'], failure['description']];
        })

        let xlsx = dataToXLSX([headers, ...data]);

        try {
            download(xlsx, `failures-${now}.xlsx`, 'text/plain')
        } catch (error) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: error,
            });
        }
    }

    private get optionsComponents(): JSX.Element {
        return (
            <React.Fragment>
                <FlexBox margin={ComponentSize.Small} id="failure-table-timerange-container">
                    <FlexBox margin={ComponentSize.Small}>
                        <p style={{ fontSize: '12px', fontWeight: 600 }}>Start Time Range</p>
                        <Popover
                            appearance={Appearance.Outline}
                            position={PopoverPosition.Below}
                            triggerRef={this.startDateTimeRangeRef}
                            visible={this.state.startTimeRangeOpen}
                            showEvent={PopoverInteraction.None}
                            hideEvent={PopoverInteraction.None}
                            distanceFromTrigger={8}
                            testID="timerange-popover"
                            enableDefaultStyles={false}
                            contents={() => (
                                <DateRangePicker
                                    timeRange={this.state.startTimeRange}
                                    onSetTimeRange={(e) => { this.handleChangeStartTimeRange(e) }}
                                    onClose={() => { this.setState({ startTimeRangeOpen: false }) }}
                                    position={
                                        { position: 'relative' }
                                    }
                                />
                            )}
                        />
                        <Button
                            ref={this.startDateTimeRangeRef}
                            text="Start Time Range"
                            onClick={() => { this.setState({ startTimeRangeOpen: true }) }}
                            type={ButtonType.Button}
                            icon={IconFont.Calendar}
                            color={ComponentColor.Default}
                        />
                        <SquareButton
                            icon={IconFont.Remove}
                            color={ComponentColor.Danger}
                            onClick={this.resetStartTimeRange}
                        />
                    </FlexBox>

                    <FlexBox margin={ComponentSize.Small}>
                        <p style={{ fontSize: '12px', marginLeft: '20px !important', fontWeight: 600 }}>   End Time Range</p>
                        <Popover
                            appearance={Appearance.Outline}
                            position={PopoverPosition.Below}
                            triggerRef={this.endDateTimeRangeRef}
                            visible={this.state.endTimeRangeOpen}
                            showEvent={PopoverInteraction.None}
                            hideEvent={PopoverInteraction.None}
                            distanceFromTrigger={8}
                            testID="timerange-popover"
                            enableDefaultStyles={false}
                            contents={() => (
                                <DateRangePicker
                                    timeRange={this.state.endTimeRange}
                                    onSetTimeRange={(e) => { this.handleChangeEndTimeRange(e) }}
                                    onClose={() => { this.setState({ endTimeRangeOpen: false }) }}
                                    position={
                                        { position: 'relative' }
                                    }
                                />
                            )}
                        />

                        <Button
                            ref={this.endDateTimeRangeRef}
                            text="End Time Range"
                            onClick={() => { this.setState({ endTimeRangeOpen: true }) }}
                            type={ButtonType.Button}
                            icon={IconFont.Calendar}
                            color={ComponentColor.Default}
                        />
                        <SquareButton
                            icon={IconFont.Remove}
                            color={ComponentColor.Danger}
                            onClick={this.resetEndTimeRange}
                        />
                    </FlexBox>
                </FlexBox>
            </React.Fragment>
        )
    }

    setNotificationData = (type, message) => {
        this.setState({
            notificationVisible: true,
            notificationType: type,
            notificationMessage: message,
        });
    }

    getBackgroundColor = (level) => {
        let backgroundColor;

        if (level === "acceptable") {
            backgroundColor = "#0000b3";
        }

        if (level === "major") {
            backgroundColor = "#e69500";
        }

        if (level === "critical") {
            backgroundColor = "#b30000";
        }

        return {
            backgroundColor: backgroundColor,
        }
    }

    private failureIcon(level): JSX.Element {
        let iconType;

        switch (level) {
            case 'acceptable':
                iconType = "Checkmark"
                break;
            case 'major':
                iconType = "Bell";
                break;
            case 'critical':
                iconType = "Alerts";
                break;
        }

        return (
            <Icon glyph={IconFont[iconType]} />
        )
    }

    render() {
        const { spinnerLoading, isLoading } = this.state;

        return (
            <Page>
                {/* Notification Component */}
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


                {
                    <SpinnerContainer
                        loading={spinnerLoading}
                        spinnerComponent={<TechnoSpinner />}
                    >
                    </SpinnerContainer>
                }

                {
                    isLoading && (
                        <React.Fragment>
                            <Page.Header fullWidth={true}>
                                <Page.Title title={"Failure Records"} />
                                {
                                    this.optionsComponents
                                }
                            </Page.Header>

                            <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                                <Link color="inherit" to="/">
                                    <HomeIcon style={{ marginTop: '4px' }} />
                                </Link>
                                <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/allFactories`}>
                                    Factories
                                </Link>
                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Failures</Typography>
                            </Breadcrumbs>

                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid.Column
                                    widthLG={Columns.Ten}
                                    offsetLG={Columns.One}
                                >
                                    <Grid style={{ marginTop: "50px", marginBottom: '100px', background: '#292933', padding: '20px' }}>
                                        <Grid.Row>
                                            <Grid.Column
                                                widthXS={Columns.Twelve}
                                                widthSM={Columns.Four}
                                                widthMD={Columns.Three}
                                                widthLG={Columns.Three}
                                            >
                                                <Form.Element label="Factory">
                                                    <SelectDropdown
                                                        options={this.state.factories}
                                                        selectedOption={this.state.selectedFactory}
                                                        onSelect={(e) => this.handleChangeFactoryDropdown(e)}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                            <Grid.Column
                                                widthXS={Columns.Twelve}
                                                widthSM={Columns.Four}
                                                widthMD={Columns.Three}
                                                widthLG={Columns.Three}
                                            >
                                                <Form.Element label="Machine">
                                                    <SelectDropdown
                                                        options={this.state.machines}
                                                        selectedOption={this.state.selectedMachine}
                                                        onSelect={(e) => this.handleChangeMachineDropdown(e)}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                            <Grid.Column
                                                widthXS={Columns.Twelve}
                                                widthSM={Columns.Four}
                                                widthMD={Columns.Three}
                                                widthLG={Columns.Two}
                                            >
                                                <Form.Element label="Component">
                                                    <SelectDropdown
                                                        options={this.state.components}
                                                        selectedOption={this.state.selectedComponent}
                                                        onSelect={(e) => this.handleChangeComponentDropdown(e)}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                            <Grid.Column
                                                widthXS={Columns.Twelve}
                                                widthSM={Columns.Four}
                                                widthMD={Columns.Three}
                                                widthLG={Columns.Two}
                                            >
                                                <Form.Element label="Sensor">
                                                    <SelectDropdown
                                                        options={this.state.sensors}
                                                        selectedOption={this.state.selectedSensor}
                                                        onSelect={(e) => this.handleChangeSensorDropdown(e)}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                            <Grid.Column
                                                widthXS={Columns.Twelve}
                                                widthSM={Columns.Four}
                                                widthMD={Columns.Three}
                                                widthLG={Columns.Two}
                                            >
                                                <Form.Element label="Severity">
                                                    <MultiSelectDropdown
                                                        emptyText={"Select severity"}
                                                        options={["acceptable", "major", "critical"]}
                                                        selectedOptions={this.state.filteredSeverity}
                                                        onSelect={this.handleChangeDropdownFilter}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>


                                        <Grid.Row>
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true}
                                                style={{ maxHeight: '400px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                <Table
                                                    borders={BorderType.Vertical}
                                                    fontSize={ComponentSize.ExtraSmall}
                                                    cellPadding={ComponentSize.ExtraSmall}
                                                    id={"failureTable"}
                                                >
                                                    <thead>
                                                        <tr>
                                                            <Table.HeaderCell style={{ width: "30px" }}></Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "300px" }}>Machine/Component/Sensor Name</Table.HeaderCell>
                                                            {/* <Table.HeaderCell style={{ width: "100px" }}>Severity</Table.HeaderCell> */}
                                                            <Table.HeaderCell style={{ width: "200px" }}>Start Time</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "200px" }}>End Time</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            this.state.filteredData.map(row => {
                                                                let recordId = row["_id"]["$oid"];
                                                                let startTimeDate = new Date(row["startTime"])
                                                                let endTimeDate = new Date(row["endTime"])
                                                                return (
                                                                    <tr
                                                                        key={recordId}
                                                                        className="not-first"
                                                                    >
                                                                        <td
                                                                            title={row["severity"]}
                                                                            style={this.getBackgroundColor(row["severity"])}
                                                                        >
                                                                            {this.failureIcon(row["severity"])}
                                                                        </td>
                                                                        <td>{row["sourceName"]}</td>
                                                                        {/* <td>{row["severity"]}</td> */}
                                                                        <td>{(startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.toLocaleString() : ""}</td>
                                                                        <td>{(endTimeDate instanceof Date && !isNaN(endTimeDate.valueOf())) ? endTimeDate.toLocaleString() : ""}</td>
                                                                        <td>
                                                                            <FlexBox margin={ComponentSize.Medium}>
                                                                                {
                                                                                    ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                                                                                    <Button
                                                                                        id="failure-table-edit-button"
                                                                                        size={ComponentSize.ExtraSmall}
                                                                                        icon={IconFont.Pencil}
                                                                                        color={ComponentColor.Primary}
                                                                                        type={ButtonType.Submit}
                                                                                        onClick={() => { this.handleClickEditRow(row) }}
                                                                                    />
                                                                                }

                                                                                {
                                                                                    ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                                                                                    <ConfirmationButton
                                                                                        icon={IconFont.Remove}
                                                                                        onConfirm={() => { this.removeFailureRecord(row) }}
                                                                                        text={""}
                                                                                        size={ComponentSize.ExtraSmall}
                                                                                        popoverColor={ComponentColor.Danger}
                                                                                        popoverAppearance={Appearance.Outline}
                                                                                        color={ComponentColor.Danger}
                                                                                        confirmationLabel="Do you want to delete ?"
                                                                                        confirmationButtonColor={ComponentColor.Danger}
                                                                                        confirmationButtonText="Yes"
                                                                                    />
                                                                                }

                                                                            </FlexBox>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })
                                                        }
                                                    </tbody>
                                                </Table>
                                            </DapperScrollbars>
                                        </Grid.Row>


                                        <Grid.Row style={{ marginTop: '20px' }}>
                                            <div className="failure-table-float-div">
                                                <FlexBox margin={ComponentSize.Small}>
                                                    <Dropdown
                                                        style={{ minWidth: '110px' }}
                                                        id="failure-table-exports-button"
                                                        button={(active, onClick) => (
                                                            <Dropdown.Button
                                                                active={active}
                                                                onClick={onClick}
                                                                color={ComponentColor.Danger}
                                                                icon={IconFont.Export}
                                                                testID="dropdown-button--gen-token"
                                                            >
                                                                {'Export'}
                                                            </Dropdown.Button>
                                                        )}
                                                        menu={onCollapse => (
                                                            <Dropdown.Menu onCollapse={onCollapse}>
                                                                <Dropdown.Item
                                                                    testID="dropdown-item generate-token--read-write"
                                                                    id={'csv'}
                                                                    key={'csv'}
                                                                    value={'csv'}
                                                                    onClick={this.handleChangeExportType}
                                                                >
                                                                    {'csv'}
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    testID="dropdown-item generate-token--read-write"
                                                                    id={'xlsx'}
                                                                    key={'xlsx'}
                                                                    value={'xlsx'}
                                                                    onClick={this.handleChangeExportType}
                                                                >
                                                                    {'xlsx'}
                                                                </Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        )}
                                                    />
                                                    <Popover
                                                        triggerRef={this.importButtonRef}
                                                        appearance={Appearance.Outline}
                                                        position={PopoverPosition.Below}
                                                        showEvent={PopoverInteraction.Hover}
                                                        hideEvent={PopoverInteraction.Hover}
                                                        distanceFromTrigger={8}
                                                        enableDefaultStyles={false}
                                                        contents={() => (
                                                            <p>Import in this order: factoryID, sid, sourceName, severity, cost, startTime, endTime, description</p>
                                                        )}
                                                    />
                                                    {
                                                        ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                                                        <Button
                                                            id="import-failures-button"
                                                            ref={this.importButtonRef}
                                                            text="Import"
                                                            type={ButtonType.Button}
                                                            icon={IconFont.Import}
                                                            color={ComponentColor.Success}
                                                            onClick={() => this.setState({ overlay: true })}
                                                            style={{ width: '110px' }}
                                                        />
                                                    }
                                                    {
                                                        ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                                                        <Button
                                                            id="add-failures-button"
                                                            text="Add Failure"
                                                            type={ButtonType.Button}
                                                            icon={IconFont.Plus}
                                                            color={ComponentColor.Primary}
                                                            style={{ width: '110px' }}
                                                            onClick={() => { this.setState({ openAddUpdateFailureOverlay: true, editMode: false }) }}
                                                        />
                                                    }
                                                </FlexBox>
                                            </div>
                                        </Grid.Row>

                                        <Grid.Row style={{ marginTop: '5px' }}>
                                            <div className="failure-table-float-div">
                                                <FlexBox margin={ComponentSize.Small}>
                                                    <Button
                                                        id="three-d-failures-button"
                                                        text="3D Failures"
                                                        type={ButtonType.Button}
                                                        icon={IconFont.Pulse}
                                                        color={ComponentColor.Warning}
                                                        style={{ width: '110px' }}
                                                        onClick={() => { this.setState({ visibleFailureAlarmScene: true }) }}
                                                    />
                                                    <Button
                                                        id="maintenance-records-button"
                                                        text="Maintenance Records"
                                                        type={ButtonType.Button}
                                                        icon={IconFont.Shuffle}
                                                        color={ComponentColor.Secondary}
                                                        onClick={() => this.props["history"].push(`/orgs/${this.props["match"].params["orgID"]}/maintenance-records/${this.props["match"].params["FID"]}`)}
                                                    />
                                                </FlexBox>
                                            </div>
                                        </Grid.Row>

                                    </Grid>
                                </Grid.Column>

                                <ImportDataForm
                                    overlay={this.state.overlay}
                                    onClose={this.handleCloseImportDataForm}
                                    getAllFailures={this.getAllFailures}
                                    setNotificationData={this.setNotificationData}
                                    fileTypesToAccept=".csv, .xlsx"
                                    orgID={this.props["match"].params["orgID"]}
                                />

                                <AddUpdateFailureOverlay
                                    visibleAddUpdateFailure={this.state.openAddUpdateFailureOverlay}
                                    handleDismissAddUpdateFailure={this.handleDismissAddUpdateFailure}
                                    getAllFailures={this.getAllFailures}
                                    isEdit={this.state.editMode}
                                    factoryID={this.props["match"].params.FID}
                                    updateData={this.state.updateData}
                                    addBySelectedPart={false}
                                    isDetail={false}
                                />

                                <FailureAlarmScene
                                    handleDismissFailureAlarmScene={this.handleDismissFailureAlarmScene}
                                    visibleFailureAlarmScene={this.state.visibleFailureAlarmScene}
                                    failures={this.state.tableData}
                                />
                            </Page.Contents>
                        </React.Fragment>

                    )
                }
            </Page>
        )
    }
}

export default FailureTable;