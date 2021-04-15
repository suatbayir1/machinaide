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
    Dropdown,
    InputType,
    ComponentStatus,
} from '@influxdata/clockface'

interface Props {
    visibleMaintenanceOverlay: boolean
    handleDismissMaintenanceDetail: () => void
    factoryID: string
    selectedDetailRow: object
    currentIndex: number
    tableData: object[]
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
    currentIndex: number
}

class MaintenanceDetailOverlay extends PureComponent<Props, State> {
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
            currentIndex: 0,
        };
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.selectedDetailRow !== this.props.selectedDetailRow) {
            this.handleChangeSelectedRow(this.props.selectedDetailRow, this.props.currentIndex);
        }
    }

    handleChangeSelectedRow = (selectedRow, index) => {
        this.setState({
            selectedPart: selectedRow.selectedPart,
            maintenanceTime: selectedRow.maintenanceTime,
            unoperationalDuration: selectedRow.unoperationalDuration,
            selectedFaultType: selectedRow.selectedFaultType,
            jobDescription: selectedRow.jobDescription,
            selectedMaintenanceType: selectedRow.selectedMaintenanceType,
            faultReason: selectedRow.faultReason,
            request: selectedRow.request,
            editRowId: selectedRow.editRowId,
            currentIndex: index,
        });
    }

    handleChangePreviousNextRow = (newRow, currentIndex) => {
        this.setState({
            selectedPart: { id: newRow.sid !== null ? newRow.sid : "", text: newRow.asset },
            maintenanceTime: newRow.date,
            unoperationalDuration: newRow.duration,
            selectedFaultType: newRow.faultType,
            jobDescription: newRow.jobDescription,
            selectedMaintenanceType: newRow.maintenanceType,
            faultReason: newRow.reason,
            request: newRow.request,
            editRowId: newRow._id.$oid,
            currentIndex: currentIndex,
        })
    }

    previousRecord = () => {
        if (this.state.currentIndex === 0) {
            return;
        }

        const newRow = this.props.tableData[this.state.currentIndex - 1];
        this.handleChangePreviousNextRow(newRow, this.state.currentIndex - 1);
    }

    nextRecord = () => {
        if (this.state.currentIndex === this.props.tableData.length - 1) {
            return;
        }

        const newRow = this.props.tableData[this.state.currentIndex + 1];
        this.handleChangePreviousNextRow(newRow, this.state.currentIndex + 1);
    }

    render() {
        const { visibleMaintenanceOverlay } = this.props;

        return (
            <>
                <Overlay visible={visibleMaintenanceOverlay}>
                    <Overlay.Container maxWidth={800}>
                        <Overlay.Header
                            title={"Maintenance Record Detail"}
                            onDismiss={this.props.handleDismissMaintenanceDetail}
                        />

                        <Overlay.Body>
                            <Form style={{ marginBottom: '20px' }}>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Asset">
                                                    <Dropdown
                                                        button={(active, onClick) => (
                                                            <Dropdown.Button
                                                                status={ComponentStatus.Disabled}
                                                                active={active}
                                                                onClick={onClick}
                                                                color={ComponentColor.Default}
                                                            >
                                                                {this.state.selectedPart['text']}
                                                            </Dropdown.Button>
                                                        )}
                                                        menu={onCollapse => (
                                                            <Dropdown.Menu onCollapse={onCollapse}>
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
                                                        disabled
                                                        style={{ background: '#383846', color: '#868791' }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Fault Type">
                                                    <SelectDropdown
                                                        buttonStatus={ComponentStatus.Disabled}
                                                        options={[]}
                                                        selectedOption={this.state.selectedFaultType}
                                                        onSelect={() => { }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Type">
                                                    <SelectDropdown
                                                        buttonStatus={ComponentStatus.Disabled}
                                                        options={[]}
                                                        selectedOption={this.state.selectedMaintenanceType}
                                                        onSelect={() => { }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Fault Reason">
                                                    <Input
                                                        name="faultReason"
                                                        value={this.state.faultReason}
                                                        status={ComponentStatus.Disabled}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Unoperational Duration">
                                                    <Input
                                                        name="unoperationalDuration"
                                                        type={InputType.Number}
                                                        value={this.state.unoperationalDuration}
                                                        status={ComponentStatus.Disabled}
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
                                                        status={ComponentStatus.Disabled}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Request">
                                                    <TextArea
                                                        rows={5}
                                                        value={this.state.request}
                                                        status={ComponentStatus.Disabled}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid.Column>
                                </Grid.Row>

                                <Button
                                    style={{ float: 'left', width: '100px' }}
                                    text="Previous"
                                    icon={IconFont.CaretLeft}
                                    onClick={this.previousRecord}
                                    color={ComponentColor.Danger}
                                    status={this.state.currentIndex === 0 ? ComponentStatus.Disabled : ComponentStatus.Default}
                                />

                                <Button
                                    style={{ float: 'right', width: '100px' }}
                                    text="Next"
                                    icon={IconFont.CaretRight}
                                    color={ComponentColor.Success}
                                    type={ButtonType.Submit}
                                    onClick={this.nextRecord}
                                    status={this.state.currentIndex === this.props.tableData.length - 1 ? ComponentStatus.Disabled : ComponentStatus.Default}
                                />
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        );
    }
}

export default MaintenanceDetailOverlay;