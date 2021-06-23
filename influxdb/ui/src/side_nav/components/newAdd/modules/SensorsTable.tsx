import React, { PureComponent } from "react";
import {
    Page,
    Grid,
    Columns,
    IconFont,
    Input,
    SpinnerContainer,
    TechnoSpinner,
    RemoteDataState,
    Table,
    DapperScrollbars,
    BorderType,
    ComponentSize,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import IconButton from '@material-ui/core/IconButton';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import FactoryService from 'src/shared/services/FactoryService';
import DashboardIcon from '@material-ui/icons/Dashboard';

interface State {
    columns: object[]
    rows: object[]
    filteredRows: object[]
    page: number
    rowsPerPage: number
    filterName: string
    filterType: string
    filterSensorStatus: string
    spinnerLoading: RemoteDataState
    isLoading: boolean
}

interface Props { }

class SensorsTable extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            columns: [
                { id: 'id', label: 'Id', minWidth: 170 },
                { id: 'displayName', label: 'Display Name', minWidth: 100 },
                { id: 'type', label: 'Type', minWidth: 100 },
                { id: 'sensorType', label: 'Sensor Type', minWidth: 100 },
                { id: 'unit', label: 'Unit', minWidth: 100 },
                { id: 'sensorStatus', label: 'Sensor Status', minWidth: 100 },
                { id: 'last24h', label: 'last 24h', minWidth: 100 },
                { id: 'last7d', label: 'last 7d', minWidth: 100 },
                { id: 'last30d', label: 'last 30d', minWidth: 100 },
                { id: 'showAll', label: 'Show All', minWidth: 100 },
            ],
            rows: [],
            filteredRows: [],
            page: 0,
            rowsPerPage: 5,
            filterName: "",
            filterType: "",
            filterSensorStatus: "",
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
        };
    }

    async componentDidMount() {
        console.log(this.props);
        await this.getAllSensors();
    }

    getAllSensors = async () => {
        const payload = {
            "factoryId": this.props["match"].params.FID,
            "plId": this.props["match"].params.PLID,
            "machineId": this.props["match"].params.MID,
            "componentId": this.props["match"].params.CID,
        }

        const sensors = await FactoryService.getSensors(payload);

        this.setState({
            rows: sensors,
            filteredRows: sensors,
            spinnerLoading: RemoteDataState.Done,
            isLoading: true,
        })
    }

    handleChangePage = (_, newPage) => {
        this.setState({ page: newPage })
    };

    handleChangeRowsPerPage = (event) => {
        this.setState({
            rowsPerPage: event.target.value,
            page: 0,
        })
    };

    handleSensorsFilter = () => {
        const tempFilteredRows = [];

        this.state.rows.forEach((row) => {
            if (row["displayName"].toLowerCase().includes(this.state.filterName.toLowerCase())
                && row["sensorType"].toLowerCase().includes(this.state.filterType.toLowerCase())
                && row["sensorStatus"].toLowerCase().includes(this.state.filterSensorStatus.toLowerCase())
            ) {
                console.log(row);
                tempFilteredRows.push(row);
            }
        })

        this.setState({
            filteredRows: tempFilteredRows
        })
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>, () => { this.handleSensorsFilter() });
        }
    }

    render() {
        const { filteredRows, spinnerLoading, isLoading } = this.state;

        return (
            <Page>
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
                                <Page.Title title={"Sensors"} />
                            </Page.Header>

                            <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                                <Link color="inherit" to="/">
                                    <HomeIcon style={{ marginTop: '4px' }} />
                                </Link>
                                <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/allFactories`}>
                                    Factories
                                </Link>
                                <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/production-line/${this.props["match"].params.FID}/${this.props["match"].params.PLID}`}>
                                    Production Lines
                                </Link>
                                <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/machines/${this.props["match"].params.FID}/${this.props["match"].params.PLID}`}>
                                    Machines
                                </Link>
                                <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/components/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${this.props["match"].params.MID}`}>
                                    Components
                                </Link>
                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Sensors</Typography>
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
                                                    name="filterName"
                                                    placeholder="Filter by name"
                                                    onChange={this.handleChangeInput}
                                                    value={this.state.filterName}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Two}>
                                                <Input
                                                    icon={IconFont.Search}
                                                    name="filterType"
                                                    placeholder="Filter by type"
                                                    onChange={this.handleChangeInput}
                                                    value={this.state.filterType}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Two}>
                                                <Input
                                                    icon={IconFont.Search}
                                                    name="filterSensorStatus"
                                                    placeholder="Filter by sensor status"
                                                    onChange={this.handleChangeInput}
                                                    value={this.state.filterSensorStatus}
                                                />
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row style={{ marginTop: '10px' }}>
                                            {
                                                filteredRows.length > 0 ? (
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
                                                                    <Table.HeaderCell style={{ width: "150px" }}>Display Name</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{ width: "100px" }}>Type</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{ width: "100px" }}>Sensor Type</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{ width: "50px" }}>Unit</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{ width: "50px" }}>Sensor Status</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{ width: "50px" }}>last 24h</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{ width: "50px" }}>lasth 7d</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{ width: "50px" }}>lasth 30d</Table.HeaderCell>
                                                                    <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell>
                                                                </Table.Row>
                                                            </Table.Header>
                                                            <Table.Body>
                                                                {
                                                                    filteredRows.map(row => {
                                                                        return (
                                                                            <Table.Row key={row["id"]}>
                                                                                <Table.Cell>{row["displayName"]}</Table.Cell>
                                                                                <Table.Cell>{row["type"]}</Table.Cell>
                                                                                <Table.Cell>{row["sensorType"]}</Table.Cell>
                                                                                <Table.Cell>{row["unit"]}</Table.Cell>
                                                                                <Table.Cell>{row["sensorStatus"]}</Table.Cell>
                                                                                <Table.Cell>0</Table.Cell>
                                                                                <Table.Cell>0</Table.Cell>
                                                                                <Table.Cell>0</Table.Cell>
                                                                                <Table.Cell>
                                                                                    <Link to={`/orgs/${this.props["match"].params["orgID"]}/alerting`}>
                                                                                        <IconButton
                                                                                            aria-label="delete"
                                                                                            style={{ color: '#22ADF6', paddingTop: '0px', paddingBottom: '0px' }}
                                                                                        >
                                                                                            <AccessTimeIcon />
                                                                                        </IconButton>
                                                                                    </Link>
                                                                                    <Link to={`/orgs/${this.props["match"].params["orgID"]}/dashboard-router/${row["id"]}`}>
                                                                                        <IconButton
                                                                                            aria-label="delete"
                                                                                            style={{ color: '#22ADF6', paddingTop: '0px', paddingBottom: '0px' }}
                                                                                        >
                                                                                            <DashboardIcon />
                                                                                        </IconButton>
                                                                                    </Link>
                                                                                </Table.Cell>
                                                                            </Table.Row>
                                                                        )
                                                                    })
                                                                }
                                                            </Table.Body>
                                                        </Table>
                                                    </DapperScrollbars>
                                                ) : (
                                                    <h1>A sensor for the specified conditions was not found</h1>
                                                )
                                            }
                                        </Grid.Row>
                                    </Grid>
                                </Grid.Column>
                            </Page.Contents>
                        </React.Fragment>
                    )
                }
            </Page >
        )
    }
}

export default SensorsTable;