// Libraries
import { Link } from 'react-router-dom'
import React, { PureComponent } from 'react'

// Helpers
import { useInterval } from "./useInterval"
import * as api from "./index"

// Components
import {
    TechnoSpinner, Icon, IconFont,
    Table,
    Button,
    ComponentColor,
    ComponentStatus,
    ButtonType
} from "@influxdata/clockface"
import IconButton from '@material-ui/core/IconButton';
import DashboardIcon from '@material-ui/icons/Dashboard';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import Report from '@material-ui/icons/Report';


function TableRow({
    hardware,
    modelName,
    algorithm,
    status,
    sessionID,
    model_id,
    startModel,
    stopModel,
    task,
    orgID,
    // refreshRow
}) {
    if (status !== "train") {
        useInterval(() => { console.log("test") }, null)
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
        return (
            <Table.Row>
                <Table.Cell>{hardware}</Table.Cell>
                <Table.Cell>{modelName}</Table.Cell>
                <Table.Cell>{algorithm}</Table.Cell>
                <Table.Cell>
                    {task === "anomaly" ? (
                        <Link to={`/orgs/${orgID}/automl/anomaly/${sessionID}`}>
                            <Icon glyph={IconFont.Search} />
                        </Link>
                    ) : (
                        <Link to={`/orgs/${orgID}/automl/${modelName}/duration`}>
                            <Icon style={{ fontSize: '14px' }} glyph={IconFont.Search} />
                        </Link>
                    )}
                </Table.Cell>
                <Table.Cell>
                    <IconButton
                        aria-label="delete"
                        style={{ color: '#22ADF6', paddingTop: '0px', paddingBottom: '0px' }}
                        onClick={() => { console.log("start model") }}
                    >
                        <PlayArrowIcon />
                    </IconButton>

                    <IconButton
                        aria-label="delete"
                        style={{ color: '#ff0000', paddingTop: '0px', paddingBottom: '0px' }}
                        onClick={() => { console.log("stop model") }}
                    >
                        <Report />
                    </IconButton>

                    {/* <Button
                        status={startStatus}
                        color={ComponentColor.Primary}
                        text="Start"
                        type={ButtonType.Button}
                        onClick={startModel} />
                    <Button
                        style={{ marginLeft: 10 }}
                        status={stopStatus}
                        color={ComponentColor.Danger}
                        text="Stop"
                        type={ButtonType.Button}
                        onClick={stopModel} /> */}


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

        return (
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