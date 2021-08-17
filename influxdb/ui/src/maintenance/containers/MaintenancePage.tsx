// Libraries
import React, { PureComponent, createRef } from "react";
import { Link } from "react-router-dom"

// Components
import {
    Page, Grid, IconFont, ComponentColor, ComponentSize, Button, ButtonType, Table, DapperScrollbars,
    BorderType, Popover, Appearance, PopoverPosition, PopoverInteraction, DateRangePicker, Form,
    Columns, FlexBox, SelectDropdown, SquareButton, Notification, Gradients, SpinnerContainer,
    TechnoSpinner, RemoteDataState, ConfirmationButton, Dropdown,
} from '@influxdata/clockface'
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import AddUpdateMaintenanceOverlay from 'src/maintenance/components/AddUpdateMaintenanceOverlay';
import ImportMaintenanceFile from 'src/maintenance/components/ImportMaintenanceFile';
import MaintenanceDetailOverlay from 'src/maintenance/components/MaintenanceDetailOverlay';

// Styles
import 'src/side_nav/components/newAdd/customCss/general.css';

// Services
import FactoryService from 'src/shared/services/FactoryService';
import MaintenanceService from 'src/maintenance/services/MaintenanceService';

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
    formMode: boolean,
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
    openAddUpdateMaintenanceOverlay: boolean
    updateData: object
    spinnerLoading: RemoteDataState
    isLoading: boolean
    startTimeRange: object
    endTimeRange: object
    selectedDetailRow: object
    openMaintenanceDetailOverlay: boolean
    currentIndex: number
}

