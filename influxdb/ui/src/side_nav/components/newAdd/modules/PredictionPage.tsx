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
    RemoteDataState,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import IconButton from '@material-ui/core/IconButton';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import PredictionService from 'src/shared/services/PredictionService';
import { dataToCSV, dataToXLSX } from 'src/shared/parsing/dataToCsv';
import download from 'src/external/download.js';


interface State {
    rows: object[]
    filteredRows: object[]
    page: number
    rowsPerPage: number
    filterHardware: string
    filteredModel: string[]
    startTimeRangeOpen: boolean
    startTimeRange: object,
    spinnerLoading: RemoteDataState,
    isLoading: boolean,
}

interface Props { }

class PredictionPage extends PureComponent<Props, State> {
    private startDateTimeRangeRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props);
        this.state = {
            rows: [],
            filteredRows: [],
            page: 0,
            rowsPerPage: 5,
            filterHardware: "",
            filteredModel: ["K-means", "Isolation Forest", "ARIMA"],
            startTimeRangeOpen: false,
            startTimeRange: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
        };
    }

    async componentDidMount() {
        await this.getAllPredictions();
        this.setState({
            isLoading: true,
            spinnerLoading: RemoteDataState.Done,
        });
    }

    getAllPredictions = async () => {
        const predictionList = await PredictionService.getAllPredictions();
        this.setState({
            rows: predictionList,
            filteredRows: predictionList,
        })
    }

    handleChangeStartTimeRange = (e) => {
        this.setState({
            startTimeRangeOpen: false,
            startTimeRange: e,
        }, () => { this.handleFilterData() });
    }

    handleFilterData = () => {
        const tempFilteredRows = [];

        const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        const previousYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        const startLower = this.state.startTimeRange.lower === undefined ? previousYear : new Date(this.state.startTimeRange.lower);
        const startUpper = this.state.startTimeRange.upper === undefined ? nextYear : new Date(this.state.startTimeRange.upper);

        this.state.rows.map(row => {
            let rowStartTime = new Date(row["time"]);

            if (row["hardwares"].toLowerCase().includes(this.state.filterHardware.toLowerCase())
                && this.state.filteredModel.includes(row["algorithm"])
                && rowStartTime >= startLower && rowStartTime <= startUpper
            ) {
                tempFilteredRows.push(row);
            }
        })

        this.setState({
            filteredRows: tempFilteredRows,
        })
    }

    resetStartTimeRange = () => {
        this.setState({
            startTimeRange: {
                lower: Date.now(),
                upper: Date.now(),
            }
        }, () => this.handleFilterData());
    }

    handleChangeFilterHardware = (e) => {
        this.setState({
            filterHardware: e,
        }, () => this.handleFilterData())
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
        let headers = ["Model Name, Model Version, Algorithm, Hardwares, Confidence, Timestamp, Days To Fail"];

        let data = filteredRows.map(row => {
            let timestamp = row['time'] ? new Date(row["time"]) : "";
            return [row['modelName'], row['modelVersion'], row['algorithm'], row['hardwares'], row['confidence'], timestamp, row['daysToFail']];
        });

        let csv = dataToCSV([headers, ...data]);

        try {
            download(csv, `predictions-${now}.csv`, 'text/plain')
        } catch (error) {
            console.log(error);
        }
    }

    createXLSX = () => {
        const { filteredRows } = this.state;
        let now = new Date().toISOString();
        let headers = ["Model Name, Model Version, Algorithm, Hardwares, Confidence, Timestamp, Days To Fail"];

        let data = filteredRows.map(row => {
            let timestamp = row['time'] ? new Date(row["time"]) : "";
            return [row['modelName'], row['modelVersion'], row['algorithm'], row['hardwares'], row['confidence'], timestamp, row['daysToFail']];
        })

        let xlsx = dataToXLSX([headers, ...data]);

        try {
            download(xlsx, `predictions-${now}.xlsx`, 'text/plain')
        } catch (error) {
            console.log(error);
        }
    }

    handleChangeDropdownFilter = (option: string) => {
        const { filteredModel } = this.state
        const optionExists = filteredModel.find(opt => opt === option)
        let updatedOptions = filteredModel

        if (optionExists) {
            updatedOptions = filteredModel.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filteredModel, option]
        }

        this.setState({ filteredModel: updatedOptions }, () => this.handleFilterData())
    }

    private get optionsComponents(): JSX.Element {
        return (
            <React.Fragment>
                <FlexBox margin={ComponentSize.Small}>
                    <p style={{ fontSize: '12px', fontWeight: 600 }}>Timestamp</p>
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
                        text="Time Stamp"
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
        const exportList =
            (
                <React.Fragment>
                    <Dropdown.Item
                        id={'csv'}
                        key={'csv'}
                        value={'csv'}
                        onClick={this.handleChangeExportType}
                    >
                        {'csv'}
                    </Dropdown.Item>
                    <Dropdown.Item
                        id={'xlsx'}
                        key={'xlsx'}
                        value={'xlsx'}
                        onClick={this.handleChangeExportType}
                    >
                        {'xlsx'}
                    </Dropdown.Item>
                </React.Fragment>
            );

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
                                <Page.Title title={"Predictions"} />
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
                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Predictions</Typography>
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
                                                    name="filterHardware"
                                                    placeholder="Filter by hardware"
                                                    onChange={(e) => { this.handleChangeFilterHardware(e.target.value) }}
                                                    value={this.state.filterHardware}
                                                />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Two}>
                                                <MultiSelectDropdown
                                                    emptyText={"Select ML Algorithm"}
                                                    options={["K-means", "Isolation Forest", "ARIMA"]}
                                                    selectedOptions={this.state.filteredModel}
                                                    onSelect={this.handleChangeDropdownFilter}
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
                                                            <Table.HeaderCell style={{ width: "200px" }}>Model Name</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "50px" }}>Model Version</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}>Algorithm</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "200px" }}>Hardwares</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}>Confidence</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "200px" }}>Timestamp</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}>Days to fail</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "200px" }}></Table.HeaderCell>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {
                                                            this.state.filteredRows.map(row => {
                                                                let recordId = row["_id"]["$oid"];
                                                                return (
                                                                    <Table.Row key={recordId}>
                                                                        <Table.Cell>{row["modelName"]}</Table.Cell>
                                                                        <Table.Cell>{row["modelVersion"]}</Table.Cell>
                                                                        <Table.Cell>{row["algorithm"]}</Table.Cell>
                                                                        <Table.Cell>{row["hardwares"]}</Table.Cell>
                                                                        <Table.Cell>%{row["confidence"]}</Table.Cell>
                                                                        <Table.Cell>{row["time"]}</Table.Cell>
                                                                        <Table.Cell>{row["daysToFail"]} days</Table.Cell>
                                                                        <Table.Cell>
                                                                            <FlexBox margin={ComponentSize.Medium} >
                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/predictions/:SID/${row["modelID"]}`}>
                                                                                    <IconButton
                                                                                        aria-label="delete"
                                                                                        style={{ color: '#22ADF6', paddingTop: '0px', paddingBottom: '0px' }}
                                                                                    >
                                                                                        <AccessTimeIcon />
                                                                                    </IconButton>
                                                                                </Link>
                                                                                <QuestionMarkTooltip
                                                                                    diameter={20}
                                                                                    tooltipStyle={{ width: '100px' }}
                                                                                    color={ComponentColor.Primary}
                                                                                    style={{ background: '#22ADF6' }}
                                                                                    tooltipContents="Info"
                                                                                />
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

export default PredictionPage;