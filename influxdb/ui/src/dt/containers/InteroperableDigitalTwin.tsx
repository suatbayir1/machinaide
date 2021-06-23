// Libraries
import React, { PureComponent } from 'react'

// Components
import { Page, Grid, Columns } from '@influxdata/clockface'
import DataFlowSettings from 'src/dt/components/DataFlowSettings'

interface Props { }
interface State {
}

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
