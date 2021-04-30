import React, { PureComponent } from "react";
import {
    Grid,
    Columns,
    ResourceCard,
    ComponentSize,
    FlexBox,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import LocationOnIcon from '@material-ui/icons/LocationOn';
import "src/side_nav/components/constants/factoryDashboard.css";

interface Props {
    factory: object
    orgID: string
}
interface State {
    shortcutCards: object[]
}

class FactoryCard extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            shortcutCards: [
                { link: `/orgs/${this.props.orgID}/dashboards-list`, icon: '../../../assets/icons/dashboards-icon.png', name: 'Show Dashboards' },
                { link: `/orgs/${this.props.orgID}/dt`, icon: '../../../assets/icons/tree-icon.png', name: 'Show Sensor Tree' },
                { link: `/orgs/${this.props.orgID}/machines/${this.props.factory["id"]}`, icon: '../../../assets/icons/machine-list-icon.png', name: 'Show Machines' },
                { link: `/orgs/${this.props.orgID}/alerting`, icon: '../../../assets/icons/alerts-icon.png', name: 'Show Alerts' },
                { link: `/orgs/${this.props.orgID}/failures/${this.props.factory["id"]}`, icon: '../../../assets/icons/failure-icon.png', name: 'Show Failures' },
            ]
        };
    }

    render() {
        const { factory } = this.props;

        return (

            <ResourceCard
                key={factory["id"]}
            >
                <Grid.Row>
                    <Grid.Column widthXS={Columns.Twelve}>
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
                            <h2 style={{ margin: '0px' }}>
                                {factory["factoryName"]}
                            </h2>
                        </FlexBox>
                        <FlexBox margin={ComponentSize.Small}>
                            <LocationOnIcon style={{ marginLeft: '35px', marginBottom: '5px' }} />
                            <h5 style={{ margin: '0px' }}>
                                {factory["zone"]}
                            </h5>
                        </FlexBox>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row style={{ marginTop: '30px' }}>
                    {
                        this.state.shortcutCards.map((shortcut, i) =>
                            <Grid.Column
                                widthXS={Columns.Four}
                                key={i}
                                style={{ paddingRight: '15px', paddingLeft: '15px' }}
                                id={"shortcutCard"}
                            >
                                <Link to={shortcut["link"]} className={"routingCard"} style={{ marginBottom: '40px', cursor: 'pointer' }}>
                                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                                        <img src={shortcut["icon"]} width='60px' height='60px' style={{ marginTop: '20px' }} />
                                        {/* <h4 style={{ color: 'white' }}>6</h4> */}
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