// Libraries
import React, { PureComponent } from "react";
import { Link } from "react-router-dom";

// Components
import {
    Page, Grid, Columns, FlexBox, ResourceCard, ComponentSize, FlexDirection, InfluxColors,
    SpinnerContainer, TechnoSpinner, RemoteDataState, QuestionMarkTooltip, ComponentColor,
    EmptyState, Button, ButtonType, IconFont,
} from '@influxdata/clockface'
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';

// Services
import FactoryService from 'src/shared/services/FactoryService';
import DTService from 'src/shared/services/DTService';
import DashboardService from 'src/shared/services/DashboardService';

// Constants
import {
    tipStyle, machinesPanel,
} from 'src/shared/constants/tips';

interface Props { }
interface State {
    machines: object[],
    hoveredMachine: object,
    spinnerLoading: RemoteDataState
    isLoading: boolean
}

class MachinesPanel extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            machines: [],
            hoveredMachine: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
        };
    }

    async componentDidMount() {
        await this.getAllMachines();
    }

    getAllMachines = async () => {
        const payload = {
            "factoryId": this.props["match"].params.FID,
            "plId": this.props["match"].params.PLID,
        };

        const machines = await FactoryService.getMachines(payload);
        const structure = await DTService.getAllDT();
        const dashboards = await DashboardService.getDTDashboards();

        let snapshots = [];
        machines.map(machine => {
            snapshots = [];
            // find component ids of all machines
            structure[0].productionLines.map(structurePL => {
                structurePL.machines.map(structureM => {
                    if (structureM["@id"] === machine["id"]) {
                        structureM.contents.map(structureC => {
                            if (structureC["@type"] === "Component") {
                                // find dashboard of component
                                dashboards.map(dashboard => {
                                    if (dashboard.dtID === `component-${structureC["@id"]}`) {
                                        snapshots.push({ "dashboardID": dashboard.dashboardID, "dashboardName": dashboard.name });
                                    }
                                })
                            }
                        })
                    }
                })
            })

            machine["dashboards"] = snapshots;
        })

        this.setState({
            machines: machines,
            spinnerLoading: RemoteDataState.Done,
            isLoading: true,
        });
    }

    handleOnMouseCard = (machine) => {
        this.setState({
            hoveredMachine: machine,
        })
    }

    handleLeaveMouseCard = () => {
        this.setState({
            hoveredMachine: {}
        })
    }

    render() {
        const { machines, spinnerLoading, isLoading } = this.state;

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
                                <Page.Title title={"Machines Panel"} />
                                <QuestionMarkTooltip
                                    diameter={30}
                                    tooltipStyle={{ width: '400px' }}
                                    color={ComponentColor.Secondary}
                                    tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                        <div style={{ color: InfluxColors.Star }}>{"About the Machines Panel:"}
                                            <hr style={tipStyle} />
                                        </div>
                                        {machinesPanel}
                                    </div>}
                                />
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
                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Machines</Typography>
                            </Breadcrumbs>

                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid>
                                    <Grid.Row>
                                        {
                                            machines.length > 0 ? machines.map((machine) => {
                                                return (
                                                    <Grid.Column
                                                        widthXS={Columns.Twelve}
                                                        widthSM={Columns.Six}
                                                        widthMD={Columns.Six}
                                                        widthLG={Columns.Four}
                                                        key={machine["id"]}
                                                        id="machine-panel"
                                                    >
                                                        <div
                                                            onMouseLeave={() => this.handleLeaveMouseCard()}
                                                            onMouseEnter={() => this.handleOnMouseCard(machine)}
                                                            key={machine["id"]}
                                                        >
                                                            <ResourceCard
                                                                key={machine["id"]}
                                                                className="resource-card"
                                                            >
                                                                <Grid.Row>
                                                                    <Grid.Column
                                                                        widthXS={Columns.Twelve}
                                                                        widthSM={Columns.Twelve}
                                                                        widthMD={Columns.Seven}
                                                                        widthLG={Columns.Seven}
                                                                    >
                                                                        <div>
                                                                            <img
                                                                                src="../../../../assets/images/machine-image.jpg"
                                                                                className="machine-image"
                                                                            />
                                                                        </div>
                                                                        <FlexBox margin={ComponentSize.Small}>
                                                                            <img
                                                                                src='../../../assets/icons/machine-card-icon.png'
                                                                                className="machine-icon"
                                                                            />
                                                                            <h2>
                                                                                {machine["machineName"]}
                                                                            </h2>
                                                                        </FlexBox>
                                                                    </Grid.Column>

                                                                    {
                                                                        this.state.hoveredMachine["id"] === machine["id"]
                                                                            ? (
                                                                                <Grid.Column
                                                                                    widthXS={Columns.Twelve}
                                                                                    widthSM={Columns.Twelve}
                                                                                    widthMD={Columns.Five}
                                                                                    widthLG={Columns.Five}
                                                                                >
                                                                                    <FlexBox direction={FlexDirection.Row}>
                                                                                        <ul
                                                                                            className="machine-shortcut-list"
                                                                                        >
                                                                                            <li className="links">
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/dashboard-router/${machine["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/dashboards-icon.png" className="li-icon" /></div>
                                                                                                    </div>
                                                                                                    <span>
                                                                                                        Show Dashboards
                                                                                                    </span>
                                                                                                </Link>
                                                                                            </li>
                                                                                            {
                                                                                                machine?.["dashboards"].length > 0 &&
                                                                                                <li className="links">
                                                                                                    <Link
                                                                                                        to={{
                                                                                                            pathname: `/orgs/${this.props["match"].params["orgID"]}/dashboards/${machine?.["dashboards"][0]["dashboardID"]}`
                                                                                                        }}
                                                                                                    >
                                                                                                        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                            <div><img src="../../../assets/icons/dashboards-icon.png" className="li-icon" /></div>
                                                                                                        </div>
                                                                                                        <span>
                                                                                                            Show Snapshots
                                                                                                        </span>
                                                                                                    </Link>
                                                                                                </li>
                                                                                            }
                                                                                            <li className="links">
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/dt?nodeID=${machine["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/tree-icon.png" className="li-icon" /></div>
                                                                                                    </div>
                                                                                                    Show Sensor Tree
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links">
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/components/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${machine["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/component-list-icon.png" className="li-icon" /></div>
                                                                                                    </div>
                                                                                                    Show Components
                                                                                                    <span style={{ color: "#bef0ff" }}>
                                                                                                        ({machine["componentCount"]})
                                                                                                    </span>
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links">
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/alerting`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/alerts-icon.png" className="li-icon" /></div>
                                                                                                    </div>
                                                                                                    Alerts
                                                                                                    <span style={{ color: "#bef0ff" }}>
                                                                                                        (d/w/m) (0:0:0)
                                                                                                    </span>
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links">
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/machines/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${machine["id"]}/actions`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/machine-action-icon.png" className="li-icon" /></div>
                                                                                                    </div>
                                                                                                    Machine Actions
                                                                                                </Link>
                                                                                            </li>
                                                                                            {/* <li className="links">
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/predictions/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${machine["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/prediction-icon.png" className="li-icon" /></div>
                                                                                                    </div>
                                                                                                    Show Predictions
                                                                                                </Link>
                                                                                            </li> */}
                                                                                            <li className="links">
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/failures/${this.props["match"].params.FID}/${machine["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/failure-icon.png" className="li-icon" /></div>
                                                                                                    </div>
                                                                                                    Show Failures
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links">
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/health/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${machine["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/sidenav-masstrain-icon.png" className="li-icon" /></div>
                                                                                                    </div>
                                                                                                    Health Assessment
                                                                                                </Link>
                                                                                            </li>
                                                                                        </ul>
                                                                                    </FlexBox>
                                                                                </Grid.Column>
                                                                            ) :
                                                                            <Grid.Column
                                                                                widthXS={Columns.Twelve}
                                                                                widthSM={Columns.Twelve}
                                                                                widthMD={Columns.Five}
                                                                                widthLG={Columns.Five}
                                                                            >
                                                                                <h4 className="unhovered-text">
                                                                                    This machine contains a total of {machine["componentCount"]} components.
                                                                                </h4>
                                                                            </Grid.Column>
                                                                    }
                                                                </Grid.Row>
                                                            </ResourceCard>
                                                        </div>
                                                    </Grid.Column>
                                                )
                                            })
                                                :
                                                <EmptyState size={ComponentSize.Large}>
                                                    <EmptyState.Text>
                                                        No <b>Machine</b> record has been created, why not create
                                                        one?
                                                    </EmptyState.Text>
                                                    <Button
                                                        text="Create Machine"
                                                        type={ButtonType.Button}
                                                        icon={IconFont.Plus}
                                                        color={ComponentColor.Primary}
                                                        titleText={"Go to digital twin page and create machine"}
                                                        onClick={() => this.props["history"].push(`/orgs/${this.props["match"].params["orgID"]}/dt`)}
                                                    />
                                                </EmptyState>
                                        }
                                    </Grid.Row>
                                </Grid>
                            </Page.Contents>
                        </React.Fragment>
                    )
                }
            </Page>
        )
    }
}

export default MachinesPanel;