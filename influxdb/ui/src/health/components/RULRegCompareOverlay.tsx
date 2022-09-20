import React, { PureComponent } from 'react'
import { ResponsiveParallelCoordinates } from '@nivo/parallel-coordinates'

// Components
import {
    Grid, Overlay, Gradients, List, Button, IconFont, ComponentColor, ButtonType,
    ComponentSize, ConfirmationButton, Appearance, Label, InfluxColors, SelectDropdown,
    TextArea, AutoComplete, Wrap, Form, Columns
} from '@influxdata/clockface'

interface Props {
    visible: boolean
    onDismiss: () => void
    data: object[]
    variables: object[]
}

interface State {}

class RULRegCompareOverlay extends PureComponent<Props, State>{
    state = {

    }

    componentDidMount(): void {
        console.log(this.props)
    }

    render(): React.ReactNode {
        return(
            <Overlay visible={this.props.visible}>
                <Overlay.Container maxWidth={800}>
                    <Overlay.Header
                        title="Pipeline Comparison"
                        onDismiss={this.props.onDismiss}
                    />
                    <Overlay.Body>
                        <Grid>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Twelve} style={{height: "500px"}}>
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
                                        margin={{ top: 100, right: 100, bottom: 100, left: 100 }}       
                                    />
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default RULRegCompareOverlay