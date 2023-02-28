// Libraries
import React, { Component } from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { connect, ConnectedProps } from 'react-redux'
import { Link } from "react-router-dom"
import i18next from "i18next"

// Services
import UserService from 'src/users/services/UserService';
import OrganizationService from 'src/organizations/services/OrganizationService';

// Helpers
import { getAll } from 'src/resources/selectors'
import { dataToCSV, dataToXLSX } from 'src/shared/parsing/dataToCsv';
import download from 'src/external/download.js';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Components
import AddUserOverlay from 'src/users/components/AddUserOverlay';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import {
    Page, Grid, IconFont, ComponentColor, ComponentSize, Button, ButtonType,
    Table, DapperScrollbars, BorderType, Appearance,
    Columns, FlexBox, ConfirmationButton,
    Input, MultiSelectDropdown, Dropdown, SlideToggle, SpinnerContainer, TechnoSpinner,
    RemoteDataState, SelectDropdown, Form,
} from '@influxdata/clockface'

// Utils
import { pageTitleSuffixer } from 'src/shared/utils/pageTitles'
import { getByID } from 'src/resources/selectors'

// Types
import { AppState, Organization, ResourceType } from 'src/types'

// Constants
import {
    generalSuccessMessage,
    generalErrorMessage,
} from 'src/shared/copy/notifications'
import { roles } from "src/shared/constants/lists";

type ReduxProps = ConnectedProps<typeof connector>
type RouterProps = RouteComponentProps<{ orgID: string }>
type Props = RouterProps & ReduxProps

interface State {
    userList: object[]
    visibleAddUserOverlay: boolean
    filterUsername: string
    filterRole: string[]
    filterStatus: string[]
    filteredUserList: object[]
    spinnerLoading: RemoteDataState
    isLoading: boolean
}

