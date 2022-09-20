// Libraries
import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'
import uuid from 'uuid'

// Components
import {
    Page, ComponentColor, ComponentSize, FlexBox, Grid, Panel,
    Button, ButtonType, DapperScrollbars, Columns, IconFont,
} from '@influxdata/clockface'
import SubSections from "src/ml/components/SubSections";

// Services
import AutoMLService from "src/shared/services/AutoMLService";

interface Props { }

interface State {
    tab: string
    settings: boolean
    trials: object[]
    hyperData: object[]
    trialsList: object[]
    trialIntermediates: object[]
    durationData: object[]
    experiment: null
    experimentName: string
    features: object[]
    startTime: object
    endTime: object
    timeOut: Number
    totalDuration: Number
    bestMetric: string
    didTimeOut: boolean
    experimentOverlay: boolean
    experimentStatus: string
    experimentJob: string
}

const createFeatureList = (features) => {
    return (
        <div style={{ height: "200px" }}>
            Features
            <DapperScrollbars
                autoHide={false}
                autoSizeHeight={true} style={{ maxHeight: '200px' }}
                className="data-loading--scroll-content"
            >
                <ul style={{ fontSize: '12px', padding: '0px' }}>
                    {features && features.map(feature => {
                        return <li key={uuid.v4()}>{feature}</li>
                    })}
                </ul>
            </DapperScrollbars>
        </div>
    )
}

const elements = (features, experimentJob) => {
    if (experimentJob !== "pof") {
        return ([
            {
                id: '0',
                type: 'input', // input node
                data: { label: createFeatureList(features) },
                position: { x: 150, y: 100 },
            },
            {
                id: '1',
                data: { label: 'lstm_2' },
                position: { x: 400, y: 25 },
            },
            // default node
            {
                id: '2',
                // you can also pass a React component as a label
                data: { label: <div>dropout_2</div> },
                position: { x: 400, y: 100 },
            },
            {
                id: '3',
                // you can also pass a React component as a label
                data: { label: 'lstm_3' },
                position: { x: 400, y: 175 },
            },
            {
                id: '4',
                //type: 'output', // output node
                data: { label: 'dropout_3' },
                position: { x: 400, y: 250 },
            },
            {
                id: '5',
                data: { label: 'dense_1' },
                position: { x: 400, y: 325 },
            },
            {
                id: '6',
                type: 'output', // output node
                data: { label: 'result' },
                position: { x: 650, y: 400 },
            },
            // animated edge
            { id: 'e0-1', source: '0', target: '1', animated: true },
            { id: 'e1-2', source: '1', target: '2', animated: true },
            { id: 'e2-3', source: '2', target: '3', animated: true },
            { id: 'e3-4', source: '3', target: '4', animated: true },
            { id: 'e4-5', source: '4', target: '5', animated: true },
            { id: 'e5-6', source: '5', target: '6', animated: true },
        ])
    }
    else if (experimentJob === "pof") {
        return ([
            {
                id: '0',
                type: 'input', // input node
                data: { label: createFeatureList(features) },
                position: { x: 150, y: 100 },
            },
            {
                id: '1',
                data: { label: 'masking_1' },
                position: { x: 400, y: 25 },
            },
            // default node
            {
                id: '2',
                // you can also pass a React component as a label
                data: { label: <div>lstm_1</div> },
                position: { x: 400, y: 100 },
            },
            {
                id: '3',
                // you can also pass a React component as a label
                data: { label: 'dense_1' },
                position: { x: 400, y: 175 },
            },
            {
                id: '4',
                //type: 'output', // output node
                data: { label: 'activation_1' },
                position: { x: 400, y: 250 },
            },
            {
                id: '5',
                type: 'output', // output node
                data: { label: 'result' },
                position: { x: 650, y: 325 },
            },
            // animated edge
            { id: 'e0-1', source: '0', target: '1', animated: true },
            { id: 'e1-2', source: '1', target: '2', animated: true },
            { id: 'e2-3', source: '2', target: '3', animated: true },
            { id: 'e3-4', source: '3', target: '4', animated: true },
            { id: 'e4-5', source: '4', target: '5', animated: true },
        ])
    }
}

