// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'

// Components
import {
    Form, Button, ButtonType, ComponentColor, Overlay, IconFont, Grid, Columns,
    Input, ComponentStatus,
} from '@influxdata/clockface'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    pleaseFillInTheFormCompletely,
    generalErrorMessage,
    generalSuccessMessage,
} from 'src/shared/copy/notifications'

// Services
import DTService from "src/shared/services/DTService";


interface OwnProps {
    visible: boolean
    onDismiss: () => void
    selectedPart: object
    getFailures: () => void
    getMaintenances: () => void
    refreshGraph: () => void
    clearComponent: () => void
    getOldParts: () => void
}

interface State {
    terminationDate: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class RetirePart extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            terminationDate: "",
        };
    }

    save = async () => {
        const { terminationDate } = this.state;
        const { notify, selectedPart, refreshGraph, getMaintenances, getFailures, onDismiss, getOldParts } = this.props;

        if (terminationDate === "") {
            notify(pleaseFillInTheFormCompletely("Termination Date"));
            return;
        }


        const payload = {
            "type": selectedPart["type"],
            "name": selectedPart["name"],
            "brand": selectedPart["brand"],
            "deploymentTime": selectedPart["deploymentTime"],
            "terminationTime": terminationDate,
        }

        const result = await DTService.retire(payload);

        if (result.success) {
            notify(generalSuccessMessage(result.message.text));
            refreshGraph();
            getMaintenances();
            getFailures();
            onDismiss();
            getOldParts();
        } else {
            notify(generalErrorMessage(result.message.text));
        }
    }

    render() {
        const { visible, onDismiss, selectedPart } = this.props;
        const { terminationDate } = this.state;

        return (
            <>
                <Overlay visible={visible}>
                    <Overlay.Container maxWidth={800}>
                        <Overlay.Header
                            title={`Change ${selectedPart["type"]}: ${selectedPart["name"]}`}
                            onDismiss={onDismiss}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element label="Sensor Name" required={true}>
                                            <Input
                                                onChange={() => { }}
                                                value={selectedPart["name"]}
                                                status={ComponentStatus.Disabled}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element label="Termination Date" required={true}>
                                            <input
                                                value={terminationDate}
                                                type='datetime-local'
                                                onChange={(e) => { this.setState({ terminationDate: e.target.value }) }}
                                                style={{ background: '#383846', color: '#ffffff' }}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>

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
                                        onClick={this.save}
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


const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(RetirePart);
