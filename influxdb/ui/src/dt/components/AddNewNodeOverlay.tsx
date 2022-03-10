// Libraries
import React, { PureComponent } from 'react'
import uuid from "uuid";

// Components
import { ComponentColor, Overlay, InfluxColors, QuestionMarkTooltip } from '@influxdata/clockface'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import { TabbedPageTab } from 'src/shared/tabbedPage/TabbedPageTabs'
import CreateFactory from 'src/dt/components/CreateFactory';
import CreateProductionLine from 'src/dt/components/CreateProductionLine';
import CreateMachine from 'src/dt/components/CreateMachine';
import CreateComponent from 'src/dt/components/CreateComponent';
import CreateSensor from 'src/dt/components/CreateSensor';
import CreateField from 'src/dt/components/CreateField';

// Services
import DTService from 'src/shared/services/DTService';

// Constants
import { tipStyle, addNewNodeHeader } from 'src/shared/constants/tips';

interface Props {
    orgID: string
    visibleAddNodeOverlay: boolean
    handleDismissAddNode: () => void
    refreshGraph: () => void
    refreshGeneralInfo: () => void
    refreshVisualizePage: () => void
    generalInfo: string[]
    handleChangeNotification: (type, message) => void
}

interface State {
    activeTab: string
    objectList: object[]
}

class AddNewNodeOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: "factory",
            objectList: [],
        };
    }

    async componentDidMount(): Promise<void> {
        this.getObjectList();
    }

    getObjectList = async () => {
        const result = await DTService.getObjectList();
        this.setState({
            objectList: result
        })
    }

    clearForm = () => {
        this.setState({
            activeTab: "factory",
            objectList: [],
        })
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    handleOnTabClick = (activeTab) => {
        this.setState({
            activeTab,
        })
    }

    private get headerChildren(): JSX.Element[] {
        return [
            <QuestionMarkTooltip
                key={uuid.v4()}
                diameter={20}
                tooltipStyle={{ width: '400px' }}
                color={ComponentColor.Secondary}
                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                    <div style={{ color: InfluxColors.Star }}>{"How to add DT object:"}
                        <hr style={tipStyle} />
                    </div>
                    {addNewNodeHeader}
                </div>}
            />
        ]
    }

    render() {
        const { activeTab, objectList } = this.state;
        const { visibleAddNodeOverlay, handleDismissAddNode, generalInfo } = this.props;

        console.log("generalInfo", generalInfo);


        const tabs: TabbedPageTab[] = [
            {
                text: 'Factory',
                id: 'factory',
            },
            {
                text: 'Production Line',
                id: 'pl',
            },
            {
                text: 'Machine',
                id: 'machine',
            },
            {
                text: 'Component',
                id: 'component',
            },
            {
                text: 'Sensor',
                id: 'sensor',
            },
            {
                text: 'Field',
                id: 'field',
            }
        ]

        return (
            <>
                <Overlay visible={visibleAddNodeOverlay}>
                    <Overlay.Container maxWidth={750}>
                        <Overlay.Header
                            title="Add New Node"
                            onDismiss={handleDismissAddNode}
                            children={this.headerChildren}
                        />

                        <Overlay.Body>
                            <TabbedPageTabs
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabClick={this.handleOnTabClick}
                            />
                            <br />

                            {
                                activeTab === "factory" &&
                                <CreateFactory
                                    onDismiss={handleDismissAddNode}
                                    handleChangeNotification={this.props.handleChangeNotification}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    handleDismissAddNode={this.props.handleDismissAddNode}
                                    factoryID={generalInfo["factoryID"]}
                                />
                            }

                            {
                                activeTab === "pl" &&
                                <CreateProductionLine
                                    onDismiss={handleDismissAddNode}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    handleDismissAddNode={this.props.handleDismissAddNode}
                                    factoryID={generalInfo["factoryID"]}
                                />
                            }

                            {
                                activeTab === "machine" &&
                                <CreateMachine
                                    orgID={this.props.orgID}
                                    onDismiss={handleDismissAddNode}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    handleDismissAddNode={this.props.handleDismissAddNode}
                                    productionLineList={generalInfo["productionLineList"]}
                                />
                            }

                            {
                                activeTab === "component" &&
                                <CreateComponent
                                    onDismiss={handleDismissAddNode}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    handleDismissAddNode={this.props.handleDismissAddNode}
                                    machineList={generalInfo["machineList"]}
                                    objectList={objectList}
                                />
                            }

                            {
                                activeTab === "sensor" &&
                                <CreateSensor
                                    onDismiss={handleDismissAddNode}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    handleDismissAddNode={this.props.handleDismissAddNode}
                                    objectList={objectList}
                                    componentList={generalInfo["componentList"]}
                                />
                            }

                            {
                                activeTab === "field" &&
                                <CreateField
                                    onDismiss={handleDismissAddNode}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    handleDismissAddNode={this.props.handleDismissAddNode}
                                    sensorList={generalInfo["sensorList"]}
                                    orgID={this.props.orgID}
                                />
                            }
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        );
    }
}

export default AddNewNodeOverlay;