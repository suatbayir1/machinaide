// Libraries
import React, { PureComponent } from "react";
import { withRouter, RouteComponentProps } from 'react-router-dom'

// Components
import {
    Panel, ResourceCard, DapperScrollbars, EmptyState, ComponentSize,
    Button, ButtonType, IconFont, ComponentColor,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import "src/side_nav/components/constants/factoryDashboard.css";


interface Props {
    factory: object
    orgID: string
}
interface State {
}

type IProps = RouteComponentProps<{ orgID: string }> & Props


class ProductionLineCards extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    getCardStyle = (pl) => {
        let color = "red";

        switch (pl["@id"]) {
            case "1600T_Press_Line":
                color = "green";
                break;
        }

        return {
            marginBottom: '20px',
            borderLeft: `5px solid ${color}`
        }
    }

    render() {
        const { factory, orgID } = this.props;

        console.log("props", this.props);

        return (
            <>
                <Panel>
                    <DapperScrollbars
                        autoHide={false}
                        autoSizeHeight={true}
                        style={{ maxHeight: '700px' }}
                        className="data-loading--scroll-content"
                    >
                        {
                            factory["productionLines"]
                                && factory["productionLines"].length > 0 ?
                                factory["productionLines"].map(pl =>
                                    <Link
                                        key={pl["@id"]}
                                        to={`production-line/${factory["id"]}/${pl["@id"]}`}
                                        className={"routingCard"}
                                        style={{ marginBottom: '40px', cursor: 'pointer' }}
                                    >
                                        <ResourceCard
                                            // key={pl["@id"]}
                                            testID="dashboard-card"
                                            style={this.getCardStyle(pl)}
                                        >
                                            <ResourceCard.Name
                                                onClick={() => { }}
                                                name={pl["displayName"]}
                                                testID="dashboard-card--name"
                                            />
                                            <ResourceCard.Description
                                                description={"This production line has been running for 4 hours and 27 minutes and was last maintenance 2 days ago"}
                                            />
                                            <ResourceCard.Meta>
                                                <>{`Machine Counts: 6`}</>
                                                <>{`Productivity: %70`}</>
                                                <>{`Number of Products Processed: 789`}</>
                                            </ResourceCard.Meta>
                                        </ResourceCard>
                                    </Link>
                                ) :
                                <EmptyState size={ComponentSize.Large}>
                                    <EmptyState.Text>
                                        No <b>Production Line</b> record has been created, why not create
                                        one?
                                    </EmptyState.Text>
                                    <Button
                                        text="Create Production Line"
                                        type={ButtonType.Button}
                                        icon={IconFont.Plus}
                                        color={ComponentColor.Primary}
                                        titleText={"Go to digital twin page and create production line"}
                                        onClick={() => this.props["history"].push(`/orgs/${orgID}/dt`)}
                                    />
                                </EmptyState>
                        }
                    </DapperScrollbars>
                </Panel>
            </>
        )
    }
}

export default withRouter(ProductionLineCards);