// Libraries
import React, { PureComponent } from 'react'

// Components
import {
    Form, Input, Button, ButtonType, ComponentColor, Overlay, IconFont, Grid, Columns,
    SelectDropdown, TextArea, ComponentSize, Gradients, Dropdown, InputType, Notification, ComponentStatus,
} from '@influxdata/clockface'

// Services
import FailureService from 'src/shared/services/FailureService'
import DTService from 'src/shared/services/DTService';


interface Props {
    visibleAddUpdateFailure: boolean
    handleDismissAddUpdateFailure: () => void
    getAllFailures: () => void
    isEdit: boolean
    factoryID: string
    updateData: object
    addBySelectedPart: boolean
    propsPart: object
    isDetail: boolean
}

interface State {
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
            dialogBox: false,
            overlay: false,
            allParts: [],
            selectedPart: {},
            selectedSeverity: "acceptable",
            costToFix: 0,
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
            this.handleChangeEditRowData(this.props.updateData);
        }

        if (this.props.addBySelectedPart && prevProps.propsPart !== this.props.propsPart) {
            this.setState({
                selectedPart: this.state.allParts.find(p => p["id"] === this.props.propsPart["name"])
            })
        }
    }

    clearForm = () => {
        this.setState({
            selectedPart: {},
            selectedSeverity: "acceptable",
            costToFix: 0,
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

        let startTimeDate = this.state.startTime.length ? new Date(this.state.startTime) : null
        let startTimeUtcString = startTimeDate ? startTimeDate.toISOString() : ""

        let endTimeDate = this.state.endTime.length ? new Date(this.state.endTime) : null
        let endTimeUtcString = endTimeDate ? endTimeDate.toISOString() : ""

        const payload = {
            "sourceName": this.state.selectedPart["text"],
            "sid": this.state.selectedPart["id"],
            "severity": this.state.selectedSeverity,
            "factoryID": this.props.factoryID,
            "cost": this.state.costToFix,
            "description": this.state.description,
            "startTime": startTimeUtcString,
            "endTime": endTimeUtcString,
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
        this.closeOverlay();
    }

    addFailure = async (payload) => {
        const result = await FailureService.addFailure(payload);
        if (result.data.message["text"] === "added_failure") {
            this.setState({
                notificationVisible: true,
                notificationType: "success",
                notificationMessage: "Fault record created successfully",
                costToFix: 0,
                description: "",
                endTime: "",
                startTime: "",
                selectedSeverity: "acceptable",
                selectedPart: {},
            })
            this.props.getAllFailures();
            this.closeOverlay();
            return;
        }
    }

    closeOverlay = () => {
        this.props.handleDismissAddUpdateFailure();
        this.clearForm();
    }

    getTimeInputFormat = (date) => {
        if (new Date(date)) {
            let dateForm = new Date(date).toLocaleString()
            let parts = dateForm.split(" ")
            let firstPart = parts[0].split(".").reverse().join("-")
            let secondPart = parts[1]
            return `${firstPart}T${secondPart}`
        }
        return ""
    }

    render() {
        const { visibleAddUpdateFailure, addBySelectedPart, isEdit, isDetail } = this.props;

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
                            title={
                                isDetail ? "Detail Failure Record" : (
                                    isEdit ? "Update Failure Record" : "Add Failure Record"
                                )
                            }
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
                                                <Form.Element label="Machine/Component/Sensor Name">
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

                                            <Grid.Column
                                                widthXS={Columns.Six}
                                                widthSM={Columns.Three}
                                                widthMD={Columns.Three}
                                                widthLG={Columns.Three}
                                            >
                                                <Form.Element label="Severity">
                                                    <SelectDropdown
                                                        options={["acceptable", "major", "critical"]}
                                                        selectedOption={this.state.selectedSeverity}
                                                        onSelect={(e) => this.setState({ selectedSeverity: e })}
                                                        buttonStatus={
                                                            isDetail
                                                                ? ComponentStatus.Disabled
                                                                : ComponentStatus.Default
                                                        }
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column
                                                widthXS={Columns.Six}
                                                widthSM={Columns.Three}
                                                widthMD={Columns.Three}
                                                widthLG={Columns.Three}
                                            >
                                                <Form.Element label="Cost to fix">
                                                    <Input
                                                        name="costToFix"
                                                        placeholder="Cost"
                                                        type={InputType.Number}
                                                        value={this.state.costToFix}
                                                        onChange={(e) => this.setState({ costToFix: Number(e.target.value) })}
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
                                                        value={this.getTimeInputFormat(this.state.startTime)}
                                                        onChange={this.handleChangeFailureTime}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                        disabled={
                                                            isDetail
                                                                ? true
                                                                : false
                                                        }
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
                                                        value={this.getTimeInputFormat(this.state.endTime)}
                                                        onChange={this.handleChangeFailureTime}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                        disabled={
                                                            isDetail
                                                                ? true
                                                                : false
                                                        }
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

export default AddUpdateFailureOverlay;