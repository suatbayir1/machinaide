import React, { PureComponent, createRef } from "react";
import {
    Page,
    Grid,
    IconFont,
    ComponentColor,
    ComponentSize,
    Button,
    ButtonType,
    Table,
    DapperScrollbars,
    BorderType,
    Popover,
    Appearance,
    PopoverPosition,
    PopoverInteraction,
    DateRangePicker,
    Columns,
    FlexBox,
    SquareButton,
    Notification,
    Gradients,
    SpinnerContainer,
    TechnoSpinner,
    RemoteDataState,
    ConfirmationButton,
    Input,
    Dropdown,
    MultiSelectDropdown,
} from '@influxdata/clockface'
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import { Link } from "react-router-dom"
import HomeIcon from '@material-ui/icons/Home';
import 'src/side_nav/components/newAdd/customCss/general.css';
import FactoryService from 'src/shared/services/FactoryService';
import AddUpdateMachineActionOverlay from 'src/side_nav/components/machineActions/components/AddUpdateMachineActionOverlay';
import { dataToCSV, dataToXLSX } from 'src/shared/parsing/dataToCsv';
import download from 'src/external/download.js';
import MachineActionDetailOverlay from 'src/side_nav/components/machineActions/components/MachineActionDetailOverlay';
import ImportMachineActionFile from 'src/side_nav/components/machineActions/components/ImportMachineActionFile';

interface Props { }
interface State {
    filterByJob: string,
    filterByMaterial: string[],
    startTimeRangeOpen: boolean,
    endTimeRangeOpen: boolean,
    tableData: object[],
    filteredData: object[],
    overlay: boolean,
    startTime: string,
    endTime: string,
    editMode: boolean,
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    editRowId: string
    openAddUpdateMachineActionOverlay: boolean
    updateData: object
    spinnerLoading: RemoteDataState
    isLoading: boolean
    startTimeRange: object
    endTimeRange: object
    selectedDetailRow: object
    openMachineActionDetailOverlay: boolean
    currentIndex: number
    materials: object[]
    materialList: string[]
}

