// Libraries
import React from 'react'
import { ResponsiveParallelCoordinates } from '@nivo/parallel-coordinates'

// Components
import {
    TechnoSpinner, Panel,
    RemoteDataState,
    SpinnerContainer
} from '@influxdata/clockface'


class HyperparamGraph extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            variables: []
        }
    }

    componentDidMount() {
        if (this.props.experimentJob !== "pof") {
            this.setState({
                variables: [
                    {
                        key: 'batch',
                        type: 'linear',
                        min: '0',
                        max: 'auto',
                        ticksPosition: 'before',
                        legend: 'batch_size',
                        legendPosition: 'start',
                        legendOffset: 20
                    },
                    {
                        key: 'epoch',
                        type: 'linear',
                        min: 0,
                        max: 'auto',
                        ticksPosition: 'before',
                        legend: 'n_epoch',
                        legendPosition: 'start',
                        legendOffset: 20
                    },
                    {
                        key: 'dropout',
                        type: 'linear',
                        min: 0,
                        max: 1,
                        ticksPosition: 'before',
                        legend: 'dropout',
                        legendPosition: 'start',
                        legendOffset: 20
                    },
                    {
                        key: 'units1',
                        type: 'linear',
                        min: 0,
                        max: 'auto',
                        legend: 'units1',
                        legendPosition: 'start',
                        legendOffset: -20
                    },
                    {
                        key: 'units2',
                        type: 'linear',
                        min: 0,
                        max: 'auto',
                        legend: 'units2',
                        legendPosition: 'start',
                        legendOffset: -20
                    },
                    {
                        key: 'metric',
                        type: 'linear',
                        min: 0,
                        max: 1,
                        legend: 'accuracy',
                        legendPosition: 'start',
                        legendOffset: -20
                    }
                ]
            })
        }
        else if (this.props.experimentJob === "pof") {
            this.setState({
                variables: [
                    {
                        key: 'batch',
                        type: 'linear',
                        min: '0',
                        max: 'auto',
                        ticksPosition: 'before',
                        legend: 'batch_size',
                        legendPosition: 'start',
                        legendOffset: 20
                    },
                    {
                        key: 'epoch',
                        type: 'linear',
                        min: 0,
                        max: 'auto',
                        ticksPosition: 'before',
                        legend: 'n_epoch',
                        legendPosition: 'start',
                        legendOffset: 20
                    },
                    {
                        key: 'units1',
                        type: 'linear',
                        min: 0,
                        max: 'auto',
                        legend: 'units1',
                        legendPosition: 'start',
                        legendOffset: -20
                    },
                    {
                        key: 'metric',
                        type: 'linear',
                        min: 0,
                        max: 10,
                        legend: 'val_loss',
                        legendPosition: 'start',
                        legendOffset: -20
                    }
                ]
            })
        }
    }

    render() {
        return (
            <Panel>
                <div style={{ height: 550, color: "black", backgroundColor: '#292933' }}>
                    {
                        this.props.data.length < 1 &&
                        <SpinnerContainer loading={RemoteDataState.Loading} spinnerComponent={<TechnoSpinner />}>
                        </SpinnerContainer>
                    }
                    {
                        this.props.data.length > 0 &&
                        <ResponsiveParallelCoordinates
                            data={this.props.data}
                            strokeWidth={3}
                            theme={{
                                background: '#292933', textColor: '#999dab', fontSize: '15px', axis: {
                                    domain: {
                                        line: {
                                            strokeWidth: 1,
                                            stroke: '#999dab'
                                        }
                                    }
                                }, grid: {
                                    line: {
                                        strokeWidth: 1,
                                        stroke: '#999dab'
                                    }
                                }
                            }}
                            curve={"natural"}
                            colors={{ scheme: 'purple_blue' }}
                            lineOpacity={1}
                            tickSize={100}
                            activeStrokeWidth={15}
                            inactiveLineWidth={0}
                            onMouseOver={(e) => console.log("lol", e)}
                            variables={this.state.variables}
                            margin={{ top: 50, right: 60, bottom: 50, left: 60 }}

                        />
                    }
                </div>
            </Panel>
        )
    }
}

export default HyperparamGraph