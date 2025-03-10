// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import i18next from "i18next";

// Components
import {
    Panel, ComponentSize, Gradients, SpinnerContainer, TechnoSpinner,
    RemoteDataState, IconFont, Notification, Button, ComponentColor, ButtonType
} from '@influxdata/clockface'
import GeneralInformation from "src/dt/components/GeneralInformation";
import FactoryInformation from "src/dt/components/FactoryInformation";
import FactoryInformationOverlay from "src/dt/components/FactoryInformationOverlay"
import ProductionLineInformation from "src/dt/components/ProductionLineInformation";
import ProductionLineInformationOverlay from "src/dt/components/ProductionLineInformationOverlay";
import MachineInformation from "src/dt/components/MachineInformation";
import MachineInformationOverlay from "src/dt/components/MachineInformationOverlay";
import ComponentInformation from "src/dt/components/ComponentInformation";
import ComponentInformationOverlay from "src/dt/components/ComponentInformationOverlay";
import SensorInformation from "src/dt/components/SensorInformation";
import SensorInformationOverlay from "src/dt/components/SensorInformationOverlay";
import FieldInformation from "src/dt/components/FieldInformation";
import FieldInformationOverlay from 'src/dt/components/FieldInformationOverlay';

// Styles
import "src/style/custom.css"

// Overlays
import AddBrandsAndModels from "src/shared/overlays/AddBrandsAndModels";
import BMFInformation from "src/shared/overlays/BMFInformation";

// Services
import BrandService from "src/shared/services/BrandService";
import MaintenanceService from 'src/maintenance/services/MaintenanceService';
import FailureService from "src/shared/services/FailureService";
import DTService from "src/shared/services/DTService";

// Types
import { AppState, Bucket, ResourceType } from 'src/types'

// Utils
import { getAll } from 'src/resources/selectors'

interface Props {
    selectedGraphNode: object
    generalInfo: string[]
    spinnerLoading: RemoteDataState
    changeShowAllSensorValues: () => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    refreshGeneralInfo: () => void
    showAllSensorValues: boolean
    orgID: string
}

