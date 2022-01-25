import React, { PureComponent } from 'react'
import {InfluxDataGraphWrapper} from './InfluxDataGraphWrapper'
import {ComponentStatus, ButtonType, ComponentColor,  Button, IconFont, 
    Label, ComponentSize, InfluxColors} from '@influxdata/clockface'

interface Props {
    orgID: string
    date: string
    machine: string
    component: string
    sensor: string
}

interface State {
    query: string
    windows: object
    zooms: string[]
    zoomIndex: number
    seconds: object
    date: string
}

class InfluxDataWrapper extends PureComponent<Props, State>{
    state = {
        query: "",
        windows: {
            "1m": "2s", "5m": "10s", "15m": "30s", "30m": "60s",
            "1h": "2m", "2h": "4m", "3h": "6m", "4h": "8m", 
            "5h": "10m", "6h": "12m", "12h": "24m","24h": "48m",
            "2d": "96m", "7d": "336m", "30d": "1440m"
        },
        zooms: ["1m", "5m", "15m","30m","1h","2h","3h","4h","5h","6h","12h","24h","2d","7d","30d"],
        seconds: {
            "1m": 60, "5m": 60*5, "15m": 60*15, "30m": 60*30,
            "1h": 60*60, "2h": 60*60*2, "3h": 60*60*3, "4h": 60*60*4, 
            "5h": 60*60*5, "6h": 60*60*6, "12h": 60*60*12,"24h": 60*60*24,
            "2d": 60*60*24*2, "7d": 60*60*24*7, "30d": 60*60*24*30
        },
        zoomIndex: 0,
        date: this.props.date,
    }

    componentDidMount(): void {
        this.setQuery()
    }

    componentDidUpdate(prevProps) {
        if(prevProps.date !== this.props.date) {
          this.setState({date: this.props.date, zoomIndex: 0}, ()=>this.setQuery());
        }
    }

    setQuery = () => {
        let date = new Date(this.state.date)
        let from = new Date(date.getTime()-(this.state.seconds[this.state.zooms[this.state.zoomIndex]]*1000))
        let to = new Date(date.getTime()+(this.state.seconds[this.state.zooms[this.state.zoomIndex]]*1000))
        let query =  `from(bucket: "${this.props.machine}")
        |> range(start: ${from.toISOString()}, stop: ${to.toISOString()})
        |> filter(fn: (r) => r._measurement == "${this.props.component}")
        |> filter(fn: (r) => r["_field"] == "${this.props.sensor}")
        |> aggregateWindow(every: ${this.state.windows[this.state.zooms[this.state.zoomIndex]]}, fn: mean, createEmpty: false)`
        this.setState({query: query}/* ,()=>console.log(this.state) */)
    }

    zoomIn = () => {
        let index = this.state.zoomIndex
        if(index>0){
            this.setState({zoomIndex: index-1}, ()=>this.setQuery())
        }
    }

    zoomOut = () => {
        let index = this.state.zoomIndex
        if(index<this.state.zooms.length-1){
            this.setState({zoomIndex: index+1}, ()=>this.setQuery())
        }
    }

    render(){
        let d = new Date(this.state.date)
        return(
            <div>
                <Button
                    color={ComponentColor.Primary}
                    titleText=""
                    text="Zoom In"
                    //icon={IconFont.PlusSkinny}
                    type={ButtonType.Submit}
                    onClick={this.zoomIn}
                    style={{marginRight: "5px"}}
                    status={this.state.zoomIndex === 0 ? ComponentStatus.Disabled : ComponentStatus.Default}
                /> 
                <Button
                    color={ComponentColor.Secondary}
                    titleText=""
                    text="Zoom Out"
                    type={ButtonType.Submit}
                    onClick={this.zoomOut}
                    style={{marginRight: "5px"}}
                    status={this.state.zoomIndex === (this.state.zooms.length-1) ? ComponentStatus.Disabled : ComponentStatus.Default}
                /> 
                <Label
                    size={ComponentSize.Small}
                    name={"Selected date " + d.toLocaleDateString().substring(0,5) + " " + d.toLocaleTimeString()}
                    description={""}
                    color={InfluxColors.Viridian}
                    id={"icon-label"} 
                />
                <Label
                    size={ComponentSize.Small}
                    name={"Data within range: " + this.state.zooms[this.state.zoomIndex]}
                    description={""}
                    color={InfluxColors.Viridian}
                    id={"icon-label"} 
                />
                <InfluxDataGraphWrapper
                    key={this.props.date}
                    orgID={this.props.orgID} 
                    query={this.state.query} 
                    onClick={()=>console.log("click graph")} 
                    selectedSensors={[]}
                    setSelectedInParent={()=>console.log("set selected in parent")}
                    anomalies={[]}
                />
            </div>
        )
    }
}

export default InfluxDataWrapper