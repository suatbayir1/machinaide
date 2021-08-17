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


    maintenanceReason: string
    maintenanceRequest: string
    maintenanceInfo: string
    maintenanceDownTime: string
    maintenanceType: string
    maintenanceCost: string
    personResponsible: string
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

            maintenanceReason: "",
            maintenanceRequest: "",
            maintenanceInfo: "",
            maintenanceDownTime: "",
            maintenanceType: "",
            maintenanceCost: "",
            personResponsible: "",
        };
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.selectedDetailRow !== this.props.selectedDetailRow) {
            this.handleChangeSelectedRow(this.props.selectedDetailRow, this.props.currentIndex);
        }
    }

    handleChangeSelectedRow = (selectedRow, index) => {
        console.log(selectedRow);
        this.setState({
            selectedPart: selectedRow.selectedPart,
            maintenanceTime: selectedRow.maintenanceTime,
            maintenanceReason: selectedRow.maintenanceReason,
            maintenanceRequest: selectedRow.maintenanceRequest,
            maintenanceInfo: selectedRow.maintenanceInfo,
            maintenanceDownTime: selectedRow.maintenanceDownTime,
            maintenanceType: selectedRow.maintenanceType,
            maintenanceCost: selectedRow.maintenanceCost,
            personResponsible: selectedRow.personResponsible,
            editRowId: selectedRow.editRowId,
            currentIndex: index,
        });
    }

    handleChangePreviousNextRow = (newRow, currentIndex) => {
        console.log(newRow);
        this.setState({
            selectedPart: { id: newRow.sid !== null ? newRow.sid : "", text: newRow.asset },
            maintenanceTime: newRow.maintenanceTime,
            maintenanceReason: newRow.maintenanceReason,
            maintenanceRequest: newRow.maintenanceRequest,
            maintenanceInfo: newRow.maintenanceInfo,
            maintenanceDownTime: newRow.maintenanceDownTime,
            maintenanceType: newRow.maintenanceType,
            maintenanceCost: newRow.maintenanceCost,
            personResponsible: newRow.personResponsible,
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
        const { allParts, maintenanceReason, maintenanceRequest,
            maintenanceInfo, maintenanceDownTime, maintenanceType, maintenanceCost, personResponsible, } = this.state;

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

                                        <Grid.Row style={{ marginTop: '20px' }}>
                                            <Grid.Column widthXS={Columns.Twelve}>
                                                <Form.Element label="Asset" required={true}>
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
                                                                {
                                                                    allParts
                                                                }
                                                            </Dropdown.Menu>
                                                        )}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Date" required={true}>
                                                    <input
                                                        type='datetime-local'
                                                        value={this.state.maintenanceTime}
                                                        onChange={(e) => { this.setState({ maintenanceTime: e.target.value }) }}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                        disabled
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Reason">
                                                    <Input
                                                        onChange={(e) => { this.setState({ maintenanceReason: e.target.value }) }}
                                                        value={maintenanceReason}
                                                        status={ComponentStatus.Disabled}
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
                                                        status={ComponentStatus.Disabled}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Info">
                                                    <TextArea
                                                        rows={5}
                                                        value={maintenanceInfo}
                                                        onChange={(e) => this.setState({ maintenanceInfo: e.target.value })}
                                                        status={ComponentStatus.Disabled}
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
                                                        status={ComponentStatus.Disabled}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Maintenance Type">
                                                    <Input
                                                        onChange={(e) => { this.setState({ maintenanceType: e.target.value }) }}
                                                        value={maintenanceType}
                                                        status={ComponentStatus.Disabled}
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
                                                        status={ComponentStatus.Disabled}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Person Responsible for Maintenance">
                                                    <Input
                                                        onChange={(e) => { this.setState({ personResponsible: e.target.value }) }}
                                                        value={personResponsible}
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