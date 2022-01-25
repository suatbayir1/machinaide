import React, {MouseEvent} from 'react'
import {ResponsiveLine} from '@nivo/line'
import {Grid, Columns, MultiSelectDropdown, SlideToggle, ButtonType, ComponentColor,
    InfluxColors, Button} from '@influxdata/clockface'

interface Props {
    onClick:  (event: React.MouseEvent<SVGGElement, MouseEvent>, value: any | string) => void
    data: any[]
}

interface State {
    allMetrics: any[]
    selectedMetrics: any[]
    data: any[]
}

class AnomalyMetricTimelineGraph extends React.Component<State, Props>{
    state = {
        allMetrics: [],
        selectedMetrics: [],
        data: []
    }

    componentDidMount(): void {
        console.log(this.props)
        let metrics = []
        for(let d of this.props.data){
            if(!metrics.includes(d.id)){
                metrics.push(d.id)
            }
        }
        this.setState({allMetrics: metrics, selectedMetrics: metrics, data: this.props.data})
    }    

    onSelectAll = () => {
        this.setState({selectedMetrics: this.state.allMetrics, data: this.props.data})
    }

    onDeselectAll = () => {
        this.setState({selectedMetrics: [], data: []})
    }

    onSelectOptions = (option: string) => {
        let selectedMetrics = this.state.selectedMetrics
        const optionExists = selectedMetrics.find(opt => opt === option)
        let updatedMetrics = selectedMetrics
      
        if (optionExists) {
            updatedMetrics = selectedMetrics.filter(fo => fo !== option)
        } else {
            updatedMetrics = [...selectedMetrics, option]
        }        
        let data = this.props.data
        let newData = data.filter(d => updatedMetrics.includes(d.id))
        console.log("new data", data, newData)
        this.setState({selectedMetrics: updatedMetrics, data: newData})
    }
    render() {
        let data = this.props.data
        return(
            <>
            <Grid.Row>
                <Grid.Column widthXS={Columns.Eight}/> 
                <Grid.Column widthXS={Columns.Two}>
                    <MultiSelectDropdown
                        emptyText={"Select metrics"}
                        options={this.state.allMetrics}
                        selectedOptions={this.state.selectedMetrics}
                        onSelect={(e)=>this.onSelectOptions(e)}
                    />
                </Grid.Column>  
                <Grid.Column widthXS={Columns.Two}>
                    <Button
                        color={ComponentColor.Primary}
                        titleText=""
                        text="Select All"
                        type={ButtonType.Submit}
                        onClick={() => this.onSelectAll()}
                        style={{marginRight: "5px"}}
                    />  
                    <Button
                        color={ComponentColor.Secondary}
                        titleText=""
                        text="Deselect All"
                        type={ButtonType.Submit}
                        onClick={() => this.onDeselectAll()}
                        style={{marginRight: "5px"}}
                    />
                </Grid.Column>                  
            </Grid.Row>
            <Grid.Row style={{textAlign: "-webkit-center", background: InfluxColors.Obsidian}}>
                <Grid.Column widthXS={Columns.Twelve}>
                    <div style={{ height: "450px", width: "1000px", alignSelf: "center", color: "black"}}>
                        <ResponsiveLine 
                            theme={{textColor: '#999dab',
                                crosshair: {
                                    line: {
                                        stroke: InfluxColors.Ghost,
                                        strokeWidth: 2,
                                        strokeOpacity: 1,
                                    },
                                }}}
                            data={this.state.data}
                            onClick={this.props.onClick}
                            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                            xScale={{ type: 'point' }}
                            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                            yFormat=" >-.2f"
                            axisTop={null}
                            axisRight={null}
                            enableSlices="x"
                            enableGridX={false}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 25,
                                legend: '',
                                legendOffset: 36,
                                legendPosition: 'middle',
                                format: function(value){ 
                                    let d = new Date(value)
                                return d.toLocaleDateString().substr(0,5) + " " + d.toLocaleTimeString();
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
                    </div>
                </Grid.Column>
            </Grid.Row>
            </>        
        )
    }
}

export default AnomalyMetricTimelineGraph
