import React, { PureComponent } from 'react'
import { Panel, ComponentSize, BorderType, Table, DapperScrollbars} from '@influxdata/clockface'
import uuid from 'uuid'
import {
    TimeRange,
} from 'src/types'

interface Props {
    timeRange: TimeRange
    metricNames: string[]
    modelMetrics: object[]
}

interface State {
    
}

class MetricsTable extends PureComponent<Props, State>{
    state = {

    }

    public render(){
        return(
            <Panel>
                <Panel.Header size={ComponentSize.Medium}>
                    <h5 className="preview-data-margins">Model Metrics</h5>
                </Panel.Header>
                <Panel.Body size={ComponentSize.Small}>
                    <Table
                        borders={BorderType.Vertical}
                        fontSize={ComponentSize.ExtraSmall}
                        cellPadding={ComponentSize.ExtraSmall}
                    >
                        <Table.Header>
                        <Table.Row>
                            {this.props.metricNames.map((metricName) => (
                                <Table.HeaderCell style={{width: "150px"}}>{metricTitles[metricName] ? metricTitles[metricName] : metricName}</Table.HeaderCell>
                            ))}
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
                                {this.props.modelMetrics.map((metric) => (
                                    <Table.Row key={uuid.v4()}>
                                        {this.props.metricNames.map((metricName)=> (
                                            <Table.Cell style={{width: "150px"}}>{metric[metricName]}</Table.Cell> 
                                        ))}
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

export default MetricsTable

const metricTitles = {
    anomalyCount: "Number of Anomalies Found",
    correctAnomalyCount: "Correctly Predicted Anomalies",
    incorrectAnomalyCount: "Incorrectly Predicted Anomalies",
    temporalDistance: "Temporal Distance",
    fprecision: "Forgiving Precision",
    frecall: "Forgiving Recall"
}