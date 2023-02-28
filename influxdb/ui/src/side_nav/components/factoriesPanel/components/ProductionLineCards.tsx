// Libraries
import React, { PureComponent } from "react";
import { withRouter, RouteComponentProps } from 'react-router-dom'

// Components
import {
    Panel, ResourceCard, DapperScrollbars, EmptyState, ComponentSize,
    Button, ButtonType, IconFont, ComponentColor, Grid, Columns,
} from '@influxdata/clockface'
import { Link } from "react-router-dom";
import "src/side_nav/components/constants/factoryDashboard.css";

// Services
import FactoryService from 'src/shared/services/FactoryService';

interface Props {
    factory: object
    orgID: string
}
interface State {
    sections: any[]
    selectedSection: object
    pls: any[]
    filteredPls: any[]
}

type IProps = RouteComponentProps<{ orgID: string }> & Props


class ProductionLineCards extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);
        this.state = {
            sections: [],
            selectedSection: {},
            pls: [],
            filteredPls: [],
        };
    }

    async componentDidMount(): Promise<void> {
        const { factory } = this.props;

        const pls = factory["productionLines"] && factory["productionLines"].map(pl => pl);

        const sections = await FactoryService.getSectionsByFactory({ "factoryID": this.props.factory["id"] });

        this.setState({ pls, filteredPls: pls, sections })
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

    filterProductionLines = (section) => {
        this.setState({
            selectedSection: section,
            filteredPls: this.state.pls.filter(pl => pl["section"] === section["name"])
        })
    }

    render() {
        const { factory, orgID, } = this.props;
        const { selectedSection, filteredPls } = this.state;

        return (
            <>
                <Panel>
                    <DapperScrollbars
                        autoHide={false}
                        autoSizeHeight={true}
                        style={{ maxHeight: '200px' }}
                    >
                        <Grid.Row style={{ marginTop: '10px' }}>
                            {
                                this.state.sections.map((section, i) =>
                                    <Grid.Column
                                        widthXS={Columns.Six}
                                        widthSM={Columns.Four}
                                        widthMD={Columns.Four}
                                        widthLG={Columns.Four}
                                        key={i}
                                        id={"shortcutCard"}
                                    >
                                        <div
                                            onClick={() => this.filterProductionLines(section)}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                height: '150px',
                                                marginBottom: '20px',
                                                backgroundColor: selectedSection?.["_id"]?.["$oid"] === section["_id"]["$oid"] ? "#ffbd39" : 'rgba(255, 255, 255, 0.1)',
                                                color: selectedSection?.["_id"]?.["$oid"] === section["_id"]["$oid"] ? "#000" : null
                                            }}
                                        >
                                            <img
                                                src={`../../../assets/icons/${section["icon"]}`}
                                                width={150}
                                                style={{ marginTop: 50 }}
                                            />
                                        </div>
                                    </Grid.Column>
                                )
                            }
                        </Grid.Row>
                    </DapperScrollbars>
                </Panel>

                <Panel style={{ marginTop: '20px' }}>
                    <DapperScrollbars
                        autoHide={false}
                        autoSizeHeight={true}
                        style={{ maxHeight: '500px' }}
                        className="data-loading--scroll-content"
                    >
                        {
                            filteredPls.length > 0 ?
                                filteredPls.map(pl =>
                                    <Link
                                        key={pl["@id"]}
                                        to={`production-line/${factory["id"]}/${pl["@id"]}`}
                                        className={"routingCard"}
                                        style={{ marginBottom: '40px', cursor: 'pointer' }}
                                    >
                                        <ResourceCard
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