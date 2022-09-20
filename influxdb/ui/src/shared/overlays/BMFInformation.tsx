// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, Button, ButtonType, ComponentColor, Overlay, IconFont, Grid, Columns,
    DapperScrollbars, Table, BorderType, ComponentSize, ConfirmationButton,
    FlexBox, Appearance, Panel, Dropdown,
} from '@influxdata/clockface'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    deleteFailureSuccessfully,
    deleteFailureFailure,
    deleteMaintenanceSuccessfully,
    deleteMaintenanceFailure,
    pleaseFillInTheFormCompletely,
    generalSuccessMessage,
    generalErrorMessage
} from 'src/shared/copy/notifications'

// Services
import FailureService from "src/shared/services/FailureService";
import MaintenanceService from "src/maintenance/services/MaintenanceService";
import DTService from "src/shared/services/DTService";

// Overlays
import AddUpdateFailureOverlay from 'src/side_nav/components/newAdd/modules/AddUpdateFailureOverlay';
import AddUpdateMaintenanceOverlay from "src/maintenance/components/AddUpdateMaintenanceOverlay";
import RetirePart from "src/shared/overlays/RetirePart";
import RetirePartDetail from "src/shared/overlays/RetirePartDetail";
import RelatedMaintenanceFailureTable from "src/shared/overlays/RelatedMaintenanceFailureTable";
import StatusOverlay from "src/shared/overlays/StatusOverlay";


interface OwnProps {
    visible: boolean
    onDismiss: () => void
    maintenances: object[]
    failures: object[]
    selectedPart: object
    getMaintenances: () => void
    getFailures: () => void
    generalInfo: object
    brands: object[]
    refreshGraph: () => void
    oldParts: object[]
    getOldParts: () => void
}

