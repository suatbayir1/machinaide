// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import i18next from "i18next";

// Services
import UserService from 'src/users/services/UserService';

// Components
import {
    Form, Button, ButtonType, ComponentColor, Overlay, IconFont,
    Grid, Columns, Input, } from '@influxdata/clockface'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    pleaseFillInTheFormCompletely,
    generalSuccessMessage,
    generalErrorMessage,
} from 'src/shared/copy/notifications'

interface OwnProps {
    visibleAddEmailOverlay: boolean
    handleDismissAddEmailOverlay: () => void
    getEmails: () => void
}

interface State {
    email: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

class AddEmailOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            email: "",
        };
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    public handleClickAddEmail = async () => {
        console.log("test")

        const { email } = this.state;
        const { notify } = this.props;

        if (email.trim() === "") {
            notify(pleaseFillInTheFormCompletely("Email"));
            return;
        }

        const payload = {
            email,
        }

        const addEmailResult = await UserService.addEmail(payload);

        console.log({ addEmailResult })

        if (addEmailResult.data.summary.code === 200) {
            notify(generalSuccessMessage(addEmailResult.data.message.text));
            this.props.getEmails();
            this.props.handleDismissAddEmailOverlay();
        } else {
            notify(generalErrorMessage(addEmailResult.data.message.text));
        }
    }

    render() {
        const { email} = this.state;

        return (
            <>
                <Overlay visible={this.props.visibleAddEmailOverlay}>
                    <Overlay.Container maxWidth={400}>
                        <Overlay.Header
                            title={"Add Email"}
                            onDismiss={this.props.handleDismissAddEmailOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Form.Element label={"Email"}>
                                            <Input
                                                name="email"
                                                onChange={this.handleChangeInput}
                                                value={email}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>


                                <Form.Footer>
                                    <Button
                                        text={i18next.t('button.cancel')}
                                        icon={IconFont.Remove}
                                        onClick={this.props.handleDismissAddEmailOverlay}
                                        color={ComponentColor.Danger}
                                    />

                                    <Button
                                        text={i18next.t('button.save')}
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                        onClick={this.handleClickAddEmail}
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


const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(AddEmailOverlay);