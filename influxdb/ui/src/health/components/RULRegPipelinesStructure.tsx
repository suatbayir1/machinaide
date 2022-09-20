import React from 'react'
import ReactTooltip from 'react-tooltip'
import NodeGraph from "src/ml/components/NodeGraph";

// Components
import {
    Panel, Grid, Columns, SelectDropdown
} from '@influxdata/clockface'

const structureTip = '<ul><li>Use scroll to zoom in/out</li><li>Click and hold on a node to move it.</li><li>Click and hold outside of the nodes to move the whole graph</li></ul>'

interface Props {
    allPipelineNames: string[]
    selectedPipeline: string
    nodeData: any[]
    changeSelectedPipeline: (selectedPipeline: string) => void
}

interface State {}

class RULRegPipelinesStructure extends React.Component<Props, State>{
    state = {}

    render(): React.ReactNode {
        return(
            <Panel>
                <Grid style={{ padding: '10px 30px 30px 30px' }}> 
                    <Grid.Row>
                        <Grid.Column widthXS={Columns.Eleven}>
                            <SelectDropdown
                                options={this.props.allPipelineNames}
                                selectedOption={this.props.selectedPipeline}
                                onSelect={(e) => {this.props.changeSelectedPipeline(e)}}
                            />
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.One}>
                            <div
                                className="graph-tips"
                                data-for="graph-tips-tooltip"
                                data-tip={structureTip}
                            >
                                <span style={{fontSize: '15px'}}>?</span>
                                <ReactTooltip
                                    id="graph-tips-tooltip"
                                    effect="solid"
                                    html={true}
                                    place="bottom"
                                    class="influx-tooltip"
                                />
                            </div>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <NodeGraph elements={this.props.nodeData} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Panel>
        )
    }
}

export default RULRegPipelinesStructure