// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'
import JSZip from 'jszip'

// Components
import {
    Panel, ComponentSize, Grid, Columns, Form, FlexBox, SlideToggle, InfluxColors,
    Button, IconFont, ButtonType, ComponentColor, QuestionMarkTooltip,
} from '@influxdata/clockface'

// Services 
import FactoryService from 'src/shared/services/FactoryService';
import MaintenanceService from 'src/maintenance/services/MaintenanceService';
import FailureService from 'src/shared/services/FailureService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    pleaseFillInTheFormCompletely,
} from 'src/shared/copy/notifications'
import {
    tipStyle, backup,
} from 'src/shared/constants/tips';


// Helpers
import { dataToCSV } from 'src/shared/parsing/dataToCsv';

interface OwnProps {
}
interface State {
    startDate: string
    endDate: string
    machineActionsToggle: boolean
    maintenancesToggle: boolean
    failuresToggle: boolean
    machineActions: object[]
    maintenances: object[]
    failures: object[]
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class Backup extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            startDate: "",
            endDate: "",
            machineActionsToggle: true,
            maintenancesToggle: true,
            failuresToggle: true,
            machineActions: [],
            maintenances: [],
            failures: []
        }
    }

    async componentDidMount() {
        const machineActions = await FactoryService.getAllMachineActions({ "machineID": "*" });
        const maintenances = await MaintenanceService.getAllMaintenance();
        const failures = await FailureService.getAllFailures();
        this.setState({
            machineActions,
            maintenances,
            failures
        })
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    validateForm = () => {
        const { startDate, endDate } = this.state;

        if (startDate.trim() === "" || endDate.trim() === "") {
            this.props.notify(pleaseFillInTheFormCompletely("Start Date, End Date"));
            return false;
        }

        return true;
    }

    exportBackup = () => {
        const { machineActions, maintenances, failures, startDate, endDate, failuresToggle, machineActionsToggle, maintenancesToggle } = this.state;

        if (this.validateForm()) {
            let filteredMachineActions = machineActions.filter(item => {
                let itemStart = item["startTime"] === "" || item["startTime"] === null ? Date.now() : new Date(item["startTime"]);
                let itemEnd = item["endTime"] === "" || item["endTime"] === null ? Date.now() : new Date(item["endTime"]);

                if (itemStart > new Date(startDate) && itemEnd < new Date(endDate)) {
                    return item;
                }
            })

            let filteredMaintenances = maintenances.filter(item => {
                let itemStart = item["date"] === "" || item["date"] === null ? Date.now() : new Date(item["date"]);

                if (itemStart > new Date(startDate)) {
                    return item;
                }
            })

            let filteredFailures = failures.filter(item => {
                let itemStart = item["startTime"] === "" || item["startTime"] === null ? Date.now() : new Date(item["startTime"]);
                let itemEnd = item["endTime"] === "" || item["endTime"] === null ? Date.now() : new Date(item["endTime"]);

                if (itemStart > new Date(startDate) && itemEnd < new Date(endDate)) {
                    return item;
                }
            })


            let machineActionheaders = ["Machine,Job Name,Start Time,End Time,Job Description"];
            let machineActionkeys = ["machineID", "jobName", "startTime", "endTime", "jobDescription"];
            let machineActionCSV = this.createCSV(filteredMachineActions, machineActionheaders, machineActionkeys);

            let maintenanceHeaders = ["Asset,Duration,Date,Fault Type,Maintenance Type,Reason,Job Description,Request"];
            let maintenanceKeys = ["asset", "duration", "date", "faultType", "maintenanceType", "reason", "jobDescription", "request"];
            let maintenanceCSV = this.createCSV(filteredMaintenances, maintenanceHeaders, maintenanceKeys);

            let failureHeaders = ["Source Name,Severity,Cost,Start Time,End Time,Description"];
            let failureKeys = ["sourceName", "severity", "cost", "startTime", "endTime", "description"];
            let failureCSV = this.createCSV(filteredFailures, failureHeaders, failureKeys);

            let zip = new JSZip();

            machineActionsToggle && zip.file("machine-actions.csv", machineActionCSV);
            maintenancesToggle && zip.file("maintenances.csv", maintenanceCSV);
            failuresToggle && zip.file("failures.csv", failureCSV);

            zip.generateAsync({
                type: "base64"
            }).then(function (content) {
                window.location.href = "data:application/zip;base64," + content;
            });
        }
    }

    createCSV = (filteredData, headers, keys) => {
        let data = filteredData.map(item => {
            let row = [];
            keys.forEach(k => {
                row.push(item[k]);
            })
            return row;
        });

        return dataToCSV([headers, ...data]);
    }

    public render() {
        const { startDate, endDate, machineActionsToggle, maintenancesToggle, failuresToggle } = this.state;

        return (
            <>
                <Panel style={{ marginTop: '30px' }}>
                    <Panel.Header size={ComponentSize.ExtraSmall}>
                        <Grid>
                            <Grid.Row>
                                {/* FIRST LEFT SIDE */}
                                <Grid.Column
                                    widthXS={Columns.Six}
                                    offsetXS={Columns.Three}
                                >
                                    <Panel style={{ backgroundColor: '#292933', padding: '10px' }}>
                                        <FlexBox
                                            style={{ marginBottom: '20px' }}
                                            margin={ComponentSize.Medium}
                                        >
                                            <h2 style={{ color: '#B1B6FF' }}>Backup Details</h2>

                                            <QuestionMarkTooltip
                                                diameter={20}
                                                tooltipStyle={{ width: '400px' }}
                                                color={ComponentColor.Secondary}
                                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                    <div style={{ color: InfluxColors.Star }}>{"Export backup:"}
                                                        <hr style={tipStyle} />
                                                    </div>
                                                    {backup}
                                                </div>}
                                            />
                                        </FlexBox>


                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element
                                                    label="Start Date"
                                                    required={true}
                                                >
                                                    <input
                                                        name='startDate'
                                                        type='datetime-local'
                                                        value={startDate}
                                                        onChange={this.handleChangeInput}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element
                                                    label="End Date"
                                                    required={true}
                                                >
                                                    <input
                                                        name='endDate'
                                                        type='datetime-local'
                                                        value={endDate}
                                                        onChange={this.handleChangeInput}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        {/* SLIDE TOGGLES */}
                                        <Grid.Row style={{ marginTop: '20px' }}>
                                            <div
                                                style={{
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    display: 'flex',
                                                }}
                                            >
                                                <FlexBox margin={ComponentSize.Large}>
                                                    <FlexBox margin={ComponentSize.Medium}>
                                                        <SlideToggle
                                                            active={machineActionsToggle}
                                                            size={ComponentSize.Small}
                                                            color={ComponentColor.Success}
                                                            onChange={() => { this.setState({ machineActionsToggle: !machineActionsToggle }) }}
                                                        />
                                                        <h5>Machine Actions</h5>
                                                    </FlexBox>

                                                    <FlexBox margin={ComponentSize.Medium}>
                                                        <SlideToggle
                                                            active={maintenancesToggle}
                                                            size={ComponentSize.Small}
                                                            color={ComponentColor.Success}
                                                            onChange={() => { this.setState({ maintenancesToggle: !maintenancesToggle }) }}
                                                        />
                                                        <h5>Maintenances</h5>
                                                    </FlexBox>

                                                    <FlexBox margin={ComponentSize.Medium}>
                                                        <SlideToggle
                                                            active={failuresToggle}
                                                            size={ComponentSize.Small}
                                                            color={ComponentColor.Success}
                                                            onChange={() => { this.setState({ failuresToggle: !failuresToggle }) }}
                                                        />
                                                        <h5>Failures</h5>
                                                    </FlexBox>
                                                </FlexBox>
                                            </div>
                                        </Grid.Row>
                                    </Panel>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Panel.Header>

                    <Panel.Footer>
                        <Button
                            text="Download"
                            icon={IconFont.Download}
                            type={ButtonType.Button}
                            color={ComponentColor.Primary}
                            size={ComponentSize.Medium}
                            onClick={this.exportBackup}
                        />
                    </Panel.Footer>
                </Panel>
            </>
        )
    }
}


const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(Backup);