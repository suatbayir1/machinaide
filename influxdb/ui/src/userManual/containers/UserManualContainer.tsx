// Libraries
import React, { PureComponent } from "react";
import { Link } from "react-router-dom"

// Components
import {
    Page, SpinnerContainer, TechnoSpinner, RemoteDataState, Grid, Columns, IconFont,
} from '@influxdata/clockface'
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import HomeIcon from '@material-ui/icons/Home';
import RightSideBar from 'src/userManual/components/RightSideBar';
import MaintenancePageUserManual from 'src/userManual/components/MaintenancePageUserManual';
import FailurePageUserManual from 'src/userManual/components/FailurePageUserManual';

interface Props { }
interface State {
    spinnerLoading: RemoteDataState
    activePage: string
    activePageName: string
    linkList: object[]
    selectedLink: string
}

class UserManualContainer extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            spinnerLoading: RemoteDataState.Loading,
            activePage: 'maintenancePage',
            activePageName: 'Maintenance',
            linkList: [
                { id: 'maintenancePage', name: 'Maintenance', icon: IconFont.TextBlock },
                { id: 'failurePage', name: 'Failure', icon: IconFont.Capacitor },
                { id: 'deneme1', name: 'Deneme 1', icon: IconFont.Duplicate },
                { id: 'deneme2', name: 'Deneme 2', icon: IconFont.Erlenmeyer },
                { id: 'deneme3', name: 'Deneme 3', icon: IconFont.BarChart },
                { id: 'deneme4', name: 'Deneme 4', icon: IconFont.Bell },
            ],
            selectedLink: "Maintenance",
        };
    }

    componentDidMount() {
        this.setState({
            activePage: this.props["match"].params.page !== undefined ? this.props["match"].params.page : 'maintenancePage',
            spinnerLoading: RemoteDataState.Done,
        }, () => {
            for (let link of this.state.linkList) {
                if (link["id"] === this.state.activePage) {
                    console.log(link);
                    this.setState({ activePageName: link["name"], selectedLink: link["name"] })
                }
            }
        })
    }

    handleChangeListItem = (item) => {
        this.changeActivePage(item);
        this.setState({ selectedLink: item["name"] });
    }

    changeActivePage = (page) => {
        this.setState({
            activePage: page["id"],
            activePageName: page["name"],
        })
    }

    render() {
        return (
            <Page className="show-pc-or-tablet">
                {
                    <SpinnerContainer
                        loading={this.state.spinnerLoading}
                        spinnerComponent={<TechnoSpinner />}
                    >
                    </SpinnerContainer>
                }

                {
                    this.state.spinnerLoading === RemoteDataState.Done && (
                        <React.Fragment>
                            <Page.Header fullWidth={true}>
                                <Page.Title title={"User Manual"} />
                            </Page.Header>

                            <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                                <Link color="inherit" to="/">
                                    <HomeIcon style={{ marginTop: '4px' }} />
                                </Link>

                                {

                                    this.state.activePage === '' && <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>User Manual</Typography>
                                }


                                {
                                    this.state.activePageName !== '' &&
                                    <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/user-manual`}>
                                        User Manual
                                    </Link>
                                }

                                {
                                    this.state.activePageName !== '' &&
                                    <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>{this.state.activePageName}</Typography>
                                }

                            </Breadcrumbs>

                            <Page.Contents fullWidth={true} scrollable={true}>
                                <Grid.Column widthXS={Columns.Ten}>
                                    <Grid.Row>
                                        {this.state.activePage === "maintenancePage" && <MaintenancePageUserManual />}
                                        {this.state.activePage === "failurePage" && <FailurePageUserManual />}
                                    </Grid.Row>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Two}>
                                    <RightSideBar
                                        orgID={this.props["match"].params.orgID}
                                        changeActivePage={this.changeActivePage}
                                        linkList={this.state.linkList}
                                        selectedLink={this.state.selectedLink}
                                        handleChangeListItem={this.handleChangeListItem}
                                    />
                                </Grid.Column>
                            </Page.Contents>
                        </React.Fragment >
                    )
                }
            </Page>
        )
    }
}

export default UserManualContainer;