interface State {
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    visibleAddBrandsAndModels: boolean
    brands: object[]
    visibleBMFInformation: boolean
    maintenances: object[]
    failures: object[]
    oldParts: object[]
    objectList: object[]
    factoryInformationOverlay: boolean
    productionLineInformationOverlay: boolean
    machineInformationOverlay: boolean
    componentInformationOverlay: boolean
    sensorInformationOverlay: boolean
    fieldInformationOverlay: boolean
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class DigitalTwinInformation extends PureComponent<IProps, State> {

    constructor(props) {
        super(props);

        this.state = {
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            visibleAddBrandsAndModels: false,
            brands: [],
            visibleBMFInformation: false,
            maintenances: [],
            failures: [],
            oldParts: [],
            objectList: [],
            factoryInformationOverlay: false,
            productionLineInformationOverlay: false,
            machineInformationOverlay: false,
            componentInformationOverlay: false,
            sensorInformationOverlay: false,
            fieldInformationOverlay: false
        }
    }

    async componentDidMount(): Promise<void> {
        this.getObjectList();
    }

    private getObjectList = async () => {
        const result = await DTService.getObjectList();
        this.setState({
            objectList: result
        })
    }

    public handleChangeNotification = (type, message) => {
        this.setState({
            notificationVisible: true,
            notificationType: type,
            notificationMessage: message,
        })
    }

    public clickBrands = async () => {
        await this.getBrands();

        this.setState({ visibleAddBrandsAndModels: true });
    }

    public getBrands = async () => {
        const { selectedGraphNode } = this.props;

        const payload = {
            "type": selectedGraphNode["type"]
        }

        const brands = await BrandService.get(payload);

        this.setState({ brands, });
    }

    public getMaintenances = async () => {
        const { selectedGraphNode } = this.props;

        const payload = {
            "regex": [
                { "asset": selectedGraphNode["name"] }
            ],
            "exists": [
                { "retired": false }
            ]
        };

        const maintenances = await MaintenanceService.getByCondition(payload);

        this.setState({ maintenances })
    }

    public getFailures = async () => {
        const { selectedGraphNode } = this.props;

        const payload = {
            "regex": [
                { "sourceName": selectedGraphNode["name"] }
            ],
            "exists": [
                { "retired": false }
            ]
        };

        const failures = await FailureService.getByCondition(payload);

        this.setState({ failures })
    }

    public getOldParts = async () => {
        const { selectedGraphNode } = this.props;
        const oldParts = await DTService.getRetired({ "name": selectedGraphNode["name"] });

        this.setState({ oldParts });
    }

    public clickPartDetail = async () => {
        await this.getMaintenances();
        await this.getFailures();
        await this.getBrands();
        await this.getOldParts();

        this.setState({ visibleBMFInformation: true, });
    }

    public render() {
        const { selectedGraphNode, generalInfo, spinnerLoading, bucketNames, orgID } = this.props;
        const { visibleAddBrandsAndModels, brands, visibleBMFInformation, maintenances, failures, oldParts, objectList } = this.state;

        return (
            <>
                <AddBrandsAndModels
                    visible={visibleAddBrandsAndModels}
                    onDismiss={() => { this.setState({ visibleAddBrandsAndModels: false }) }}
                    selectedPart={selectedGraphNode}
                    brands={brands}
                    getBrands={this.clickBrands}
                />

                <BMFInformation
                    visible={visibleBMFInformation}
                    onDismiss={() => { this.setState({ visibleBMFInformation: false }) }}
                    maintenances={maintenances}
                    failures={failures}
                    selectedPart={selectedGraphNode}
                    getMaintenances={this.getMaintenances}
                    getFailures={this.getFailures}
                    generalInfo={generalInfo}
                    brands={brands}
                    refreshGraph={this.props.refreshGraph}
                    oldParts={oldParts}
                    getOldParts={this.getOldParts}
                />

                <Panel>
                    <Notification
                        key={"id"}
                        id={"id"}
                        icon={
                            this.state.notificationType === 'success'
                                ? IconFont.Checkmark
                                : IconFont.Alerts
                        }
                        duration={5000}
                        size={ComponentSize.Small}
                        visible={this.state.notificationVisible}
                        gradient={
                            this.state.notificationType === 'success'
                                ? Gradients.HotelBreakfast
                                : Gradients.DangerDark
                        }
                        onTimeout={() => this.setState({ notificationVisible: false })}
                        onDismiss={() => this.setState({ notificationVisible: false })}
                    >
                        <span className="notification--message">{this.state.notificationMessage}</span>
                    </Notification>

                    <SpinnerContainer loading={spinnerLoading} spinnerComponent={<TechnoSpinner />} />
                    <Panel.Header size={ComponentSize.ExtraSmall}>
                        <GeneralInformation
                            info={generalInfo}
                            showAllSensorValues={this.props.showAllSensorValues}
                            changeShowAllSensorValues={this.props.changeShowAllSensorValues}
                        />
                    </Panel.Header>
                    <Panel.Body size={ComponentSize.ExtraSmall}>
                        {
                            this.props.selectedGraphNode["type"] === "Factory" &&
                            <>
                                <FactoryInformation
                                    selectedGraphNode={this.props.selectedGraphNode}
                                    bucketNames={bucketNames}
                                    handleChangeNotification={this.handleChangeNotification}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                />
                                <Button
                                    text={i18next.t('button.edit')}
                                    icon={IconFont.Pencil}
                                    onClick={() => { this.setState({ factoryInformationOverlay: !this.state.factoryInformationOverlay }) }}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Secondary}
                                    className="show-only-pc"
                                />
                            </>
                        }

                        {
                            this.props.selectedGraphNode["type"] === "ProductionLine" &&
                            <>
                                <ProductionLineInformation
                                    selectedGraphNode={this.props.selectedGraphNode}
                                    handleChangeNotification={this.handleChangeNotification}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                />
                                <Button
                                    text={i18next.t('button.edit')}
                                    icon={IconFont.Pencil}
                                    onClick={() => { this.setState({ productionLineInformationOverlay: !this.state.productionLineInformationOverlay }) }}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Secondary}
                                    className="show-only-pc"
                                />
                            </>
                        }

                        {
                            this.props.selectedGraphNode["type"] === "Machine" &&
                            <>
                                <MachineInformation
                                    selectedGraphNode={this.props.selectedGraphNode}
                                    handleChangeNotification={this.handleChangeNotification}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    clickPartDetail={this.clickPartDetail}
                                    clickBrands={this.clickBrands}
                                    orgID={orgID}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                />
                                <Button
                                    text={i18next.t('button.edit')}
                                    icon={IconFont.Pencil}
                                    onClick={() => { this.setState({ machineInformationOverlay: !this.state.machineInformationOverlay }) }}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Secondary}
                                    className="show-only-pc"
                                />
                            </>
                        }

