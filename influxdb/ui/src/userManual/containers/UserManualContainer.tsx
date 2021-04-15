import React, { PureComponent } from "react";
import {
    Page,
    SpinnerContainer,
    TechnoSpinner,
    RemoteDataState,
    Grid,
    Columns,
} from '@influxdata/clockface'
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import { Link } from "react-router-dom"
import HomeIcon from '@material-ui/icons/Home';
import RightSideBar from 'src/userManual/components/RightSideBar';
import MaintenancePageUserManual from 'src/userManual/components/MaintenancePageUserManual';
import FailurePageUserManual from 'src/userManual/components/FailurePageUserManual';

interface Props { }
interface State {
    spinnerLoading: RemoteDataState
    activePage: string
    activePageName: string
}

class UserManualContainer extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            spinnerLoading: RemoteDataState.Loading,
            activePage: 'maintenancePage',
            activePageName: 'Maintenance',
        };
    }

    componentDidMount() {
        this.setState({
            spinnerLoading: RemoteDataState.Done
        })
    }

    changeActivePage = (page) => {
        this.setState({
            activePage: page["id"],
            activePageName: page["name"],
        })
    }

    render() {
        return (
            <Page>
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
                                    <Link color="inherit" to={`/orgs/${this.props.match.params["orgID"]}/user-manual`}>
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
                                        orgID={this.props.match.params.orgID}
                                        changeActivePage={this.changeActivePage}
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