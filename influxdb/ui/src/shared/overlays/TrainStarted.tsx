// Libraries
import React, { PureComponent } from 'react'

// Components
import { Overlay, Form, Grid, Columns, Button, IconFont, ComponentColor } from '@influxdata/clockface'

interface Props {
    visible: boolean
    onDismiss: () => void
}

interface State {
}

class TrainStarted extends PureComponent<Props, State> {
    constructor(props) {
        super(props)
        this.state = {
        }
    }

    render() {
        const { visible, onDismiss } = this.props;

        return (
            <>
                <Overlay visible={visible}>
                    <Overlay.Container maxWidth={600}>
                        <Overlay.Header
                            title={"Training Info"}
                            onDismiss={onDismiss}
                        />

                        <Overlay.Body style={{ backgroundColor: '#292933' }}>
                            <Form>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Ten} offsetXS={Columns.One}>
                                        Training process will be started soon after the data is prepared. <br /><br />
                                        After the AutoML process, you can see the training progress in the models table.
                                    </Grid.Column>
                                </Grid.Row>

                                <Form.Footer>
                                    <Button
                                        text="Go Back"
                                        icon={IconFont.Refresh}
                                        color={ComponentColor.Primary}
                                        onClick={onDismiss}
                                    />
                                </Form.Footer>
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay >
            </>
        );
    }
}

export default TrainStarted;