class MaintenancePage extends PureComponent<Props, State> {
    private startDateTimeRangeRef = createRef<HTMLButtonElement>();
    private importButtonRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props);
        this.state = {
            startTimeRangeOpen: false,
            endTimeRangeOpen: false,
            filtersForm: false,
            filteredSeverity: ["minor", "major", "severe"],
            options: ["option1", "option2", "option3", "option4"],
            option: "option1",
            tableData: [],
            filteredData: [],
            formMode: false,
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
            selectedSeverity: "minor",
            costToFix: null,
            description: "",
            startTime: "",
            endTime: "",
            editMode: false,
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            editRowId: "",
            openAddUpdateMaintenanceOverlay: false,
            updateData: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
            startTimeRange: {},
            endTimeRange: {},
            selectedDetailRow: {},
            openMaintenanceDetailOverlay: false,
            currentIndex: 0,
        };
    }

    async componentDidMount() {
        await this.getAllMaintenance();
        await this.getAllFactories();
        this.setState({
            isLoading: true,
            spinnerLoading: RemoteDataState.Done,
        });
    }

    getAllMaintenance = async () => {
        const maintenance = await MaintenanceService.getAllMaintenance();
        this.setState({
            tableData: maintenance,
            filteredData: maintenance,
        });
    }

    getFailuresByFilter = async () => {
        const filteredRows = [];

        const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        const previousYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

        const startLower = this.state.startTimeRange["lower"] === undefined ? previousYear : new Date(this.state.startTimeRange["lower"]);
        const startUpper = this.state.startTimeRange["upper"] === undefined ? nextYear : new Date(this.state.startTimeRange["upper"]);

        // get all data
        if (this.state.selectedFactory === "ALL") {
            this.state.tableData.map(row => {
                let rowStartTime = new Date(row["date"]);

                if (rowStartTime >= startLower && rowStartTime <= startUpper) {
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
                let rowStartTime = new Date(row["date"]);

                if (row["factoryID"] === this.state.selectedFactory
                    && rowStartTime >= startLower && rowStartTime <= startUpper
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
                let rowStartTime = new Date(row["date"]);
                let splitSource = row["asset"].split(".");

                if (row["factoryID"] === this.state.selectedFactory
                    && splitSource[0] === this.state.selectedMachine
                    && rowStartTime >= startLower && rowStartTime <= startUpper
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
                let rowStartTime = new Date(row["date"]);
                let splitSource = row["asset"].split(".");

                if (row["factoryID"] === this.state.selectedFactory
                    && splitSource[0] === this.state.selectedMachine
                    && splitSource[1] === this.state.selectedComponent
                    && rowStartTime >= startLower && rowStartTime <= startUpper
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
            let rowStartTime = new Date(row["date"]);
            let splitSource = row["asset"].split(".");

            if (row["factoryID"] === this.state.selectedFactory
                && splitSource[0] === this.state.selectedMachine
                && splitSource[1] === this.state.selectedComponent
                && splitSource[2] === this.state.selectedSensor
                && rowStartTime >= startLower && rowStartTime <= startUpper
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
            "selectedPart": { id: editRow.sid !== null ? editRow.sid : "", text: editRow.asset },
            "maintenanceTime": editRow.maintenanceTime,
            "maintenanceReason": editRow.maintenanceReason,
            "maintenanceRequest": editRow.maintenanceRequest,
            "maintenanceInfo": editRow.maintenanceInfo,
            "maintenanceDownTime": editRow.maintenanceDownTime,
            "maintenanceType": editRow.maintenanceType,
            "maintenanceCost": editRow.maintenanceCost,
            "personResponsible": editRow.personResponsible,
            "editRowId": editRow._id.$oid,
            "failure": editRow.failure,
        }

        this.setState({
            formMode: true,
            editMode: true,
            updateData: updateData,
            openAddUpdateMaintenanceOverlay: true,
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

    handleDismissAddUpdateMaintenance = () => {
        this.setState({
            openAddUpdateMaintenanceOverlay: false,
            editMode: false,
        });
    }

    removeMaintenanceRecord = async (removeRow) => {
        const payload = {
            "recordId": removeRow._id.$oid
        }

        const result = await MaintenanceService.removeMaintenance(payload);

        if (result.data.summary.code === 200) {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: "Maintenance record deleted successfully",
            });
            this.getAllMaintenance();
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
        console.log("filteredData", this.state.filteredData)

        const { filteredData } = this.state;
        let now = new Date().toISOString();
        let headers = ["Asset,Failure,Date,Cost,Down Time,Info,Reason,Request,Type,Person Responsible,Source ID"]

        let data = filteredData.map(item => {
            return [
                item['asset'],
                item['failure'],
                item["maintenanceTime"],
                item["maintenanceCost"],
                item['maintenanceDownTime'],
                item['maintenanceInfo'],
                item["maintenanceReason"],
                item["maintenanceRequest"],
                item["maintenanceType"],
                item["personResponsible"],
                item["sid"]
            ];
        });

        let csv = dataToCSV([headers, ...data]);

        try {
            download(csv, `maintenance-${now}.csv`, 'text/plain')
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
        let headers = ["Asset,Failure,Date,Cost,Down Time,Info,Reason,Request,Type,Person Responsible, Source ID"]

        let data = filteredData.map(item => {
            return [
                item['asset'],
                item['failure'],
                item["maintenanceTime"],
                item["maintenanceCost"],
                item['maintenanceDownTime'],
                item['maintenanceInfo'],
                item["maintenanceReason"],
                item["maintenanceRequest"],
                item["maintenanceType"],
                item["personResponsible"],
                item["sid"]
            ];
        });

        let xlsx = dataToXLSX([headers, ...data]);

        try {
            download(xlsx, `maintenance-${now}.xlsx`, 'text/plain')
        } catch (error) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: error,
            });
        }
    }

    handleDetailSelectedRow = (row) => {
        const updateData = {
            "selectedPart": { id: row.sid !== null ? row.sid : "", text: row.asset },
            "maintenanceTime": row.maintenanceTime,
            "maintenanceReason": row.maintenanceReason,
            "maintenanceRequest": row.maintenanceRequest,
            "maintenanceInfo": row.maintenanceInfo,
            "maintenanceDownTime": row.maintenanceDownTime,
            "maintenanceType": row.maintenanceType,
            "maintenanceCost": row.maintenanceCost,
            "personResponsible": row.personResponsible,
            "editRowId": row._id.$oid,
        }

        const currentIndex = this.state.tableData.findIndex(item => item === row);

        this.setState({
            selectedDetailRow: updateData,
            openMaintenanceDetailOverlay: true,
            currentIndex,
        })
    }

    private get optionsComponents(): JSX.Element {
        return (
            <React.Fragment>
                <FlexBox margin={ComponentSize.Small} style={{ marginRight: '10%' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600 }}>Maintenance Date</p>
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
                        text="Maintenance Date"
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

    handleDismissMaintenanceDetail = () => {
        this.setState({
            openMaintenanceDetailOverlay: false
        })
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
                                <Page.Title title={"Maintenance Records"} />
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
                                <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/failures/${this.props["match"].params["FID"]}`}>
                                    Failures
                                </Link>

                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Maintenance</Typography>
                            </Breadcrumbs>

                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid.Column widthXS={Columns.One}>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Ten}>
                                    <Grid style={{ marginTop: "50px", marginBottom: '100px', background: '#292933', padding: '20px' }}>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <Form.Element label="Factory">
                                                    <SelectDropdown
                                                        options={this.state.factories}
                                                        selectedOption={this.state.selectedFactory}
                                                        onSelect={(e) => this.handleChangeFactoryDropdown(e)}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <Form.Element label="Machine">
                                                    <SelectDropdown
                                                        options={this.state.machines}
                                                        selectedOption={this.state.selectedMachine}
                                                        onSelect={(e) => this.handleChangeMachineDropdown(e)}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <Form.Element label="Component">
                                                    <SelectDropdown
                                                        options={this.state.components}
                                                        selectedOption={this.state.selectedComponent}
                                                        onSelect={(e) => this.handleChangeComponentDropdown(e)}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <Form.Element label="Sensor">
                                                    <SelectDropdown
                                                        options={this.state.sensors}
                                                        selectedOption={this.state.selectedSensor}
                                                        onSelect={(e) => this.handleChangeSensorDropdown(e)}
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
                                                >
                                                    <Table.Header>
                                                        <Table.Row>
                                                            <Table.HeaderCell style={{ width: "300px" }}>Asset</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}>Maintenance Date</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "200px" }}>Maintenance Type</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}>Reason</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}>Down Time</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}></Table.HeaderCell>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {
                                                            this.state.filteredData.map(row => {
                                                                let recordId = row["_id"]["$oid"];
                                                                return (
                                                                    <Table.Row key={recordId}>
                                                                        <Table.Cell>{row["asset"]}</Table.Cell>
                                                                        <Table.Cell>{row["maintenanceTime"]}</Table.Cell>
                                                                        <Table.Cell>{row["maintenanceType"]}</Table.Cell>
                                                                        <Table.Cell>{row["maintenanceReason"]}</Table.Cell>
                                                                        <Table.Cell>{row["maintenanceDownTime"]}</Table.Cell>
                                                                        <Table.Cell>
                                                                            <FlexBox margin={ComponentSize.Medium} >
                                                                                <Button
                                                                                    size={ComponentSize.ExtraSmall}
                                                                                    icon={IconFont.TextBlock}
                                                                                    color={ComponentColor.Success}
                                                                                    type={ButtonType.Submit}
                                                                                    onClick={() => { this.handleDetailSelectedRow(row) }}
                                                                                />
                                                                                {
                                                                                    ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                                                                                    <Button
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
                                                                                        onConfirm={() => { this.removeMaintenanceRecord(row) }}
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
                                                                        </Table.Cell>
                                                                    </Table.Row>
                                                                )
                                                            })
                                                        }
                                                    </Table.Body>
                                                </Table>
                                            </DapperScrollbars>
                                        </Grid.Row>


                                        <Grid.Row style={{ marginTop: '50px' }}>
                                            <div style={{ float: 'right' }}>
                                                <FlexBox margin={ComponentSize.Small}>
                                                    <Dropdown
                                                        style={{ width: '110px' }}
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
                                                            <p>Import in this order: Asset,Failure,Factory ID,Date,Cost,Down Time,Info,Reason,Request,Type,Person Responsible</p>
                                                        )}
                                                    />
                                                    {
                                                        ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                                                        <Button
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
                                                            text="Add"
                                                            type={ButtonType.Button}
                                                            icon={IconFont.Plus}
                                                            color={ComponentColor.Primary}
                                                            style={{ width: '110px' }}
                                                            onClick={() => { this.setState({ openAddUpdateMaintenanceOverlay: true, editMode: false }) }}
                                                        />
                                                    }
                                                </FlexBox>
                                            </div>
                                        </Grid.Row>

                                    </Grid>
                                </Grid.Column>

                                <ImportMaintenanceFile
                                    overlay={this.state.overlay}
                                    onClose={this.handleCloseImportDataForm}
                                    getAllMaintenance={this.getAllMaintenance}
                                    setNotificationData={this.setNotificationData}
                                    fileTypesToAccept=".csv, .xlsx"
                                    orgID={this.props["match"].params["orgID"]}
                                />

                                <MaintenanceDetailOverlay
                                    visibleMaintenanceOverlay={this.state.openMaintenanceDetailOverlay}
                                    handleDismissMaintenanceDetail={this.handleDismissMaintenanceDetail}
                                    factoryID={this.props["match"].params.FID}
                                    selectedDetailRow={this.state.selectedDetailRow}
                                    tableData={this.state.tableData}
                                    currentIndex={this.state.currentIndex}
                                />

                                <AddUpdateMaintenanceOverlay
                                    visibleAddUpdateMaintenance={this.state.openAddUpdateMaintenanceOverlay}
                                    handleDismissAddUpdateMaintenance={this.handleDismissAddUpdateMaintenance}
                                    getAllMaintenance={this.getAllMaintenance}
                                    isEdit={this.state.editMode}
                                    factoryID={this.props["match"].params.FID}
                                    updateData={this.state.updateData}
                                />
                            </Page.Contents>
                        </React.Fragment>
                    )
                }
            </Page>
        )
    }
}

export default MaintenancePage;