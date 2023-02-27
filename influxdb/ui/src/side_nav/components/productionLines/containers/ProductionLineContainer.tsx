import React, { PureComponent } from "react";
import {
    Page, QuestionMarkTooltip, ComponentColor, InfluxColors, Grid, Columns,
    SpinnerContainer, TechnoSpinner, RemoteDataState, SelectDropdown
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import FactoryService from 'src/shared/services/FactoryService';
import ProductionLineCard from 'src/side_nav/components/productionLines/components/ProductionLineCard';
import ProductionLineDashboardPanel from 'src/side_nav/components/productionLines/components/ProductionLineDashboardPanel';
import ProductionLineSummaryDashboard from "src/side_nav/components/productionLines/components/ProductionLineSummaryDashboard";

// Constants
import { tipStyle, productionLinePage } from 'src/shared/constants/tips'

interface Props { }
interface State {
    productionLine: object
    spinnerLoading: RemoteDataState
    isLoading: boolean
    selectedMachine: string
}

class ProductionLine extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            productionLine: {},
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
            selectedMachine: "Press031"
        };
    }

    async componentDidMount() {
        await this.getProductionLines();
    }

    getProductionLines = async () => {
        const payload = {
            "factoryId": this.props["match"].params.FID
        };

        const productionLines = await FactoryService.getProductionLines(payload);

        let pl;
        if (this.props["match"].params["PLID"] === "all") {
            pl = productionLines[0];
        } else {
            pl = productionLines.filter(pl => pl.id === this.props["match"].params["PLID"])[0];
        }

        this.setState({
            productionLine: pl,
            spinnerLoading: RemoteDataState.Done,
            isLoading: true,
        });
    }

    render() {
        const { productionLine, spinnerLoading, isLoading, selectedMachine } = this.state;

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
                                <Page.Title title={"Production Line"} />
                                <div className="tabbed-page--header-right">
                                    <SelectDropdown
                                        style={{width: "100px"}}
                                        options={["Press030", "Press031", "Press032", "Press033", "Press034"]}
                                        selectedOption={this.state.selectedMachine}
                                        onSelect={(e) => {this.setState({selectedMachine: e})}}
                                    /> 
                                    <QuestionMarkTooltip
                                        style={{ marginBottom: '8px' }}
                                        diameter={30}
                                        tooltipStyle={{ width: '400px' }}
                                        color={ComponentColor.Secondary}
                                        tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                            <div style={{ color: InfluxColors.Star }}>{"About the Production Line:"}
                                                <hr style={tipStyle} />
                                            </div>
                                            {productionLinePage}
                                        </div>}
                                    />
                                </div>
                            </Page.Header>

                            <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                                <Link color="inherit" to="/">
                                    <HomeIcon style={{ marginTop: '4px' }} />
                                </Link>
                                <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/allFactories`}>
                                    Factories
                                </Link>
                                <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Production Line</Typography>
                            </Breadcrumbs>
                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column
                                            widthXS={Columns.Twelve}
                                            widthSM={Columns.Twelve}
                                            widthMD={Columns.Twelve}
                                            widthLG={Columns.Four}
                                            key={productionLine["id"]}
                                            id="production-line-card"
                                        >
                                            <ProductionLineCard
                                                productionLine={productionLine}
                                                orgID={this.props["match"].params.orgID}
                                                factoryID={this.props["match"].params.FID}
                                            />
                                        </Grid.Column>

                                        <Grid.Column
                                            widthXS={Columns.Twelve}
                                            widthSM={Columns.Twelve}
                                            widthMD={Columns.Twelve}
                                            widthLG={Columns.Eight}
                                        >
                                            {/* <ProductionLineDashboardPanel
                                                orgID={this.props["match"].params.orgID}
                                                productionLine={productionLine}
                                            /> */}
                                            <ProductionLineSummaryDashboard
                                                orgID={this.props["match"].params.orgID}
                                                productionLine={productionLine}
                                                selectedMachine={selectedMachine}
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

export default ProductionLine;