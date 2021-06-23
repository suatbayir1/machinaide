// Libraries
import React, { PureComponent } from "react";
import { Link } from "react-router-dom";

// Components
import {
    Page, Grid, Columns, SpinnerContainer, TechnoSpinner, RemoteDataState,
} from '@influxdata/clockface'
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import FactoryCard from 'src/side_nav/components/factoriesPanel/components/FactoryCard';
import ProductionLineCards from 'src/side_nav/components/factoriesPanel/components/ProductionLineCards';

// Services
import FactoryService from 'src/shared/services/FactoryService';
// import DashboardService from 'src/shared/services/DashboardService';



interface Props { }

interface State {
    factory: object
    spinnerLoading: RemoteDataState
    isLoading: boolean
}

class AllFactories extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            factory: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
        };
    }

    async componentDidMount() {
        await this.getAllFactories();
        // await this.getDashboards();
    }

    getAllFactories = async () => {
        const factories = await FactoryService.getFactories();
        this.setState({
            factory: factories[0],
            spinnerLoading: RemoteDataState.Done,
            isLoading: true,
        });
    }

    // getDashboards = async () => {
    //     const dashboards = await DashboardService.getDashboards();
    //     console.log(dashboards);
    // }

    render() {
        const { spinnerLoading, isLoading } = this.state;

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

                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column
                                            widthXS={Columns.Four}
                                            offsetXS={Columns.Two}
                                        >
                                            <FactoryCard
                                                factory={this.state.factory}
                                                orgID={this.props["match"].params.orgID}
                                            />
                                        </Grid.Column>

                                        <Grid.Column
                                            widthXS={Columns.Four}
                                        >
                                            <ProductionLineCards
                                                factory={this.state.factory}
                                                orgID={this.props["match"].params.orgID}
                                            />
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