                        {
                            this.props.selectedGraphNode["type"] === "Component" &&
                            <>
                                <ComponentInformation
                                    selectedGraphNode={this.props.selectedGraphNode}
                                    handleChangeNotification={this.handleChangeNotification}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    clickPartDetail={this.clickPartDetail}
                                    clickBrands={this.clickBrands}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                    objectList={objectList}
                                />
                                <Button
                                    text={i18next.t('button.edit')}
                                    icon={IconFont.Pencil}
                                    onClick={() => { this.setState({ componentInformationOverlay: !this.state.componentInformationOverlay }) }}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Secondary}
                                    className="show-only-pc"
                                />
                            </>
                        }

                        {
                            this.props.selectedGraphNode["type"] === "Sensor" &&
                            <>
                                <SensorInformation
                                    selectedGraphNode={this.props.selectedGraphNode}
                                    handleChangeNotification={this.handleChangeNotification}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    clickPartDetail={this.clickPartDetail}
                                    clickBrands={this.clickBrands}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                    objectList={objectList}
                                />
                                <Button
                                    text={i18next.t('button.edit')}
                                    icon={IconFont.Pencil}
                                    onClick={() => { this.setState({ sensorInformationOverlay: !this.state.sensorInformationOverlay }) }}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Secondary}
                                    className="show-only-pc"
                                />
                            </>
                        }

                        {
                            this.props.selectedGraphNode["type"] === "Field" &&
                            <>
                                <FieldInformation
                                    selectedGraphNode={this.props.selectedGraphNode}
                                    handleChangeNotification={this.handleChangeNotification}
                                    refreshGraph={this.props.refreshGraph}
                                    refreshVisualizePage={this.props.refreshVisualizePage}
                                    orgID={orgID}
                                    refreshGeneralInfo={this.props.refreshGeneralInfo}
                                />
                                <Button
                                    text={i18next.t('button.edit')}
                                    icon={IconFont.Pencil}
                                    onClick={() => { this.setState({ fieldInformationOverlay: !this.state.fieldInformationOverlay }) }}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Secondary}
                                    className="show-only-pc"
                                />
                            </>
                        }
                        <FactoryInformationOverlay
                            isFactoryInformationOverlayVisible={this.state.factoryInformationOverlay}
                            handleDismissFactoryInformationOverlay={() => this.setState({ factoryInformationOverlay: !this.state.factoryInformationOverlay })}
                            selectedGraphNode={this.props.selectedGraphNode}
                            bucketNames={bucketNames}
                            handleChangeNotification={this.handleChangeNotification}
                            refreshGraph={this.props.refreshGraph}
                            refreshVisualizePage={this.props.refreshVisualizePage}
                            refreshGeneralInfo={this.props.refreshGeneralInfo}
                        />
                        <ProductionLineInformationOverlay
                            isProductionLineInformationOverlayVisible={this.state.productionLineInformationOverlay}
                            handleDismissProductionLineInformationOverlay={() => this.setState({ productionLineInformationOverlay: !this.state.productionLineInformationOverlay })}
                            selectedGraphNode={this.props.selectedGraphNode}
                            handleChangeNotification={this.handleChangeNotification}
                            refreshGraph={this.props.refreshGraph}
                            refreshVisualizePage={this.props.refreshVisualizePage}
                            refreshGeneralInfo={this.props.refreshGeneralInfo}
                            generalInfo={generalInfo}
                        />
                        <MachineInformationOverlay
                            isMachineInformationOverlayVisible={this.state.machineInformationOverlay}
                            handleDismissMachineInformationOverlay={() => this.setState({ machineInformationOverlay: !this.state.machineInformationOverlay })}
                            selectedGraphNode={this.props.selectedGraphNode}
                            handleChangeNotification={this.handleChangeNotification}
                            refreshGraph={this.props.refreshGraph}
                            refreshVisualizePage={this.props.refreshVisualizePage}
                            clickPartDetail={this.clickPartDetail}
                            clickBrands={this.clickBrands}
                            orgID={orgID}
                            refreshGeneralInfo={this.props.refreshGeneralInfo}
                        />
                        <ComponentInformationOverlay
                            isComponentInformationOverlayVisible={this.state.componentInformationOverlay}
                            handleDismissComponentInformationOverlay={() => this.setState({ componentInformationOverlay: !this.state.componentInformationOverlay })}
                            selectedGraphNode={this.props.selectedGraphNode}
                            handleChangeNotification={this.handleChangeNotification}
                            refreshGraph={this.props.refreshGraph}
                            refreshVisualizePage={this.props.refreshVisualizePage}
                            clickPartDetail={this.clickPartDetail}
                            clickBrands={this.clickBrands}
                            refreshGeneralInfo={this.props.refreshGeneralInfo}
                            objectList={objectList}
                        />
                        <SensorInformationOverlay
                            isSensorInformationOverlayVisible={this.state.sensorInformationOverlay}
                            handleDismissSensorInformationOverlay={() => this.setState({ sensorInformationOverlay: !this.state.sensorInformationOverlay })}
                            selectedGraphNode={this.props.selectedGraphNode}
                            handleChangeNotification={this.handleChangeNotification}
                            refreshGraph={this.props.refreshGraph}
                            refreshVisualizePage={this.props.refreshVisualizePage}
                            clickPartDetail={this.clickPartDetail}
                            clickBrands={this.clickBrands}
                            refreshGeneralInfo={this.props.refreshGeneralInfo}
                            objectList={objectList}
                        />
                        <FieldInformationOverlay
                            isFieldInformationOverlayVisible={this.state.fieldInformationOverlay}
                            handleDismissFieldInformationOverlay={() => this.setState({ fieldInformationOverlay: !this.state.fieldInformationOverlay })}
                            selectedGraphNode={this.props.selectedGraphNode}
                            handleChangeNotification={this.handleChangeNotification}
                            refreshGraph={this.props.refreshGraph}
                            refreshVisualizePage={this.props.refreshVisualizePage}
                            orgID={orgID}
                            refreshGeneralInfo={this.props.refreshGeneralInfo}
                        />
                    </Panel.Body>
                </Panel>
            </>
        )
    }
}

const mstp = (state: AppState) => {
    const buckets = getAll<Bucket>(state, ResourceType.Buckets)
    const bucketNames = buckets.map(bucket => bucket.name || '')

    return { bucketNames }
}

const connector = connect(mstp, null)

export default connector(DigitalTwinInformation)
