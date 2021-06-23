import React, { PureComponent } from "react";
import {
    Page,
    Grid,
    Columns,
    ResourceCard,
    ComponentSize,
    FlexBox,
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

interface State {
    components: object[],
    hoveredComponent: object,
    spinnerLoading: RemoteDataState
    isLoading: boolean
}

interface OwnProps {

}

interface StateProps {
    org: string
    orgID: string
}

type Props = OwnProps & StateProps

class ComponentsPanel extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            components: [],
            hoveredComponent: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
        };
    }

    async componentDidMount() {
        await this.getAllComponents();
    }

    getAllComponents = async () => {
        const payload = {
            "factoryId": this.props["match"].params.FID,
            "plId": this.props["match"].params.PLID,
            "machineId": this.props["match"].params.MID
        }

        const components = await FactoryService.getComponents(payload);

        this.setState({
            components: components,
            spinnerLoading: RemoteDataState.Done,
            isLoading: true,
        });
    }

    handleOnMouseCard = (component) => {
        this.setState({
            hoveredComponent: component,
        })
    }

    handleLeaveMouseCard = () => {
        this.setState({
            hoveredComponent: {}
        })
    }


    render() {
        const { components, spinnerLoading, isLoading } = this.state;

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
                                <Page.Title title={"Components"} />
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
                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Components</Typography>
                            </Breadcrumbs>

                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid>
                                    <Grid.Row>
                                        {
                                            components.length > 0 ? components.map((component) => {
                                                return (
                                                    <div
                                                        onMouseLeave={() => this.handleLeaveMouseCard()}
                                                        onMouseEnter={() => this.handleOnMouseCard(component)}
                                                        key={component["id"]}
                                                    >
                                                        <Grid.Column
                                                            widthXS={Columns.Three}
                                                            key={component["id"]}
                                                        >
                                                            <ResourceCard
                                                                key={component["id"]}
                                                                style={{ marginTop: '20px' }}
                                                            >
                                                                <Grid.Row>
                                                                    <Grid.Column
                                                                        widthXS={
                                                                            this.state.hoveredComponent["id"] !== component["id"]
                                                                                ? Columns.Twelve
                                                                                : Columns.Six
                                                                        }
                                                                    >
                                                                        <div style={{ marginLeft: "40%" }}>
                                                                            <img
                                                                                src='https://cdn1.iconfinder.com/data/icons/cars-components-3/24/gears_gear_car_component_part-512.png'
                                                                                width='130px' height='130px'
                                                                            />
                                                                        </div>
                                                                        <FlexBox margin={ComponentSize.Small}>
                                                                            <img
                                                                                src='../../../assets/icons/component-card-icon.png'
                                                                                width='50px' height='50px' style={{ marginRight: '10px' }}
                                                                            />
                                                                            <h5>
                                                                                {component["componentName"]}
                                                                            </h5>
                                                                        </FlexBox>
                                                                    </Grid.Column>

                                                                    {
                                                                        this.state.hoveredComponent["id"] === component["id"]
                                                                            ? (
                                                                                <Grid.Column widthXS={Columns.Six}>
                                                                                    <FlexBox direction={FlexDirection.Row}>
                                                                                        <ul
                                                                                            className="ComponentList"
                                                                                            style={{ listStyleType: "none", marginTop: '5px', paddingLeft: '0px', fontSize: '0.800rem', margin: 'auto' }}
                                                                                        >
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/dashboard-router/${component["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/dashboards-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                                    <span>
                                                                                                        Show Dashboards
                                                                                                    </span>
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/snapshot-router/component-${component["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/dashboards-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                                    <span>
                                                                                                        Show Snapshots
                                                                                                    </span>
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/dt`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/tree-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                                    Show Sensor Tree
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/sensors/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${this.props["match"].params.MID}/${component["id"]}`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/sensor-list.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                                    Show Sensors
                                                                                                    <span style={{ color: "#bef0ff" }}>
                                                                                                        ({component["sensorCount"]})
                                                                                                    </span>
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/alerting`}>
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
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/predictions/<sensorID>`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/prediction-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                                    Show Predictions
                                                                                                </Link>
                                                                                            </li>
                                                                                            <li className="links" style={{ marginBottom: '0px' }}>
                                                                                                <Link to={`/orgs/${this.props["match"].params["orgID"]}/failures/:FID/:MID/:CID`}>
                                                                                                    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                                                        <div><img src="../../../assets/icons/failure-icon.png" width='20px' height='20px' style={{ marginRight: '5px' }} /></div>
                                                                                                    </div>
                                                                                                    Show Failures
                                                                                                </Link>
                                                                                            </li>
                                                                                        </ul>
                                                                                    </FlexBox>
                                                                                </Grid.Column>
                                                                            ) : null
                                                                    }
                                                                </Grid.Row>
                                                            </ResourceCard>
                                                        </Grid.Column>
                                                    </div>
                                                )
                                            }) : (
                                                <h1>No component found for this machine</h1>
                                            )
                                        }
                                    </Grid.Row>
                                </Grid>
                            </Page.Contents>
                        </React.Fragment>
                    )
                }
            </Page >
        )
    }
}

export default ComponentsPanel;