class UsersIndex extends Component<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            userList: [],
            visibleAddUserOverlay: false,
            filterUsername: '',
            filterRole: ["member", "editor", "admin"],
            filterStatus: ["active", "inactive"],
            filteredUserList: [],
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

    public getUsers = async () => {
        const userList = await UserService.getUsersFromMongo();

        this.setState({
            userList,
            filteredUserList: userList,
        })
    }

    private deleteUser = async (row) => {
        const { notify } = this.props;

        const payload = {
            "userID": row["_id"]["$oid"]
        }

        const deleteFromMongoResult = await UserService.deleteUserFromMongo(payload);

        if (deleteFromMongoResult.data.summary.code === 200) {
            notify(generalSuccessMessage(i18next.t('message.user_delete_success')));
            this.getUsers();
        } else {
            notify(generalErrorMessage(i18next.t('message.user_delete_fail')));
        }
    }

    handleDismissAddUserOverlay = () => {
        this.setState({ visibleAddUserOverlay: false })
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
        }
    }

    public changeUserStatus = async (user) => {
        const { notify } = this.props;

        const payload = {
            "oid": user["_id"]["$oid"],
            "status": user.status === "active" ? "inactive" : "active"
        }

        const mongoResult = await UserService.updateUserFromMongo(payload);

        if (mongoResult.data.summary.code === 200) {
            notify(generalSuccessMessage(i18next.t('message.user_status_change_success')));
            this.getUsers();
        } else {
            notify(generalErrorMessage(i18next.t('message.user_status_change_fail')));
        }
    }

    public changeUserRole = async (user, e) => {
        const { notify } = this.props;

        const payload = {
            "oid": user["_id"]["$oid"],
            "role": e
        }

        const mongoResult = await UserService.updateUserFromMongo(payload);

        if (mongoResult.data.summary.code === 200) {
            notify(generalSuccessMessage(i18next.t('message.user_role_change_success')));
            this.getUsers();
        } else {
            notify(generalErrorMessage(i18next.t('message.user_role_change_fail')));
        }
    }

    public addUserToOrganization = async (user, org) => {
        const { notify } = this.props;

        const payload = {
            "oid": user["_id"]["$oid"],
            "organizations": user["organizations"] === undefined ? [org] : [...user["organizations"], org]
        }

        const mongoResult = await UserService.updateUserFromMongo(payload);

        if (mongoResult.data.summary.code === 200) {
            notify(generalSuccessMessage(i18next.t('message.user_add_to_org_success')));
            this.getUsers();
        } else {
            notify(generalErrorMessage(i18next.t('message.user_add_to_org_fail')));
        }
    }

    public deleteUserFromOrganization = async (user, org) => {
        const { notify } = this.props;

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
            notify(generalSuccessMessage(i18next.t('message.user_delete_from_org_success')));
            this.getUsers();
        } else {
            notify(generalErrorMessage(i18next.t('message.user_delete_from_org_fail')));
        }
    }

    public render() {
        const { children } = this.props

        return (
            <>
                {
                    <SpinnerContainer
                        loading={this.state.spinnerLoading}
                        spinnerComponent={<TechnoSpinner />}
                    >
                    </SpinnerContainer>
                }

                {
                    this.state.isLoading &&
                    <Page titleTag={pageTitleSuffixer(['Users', 'Organization'])} className="users-page-display">
                        <Page.Header fullWidth={true}>
                            <Page.Title title={i18next.t('headers.user_management_page')} />
                        </Page.Header>

                        <Breadcrumbs
                            separator="/"
                            aria-label="breadcrumb"
                            style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}
                        >
                            <Link color="inherit" to="/">
                                <HomeIcon style={{ marginTop: '4px' }} />
                            </Link>
                            <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>{i18next.t('pages.users')}</Typography>
                        </Breadcrumbs>

                        <Page.Contents fullWidth={false} scrollable={true}>
                            <Grid style={{ marginBottom: '100px', background: '#292933', padding: '20px' }}>
                                <Grid.Row style={{ marginBottom: '20px' }}>
                                    <Grid.Column
                                        widthXS={Columns.Twelve}
                                        widthSM={Columns.Four}
                                        widthMD={Columns.Three}
                                        widthLG={Columns.Two}
                                    >
                                        <Form.Element label={i18next.t('form.username')}>
                                            <Input
                                                icon={IconFont.Search}
                                                name="filterUsername"
                                                value={this.state.filterUsername}
                                                onChange={(e) => { this.setState({ filterUsername: e.target.value }, () => { this.handleFilterData() }) }}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column
                                        widthXS={Columns.Twelve}
                                        widthSM={Columns.Four}
                                        widthMD={Columns.Three}
                                        widthLG={Columns.Two}
                                    >
                                        <Form.Element label={i18next.t('form.role')}>
                                            <MultiSelectDropdown
                                                emptyText={i18next.t('form.select_role')}
                                                options={roles}
                                                selectedOptions={this.state.filterRole}
                                                onSelect={this.handleChangeDropdownRole}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column
                                        widthXS={Columns.Twelve}
                                        widthSM={Columns.Four}
                                        widthMD={Columns.Three}
                                        widthLG={Columns.Two}
                                    >
                                        <Form.Element label={i18next.t('dt.status')}>
                                            <MultiSelectDropdown
                                                emptyText={i18next.t('form.select_status')}
                                                options={["active", "inactive"]}
                                                selectedOptions={this.state.filterStatus}
                                                onSelect={this.handleChangeDropdownStatus}
                                            />
                                        </Form.Element>
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
                                                    <Table.HeaderCell style={{ width: "200px" }}>{i18next.t('form.username')}</Table.HeaderCell>
                                                    <Table.HeaderCell style={{ width: "200px" }}>{i18next.t('dt.production_lines')}</Table.HeaderCell>
                                                    <Table.HeaderCell style={{ width: "250px" }}>{i18next.t('form.role')}</Table.HeaderCell>
                                                    <Table.HeaderCell style={{ width: "200px" }}>{i18next.t('dt.status')}</Table.HeaderCell>
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
                                                                                        confirmationLabel={i18next.t('warning.do_you_want_to_delete')}
                                                                                        confirmationButtonColor={ComponentColor.Danger}
                                                                                        confirmationButtonText={i18next.t('button.yes')}
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
                                                                        options={roles}
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
                                                                            text={i18next.t('button.delete')}
                                                                            size={ComponentSize.ExtraSmall}
                                                                            popoverColor={ComponentColor.Danger}
                                                                            popoverAppearance={Appearance.Outline}
                                                                            color={ComponentColor.Danger}
                                                                            confirmationLabel={i18next.t('warning.do_you_want_to_delete')}
                                                                            confirmationButtonColor={ComponentColor.Danger}
                                                                            confirmationButtonText={i18next.t('button.yes')}
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
                                    <div className="users-table-bottom-buttons-container">
                                        <FlexBox margin={ComponentSize.Small} className="users-table-bottom-buttons">
                                            <Dropdown
                                                style={{ width: '130px' }}
                                                button={(active, onClick) => (
                                                    <Dropdown.Button
                                                        active={active}
                                                        onClick={onClick}
                                                        color={ComponentColor.Danger}
                                                        icon={IconFont.Export}
                                                    >
                                                        {i18next.t('button.export')}
                                                    </Dropdown.Button>
                                                )}
                                                menu={onCollapse => (
                                                    <Dropdown.Menu onCollapse={onCollapse}>
                                                        <Dropdown.Item
                                                            id={'csv'}
                                                            key={'csv'}
                                                            value={'csv'}
                                                            onClick={this.handleChangeExportType}
                                                        >
                                                            {'csv'}
                                                        </Dropdown.Item>
                                                        <Dropdown.Item
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
                                            <Button
                                                text={i18next.t('button.add_user')}
                                                type={ButtonType.Button}
                                                icon={IconFont.Plus}
                                                color={ComponentColor.Primary}
                                                style={{ width: '130px' }}
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
                    getUsers={this.getUsers}
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

const mdtp = {
    notify: notifyAction,
}

const connector = connect(mstp, mdtp)

export default connector(withRouter(UsersIndex))