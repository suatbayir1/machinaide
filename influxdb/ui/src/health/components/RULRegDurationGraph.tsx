// install (please make sure versions match peerDependencies)
// yarn add @nivo/core @nivo/bar
import React from 'react'
import { ResponsiveBar, BarTooltipDatum } from '@nivo/bar'
import { BasicTooltip } from '@nivo/tooltip';

// Components
import {
    TechnoSpinner, Panel,
    RemoteDataState,
    SpinnerContainer
} from '@influxdata/clockface'

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.

const BarTooltip: React.FunctionComponent<BarTooltipDatum> = (props) => {
    // console.log("data ", props)
    const dayStr = `Pipeline: ${props.data.pipelineName} - Duration in (H:M:S:S)`;
    return (
        <BasicTooltip
            id={dayStr}
            value={new Date(props.data.duration * 1000).toISOString().substring(11, 23)}
            color={props.color}
            enableChip
        />
    );
};

interface Props {	
    data: object[]	
}

class RULRegDurationGraph extends React.Component<Props> {
    render() {
        console.log("graph worked", this.props.data);
        console.log("length", this.props.data.length);


        return (
            <Panel>
                <div style={{ height: 650, color: "black", backgroundColor: '#292933' }}>
                    {
                        this.props.data.length < 1 &&
                        <SpinnerContainer loading={RemoteDataState.Loading} spinnerComponent={<TechnoSpinner />}>
                        </SpinnerContainer>
                    }
                    {
                        this.props.data.length > 0 &&
                        <ResponsiveBar
                            data={this.props.data}
                            // tooltip={(d)=>{return<div style={{color: 'black'}}>duration: {d.value}</div>}}
                            theme={{ background: '#292933', textColor: '#999dab', fontSize: '15px' }}
                            keys={['duration']}
                            indexBy="pipelineName"
                            margin={{ top: 50, right: 130, bottom: 50, left: 90 }}
                            padding={0.3}
                            layout="horizontal"
                            valueScale={{ type: 'linear' }}
                            indexScale={{ type: 'band', round: true }}
                            colors={'#98dffa'}
                            enableGridX={true}
                            enableGridY={false}
                            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            axisTop={null}
                            axisRight={null}
                            label={d => `${new Date(d.value * 1000).toISOString().substring(11, 19)}`}
                            labelTextColor={"black"}
                            tooltip={BarTooltip}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'time(seconds)',
                                legendPosition: 'middle',
                                legendOffset: 32
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: -50,
                                legend: 'pipeline',
                                legendPosition: 'start',
                                legendOffset: -60,
                                format: function(value){
                                    if(value.length)
                                        return value.split(" ")[0]
                                    else
                                        return "-"
                                }
                            }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            // labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            legends={[
                                {
                                    dataFrom: 'keys',
                                    anchor: 'bottom-right',
                                    direction: 'column',
                                    justify: false,
                                    translateX: 120,
                                    translateY: 0,
                                    itemsSpacing: 2,
                                    itemWidth: 100,
                                    itemHeight: 20,
                                    itemDirection: 'left-to-right',
                                    itemOpacity: 0.85,
                                    symbolSize: 20,
                                    effects: [
                                        {
                                            on: 'hover',
                                            style: {
                                                itemOpacity: 1
                                            }
                                        }
                                    ]
                                }
                            ]}
                            animate={true}
                            motionStiffness={90}
                            motionDamping={15}
                        />
                    }
                </div>
            </Panel>
        )
    }
}

export default RULRegDurationGraph