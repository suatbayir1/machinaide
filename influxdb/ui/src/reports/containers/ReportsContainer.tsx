// Libraries
import React, { PureComponent } from 'react'

// Components
import { Page } from '@influxdata/clockface'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import NewReport from 'src/reports/components/NewReport'
import ReportsList from 'src/reports/components/ReportsList'
import Backup from 'src/reports/components/Backup';

// Services
import ReportsService from 'src/reports/services/ReportsService';


interface Props { }
interface State {
    activeTab: string
    reports: object[]
}

class ReportsContainer extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            activeTab: "new-report",
            reports: [],
        }
    }

    async componentDidMount() {
        await this.getReports();
    }

    getReports = async () => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        let reports = await ReportsService.getReports();

        if (localStorage.getItem("userRole") !== "admin") {
            reports = reports.filter(report => report.uid === userInfo.uid);
        }

        this.setState({ reports });
    }

    public render() {
        const { activeTab, reports } = this.state;

        return (
            <Page>
                <Page.Header fullWidth={false}>
                    <Page.Title title="Reports" />
                </Page.Header>

                <Page.Contents fullWidth={false}>
                    <TabbedPageTabs
                        tabs={[
                            {
                                text: 'NEW REPORT',
                                id: 'new-report',
                            },
                            {
                                text: 'REPORTS LIST',
                                id: 'reports',
                            },
                            {
                                text: "BACKUP",
                                id: "backup"
                            }
                        ]}
                        activeTab={activeTab}
                        onTabClick={(e) => { this.setState({ activeTab: e }) }}
                    />

                    {activeTab === "new-report" && <NewReport getReports={this.getReports} />}
                    {activeTab === "reports" &&
                        <ReportsList
                            {...this.props}
                            reports={reports}
                            getReports={this.getReports}
                        />
                    }
                    {activeTab === "backup" && <Backup />}
                </Page.Contents>
            </Page>
        )
    }
}


export default ReportsContainer;