interface State {
    visibleAddUpdateFailure: boolean
    visibleAddUpdateMaintenance: boolean
    addBySelectedPart: boolean
    propsPart: object
    editMode: boolean
    updateData: object
    deploymentTime: string
    selectedBrand: object
    visibleRetirePart: boolean
    selectedOldPart: object
    visibleRetirePartDetail: boolean
    visibleRelatedMaintenanceFailure: boolean
    relatedType: string
    relatedMaintenances: object[]
    relatedFailures: object[]
    showStatus: boolean
    oldFailures: object[]
    oldMaintenanceRecords: object[]
    oldParts: object[]
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

class BMFInformation extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            visibleAddUpdateFailure: false,
            visibleAddUpdateMaintenance: false,
            addBySelectedPart: false,
            propsPart: {},
            editMode: false,
            updateData: {},
            deploymentTime: "",
            selectedBrand: {},
            visibleRetirePart: false,
            selectedOldPart: {},
            visibleRetirePartDetail: false,
            visibleRelatedMaintenanceFailure: false,
            relatedType: "",
            relatedMaintenances: [],
            relatedFailures: [],
            showStatus: false,
            oldFailures: [],
            oldMaintenanceRecords: [],
            oldParts: [],
        };
    }

    componentDidUpdate(prevProps) {
        const { selectedPart } = this.props;

        if (prevProps.selectedPart !== selectedPart) {
            if (selectedPart["deploymentTime"] !== undefined) {
                this.setState({
                    deploymentTime: selectedPart["deploymentTime"],
                    selectedBrand: selectedPart["brand"],
                })
            } else {
                this.clearComponent();
            }
        }

        if (prevProps.visible !== this.props.visible && this.props.visible) {
            this.setDataForStatusGraphs();
        }
    }

    setDataForStatusGraphs = () => {
        const { oldParts, maintenances, failures, brands } = this.props;

        let oldPartsBMs = []
        for (let oldPart of oldParts) {
            for (let brandModel of brands) {
                if (brandModel["brandName"] === oldPart["brand"]["brandName"] && brandModel["modelName"] === oldPart["brand"]["modelName"]) {
                    let name = `${brandModel["brandName"]}/${brandModel["modelName"]}`;
                    let deploymentDateStr = oldPart["deploymentTime"] ? oldPart["deploymentTime"].substr(0, 10) : "unknown deployment date";
                    oldPartsBMs.push({ ...oldPart, brandModelText: name, brandModel: brandModel["_id"]["$oid"] })
                    if (oldPart["failureIDs"] && oldPart["failureIDs"].length) {
                        FailureService.getByCondition({ "inArray": { "_id": oldPart["failureIDs"] } }).then(res => {
                            let failures = res;
                            failures = failures.sort((a, b) => new Date(a["startTime"]) - new Date(b["startTime"]))
                            this.setState({
                                oldFailures: [...this.state.oldFailures, {
                                    failures: failures,
                                    name: name + "-" + deploymentDateStr, deploymentDate: oldPart["deploymentTime"]
                                }]
                            })
                        }).catch(err => {
                            console.log(err)
                        })
                    }
                    if (oldPart["maintenanceIDs"] && oldPart["maintenanceIDs"].length) {
                        MaintenanceService.getByCondition({ "inArray": { "_id": oldPart["maintenanceIDs"] } }).then(res => {
                            let mrecords = res;
                            mrecords = mrecords.sort((a, b) => new Date(a["startTime"]) - new Date(b["startTime"]))
                            this.setState({
                                oldMaintenanceRecords: [...this.state.oldMaintenanceRecords,
                                {
                                    maintenanceRecords: mrecords, name: name + "-" + deploymentDateStr,
                                    deploymentDate: oldPart["deploymentDate"]
                                }]
                            })
                        }).catch(err => {
                            console.log(err)
                        })
                    }
                }
            }
        }
        this.setState({ oldParts: oldPartsBMs })
    }

    dismissOverlay = (state) => {
        this.setState({ [state]: false, addBySelectedPart: false, propsPart: {} } as Pick<State, keyof State>)
    }

    deleteFailure = async (failure) => {
        const { getFailures, notify } = this.props;

        const result = await FailureService.removeFailure({ "recordId": failure["_id"]["$oid"] });

        if (result.data.success) {
            notify(deleteFailureSuccessfully())
            getFailures();
        } else {
            notify(deleteFailureFailure())
        }
    }

    deleteMaintenance = async (maintenance) => {
        const { getMaintenances, notify } = this.props;

        const result = await MaintenanceService.removeMaintenance({ "recordId": maintenance["_id"]["$oid"] });

        if (result.data.success) {
            notify(deleteMaintenanceSuccessfully())
            getMaintenances();
        } else {
            notify(deleteMaintenanceFailure())
        }
    }

    editFailure = (editRow) => {
        const updateData = {
            "selectedPart": { id: editRow.sid, text: editRow.sourceName },
            "selectedSeverity": editRow.severity,
            "costToFix": editRow.cost,
            "startTime": editRow.startTime,
            "endTime": editRow.endTime,
            "description": editRow.description,
            "editRowId": editRow._id.$oid,
        }

        this.setState({
            editMode: true,
            updateData: updateData,
            visibleAddUpdateFailure: true,
        })
    }

    editMaintenance = (editRow) => {
        const updateData = {
            "selectedPart": { id: editRow.sid !== null ? editRow.sid : "", text: editRow.asset },
            "maintenanceTime": editRow.maintenanceTime,
            "maintenanceReason": editRow.maintenanceReason,
            "maintenanceRequest": editRow.maintenanceRequest,
            "maintenanceInfo": editRow.maintenanceInfo,
            "maintenanceDownTime": editRow.maintenanceDownTime,
            "maintenanceType": editRow.maintenanceType,
            "maintenanceCost": editRow.maintenanceCost,
            "personResponsible": editRow.personResponsible,
            "editRowId": editRow._id.$oid,
            "failure": editRow.failure,
        }

        this.setState({
            editMode: true,
            updateData: updateData,
            visibleAddUpdateMaintenance: true,
        })
    }

    submit = async () => {
        const { deploymentTime, selectedBrand } = this.state;
        const { selectedPart, notify, refreshGraph } = this.props;

        if (deploymentTime === "" || Object.keys(selectedBrand).length === 0) {
            notify(pleaseFillInTheFormCompletely("Brand&Model, Deployment Time"));
            return;
        }

        if (deploymentTime === selectedPart["deploymentTime"] && selectedBrand === selectedPart["brand"]) {
            notify(generalErrorMessage("No change detected"));
            return;
        }

        const payload = {
            "type": selectedPart["type"],
            "name": selectedPart["name"],
            "brand": selectedBrand,
            deploymentTime,
        }

        const result = await DTService.update(payload);

        if (result.success) {
            notify(generalSuccessMessage(result.message.text));
            refreshGraph();
        } else {
            notify(generalErrorMessage(result.message.text));
        }
    }

    clearComponent = () => {
        this.setState({
            deploymentTime: "",
            selectedBrand: {},
        })
    }

    onDismiss = () => {
        const { onDismiss } = this.props;
        onDismiss();
    }

    openRetire = () => {
        const { selectedPart, notify } = this.props;

        if (selectedPart["deploymentTime"] !== undefined && selectedPart["deploymentTime"] !== "") {
            this.setState({ visibleRetirePart: true })
        } else {
            notify(generalErrorMessage("Brand and Deployment Time cannot be empty"));
        }
    }

    handeDetailOldPart = (row) => {
        this.setState({ selectedOldPart: row, visibleRetirePartDetail: true });
    }

    clickRelatedMaintenance = async () => {
        const { selectedPart } = this.props;

        const payload = {
            "inside": [
                { "asset": selectedPart["name"] }
            ],
            "exists": [
                { "retired": false }
            ]
        };

        const maintenances = await MaintenanceService.getByCondition(payload);

        this.setState({
            visibleRelatedMaintenanceFailure: true,
            relatedType: "maintenance",
            relatedMaintenances: maintenances,
        })
    }

    clickRelatedFailure = async () => {
        const { selectedPart } = this.props;

        const payload = {
            "inside": [
                { "sourceName": selectedPart["name"] }
            ],
            "exists": [
                { "retired": false }
            ]
        };

        const failures = await FailureService.getByCondition(payload);

        this.setState({
            visibleRelatedMaintenanceFailure: true,
            relatedType: "failure",
            relatedFailures: failures,
        })
    }

    render() {
        const { visible, maintenances, failures, brands, refreshGraph,
            selectedPart, getMaintenances, getFailures, generalInfo,
        } = this.props;

        const {
            visibleAddUpdateFailure, addBySelectedPart, propsPart, editMode, relatedMaintenances,
            updateData, visibleAddUpdateMaintenance, deploymentTime, selectedBrand, relatedType,
            visibleRetirePart, visibleRetirePartDetail, selectedOldPart, visibleRelatedMaintenanceFailure,
            relatedFailures, showStatus,
        } = this.state;

        let oldParts = this.state.oldParts.sort((a, b) => new Date(a["terminationTime"]) - new Date(b["terminationTime"]))


        return (
            <>
                <AddUpdateMaintenanceOverlay
                    visibleAddUpdateMaintenance={visibleAddUpdateMaintenance}
                    handleDismissAddUpdateMaintenance={() => {
                        this.setState({
                            visibleAddUpdateMaintenance: false,
                            addBySelectedPart: false,
                            propsPart: {},
                            editMode: false,
                        })
                        getMaintenances();
                    }}
                    getAllMaintenance={() => { }}
                    isEdit={editMode}
                    factoryID={generalInfo["factoryID"]}
                    updateData={updateData}
                    addBySelectedPart={addBySelectedPart}
                    propsPart={propsPart}
                />

                <AddUpdateFailureOverlay
                    visibleAddUpdateFailure={visibleAddUpdateFailure}
                    handleDismissAddUpdateFailure={() => {
                        this.setState({
                            visibleAddUpdateFailure: false,
                            addBySelectedPart: false,
                            propsPart: {},
                            editMode: false,
                        })
                        getFailures();
                    }}
                    getAllFailures={() => { }}
                    isEdit={editMode}
                    factoryID={generalInfo["factoryID"]}
                    updateData={updateData}
                    addBySelectedPart={addBySelectedPart}
                    propsPart={propsPart}
                    isDetail={false}
                />

                <RetirePart
                    visible={visibleRetirePart}
                    onDismiss={() => { this.setState({ visibleRetirePart: false }) }}
                    selectedPart={selectedPart}
                    getMaintenances={getMaintenances}
                    getFailures={getFailures}
                    refreshGraph={refreshGraph}
                    clearComponent={this.clearComponent}
                    getOldParts={this.props.getOldParts}
                />

                <RetirePartDetail
                    visible={visibleRetirePartDetail}
                    onDismiss={() => { this.setState({ visibleRetirePartDetail: false }) }}
                    selectedOldPart={selectedOldPart}
                />

                <RelatedMaintenanceFailureTable
                    visible={visibleRelatedMaintenanceFailure}
                    relatedType={relatedType}
                    onDismiss={() => { this.setState({ visibleRelatedMaintenanceFailure: false }) }}
                    selectedPart={selectedPart}
                    relatedMaintenances={relatedMaintenances}
                    relatedFailures={relatedFailures}
                />

                <StatusOverlay
                    visible={showStatus}
                    onDismiss={() => { this.setState({ showStatus: false }) }}
                    selectedPart={selectedPart}
                    currentDeploymentDate={deploymentTime}
                    currentFailures={failures}
                    currentMaintenanceRecords={maintenances}
                    currentBrandModel={`${selectedBrand["brandName"]}/${selectedBrand["modelName"]}`}
                    oldParts={oldParts}
                    oldFailures={this.state.oldFailures}
                    oldMaintenanceRecords={this.state.oldMaintenanceRecords}
                />

                <Overlay visible={visible}>
                    <Overlay.Container maxWidth={1000}>
                        <Overlay.Header
                            title={`${selectedPart["type"]}: ${selectedPart["name"]} Information`}
                            onDismiss={this.onDismiss}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Column widthXS={Columns.Six}>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <h6 style={{ float: 'left' }}>Current {selectedPart["type"]}</h6>

                                            <Button
                                                style={{ float: 'right', marginTop: '10px' }}
                                                text="Show Status"
                                                icon={IconFont.Eye}
                                                type={ButtonType.Button}
                                                color={ComponentColor.Secondary}
                                                onClick={() => { this.setState({ showStatus: true }) }}
                                            />
                                        </Grid.Column>
                                    </Grid.Row>

                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label={`${selectedPart["type"]} Brand&Model`}>
                                                <Dropdown
                                                    button={(active, onClick) => (
                                                        <Dropdown.Button
                                                            active={active}
                                                            onClick={onClick}
                                                            color={ComponentColor.Default}
                                                        >
                                                            {`${selectedBrand['brandName']}/${selectedBrand['modelName']}`}
                                                        </Dropdown.Button>
                                                    )}
                                                    menu={onCollapse => (
                                                        <Dropdown.Menu onCollapse={onCollapse}>
                                                            {
                                                                brands.map((item, idx) => {
                                                                    let newItem = JSON.parse(JSON.stringify(item));
                                                                    delete newItem["_id"];

                                                                    return (
                                                                        <Dropdown.Item
                                                                            key={idx}
                                                                            value={newItem}
                                                                            onClick={(e) => { this.setState({ selectedBrand: e }) }}
                                                                        >
                                                                            {`${newItem['brandName']}/${newItem['modelName']}`}
                                                                        </Dropdown.Item>
                                                                    )
                                                                })
                                                            }
                                                        </Dropdown.Menu>
                                                    )}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>

                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label="Deployment Date">
                                                <input
                                                    value={deploymentTime}
                                                    type='datetime-local'
                                                    onChange={(e) => { this.setState({ deploymentTime: e.target.value }) }}
                                                    style={{ background: '#383846', color: '#ffffff' }}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>

                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <div style={{ float: 'right' }}>
                                                {
                                                    <FlexBox margin={ComponentSize.Medium}>
                                                        <Button
                                                            text={`Retire ${selectedPart["type"]}`}
                                                            icon={IconFont.Shuffle}
                                                            type={ButtonType.Button}
                                                            color={ComponentColor.Primary}
                                                            onClick={() => { this.openRetire() }}
                                                        />
                                                        <Button
                                                            text="Update"
                                                            icon={IconFont.Plus}
                                                            type={ButtonType.Button}
                                                            color={ComponentColor.Secondary}
                                                            onClick={this.submit}
                                                        />
                                                    </FlexBox>
                                                }
                                            </div>
                                        </Grid.Column>
                                    </Grid.Row>

                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label="Maintenance Records">
                                                <Panel style={{ minHeight: '200px' }}>
                                                    {
                                                        maintenances.length > 0 ? (
                                                            <DapperScrollbars
                                                                autoHide={false}
                                                                autoSizeHeight={true}
                                                                style={{ maxHeight: '200px' }}
                                                                className="data-loading--scroll-content"
                                                            >
                                                                <Table
                                                                    borders={BorderType.Vertical}
                                                                    fontSize={ComponentSize.ExtraSmall}
                                                                    cellPadding={ComponentSize.ExtraSmall}
                                                                >
                                                                    <Table.Header>
                                                                        <Table.Row>
                                                                            <Table.HeaderCell style={{ width: "300px" }}>Maintenance Date</Table.HeaderCell>
                                                                            <Table.HeaderCell style={{ width: "300px" }}>Maintenance Type</Table.HeaderCell>
                                                                            <Table.HeaderCell style={{ width: "100px" }}></Table.HeaderCell>
                                                                        </Table.Row>
                                                                    </Table.Header>
                                                                    <Table.Body>
                                                                        {
                                                                            maintenances.map(row => {
                                                                                let recordId = row["_id"]["$oid"];
                                                                                return (
                                                                                    <Table.Row key={recordId}>
                                                                                        <Table.Cell>{row["maintenanceTime"]}</Table.Cell>
                                                                                        <Table.Cell>{row["maintenanceType"]}</Table.Cell>
                                                                                        <Table.Cell>
                                                                                            <FlexBox margin={ComponentSize.Medium}>
                                                                                                <Button
                                                                                                    icon={IconFont.Pencil}
                                                                                                    type={ButtonType.Button}
                                                                                                    color={ComponentColor.Primary}
                                                                                                    size={ComponentSize.ExtraSmall}
                                                                                                    onClick={() => { this.editMaintenance(row) }}
                                                                                                />
                                                                                                <ConfirmationButton
                                                                                                    icon={IconFont.Remove}
                                                                                                    onConfirm={() => { this.deleteMaintenance(row) }}
                                                                                                    text={""}
                                                                                                    size={ComponentSize.ExtraSmall}
                                                                                                    popoverColor={ComponentColor.Danger}
                                                                                                    popoverAppearance={Appearance.Outline}
                                                                                                    color={ComponentColor.Danger}
                                                                                                    confirmationLabel="Do you want to delete ?"
                                                                                                    confirmationButtonColor={ComponentColor.Danger}
                                                                                                    confirmationButtonText="Yes"
                                                                                                />
                                                                                            </FlexBox>
                                                                                        </Table.Cell>
                                                                                    </Table.Row>
                                                                                )
                                                                            })
                                                                        }
                                                                    </Table.Body>
                                                                </Table>
                                                            </DapperScrollbars>
                                                        ) : (
                                                            <p>NO MAINTENANCE</p>
                                                        )
                                                    }
                                                </Panel>
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>

                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <div style={{ float: 'right' }}>
                                                {
                                                    <FlexBox margin={ComponentSize.Medium}>
                                                        {
                                                            ["Component", "Machine"].includes(selectedPart["type"]) &&
                                                            <Button
                                                                text="Related Maintenance"
                                                                icon={IconFont.TextBlock}
                                                                type={ButtonType.Button}
                                                                color={ComponentColor.Primary}
                                                                onClick={() => { this.clickRelatedMaintenance() }}
                                                            />
                                                        }

                                                        <Button
                                                            text="Add Maintenance"
                                                            icon={IconFont.Plus}
                                                            type={ButtonType.Button}
                                                            color={ComponentColor.Secondary}
                                                            onClick={() => {
                                                                this.setState({
                                                                    visibleAddUpdateMaintenance: true,
                                                                    addBySelectedPart: true,
                                                                    propsPart: selectedPart,
                                                                    editMode: false
                                                                })
                                                            }}
                                                        />
                                                    </FlexBox>
                                                }
                                            </div>
                                        </Grid.Column>

                                    </Grid.Row>

                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label="Failure Records">
                                                <Panel style={{ minHeight: '200px' }}>
                                                    {
                                                        failures.length > 0 ? (
                                                            <DapperScrollbars
                                                                autoHide={false}
                                                                autoSizeHeight={true}
                                                                style={{ maxHeight: '200px' }}
                                                                className="data-loading--scroll-content"
                                                            >
                                                                <Table
                                                                    borders={BorderType.Vertical}
                                                                    fontSize={ComponentSize.ExtraSmall}
                                                                    cellPadding={ComponentSize.ExtraSmall}
                                                                >
                                                                    <Table.Header>
                                                                        <Table.Row>
                                                                            <Table.HeaderCell style={{ width: "300px" }}>Start Time</Table.HeaderCell>
                                                                            <Table.HeaderCell style={{ width: "300px" }}>Severity</Table.HeaderCell>
                                                                            <Table.HeaderCell style={{ width: "100px" }}></Table.HeaderCell>
                                                                        </Table.Row>
                                                                    </Table.Header>
                                                                    <Table.Body>
                                                                        {
                                                                            failures.map(row => {
                                                                                let startTimeDate = new Date(row["startTime"])
                                                                                let recordId = row["_id"]["$oid"];
                                                                                return (
                                                                                    <Table.Row key={recordId}>
                                                                                        <Table.Cell>{(startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.toLocaleString() : ""}</Table.Cell>
                                                                                        <Table.Cell>{row["severity"]}</Table.Cell>
                                                                                        <Table.Cell>
                                                                                            <FlexBox margin={ComponentSize.Medium}>
                                                                                                <Button
                                                                                                    icon={IconFont.Pencil}
                                                                                                    type={ButtonType.Button}
                                                                                                    color={ComponentColor.Primary}
                                                                                                    size={ComponentSize.ExtraSmall}
                                                                                                    onClick={() => { this.editFailure(row) }}
                                                                                                />
                                                                                                <ConfirmationButton
                                                                                                    icon={IconFont.Remove}
                                                                                                    onConfirm={() => { this.deleteFailure(row) }}
                                                                                                    text={""}
                                                                                                    size={ComponentSize.ExtraSmall}
                                                                                                    popoverColor={ComponentColor.Danger}
                                                                                                    popoverAppearance={Appearance.Outline}
                                                                                                    color={ComponentColor.Danger}
                                                                                                    confirmationLabel="Do you want to delete ?"
                                                                                                    confirmationButtonColor={ComponentColor.Danger}
                                                                                                    confirmationButtonText="Yes"
                                                                                                />
                                                                                            </FlexBox>
                                                                                        </Table.Cell>
                                                                                    </Table.Row>
                                                                                )
                                                                            })
                                                                        }
                                                                    </Table.Body>
                                                                </Table>
                                                            </DapperScrollbars>
                                                        ) : (
                                                            <p>NO FAILURE</p>
                                                        )
                                                    }
                                                </Panel>
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>

                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <div style={{ float: 'right' }}>
                                                {
                                                    <FlexBox margin={ComponentSize.Medium}>
                                                        {
                                                            ["Component", "Machine"].includes(selectedPart["type"]) &&
                                                            <Button
                                                                text="Related Failure"
                                                                icon={IconFont.TextBlock}
                                                                type={ButtonType.Button}
                                                                color={ComponentColor.Primary}
                                                                onClick={() => { this.clickRelatedFailure() }}
                                                            />
                                                        }
                                                        <Button
                                                            text="Add Failure"
                                                            icon={IconFont.Plus}
                                                            type={ButtonType.Button}
                                                            color={ComponentColor.Secondary}
                                                            onClick={() => {
                                                                this.setState({
                                                                    visibleAddUpdateFailure: true,
                                                                    addBySelectedPart: true,
                                                                    propsPart: selectedPart,
                                                                    editMode: false
                                                                })
                                                            }}
                                                        />
                                                    </FlexBox>
                                                }
                                            </div>
                                        </Grid.Column>
                                    </Grid.Row>

                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Six}>
                                    <h6>Old {selectedPart["type"]}</h6>

                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Panel style={{ minHeight: '625px' }}>
                                                <DapperScrollbars
                                                    autoHide={false}
                                                    autoSizeHeight={true}
                                                    style={{ maxHeight: '600px' }}
                                                    className="data-loading--scroll-content"
                                                >
                                                    <Table
                                                        borders={BorderType.Vertical}
                                                        fontSize={ComponentSize.ExtraSmall}
                                                        cellPadding={ComponentSize.ExtraSmall}
                                                    >
                                                        <Table.Header>
                                                            <Table.Row>
                                                                <Table.HeaderCell style={{ width: "200px" }}>Brand/Model</Table.HeaderCell>
                                                                <Table.HeaderCell style={{ width: "200px" }}>Deployment Date</Table.HeaderCell>
                                                                <Table.HeaderCell style={{ width: "200px" }}>Termination Date</Table.HeaderCell>
                                                                <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell>
                                                            </Table.Row>
                                                        </Table.Header>
                                                        <Table.Body>
                                                            {
                                                                oldParts.map(row => {
                                                                    let recordId = row["_id"]["$oid"];
                                                                    return (
                                                                        <Table.Row key={recordId}>
                                                                            <Table.Cell>{row["brand"]["brandName"]}/{row["brand"]["modelName"]}</Table.Cell>
                                                                            <Table.Cell>{row["deploymentTime"]}</Table.Cell>
                                                                            <Table.Cell>{row["terminationTime"]}</Table.Cell>
                                                                            <Table.Cell>
                                                                                <FlexBox margin={ComponentSize.Medium}>
                                                                                    <Button
                                                                                        icon={IconFont.EyeOpen}
                                                                                        type={ButtonType.Button}
                                                                                        color={ComponentColor.Primary}
                                                                                        size={ComponentSize.ExtraSmall}
                                                                                        onClick={() => { this.handeDetailOldPart(row) }}
                                                                                    />
                                                                                </FlexBox>
                                                                            </Table.Cell>
                                                                        </Table.Row>
                                                                    )
                                                                })
                                                            }
                                                        </Table.Body>
                                                    </Table>
                                                </DapperScrollbars>
                                            </Panel>
                                        </Grid.Column>
                                    </Grid.Row>

                                </Grid.Column>
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay >
            </>
        );
    }
}


const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(BMFInformation);
