// Libraries
import React, { PureComponent } from 'react'
import { RouteComponentProps } from 'react-router-dom'

// Components
import { IconFont, ComponentColor, Dropdown } from '@influxdata/clockface'

//  Services
import DTService from 'src/shared/services/DTService';
import DashboardService from 'src/shared/services/DashboardService';

// Utilities
// import { history } from 'src/store/history'

interface Props {
    dashboard: object
    orgID: string
    redirectToDashboard: (dashboardID) => void
}

interface State {
    snapshots: object[]
}

// type Props = RouteComponentProps<{ orgID: string }> & OwnProps

class SnapshotsGroupDropdown extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            snapshots: [],
        }
    }

    async componentDidMount() {
        await this.findSnapshotList();
    }

    findSnapshotList = async () => {
        const { dashboard } = this.props;
        const structure = await DTService.getAllDT();
        const dashboards = await DashboardService.getDTDashboards();

        let snapshots = [];
        let foundMachine;

        structure[0].productionLines.map(structurePL => {
            structurePL.machines.map(structureM => {
                structureM.contents.map(structureC => {
                    if (structureC["@type"] === "Component" && structureC["@id"] === dashboard["name"].split("-")[0]) {
                        foundMachine = structureM["@id"];
                    }
                })

                // find dashboard of component
                if (foundMachine === structureM["@id"]) {
                    structureM.contents.map(structureC => {
                        if (structureC["@type"] === "Component") {
                            dashboards.map(dashboard => {
                                if (dashboard.dtID === `component-${structureC["@id"]}`) {
                                    snapshots.push({ "dashboardID": dashboard.dashboardID, "dashboardName": dashboard.name });
                                }
                            })
                        }
                    })
                }
            })
        })

        this.setState({ snapshots })
    }

    render() {
        const { snapshots } = this.state;

        return (
            <Dropdown
                style={{ width: '60px' }}
                button={(active, onClick) => (
                    <Dropdown.Button
                        style={{ width: '60px' }}
                        active={active}
                        onClick={onClick}
                        icon={IconFont.DashH}
                        color={ComponentColor.Secondary}
                    >
                    </Dropdown.Button>
                )}
                menu={onCollapse => (
                    <Dropdown.Menu onCollapse={onCollapse} style={{ width: '200px' }}>
                        {snapshots.map(snapshot => {
                            return (
                                <Dropdown.Item
                                    id={snapshot["dashboardID"]}
                                    key={snapshot["dashboardID"]}
                                    value={snapshot}
                                    onClick={() => { this.props.redirectToDashboard(snapshot["dashboardID"]) }}
                                >
                                    {snapshot["dashboardName"]}
                                </Dropdown.Item>
                            )
                        })}
                    </Dropdown.Menu>
                )}
            />
        )
    }
}

export default SnapshotsGroupDropdown;