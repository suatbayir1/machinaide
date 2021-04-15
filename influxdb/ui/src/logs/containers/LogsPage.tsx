import React, { PureComponent, createRef } from "react";
import {
    Page,
    Grid,
    Columns,
    IconFont,
    ComponentColor,
    ComponentSize,
    FlexBox,
    Input,
    Table,
    DapperScrollbars,
    BorderType,
    MultiSelectDropdown,
    PopoverInteraction,
    Button,
    ButtonType,
    Popover,
    Appearance,
    DateRangePicker,
    SquareButton,
    PopoverPosition,
    Dropdown,
    SpinnerContainer,
    TechnoSpinner,
    SelectDropdown,
    RemoteDataState,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import LogService from 'src/shared/services/LogService';
import Pagination from "@material-ui/lab/Pagination";
import { withStyles } from "@material-ui/core/styles";
import { dataToCSV, dataToXLSX } from 'src/shared/parsing/dataToCsv';
import download from 'src/external/download.js';
import LogsDetailDialog from 'src/logs/components/LogsDetailDialog';

const styles = theme => ({
    root: {
        backgroundColor: "red"
    },
    ul: {
        "& .MuiPaginationItem-root": {
            color: "#fff"
        }
    }
});

interface State {
    rows: object[]
    filteredRows: object[]
    page: number
    rowsPerPage: string
    filterHardware: string
    filteredModel: string[]
    startTimeRangeOpen: boolean
    startTimeRange: object,
    spinnerLoading: RemoteDataState,
    isLoading: boolean,
    filteredRequestType: string[]
    filteredLogType: string[]
    filteredStatus: string[]
    filterIP: string
    filterUsername: string
    filterEndpoint: string
    totalRecordCount: number
    openLogsDetailDiloag: boolean
    selectedRowData: object
}

interface Props { }

class LogsPage extends PureComponent<Props, State> {
    private startDateTimeRangeRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props);
        this.state = {
            rows: [],
            filteredRows: [],
            page: 1,
            rowsPerPage: "10",
            filterHardware: "",
            filteredModel: ["K-means", "Isolation Forest", "ARIMA"],
            startTimeRangeOpen: false,
            startTimeRange: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
            filterIP: "",
            filterUsername: "",
            filterEndpoint: "",
            filteredRequestType: ["GET", "POST", "PUT", "DELETE"],
            filteredLogType: ["INFO", "ERROR", "WARNING", "DUPLICATED"],
            filteredStatus: ["200", "400", "401", "404", "409"],
            totalRecordCount: 0,
            openLogsDetailDiloag: false,
            selectedRowData: {},
        };
    }

    async componentDidMount() {
        await this.allLogs();
        this.setState({
            isLoading: true,
            spinnerLoading: RemoteDataState.Done,
        });
    }

    allLogs = async () => {
        const payload = {
            "skip": 0,
            "limit": 10
        };

        const { result, total_count } = await LogService.getLogs(payload);

        this.setState({
            rows: result,
            filteredRows: result,
            totalRecordCount: total_count,
        })
    }

    handlePageClick = (event, value) => {
        this.setState({
            page: value,
        }, () => this.handleFilterData());
    }

    handleChangeDropdownRequestType = (option: string) => {
        const { filteredRequestType } = this.state
        const optionExists = filteredRequestType.find(opt => opt === option)
        let updatedOptions = filteredRequestType

        if (optionExists) {
            updatedOptions = filteredRequestType.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filteredRequestType, option]
        }

        this.setState({ filteredRequestType: updatedOptions }, () => this.handleFilterData())
    }

    handleChangeDropdownLogType = (option: string) => {
        const { filteredLogType } = this.state
        const optionExists = filteredLogType.find(opt => opt === option)
        let updatedOptions = filteredLogType

        if (optionExists) {
            updatedOptions = filteredLogType.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filteredLogType, option]
        }

        this.setState({ filteredLogType: updatedOptions }, () => this.handleFilterData())
    }

    handleChangeDropdownStatus = (option: string) => {
        const { filteredStatus } = this.state
        const optionExists = filteredStatus.find(opt => opt === option)
        let updatedOptions = filteredStatus

        if (optionExists) {
            updatedOptions = filteredStatus.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filteredStatus, option]
        }

        this.setState({ filteredStatus: updatedOptions }, () => this.handleFilterData())
    }

    handleFilterData = async () => {
        const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        const previousYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

        const startLower = this.state.startTimeRange.lower === undefined ? previousYear : new Date(this.state.startTimeRange.lower);
        const startUpper = this.state.startTimeRange.upper === undefined ? nextYear : new Date(this.state.startTimeRange.upper);

        let intStatus = this.state.filteredStatus.map(function (item) {
            return parseInt(item, 10);
        });

        const payload = {
            "ip": this.state.filterIP !== "" ? this.state.filterIP : "",
            "username": this.state.filterUsername !== "" ? this.state.filterUsername : "",
            "endpoint": this.state.filterEndpoint !== "" ? this.state.filterEndpoint : "",
            "request_type": this.state.filteredRequestType,
            "log_type": this.state.filteredLogType,
            "status": intStatus,
            "limit": Number(this.state.rowsPerPage),
            "skip": (this.state.page - 1) * Number(this.state.rowsPerPage),
            "startTime": startLower,
            "endTime": startUpper,
        }

        const { result, total_count } = await LogService.getLogs(payload);

        this.setState({
            rows: result,
            filteredRows: result,
            totalRecordCount: total_count,
        })
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>, () => { this.handleFilterData() });
        }
    }

    handleChangeExportType = (exportType) => {
        if (exportType === "csv") {
            this.createCSV();
        } else if (exportType === "xlsx") {
            this.createXLSX();
        }
    }

    createCSV = () => {
        const { filteredRows } = this.state;
        let now = new Date().toISOString();
        let headers = ["IP,Username,Request Type,Log Type,Status,Endpoint,Time,Payload"];

        let data = filteredRows.map(item => {
            return [item['ip'], item['username'], item['request_type'], item['log_type'], item['status'], item['endpoint'], item['time'], item['payload']];
        });

        let csv = dataToCSV([headers, ...data]);

        try {
            download(csv, `failures-${now}.csv`, 'text/plain')
        } catch (error) {
            console.error("error", error);
        }
    }

    createXLSX = () => {
        const { filteredRows } = this.state;
        let now = new Date().toISOString();
        let headers = ["IP,Username,Request Type,Log Type,Status,Endpoint,Time,Payload"];

        let data = filteredRows.map(item => {
            return [item['ip'], item['username'], item['request_type'], item['log_type'], item['status'], item['endpoint'], item['time'], item['payload']];
        })

        let xlsx = dataToXLSX([headers, ...data]);

        try {
            download(xlsx, `failures-${now}.xlsx`, 'text/plain')
        } catch (error) {
            console.error("error", error);
        }
    }

    handleChangePageRows = (event) => {
        this.setState({
            rowsPerPage: event
        }, () => this.handleFilterData());
    };

    handleChangeTimeRange = (e) => {
        this.setState({
            startTimeRangeOpen: false,
            startTimeRange: e,
        }, () => { this.handleFilterData() });
    }

    resetStartTimeRange = () => {
        const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        const previousYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

        this.setState({
            startTimeRange: {
                lower: previousYear,
                upper: nextYear,
            }
        }, () => this.handleFilterData());
    }

    handleClickEditRow = (row) => {
        this.setState({
            openLogsDetailDiloag: true,
            selectedRowData: row,
        });
    }

    closeLogsDetailDialog = () => {
        this.setState({
            openLogsDetailDiloag: false,
            selectedRowData: {},
        });
    }

    private get optionsComponents(): JSX.Element {
        return (
            <React.Fragment>
                <FlexBox margin={ComponentSize.Small} style={{ marginRight: '10%' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600 }}>Time Range</p>
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
                                onSetTimeRange={(e) => { this.handleChangeTimeRange(e) }}
                                onClose={() => { this.setState({ startTimeRangeOpen: false }) }}
                                position={
                                    { position: 'relative' }
                                }
                            />
                        )}
                    />
                    <Button
                        ref={this.startDateTimeRangeRef}
                        text="Time Range"
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

    render() {
        const { classes } = this.props;

        return (
            <Page>
                {
                    <SpinnerContainer
                        loading={this.state.spinnerLoading}
                        spinnerComponent={<TechnoSpinner />}
                    >
                    </SpinnerContainer>
                }

                {
                    this.state.isLoading && (
                        <React.Fragment>
                            <Page.Header fullWidth={true}>
                                <Page.Title title={"Logs Page"} />
                                {
                                    this.optionsComponents
                                }
                            </Page.Header>

                            <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                                <Link color="inherit" to="/">
                                    <HomeIcon style={{ marginTop: '4px' }} />
                                </Link>
                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Logs</Typography>
                            </Breadcrumbs>

                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid.Column widthXS={Columns.One}>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Ten}>
                                    <Grid style={{ marginTop: "50px", marginBottom: '100px', background: '#292933', padding: '20px' }}>
                                        <Grid.Row style={{ marginTop: '20px' }}>
                                            <Grid.Column widthXS={Columns.Two}>
                                                <Input
                                                    icon={IconFont.Search}
                                                    name="filterIP"
                                                    placeholder="Filter by IP"
                                                    value={this.state.filterIP}
                                                    onChange={(e) => { this.handleChangeInput(e) }}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Two}>
                                                <Input
                                                    icon={IconFont.Search}
                                                    name="filterUsername"
                                                    placeholder="Filter by username"
                                                    value={this.state.filterUsername}
                                                    onChange={(e) => { this.handleChangeInput(e) }}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.One}>
                                                <MultiSelectDropdown
                                                    emptyText={"Select Request Type"}
                                                    options={["GET", "POST", "PUT", "DELETE"]}
                                                    selectedOptions={this.state.filteredRequestType}
                                                    onSelect={this.handleChangeDropdownRequestType}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.One}>
                                                <MultiSelectDropdown
                                                    emptyText={"Select Log Type"}
                                                    options={["INFO", "ERROR", "WARNING", "DUPLICATED"]}
                                                    selectedOptions={this.state.filteredLogType}
                                                    onSelect={this.handleChangeDropdownLogType}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.One}>
                                                <MultiSelectDropdown
                                                    emptyText={"Select Status"}
                                                    options={["200", "400", "401", "404", "409"]}
                                                    selectedOptions={this.state.filteredStatus}
                                                    onSelect={this.handleChangeDropdownStatus}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Two}>
                                                <Input
                                                    icon={IconFont.Search}
                                                    name="filterEndpoint"
                                                    placeholder="Filter by endpoint"
                                                    value={this.state.filterEndpoint}
                                                    onChange={(e) => { this.handleChangeInput(e) }}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.One}>
                                                <Dropdown
                                                    button={(active, onClick) => (
                                                        <Dropdown.Button
                                                            active={active}
                                                            onClick={onClick}
                                                            color={ComponentColor.Primary}
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
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row style={{ marginTop: '10px' }}>
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true}
                                                style={{ maxHeight: '450px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                <Table
                                                    borders={BorderType.Vertical}
                                                    fontSize={ComponentSize.ExtraSmall}
                                                    cellPadding={ComponentSize.ExtraSmall}
                                                >
                                                    <Table.Header>
                                                        <Table.Row>
                                                            <Table.HeaderCell style={{ width: "150px" }}>IP</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "160px" }}>Username</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "80px" }}>Request Type</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "70px" }}>Log Type</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "80px" }}>Status</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "120px" }}>Endpoint</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}>Time</Table.HeaderCell>
                                                            {/* <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell> */}
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {
                                                            this.state.filteredRows.map(row => {
                                                                let recordId = row["_id"]["$oid"];
                                                                return (
                                                                    <Table.Row key={recordId}>
                                                                        <Table.Cell>{row["ip"]}</Table.Cell>
                                                                        <Table.Cell>{row["username"]}</Table.Cell>
                                                                        <Table.Cell>{row["request_type"]}</Table.Cell>
                                                                        <Table.Cell>{row["log_type"]}</Table.Cell>
                                                                        <Table.Cell>{row["status"]}</Table.Cell>
                                                                        <Table.Cell>{row["endpoint"]}</Table.Cell>
                                                                        <Table.Cell>{row["time"]}</Table.Cell>
                                                                        {/* <Table.Cell>
                                                                            <Button
                                                                                size={ComponentSize.ExtraSmall}
                                                                                icon={IconFont.Pencil}
                                                                                color={ComponentColor.Primary}
                                                                                type={ButtonType.Submit}
                                                                                onClick={() => { this.handleClickEditRow(row) }}
                                                                            />
                                                                        </Table.Cell> */}
                                                                    </Table.Row>
                                                                )
                                                            })
                                                        }
                                                    </Table.Body>
                                                </Table>
                                            </DapperScrollbars>

                                            <div style={{ float: 'right', marginTop: '20px' }}>
                                                <FlexBox margin={ComponentSize.Small}>
                                                    <h5>Rows per page:</h5>

                                                    <div style={{ width: '70px' }}>
                                                        <SelectDropdown
                                                            options={["5", "10", "25", "50", "100"]}
                                                            selectedOption={this.state.rowsPerPage}
                                                            onSelect={(e) => { this.handleChangePageRows(e) }}
                                                        />
                                                    </div>

                                                    <h5 style={{ marginLeft: '10px' }}>Total row count: {this.state.totalRecordCount}</h5>

                                                    <Pagination
                                                        className={classes.ul}
                                                        size={"large"}
                                                        count={Math.ceil(this.state.totalRecordCount / Number(this.state.rowsPerPage))}
                                                        color="primary"
                                                        page={this.state.page}
                                                        onChange={this.handlePageClick}
                                                    />
                                                </FlexBox>
                                            </div>
                                        </Grid.Row>
                                    </Grid>
                                </Grid.Column>

                                {/* <LogsDetailDialog
                                    openLogsDetailDialog={this.state.openLogsDetailDiloag}
                                    handleDismissLogsDetailDialog={this.closeLogsDetailDialog}
                                    selectedRowData={this.state.selectedRowData}
                                /> */}
                            </Page.Contents>
                        </React.Fragment>
                    )
                }
            </Page >
        )
    }
}

export default withStyles(styles, { withTheme: true })(LogsPage);