// install (please make sure versions match peerDependencies)
// yarn add @nivo/core @nivo/parallel-coordinates
import React from 'react'
import { ResponsiveParallelCoordinates } from '@nivo/parallel-coordinates'
// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
class AnomalyMetricGraph extends React.Component{
    render(){
        return(<ResponsiveParallelCoordinates
            data={this.props.data}
            strokeWidth={3}
            theme={{ textColor: '#999dab', fontSize: '15px', axis:{
                domain:{
                    line:{
                        strokeWidth: 1,
                        stroke: '#999dab'
                    }
                }
            }, grid: {
                line:{
                    strokeWidth: 1,
                    stroke: '#999dab'
                }
            } }}
            curve={"linear"}
            colors={{ scheme: 'category10' }}
            lineOpacity={1}
            tickSize={100}
            activeStrokeWidth={15}
            inactiveLineWidth={0}
            yGrid={true}
            onMouseOver={(e) => console.log("lol", e)}
            variables={[
                /* {
                    key: 'modelNo',
                    type: 'linear',
                    min: "auto",
                    max: "auto",
                    ticksPosition: 'before',
                    legend: 'trial no',
                    legendPosition: 'start',
                    legendOffset: 20
                }, */
                {
                    key: 'data',
                    type: 'point',
                    values: this.props.models,
                    ticksPosition: 'before',
                    tickRotation: -50,
                    legend: 'data',
                    legendPosition: 'start',
                    legendOffset: 20
                },
                {
                    key: 'temporalDistance',
                    type: 'linear',
                    min: "auto",
                    max: 'auto',
                    ticksPosition: 'before',
                    legend: 'temporal distance',
                    legendPosition: 'start',
                    legendOffset: 20
                },
                {
                    key: 'ttc',
                    type: 'linear',
                    min: "auto",
                    max: 'auto',
                    ticksPosition: 'before',
                    legend: 'ttc',
                    legendPosition: 'start',
                    legendOffset: 20
                },
                {
                    key: 'ctt',
                    type: 'linear',
                    min: "auto",
                    max: "auto",
                    ticksPosition: 'before',
                    legend: 'ctt',
                    legendPosition: 'start',
                    legendOffset: 20
                },
                {
                    key: 'exactMatch',
                    type: 'linear',
                    min: "auto",
                    max: 'auto',
                    legend: 'exact_match',
                    legendPosition: 'start',
                    legendOffset: -20
                },
                {
                    key: 'detectedAnomaly',
                    type: 'linear',
                    min: "auto",
                    max: 'auto',
                    legend: 'detected_anomaly',
                    legendPosition: 'start',
                    legendOffset: -20
                },
                {
                    key: 'missedAnomaly',
                    type: 'linear',
                    min: "auto",
                    max: 'auto',
                    legend: 'missed anomaly',
                    legendPosition: 'start',
                    legendOffset: -20
                },
                {
                    key: 'falseAnomaly',
                    type: 'linear',
                    min: "auto",
                    max: 'auto',
                    legend: 'false anomaly',
                    legendPosition: 'start',
                    legendOffset: -20
                },
                {
                    key: 'tdir',
                    type: 'linear',
                    min: "auto",
                    max: 'auto',
                    legend: 'tdir',
                    legendPosition: 'start',
                    legendOffset: -20
                },
                {
                    key: 'dair',
                    type: 'linear',
                    min: "auto",
                    max: 'auto',
                    legend: 'dair',
                    legendPosition: 'start',
                    legendOffset: -20
                },
            ]}
            margin={{ top: 50, right: 60, bottom: 50, left: 60 }}
            
        />)
    }

}

export default AnomalyMetricGraph