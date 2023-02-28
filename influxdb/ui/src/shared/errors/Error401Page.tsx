import React, { PureComponent } from "react";
import {
    Page,
} from '@influxdata/clockface'

interface Props { }
interface State { }

class Error401Page extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        return (
            <Page>
                <Page.Header fullWidth={true}>
                    <Page.Title title={"401 Unauthorized Page"} />
                </Page.Header>
            </Page>
        )
    }
}

export default Error401Page;