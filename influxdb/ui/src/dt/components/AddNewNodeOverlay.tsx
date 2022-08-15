// Libraries
import React, { PureComponent } from 'react'
import uuid from "uuid";
import i18next from "i18next";

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
import FactoryService from 'src/shared/services/FactoryService';

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
    sections: any[]
}

class AddNewNodeOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: "factory",
            objectList: [],
            sections: [],
        };
    }

    async componentDidMount(): Promise<void> {
        this.getObjectList();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.generalInfo !== this.props.generalInfo) {
            this.getSections();
        }
    }

    getObjectList = async () => {
        const result = await DTService.getObjectList();
        this.setState({
            objectList: result
        })
    }

    getSections = async () => {
        const sections = await FactoryService.getSectionsByFactory({ "factoryID": this.props.generalInfo["factoryID"] });
        this.setState({ sections })
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
                    <div style={{ color: InfluxColors.Star }}>{i18next.t('tips.how_to_add_dt_object')}
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

        const tabs: TabbedPageTab[] = [
            {
                text: i18next.t('dt.factory'),
                id: 'factory',
            },
            {
                text: i18next.t('dt.production_line'),
                id: 'pl',
            },
            {
                text: i18next.t('dt.machine'),
                id: 'machine',
            },
            {
                text: i18next.t('dt.component'),
                id: 'component',
            },
            {
                text: i18next.t('dt.sensor'),
                id: 'sensor',
            },
            {
                text: i18next.t('dt.field'),
                id: 'field',
            }
        ]

        return (
            <>
                <Overlay visible={visibleAddNodeOverlay}>
                    <Overlay.Container maxWidth={750}>
                        <Overlay.Header
                            title={i18next.t('add_new_part')}
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
                                    sections={this.state.sections}
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