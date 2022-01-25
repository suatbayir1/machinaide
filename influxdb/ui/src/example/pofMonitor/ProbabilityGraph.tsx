import React, {MouseEvent} from 'react'
import {ResponsiveLine, PointTooltip} from '@nivo/line'
import {BasicTooltip} from '@nivo/tooltip'
 
interface Props {
    data: any[]
    setSelectedPoint: (point:object) => void
}

const LineTooltip: React.FunctionComponent<PointTooltip> = (props) => {
    //console.log("point ", props)
    const dayStr = new Date(props.point.data.xFormatted) ? "Date: " + new Date(props.point.data.xFormatted).toLocaleString() : "Date: null"
    return (
        <BasicTooltip
            id={dayStr}
            value={"probability: " + props.point.data.yFormatted}
            color={props.point.color}
            enableChip
        />
    );
};

class ProbabilityGraph extends React.Component<Props>{
    componentDidMount(): void {
        console.log(this.props)
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
                onClick={this.props.setSelectedPoint}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 1, stacked: false, reverse: false }}
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
                // markers={this.props.anomalies} //maybe show fail points as markers?
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

export default ProbabilityGraph
