import React, { PureComponent } from 'react'
import {ResponsiveLine, PointTooltip} from '@nivo/line'
import {BasicTooltip} from '@nivo/tooltip'

interface Props {
    modelLogDataPoints: any[]
    annotations: object[]
}

interface State {}

const LineTooltip: PointTooltip = (props) => {
    //console.log("point ", props)
    const dayStr = new Date(props.point.data.xFormatted) ? "Date: " + new Date(props.point.data.xFormatted).toLocaleString() + " " : "Date: null"
    return (
        <BasicTooltip
            id={dayStr}
            value={"Probability to fail: " + props.point.data.yFormatted}
            color={props.point.color}
            enableChip
        />
    );
};

class POFModelLogGraph extends PureComponent<Props, State>{
    state ={

    }

    componentDidMount(): void {
        console.log("pof log", this.props)
    }

    render(): React.ReactNode {
        return(<div>POF model log</div>)
    }
}

export default POFModelLogGraph