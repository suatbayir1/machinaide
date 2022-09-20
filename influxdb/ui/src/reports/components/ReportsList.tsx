// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'

// Components
import {
    Grid, DapperScrollbars, Table, BorderType, ComponentSize, Appearance, Panel,
    FlexBox, Button, IconFont, ComponentColor, ButtonType, ConfirmationButton,
    SlideToggle, Columns, Input, QuestionMarkTooltip, InfluxColors,
} from '@influxdata/clockface'
import CreatedReportsListOverlay from 'src/reports/components/CreatedReportsListOverlay';

// Services
import ReportsService from 'src/reports/services/ReportsService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    reportDeletedSuccessfully,
    reportUpdatedSuccessfully,
} from 'src/shared/copy/notifications'
import {
    tipStyle, reportEnable,
} from 'src/shared/constants/tips';


interface OwnProps {
    reports: object[]
    getReports: () => void
}
interface State {
    visibleCreatedReportsList: boolean
    createdReportsData: object[]
    selectedReport: object
    filterByTitle: string
    filterByAuthor: string
    filteredReports: object[]
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class ReportsList extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            visibleCreatedReportsList: false,
            createdReportsData: [],
            selectedReport: {},
            filterByTitle: "",
            filterByAuthor: "",
            filteredReports: [],
        }
    }

    async componentDidMount() {
        await this.setFilteredReports();
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.reports !== this.props.reports) {
            await this.setFilteredReports();
        }
    }

    setFilteredReports = () => {
        this.setState({ filteredReports: this.props.reports });
    }

    handleChangeReportEnable = async (report) => {
        const payload = {
            "recordId": report["_id"]["$oid"],
            "enabled": !report["enabled"]
        }

        const result = await ReportsService.updateReport(payload);

        if (result.data.summary.code === 200) {
            await this.props.notify(reportUpdatedSuccessfully());
            this.props.getReports();
        }
    }

    handleDeleteReport = async (report) => {
        const payload = {
            "recordId": report["_id"]["$oid"]
        }
        const result = await ReportsService.deleteReport(payload);

        if (result.data.summary.code === 200) {
            await this.props.notify(reportDeletedSuccessfully());
            this.props.getReports();
        }
    }

    handleOpenCreatedReportsList = async (report) => {
        const payload = {
            "title": report["ReportConfig"]["title"]
        }

        const result = await ReportsService.getCreatedReports(payload);

        this.setState({
            visibleCreatedReportsList: true,
            createdReportsData: result,
            selectedReport: report,
        });
    }

    handleCloseCreatedReportsList = () => {
        this.setState({ visibleCreatedReportsList: false });
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>, () => { this.getFilteredData() });
        }
    }

    getFilteredData = () => {
        const { filterByAuthor, filterByTitle } = this.state;
        const { reports } = this.props;

        const tempFilteredRows = [];

        reports.forEach((row) => {
            if (String(row?.["ReportConfig"]?.["title"]).toLowerCase().includes(filterByTitle.toLowerCase())
                && String(row?.["Author"]).toLowerCase().includes(filterByAuthor.toLowerCase())
            ) {
                tempFilteredRows.push(row);
            }
        })

        this.setState({
            filteredReports: tempFilteredRows
        })
    }

    public render() {
        const {
            visibleCreatedReportsList, createdReportsData, selectedReport,
            filterByTitle, filterByAuthor, filteredReports,
        } = this.state;

        return (
            <>
                <Panel style={{ marginTop: '30px' }}>
                    <Panel.Header size={ComponentSize.ExtraSmall}>
                        <Grid>
                            <Grid.Row>
                                <Grid.Column
                                    widthXS={Columns.Six}
                                    widthSM={Columns.Four}
                                    widthMD={Columns.Three}
                                    widthLG={Columns.Two}
                                >
                                    <Input
                                        icon={IconFont.Search}
                                        name="filterByTitle"
                                        placeholder="Filter by title"
                                        value={filterByTitle}
                                        onChange={(e) => { this.handleChangeInput(e) }}
                                    />
                                </Grid.Column>
                                <Grid.Column
                                    widthXS={Columns.Six}
                                    widthSM={Columns.Four}
                                    widthMD={Columns.Three}
                                    widthLG={Columns.Two}
                                >
                                    <Input
                                        icon={IconFont.Search}
                                        name="filterByAuthor"
                                        placeholder="Filter by author"
                                        value={filterByAuthor}
                                        onChange={(e) => { this.handleChangeInput(e) }}
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
                                                <Table.HeaderCell style={{ width: "300px" }}>Title</Table.HeaderCell>
                                                <Table.HeaderCell style={{ width: "200px" }}>Author</Table.HeaderCell>
                                                <Table.HeaderCell style={{ width: "200px" }}>Enabled</Table.HeaderCell>
                                                <Table.HeaderCell style={{ width: "100px" }}></Table.HeaderCell>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {
                                                filteredReports.map(row => {
                                                    return (
                                                        <Table.Row key={row["_id"]["$oid"]}>
                                                            <Table.Cell>{row["ReportConfig"]?.title}</Table.Cell>
                                                            <Table.Cell>{row?.["Author"]}</Table.Cell>
                                                            <Table.Cell>
                                                                <FlexBox margin={ComponentSize.Medium}>
                                                                    <SlideToggle
                                                                        active={row["enabled"]}
                                                                        size={ComponentSize.Small}
                                                                        color={ComponentColor.Success}
                                                                        onChange={() => { this.handleChangeReportEnable(row) }}
                                                                    />
                                                                    <QuestionMarkTooltip
                                                                        diameter={20}
                                                                        tooltipStyle={{ width: '400px' }}
                                                                        color={ComponentColor.Secondary}
                                                                        tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                                            <div style={{ color: InfluxColors.Star }}>{"Enable:"}
                                                                                <hr style={tipStyle} />
                                                                            </div>
                                                                            {reportEnable}
                                                                        </div>}
                                                                    />
                                                                </FlexBox>
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                <FlexBox margin={ComponentSize.Medium} >
                                                                    <Button
                                                                        size={ComponentSize.ExtraSmall}
                                                                        icon={IconFont.TextBlock}
                                                                        color={ComponentColor.Primary}
                                                                        type={ButtonType.Submit}
                                                                        onClick={() => { this.handleOpenCreatedReportsList(row) }}
                                                                    />
                                                                    <ConfirmationButton
                                                                        icon={IconFont.Remove}
                                                                        onConfirm={() => { this.handleDeleteReport(row) }}
                                                                        text={""}
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
                        </Grid>
                    </Panel.Header>
                </Panel>

                <CreatedReportsListOverlay
                    {...this.props}
                    visibleCreatedReportsList={visibleCreatedReportsList}
                    handleCloseCreatedReportsList={this.handleCloseCreatedReportsList}
                    createdReportsData={createdReportsData}
                    selectedReport={selectedReport}
                />
            </>
        )
    }
}


const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(ReportsList);