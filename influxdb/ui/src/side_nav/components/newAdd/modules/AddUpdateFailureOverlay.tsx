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
import FailureService from 'src/shared/services/FailureService'
import DTService from 'src/shared/services/DTService';


interface Props {
    visibleAddUpdateFailure: boolean
    handleDismissAddUpdateFailure: () => void
    getAllFailures: () => void
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
    startTime: string,
    endTime: string,
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    editRowId: string
}

class AddUpdateFailureOverlay extends PureComponent<Props, State> {
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
            startTime: "",
            endTime: "",
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            editRowId: "",
        };
    }

    async componentDidMount(): Promise<void> {
        await this.getCombinationAllHierarchy();
    }

    async componentDidUpdate(prevProps) {
        if (this.props.isEdit && prevProps.updateData !== this.props.updateData) {
            console.log("work");
            this.handleChangeEditRowData(this.props.updateData);
        }
    }

    clearForm = () => {
        this.setState({
            selectedPart: {},
            selectedSeverity: "minor",
            costToFix: null,
            description: "",
            startTime: "",
            endTime: "",
            editRowId: "",
        });
    }

    handleChangeEditRowData = (editRow) => {
        this.setState({
            costToFix: editRow.costToFix,
            description: editRow.description,
            editRowId: editRow.editRowId,
            endTime: editRow.endTime,
            selectedPart: editRow.selectedPart,
            selectedSeverity: editRow.selectedSeverity,
            startTime: editRow.startTime
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

    handleChangeFailureTime = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    handleClickSave = async () => {
        if (this.state.selectedPart["text"] === "" || this.state.startTime === "") {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: "Machine/Component/Sensor Name and Start Time cannot be empty",
            })
            return;
        }

        const payload = {
            "sourceName": this.state.selectedPart["text"],
            "sid": this.state.selectedPart["id"],
            "severity": this.state.selectedSeverity,
            "factoryID": this.props.factoryID,
            "cost": this.state.costToFix,
            "description": this.state.description,
            "startTime": this.state.startTime,
            "endTime": this.state.endTime,
        }

        if (this.props.isEdit) {
            this.updateFailure(payload);
        } else {
            this.addFailure(payload);
        }
    }

    updateFailure = async (payload) => {
        payload["recordId"] = this.state.editRowId;
        const result = await FailureService.updateFailure(payload);

        if (result.data.message.text === "updated_failure") {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: "Fault record updated successfully",
            });
        }

        this.props.getAllFailures();
        this.props.handleDismissAddUpdateFailure();
        this.clearForm();
    }

    addFailure = async (payload) => {
        const result = await FailureService.addFailure(payload);
        if (result.data.message["text"] === "added_failure") {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: "Fault record created successfully",
                costToFix: null,
                description: "",
                endTime: "",
                startTime: "",
                selectedSeverity: "minor",
                selectedPart: {},
                formMode: false,
            })
            this.props.getAllFailures();
            this.props.handleDismissAddUpdateFailure();
            this.clearForm();
            return;
        }
    }

    closeOverlay = () => {
        this.props.handleDismissAddUpdateFailure();
        this.clearForm();
    }

    render() {
        const { visibleAddUpdateFailure, handleDismissAddUpdateFailure } = this.props;

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

                <Overlay visible={visibleAddUpdateFailure}>
                    <Overlay.Container maxWidth={800}>
                        <Overlay.Header
                            title={this.props.isEdit ? "Update Failure Record" : "Add Failure Record"}
                            onDismiss={this.closeOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Machine/Component/Sensor Name">
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

                                            <Grid.Column widthXS={Columns.Three}>
                                                <Form.Element label="Severity">
                                                    <SelectDropdown
                                                        options={["minor", "major", "severe"]}
                                                        selectedOption={this.state.selectedSeverity}
                                                        onSelect={(e) => this.setState({ selectedSeverity: e })}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Three}>
                                                <Form.Element label="Cost to fix">
                                                    <Input
                                                        name="costToFix"
                                                        placeholder="Cost"
                                                        type={InputType.Number}
                                                        value={this.state.costToFix}
                                                        onChange={(e) => this.setState({ costToFix: e.target.value })}
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
                                                        onChange={this.handleChangeFailureTime}
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
                                                        onChange={this.handleChangeFailureTime}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Twelve}>
                                                <Form.Element label="Description">
                                                    <TextArea
                                                        placeholder="Description.."
                                                        rows={5}
                                                        value={this.state.description}
                                                        onChange={(e) => this.setState({ description: e.target.value })}
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

export default AddUpdateFailureOverlay;