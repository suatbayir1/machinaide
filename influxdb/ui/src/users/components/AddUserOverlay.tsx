import React, { PureComponent } from 'react'
import MemberService from 'src/members/services/MemberService';
import UserService from 'src/users/services/UserService';
import {
    Form,
    Button,
    ButtonType,
    ComponentColor,
    Overlay,
    IconFont,
    Grid,
    Columns,
    Input,
    InputType,
} from '@influxdata/clockface'

interface Props {
    visibleAddUserOverlay: boolean
    handleDismissAddUserOverlay: () => void
    handleChangeNotification: (notificationType, notificationMessage) => void
    getUsers: () => void
}

interface State {
    selectedUser: object
    username: string
    password: string
    passwordAgain: string
}

class AddUserOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            selectedUser: {},
            username: "",
            password: "",
            passwordAgain: "",
        };
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    handleClickAddUser = async () => {
        if (this.state.username.trim() === "" || this.state.password.trim() === "" || this.state.passwordAgain.trim() === "") {
            this.props.handleChangeNotification("error", "Username and password cannot be empty");
            return;
        }

        if (this.state.password !== this.state.passwordAgain) {
            this.props.handleChangeNotification("error", "Password and password again do not match");
            return;
        }

        const addUserPayload = {
            "name": this.state.username,
            "status": "active"
        }

        const addResult = await UserService.addUser(addUserPayload);

        if (addResult["code"] === "conflict") {
            this.props.handleChangeNotification("error", "This username already exists");
            return;
        }

        const updatePasswordPayload = {
            "password": this.state.password
        }

        const updateResult = await UserService.updatePassword(updatePasswordPayload, addResult["id"]);

        if (updateResult === 204) {
            const addUserToMongoPayload = {
                "username": this.state.username,
                "password": this.state.password,
                "role": "member",
                "userID": addResult["id"],
                "status": "active",
            }

            const addUserToMongoResult = await UserService.addUserToMongo(addUserToMongoPayload);

            if (addUserToMongoResult.data.summary.code === 200) {
                this.props.handleChangeNotification("success", "User created successfully");
                this.props.getUsers();
                this.props.handleDismissAddUserOverlay();
            } else {
                this.props.handleChangeNotification("error", "An error occurred while creating the user roles");
            }
        } else {
            this.props.handleChangeNotification("error", "An error occurred while creating the user");
        }
    }

    render() {
        return (
            <>
                <Overlay visible={this.props.visibleAddUserOverlay}>
                    <Overlay.Container maxWidth={400}>
                        <Overlay.Header
                            title={"Add User"}
                            onDismiss={this.props.handleDismissAddUserOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Form.Element label="Username">
                                            <Input
                                                name="username"
                                                placeholder="Username"
                                                onChange={this.handleChangeInput}
                                                value={this.state.username}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>

                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Form.Element label="Password">
                                            <Input
                                                name="password"
                                                type={InputType.Password}
                                                placeholder="Password"
                                                onChange={this.handleChangeInput}
                                                value={this.state.password}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>

                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Form.Element label="Password (again)">
                                            <Input
                                                name="passwordAgain"
                                                type={InputType.Password}
                                                placeholder="Password again"
                                                onChange={this.handleChangeInput}
                                                value={this.state.passwordAgain}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>

                                <Form.Footer>
                                    <Button
                                        text="Cancel"
                                        icon={IconFont.Remove}
                                        onClick={this.props.handleDismissAddUserOverlay}
                                        color={ComponentColor.Danger}
                                    />

                                    <Button
                                        text="Save"
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

export default AddUserOverlay;