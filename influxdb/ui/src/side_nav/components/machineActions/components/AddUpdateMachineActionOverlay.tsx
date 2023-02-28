// Libraries
import { RouteComponentProps } from 'react-router-dom'
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import AddMaterialOverlay from 'src/side_nav/components/machineActions/components/AddMaterialOverlay';
import {
    Form, Input, Button, ButtonType, ComponentColor, Overlay, IconFont,
    Grid, Columns, TextArea, Dropdown, DapperScrollbars,
} from '@influxdata/clockface'

// Services
import FactoryService from 'src/shared/services/FactoryService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    pleaseFillInTheFormCompletely,
    machineActionUpdatedSuccessfully,
    machineActionAddedSuccessfully,
} from 'src/shared/copy/notifications'

interface OwnProps {
    visibleAddUpdateMachineAction: boolean
    handleDismissAddUpdateMachineAction: () => void
    getAllMachineActions: () => void
    isEdit: boolean
    updateData: object
    machineID: string
    getMaterials: () => void
    materials: object[]
    visibleAddMaterial: boolean
    handleDismissAddMaterial: () => void
    handleOpenAddMaterial: () => void
    materialEditMode: boolean
    materialUpdateData: object
}

interface State {
    jobName: string
    material: object
    startTime: string,
    endTime: string,
    jobDescription: string
    editRowId: string
    formOpen: boolean
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class AddUpdateMachineActionOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            jobName: "",
            material: {},
            startTime: "",
            endTime: "",
            jobDescription: "",
            editRowId: "",
            formOpen: false,
        };
    }

    async componentDidUpdate() {
        if (this.props.isEdit && !this.state.formOpen) {
            this.handleChangeEditRowData(this.props.updateData);
            this.setState({ formOpen: true });
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
            material: {},
            startTime: "",
            endTime: "",
            jobDescription: "",
            formOpen: false,
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
        if (this.state.jobName === "" || Object.keys(this.state.material).length === 0 || this.state.startTime === "") {
            this.props.notify(pleaseFillInTheFormCompletely("Job Name, Material and Start Time cannot be empty."));
            return;
        }

        let material = { ...this.state.material };
        delete material["_id"];

        const payload = {
            "jobName": this.state.jobName,
            "material": material,
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
            this.props.notify(machineActionUpdatedSuccessfully());
        }

        this.props.getAllMachineActions();
        this.props.handleDismissAddUpdateMachineAction();
        this.clearForm();
    }

    addMachineAction = async (payload) => {
        const result = await FactoryService.addMachineAction(payload);

        if (result.data.summary.code === 200) {
            await this.props.notify(machineActionAddedSuccessfully());
            await this.props.getAllMachineActions();
            await this.props.handleDismissAddUpdateMachineAction();
            await this.clearForm();
        }
    }

    handleSelectMaterial = (material) => {
        switch (material) {
            case "other":
                this.props.handleOpenAddMaterial();
                break;
            default:
                this.setState({ material })
                break;
        }
    }

    closeOverlay = () => {
        this.props.handleDismissAddUpdateMachineAction();
        this.clearForm();
    }

    render() {
        const { material } = this.state;
        const { materials } = this.props;

        return (
            <>
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
                                            <Grid.Column
                                                widthXS={Columns.Twelve}
                                                widthSM={Columns.Six}
                                                widthMD={Columns.Six}
                                                widthLG={Columns.Six}
                                            >
                                                <Form.Element label="Job Name">
                                                    <Input
                                                        name="jobName"
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.jobName}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column
                                                widthXS={Columns.Twelve}
                                                widthSM={Columns.Six}
                                                widthMD={Columns.Six}
                                                widthLG={Columns.Six}
                                            >
                                                <Form.Element label="Material">
                                                    <Dropdown
                                                        button={(active, onClick) => (
                                                            <Dropdown.Button
                                                                active={active}
                                                                onClick={onClick}
                                                                color={ComponentColor.Default}
                                                            >
                                                                {material["materialName"] !== undefined ? material["materialName"] : 'Select Material'}
                                                            </Dropdown.Button>
                                                        )}
                                                        menu={onCollapse => (
                                                            <DapperScrollbars
                                                                autoHide={false}
                                                                autoSizeHeight={true}
                                                                style={{ maxHeight: '150px' }}
                                                                className="data-loading--scroll-content"
                                                            >
                                                                <Dropdown.Menu onCollapse={onCollapse}>
                                                                    {
                                                                        materials.map((item, index) => {
                                                                            return (
                                                                                <Dropdown.Item
                                                                                    id={item["id"]}
                                                                                    key={index}
                                                                                    value={item}
                                                                                    onClick={this.handleSelectMaterial}
                                                                                >
                                                                                    {item["materialName"]}
                                                                                </Dropdown.Item>
                                                                            )
                                                                        })
                                                                    }
                                                                    <Dropdown.Item
                                                                        id={"other"}
                                                                        key={"other"}
                                                                        value={"other"}
                                                                        onClick={this.handleSelectMaterial}
                                                                    >
                                                                        {"Other"}
                                                                    </Dropdown.Item>
                                                                </Dropdown.Menu>
                                                            </DapperScrollbars>
                                                        )}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column
                                                widthXS={Columns.Twelve}
                                                widthSM={Columns.Six}
                                                widthMD={Columns.Six}
                                                widthLG={Columns.Six}
                                            >
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

                                            <Grid.Column
                                                widthXS={Columns.Twelve}
                                                widthSM={Columns.Six}
                                                widthMD={Columns.Six}
                                                widthLG={Columns.Six}
                                            >
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

                <AddMaterialOverlay
                    visibleAddMaterial={this.props.visibleAddMaterial}
                    handleDismissAddMaterial={this.props.handleDismissAddMaterial}
                    getMaterials={this.props.getMaterials}
                    materialEditMode={this.props.materialEditMode}
                    materialUpdateData={this.props.materialUpdateData}
                />
            </>
        );
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(AddUpdateMachineActionOverlay);