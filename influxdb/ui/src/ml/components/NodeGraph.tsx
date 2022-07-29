import React from 'react'
import ReactFlow from 'react-flow-renderer'

// Components
import {
    Panel
} from '@influxdata/clockface'

interface Props{
    elements: any[]
}

class NodeGraph extends React.Component<Props> {
    render() {
        return (
            <Panel style={{ height: 550, color: "black" }}>
                <ReactFlow elements={this.props.elements} />
            </Panel>
        )
    }
}

export default NodeGraph