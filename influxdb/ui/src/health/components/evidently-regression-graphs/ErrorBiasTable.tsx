import React, {PureComponent} from 'react'
import {
    DapperScrollbars, Table, BorderType, ComponentSize
} from '@influxdata/clockface'

import uuid from 'uuid'

interface Props {
    report: object
}

class ErrorBiasTable extends PureComponent<Props>{
    state = {
        features: []
    }

    createFeatures = () => {
        let report = this.props.report
        if(report){
            let features = []
            let featuresObj = report["regression_performance"]["data"]["metrics"]["error_bias"]
            for(let key of Object.keys(featuresObj)){
                let oneFeature = featuresObj[key]
                oneFeature["feature_name"] = key
                features.push(oneFeature)
            }
            this.setState({features: features})
        }
    }

    componentDidMount(){
        this.createFeatures()
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any): void {
        if(!prevProps.report && this.props.report){
            this.createFeatures()
        }
    }

    render(){
        return(
            <>
                <DapperScrollbars
                    autoHide={false}
                    autoSizeHeight={true}
                    style={{ maxHeight: '250px' }}
                    className="data-loading--scroll-content"
                >
                    <Table
                        borders={BorderType.Vertical}
                        fontSize={ComponentSize.ExtraSmall}
                        cellPadding={ComponentSize.ExtraSmall}
                    >
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell style={{width: "250px"}}>Feature</Table.HeaderCell>
                                <Table.HeaderCell style={{width: "70px"}}>Type</Table.HeaderCell>
                                <Table.HeaderCell style={{width: "100px"}}>Majority</Table.HeaderCell>
                                <Table.HeaderCell style={{width: "130px"}}>Underestimation</Table.HeaderCell>
                                <Table.HeaderCell style={{width: "120px"}}>Overestimation</Table.HeaderCell>
                                <Table.HeaderCell style={{width: "100px"}}>Range(%)</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        {this.state.features.map(feature => {
                            return(
                                <Table.Row key={uuid.v4()}>
                                    <Table.Cell style={{width: "250px"}}>{feature["feature_name"] ? feature["feature_name"] : "-"}</Table.Cell>
                                    <Table.Cell style={{width: "70px"}}>{feature["feature_type"] ? feature["feature_type"] : "-"}</Table.Cell>
                                    <Table.Cell style={{width: "100px"}}>{feature["ref_majority"] ? feature["ref_majority"].toFixed(2) : "-"}</Table.Cell>
                                    <Table.Cell style={{width: "130px"}}>{feature["ref_under"] ? feature["ref_under"].toFixed(2) : "-"}</Table.Cell>
                                    <Table.Cell style={{width: "120px"}}>{feature["ref_over"] ? feature["ref_over"].toFixed(2) : "-"}</Table.Cell>
                                    <Table.Cell style={{width: "100px"}}>{feature["ref_range"] ? feature["ref_range"].toFixed(2) : "-"}</Table.Cell>
                                </Table.Row>
                            )
                        })}
                    </Table>
                </DapperScrollbars>
            </>
        )
    }
}

export default ErrorBiasTable

