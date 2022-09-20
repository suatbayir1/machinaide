// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import i18next from "i18next";

// Services
import UserService from 'src/users/services/UserService';

// Components
import {
    Form, Button, ButtonType, ComponentColor, Overlay, IconFont,
    Grid, Columns, Input, SelectDropdown,
} from '@influxdata/clockface'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import { roles } from "src/shared/constants/lists";
import {
    pleaseFillInTheFormCompletely,
    generalSuccessMessage,
    generalErrorMessage,
} from 'src/shared/copy/notifications'

interface OwnProps {
    visibleAddUserOverlay: boolean
    handleDismissAddUserOverlay: () => void
    getUsers: () => void
}

interface State {
    username: string
    role: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

class AddUserOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            username: "",
            role: "member"
        };
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    public handleClickAddUser = async () => {
        const { username, role } = this.state;
        const { notify } = this.props;

        if (username.trim() === "" || role.trim() === "") {
            notify(pleaseFillInTheFormCompletely("Username, Role"));
            return;
        }

        const addUserToMongoPayload = {
            username,
            role
        }

        const addUserToMongoResult = await UserService.addUserToMongo(addUserToMongoPayload);

        console.log({ addUserToMongoResult })

        if (addUserToMongoResult.data.summary.code === 200) {
            notify(generalSuccessMessage(i18next.t('message.user_create_success')));
            this.props.getUsers();
            this.props.handleDismissAddUserOverlay();
        } else {
            notify(generalErrorMessage(i18next.t('message.user_create_fail')));
        }
    }

    render() {
        const { username, role } = this.state;

        return (
            <>
                <Overlay visible={this.props.visibleAddUserOverlay}>
                    <Overlay.Container maxWidth={400}>
                        <Overlay.Header
                            title={i18next.t('headers.add_user')}
                            onDismiss={this.props.handleDismissAddUserOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Form.Element label={i18next.t('form.username')}>
                                            <Input
                                                name="username"
                                                placeholder={i18next.t('form.username')}
                                                onChange={this.handleChangeInput}
                                                value={username}
                                            />
                                        </Form.Element>
                                    </Grid.Column>

                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Form.Element label={i18next.t('form.role')}>
                                            <SelectDropdown
                                                options={roles}
                                                selectedOption={role}
                                                onSelect={(e) => this.setState({ role: e })}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>


                                <Form.Footer>
                                    <Button
                                        text={i18next.t('button.cancel')}
                                        icon={IconFont.Remove}
                                        onClick={this.props.handleDismissAddUserOverlay}
                                        color={ComponentColor.Danger}
                                    />

                                    <Button
                                        text={i18next.t('button.save')}
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                        onClick={this.handleClickAddUser}
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

export default connector(AddUserOverlay);