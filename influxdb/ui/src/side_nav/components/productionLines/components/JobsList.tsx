import React, { PureComponent } from 'react'

import _ from 'lodash'
import uuid from 'uuid'
import CustomDatePicker from 'src/side_nav/components/productionLines/components/CustomDatePicker'
import SummaryService from "src/shared/services/SummaryService";

import { Overlay, Grid,
    TechnoSpinner, WaitingText, ComponentColor, Columns, SelectDropdown,
    InfluxColors, ComponentSize, Label, Input, Notification,
    InputType, QuestionMarkTooltip, BorderType, Table,
    DapperScrollbars, AlignItems, InputToggleType,} from '@influxdata/clockface'

interface Props {
    jobListOverlay: boolean
    closeOverlay: () => void
}

interface State {
    jobs: object[]
}

class JobsList extends PureComponent<Props, State>{
    state ={
        jobs: []
    }  
    
    componentDidMount(): void {
        this.getJobs(new Date().toISOString().substring(0,10))
    }

    getJobs = async (date) => {
        console.log("custom date picker", date)
        let jobs = await SummaryService.getJobsInADay({"date": date.substring(0,10)})
        console.log("all jobs", jobs)
        this.setState({jobs})
    }

    render(): React.ReactNode {
        return(
        <Overlay visible={this.props.jobListOverlay}>
            <Overlay.Container maxWidth={800}>
                <Overlay.Header
                    title="Jobs"
                    onDismiss={this.props.closeOverlay}
                />
                <Overlay.Body>
                    <Grid>
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve}>
                            <div style={{display: "flex"}}>
                                <div className="tabbed-page--header-left">                            
                                    <Label
                                        size={ComponentSize.Small}
                                        name={`Job Count: ${this.state.jobs.length}`}
                                        description={""}
                                        color={InfluxColors.Amethyst}
                                        id={"job-count-label"} 
                                    />
                                </div> 
                                <div className="tabbed-page--header-right">                            
                                    <CustomDatePicker
                                        dateTime={new Date().toISOString().substring(0,10)}
                                        onSelectDate={(e)=>this.getJobs(e)}
                                        label="Select a due date"
                                    />
                                </div> 
                            </div>                         
                        </Grid.Column>
                      </Grid.Row>
                      <Grid.Row>
                          <Grid.Column widthXS={Columns.Twelve} style={{height: "500px"}}>
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
                                    id={"jobList"}
                                >
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell style={{ width: "200px", position: "sticky", top: "0", backgroundColor: "#181820" }}>
                                                İş Emri No
                                            </Table.HeaderCell>
                                            <Table.HeaderCell style={{ width: "100px", position: "sticky", top: "0", backgroundColor: "#181820" }}>
                                                Boy
                                            </Table.HeaderCell>
                                            <Table.HeaderCell style={{ width: "100px", position: "sticky", top: "0", backgroundColor: "#181820" }}>
                                                En
                                            </Table.HeaderCell>
                                            <Table.HeaderCell style={{ width: "100px", position: "sticky", top: "0", backgroundColor: "#181820" }}>
                                                Kalınlık
                                            </Table.HeaderCell>
                                            <Table.HeaderCell style={{ width: "100px", position: "sticky", top: "0", backgroundColor: "#181820" }}>
                                                Kalite
                                            </Table.HeaderCell>
                                            <Table.HeaderCell style={{ width: "100px", position: "sticky", top: "0", backgroundColor: "#181820" }}>
                                                Part
                                            </Table.HeaderCell>
                                            <Table.HeaderCell style={{ width: "50px", position: "sticky", top: "0", backgroundColor: "#181820" }}>

                                            </Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {this.state.jobs.map(job => {
                                            return (
                                                <Table.Row
                                                    key={uuid.v4()}
                                                    style={{border: "1px solid #434453"}}
                                                >
                                                    <Table.Cell style={{ width: "200px" }}>{job["isemri"]}</Table.Cell>
                                                    <Table.Cell style={{ width: "100px" }}>{job["boy"] ? job["boy"] : "-"}</Table.Cell>
                                                    <Table.Cell style={{ width: "100px" }}>{job["en"] ? job["en"] : "-"}</Table.Cell>
                                                    <Table.Cell style={{ width: "100px" }}>{job["kalınlık"] ? job["kalınlık"] : "-"}</Table.Cell>
                                                    <Table.Cell style={{ width: "100px" }}>{job["kalite"] ? job["kalite"] : "-"}</Table.Cell>
                                                    <Table.Cell style={{ width: "100px" }}>{job["part"] ? job["part"] : "-"}</Table.Cell>
                                                    <Table.Cell style={{ width: "50px" }}>
                                                        <QuestionMarkTooltip
                                                            style={{ marginLeft: "5px" }}
                                                            diameter={15}
                                                            color={ComponentColor.Secondary}
                                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                            <div style={{ color: InfluxColors.Star }}>{"Info"}
                                                                <hr style={{ borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#BE2EE4', boxShadow: '0 0 5px 0 #8E1FC3', margin: '3px' }} />
                                                            </div>
                                                            <div>
                                                                <span style={{color: InfluxColors.Pool}}>
                                                                    Tanım:
                                                                </span> {job["tanim"] ? job["tanim"] : "-"}
                                                            </div>
                                                            <div>
                                                                <span style={{color: InfluxColors.Rainforest}}>
                                                                    Urungr: 
                                                                </span> {job["urungr"] ? job["urungr"] : "-"}
                                                            </div>
                                                            <div>
                                                                <span style={{color: InfluxColors.Topaz}}>
                                                                    kd: 
                                                                </span> {job["kd"] ? job["kd"] : "-"}
                                                            </div>
                                                            <div>
                                                                <span style={{color: InfluxColors.Topaz}}>
                                                                    ob: 
                                                                </span> {job["ob"] ? job["ob"] : "-"}
                                                            </div>
                                                        </div>}
                                                        />
                                                    </Table.Cell>
                                                </Table.Row>
                                            )
                                        })}
                                    </Table.Body>
                                </Table>
                            </DapperScrollbars>
                          </Grid.Column>
                      </Grid.Row>
                    </Grid>
                </Overlay.Body>
            </Overlay.Container>
        </Overlay>
        )
    }
}

export default JobsList