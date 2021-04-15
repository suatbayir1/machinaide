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
    QuestionMarkTooltip,
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
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';

interface State {
    columns: object[]
    rows: object[]
    page: number
    rowsPerPage: number
    filterHardware: string
    filterByAlert: string[]
    filterBySeverity: string[]
    startTimeRangeOpen: boolean
}

interface Props { }

class AlertsPage extends PureComponent<Props, State> {
    private startDateTimeRangeRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props);
        this.state = {
            columns: [
                { id: 'id', label: 'Id', minWidth: 170 },
                { id: 'alertType', label: 'Alert Type', minWidth: 50 },
                { id: 'hardware', label: 'Hardware', minWidth: 300 },
                { id: 'severity', label: 'Severity', minWidth: 50 },
                { id: 'time', label: 'time', minWidth: 200 },
                { id: 'info', label: '', minWidth: 100 },
            ],
            rows: [
                { id: '1', alertType: 'name 1', hardware: 'type 1', severity: 'status 1', time: 'last 24h' },
                { id: '1', alertType: 'name 1', hardware: 'type 1', severity: 'status 1', time: 'last 24h' },
                { id: '1', alertType: 'name 1', hardware: 'type 1', severity: 'status 1', time: 'last 24h' },
                { id: '1', alertType: 'name 1', hardware: 'type 1', severity: 'status 1', time: 'last 24h' },
                { id: '1', alertType: 'name 1', hardware: 'type 1', severity: 'status 1', time: 'last 24h' },
                { id: '1', alertType: 'name 1', hardware: 'type 1', severity: 'status 1', time: 'last 24h' },
            ],
            page: 0,
            rowsPerPage: 5,
            filterHardware: "",
            filterByAlert: [],
            filterBySeverity: [],
            startTimeRangeOpen: false,
        };
    }

    handleChangePage = (event, newPage) => {
        this.setState({ page: newPage })
    };

    handleChangeRowsPerPage = (event) => {
        this.setState({
            rowsPerPage: event.target.value,
            page: 0,
        })
    };

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    handleChangeAlertType = (option: string) => {
        const { filterByAlert } = this.state
        const optionExists = filterByAlert.find(opt => opt === option)
        let updatedOptions = filterByAlert

        if (optionExists) {
            updatedOptions = filterByAlert.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filterByAlert, option]
        }

        this.setState({ filterByAlert: updatedOptions })
    }

    handleChangeSeverity = (option: string) => {
        const { filterBySeverity } = this.state
        const optionExists = filterBySeverity.find(opt => opt === option)
        let updatedOptions = filterBySeverity

        if (optionExists) {
            updatedOptions = filterBySeverity.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filterBySeverity, option]
        }

        this.setState({ filterBySeverity: updatedOptions })
    }

    private get optionsComponents(): JSX.Element {
        return (
            <React.Fragment>
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
                                timeRange={{
                                    upper: '',
                                    lower: '',
                                    seconds: 0,
                                    format: 'YYYY-MM-DD HH:mm:ss.SSS',
                                    label: 'my label',
                                }}
                                onSetTimeRange={() => {
                                    this.setState({ startTimeRangeOpen: false })
                                }}
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
                        onClick={() => { }}
                    />
                    {/* </FlexBox> */}
                </FlexBox>
            </React.Fragment>
        )
    }

    handleChangeExportType = (exportType) => {
        alert(exportType);
    }

    render() {
        const { columns, rows, page, rowsPerPage } = this.state;

        const exportList =
            (
                <React.Fragment>
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
                        id={'xls'}
                        key={'xls'}
                        value={'xls'}
                        onClick={this.handleChangeExportType}
                    >
                        {'xls'}
                    </Dropdown.Item>
                </React.Fragment>
            );


        return (
            <Page>
                <Page.Header fullWidth={true}>
                    <Page.Title title={"Alerts Table"} />
                    {
                        this.optionsComponents
                    }
                </Page.Header>

                <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                    <Link color="inherit" to="/">
                        <HomeIcon style={{ marginTop: '4px' }} />
                    </Link>
                    <Link color="inherit" to={`/orgs/${this.props.match.params["orgID"]}/allFactories`}>
                        Factories
                        </Link>
                    <Link color="inherit" to={`/orgs/${this.props.match.params["orgID"]}/machines/<factoryID>`}>
                        Machines
                        </Link>
                    <Link color="inherit" to={`/orgs/${this.props.match.params["orgID"]}/machines/<factoryID>/<machineID>`}>
                        Components
                        </Link>
                    <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Alerts</Typography>
                </Breadcrumbs>

                <Page.Contents fullWidth={true} scrollable={true}>
                    <Grid>
                        <Grid.Row style={{ marginTop: '20px' }}>
                            <Grid.Column widthXS={Columns.Two}>
                                <Input
                                    icon={IconFont.Search}
                                    name="filterHardware"
                                    placeholder="Filter by hardware"
                                    onChange={this.handleChangeInput}
                                    value={this.state.filterHardware}
                                />
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Two}>
                                <MultiSelectDropdown
                                    emptyText={"Select Alert Type"}
                                    options={["deadman", "threshold", "relative", 'script', 'ml']}
                                    selectedOptions={this.state.filterByAlert}
                                    onSelect={this.handleChangeAlertType}
                                />
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.One}>
                                <MultiSelectDropdown
                                    emptyText={"Select Severity"}
                                    options={["minor", "major", "severe"]}
                                    selectedOptions={this.state.filterBySeverity}
                                    onSelect={this.handleChangeSeverity}
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
                                            {
                                                exportList
                                            }
                                        </Dropdown.Menu>
                                    )}
                                />
                            </Grid.Column>
                        </Grid.Row>

                        <Grid.Row style={{ marginTop: '10px' }}>
                            <Paper>
                                <TableContainer style={{ background: "#333" }}>
                                    <Table stickyHeader aria-label="sticky table">
                                        <TableHead style={{ background: '#000000 !important' }}>
                                            <TableRow>
                                                {columns.map((column) => {
                                                    if (!["id"].includes(column["id"])) {
                                                        return (
                                                            <TableCell
                                                                key={column.id}
                                                                align={column.align}
                                                                style={{
                                                                    minWidth: column.minWidth,
                                                                    background: "#000000",
                                                                    color: "#ffffff",
                                                                }}
                                                            >
                                                                {column.label}
                                                            </TableCell>
                                                        )
                                                    }
                                                })}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                                                return (
                                                    <TableRow
                                                        style={{
                                                            background: "#333",
                                                        }}
                                                        hover
                                                        role="checkbox" tabIndex={-1} key={row.id}
                                                    >
                                                        <TableCell align={row.align} style={{ color: "#fff" }}>
                                                            {row["alertType"]}
                                                        </TableCell>
                                                        <TableCell align={row.align} style={{ color: "#fff" }}>
                                                            {row["hardware"]}
                                                        </TableCell>
                                                        <TableCell align={row.align} style={{ color: "#fff" }}>
                                                            {row["severity"]}
                                                        </TableCell>
                                                        <TableCell align={row.align} style={{ color: "#fff" }}>
                                                            {row["time"]}
                                                        </TableCell>
                                                        <TableCell align={row.align} style={{ color: "#fff" }}>
                                                            <QuestionMarkTooltip
                                                                diameter={20}
                                                                tooltipStyle={{ width: '100px' }}
                                                                color={ComponentColor.Primary}
                                                                style={{ background: '#22ADF6' }}
                                                                tooltipContents="Info"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    style={{
                                        background: '#323232',
                                        color: "#fff",
                                    }}
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={rows.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onChangePage={this.handleChangePage}
                                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                                />
                            </Paper>
                        </Grid.Row>
                    </Grid>
                </Page.Contents>
            </Page >
        )
    }
}

export default AlertsPage;