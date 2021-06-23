// Libraries
import React, { PureComponent } from 'react'

// Components
import { Page } from '@influxdata/clockface'
import Charts from 'src/reports/components/Charts';


interface Props { }
interface State {
}

class ReportViewContainer extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
        }
    }

    public render() {
        return (
            <Page>
                <Page.Header fullWidth={false}>
                    <Page.Title title="Report View" />
                </Page.Header>

                <Page.Contents fullWidth={false} scrollable={true}>
                    <Charts />
                </Page.Contents>
            </Page>
        )
    }
}


export default ReportViewContainer;
