import React, { PureComponent } from "react";
import {
    Page,
    Grid,
    Columns,
    ResourceCard,
    ComponentSize,
    FlexBox,
    SpinnerContainer,
    TechnoSpinner,
    RemoteDataState,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import FactoryService from 'src/shared/services/FactoryService';

interface Props { }
interface State {
    factory: object
    hoveredFactory: object
    spinnerLoading: RemoteDataState
    isLoading: boolean
}

class AllFactories extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            factory: {},
            hoveredFactory: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
        };
    }

    async componentDidMount() {
        await this.getAllFactories();
    }

    getAllFactories = async () => {
        const factories = await FactoryService.getFactories();
        this.setState({
            factory: factories[0],
            spinnerLoading: RemoteDataState.Done,
            isLoading: true,
        });
    }

    handleOnMouseCard = (factory) => {
        this.setState({
            hoveredFactory: factory,
        })
    }

    handleLeaveMouseCard = () => {
        this.setState({
            hoveredFactory: {}
        })
    }

    render() {
        const { factory, spinnerLoading, isLoading } = this.state;

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
                                <Page.Title title={"Factories Panel"} />
                            </Page.Header>

                            <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                                <Link color="inherit" to="/">
                                    <HomeIcon style={{ marginTop: '4px' }} />
                                </Link>
                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Factories</Typography>
                            </Breadcrumbs>

                            <Page.Contents fullWidth={true}>
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Three}></Grid.Column>
                                        <Grid.Column
                                            widthXS={Columns.Six}
                                            key={factory["id"]}
                                        >
                                            <div
                                                onMouseLeave={() => this.handleLeaveMouseCard()}
                                                onMouseEnter={() => this.handleOnMouseCard(factory)}
                                                key={factory["id"]}
                                                style={{ marginTop: '10%' }}
                                            >
                                                <ResourceCard
                                                    key={factory["id"]}
                                                    style={{ marginTop: '20px' }}
                                                >
                                                    <Grid.Row>
                                                        <Grid.Column widthXS={Columns.Nine}>
                                                            <div>
                                                                <img
                                                                    src='../../../../assets/images/factory-image.jpg'
                                                                    width='100%' height='250px'
                                                                />
                                                            </div>
                                                            <FlexBox margin={ComponentSize.Small}>
                                                                <img
                                                                    src='../../../assets/icons/factory-card-icon.png'
                                                                    width='50px' height='50px' style={{ marginRight: '10px' }}
                                                                />
                                                                <h2>
                                                                    {factory["factoryName"]}
                                                                </h2>
                                                            </FlexBox>
                                                            <FlexBox margin={ComponentSize.Small}>
                                                                <LocationOnIcon style={{ marginLeft: '35px', marginBottom: '5px' }} />
                                                                <h5>
                                                                    {factory["zone"]}
                                                                </h5>
                                                            </FlexBox>
                                                        </Grid.Column>

                                                        {
                                                            this.state.hoveredFactory["id"] === factory["id"]
                                                                ? (
                                                                    <Grid.Column widthXS={Columns.Three}>
                                                                        {/* <FlexBox direction={FlexDirection.Row}> */}
                                                                        <ul
                                                                            className="ComponentList"
                                                                            style={{ listStyle: 'none', justifyContent: 'space-between', alignItems: 'space-between', marginTop: '50%', fontSize: '0.800rem' }}
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
                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/machines/${factory["id"]}`}>
                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                        <div><img src="../../../assets/icons/machine-list-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                    </div>
                                                                            Show Machines
                                                                            <span style={{ color: "#bef0ff" }}>
                                                                                        ({factory["machineCount"]})
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
                                                                                <Link to={`/orgs/${this.props.match.params["orgID"]}/failures/${factory["id"]}`}>
                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                        <div><img src="../../../assets/icons/failure-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                    </div>
                                                                                    Show Failures
                                                                                </Link>
                                                                            </li>
                                                                        </ul>
                                                                        {/* </FlexBox> */}
                                                                    </Grid.Column>
                                                                ) : <Grid.Column widthXS={Columns.Three}>
                                                                    <h4 style={{ marginTop: '70%' }}>
                                                                        There are {factory["machineCount"]} machines in this factory.
                                                                    </h4>
                                                                </Grid.Column>
                                                        }
                                                    </Grid.Row>
                                                </ResourceCard>
                                            </div>

                                        </Grid.Column>
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

export default AllFactories;