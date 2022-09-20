import React, { PureComponent } from 'react'
import { Panel, ComponentSize, BorderType, Table, DapperScrollbars,
    ButtonType, Button, ComponentColor, IconFont} from '@influxdata/clockface'
import uuid from 'uuid'
import RULFeedbackOverlay from './RULFeedbackOverlay'
import {
    TimeRange,
} from 'src/types'

interface Props {
    timeRange: TimeRange
    predictions: object[]
    setSelectedPoint: (point: object) => void
}

interface State {
    rulFeedbackOverlay: boolean
    prediction:  object
}

class RULFeedbackTable extends PureComponent<Props, State>{
    state = {
        rulFeedbackOverlay: false,
        prediction: null
    }

    closeFeedbackOverlay = () => {
        this.setState({rulFeedbackOverlay: !this.state.rulFeedbackOverlay})
    }

    public render(){
        return(
            <Panel>
                <Panel.Header size={ComponentSize.Medium}>
                    <h5 className="preview-data-margins">Model's Predictions</h5>
                </Panel.Header>
                <Panel.Body size={ComponentSize.Small}>
                    <RULFeedbackOverlay 
                        prediction={this.state.prediction} 
                        rulFeedbackOverlay={this.state.rulFeedbackOverlay}
                        closeFeedbackOverlay={this.closeFeedbackOverlay}
                    />
                    <Table
                        borders={BorderType.Vertical}
                        fontSize={ComponentSize.ExtraSmall}
                        cellPadding={ComponentSize.ExtraSmall}
                    >
                        <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell style={{width: "150px"}}>Log Date</Table.HeaderCell>
                            <Table.HeaderCell style={{width: "150px"}}>Prediction</Table.HeaderCell>
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
                                {this.props.predictions.map((prediction) => (
                                    <Table.Row key={uuid.v4()}>
                                        <Table.Cell style={{width: "150px"}}>
                                            {new Date(prediction["logDate"]).toLocaleString()}
                                        </Table.Cell> 
                                        <Table.Cell style={{width: "150px"}}>{prediction["result"]}</Table.Cell> 
                                        <Table.Cell style={{width: "50px"}}>
                                            <Button
                                                text=""
                                                onClick={()=>this.setState({prediction: prediction, rulFeedbackOverlay: true}, ()=>this.props.setSelectedPoint(prediction))}
                                                type={ButtonType.Button}
                                                size={ComponentSize.ExtraSmall}
                                                icon={IconFont.Eye}
                                                color={ComponentColor.Secondary}
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

export default RULFeedbackTable