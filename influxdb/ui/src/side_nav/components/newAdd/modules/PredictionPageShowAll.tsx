import React, { PureComponent, createRef } from "react";
import {
    Page,
    Grid,
    IconFont,
    ComponentColor,
    ComponentSize,
    FlexBox,
    PopoverInteraction,
    Button,
    ButtonType,
    Popover,
    Appearance,
    DateRangePicker,
    SquareButton,
    PopoverPosition,
    SelectDropdown,
    SlideToggle,
    Panel,
    Columns,
    InputLabel,
    Table,
    DapperScrollbars,
    BorderType,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
// import Paper from '@material-ui/core/Paper';
// import Table from '@material-ui/core/Table';
// import TableBody from '@material-ui/core/TableBody';
// import TableCell from '@material-ui/core/TableCell';
// import TableContainer from '@material-ui/core/TableContainer';
// import TableHead from '@material-ui/core/TableHead';
// import TablePagination from '@material-ui/core/TablePagination';
// import TableRow from '@material-ui/core/TableRow';
import PredictionService from 'src/shared/services/PredictionService';

interface State {
    rows: object[]
    page: number
    rowsPerPage: number
    filterHardware: string
    filteredModel: string[]
    startTimeRangeOpen: boolean
    feedbackType: string[]
    selectedFeedback: string
    displayStatus: boolean
    predictionInfo: object
    predictionModel: object
}

interface Props { }

class PredictionPageShowAll extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            rows: [
                { id: 1, time: 'time', explanation: 'description 1' }
            ],
            page: 0,
            rowsPerPage: 5,
            filterHardware: "",
            filteredModel: [],
            startTimeRangeOpen: false,
            feedbackType: ["neutral", "positive", "negative"],
            selectedFeedback: "neutral",
            displayStatus: false,
            predictionInfo: {},
            predictionModel: {},
        };
    }

    async componentDidMount() {
        await this.getPredictionInfo();
        await this.getPredictionModel();
    }

    getPredictionInfo = async () => {
        const payload = {
            "modelID": this.props.match.params.PID
        };

        const predictionInfo = await PredictionService.getPredictionInfo(payload);
        if (predictionInfo.length !== 0) {
            this.setState({
                predictionInfo: predictionInfo[0]
            })
        }
    }

    getPredictionModel = async () => {
        const payload = {
            "modelID": this.props.match.params.PID
        };

        const predictionModel = await PredictionService.getPredictionById(payload);
        if (predictionModel.length !== 0) {
            this.setState({
                predictionModel: predictionModel[0]
            })
        }
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

    render() {
        return (
            <Page>
                <Page.Header fullWidth={true}>
                    <Page.Title title={"Predictions"} />
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
                    <Link color="inherit" to={`/orgs/${this.props.match.params["orgID"]}/predictions/:SID`}>
                        Predictions
                        </Link>
                    <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Show All</Typography>
                </Breadcrumbs>

                <Page.Contents fullWidth={true} scrollable={true}>
                    <Grid.Column widthXS={Columns.One}>
                    </Grid.Column>

                    <Grid.Column widthXS={Columns.Ten}>

                        <Grid style={{ marginTop: "50px", marginBottom: '100px', background: '#292933', padding: '20px' }}>
                            <Grid.Row>
                                <FlexBox margin={ComponentSize.Small}>
                                    <SlideToggle
                                        color={ComponentColor.Success}
                                        active={this.state.displayStatus}
                                        size={ComponentSize.Small}
                                        onChange={() => this.setState({ displayStatus: !this.state.displayStatus })}
                                    />
                                    <InputLabel> Display Model Info</InputLabel>
                                </FlexBox>
                            </Grid.Row>

                            {
                                this.state.displayStatus &&
                                <Panel style={{ marginTop: '20px', fontSize: '15px', border: '2px solid #000000' }}>
                                    <Panel.Body size={ComponentSize.ExtraSmall}>
                                        <Grid.Row >
                                            <Grid.Column widthXS={Columns.Four}>
                                                <b>Model Name:</b> <i>{this.state.predictionModel.modelName} (version {this.state.predictionModel.modelVersion})</i><br /><br />
                                                <b>Model creator:</b> <i>{this.state.predictionInfo.creator}</i><br /><br />
                                                <b>Created date:</b> <i>{this.state.predictionInfo.createdDate}</i><br /><br />
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Four}>
                                                <b>Total Positive Feedback:</b> <i>{this.state.predictionInfo.totalFb.positive}</i><br /><br />
                                                <b>Total Negative Feedback:</b> <i>{this.state.predictionInfo.totalFb.negative}</i><br /><br />
                                                <b>Total Neutral Feedback:</b> <i>{this.state.predictionInfo.totalFb.neutral}</i>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Four}>
                                                <b>Related hardwares:</b><br />
                                                {
                                                    this.state.predictionInfo.releatedHardware.map((item, index) => (
                                                        <React.Fragment key={index}>
                                                            <i>{item}</i><br />
                                                        </React.Fragment>
                                                    ))
                                                }
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel.Body>
                                </Panel>
                            }

                            <Grid.Row style={{ marginTop: '20px' }}>
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
                                                <Table.HeaderCell style={{ width: "200px" }}>Time</Table.HeaderCell>
                                                <Table.HeaderCell style={{ width: "500px" }}>Explanation</Table.HeaderCell>
                                                <Table.HeaderCell style={{ width: "50px" }}>Feedback</Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {
                                                this.state.rows.map(row => {
                                                    return (
                                                        <Table.Row key={row["id"]}>
                                                            <Table.Cell>{row["time"]}</Table.Cell>
                                                            <Table.Cell>{row["explanation"]}</Table.Cell>
                                                            <Table.Cell>
                                                                <SelectDropdown
                                                                    options={this.state.feedbackType}
                                                                    selectedOption={this.state.selectedFeedback}
                                                                    onSelect={(e) => this.setState({ selectedFeedback: e })}
                                                                />
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
            </Page >
        )
    }
}

export default PredictionPageShowAll;