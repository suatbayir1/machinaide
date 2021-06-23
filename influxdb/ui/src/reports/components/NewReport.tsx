// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'

// Components
import {
    Panel, ComponentSize, Grid, Columns, Form, Input, FlexBox, SlideToggle,
    Button, IconFont, ButtonType, ComponentColor, SelectDropdown, TextArea,
    ComponentStatus,
} from '@influxdata/clockface'
import { ReactMultiEmail, isEmail } from 'react-multi-email';

// Services 
import FactoryService from 'src/shared/services/FactoryService';
import ReportsService from 'src/reports/services/ReportsService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    newReportCreatedSuccessfully,
    newReportCreatedFailure,
    pleaseFillInTheFormCompletely,
} from 'src/shared/copy/notifications'

interface OwnProps {
    getReports: () => void
}
interface State {
    activeTab: string
    author: string
    saveReportAs: string
    selectedScheduleReport: string
    scheduleReportAt: string
    description: string
    sendReportAsEmail: boolean
    saveToCloud: boolean
    emailSubjectHeading: string
    defaultEmailMessage: string
    cloudProvider: string
    cloudBucketName: string
    cloudObjectName: string
    factories: string[]
    machines: string[]
    components: string[]
    selectedFactory: string
    selectedMachine: string
    selectedComponent: string
    reportTitle: string
    emails: string[]
    uid: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class NewReport extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            activeTab: "new-report",
            author: "",
            saveReportAs: "",
            selectedScheduleReport: "Not Repeat",
            scheduleReportAt: "",
            description: "",
            sendReportAsEmail: false,
            saveToCloud: false,
            emailSubjectHeading: "",
            defaultEmailMessage: "",
            cloudProvider: "Google",
            cloudBucketName: "",
            cloudObjectName: "",
            factories: [],
            machines: [],
            components: [],
            selectedFactory: "",
            selectedMachine: "",
            selectedComponent: "ALL",
            emails: [],
            reportTitle: "",
            uid: "",
        }
    }

    async componentDidMount() {
        await this.getAllFactories();
        await this.getUserInfo();
    }

    getUserInfo = () => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        this.setState({ author: `${userInfo.givenName} ${userInfo.sn}`, uid: userInfo.uid });
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    handleChangeFactoryDropdown = (e) => {
        this.setState({ selectedFactory: e, selectedMachine: "", selectedComponent: "ALL" });
        // if (e === "ALL") {
        //     this.setState({
        //         machines: [],
        //         components: [],
        //         selectedMachine: "ALL",
        //         selectedComponent: "ALL",
        //     });
        // } else {
        this.getAllMachines(e);
        // }
    }

    handleChangeMachineDropdown = (e) => {
        this.setState({ selectedMachine: e, selectedComponent: "ALL" });
        // if (e === "ALL") {
        //     this.setState({
        //         components: [],
        //         selectedComponent: "ALL",
        //     });
        // } else {
        this.getAllComponents(e);
        // }
    }

    getAllFactories = async () => {
        const factories = await FactoryService.getFactories();
        const allFactories = [];

        // allFactories.push("ALL");

        factories.forEach(factory => {
            allFactories.push(factory["id"]);
        })

        this.setState({ factories: allFactories });
    }

    getAllMachines = async (factoryId) => {
        const payload = {
            "factoryId": factoryId
        }

        const machines = await FactoryService.getMachines(payload);
        const allMachines = [];

        // allMachines.push("ALL");

        machines.forEach(machine => {
            allMachines.push(machine["id"]);
        })

        this.setState({ machines: allMachines });
    }

    getAllComponents = async (machineId) => {
        const payload = {
            "factoryId": this.state.selectedFactory,
            "machineId": machineId
        }

        const components = await FactoryService.getComponents(payload);
        const allComponents = [];

        allComponents.push("ALL");

        components.forEach(component => {
            allComponents.push(component["id"]);
        })

        this.setState({ components: allComponents });
    }

    validateForm = () => {
        const {
            sendReportAsEmail, emails, emailSubjectHeading, selectedFactory, author,
            scheduleReportAt, reportTitle, selectedMachine,
        } = this.state;


        if (author.trim() === ""
            || scheduleReportAt.trim() === ""
            || reportTitle.trim() === ""
            || selectedFactory.trim() === ""
            || selectedMachine.trim() === ""
        ) {
            this.props.notify(pleaseFillInTheFormCompletely("First Name, Last Name, Report Title, Schedule Report At, Factory and Machine"));
            return false;
        }

        if (sendReportAsEmail && (emailSubjectHeading === "" || emails.length === 0)) {
            this.props.notify(pleaseFillInTheFormCompletely("Email Subject Heading and Select Email To"));
            return false;
        }

        return true;
    }

    newReport = async () => {
        if (!this.validateForm()) {
            return;
        }

        const {
            saveToCloud, sendReportAsEmail, cloudProvider, cloudBucketName, cloudObjectName, emails,
            selectedComponent, selectedMachine, selectedFactory, emailSubjectHeading, defaultEmailMessage,
            description, selectedScheduleReport, scheduleReportAt, reportTitle, author, uid,
        } = this.state;

        const payload = {
            CheckBox: {
                cloud: saveToCloud,
                sendEmail: sendReportAsEmail
            },
            Cloud: {
                provider: cloudProvider,
                bucket: cloudBucketName,
                object: cloudObjectName
            },
            Component: selectedComponent,
            Email: {
                subject: emailSubjectHeading,
                message: defaultEmailMessage
            },
            Factory: selectedFactory,
            Author: author,
            Machine: selectedMachine,
            Receivers: emails,
            ReportConfig: {
                description: description,
                schedule: selectedScheduleReport,
                time: new Date(scheduleReportAt).getTime(),
                title: reportTitle,
            },
            enabled: true,
            isCreatedBefore: false,
            uid: uid
        }

        const result = await ReportsService.newReport(payload);

        if (result.data.summary.code === 200) {
            await this.props.notify(newReportCreatedSuccessfully());
            await this.props.getReports();
        } else {
            await this.props.notify(newReportCreatedFailure());
        }

    }

    public render() {
        const {
            defaultEmailMessage, cloudProvider, description, emailSubjectHeading, reportTitle,
            selectedScheduleReport, scheduleReportAt, sendReportAsEmail, saveToCloud, emails,
            cloudBucketName, cloudObjectName, factories, machines, components, selectedFactory,
            selectedMachine, selectedComponent, author,
        } = this.state;

        return (
            <>
                <Panel style={{ marginTop: '30px' }}>
                    <Panel.Header size={ComponentSize.ExtraSmall}>
                        <Grid>
                            <Grid.Row>
                                {/* FIRST LEFT SIDE */}
                                <Grid.Column widthXS={Columns.Six}>
                                    <Panel style={{ backgroundColor: '#292933', padding: '10px' }}>
                                        <h2 style={{ marginBottom: '20px', color: '#B1B6FF' }}>Report Details</h2>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element
                                                    label="Author"
                                                    required={true}
                                                >
                                                    <Input
                                                        name="author"
                                                        placeholder="Author.."
                                                        onChange={this.handleChangeInput}
                                                        value={author}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element
                                                    label="Report Title"
                                                    required={true}
                                                >
                                                    <Input
                                                        name="reportTitle"
                                                        placeholder="Report title.."
                                                        onChange={this.handleChangeInput}
                                                        value={reportTitle}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element
                                                    label="Repeat"
                                                >
                                                    <SelectDropdown
                                                        options={["Not Repeat", "Hourly", "Daily", "Weekly", "Monthly"]}
                                                        selectedOption={selectedScheduleReport}
                                                        onSelect={(e) => this.setState({ selectedScheduleReport: e })}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element
                                                    label="Schedule Report As"
                                                    required={true}
                                                >
                                                    <input
                                                        name='scheduleReportAt'
                                                        type='datetime-local'
                                                        value={scheduleReportAt}
                                                        onChange={this.handleChangeInput}
                                                        style={{ background: '#383846', color: '#ffffff' }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel>
                                </Grid.Column>

                                {/* FIRST RIGHT SIDE */}
                                <Grid.Column widthXS={Columns.Six}>
                                    <Panel style={{ backgroundColor: '#292933', padding: '10px' }}>
                                        <h2 style={{ marginBottom: '20px', color: '#B1B6FF' }}>Select Targets and Options</h2>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Four}>
                                                <Form.Element
                                                    label="Factory"
                                                    required={true}
                                                >
                                                    <SelectDropdown
                                                        options={factories}
                                                        selectedOption={selectedFactory}
                                                        onSelect={(e) => { this.handleChangeFactoryDropdown(e) }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Four}>
                                                <Form.Element
                                                    label="Machine"
                                                    required={true}
                                                >
                                                    <SelectDropdown
                                                        options={machines}
                                                        selectedOption={selectedMachine}
                                                        onSelect={(e) => { this.handleChangeMachineDropdown(e) }}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Four}>
                                                <Form.Element
                                                    label="Component"
                                                >
                                                    <SelectDropdown
                                                        options={components}
                                                        selectedOption={selectedComponent}
                                                        onSelect={(e) => { this.setState({ selectedComponent: e }) }}

                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Twelve}>
                                                <Form.Element
                                                    label="Brief Description of Report"
                                                >
                                                    <TextArea
                                                        name="description"
                                                        value={description}
                                                        placeholder="Description.."
                                                        onChange={this.handleChangeInput}
                                                        rows={2}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel>
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
                                                active={sendReportAsEmail}
                                                size={ComponentSize.Small}
                                                color={ComponentColor.Success}
                                                onChange={() => { this.setState({ sendReportAsEmail: !sendReportAsEmail }) }}
                                            />
                                            <h5>Send Report as Email</h5>
                                        </FlexBox>

                                        <FlexBox margin={ComponentSize.Medium}>
                                            <SlideToggle
                                                active={saveToCloud}
                                                size={ComponentSize.Small}
                                                color={ComponentColor.Success}
                                                onChange={() => { this.setState({ saveToCloud: !saveToCloud }) }}
                                            />
                                            <h5>Save to Cloud</h5>
                                        </FlexBox>
                                    </FlexBox>
                                </div>
                            </Grid.Row>

                            <Grid.Row style={{ marginTop: '20px' }}>
                                {/* FIRST LEFT SIDE */}
                                {
                                    sendReportAsEmail &&
                                    <Grid.Column widthXS={Columns.Six}>
                                        <Panel style={{ backgroundColor: '#292933', padding: '10px' }}>
                                            <h2 style={{ marginBottom: '20px', color: '#B1B6FF' }}>Email Configuration (Optional)</h2>
                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <Form.Element
                                                        label="Email Subject Heading"
                                                        required={true}
                                                    >
                                                        <Input
                                                            name="emailSubjectHeading"
                                                            placeholder="Email subject heading.."
                                                            onChange={this.handleChangeInput}
                                                            value={emailSubjectHeading}
                                                            status={sendReportAsEmail ? ComponentStatus.Default : ComponentStatus.Disabled}
                                                        />
                                                    </Form.Element>
                                                </Grid.Column>

                                                <Grid.Column widthXS={Columns.Six}>
                                                    <Form.Element
                                                        label="Default Email Message"
                                                    >
                                                        <Input
                                                            name="defaultEmailMessage"
                                                            placeholder="Default email message.."
                                                            onChange={this.handleChangeInput}
                                                            value={defaultEmailMessage}
                                                            status={sendReportAsEmail ? ComponentStatus.Default : ComponentStatus.Disabled}
                                                        />
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <Form.Element
                                                        label="Select Email To"
                                                        required={true}
                                                    >
                                                        <ReactMultiEmail
                                                            style={{
                                                                backgroundColor: '#383846',
                                                                cursor: sendReportAsEmail ? 'auto' : 'none',
                                                                pointerEvents: sendReportAsEmail ? 'auto' : 'none',
                                                            }}
                                                            placeholder="Enter your email address"
                                                            emails={emails}
                                                            onChange={(_emails: string[]) => {
                                                                this.setState({ emails: _emails });
                                                            }}
                                                            validateEmail={email => {
                                                                return isEmail(email);
                                                            }}
                                                            getLabel={(
                                                                email: string,
                                                                index: number,
                                                                removeEmail: (index: number) => void,
                                                            ) => {
                                                                return (
                                                                    <div data-tag key={index}>
                                                                        {email}
                                                                        <span data-tag-handle onClick={() => removeEmail(index)}>
                                                                            ×
                                                                    </span>
                                                                    </div>
                                                                );
                                                            }}
                                                        />
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Panel>
                                    </Grid.Column>
                                }

                                {/* FIRST RIGHT SIDE */}
                                {
                                    saveToCloud &&
                                    <Grid.Column widthXS={Columns.Six}>
                                        <Panel style={{ backgroundColor: '#292933', padding: '10px' }}>
                                            <h2 style={{ marginBottom: '20px', color: '#B1B6FF' }}>Cloud Configuration (Optional)</h2>
                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <Form.Element
                                                        label="Cloud Provider"
                                                    >
                                                        <SelectDropdown
                                                            options={["Google", "Microsoft Azure", "Amazon Web Services", "Oracle"]}
                                                            selectedOption={cloudProvider}
                                                            onSelect={(e) => { this.setState({ cloudProvider: e }) }}
                                                            buttonStatus={saveToCloud ? ComponentStatus.Default : ComponentStatus.Disabled}
                                                        />
                                                    </Form.Element>
                                                </Grid.Column>

                                                <Grid.Column widthXS={Columns.Six}>
                                                    <Form.Element
                                                        label="Cloud Bucket Name"
                                                    >
                                                        <Input
                                                            name="cloudBucketName"
                                                            placeholder="Cloud bucket name.."
                                                            onChange={this.handleChangeInput}
                                                            value={cloudBucketName}
                                                            status={saveToCloud ? ComponentStatus.Default : ComponentStatus.Disabled}
                                                        />
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <Form.Element
                                                        label="Cloud Object Name"
                                                    >
                                                        <Input
                                                            name="cloudObjectName"
                                                            placeholder="Cloud object name.."
                                                            onChange={this.handleChangeInput}
                                                            value={cloudObjectName}
                                                            status={saveToCloud ? ComponentStatus.Default : ComponentStatus.Disabled}
                                                        />
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Panel>
                                    </Grid.Column>
                                }
                            </Grid.Row>
                        </Grid>
                    </Panel.Header>

                    <Panel.Footer>
                        <Button
                            text="SUBMIT"
                            icon={IconFont.Checkmark}
                            type={ButtonType.Button}
                            color={ComponentColor.Primary}
                            size={ComponentSize.Medium}
                            onClick={this.newReport}
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

export default connector(NewReport);