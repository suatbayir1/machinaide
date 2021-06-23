// Libraries
import React, { Component } from 'react'

// Components
import {
    Grid,
    Columns,
} from '@influxdata/clockface'
import GradientBorder from 'src/shared/components/cells/GradientBorder'
import CellHeader from 'src/shared/components/cells/CellHeader'
import CellContext from 'src/shared/components/cells/CellContext'

interface Props {
    manualRefresh: number
}

class CustomAddedCells extends Component<Props> {
    render() {
        return (

            <Grid.Row>
                <Grid.Column
                    widthXS={Columns.Two}
                    style={{ paddingRight: '30px' }}
                >
                    <div className="cell">
                        <div style={{ cursor: 'pointer' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px' }} >Total Alerts</h4>
                                <h4 style={{ color: 'white', fontSize: '20px' }}>{20}</h4>
                            </div>
                        </div>
                    </div>
                </Grid.Column>

                <Grid.Column
                    widthXS={Columns.Two}
                    style={{ paddingRight: '15px', paddingLeft: '15px' }}
                >
                    <div className="cell">
                        <div style={{ cursor: 'pointer' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px' }} >Total Maintenance</h4>
                                <h4 style={{ color: 'white', fontSize: '20px' }}>{30}</h4>
                            </div>
                        </div>
                    </div>
                </Grid.Column>

                <Grid.Column
                    widthXS={Columns.Two}
                    style={{ paddingRight: '15px', paddingLeft: '15px' }}
                >
                    <div className="cell">
                        <div style={{ cursor: 'pointer' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px' }} >Total Failures</h4>
                                <h4 style={{ color: 'white', fontSize: '20px' }}>{40}</h4>
                            </div>
                        </div>
                    </div>
                </Grid.Column>

                <Grid.Column
                    widthXS={Columns.Two}
                    style={{ paddingRight: '15px', paddingLeft: '15px' }}
                >
                    <div className="cell">
                        <div style={{ cursor: 'pointer' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px' }} >Total Machine Actions</h4>
                                <h4 style={{ color: 'white', fontSize: '20px' }}>{30}</h4>
                            </div>
                        </div>
                    </div>
                </Grid.Column>

                <Grid.Column
                    widthXS={Columns.Two}
                    style={{ paddingRight: '15px', paddingLeft: '15px' }}
                >
                    <div className="cell">
                        <div style={{ cursor: 'pointer' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px' }} >Total Machine Actions</h4>
                                <h4 style={{ color: 'white', fontSize: '20px' }}>{30}</h4>
                            </div>
                        </div>
                    </div>
                </Grid.Column>

                <Grid.Column
                    widthXS={Columns.Two}
                    style={{ paddingRight: '15px', paddingLeft: '15px' }}
                >
                    <div className="cell">
                        <div style={{ cursor: 'pointer' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ marginTop: '20px' }} >Total Machine Actions</h4>
                                <h4 style={{ color: 'white', fontSize: '20px' }}>{30}</h4>
                            </div>
                        </div>
                    </div>
                </Grid.Column>
            </Grid.Row>
        )
    }
}

export default CustomAddedCells;