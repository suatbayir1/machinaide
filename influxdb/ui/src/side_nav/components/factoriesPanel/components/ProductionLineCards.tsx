// Libraries
import React, { PureComponent } from "react";

// Components
import {
    Panel, ResourceCard, DapperScrollbars,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import "src/side_nav/components/constants/factoryDashboard.css";


interface Props {
    factory: object
    orgID: string
}
interface State {
}

class ProductionLineCards extends PureComponent<Props, State> {
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
        const { factory } = this.props;

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
                            factory?.["productionLines"].map(pl =>
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
                            )
                        }
                    </DapperScrollbars>
                </Panel>
            </>
        )
    }
}

export default ProductionLineCards;