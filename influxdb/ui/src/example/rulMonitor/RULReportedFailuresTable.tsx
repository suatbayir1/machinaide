import React, { PureComponent } from 'react'
import { Panel, ComponentSize, BorderType, Table, DapperScrollbars, Label, InfluxColors, Appearance,
    ButtonType, Button, ComponentColor, IconFont, Overlay, Grid, Columns, ConfirmationButton} from '@influxdata/clockface'
import uuid from 'uuid'
import {
    TimeRange,
} from 'src/types'

interface Props {
    timeRange: TimeRange
    failures: object[]
    changeFailures: (failures: any[]) => void
}

interface State {
    failure: object
    failures: object[]
    addFailureOverlay: boolean
    failureDate: string
}

class RULReportedFailuresTable extends PureComponent<Props, State>{
    state = {
        failure: null,
        failures: this.props.failures,
        addFailureOverlay: false,
        failureDate: ""
    }

    deleteFailure = (failure) => {
        let fails = this.state.failures
        fails = fails.filter(x=>x.date != failure.date)
        this.setState({failures: fails}, ()=>{this.props.changeFailures(fails)})
    }

    addFailure = (failure) => {
        this.setState({failures: [...this.state.failures, failure], failureDate: ""}, ()=>{this.props.changeFailures(this.state.failures)})
    }

    public render(){
        return(
            <Panel>
                <Panel.Header size={ComponentSize.Medium}>
                    <h5 className="preview-data-margins">Missed Failures</h5>
                    <Button
                        text="Add Failure Record"
                        onClick={()=>this.setState({addFailureOverlay: !this.state.addFailureOverlay})}
                        type={ButtonType.Button}
                        size={ComponentSize.ExtraSmall}
                        icon={IconFont.Plus}
                        color={ComponentColor.Secondary}
                    />
                </Panel.Header>
                <Panel.Body size={ComponentSize.Small}>
                    <Overlay visible={this.state.addFailureOverlay}>
                        <Overlay.Container maxWidth={600}>
                            <Overlay.Header
                                title="Add Failure Record"
                                onDismiss={()=>this.setState({addFailureOverlay: !this.state.addFailureOverlay})}
                            />
                            <Overlay.Body>
                                <Grid>
                                    <Grid.Row style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }}>
                                        <Grid.Column widthXS={Columns.Twelve} style={{ margin: "7px" }}>
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"Failure Date"}
                                                description={""}
                                                color={InfluxColors.Castle}
                                                id={"icon-label"} 
                                            />                                            
                                            <input
                                                type='datetime-local'
                                                value={this.state.failureDate}
                                                onChange={(e) => { this.setState({failureDate: e.target.value})}}
                                                style={{ background: '#383846', color: '#ffffff' }}
                                            /> 
                                            <Button
                                                text=""
                                                onClick={()=>this.addFailure({date: this.state.failureDate})}
                                                type={ButtonType.Button}
                                                size={ComponentSize.ExtraSmall}
                                                icon={IconFont.Plus}
                                                color={ComponentColor.Secondary}
                                            />
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>
                            </Overlay.Body>
                        </Overlay.Container>
                    </Overlay>
                    <Table
                        borders={BorderType.Vertical}
                        fontSize={ComponentSize.ExtraSmall}
                        cellPadding={ComponentSize.ExtraSmall}
                    >
                        <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell style={{width: "150px"}}>Failure Date</Table.HeaderCell>
                            <Table.HeaderCell style={{width: "50px"}}></Table.HeaderCell>
                        </Table.Row>
                        </Table.Header>                    
                    </Table>
                    <DapperScrollbars
                        autoHide={false}
                        autoSizeHeight={true} style={{ maxHeight: '250px' }}
                        className="data-loading--scroll-content"
                    >
                        <Table
                            borders={BorderType.Vertical}
                            fontSize={ComponentSize.ExtraSmall}
                            cellPadding={ComponentSize.ExtraSmall}
                        >                            
                            <Table.Body>                                
                                {this.props.failures.map((failure) => (
                                    <Table.Row key={uuid.v4()}>
                                        <Table.Cell style={{width: "150px"}}>{new Date(failure["date"]).toLocaleString()}</Table.Cell> 
                                        <Table.Cell style={{width: "50px"}}>
                                            <ConfirmationButton
                                                onConfirm={()=>this.deleteFailure(failure)}
                                                returnValue={"return value"}
                                                text=""
                                                icon={IconFont.Trash}
                                                popoverColor={ComponentColor.Danger}
                                                popoverAppearance={Appearance.Outline}
                                                color={ComponentColor.Danger}
                                                confirmationLabel=""
                                                confirmationButtonColor={ComponentColor.Danger}
                                                confirmationButtonText="Click to delete failure"
                                                size={ComponentSize.ExtraSmall}
                                            />
                                        </Table.Cell> 
                                    </Table.Row>
                                ))}                                
                            </Table.Body>                            
                        </Table>
                    </DapperScrollbars>
                </Panel.Body>
            </Panel>
        )
    }
}

export default RULReportedFailuresTable