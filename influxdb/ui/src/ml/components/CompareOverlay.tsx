import React, { PureComponent } from 'react'
import uuid from 'uuid'

// Components
import {
    Overlay, ComponentSize, DapperScrollbars, Table, BorderType,
} from '@influxdata/clockface'

import LineGraph from "src/ml/components/LineGraph";

interface Props {
    visible: boolean
    trials: any[]
    trialIntermediates: any[]
    onDismiss: () => void
    errorThrown: () => void
    experimentJob: string
}

interface State {
    graph_data: any[]
    dragClass: string
    errorPage: boolean
    errors: any[]
}

class CompareOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props)
        this.state = {
            dragClass: 'drag-none',
            errorPage: false,
            errors: [],
            graph_data: [],
        }
    }

    createData = () => {
        let trials = this.props.trials
        let trialInts = this.props.trialIntermediates
        let data = []
        console.log(trials)
        for (let t of trials) {
            for (let trial of trialInts) {
                if (t["trialID"] === trial["trialID"]) {
                    let serie = {}
                    serie["id"] = `Trial ${trial["trialNo"]}`

                    let points = []
                    for (let temp of trial["intermediates"]) {
                        console.log("-- ", temp)
                        let point = {}
                        let d = new Date(temp["timestamp"] * 1000)
                        let m = d.getUTCMonth() + 1
                        let dt = d.getUTCDate()
                        let ms = m > 9 ? `${m}` : `0${m}`
                        let dts = dt > 9 ? `${dt}` : `0${dt}`
                        let h = d.getUTCHours()
                        let min = d.getUTCMinutes()
                        let hs = h > 9 ? `${h}` : `0${h}`
                        let mins = min > 9 ? `${min}` : `0${min}`
                        let sec = d.getUTCSeconds()
                        let ss = sec > 9 ? `${sec}` : `0${sec}`
                        point["x"] = `${ms}-${dts} ${hs}:${mins}:${ss}`
                        if (this.props.experimentJob !== "pof") {
                            let acc = temp["logs"]["accuracy"] ? temp["logs"]["accuracy"] : temp["logs"]["acc"] ? temp["logs"]["acc"] : 0
                            point["y"] = -1 * acc.toFixed(3)
                        }
                        else if (this.props.experimentJob === "pof")
                            point["y"] = -1 * temp["logs"]["val_loss"].toFixed(3)
                        points.push(point)
                    }
                    serie["data"] = points
                    data.push(serie)
                }
            }
        }

        console.log("LINE GRAPH DATA: ", data)
        return data
    }

    render() {
        const { visible, onDismiss, trials } = this.props;

        return (
            <>
                <Overlay visible={visible}>
                    <Overlay.Container maxWidth={1250}>
                        <Overlay.Header
                            title={"Trial Comparison"}
                            onDismiss={onDismiss}
                        />

                        <Overlay.Body>
                            <div style={{ height: '475px', color: "black" }}>
                                <LineGraph data={this.createData()} style={{ marginBottom: '5px' }} experimentJob={this.props.experimentJob} />
                            </div>
                            <br />

                            <div id="summary" style={{ height: '100px' }}>
                                <DapperScrollbars
                                    autoHide={false}
                                    autoSizeHeight={true}
                                    style={{ maxHeight: '100px' }}
                                    className="data-loading--scroll-content"
                                >
                                    <Table
                                        borders={BorderType.Vertical}
                                        fontSize={ComponentSize.ExtraSmall}
                                        cellPadding={ComponentSize.ExtraSmall}
                                    >
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell style={{ width: "100px" }}>Trial No</Table.HeaderCell>
                                                <Table.HeaderCell style={{ width: "100px" }}>Batch Size</Table.HeaderCell>
                                                <Table.HeaderCell style={{ width: "100px" }}># Epoch</Table.HeaderCell>
                                                <Table.HeaderCell style={{ width: "100px" }}># Units1</Table.HeaderCell>
                                                {
                                                    this.props.experimentJob !== "pof" &&
                                                    <>
                                                        <Table.HeaderCell style={{ width: "100px" }}># Units2</Table.HeaderCell>
                                                        <Table.HeaderCell style={{ width: "100px" }}>Dropout</Table.HeaderCell>
                                                        <Table.HeaderCell style={{ width: "100px" }}>Accuracy</Table.HeaderCell>
                                                    </>
                                                }
                                                {
                                                    this.props.experimentJob === "pof" &&
                                                    <>
                                                        <Table.HeaderCell style={{ width: "100px" }}>Validation Loss</Table.HeaderCell>
                                                    </>
                                                }
                                                <Table.HeaderCell style={{ width: "100px" }}>Custom Metric</Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {
                                                trials.map(x => {
                                                    return (
                                                        <Table.Row key={uuid.v4()}>
                                                            <Table.Cell>{x["trialNo"]}</Table.Cell>
                                                            <Table.Cell>{x["hyperparameters"]["batch_size"]}</Table.Cell>
                                                            <Table.Cell>{x["hyperparameters"]["epochs"]}</Table.Cell>
                                                            <Table.Cell>{x["hyperparameters"]["units1"]}</Table.Cell>
                                                            {
                                                                this.props.experimentJob !== "pof" &&
                                                                <>
                                                                    <Table.Cell style={{ width: "100px" }}>{x["hyperparameters"]["units2"]}</Table.Cell>
                                                                    <Table.Cell style={{ width: "100px" }}>{x["hyperparameters"]["dropout"]}</Table.Cell>
                                                                    <Table.Cell style={{ width: "100px" }}>{x["accuracy"]}</Table.Cell>
                                                                </>
                                                            }
                                                            {
                                                                this.props.experimentJob === "pof" &&
                                                                <>
                                                                    <Table.Cell style={{ width: "100px" }}>{x["val_loss"]}</Table.Cell>
                                                                </>
                                                            }
                                                            <Table.Cell>{x["metric"]}</Table.Cell>
                                                        </Table.Row>
                                                    )
                                                })
                                            }
                                        </Table.Body>
                                    </Table>
                                </DapperScrollbars>
                            </div>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay >
            </>
        );
    }
}

export default CompareOverlay;
