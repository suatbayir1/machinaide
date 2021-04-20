import React, { Component, createRef } from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { connect, ConnectedProps } from 'react-redux'
import UserService from 'src/users/services/UserService';
import MemberService from 'src/members/services/MemberService';
import OrganizationService from 'src/organizations/services/OrganizationService';
import AddUserOverlay from 'src/users/components/AddUserOverlay';
import ImportUserFile from 'src/users/components/ImportUserFile';
import { getAll } from 'src/resources/selectors'

// Components
import { dataToCSV, dataToXLSX } from 'src/shared/parsing/dataToCsv';
import download from 'src/external/download.js';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import { Link } from "react-router-dom"
import HomeIcon from '@material-ui/icons/Home';
import {
    Page,
    Grid,
    IconFont,
    ComponentColor,
    ComponentSize,
    Button,
    ButtonType,
    Table,
    DapperScrollbars,
    BorderType,
    Popover,
    Appearance,
    PopoverPosition,
    PopoverInteraction,
    Columns,
    FlexBox,
    Notification,
    Gradients,
    ConfirmationButton,
    Input,
    MultiSelectDropdown,
    Dropdown,
    SlideToggle,
    SpinnerContainer,
    TechnoSpinner,
    RemoteDataState,
    SelectDropdown,
} from '@influxdata/clockface'

// Utils
import { pageTitleSuffixer } from 'src/shared/utils/pageTitles'
import { getByID } from 'src/resources/selectors'

// Types
import { AppState, Organization, ResourceType } from 'src/types'

type ReduxProps = ConnectedProps<typeof connector>
type RouterProps = RouteComponentProps<{ orgID: string }>
type Props = RouterProps & ReduxProps

interface State {
    userList: object[]
    visibleAddUserOverlay: boolean
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    filterUsername: string
    filterRole: string[]
    filterStatus: string[]
    filteredUserList: object[]
    visibleImportFileOverlay: boolean
    roleList: string[]
    spinnerLoading: RemoteDataState
    isLoading: boolean
}

