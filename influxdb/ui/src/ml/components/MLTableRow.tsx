import { useInterval } from "./useInterval"
import * as api from "./index"
import {
    TechnoSpinner,
    Table,
    Button,
    ComponentColor,
    ComponentStatus,
    ButtonType
} from "@influxdata/clockface"
import React, { PureComponent } from 'react'


function TableRow({
    hardware,
    modelName,
    algorithm,
    status,
    model_id,
    startModel,
    stopModel,
    // refreshRow
}) {
    if (status !== "train") {
        useInterval(() => {}, null)
        // if (status === "idle") {
        //     startModel({target:{name:model_id}})
        // }
        let startStatus = ComponentStatus.Default
        let stopStatus = ComponentStatus.Disabled

        if (status === "running") {
            startStatus = ComponentStatus.Disabled
            stopStatus = ComponentStatus.Default
        } else {
            startStatus = ComponentStatus.Default
            stopStatus = ComponentStatus.Disabled
        }
        return(
            <Table.Row>
                <Table.Cell>{hardware}</Table.Cell>
                <Table.Cell>{modelName}</Table.Cell>
                <Table.Cell>{algorithm}</Table.Cell>
                {/* <Table.Cell></Table.Cell> */}
                {/* <td style={{width: 240}}>{this.state.precision}</td> */}
                {/* <td style={{width: 240}}>{this.state.recall}</td> */}
                {/* <div className = "col-xs-8" style={{marginTop: 10, marginBottom: 10}}> */}
                <Table.Cell>
                    <Button
                        status={startStatus}
                        color={ComponentColor.Primary}
                        text="Start"
                        type={ButtonType.Button}
                        onClick={startModel}/>
                    <Button
                        style={{marginLeft: 10}}
                        status={stopStatus}
                        color={ComponentColor.Danger}
                        text="Stop"
                        type={ButtonType.Button}
                        onClick={stopModel}/>
                    {/* <button disabled={status === "running"} name={model_id} className="btn btn-primary btn-sm" onClick={startModel}>Start</button>
                    <button disabled={status === "stopped" || status === "idle"} name={model_id} className="btn btn-danger btn-sm" onClick={stopModel}>Stop</button> */}
                </Table.Cell>
                {/* <Table.Cell>
                </Table.Cell> */}
                {/* </div> */}
            </Table.Row>
        )
    } else {
        // useInterval(async () => {
        //     let obj = await api.getBasicModels()
        //     refreshRow(obj)
        // }, 1000)

        return(
            <Table.Row>
                <Table.Cell>{hardware}</Table.Cell>
                <Table.Cell>{modelName}</Table.Cell>
                <Table.Cell>{algorithm}</Table.Cell>
                <Table.Cell> <TechnoSpinner style={{ width: "50px", height: "50px" }} /> </Table.Cell>
                {/* <div className = "col-xs-8" style={{marginTop: 10, marginBottom: 10}}>
                <td>
                    
                </td>
                </div> */}
            </Table.Row>
        )
    }
    
}

export default TableRow