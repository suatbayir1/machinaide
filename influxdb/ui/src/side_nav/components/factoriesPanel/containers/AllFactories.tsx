import React, { PureComponent } from "react";
import {
    Page,
    Grid,
    Columns,
    SpinnerContainer,
    TechnoSpinner,
    RemoteDataState,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import FactoryService from 'src/shared/services/FactoryService';
import FactoryDashboardPanel from 'src/side_nav/components/factoriesPanel/components/FactoryDashboardPanel';
import FactoryCard from 'src/side_nav/components/factoriesPanel/components/FactoryCard';

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
    }

    getAllFactories = async () => {
        const factories = await FactoryService.getFactories();
        this.setState({
            factory: factories[0],
            spinnerLoading: RemoteDataState.Done,
            isLoading: true,
        });
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

                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column
                                            widthXS={Columns.Four}
                                            key={factory["id"]}
                                            style={{ borderRight: '1px solid white' }}
                                        >
                                            <FactoryCard
                                                factory={this.state.factory}
                                                orgID={this.props["match"].params.orgID}
                                            />
                                        </Grid.Column>

                                        <Grid.Column
                                            widthXS={Columns.Eight}
                                        >
                                            <FactoryDashboardPanel
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