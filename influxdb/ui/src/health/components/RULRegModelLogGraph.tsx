import React, { PureComponent } from 'react'
import {ResponsiveLine, PointTooltip} from '@nivo/line'
import {BasicTooltip} from '@nivo/tooltip'
import {TechnoSpinner, WaitingText} from '@influxdata/clockface'

interface Props {
    modelLogDataPoints: any[] 
    annotations: object[]
}

interface State {
    modelLogDataPoints: any[]
    annotations: object[]
}

const LineTooltip: PointTooltip = (props) => {
    const dayStr = new Date(props.point.data.xFormatted) ? "Date: " + new Date(props.point.data.xFormatted).toLocaleString() : "Date: null"
    const indicator = props.point.data.y
    const msg = " cycles left till failure"
    return (
        <BasicTooltip
            id={dayStr}
            value={"Event indicator: " + indicator + msg}
            color={props.point.color}
            enableChip
        />
    );
};

class RULRegModelLogGraph extends PureComponent<Props, State>{
    state = {
        modelLogDataPoints: [],
        annotations: []
    }

    componentDidMount(): void {
        this.setState({modelLogDataPoints: this.props.modelLogDataPoints, annotations: this.props.annotations}, ()=>console.log("rul log mount", this.props))
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if(prevProps.modelLogDataPoints.length !== this.props.modelLogDataPoints.length){
            this.setState({modelLogDataPoints: this.props.modelLogDataPoints, annotations: this.props.annotations}, ()=>console.log("rul log update", this.props))
        }
    }

    render(): React.ReactNode {
        return(
            <div style={{height: "inherit", color: "black", display: "flex", justifyContent: "center", alignItems: "center"}}>
                {this.state.modelLogDataPoints.length ?
                    <ResponsiveLine 
                        data={this.state.modelLogDataPoints}
                        theme={{ background: '#292933', textColor: '#999dab', fontSize: 15,
                            crosshair: {
                                line: {
                                    stroke: "#00A3FF",
                                    strokeWidth: 5,
                                    strokeOpacity: 1,
                                },
                            },
                            legends: {
                                text:{
                                    transform: `rotate(-25deg)`
                                }
                            }
                        }}
                        margin={{ top: 50, right: 110, bottom: 100, left: 100 }}
                        xScale={{ type: 'point' }}
                        yScale={{ type: 'linear', min: "auto", max:"auto", stacked: false, reverse: false }}
                        //yFormat=" >-.2f"
                        axisTop={null}
                        axisRight={null}
                        enableSlices={false}//"x"
                        tooltip={LineTooltip}
                        axisBottom={{
                            tickSize: 5,
                            tickPadding: 10,
                            legendOffset: 40,
                            tickRotation: 30,
                            legend: 'time',
                            legendPosition: 'middle',
                            format: (value) => {
                                // let d = new Date(value)
                                // return d.toLocaleDateString() + " " + d.toLocaleTimeString().substring(0,5);
                                if(value === this.state.modelLogDataPoints[0]["data"][0]["x"]){
                                    let d = new Date(value)
                                    return d.toLocaleDateString() + " " + d.toLocaleTimeString().substring(0,5);
                                }
                                else if(value === this.state.modelLogDataPoints[0]["data"][parseInt(this.state.modelLogDataPoints[0]["data"].length/2)]["x"]){
                                    let d = new Date(value)
                                    return d.toLocaleDateString() + " " + d.toLocaleTimeString().substring(0,5);
                                } 
                                else if(value === this.state.modelLogDataPoints[0]["data"][this.state.modelLogDataPoints[0]["data"].length-1]["x"]){
                                    let d = new Date(value)
                                    return d.toLocaleDateString() + " " + d.toLocaleTimeString().substring(0,5);
                                }
                                return ""
                            //return `${d.getUTCDate()}.${d.getUTCMonth()+1}.${d.getUTCFullYear()} ${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`;
                            }
                        }}
                        //axisBottom={null}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'number of cycles',
                            legendOffset: -70,
                            legendPosition: 'middle'
                        }}
                        colors={{ scheme: 'set1' }}
                        pointSize={2} //10
                        pointColor={{ theme: 'background' }}
                        pointBorderWidth={2}
                        pointBorderColor={{ from: 'serieColor' }}
                        pointLabelYOffset={-12}
                        useMesh={true}
                        enableGridX={false}
                        markers={this.state.annotations}
                    /> : 
                    <div>
                        <TechnoSpinner style={{ width: "50px", height: "50px", marginBottom: "20%", marginLeft: "20%" }} />
                        <WaitingText style={{color: "#00A3FF"}} text="Waiting For Logs" />
                    </div>
                }
            </div>
        )
    }
}

export default RULRegModelLogGraph