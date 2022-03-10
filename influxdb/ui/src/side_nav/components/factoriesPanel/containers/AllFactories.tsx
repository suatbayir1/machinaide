// Libraries
import React, { PureComponent } from "react";
import { Link } from "react-router-dom";

// Components
import {
    Page, Grid, Columns, SpinnerContainer, TechnoSpinner, RemoteDataState, QuestionMarkTooltip,
    InfluxColors, ComponentColor, EmptyState, ComponentSize, Button, ButtonType, IconFont,
} from '@influxdata/clockface'
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import FactoryCard from 'src/side_nav/components/factoriesPanel/components/FactoryCard';
import ProductionLineCards from 'src/side_nav/components/factoriesPanel/components/ProductionLineCards';

// Services
import FactoryService from 'src/shared/services/FactoryService';


// Constants
import { tipStyle, factoryPage } from 'src/shared/constants/tips'

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
        console.log("factories", factories);

        this.setState({
            factory: factories?.[0],
            spinnerLoading: RemoteDataState.Done,
            isLoading: true,
        });
    }

    render() {
        const { spinnerLoading, isLoading, factory } = this.state;

        console.log("factory", this.state.factory)

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
                                <QuestionMarkTooltip
                                    style={{ marginBottom: '8px' }}
                                    diameter={30}
                                    tooltipStyle={{ width: '400px' }}
                                    color={ComponentColor.Secondary}
                                    tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                        <div style={{ color: InfluxColors.Star }}>{"About the Factory Page:"}
                                            <hr style={tipStyle} />
                                        </div>
                                        {factoryPage}
                                    </div>}
                                />
                            </Page.Header>

                            {/* <div className="breadcrumb-responsive"> */}
                            <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                                <Link color="inherit" to="/">
                                    <HomeIcon style={{ marginTop: '4px' }} />
                                </Link>
                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Factories</Typography>
                            </Breadcrumbs>
                            {/* </div> */}

                            <Page.Contents fullWidth={true} scrollable={true}>
                                {
                                    factory ?
                                        <Grid>
                                            <Grid.Row>
                                                <Grid.Column
                                                    widthMD={Columns.Six}
                                                    widthLG={Columns.Five}
                                                    offsetLG={Columns.One}
                                                >
                                                    <FactoryCard
                                                        factory={this.state.factory}
                                                        orgID={this.props["match"].params.orgID}
                                                    />
                                                </Grid.Column>

                                                <Grid.Column
                                                    widthMD={Columns.Six}
                                                    widthLG={Columns.Five}
                                                >
                                                    <ProductionLineCards
                                                        factory={this.state.factory}
                                                        orgID={this.props["match"].params.orgID}
                                                    />
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                        :
                                        <EmptyState size={ComponentSize.Large}>
                                            <EmptyState.Text>
                                                No <b>Factory</b> record has been created, why not create
                                                one?
                                            </EmptyState.Text>
                                            <Button
                                                text="Create Factory"
                                                type={ButtonType.Button}
                                                icon={IconFont.Plus}
                                                color={ComponentColor.Primary}
                                                titleText={"Go to digital twin page and create factory"}
                                                onClick={() => this.props["history"].push(`/orgs/${this.props["match"].params["orgID"]}/dt`)}
                                            />
                                        </EmptyState>
                                }
                            </Page.Contents>
                        </React.Fragment>
                    )
                }
            </Page>
        )
    }
}

export default AllFactories;