const colors = {
    "COMPLETED": "#67D74E",
    "INVALID": "#F95F53",
    "IDLE": "#FFE480",
    "STOPPED": "#DC4E58",
    "RUNNING": "#00C9FF",
    "TIMEOUT": "#BF3D5E",
    "KILLED": "#BF3D5E",
    "-": "#00C9FF"
}

class AutoMLPage extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            tab: 'trials',
            settings: false,
            trials: [],
            hyperData: [],
            trialsList: [],
            trialIntermediates: [],
            durationData: [],
            experiment: null,
            experimentName: "",
            features: [],
            startTime: null,
            endTime: null,
            timeOut: 1 * 60 * 60 * 1000,
            totalDuration: null,
            bestMetric: "",
            didTimeOut: false,
            experimentOverlay: false,
            experimentStatus: "-",
            experimentJob: "",
        }
    }

    intervalID = 0;
    async componentDidMount() {
        console.log(this.props)
        await this.getExperimentData();
        this.intervalID = window.setInterval(() => {
            this.getExperimentData();
        }, 30000);
    }

    componentWillUnmount() {
        window.clearInterval(this.intervalID);
    }

    numberByStatus = (status) => {
        const { trials } = this.state
        let numbers = trials.filter(t => t["status"] === status)
        return numbers.length
    }

    calculateDuration = () => {
        const { trialIntermediates } = this.state
        // console.log(this.state)
        let duration = 0
        for (let trial of trialIntermediates) {
            duration = duration + trial["duration"]
        }
        let durationStr = new Date(duration * 1000).toISOString().substr(11, 8)
        return durationStr
    }

    getExperimentData = () => {
        const { experimentName } = this.props["match"]["params"];

        AutoMLService.getTrialsFromDirectory({"experimentName": experimentName}).then(res => {
            let allHypers = []
            let allTrials = []

            for (let trial of JSON.parse(res["trials"])) {
                let hypers = {}
                let trialData = {}
                hypers["batch"] = trial["hyperparams"]["batch_size"]
                hypers["epoch"] = trial["hyperparams"]["epochs"]
                hypers["dropout"] = trial["hyperparams"]["dropout"] ? trial["hyperparams"]["dropout"].toFixed(2) : ""
                hypers["units1"] = trial["hyperparams"]["units1"]
                hypers["units2"] = trial["hyperparams"]["units2"] ? trial["hyperparams"]["units2"] : ""
                hypers["metric"] = trial["score"].toFixed(2)
                allHypers.push(hypers)

                trialData["trialID"] = trial["trialID"]
                trialData["trialNo"] = 0//no + 1
                trialData["status"] = trial["status"]
                trialData["metric"] = trial["score"].toFixed(2)
                trialData["accuracy"] = trial["accuracy"] ? trial["accuracy"].toFixed(2) : trial["acc"] ? trial["acc"].toFixed(2) : ""
                trialData["val_loss"] = trial["val_loss"] ? trial["val_loss"].toFixed(2) : ""
                trialData["precision"] = trial["precision"] ? trial["precision"].toFixed(2) : ""
                trialData["recall"] = trial["recall"] ? trial["recall"].toFixed(2) : ""
                trialData["checked"] = false
                trialData["intermediate"] = []
                trialData["hyperparameters"] = trial["hyperparams"]
                trialData["probabilityDistance"] = trial["probability_distance"] ? trial["probability_distance"].toFixed(2) : ""
                allTrials.push(trialData)
            }

            let bestMetric = Math.max.apply(Math, allTrials.map(function (o) { return o["metric"]; }));


            this.setState({ trials: JSON.parse(res["trials"]), hyperData: allHypers, trialsList: allTrials, bestMetric: bestMetric }, () => {
                AutoMLService.getTrialsFromDB({"experimentName": experimentName}).then(res => {
                    let ints = []
                    let trialCount = res["trials"].length
                    let startTime = null
                    let endTime = null
                    let newFieldTrials = []
                    for (let trial of res["trials"]) {
                        let duration = {}
                        duration["trialNo"] = trial["trialNo"]
                        duration["duration"] = trial["duration"]
                        ints.push(duration)
                        if (trial["trialNo"] === 1) {
                            startTime = new Date(trial["timestamp"] * 1000)
                        }
                        for (let oldTrial of this.state.trialsList) {
                            if (oldTrial["trialID"] == trial["trialID"]) {
                                if (trial["probability_distance"]) {
                                    oldTrial["probabilityDistance"] = parseFloat(trial["probability_distance"].toFixed(2))
                                }
                                if (trial["ttc"] || trial["ttc"] === 0) {
                                    oldTrial["ttc"] = parseFloat(parseFloat(trial["ttc"]).toFixed(2))
                                }
                                if (trial["ctt"] || trial["ctt"] === 0) {
                                    oldTrial["ctt"] = parseFloat(parseFloat(trial["ctt"]).toFixed(2))
                                }
                                if (trial["exact_match"] || trial["exact_match"] === 0) {
                                    oldTrial["exactMatch"] = parseFloat(trial["exact_match"])
                                }
                                if (trial["detected_failure"] || trial["detected_failure"] === 0) {
                                    oldTrial["detectedFailure"] = parseFloat(trial["detected_failure"])
                                }
                                if (trial["missed_failure"] || trial["missed_failure"] === 0) {
                                    oldTrial["missedFailure"] = parseFloat(trial["missed_failure"])
                                }
                                if (trial["false_failure"] || trial["false_failure"] === 0) {
                                    oldTrial["falseFailure"] = parseFloat(trial["false_failure"])
                                }
                                newFieldTrials.push(oldTrial)
                            }
                        }
                    }
                    let duration = 0
                    for (let trial of res["trials"]) {
                        if (duration * 1000 > this.state.timeOut) {
                            this.setState({ timeOut: duration })
                        }
                        duration = duration + trial["duration"]
                    }
                    this.setState({ totalDuration: duration })
                    let experimentName = res["experimentName"] ? res["experimentName"] : ""
                    let experimentJob = res["experimentJob"] ? res["experimentJob"] : "none"
                    this.setState({
                        trialsList: newFieldTrials, startTime: startTime, endTime: endTime, trialIntermediates: res["trials"], durationData: ints,
                        experimentName: experimentName, experiment: res, features: res["features"], experimentJob: experimentJob,
                        experimentStatus: res["experimentStatus"] ? res["experimentStatus"] : "-"
                    }, () => this.getEndTime())
                }).catch(e => console.log("error while getting intermediates: ", e))
            })
        }).catch(e => console.log(e))
    }

    getEndTime = () => {
        let tcount = this.state.trialsList.length
        let endTime = null
        for (let trial of this.state.trialIntermediates) {
            if (trial["trialNo"] === tcount) {
                endTime = new Date(trial["timestamp"] * 1000)
            }
        }
        if (!endTime) {
            if (new Date().getTime() > (this.state.startTime.getTime() + this.state.totalDuration * 1000 + this.state.timeOut)) {
                this.setState({ didTimeOut: true })
            }
        }
        this.setState({ endTime: endTime })
    }

    private get optionsComponents(): JSX.Element {
        return (
            <React.Fragment>
                <FlexBox margin={ComponentSize.Small}>
                    {/* <Link to={this.props["history"].pop()}> */}
                    {/* <Link to={`/orgs/${this.props["match"].params["orgID"]}/ml`}> */}
                        <Button
                            text="Health Assessment Page"
                            type={ButtonType.Button}
                            icon={IconFont.CaretLeft}
                            color={ComponentColor.Primary}
                            onClick={()=>this.props["history"].goBack()}
                        />
                    {/* </Link> */}
                </FlexBox>
            </React.Fragment>
        )
    }

    formatDate = (whichDate) => {
        if (whichDate === "startTime") {
            let dates = this.state.startTime.toISOString().replace("T", ", ").split(":")
            return dates[0] + ":" + dates[1]
        }
        else if (whichDate === "endTime") {
            let dates = this.state.endTime.toISOString().replace("T", ", ").split(":")
            return dates[0] + ":" + dates[1]
        }
    }

    render() {
        const { durationData, experimentJob, hyperData, features, trialsList, trialIntermediates, didTimeOut } = this.state;

        return (
            <>
                <Page>
                    <Page.Header fullWidth={false}>
                        <Page.Title title={"AutoML"} />
                        {
                            this.optionsComponents
                        }
                    </Page.Header>

                    <Page.Contents fullWidth={false} scrollable={true}>
                        <Grid>
                            <Grid.Row style={{ border: 'solid 2px #999dab', borderRadius: '4px' }}>
                                <Grid.Column widthXS={Columns.Six}>
                                    <Panel style={{ marginRight: '10px', padding: '20px 20px 5px 20px', marginLeft: '10px', marginTop: '10px' }}>
                                        <Grid.Row style={{ paddingTop: '20px' }}>
                                            <Grid.Column widthXS={Columns.Four}>
                                                <label style={{ fontSize: '14px' }}># Trial numbers: {this.state.trials.length}</label>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Eight}>
                                                <progress
                                                    value={this.numberByStatus("COMPLETED")}
                                                    max={this.state.trials.length}
                                                    style={{ width: '90%' }}>
                                                </progress>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Running: {this.state.didTimeOut ? 0 : this.numberByStatus("RUNNING")}</h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Completed: {this.numberByStatus("COMPLETED")}</h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Stopped: {this.numberByStatus("STOPPED")}</h6>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Failed: {this.numberByStatus("INVALID")}</h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Idle: {this.numberByStatus("IDLE")}</h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Timeout: {this.state.didTimeOut ? 1 : 0}</h6>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel>
                                    <br /><br />

                                    <Panel style={{ marginRight: '10px', padding: '5px 20px 5px 20px', marginLeft: '10px' }}>
                                        <Grid.Row style={{ paddingTop: '20px' }}>
                                            <Grid.Column widthXS={Columns.Twelve}>
                                                <label style={{ fontSize: '14px' }}>
                                                    # Total Elapsed Time: <span style={{ color: "#00C9FF" }}>{this.calculateDuration()}</span>
                                                </label>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel>
                                    <br /><br />

                                    <Panel style={{ marginRight: '10px', padding: '5px 20px 5px 20px', marginLeft: '10px' }}>
                                        <Grid.Row style={{ paddingTop: '20px' }}>
                                            <Grid.Column widthXS={Columns.Twelve}>
                                                <label style={{ fontSize: '14px' }}>
                                                    # Experiment Status: <span style={{ color: colors[this.state.experimentStatus] }}>{this.state.experimentStatus}</span></label>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel>
                                    <br /><br />
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Six}>
                                    <Panel style={{ padding: '5px 20px 5px 20px', marginTop: '10px', marginRight: '10px' }}>
                                        <Grid.Row style={{ paddingTop: '20px' }}>
                                            <label style={{ fontSize: '14px' }}># Features</label>
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true} style={{ maxHeight: '100px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                <ul className="dropdown-menu">
                                                    {this.state.features && this.state.features.map(x => {
                                                        return (
                                                            <li key={uuid.v4()} className="dropdown-item" style={{ color: '#999dab' }}>{x}</li>
                                                        )
                                                    })}
                                                </ul>
                                            </DapperScrollbars>
                                        </Grid.Row>
                                    </Panel>
                                    <br />

                                    <Panel style={{ padding: '5px 20px 5px 20px', marginTop: '10px', marginRight: '10px' }}>
                                        <Grid.Row>
                                            <h6 style={{ fontSize: '14px' }}># Experiment</h6>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <h6>Name: {this.state.experimentName}</h6>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <h6>Start Time: {this.state.startTime ? this.formatDate("startTime") : ""}</h6>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <h6>Best Metric: <span style={{ color: 'green' }}><b>{this.state.bestMetric}</b></span></h6>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <h6>End Time: {this.state.endTime ? this.formatDate("endTime") : "-"}</h6>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel>
                                </Grid.Column>
                            </Grid.Row>
                            <br /><br />

                            <SubSections
                                params={this.props["match"]["params"]}
                                durationData={durationData}
                                experimentJob={experimentJob}
                                hyperData={hyperData}
                                nodesData={elements(features, experimentJob)}
                                trialsList={trialsList}
                                trialIntermediates={trialIntermediates}
                                didTimeOut={didTimeOut}
                            />
                        </Grid>
                    </Page.Contents>
                </Page>
            </>
        )
    }
}

export default AutoMLPage