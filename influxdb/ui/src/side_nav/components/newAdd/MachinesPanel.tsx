import React, { PureComponent } from "react";
import {
    Page,
    Grid,
    Columns,
    FlexBox,
    ResourceCard,
    ComponentSize,
    FlexDirection,
    SpinnerContainer,
    TechnoSpinner,
    RemoteDataState,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import FactoryService from 'src/shared/services/FactoryService';


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
            "factoryId": this.props.match.params.FID
        };

        const machines = await FactoryService.getMachines(payload);

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
                            </Page.Header>

                            <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                                <Link color="inherit" to="/">
                                    <HomeIcon style={{ marginTop: '4px' }} />
                                </Link>
                                <Link color="inherit" to={`/orgs/${this.props.match.params["orgID"]}/allFactories`}>
                                    Factories
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
                                                        widthXS={Columns.Four}
                                                        key={machine["id"]}
                                                    >
                                                        <div
                                                            onMouseLeave={() => this.handleLeaveMouseCard()}
                                                            onMouseEnter={() => this.handleOnMouseCard(machine)}
                                                            key={machine["id"]}
                                                        >
                                                            <ResourceCard
                                                                key={machine["id"]}
                                                                style={{ marginTop: '20px' }}
                                                            >
                                                                <Grid.Row>
                                                                    <Grid.Column widthXS={Columns.Seven}>
                                                                        <div>
                                                                            <img
                                                                                src="../../../../assets/images/machine-image.jpg"
                                                                                width='100%' height='150px'
                                                                            />
                                                                        </div>
                                                                        <FlexBox margin={ComponentSize.Small}>
                                                                            <img
                                                                                src='../../../assets/icons/machine-card-icon.png'
                                                                                width='50px' height='50px' style={{ marginRight: '10px' }}
                                                                            />
                                                                            <h2>
                                                                                {machine["machineName"]}
                                                                            </h2>
                                                                        </FlexBox>
                                                                    </Grid.Column>

                                                                    {
                                                                        this.state.hoveredMachine["id"] === machine["id"]
                                                                            ? (
                                                                                <Grid.Column widthXS={Columns.Five}>
                                                                                    <FlexBox direction={FlexDirection.Row}>
                                                                                        <ul
                                                                                            className="ComponentList"
                                                                                            style={{ listStyleType: "none", marginTop: '10%', paddingLeft: '0px', fontSize: '0.800rem' }}
                                                                                        >
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/dashboards-list`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/dashboards-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                                    <span>
                                                                                                        Show Dashboards
                                                                                </span>
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/dt`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/tree-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                        Show Sensor Tree
                                                                                    </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/machines/${this.props.match.params.FID}/${machine["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/component-list-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                        Show Components
                                                                                        <span style={{ color: "#bef0ff" }}>
                                                                                                        ({machine["componentCount"]})
                                                                                        </span>
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/alerting`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/alerts-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                        Alerts
                                                                                        <span style={{ color: "#bef0ff" }}>
                                                                                                        (d/w/m) (0:0:0)
                                                                                        </span>
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/machines/${this.props.match.params.FID}/${machine["id"]}/actions`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/machine-action-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                        Machine Actions
                                                                                    </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/predictions/<sensorID>`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/prediction-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                        Show Predictions
                                                                                    </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/failures/${this.props.match.params.FID}/${machine["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/failure-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                        Show Failures
                                                                                    </Link>
                                                                                            </li>
                                                                                        </ul>
                                                                                    </FlexBox>
                                                                                </Grid.Column>
                                                                            ) :
                                                                            <Grid.Column widthXS={Columns.Five}>
                                                                                <h4 style={{ marginTop: '40%' }}>
                                                                                    This machine contains a total of {machine["componentCount"]} components.
                                                                                </h4>
                                                                            </Grid.Column>
                                                                    }
                                                                </Grid.Row>
                                                            </ResourceCard>
                                                        </div>
                                                    </Grid.Column>
                                                )
                                            }) : (
                                                <h1>No machines found for this factory</h1>
                                            )
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