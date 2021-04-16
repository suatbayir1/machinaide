import React, { PureComponent } from 'react'
import MemberService from 'src/members/services/MemberService';
import UserService from 'src/users/services/UserService';
import OrganizationService from 'src/organizations/services/OrganizationService';
import {
    Form,
    Button,
    ButtonType,
    ComponentColor,
    Overlay,
    IconFont,
    Grid,
    Columns,
    Dropdown,
} from '@influxdata/clockface'

interface Props {
    visibleAddMemberOverlay: boolean
    handleDismissAddMemberOverlay: () => void
    orgID: string
    getMembers: () => void
    handleChangeNotification: (type, message) => void
}

interface State {
    selectedUser: object
    userList: object[]
    currentOrg: object
}

class AddMemberOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            selectedUser: {},
            userList: [],
            currentOrg: {},
        };
    }

    async componentDidMount() {
        await this.getUserList();
        await this.getOrg();
    }

    getUserList = async () => {
        const userList = await UserService.getUsers();
        this.setState({
            userList: userList["users"]
        })
    }

    getOrg = async () => {
        const org = await OrganizationService.getOrg(this.props.orgID);
        this.setState({
            currentOrg: org
        })
    }

    handleChangeSelectedPart = (e) => {
        this.setState({ selectedUser: e });
    }

    handleClickAddMember = async () => {
        if (this.state.selectedUser && Object.keys(this.state.selectedUser).length === 0) {
            this.props.handleChangeNotification("error", "Please first select a user");
            return;
        }

        const payload = {
            "id": this.state.selectedUser["id"],
            "name": this.state.selectedUser["name"]
        }

        const result = await MemberService.addMemberToOrganization(payload, this.props.orgID);

        if (result["code"] === "internal error") {
            this.props.handleChangeNotification("error", "This user already a member of this production line");
            return;
        }

        const mongoPayload = {
            "name": this.state.selectedUser["name"],
            "org": this.state.currentOrg
        }

        const mongoResult = await MemberService.addMemberToOrganizationMongo(mongoPayload);

        console.log(mongoResult);

        this.props.handleChangeNotification("success", "User successfully added to the production line");
        this.props.getMembers();
        this.props.handleDismissAddMemberOverlay();
    }

    render() {
        return (
            <>
                <Overlay visible={this.props.visibleAddMemberOverlay}>
                    <Overlay.Container maxWidth={400}>
                        <Overlay.Header
                            title={"Add Member"}
                            onDismiss={this.props.handleDismissAddMemberOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Form.Element label="Select User">
                                            <Dropdown
                                                button={(active, onClick) => (
                                                    <Dropdown.Button
                                                        active={active}
                                                        onClick={onClick}
                                                        color={ComponentColor.Default}
                                                    >
                                                        {this.state.selectedUser['name']}
                                                    </Dropdown.Button>
                                                )}
                                                menu={onCollapse => (
                                                    <Dropdown.Menu onCollapse={onCollapse}>
                                                        {
                                                            this.state.userList.map(item => {
                                                                return (
                                                                    <Dropdown.Item
                                                                        id={item['id']}
                                                                        key={item['id']}
                                                                        value={item}
                                                                        onClick={this.handleChangeSelectedPart}
                                                                    >
                                                                        {item['name']}
                                                                    </Dropdown.Item>
                                                                )
                                                            })
                                                        }
                                                    </Dropdown.Menu>
                                                )}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>

                                <Form.Footer>
                                    <Button
                                        text="Cancel"
                                        icon={IconFont.Remove}
                                        onClick={this.props.handleDismissAddMemberOverlay}
                                        color={ComponentColor.Danger}
                                    />

                                    <Button
                                        text="Save"
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                        onClick={this.handleClickAddMember}
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

export default AddMemberOverlay;