class UsersIndex extends Component<Props, State> {
    private importButtonRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props)

        this.state = {
            userList: [],
            visibleAddUserOverlay: false,
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            filterUsername: '',
            filterRole: ["member", "editor", "viewer", "admin"],
            filterStatus: ["active", "inactive"],
            filteredUserList: [],
            visibleImportFileOverlay: false,
            roleList: ["member", "editor", "admin", "viewer"],
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
        }
    }

    async componentDidMount() {
        await this.getUsers();
        this.setState({
            isLoading: true,
            spinnerLoading: RemoteDataState.Done,
        });
    }

    getUsers = async () => {
        const userList = await UserService.getUsersFromMongo();

        console.log("userList", userList);

        this.setState({
            userList,
            filteredUserList: userList,
        })
    }

    deleteUser = async (row) => {
        console.log(row);
        const deleteResult = await UserService.deleteUser(row["userID"]);

        const payload = {
            "userID": row["_id"]["$oid"]
        }

        const deleteFromMongoResult = await UserService.deleteUserFromMongo(payload);

        if (deleteResult.status === 204 && deleteFromMongoResult.data.summary.code === 200) {
            this.handleChangeNotification("success", "User deleted successfully");
        }
        this.getUsers();
    }

    handleDismissAddUserOverlay = () => {
        this.setState({ visibleAddUserOverlay: false })
    }

    handleChangeNotification = (notificationType, notificationMessage) => {
        this.setState({
            notificationVisible: true,
            notificationType,
            notificationMessage,
        })
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    handleChangeDropdownRole = (option: string) => {
        const { filterRole } = this.state
        const optionExists = filterRole.find(opt => opt === option)
        let updatedOptions = filterRole

        if (optionExists) {
            updatedOptions = filterRole.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filterRole, option]
        }

        this.setState({ filterRole: updatedOptions }, () => this.handleFilterData())
    }

    handleChangeDropdownStatus = (option: string) => {
        const { filterStatus } = this.state
        const optionExists = filterStatus.find(opt => opt === option)
        let updatedOptions = filterStatus

        if (optionExists) {
            updatedOptions = filterStatus.filter(fo => fo !== option)
        } else {
            updatedOptions = [...filterStatus, option]
        }

        this.setState({ filterStatus: updatedOptions }, () => this.handleFilterData())
    }

    handleFilterData = () => {
        let filteredData = [];

        this.state.userList.map(row => {
            if (row["username"].toLowerCase().includes(this.state.filterUsername)
                && this.state.filterRole.includes(row["role"])
                && this.state.filterStatus.includes(row["status"])
            ) {
                filteredData.push(row);
            }
        })

        this.setState({
            filteredUserList: filteredData
        })
    }

    handleChangeExportType = (exportType) => {
        if (exportType === "csv") {
            this.createCSV();
        } else if (exportType === "xlsx") {
            this.createXLSX();
        }
    }

    createCSV = () => {
        const { filteredUserList } = this.state;
        let now = new Date().toISOString();
        let headers = ["Username,Role,Status"];

        let data = filteredUserList.map(item => {
            return [item['username'], item['role'], item["status"]];
        });

        let csv = dataToCSV([headers, ...data]);

        try {
            download(csv, `users-${now}.csv`, 'text/plain')
        } catch (error) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: error,
            });
        }
    }

    createXLSX = () => {
        const { filteredUserList } = this.state;
        let now = new Date().toISOString();
        let headers = ["Username,Role,Status"];

        let data = filteredUserList.map(item => {
            return [item['username'], item['role'], item["status"]];
        })

        let xlsx = dataToXLSX([headers, ...data]);

        try {
            download(xlsx, `users-${now}.xlsx`, 'text/plain')
        } catch (error) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: error,
            });
        }
    }

    handleCloseImportDataForm = () => {
        this.setState({ visibleImportFileOverlay: false });
    }

    changeUserStatus = async (user) => {
        const payload = {
            "oid": user["_id"]["$oid"],
            "status": user.status === "active" ? "inactive" : "active"
        }

        await UserService.updateUser(payload, user["userID"]);

        const mongoResult = await UserService.updateUserFromMongo(payload);

        if (mongoResult.data.summary.code === 200) {
            this.handleChangeNotification("success", `The ${user["username"]} status was changed`);
            this.getUsers();
        } else {
            this.handleChangeNotification("error", `An error occurred while status changing`);
        }
    }

    changeUserRole = async (user, e) => {
        const payload = {
            "oid": user["_id"]["$oid"],
            "role": e
        }

        const mongoResult = await UserService.updateUserFromMongo(payload);

        if (mongoResult.data.summary.code === 200) {
            this.handleChangeNotification("success", `The ${user["username"]} role was changed`);
            this.getUsers();
        } else {
            this.handleChangeNotification("error", `An error occurred while role changing`);
        }
    }

    addUserToOrganization = async (user, org) => {
        const payload = {
            "oid": user["_id"]["$oid"],
            "organizations": user["organizations"] === undefined ? [org] : [...user["organizations"], org]
        }

        const mongoResult = await UserService.updateUserFromMongo(payload);

        if (mongoResult.data.summary.code === 200) {
            const memberToOrgPayload = {
                "id": user["userID"] === undefined ? "" : user["userID"],
                "name": user["username"]
            }

            await MemberService.addMemberToOrganization(memberToOrgPayload, org["id"]);

            this.handleChangeNotification("success", "User successfully added to the organization");
            this.getUsers();
        } else {
            this.handleChangeNotification("error", mongoResult.data.summary.text)
        }
    }

    deleteUserFromOrganization = async (user, org) => {
        const owners = await OrganizationService.getAllOwnersFromOrganization(org["id"]);
        const isOwner = owners.users.find(u => u.name == user.username);

        if (isOwner !== undefined) {
            await OrganizationService.removeOwnerOfAnOrganization(org["id"], isOwner["id"]);
        }

        const payload = {
            "oid": user["_id"]["$oid"],
            "organizations": user["organizations"].filter(obj => { return obj !== org })
        }

        const mongoResult = await UserService.updateUserFromMongo(payload);

        if (mongoResult.data.summary.code === 200) {
            await MemberService.removeMemberFromOrganization(org["id"], user["userID"])

            this.handleChangeNotification("success", "User successfully deleted from organization");
            this.getUsers();
        } else {
            this.handleChangeNotification("error", mongoResult.data.summary.text)
        }
    }

    public render() {
        const { children } = this.props

        return (
            <>
                <Notification
                    key={"id"}
                    id={"id"}
                    icon={
                        this.state.notificationType === 'success'
                            ? IconFont.Checkmark
                            : IconFont.Alerts
                    }
                    duration={5000}
                    size={ComponentSize.Small}
                    visible={this.state.notificationVisible}
                    gradient={
                        this.state.notificationType === 'success'
                            ? Gradients.HotelBreakfast
                            : Gradients.DangerDark
                    }
                    onTimeout={() => this.setState({ notificationVisible: false })}
                    onDismiss={() => this.setState({ notificationVisible: false })}
                >
                    <span className="notification--message">{this.state.notificationMessage}</span>
                </Notification>

                {
                    <SpinnerContainer
                        loading={this.state.spinnerLoading}
                        spinnerComponent={<TechnoSpinner />}
                    >
                    </SpinnerContainer>
                }

                {
                    this.state.isLoading && <Page titleTag={pageTitleSuffixer(['Members', 'Organization'])}>
                        <Page.Header fullWidth={true} testID="member-page--header">
                            <Page.Title title="User Management Page" />
                        </Page.Header>

                        <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                            <Link color="inherit" to="/">
                                <HomeIcon style={{ marginTop: '4px' }} />
                            </Link>
                            <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Users</Typography>
                        </Breadcrumbs>

                        <Page.Contents fullWidth={false} scrollable={true}>
                            <Grid style={{ marginBottom: '100px', background: '#292933', padding: '20px' }}>
                                <Grid.Row style={{ marginBottom: '20px' }}>
                                    <Grid.Column widthXS={Columns.Two}>
                                        <Input
                                            icon={IconFont.Search}
                                            name="filterUsername"
                                            placeholder="Filter by username"
                                            value={this.state.filterUsername}
                                            onChange={(e) => { this.setState({ filterUsername: e.target.value }, () => { this.handleFilterData() }) }}
                                        />
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Two}>
                                        <MultiSelectDropdown
                                            emptyText={"Select role"}
                                            options={this.state.roleList}
                                            selectedOptions={this.state.filterRole}
                                            onSelect={this.handleChangeDropdownRole}
                                        />
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Two}>
                                        <MultiSelectDropdown
                                            emptyText={"Select status"}
                                            options={["active", "inactive"]}
                                            selectedOptions={this.state.filterStatus}
                                            onSelect={this.handleChangeDropdownStatus}
                                        />
                                    </Grid.Column>
                                </Grid.Row>


                                <Grid.Row>
                                    <DapperScrollbars
                                        autoHide={false}
                                        autoSizeHeight={true}
                                        style={{ maxHeight: '400px' }}
                                        className="data-loading--scroll-content"
                                    >
                                        <Table
                                            borders={BorderType.Vertical}
                                            fontSize={ComponentSize.ExtraSmall}
                                            cellPadding={ComponentSize.ExtraSmall}
                                        >
                                            <Table.Header>
                                                <Table.Row>
                                                    <Table.HeaderCell style={{ width: "200px" }}>Username</Table.HeaderCell>
                                                    <Table.HeaderCell style={{ width: "200px" }}>Production Lines</Table.HeaderCell>
                                                    <Table.HeaderCell style={{ width: "250px" }}>Role</Table.HeaderCell>
                                                    <Table.HeaderCell style={{ width: "200px" }}>Active</Table.HeaderCell>
                                                    <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell>
                                                </Table.Row>
                                            </Table.Header>
                                            <Table.Body>
                                                {
                                                    this.state.filteredUserList.map(row => {
                                                        if (row["organizations"] === undefined) {
                                                            row["organizations"] = []
                                                        }

                                                        return (
                                                            <Table.Row key={row["_id"]["$oid"]}>
                                                                <Table.Cell>{row["username"]}</Table.Cell>
                                                                <Table.Cell>
                                                                    <React.Fragment>

                                                                        {
                                                                            row["organizations"] !== undefined && row["organizations"].length > 0 && row["organizations"].map(org => {
                                                                                return (
                                                                                    <ConfirmationButton
                                                                                        key={org["id"]}
                                                                                        icon={IconFont.Remove}
                                                                                        onConfirm={() => { this.deleteUserFromOrganization(row, org) }}
                                                                                        text={org["name"]}
                                                                                        size={ComponentSize.ExtraSmall}
                                                                                        popoverColor={ComponentColor.Danger}
                                                                                        popoverAppearance={Appearance.Outline}
                                                                                        color={ComponentColor.Primary}
                                                                                        confirmationLabel="Do you want to delete ?"
                                                                                        confirmationButtonColor={ComponentColor.Danger}
                                                                                        confirmationButtonText="Yes"
                                                                                        style={{ margin: '0px 5px 5px 0px' }}
                                                                                    />
                                                                                )
                                                                            })
                                                                        }

                                                                        {
                                                                            this.props.orgs.length !== row["organizations"].length &&
                                                                            <Dropdown
                                                                                key={row["_id"]["$oid"]}
                                                                                button={(active, onClick) => (
                                                                                    <Dropdown.Button
                                                                                        active={active}
                                                                                        onClick={onClick}
                                                                                        color={ComponentColor.Success}
                                                                                        icon={IconFont.Plus}
                                                                                        size={ComponentSize.ExtraSmall}
                                                                                        style={{ width: '40px' }}
                                                                                    >
                                                                                        {/* {""} */}
                                                                                    </Dropdown.Button>
                                                                                )}
                                                                                menu={onCollapse => (
                                                                                    <Dropdown.Menu
                                                                                        onCollapse={onCollapse}
                                                                                        style={{ width: '200px' }}
                                                                                        key={row["_id"]["$oid"]}
                                                                                    >
                                                                                        {
                                                                                            this.props.orgs.map(item => {
                                                                                                let exist = false;
                                                                                                row["organizations"].map(userOrg => {
                                                                                                    if (userOrg["id"] === item["id"]) {
                                                                                                        exist = true;
                                                                                                    }
                                                                                                })

                                                                                                if (!exist) {
                                                                                                    return (
                                                                                                        <Dropdown.Item
                                                                                                            testID="dropdown-item generate-token--read-write"
                                                                                                            id={item['id']}
                                                                                                            key={item['id']}
                                                                                                            value={item}
                                                                                                            onClick={(e) => this.addUserToOrganization(row, e)}
                                                                                                        >
                                                                                                            {item['name']}
                                                                                                        </Dropdown.Item>
                                                                                                    )
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    </Dropdown.Menu>
                                                                                )}
                                                                            />
                                                                        }
                                                                    </React.Fragment>
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <SelectDropdown
                                                                        style={{ width: '200px' }}
                                                                        options={this.state.roleList}
                                                                        selectedOption={row["role"]}
                                                                        onSelect={(e) => this.changeUserRole(row, e)}
                                                                    />
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <SlideToggle
                                                                        active={row["status"] === "active" ? true : false}
                                                                        size={ComponentSize.Small}
                                                                        color={ComponentColor.Success}
                                                                        onChange={() => { this.changeUserStatus(row) }}
                                                                        style={{ marginTop: '10px' }}
                                                                    />
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <FlexBox margin={ComponentSize.Medium} >
                                                                        <ConfirmationButton
                                                                            icon={IconFont.Remove}
                                                                            onConfirm={() => { this.deleteUser(row) }}
                                                                            text={"Delete"}
                                                                            size={ComponentSize.ExtraSmall}
                                                                            popoverColor={ComponentColor.Danger}
                                                                            popoverAppearance={Appearance.Outline}
                                                                            color={ComponentColor.Danger}
                                                                            confirmationLabel="Do you want to delete ?"
                                                                            confirmationButtonColor={ComponentColor.Danger}
                                                                            confirmationButtonText="Yes"
                                                                        />
                                                                    </FlexBox>
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        )
                                                    })
                                                }
                                            </Table.Body>
                                        </Table>
                                    </DapperScrollbars>
                                </Grid.Row>

                                <Grid.Row style={{ marginTop: '50px' }}>
                                    <div style={{ float: 'right' }}>
                                        <FlexBox margin={ComponentSize.Small}>
                                            <Dropdown
                                                style={{ width: '110px' }}
                                                button={(active, onClick) => (
                                                    <Dropdown.Button
                                                        active={active}
                                                        onClick={onClick}
                                                        color={ComponentColor.Danger}
                                                        icon={IconFont.Export}
                                                        testID="dropdown-button--gen-token"
                                                    >
                                                        {'Export'}
                                                    </Dropdown.Button>
                                                )}
                                                menu={onCollapse => (
                                                    <Dropdown.Menu onCollapse={onCollapse}>
                                                        <Dropdown.Item
                                                            testID="dropdown-item generate-token--read-write"
                                                            id={'csv'}
                                                            key={'csv'}
                                                            value={'csv'}
                                                            onClick={this.handleChangeExportType}
                                                        >
                                                            {'csv'}
                                                        </Dropdown.Item>
                                                        <Dropdown.Item
                                                            testID="dropdown-item generate-token--read-write"
                                                            id={'xlsx'}
                                                            key={'xlsx'}
                                                            value={'xlsx'}
                                                            onClick={this.handleChangeExportType}
                                                        >
                                                            {'xlsx'}
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                )}
                                            />
                                            <Popover
                                                triggerRef={this.importButtonRef}
                                                appearance={Appearance.Outline}
                                                position={PopoverPosition.Below}
                                                showEvent={PopoverInteraction.Hover}
                                                hideEvent={PopoverInteraction.Hover}
                                                distanceFromTrigger={8}
                                                enableDefaultStyles={false}
                                                contents={() => (
                                                    <p>Import in this order: username, password</p>
                                                )}
                                            />
                                            <Button
                                                ref={this.importButtonRef}
                                                text="Import"
                                                type={ButtonType.Button}
                                                icon={IconFont.Import}
                                                color={ComponentColor.Success}
                                                onClick={() => this.setState({ visibleImportFileOverlay: true })}
                                                style={{ width: '110px' }}
                                            />
                                            <Button
                                                text="Add User"
                                                type={ButtonType.Button}
                                                icon={IconFont.Plus}
                                                color={ComponentColor.Primary}
                                                style={{ width: '110px' }}
                                                onClick={() => { this.setState({ visibleAddUserOverlay: true }) }}
                                            />
                                        </FlexBox>
                                    </div>
                                </Grid.Row>
                            </Grid>
                        </Page.Contents>
                    </Page>
                }

                {children}

                <AddUserOverlay
                    visibleAddUserOverlay={this.state.visibleAddUserOverlay}
                    handleDismissAddUserOverlay={this.handleDismissAddUserOverlay}
                    handleChangeNotification={this.handleChangeNotification}
                    getUsers={this.getUsers}
                />

                <ImportUserFile
                    overlay={this.state.visibleImportFileOverlay}
                    onClose={this.handleCloseImportDataForm}
                    getUsers={this.getUsers}
                    setNotificationData={this.handleChangeNotification}
                    fileTypesToAccept=".csv, .xlsx"
                    orgID={this.props["match"].params["orgID"]}
                />
            </>
        )
    }
}

const mstp = (state: AppState, props: RouterProps) => {
    const org = getByID<Organization>(
        state,
        ResourceType.Orgs,
        props.match.params.orgID
    )
    const orgs = getAll<Organization>(state, ResourceType.Orgs)

    return {
        org,
        orgs,
    }
}

const connector = connect(mstp)

export default connector(withRouter(UsersIndex))