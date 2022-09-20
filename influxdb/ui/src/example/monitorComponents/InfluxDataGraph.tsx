import React, {MouseEvent} from 'react'
import {ResponsiveLine, PointTooltip} from '@nivo/line'
import {BasicTooltip} from '@nivo/tooltip'
 
interface Props {
    onClick:  (point:any) => void
    data: any[]
    anomalies: any[]
}

const LineTooltip: React.FunctionComponent<PointTooltip> = (props) => {
    //console.log("point ", props)
    const dayStr = new Date(props.point.data.xFormatted) ? "Date: " + new Date(props.point.data.xFormatted).toLocaleString() : "Date: null"
    return (
        <BasicTooltip
            id={dayStr}
            value={"value: " + props.point.data.yFormatted}
            color={props.point.color}
            enableChip
        />
    );
};

class InfluxDataGraph extends React.Component<Props>{
    componentDidMount(): void {
        console.log("data graph", this.props)
    }    
    render() {
        let data = this.props.data
        return(
            <ResponsiveLine 
                data={data}
                theme={{legends: {
                        text:{
                            transform: `rotate(-25deg)`
                        }
                    }
                }}
                onClick={this.props.onClick}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                yFormat=" >-.2f"
                axisTop={null}
                axisRight={null}
                enableSlices={false}//"x"
                tooltip={LineTooltip}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 25,
                    legend: '',
                    legendOffset: 36,
                    legendPosition: 'middle',
                    format: function(value){ 
                        let d = new Date(value)
                    return d.toLocaleDateString().substring(0,5) + " " + d.toLocaleTimeString();
                    //return `${d.getUTCDate()}.${d.getUTCMonth()+1}.${d.getUTCFullYear()} ${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`;
                }
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: '',
                    legendOffset: -40,
                    legendPosition: 'middle'
                }}
                colors={{ scheme: 'category10' }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                sliceTooltip={({ slice }) => {
                    return (
                        <div
                            style={{
                                background: 'white',
                                padding: '9px 12px',
                                border: '1px solid #ccc',
                            }}
                        >
                            {/* <div>x: {slice.id}</div> */}
                            {slice.points.map(point => (
                                <div
                                    key={point.id}
                                    style={{
                                        color: point.serieColor,
                                        padding: '3px 0',
                                    }}
                                >
                                    <strong>Date: </strong> {new Date(point.data.xFormatted) ? new Date(point.data.xFormatted).toLocaleString() : ""}<br/>
                                    <strong>{point.serieId}: </strong> {point.data.yFormatted}
                                </div>
                            ))}
                        </div>
                    )
                }}
                markers={[
                    {
                        axis: 'x',
                        value: data[0] ? data[0].data[Math.floor((data[0].data.length)/2)].x : "",
                        lineStyle: { stroke: '#b0413e', strokeWidth: 3 },
                        legend: 'selected point',
                    }
                ]}
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                    itemOpacity: 1
                                }
                            }
                        ]
                    }
                ]}
            />
        )
    }
}

export default InfluxDataGraph
