// Libraries
import React, { PureComponent } from 'react'

// Components
import { Page, Grid, Columns, RemoteDataState } from '@influxdata/clockface'

interface Props { }

interface State {
}

class DigitalTwinPage extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
        }
    }
    public render(): JSX.Element {

        return (
            <Page>
                <Page.Header fullWidth={true}>
                    <Page.Title title={"Machine Learning"} />
                </Page.Header>

                <Page.Contents fullWidth={true} scrollable={true}>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Four}
                                widthMD={Columns.Two}
                                widthLG={Columns.Two}
                                style={{ marginTop: '20px' }}
                            >
                                <h2> left component</h2>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Eight}
                                widthMD={Columns.Six}
                                widthLG={Columns.Six}
                                style={{ marginTop: '20px' }}
                            >
                                <h2>middle component</h2>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Twelve}
                                widthMD={Columns.Four}
                                widthLG={Columns.Four}
                                style={{ marginTop: '20px' }}
                            >
                                <h2>right component</h2>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Page.Contents>
            </Page>)
    }
}

export default DigitalTwinPage;