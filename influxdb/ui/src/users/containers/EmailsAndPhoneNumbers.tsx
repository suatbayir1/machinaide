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
import AddEmailOverlay from 'src/users/components/AddEmailOverlay';
import AddPhoneNumberOverlay from 'src/users/components/AddPhoneNumberOverlay';
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

type ReduxProps = ConnectedProps<typeof connector>
type RouterProps = RouteComponentProps<{ orgID: string }>
type Props = RouterProps & ReduxProps

interface State {
    emails: object[]
    phoneNumbers: object[]
    visibleAddEmailOverlay: boolean
    visibleAddPhoneNumberOverlay: boolean
    filterUsername: string
    filterRole: string[]
    filterStatus: string[]
    filteredUserList: object[]
    spinnerLoading: RemoteDataState
    isLoading: boolean
}

class EmailAndPhoneNumbers extends Component<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            emails: [],
            phoneNumbers: [],
            visibleAddEmailOverlay: false,
            visibleAddPhoneNumberOverlay: false,
            filterUsername: '',
            filterRole: ["member", "editor", "admin"],
            filterStatus: ["active", "inactive"],
            filteredUserList: [],
            spinnerLoading: RemoteDataState.Loading,
            isLoading: false,
        }
    }

    async componentDidMount() {
        await this.getEmails();
        await this.getPhoneNumbers();
        this.setState({
            isLoading: true,
            spinnerLoading: RemoteDataState.Done,
        });
    }

    public getEmails = async () => {
        const emails = await UserService.getEmails();

        this.setState({
            emails,
        })
    }

    public getPhoneNumbers = async () => {
        const phoneNumbers = await UserService.getPhoneNumbers();

        console.log("phone numbers", phoneNumbers)

        this.setState({
            phoneNumbers,
        })
    }

    handleDismissAddEmailOverlay = () => {
        this.setState({ visibleAddEmailOverlay: false })
    }

        handleDismissAddPhoneNumberOverlay = () => {
        this.setState({ visibleAddPhoneNumberOverlay: false })
    }

    public deleteEmail = async (row) => {
        const { notify } = this.props;

        const payload = {
            "oid": row["_id"]["$oid"],
        }

        const mongoResult = await UserService.deleteEmail(payload);

        if (mongoResult.data.summary.code === 200) {
            notify(generalSuccessMessage(mongoResult.data.message.text));
            this.getEmails();
        } else {
            notify(generalErrorMessage(mongoResult.data.message.text));
        }
    }

    public deletePhoneNumber = async (row) => {
        const { notify } = this.props;

        const payload = {
            "oid": row["_id"]["$oid"],
        }

        const mongoResult = await UserService.deletePhoneNumber(payload);

        if (mongoResult.data.summary.code === 200) {
            notify(generalSuccessMessage(mongoResult.data.message.text));
            this.getPhoneNumbers();
        } else {
            notify(generalErrorMessage(mongoResult.data.message.text));
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
                            <Page.Title title={"Emails & Phone Numbers"} />
                        </Page.Header>

                        <Breadcrumbs
                            separator="/"
                            aria-label="breadcrumb"
                            style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}
                        >
                            <Link color="inherit" to="/">
                                <HomeIcon style={{ marginTop: '4px' }} />
                            </Link>
                            <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>Emails & Phone Numbers</Typography>
                        </Breadcrumbs>
                        <Page.Contents fullWidth={false} scrollable={true}>
                            <Grid.Column widthMD={Columns.Six}>
                                <Grid style={{ marginBottom: '100px', background: '#292933', padding: '20px' }}>
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
                                                        <Table.HeaderCell style={{ width: "200px" }}>Email Address</Table.HeaderCell>
                                                        <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {
                                                        this.state.emails.map(row => {
                                                            return (
                                                                <Table.Row key={row["_id"]["$oid"]}>
                                                                    <Table.Cell>{row["email"]}</Table.Cell>
                                                                    <Table.Cell>
                                                                        <FlexBox margin={ComponentSize.Medium} >
                                                                            <ConfirmationButton
                                                                                icon={IconFont.Remove}
                                                                                onConfirm={() => { this.deleteEmail(row)}}
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
                                            <Button
                                                text={"Add Email"}
                                                type={ButtonType.Button}
                                                icon={IconFont.Plus}
                                                color={ComponentColor.Primary}
                                                style={{ width: '130px' }}
                                                onClick={() => { this.setState({ visibleAddEmailOverlay: true }) }}
                                            />
                                        </div>
                                    </Grid.Row>
                                </Grid>
                            </Grid.Column>
                            <Grid.Column widthMD={Columns.Six}>
                                <Grid style={{ marginBottom: '100px', background: '#292933', padding: '20px' }}>
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
                                                        <Table.HeaderCell style={{ width: "200px" }}>Phone Number</Table.HeaderCell>
                                                        <Table.HeaderCell style={{ width: "50px" }}></Table.HeaderCell>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {
                                                        this.state.phoneNumbers.map(row => {
                                                            return (
                                                                <Table.Row key={row["_id"]["$oid"]}>
                                                                    <Table.Cell>{row["phoneNumber"]}</Table.Cell>
                                                                    <Table.Cell>
                                                                        <FlexBox margin={ComponentSize.Medium} >
                                                                            <ConfirmationButton
                                                                                icon={IconFont.Remove}
                                                                                onConfirm={() => { this.deletePhoneNumber(row)}}
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
                                            <Button
                                                text={"Add Phone Number"}
                                                type={ButtonType.Button}
                                                icon={IconFont.Plus}
                                                color={ComponentColor.Primary}
                                                style={{ width: '160px' }}
                                                onClick={() => { this.setState({ visibleAddPhoneNumberOverlay: true }) }}
                                            />
                                        </div>
                                    </Grid.Row>
                                </Grid>
                            </Grid.Column>
                        </Page.Contents>
                    </Page>
                }

                {children}

                <AddEmailOverlay
                    visibleAddEmailOverlay={this.state.visibleAddEmailOverlay}
                    handleDismissAddEmailOverlay={this.handleDismissAddEmailOverlay}
                    getEmails={this.getEmails}
                />

                <AddPhoneNumberOverlay
                    visibleAddPhoneNumberOverlay={this.state.visibleAddPhoneNumberOverlay}
                    handleDismissAddPhoneNumberOverlay={this.handleDismissAddPhoneNumberOverlay}
                    getPhoneNumbers={this.getPhoneNumbers}
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

export default connector(withRouter(EmailAndPhoneNumbers))