class MachineActionsPage extends PureComponent<Props, State> {
    private startDateTimeRangeRef = createRef<HTMLButtonElement>();
    private endDateTimeRangeRef = createRef<HTMLButtonElement>();
    private importButtonRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props);
        this.state = {
            filterByJob: "",
            filterByMaterial: [],
            startTimeRangeOpen: false,
            endTimeRangeOpen: false,
            tableData: [],
            filteredData: [],
            overlay: false,
            startTime: "",
            endTime: "",
            editMode: false,
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            editRowId: "",
            openAddUpdateMachineActionOverlay: false,
            updateData: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
            startTimeRange: {
                lower: new Date().toISOString(),
                upper: new Date().toISOString()
            },
            endTimeRange: {
                lower: new Date().toISOString(),
                upper: new Date().toISOString()
            },
            selectedDetailRow: {},
            openMachineActionDetailOverlay: false,
            currentIndex: 0,
            materials: [],
            materialList: [],
        };
    }

    async componentDidMount() {
        await this.getAllMachineActions();
        await this.getMaterials();
        this.setState({
            isLoading: true,
            spinnerLoading: RemoteDataState.Done,
        });
    }

    getMaterials = async () => {
        const materials = await FactoryService.getMaterials();
        const materialList = materials.map(material => material.materialName);
        this.setState({ materials, materialList, filterByMaterial: materialList });
    }

    getAllMachineActions = async () => {
        const payload = {
            "machineID": this.props["match"].params["MID"]
        };

        const machineActions = await FactoryService.getAllMachineActions(payload);

        this.setState({
            tableData: machineActions,
            filteredData: machineActions,
        });
    }

    getFilteredData = async () => {
        const tempFilteredRows = [];

        const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        const previousYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        const startLower = this.state.startTimeRange["lower"] === undefined ? previousYear : new Date(this.state.startTimeRange["lower"]);
        const startUpper = this.state.startTimeRange["upper"] === undefined ? nextYear : new Date(this.state.startTimeRange["upper"]);
        const endLower = this.state.endTimeRange["lower"] === undefined ? previousYear : new Date(this.state.endTimeRange["lower"]);
        const endUpper = this.state.endTimeRange["upper"] === undefined ? nextYear : new Date(this.state.endTimeRange["upper"]);

        this.state.tableData.forEach((row) => {
            let rowStartTime = new Date(row["startTime"]);
            let rowEndTime = row["endTime"] === "" || row["endTime"] === null ? Date.now() : new Date(row["endTime"]);

            if (row["jobName"].toLowerCase().includes(this.state.filterByJob.toLowerCase())
                && this.state.filterByMaterial.includes(row["material"]["materialName"])
                // && rowStartTime >= startLower && rowStartTime <= startUpper
                // && rowEndTime >= endLower && rowEndTime <= endUpper
            ) {
                tempFilteredRows.push(row);
            }
        })

        this.setState({
            filteredData: tempFilteredRows
        })
    }

    handleClickEditRow = (editRow) => {
        this.setState({
            editMode: true,
            updateData: editRow,
            openAddUpdateMachineActionOverlay: true,
        })
    }

    handleCloseImportDataForm = () => {
        this.setState({ overlay: false });
    }

    handleDismissAddUpdateMachineAction = () => {
        this.setState({
            openAddUpdateMachineActionOverlay: false,
            editMode: false,
        });
    }

    deleteMachineActionRecord = async (removeRow) => {
        const payload = {
            "recordId": removeRow._id.$oid
        }

        const result = await FactoryService.deleteMachineAction(payload);

        if (result.data.summary.code === 200) {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: result.data.message.text,
            });
            this.getAllMachineActions();
        }
    }

    handleChangeStartTimeRange = (e) => {
        this.setState({
            startTimeRangeOpen: false,
            startTimeRange: e,
        }, () => { this.getFilteredData() });
    }

    handleChangeEndTimeRange = (e) => {
        this.setState({
            endTimeRangeOpen: false,
            endTimeRange: e
        }, () => { this.getFilteredData() })
    }

    resetStartTimeRange = () => {
        this.setState({
            startTimeRange: {
                lower: Date.now(),
                upper: Date.now(),
            }
        }, () => this.getFilteredData());
    }

    resetEndTimeRange = () => {
        this.setState({
            endTimeRange: {
                lower: Date.now(),
                upper: Date.now(),
            }
        }, () => this.getFilteredData())
    }

    handleChangeExportType = (exportType) => {
        console.log(this.state.filteredData);

        if (exportType === "csv") {
            this.createCSV();
        } else if (exportType === "xlsx") {
            this.createXLSX();
        }
    }

    createCSV = () => {
        const { filteredData } = this.state;
        let now = new Date().toISOString();
        let headers = ["Job,Material,Start Time,End Time, Description"];

        let data = filteredData.map(item => {
            return [item['jobName'], item['material'], item["startTime"], item["endTime"], item['jobDescription']];
        });

        let csv = dataToCSV([headers, ...data]);

        try {
            download(csv, `machine-action-${now}.csv`, 'text/plain')
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
        let headers = ["Job,Material,Start Time,End Time, Description"];

        let data = filteredData.map(item => {
            return [item['jobName'], item['material'], item["startTime"], item["endTime"], item['jobDescription']];
        })

        let xlsx = dataToXLSX([headers, ...data]);

        try {
            download(xlsx, `machine-action-${now}.xlsx`, 'text/plain')
        } catch (error) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: error,
            });
        }
    }

    handleDetailSelectedRow = (row) => {
        const currentIndex = this.state.tableData.findIndex(item => item === row);

        this.setState({
            selectedDetailRow: row,
            openMachineActionDetailOverlay: true,
            currentIndex,
        })
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>, () => { this.getFilteredData() });
        }
    }

    private get optionsComponents(): JSX.Element {
        return (
            <React.Fragment>
                <FlexBox margin={ComponentSize.Small} >
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
                        text={
                            `
                            ${new Date(this.state.startTimeRange["lower"]).toISOString().slice(0, 10)} - 
                            ${new Date(this.state.startTimeRange["upper"]).toISOString().slice(0, 10)}
                            `
                        }
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


                    <p style={{ fontSize: '12px', fontWeight: 600 }}>End Time Range</p>
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
                        text={
                            `
                            ${new Date(this.state.endTimeRange["lower"]).toISOString().slice(0, 10)} - 
                            ${new Date(this.state.endTimeRange["upper"]).toISOString().slice(0, 10)}
                            `
                        }
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

    handleDismissMachineActionDetail = () => {
        this.setState({
            openMachineActionDetailOverlay: false
        })
    }

    handleChangeDropdownMaterial = (option: string) => {
        const { filterByMaterial } = this.state
        const optionExists = filterByMaterial.find(opt => opt === option)
        let updatedOptions = filterByMaterial

        if (optionExists) {
            updatedOptions = filterByMaterial.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filterByMaterial, option]
        }

        this.setState({ filterByMaterial: updatedOptions }, () => this.getFilteredData())
    }

    render() {
        const { spinnerLoading, isLoading } = this.state;

        return (
            <Page>
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
                                <Page.Title title={"Machine Actions"} />
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
                                <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/machines/${this.props["match"].params["FID"]}`}>
                                    Machines
                                </Link>

                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Machine Actions</Typography>
                            </Breadcrumbs>

                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid.Column widthXS={Columns.One}>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Ten}>
                                    <Grid style={{ marginTop: "50px", marginBottom: '100px', background: '#292933', padding: '20px' }}>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <Input
                                                    icon={IconFont.Search}
                                                    name="filterByJob"
                                                    placeholder="Filter by job"
                                                    value={this.state.filterByJob}
                                                    onChange={(e) => { this.handleChangeInput(e) }}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <MultiSelectDropdown
                                                    emptyText={"Select Material"}
                                                    options={this.state.materialList}
                                                    selectedOptions={this.state.filterByMaterial}
                                                    onSelect={this.handleChangeDropdownMaterial}
                                                />
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
                                                            <Table.HeaderCell style={{ width: "200px" }}>Job</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "200px" }}>Material</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}>Start Time</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}>End Time</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "200px" }}>Description</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}></Table.HeaderCell>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {
                                                            this.state.filteredData.map(row => {
                                                                let recordId = row["_id"]["$oid"];
                                                                return (
                                                                    <Table.Row key={recordId}>
                                                                        <Table.Cell>{row["jobName"]}</Table.Cell>
                                                                        <Table.Cell>{row["material"]["materialName"]}</Table.Cell>
                                                                        <Table.Cell>{row["startTime"]}</Table.Cell>
                                                                        <Table.Cell>{row["endTime"]}</Table.Cell>
                                                                        <Table.Cell>
                                                                            {String(row["jobDescription"]).substring(0, 50)}</Table.Cell>
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
                                                                                        onConfirm={() => { this.deleteMachineActionRecord(row) }}
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
                                                            <p>Import in this order: machineID, jobName, material, startTime, endTime, jobDescription</p>
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
                                                            onClick={() => { this.setState({ openAddUpdateMachineActionOverlay: true, editMode: false }) }}
                                                        />
                                                    }
                                                </FlexBox>
                                            </div>
                                        </Grid.Row>

                                    </Grid>
                                </Grid.Column>

                                <ImportMachineActionFile
                                    overlay={this.state.overlay}
                                    onClose={this.handleCloseImportDataForm}
                                    getAllMachineActions={this.getAllMachineActions}
                                    setNotificationData={this.setNotificationData}
                                    fileTypesToAccept=".csv, .xlsx"
                                    orgID={this.props["match"].params["orgID"]}
                                />

                                <MachineActionDetailOverlay
                                    visibleMachineActionOverlay={this.state.openMachineActionDetailOverlay}
                                    handleDismissMachineActionDetail={this.handleDismissMachineActionDetail}
                                    selectedDetailRow={this.state.selectedDetailRow}
                                    tableData={this.state.tableData}
                                    currentIndex={this.state.currentIndex}
                                />

                                <AddUpdateMachineActionOverlay
                                    visibleAddUpdateMachineAction={this.state.openAddUpdateMachineActionOverlay}
                                    handleDismissAddUpdateMachineAction={this.handleDismissAddUpdateMachineAction}
                                    getAllMachineActions={this.getAllMachineActions}
                                    isEdit={this.state.editMode}
                                    updateData={this.state.updateData}
                                    machineID={this.props["match"].params["MID"]}
                                    getMaterials={this.getMaterials}
                                    materials={this.state.materials}
                                />
                            </Page.Contents>
                        </React.Fragment>
                    )
                }
            </Page>
        )
    }
}

export default MachineActionsPage;