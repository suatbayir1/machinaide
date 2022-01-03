import React from 'react'
import ReactFlow from 'react-flow-renderer'

// Components
import {
    Panel
} from '@influxdata/clockface'

class NodeGraph extends React.Component {
    render() {
        return (
            <Panel style={{ height: 550, color: "black" }}>
                <ReactFlow elements={this.props.elements} />
            </Panel>
        )
    }
}

export default NodeGraph