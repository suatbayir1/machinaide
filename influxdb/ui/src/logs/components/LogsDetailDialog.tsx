import React, { PureComponent } from 'react'
import {
    Form,
    Button,
    ButtonType,
    ComponentColor,
    Overlay,
    IconFont,
} from '@influxdata/clockface'

interface Props {
    openLogsDetailDialog: boolean
    handleDismissLogsDetailDialog: () => void
    selectedRowData: object
}

interface State {
}

class LogsDetailDialog extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        return (
            <>
                <Overlay visible={this.props.openLogsDetailDialog}>
                    <Overlay.Container maxWidth={600}>
                        <Overlay.Header
                            title={"Log Detail Page"}
                            onDismiss={this.props.handleDismissLogsDetailDialog}
                        />

                        <Overlay.Body>
                            <Form>
                                <Form.Footer>
                                    <Button
                                        text="Cancel"
                                        icon={IconFont.Remove}
                                        color={ComponentColor.Danger}
                                    />

                                    <Button
                                        text="Save"
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                    />
                                </Form.Footer>
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        );
    }
}

export default LogsDetailDialog;