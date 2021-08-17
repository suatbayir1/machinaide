// Libraries
import React, { PureComponent } from 'react'

// Components
import {
    Form, Input, Button, ButtonType, ComponentColor, Overlay, IconFont, Grid, Columns,
    TextArea, ComponentSize, Gradients, Dropdown, InputType, Notification,
    ComponentStatus, DapperScrollbars, BorderType, Table, FlexBox, Panel, QuestionMarkTooltip,
} from '@influxdata/clockface'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import Checkbox from 'src/shared/components/Checkbox'

// Services
import DTService from 'src/shared/services/DTService';
import MaintenanceService from 'src/maintenance/services/MaintenanceService';
import FailureService from 'src/shared/services/FailureService';

interface Props {
    visibleAddUpdateMaintenance: boolean
    handleDismissAddUpdateMaintenance: () => void
    getAllMaintenance: () => void
    isEdit: boolean
    factoryID: string
    updateData: object
    addBySelectedPart: boolean
    propsPart: object
    isDetail: boolean
}

interface State {
    formMode: boolean,
    dialogBox: boolean,
    overlay: boolean,
    allParts: object[],
    selectedPart: object,
    selectedSeverity: string,
    costToFix: number,
    description: string,
    maintenanceTime: string,
    endTime: string,
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    editRowId: string
    selectedFaultType: string
    selectedMaintenanceType: string
    faultReason: string
    unoperationalDuration: number
    request: string
    jobDescription: string
    activeTab: string
    failures: object[]
    selectedFailure: object


    maintenanceReason: string
    maintenanceRequest: string
    maintenanceInfo: string
    maintenanceDownTime: string
    maintenanceType: string
    maintenanceCost: string
    personResponsible: string
}

class AddUpdateMaintenanceOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            formMode: false,
            dialogBox: false,
            overlay: false,
            allParts: [],
            selectedPart: {},
            selectedSeverity: "minor",
            costToFix: null,
            description: "",
            maintenanceTime: "",
            endTime: "",
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            editRowId: "",
            selectedFaultType: "",
            selectedMaintenanceType: "",
            faultReason: "",
            unoperationalDuration: 0,
            jobDescription: "",
            request: "",
            activeTab: "periodic",
            failures: [],
            selectedFailure: {},


            maintenanceReason: "",
            maintenanceRequest: "",
            maintenanceInfo: "",
            maintenanceDownTime: "",
            maintenanceType: "",
            maintenanceCost: "",
            personResponsible: "",
        };
    }

    async componentDidMount(): Promise<void> {
        await this.getCombinationAllHierarchy();
        const failures = await FailureService.getAllFailures();
        console.log(failures);
        this.setState({
            failures,
        });
    }

    async componentDidUpdate(prevProps) {
        if (this.props.isEdit && prevProps.updateData !== this.props.updateData) {
            this.handleChangeEditRowData(this.props.updateData);
        }

        if (this.props.addBySelectedPart && prevProps.propsPart !== this.props.propsPart) {
            this.setState({
                selectedPart: this.state.allParts.find(p => p["id"] === this.props.propsPart["name"])
            })
        }
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    clearForm = () => {
        this.setState({
            maintenanceReason: "",
            maintenanceRequest: "",
            maintenanceInfo: "",
            maintenanceDownTime: "",
            maintenanceType: "",
            maintenanceCost: "",
            personResponsible: "",
            selectedPart: {},
            maintenanceTime: "",
            editRowId: "",
        });
    }

    handleChangeEditRowData = (editRow) => {
        console.log("editorRow", editRow);
        const { failures } = this.state;

        console.log(failures);

        if (editRow.failure !== null && editRow.failure !== undefined) {
            this.setState({
                activeTab: "related",
                selectedFailure: failures.find(f => f["_id"]["$oid"] === editRow.failure)
            })
        }

        this.setState({
            selectedPart: editRow.selectedPart,
            maintenanceTime: editRow.maintenanceTime,
            maintenanceReason: editRow.maintenanceReason,
            maintenanceRequest: editRow.maintenanceRequest,
            maintenanceInfo: editRow.maintenanceInfo,
            maintenanceDownTime: editRow.maintenanceDownTime,
            maintenanceType: editRow.maintenanceType,
            maintenanceCost: editRow.maintenanceCost,
            personResponsible: editRow.personResponsible,
            editRowId: editRow.editRowId,
        });
    }

    getCombinationAllHierarchy = async () => {
        const allDT = await DTService.getAllDT();

        allDT.forEach(factory => {
            const parts = [];

            factory.productionLines.map(pl => {
                pl.machines.map(machine => {
                    parts.push({ id: machine["@id"], text: machine["name"] });
                    machine.contents.map(component => {
                        if (component["@type"] === "Component") {
                            parts.push({ id: component["@id"], text: `${machine["name"]}.${component["name"]}` });
                            component.sensors.map(sensor => {
                                parts.push({ id: sensor["@id"], text: `${machine["name"]}.${component["name"]}.${sensor["name"]}` });
                            })
                        }
                    })
                })
            })

            this.setState({ allParts: parts });
        })
    }

    handleChangeSelectedPart = (e) => {
        this.setState({ selectedPart: e });
    }

    handleChangeMaintenanceTime = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    handleClickSave = async () => {
        const { selectedPart, selectedFailure, activeTab, maintenanceTime, maintenanceReason,
            maintenanceRequest, maintenanceInfo, maintenanceDownTime, maintenanceType, maintenanceCost,
            personResponsible, } = this.state;

        if (activeTab === "periodic") {
            if (Object.keys(selectedPart).length === 0 || maintenanceTime === "") {
                this.setState({
                    notificationVisible: true,
                    notificationType: "error",
                    notificationMessage: "Please fill in the form completely",
                })
                return;
            }
        } else if (activeTab === "related") {
            if (Object.keys(selectedFailure).length === 0 || maintenanceTime === "") {
                this.setState({
                    notificationVisible: true,
                    notificationType: "error",
                    notificationMessage: "Please fill in the form completely",
                })
                return;
            }
        }

        console.log(selectedFailure);
        console.log(selectedPart);

        const payload = {
            "asset": activeTab === "periodic" ? selectedPart["text"] : selectedFailure["sourceName"],
            "sid": activeTab === "periodic" ? selectedPart["id"] : selectedFailure["sid"],
            maintenanceTime,
            maintenanceReason,
            maintenanceRequest,
            maintenanceInfo,
            maintenanceDownTime,
            maintenanceType,
            maintenanceCost,
            personResponsible,
            "factoryID": this.props.factoryID,
            "failure": activeTab === "related" ? selectedFailure["_id"]["$oid"] : null
        }

        if (this.props.isEdit) {
            this.updateMaintenance(payload);
        } else {
            this.addMaintenance(payload);
        }
    }

    updateMaintenance = async (payload) => {
        payload["recordId"] = this.state.editRowId;
        const result = await MaintenanceService.updateMaintenance(payload);

        if (result.data.summary.code === 200) {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: "Maintenance record updated successfully",
            });
        }

        this.props.getAllMaintenance();
        this.props.handleDismissAddUpdateMaintenance();
        this.clearForm();
    }

    addMaintenance = async (payload) => {
        const result = await MaintenanceService.addMaintenance(payload);
        if (result.data.summary.code === 200) {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: "Maintenance record created successfully",
                maintenanceReason: "",
                maintenanceRequest: "",
                maintenanceInfo: "",
                maintenanceDownTime: "",
                maintenanceType: "",
                maintenanceCost: "",
                personResponsible: "",
                selectedPart: {},
                maintenanceTime: "",
                formMode: false,
            })
            this.props.getAllMaintenance();
            this.props.handleDismissAddUpdateMaintenance();
            this.clearForm();
            return;
        }
    }

    closeOverlay = () => {
        this.props.handleDismissAddUpdateMaintenance();
        this.clearForm();
    }

    render() {
        const { visibleAddUpdateMaintenance, addBySelectedPart, isEdit, isDetail } = this.props;
        const {
            activeTab, failures, selectedFailure, maintenanceReason, maintenanceRequest,
            maintenanceInfo, maintenanceDownTime, maintenanceType, maintenanceCost, personResponsible,
        } = this.state;

        const allParts = this.state.allParts.map(item => {
            return (
                <Dropdown.Item
                    id={item['id']}
                    key={item['id']}
                    value={item}
                    onClick={this.handleChangeSelectedPart}
                >
                    {item['text']}
                </Dropdown.Item>
            )
        })

        return (
            <>
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

                <Overlay visible={visibleAddUpdateMaintenance}>
                    <Overlay.Container maxWidth={800}>
                        <Overlay.Header
                            title={
                                isDetail ? "Detail Maintenance Record" : (
                                    isEdit ? "Update Maintenance Record" : "Add Maintenance Record"
                                )
                            }
                            onDismiss={this.closeOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <TabbedPageTabs
                                            tabs={[
                                                {
                                                    text: 'Periodic Maintenance',
                                                    id: 'periodic',
                                                },
                                                {
                                                    text: 'Failure Related',
                                                    id: 'related',
                                                },
                                            ]}
                                            activeTab={activeTab}
                                            onTabClick={(e) => { this.setState({ activeTab: e }) }}
                                        />

                                        {
                                            activeTab === "periodic" &&
                                            <Grid.Row style={{ marginTop: '20px' }}>
                                                <Grid.Column widthXS={Columns.Twelve}>
                                                    <Form.Element label="Asset" required={true}>
                                                        <Dropdown
                                                            button={(active, onClick) => (
                                                                <Dropdown.Button
                                                                    status={
                                                                        addBySelectedPart || isEdit || isDetail
                                                                            ? ComponentStatus.Disabled
                                                                            : ComponentStatus.Default
                                                                    }
                                                                    active={active}
                                                                    onClick={onClick}
                                                                    color={ComponentColor.Default}
                                                                >
                                                                    {this.state.selectedPart['text']}
                                                                </Dropdown.Button>
                                                            )}
                                                            menu={onCollapse => (
                                                                <Dropdown.Menu onCollapse={onCollapse}>
                                                                    {
                                                                        allParts
                                                                    }
                                                                </Dropdown.Menu>
                                                            )}
                                                        />
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>
                                        }

                                        {
                                            activeTab === "related" &&
                                            <Grid.Row style={{ marginTop: '20px', marginBottom: '10px' }}>
                                                <Grid.Column widthXS={Columns.Twelve}>
                                                    <Form.Element label="Asset" required={true}>
                                                        <Panel style={{ minHeight: '200px' }}>
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
                                                                            <Table.HeaderCell style={{ width: "400px" }}>Asset Name</Table.HeaderCell>
                                                                            <Table.HeaderCell style={{ width: "200px" }}>Start Time</Table.HeaderCell>
                                                                            <Table.HeaderCell style={{ width: "200px" }}>Severity</Table.HeaderCell>
                                                                            <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell>
                                                                        </Table.Row>
                                                                    </Table.Header>
                                                                    <Table.Body>
                                                                        {
                                                                            failures.map(row => {
                                                                                let recordId = row["_id"]["$oid"];
                                                                                return (
                                                                                    <Table.Row key={recordId}>
                                                                                        <Table.Cell>{row["sourceName"]}</Table.Cell>
                                                                                        <Table.Cell>{row["startTime"]}</Table.Cell>
                                                                                        <Table.Cell>{row["severity"]}</Table.Cell>
                                                                                        <Table.Cell>
                                                                                            <FlexBox margin={ComponentSize.Medium} >
                                                                                                <QuestionMarkTooltip
                                                                                                    diameter={14}
                                                                                                    color={ComponentColor.Primary}
                                                                                                    tooltipContents={row["description"]}
                                                                                                />
                                                                                                <Checkbox
                                                                                                    label=""
                                                                                                    checked={selectedFailure === row}
                                                                                                    onSetChecked={() => { this.setState({ selectedFailure: row }) }}
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
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>
                                        }

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Date" required={true}>
                                                    <input
                                                        type='datetime-local'
                                                        value={this.state.maintenanceTime}
                                                        onChange={(e) => { this.setState({ maintenanceTime: e.target.value }) }}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                        disabled={
                                                            isDetail
                                                                ? true
                                                                : false
                                                        }
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Reason">
                                                    <Input
                                                        onChange={(e) => { this.setState({ maintenanceReason: e.target.value }) }}
                                                        value={maintenanceReason}
                                                        status={
                                                            isDetail
                                                                ? ComponentStatus.Disabled
                                                                : ComponentStatus.Default
                                                        }
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Request">
                                                    <TextArea
                                                        rows={5}
                                                        value={maintenanceRequest}
                                                        onChange={(e) => this.setState({ maintenanceRequest: e.target.value })}
                                                        status={
                                                            isDetail
                                                                ? ComponentStatus.Disabled
                                                                : ComponentStatus.Default
                                                        }
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Info">
                                                    <TextArea
                                                        rows={5}
                                                        value={maintenanceInfo}
                                                        onChange={(e) => this.setState({ maintenanceInfo: e.target.value })}
                                                        status={
                                                            isDetail
                                                                ? ComponentStatus.Disabled
                                                                : ComponentStatus.Default
                                                        }
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Down Time">
                                                    <Input
                                                        onChange={(e) => { this.setState({ maintenanceDownTime: e.target.value }) }}
                                                        type={InputType.Number}
                                                        value={maintenanceDownTime}
                                                        status={
                                                            isDetail
                                                                ? ComponentStatus.Disabled
                                                                : ComponentStatus.Default
                                                        }
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Type">
                                                    <Input
                                                        onChange={(e) => { this.setState({ maintenanceType: e.target.value }) }}
                                                        value={maintenanceType}
                                                        status={
                                                            isDetail
                                                                ? ComponentStatus.Disabled
                                                                : ComponentStatus.Default
                                                        }
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Cost">
                                                    <Input
                                                        onChange={(e) => { this.setState({ maintenanceCost: e.target.value }) }}
                                                        type={InputType.Number}
                                                        value={maintenanceCost}
                                                        status={
                                                            isDetail
                                                                ? ComponentStatus.Disabled
                                                                : ComponentStatus.Default
                                                        }
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Person Responsible for Maintenance">
                                                    <Input
                                                        onChange={(e) => { this.setState({ personResponsible: e.target.value }) }}
                                                        value={personResponsible}
                                                        status={
                                                            isDetail
                                                                ? ComponentStatus.Disabled
                                                                : ComponentStatus.Default
                                                        }
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid.Column>
                                </Grid.Row>

                                <Form.Footer>
                                    <Button
                                        text="Cancel"
                                        icon={IconFont.Remove}
                                        onClick={this.closeOverlay}
                                        color={ComponentColor.Danger}
                                        status={
                                            isDetail
                                                ? ComponentStatus.Disabled
                                                : ComponentStatus.Default
                                        }
                                    />

                                    <Button
                                        text="Save"
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                        onClick={this.handleClickSave}
                                        status={
                                            isDetail
                                                ? ComponentStatus.Disabled
                                                : ComponentStatus.Default
                                        }
                                    />
                                </Form.Footer>
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        );
    }
}

export default AddUpdateMaintenanceOverlay;