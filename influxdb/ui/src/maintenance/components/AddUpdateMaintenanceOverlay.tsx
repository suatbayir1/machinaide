import React, { PureComponent } from 'react'
import {
    Form,
    Input,
    Button,
    ButtonType,
    ComponentColor,
    Overlay,
    IconFont,
    Grid,
    Columns,
    SelectDropdown,
    TextArea,
    ComponentSize,
    Gradients,
    Dropdown,
    InputType,
    Notification,
} from '@influxdata/clockface'
import DTService from 'src/shared/services/DTService';
import MaintenanceService from 'src/maintenance/services/MaintenanceService';


interface Props {
    visibleAddUpdateMaintenance: boolean
    handleDismissAddUpdateMaintenance: () => void
    getAllMaintenance: () => void
    isEdit: boolean
    factoryID: string
    updateData: object
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
        };
    }

    async componentDidMount(): Promise<void> {
        await this.getCombinationAllHierarchy();
    }

    async componentDidUpdate(prevProps) {
        if (this.props.isEdit && prevProps.updateData !== this.props.updateData) {
            this.handleChangeEditRowData(this.props.updateData);
        }
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    clearForm = () => {
        this.setState({
            selectedPart: {},
            maintenanceTime: "",
            selectedFaultType: "",
            selectedMaintenanceType: "",
            faultReason: "",
            unoperationalDuration: 0,
            jobDescription: "",
            request: "",
            editRowId: "",
        });
    }

    handleChangeEditRowData = (editRow) => {
        console.log("editRow", editRow);

        this.setState({
            selectedPart: editRow.selectedPart,
            maintenanceTime: editRow.maintenanceTime,
            unoperationalDuration: editRow.unoperationalDuration,
            selectedFaultType: editRow.selectedFaultType,
            jobDescription: editRow.jobDescription,
            selectedMaintenanceType: editRow.selectedMaintenanceType,
            faultReason: editRow.faultReason,
            request: editRow.request,
            editRowId: editRow.editRowId
        });
    }

    getCombinationAllHierarchy = async () => {
        const allDT = await DTService.getAllDT();

        allDT.forEach(factory => {
            if (factory["id"] === this.props.factoryID) {
                const machines = factory["machines"];
                const parts = [];

                machines.map(machine => {
                    parts.push({ id: machine["@id"], text: machine["name"] });
                    let components = machine["contents"];
                    components.map(component => {
                        parts.push({ id: component["@id"], text: `${machine["name"]}.${component["name"]}` });
                        let sensors = component["sensors"];
                        sensors.map(sensor => {
                            parts.push({ id: sensor["@id"], text: `${machine["name"]}.${component["name"]}.${sensor["name"]}` });
                        })
                    })
                })

                this.setState({ allParts: parts });
            }
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
        if (this.state.selectedPart["text"] === ""
            || this.state.maintenanceTime === ""
            || this.state.selectedMaintenanceType === ""
            || this.state.selectedFaultType === ""
        ) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: "Please fill in the form completely",
            })
            return;
        }

        const payload = {
            "asset": this.state.selectedPart["text"],
            "sid": this.state.selectedPart["id"],
            "date": this.state.maintenanceTime,
            "duration": this.state.unoperationalDuration,
            "factoryID": this.props.factoryID,
            "faultType": this.state.selectedFaultType,
            "jobDescription": this.state.jobDescription,
            "maintenanceType": this.state.selectedMaintenanceType,
            "reason": this.state.faultReason,
            "request": this.state.request
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
                selectedPart: {},
                maintenanceTime: "",
                selectedFaultType: "",
                selectedMaintenanceType: "",
                faultReason: "",
                unoperationalDuration: 0,
                jobDescription: "",
                request: "",
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
        const { visibleAddUpdateMaintenance } = this.props;

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
                            title={this.props.isEdit ? "Update Maintenance Record" : "Add Maintenance Record"}
                            onDismiss={this.closeOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Asset">
                                                    <Dropdown
                                                        button={(active, onClick) => (
                                                            <Dropdown.Button
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

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Date">
                                                    <input
                                                        name='maintenanceTime'
                                                        type='datetime-local'
                                                        value={this.state.maintenanceTime}
                                                        onChange={this.handleChangeMaintenanceTime}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Fault Type">
                                                    <SelectDropdown
                                                        options={["Fault 1", "Fault 2", "Fault 3"]}
                                                        selectedOption={this.state.selectedFaultType}
                                                        onSelect={(e) => this.setState({ selectedFaultType: e })}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Type">
                                                    <SelectDropdown
                                                        options={["Maintenance 1", "Maintenance 2", "Maintenance 3"]}
                                                        selectedOption={this.state.selectedMaintenanceType}
                                                        onSelect={(e) => this.setState({ selectedMaintenanceType: e })}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Fault Reason">
                                                    <Input
                                                        name="faultReason"
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.faultReason}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Unoperational Duration">
                                                    <Input
                                                        name="unoperationalDuration"
                                                        onChange={this.handleChangeInput}
                                                        type={InputType.Number}
                                                        value={this.state.unoperationalDuration}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>


                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Job Description">
                                                    <TextArea
                                                        rows={5}
                                                        value={this.state.jobDescription}
                                                        onChange={(e) => this.setState({ jobDescription: e.target.value })}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Request">
                                                    <TextArea
                                                        rows={5}
                                                        value={this.state.request}
                                                        onChange={(e) => this.setState({ request: e.target.value })}
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
                                    />

                                    <Button
                                        text="Save"
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                        onClick={this.handleClickSave}
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