// install (please make sure versions match peerDependencies)
// yarn add @nivo/core @nivo/bump
import React from 'react'
import { ResponsiveBump } from '@nivo/bump'
// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.

class LineGraph extends React.Component {
    render() {
        return (
            <ResponsiveBump
                data={this.props.data}
                margin={{ top: 40, right: 100, bottom: 40, left: 60 }}
                colors={{ scheme: 'red_yellow_blue' }}
                theme={{ background: '#292933', textColor: '#999dab', fontSize: '13px' }}
                lineWidth={5}
                activeLineWidth={7}
                inactiveLineWidth={3}
                inactiveOpacity={0.3}
                pointSize={10}
                activePointSize={16}
                inactivePointSize={0}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={3}
                activePointBorderWidth={3}
                pointBorderColor={{ from: 'serie.color' }}
                //xScale={{ "type": "time", "format": "%Y-%m-%d %H:%M:%S", "precision": "minute" }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -15,
                    legend: 'timestamp',
                    legendPosition: 'end',
                    legendOffset: 32,
                    //format:"%Y-%m-%d %H:%M:%S"
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: this.props.experimentJob === "pof" ? "val_loss" : "accuracy",
                    legendPosition: 'end',
                    legendOffset: -50,
                    format: x => x * (-1)
                }}
            />
        )
    }
}
export default LineGraph
