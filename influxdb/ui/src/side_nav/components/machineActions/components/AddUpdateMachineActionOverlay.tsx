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
    TextArea,
    ComponentSize,
    Gradients,
    Notification,
} from '@influxdata/clockface'
import FactoryService from 'src/shared/services/FactoryService';

interface Props {
    visibleAddUpdateMachineAction: boolean
    handleDismissAddUpdateMachineAction: () => void
    getAllMachineActions: () => void
    isEdit: boolean
    updateData: object
    machineID: string
}

interface State {
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    jobName: string
    material: string
    startTime: string,
    endTime: string,
    jobDescription: string
    editRowId: string
}

class AddUpdateMachineActionOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            jobName: "",
            material: "",
            startTime: "",
            endTime: "",
            jobDescription: "",
            editRowId: "",
        };
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
            jobName: "",
            material: "",
            startTime: "",
            endTime: "",
            jobDescription: "",
        });
    }

    handleChangeEditRowData = (editRow) => {
        this.setState({
            jobName: editRow.jobName,
            material: editRow.material,
            startTime: editRow.startTime,
            endTime: editRow.endTime,
            jobDescription: editRow.jobDescription,
            editRowId: editRow._id.$oid
        });
    }

    handleClickSave = async () => {
        if (this.state.jobName === "" || this.state.material === "" || this.state.startTime === "") {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: "Please fill in the form completely",
            })
            return;
        }

        const payload = {
            "jobName": this.state.jobName,
            "material": this.state.material,
            "startTime": this.state.startTime,
            "endTime": this.state.endTime,
            "jobDescription": this.state.jobDescription,
            "machineID": this.props.machineID
        }

        if (this.props.isEdit) {
            this.updateMachineAction(payload);
        } else {
            this.addMachineAction(payload);
        }
    }

    updateMachineAction = async (payload) => {
        payload["recordId"] = this.state.editRowId;
        const result = await FactoryService.updateMachineAction(payload);

        if (result.data.summary.code === 200) {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: result.data.message.text,
            });
        }

        this.props.getAllMachineActions();
        this.props.handleDismissAddUpdateMachineAction();
        this.clearForm();
    }

    addMachineAction = async (payload) => {
        const result = await FactoryService.addMachineAction(payload);

        if (result.data.summary.code === 200) {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: result.data.message.text,
            })
            this.props.getAllMachineActions();
            this.props.handleDismissAddUpdateMachineAction();
            this.clearForm();
            return;
        }
    }

    closeOverlay = () => {
        this.props.handleDismissAddUpdateMachineAction();
        this.clearForm();
    }

    render() {
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

                <Overlay visible={this.props.visibleAddUpdateMachineAction}>
                    <Overlay.Container maxWidth={800}>
                        <Overlay.Header
                            title={this.props.isEdit ? "Update Machine Action" : "Add Machine Action"}
                            onDismiss={this.closeOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Job Name">
                                                    <Input
                                                        name="jobName"
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.jobName}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Material">
                                                    <Input
                                                        name="material"
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.material}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Start Time">
                                                    <input
                                                        name='startTime'
                                                        type='datetime-local'
                                                        value={this.state.startTime}
                                                        onChange={this.handleChangeInput}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="End Time">
                                                    <input
                                                        name='endTime'
                                                        type='datetime-local'
                                                        value={this.state.endTime}
                                                        onChange={this.handleChangeInput}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Twelve}>
                                                <Form.Element label="Job Description">
                                                    <TextArea
                                                        rows={5}
                                                        value={this.state.jobDescription}
                                                        onChange={(e) => this.setState({ jobDescription: e.target.value })}
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

export default AddUpdateMachineActionOverlay;