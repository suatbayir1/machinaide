// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'

// Components
import {
    Form, Button, ButtonType, ComponentColor, Overlay, IconFont, Grid, Columns,
    DapperScrollbars, Table, BorderType, ComponentSize,
    FlexBox, Panel, Input, ComponentStatus,
} from '@influxdata/clockface'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Services
import FailureService from "src/shared/services/FailureService";
import MaintenanceService from "src/maintenance/services/MaintenanceService";

// Overlays
import AddUpdateFailureOverlay from 'src/side_nav/components/newAdd/modules/AddUpdateFailureOverlay';
import AddUpdateMaintenanceOverlay from "src/maintenance/components/AddUpdateMaintenanceOverlay";


interface OwnProps {
    visible: boolean
    onDismiss: () => void
    selectedOldPart: object
}

interface State {
    maintenances: object[]
    failures: object[]
    visibleDetailFailure: boolean
    editMode: boolean
    updateData: object
    isDetail: boolean
    visibleDetailMaintenance: boolean
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class RetirePartDetail extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            maintenances: [],
            failures: [],
            editMode: false,
            visibleDetailFailure: false,
            updateData: {},
            isDetail: false,
            visibleDetailMaintenance: false,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.selectedOldPart !== this.props.selectedOldPart) {
            this.getMaintenances();
            this.getFailures();
        }
    }

    getMaintenances = async () => {
        const { selectedOldPart } = this.props;

        const payload = {
            "match": [
                { "retired": selectedOldPart["_id"]["$oid"] }
            ],
        };

        const maintenances = await MaintenanceService.getByCondition(payload);
        this.setState({ maintenances })
    }

    getFailures = async () => {
        const { selectedOldPart } = this.props;

        const payload = {
            "match": [
                { "retired": selectedOldPart["_id"]["$oid"] }
            ],
        };

        const failures = await FailureService.getByCondition(payload);
        this.setState({ failures })
    }

    detailFailure = (editRow) => {
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
            visibleDetailFailure: true,
            isDetail: true,
        })
    }

    detailMaintenance = (editRow) => {
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
            visibleDetailMaintenance: true,
            isDetail: true,
        })
    }

    render() {
        const { visible, onDismiss, selectedOldPart } = this.props;
        const { maintenances, failures, visibleDetailFailure, updateData, editMode, isDetail, visibleDetailMaintenance } = this.state;

        return (
            <>
                <AddUpdateFailureOverlay
                    visibleAddUpdateFailure={visibleDetailFailure}
                    handleDismissAddUpdateFailure={() => {
                        this.setState({
                            visibleDetailFailure: false,
                            editMode: false,
                            isDetail: false,
                        })
                    }}
                    getAllFailures={() => { }}
                    isEdit={editMode}
                    factoryID={"Ermetal"}
                    updateData={updateData}
                    addBySelectedPart={false}
                    isDetail={isDetail}
                />

                <AddUpdateMaintenanceOverlay
                    visibleAddUpdateMaintenance={visibleDetailMaintenance}
                    handleDismissAddUpdateMaintenance={() => {
                        this.setState({
                            visibleDetailMaintenance: false,
                            editMode: false,
                            isDetail: false,
                        })
                    }}
                    getAllMaintenance={() => { }}
                    isEdit={editMode}
                    factoryID={"Ermetal"}
                    updateData={updateData}
                    addBySelectedPart={false}
                    isDetail={isDetail}
                />

                <Overlay visible={visible}>
                    <Overlay.Container maxWidth={1000}>
                        <Overlay.Header
                            title={`Old ${selectedOldPart['type']}: ${selectedOldPart['name']} Information`}
                            onDismiss={onDismiss}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Four}>
                                        <Form.Element label={`${selectedOldPart["type"]} Name`} required={true}>
                                            <Input
                                                onChange={() => { }}
                                                value={selectedOldPart["name"]}
                                                status={ComponentStatus.Disabled}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Four}>
                                        <Form.Element label="Deployment Date" required={true}>
                                            <input
                                                value={selectedOldPart["deploymentTime"]}
                                                type='datetime-local'
                                                disabled
                                                style={{ background: '#383846', color: '#ffffff' }}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Four}>
                                        <Form.Element label="Termination Date" required={true}>
                                            <input
                                                value={selectedOldPart["terminationTime"]}
                                                type='datetime-local'
                                                disabled
                                                style={{ background: '#383846', color: '#ffffff' }}
                                            />
                                        </Form.Element>
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
                                                                        <Table.HeaderCell style={{ width: "300px" }}>Description</Table.HeaderCell>
                                                                        <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell>
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
                                                                                    <Table.Cell>{String(row["jobDescription"]).substring(0, 50)}...</Table.Cell>
                                                                                    <Table.Cell>
                                                                                        <FlexBox margin={ComponentSize.Medium}>
                                                                                            <Button
                                                                                                icon={IconFont.EyeOpen}
                                                                                                type={ButtonType.Button}
                                                                                                color={ComponentColor.Primary}
                                                                                                size={ComponentSize.ExtraSmall}
                                                                                                onClick={() => { this.detailMaintenance(row) }}
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
                                                                        <Table.HeaderCell style={{ width: "300px" }}>Start Date</Table.HeaderCell>
                                                                        <Table.HeaderCell style={{ width: "300px" }}>End Date</Table.HeaderCell>
                                                                        <Table.HeaderCell style={{ width: "300px" }}>Severity</Table.HeaderCell>
                                                                        <Table.HeaderCell style={{ width: "300px" }}>Description</Table.HeaderCell>
                                                                        <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell>
                                                                    </Table.Row>
                                                                </Table.Header>
                                                                <Table.Body>
                                                                    {
                                                                        failures.map(row => {
                                                                            let startTimeDate = new Date(row["startTime"])
                                                                            let endTimeDate = new Date(row["endTime"])
                                                                            let recordId = row["_id"]["$oid"];
                                                                            return (
                                                                                <Table.Row key={recordId}>
                                                                                    <Table.Cell>{(startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.toLocaleString() : ""}</Table.Cell>
                                                                                    <Table.Cell>{(endTimeDate instanceof Date && !isNaN(endTimeDate.valueOf())) ? endTimeDate.toLocaleString() : ""}</Table.Cell>
                                                                                    <Table.Cell>{row["severity"]}</Table.Cell>
                                                                                    <Table.Cell>{String(row["description"]).substring(0, 50)}...</Table.Cell>
                                                                                    <Table.Cell>
                                                                                        <FlexBox margin={ComponentSize.Medium}>
                                                                                            <Button
                                                                                                icon={IconFont.EyeOpen}
                                                                                                type={ButtonType.Button}
                                                                                                color={ComponentColor.Primary}
                                                                                                size={ComponentSize.ExtraSmall}
                                                                                                onClick={() => { this.detailFailure(row) }}
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

export default connector(RetirePartDetail);
