import React, { PureComponent } from 'react'
import {ResponsiveLine, PointTooltip} from '@nivo/line'
import {BasicTooltip} from '@nivo/tooltip'

interface Props {
    modelLogDataPoints: any[] 
    annotations: object[]
}

interface State {}

class RULRegModelLogGraph extends PureComponent<Props, State>{
    state ={

    }

    componentDidMount(): void {
        console.log("rulreg log", this.props)
    }

    render(): React.ReactNode {
        return(<div>RULReg model log</div>)
    }
}

export default RULRegModelLogGraph