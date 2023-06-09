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
    visibleAddPhoneNumberOverlay: boolean
    handleDismissAddPhoneNumberOverlay: () => void
    getPhoneNumbers: () => void
}

interface State {
    phoneNumber: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

class AddPhoneNumberOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            phoneNumber: "",
        };
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    public handleClickAddPhoneNumber = async () => {
        const { phoneNumber } = this.state;
        const { notify } = this.props;

        if (phoneNumber.trim() === "") {
            notify(pleaseFillInTheFormCompletely("Phone Number"));
            return;
        }

        const payload = {
            phoneNumber,
        }

        const addPhoneNumberResult = await UserService.addPhoneNumber(payload);

        console.log({ addPhoneNumberResult })

        if (addPhoneNumberResult.data.summary.code === 200) {
            notify(generalSuccessMessage(addPhoneNumberResult.data.message.text));
            this.props.getPhoneNumbers();
            this.props.handleDismissAddPhoneNumberOverlay();
        } else {
            notify(generalErrorMessage(addPhoneNumberResult.data.message.text));
        }
    }

    render() {
        const { phoneNumber} = this.state;

        return (
            <>
                <Overlay visible={this.props.visibleAddPhoneNumberOverlay}>
                    <Overlay.Container maxWidth={400}>
                        <Overlay.Header
                            title={"Add Phone Number"}
                            onDismiss={this.props.handleDismissAddPhoneNumberOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Form.Element label={"Phone Number"}>
                                            <Input
                                                name="phoneNumber"
                                                onChange={this.handleChangeInput}
                                                value={phoneNumber}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>


                                <Form.Footer>
                                    <Button
                                        text={i18next.t('button.cancel')}
                                        icon={IconFont.Remove}
                                        onClick={this.props.handleDismissAddPhoneNumberOverlay}
                                        color={ComponentColor.Danger}
                                    />

                                    <Button
                                        text={i18next.t('button.save')}
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                        onClick={this.handleClickAddPhoneNumber}
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

export default connector(AddPhoneNumberOverlay);