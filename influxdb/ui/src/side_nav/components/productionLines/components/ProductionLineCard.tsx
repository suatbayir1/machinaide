// Libraries
import React, { PureComponent } from "react";

// Components
import {
    Grid, Columns, ResourceCard, ComponentSize, FlexBox, QuestionMarkTooltip, ComponentColor,
    InfluxColors,
} from '@influxdata/clockface'
import ProductionLineGraph from "src/side_nav/components/productionLines/components/ProductionLineGraph"

// Utilities
import { Link } from "react-router-dom";

// Styles
import "src/side_nav/components/constants/factoryDashboard.css";

// Constants
import { tipStyle, productionLineDataFlow } from 'src/shared/constants/tips'

interface Props {
    productionLine: object
    orgID: string
    factoryID: string
}
interface State {
    shortcutCards: object[]
}

class FactoryCard extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            shortcutCards: [
                { link: `/orgs/${this.props.orgID}/dashboard-router/${this.props.productionLine["id"]}`, icon: '../../../assets/icons/dashboards-icon.png', name: 'Show Dashboards', width: '80px', height: '80px', marginTop: '0px' },
                { link: `/orgs/${this.props.orgID}/dt`, icon: '../../../assets/icons/tree-icon.png', name: 'Show Sensor Tree', width: '60px', height: '60px', marginTop: '20px' },
                { link: `/orgs/${this.props.orgID}/machines/${this.props["factoryID"]}/${this.props.productionLine["id"]}`, icon: '../../../assets/icons/machine-list-icon.png', name: `Show Machines (${this.props.productionLine["machineCount"]})`, width: '60px', height: '60px', marginTop: '20px' },
                { link: `/orgs/${this.props.orgID}/alerting`, icon: '../../../assets/icons/alerts-icon.png', name: 'Show Alerts', width: '60px', height: '60px', marginTop: '20px' },
                { link: `/orgs/${this.props.orgID}/failures/${this.props.factoryID}/${this.props.productionLine["id"]}`, icon: '../../../assets/icons/failure-icon.png', name: 'Show Failures', width: '60px', height: '60px', marginTop: '20px' },
            ]
        };
    }

    render() {
        const { productionLine } = this.props;

        return (

            <ResourceCard
                key={productionLine["id"]}
            >
                <Grid.Row>
                    <FlexBox
                        style={{ marginBottom: '10px', marginLeft: '10px', }}
                        margin={ComponentSize.Small}>
                        <img
                            src='../../../assets/icons/factory-card-icon.png'
                            width='40px' height='40px' style={{ marginRight: '10px' }}
                        />
                        <h2 style={{ margin: '0px' }}>
                            {productionLine["plName"]}
                        </h2>

                        <QuestionMarkTooltip
                            style={{ marginLeft: '10px' }}
                            diameter={20}
                            tooltipStyle={{ width: '400px' }}
                            color={ComponentColor.Secondary}
                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                <div style={{ color: InfluxColors.Star }}>{"Production Line Data Flow:"}
                                    <hr style={tipStyle} />
                                </div>
                                {productionLineDataFlow}
                            </div>}
                        />
                    </FlexBox>

                    <ProductionLineGraph
                        productionLine={productionLine}
                    />
                </Grid.Row>

                <Grid.Row style={{ marginTop: '30px' }}>
                    {
                        this.state.shortcutCards.map((shortcut, i) =>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Four}
                                widthMD={Columns.Three}
                                widthLG={Columns.Four}
                                key={i}
                                style={{ paddingRight: '15px', paddingLeft: '15px' }}
                                id={"shortcutCard"}
                            >
                                <Link to={shortcut["link"]} className={"routingCard"} style={{ marginBottom: '40px', cursor: 'pointer' }}>
                                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', textAlign: 'center', height: '150px', marginBottom: '20px' }}>
                                        <img src={shortcut["icon"]} width={shortcut["width"]} height={shortcut["height"]} style={{ marginTop: shortcut["marginTop"] }} />
                                        <h4 style={{ paddingBottom: '20px', color: 'white' }}>{shortcut["name"]}</h4>
                                    </div>
                                </Link>
                            </Grid.Column>
                        )
                    }
                </Grid.Row>
            </ResourceCard>
        )
    }
}

export default FactoryCard;