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
    ComponentStatus,
} from '@influxdata/clockface'

interface Props {
    visibleMachineActionOverlay: boolean
    handleDismissMachineActionDetail: () => void
    selectedDetailRow: object
    currentIndex: number
    tableData: object[]
}

interface State {
    currentIndex: number
    jobName: string
    material: string
    startTime: string,
    endTime: string,
    jobDescription: string
    editRowId: string
}

class MachineActionDetailOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            currentIndex: 0,
            jobName: "",
            material: "",
            startTime: "",
            endTime: "",
            jobDescription: "",
            editRowId: "",
        };
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.selectedDetailRow !== this.props.selectedDetailRow) {
            this.handleChangeSelectedRow(this.props.selectedDetailRow, this.props.currentIndex);
        }
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    handleChangeSelectedRow = (selectedRow, index) => {
        this.setState({
            endTime: selectedRow.endTime,
            jobDescription: selectedRow.jobDescription,
            jobName: selectedRow.jobName,
            material: selectedRow.material,
            startTime: selectedRow.startTime,
            editRowId: selectedRow._id.$oid,
            currentIndex: index,
        });
    }

    handleChangePreviousNextRow = (newRow, currentIndex) => {
        this.setState({
            endTime: newRow.endTime,
            jobDescription: newRow.jobDescription,
            jobName: newRow.jobName,
            material: newRow.material,
            startTime: newRow.startTime,
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
        return (
            <>
                <Overlay visible={this.props.visibleMachineActionOverlay}>
                    <Overlay.Container maxWidth={800}>
                        <Overlay.Header
                            title={"Machine Action Detail"}
                            onDismiss={this.props.handleDismissMachineActionDetail}
                        />

                        <Overlay.Body>
                            <Form style={{ marginBottom: '20px' }}>
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
                                                        status={ComponentStatus.Disabled}
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
                                                    <Input
                                                        name="material"
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.material}
                                                        status={ComponentStatus.Disabled}
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
                                                        disabled
                                                        style={{ background: '#383846', color: '#868791' }}
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
                                                        disabled
                                                        style={{ background: '#383846', color: '#868791' }}
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

export default MachineActionDetailOverlay;