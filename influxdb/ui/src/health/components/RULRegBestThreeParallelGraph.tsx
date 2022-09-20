// install (please make sure versions match peerDependencies)
// yarn add @nivo/core @nivo/bar
import React from 'react'
import { ResponsiveParallelCoordinates } from '@nivo/parallel-coordinates'
// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.

// Components
import {
    Panel, Grid, Columns, List, MultiSelectDropdown, InfluxColors,
    Button, ButtonType, ComponentColor, IconFont, ComponentSize,
    Gradients, DapperScrollbars, InputLabel, Icon
} from '@influxdata/clockface'

interface Props {
    topFeaturesData: object[]
    variables: object[]
    data: object[]
}

interface State {
    showTopFeatures: boolean
}

class RULRegBestThreeParallelGraph extends React.Component<Props, State>{
    state = {
        showTopFeatures: false
    }

    componentDidMount(): void {
        console.log("graph ", this.props)
    }

    render(){
        return(
            <Panel>
                <Grid style={{ padding: '10px 30px 30px 30px' }}>
                    <Grid.Row style={{marginBottom: "25px"}}>
                        <Grid.Column widthXS={Columns.One}>
                            <Button
                                color={ComponentColor.Primary}
                                titleText=""
                                icon={this.state.showTopFeatures ? IconFont.GraphLine : IconFont.TextBlock}
                                text={this.state.showTopFeatures ? "Show Scores" : "Show Top Features"}
                                type={ButtonType.Submit}
                                onClick={() => this.setState({showTopFeatures: !this.state.showTopFeatures})}
                            />
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Eleven}></Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        {this.state.showTopFeatures ? (
                            <>
                            {this.props.topFeaturesData.map(pipeline => (
                                <Grid.Column widthXS={Columns.Four}>
                                    <InputLabel 
                                        style={{whiteSpace: "break-spaces", color: "#00A3FF"}}
                                    >
                                        {pipeline["pipeline"]}
                                    </InputLabel>
                                    <List
                                        className="data-source--list"
                                        backgroundColor={InfluxColors.Obsidian}
                                    >
                                        <DapperScrollbars
                                            autoHide={false}
                                            autoSizeHeight={true} style={{ maxHeight: '400px' }}
                                            className="data-loading--scroll-content"
                                        >
                                            {pipeline["features"] ? pipeline["features"].map(feature => (
                                                <List.Item
                                                    key={feature}
                                                    value={feature}
                                                    title={feature}
                                                    gradient={Gradients.GundamPilot}
                                                    wrapText={true}
                                                >
                                                    <List.Indicator type="dot" />
                                                    <div className="selectors--item-value selectors--item__measurement">
                                                        <Icon glyph={IconFont.CircleThick} style={{marginRight: "5px"}}/>
                                                    </div>
                                                    {feature}
                                                </List.Item>
                                            )) : <List.EmptyState size={ComponentSize.Small} wrapText={false}>
                                                    This pipeline has no features info
                                                </List.EmptyState>}
                                        </DapperScrollbars>
                                    </List>
                                </Grid.Column>
                            ))}
                            </>
                        ) : (
                            <Grid.Column widthXS={Columns.Twelve} style={{height: "550px"}}>
                                <ResponsiveParallelCoordinates
                                    data={this.props.data}
                                    strokeWidth={3}
                                    theme={{ background: '#292933', textColor: '#999dab', fontSize: '15px', axis:{
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
                                    curve={"natural"}
                                    colors={{ scheme: 'set1' }}
                                    lineOpacity={1}
                                    tickSize={100}
                                    activeStrokeWidth={15}
                                    inactiveLineWidth={0}
                                    variables={this.props.variables}
                                    margin={{ top: 100, right: 60, bottom: 100, left: 60 }}          
                                />
                            </Grid.Column>
                        )}
                    </Grid.Row>
                </Grid>
            </Panel>
        )
    }
}

export default RULRegBestThreeParallelGraph