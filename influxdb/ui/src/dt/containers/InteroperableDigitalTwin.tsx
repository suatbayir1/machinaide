// Libraries
import React, { PureComponent } from 'react'

// Components
import { Page, Grid, Columns, QuestionMarkTooltip, ComponentColor, InfluxColors } from '@influxdata/clockface'
import DataFlowSettings from 'src/dt/components/DataFlowSettings'

// Constants
import {
    tipStyle, dataFlowSettings,
} from 'src/shared/constants/tips';


interface Props { }
interface State { }

class Interoperable extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
        }
    }

    public render() {

        return (
            <Page>
                <Page.Header fullWidth={false}>
                    <Page.Title title="Data Flow Settings" />
                    <QuestionMarkTooltip
                        diameter={30}
                        tooltipStyle={{ width: '400px' }}
                        color={ComponentColor.Secondary}
                        tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                            <div style={{ color: InfluxColors.Star }}>{"Data Flow Settings:"}
                                <hr style={tipStyle} />
                            </div>
                            {dataFlowSettings}
                        </div>}
                    />
                </Page.Header>

                <Page.Contents fullWidth={false} scrollable={true}>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Six}>
                                <DataFlowSettings />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Page.Contents>
            </Page>
        )
    }
}


export default Interoperable;
