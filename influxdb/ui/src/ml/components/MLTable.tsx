import TableRow from "./MLTableRow"
import React, { PureComponent } from 'react'
import {Table, Panel, ComponentSize, BorderType} from "@influxdata/clockface"


function ModelTable({
    models,
    startModel,
    stopModel,
    // refreshTable,
}) {
    return (
        <Panel>
            <Panel.Header size={ComponentSize.ExtraSmall}>
                <p className="preview-data-margins">Models</p>
            </Panel.Header>
            <Panel.Body size={ComponentSize.ExtraSmall}>
            <Table
                borders={BorderType.Vertical}
                fontSize={ComponentSize.ExtraSmall}
                cellPadding={ComponentSize.ExtraSmall}
                >
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Machine/Component</Table.HeaderCell>
                        <Table.HeaderCell>Model Name</Table.HeaderCell>
                        <Table.HeaderCell>Task</Table.HeaderCell>
                        <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {models.map((model) => {
                        return(
                            <TableRow
                                key={model.modelID}
                                hardware={model.hardware}
                                modelName={model.modelName}
                                algorithm={model.algorithm}
                                model_id={model.modelID}
                                status={model.status}
                                startModel={startModel}
                                stopModel={stopModel}
                            />
                        )
                    })}
                    
                </Table.Body>
            </Table>
            </Panel.Body>
        </Panel>
    )
    // }
}

export default ModelTable