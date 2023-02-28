import React, { PureComponent } from "react";
import {
    Page,
} from '@influxdata/clockface'

interface Props { }
interface State { }

class Error404Page extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        return (
            <Page>
                <Page.Header fullWidth={true}>
                    <Page.Title title={"404 Not Found Page"} />
                </Page.Header>
            </Page>
        )
    }
}

export default Error404Page;