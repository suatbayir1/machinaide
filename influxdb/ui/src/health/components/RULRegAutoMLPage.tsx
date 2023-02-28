// Libraries
import React, { PureComponent } from 'react'
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import HomeIcon from '@material-ui/icons/Home';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom'
import uuid from 'uuid'

// Components
import {
    Page, ComponentColor, ComponentSize, FlexBox, Grid, Panel,
    Button, ButtonType, DapperScrollbars, Columns, IconFont,
} from '@influxdata/clockface'
import SubSections from "src/ml/components/SubSections";
import RULRegSubSections from "src/health/components/RULRegSubSections"

// Services
import AutoMLService from "src/shared/services/AutoMLService";

const createNodeList = (items, text) => {
    let h = 50 * items.length
    if(h>250){
        h = 250
    }
    let hstr = h + "px"
    return (
        <div style={{ height: hstr, width: "150px", wordBreak: "break-all" }}>
            {text}
            <DapperScrollbars
                autoHide={false}
                autoSizeHeight={true} style={{ maxHeight: '200px' }}
                className="data-loading--scroll-content"
            >
                <ul style={{ fontSize: '12px', padding: '0px' }}>
                    {items && items.map(item => {
                        return <li key={uuid.v4()}>{item[0]}: <span style={{color: "red"}}>{item[1] ? item[1] : "-"}</span></li>
                    })}
                </ul>
            </DapperScrollbars>
        </div>
    )
}

const elements = (features, pipelineName, allParameters) => {
    let pipeline = allParameters.find(x => x.name === pipelineName)
    let nodes = [
        {
            id: '0',
            type: 'input', // input node
            data: { label: createFeatureList(features) },
            position: { x: 50, y: 100 },
            sourcePosition: "right", targetPosition: "left",
            style: {
                width: 180,
            },
        },
    ]
    if(pipeline && Object.keys(pipeline["parameters"]).length){
        let params = Object.keys(pipeline["parameters"]) // Imputer, Elastic etc
        let id = 1
        for(let param of params){ 
            let ps = Object.keys(pipeline["parameters"][param]) // categorical_impute_strategy, numeric_impute_strategy
            let info = []
            for(let p of ps){
                info.push([p, pipeline["parameters"][param][p]])
            }
            let idstr = id + ""
            nodes.push({
                id: idstr,
                type: "default",
                data: {label: createNodeList(info, param)},
                position: { x: 50 + 200*id, y: 100},
                sourcePosition: "right", targetPosition: "left",
                style: {
                    width: 180,
                },
            })
            let sid = (id-1) + ""
            let tid = id + ""
            let eid = "e" + sid + "-" + tid
            nodes.push(
                { id: eid, source: sid, target: tid, animated: true},
            )
            id = id + 1
        }

        //push last node
        let idstr = id + ""
        nodes.push({
            id: idstr,
            type: 'output', // output node
            data: { label: 'result' },
            sourcePosition: "right", targetPosition: "left",
            position: {  x: 50 + 200*id, y: 100 }
        })
        let sid = (id-1) + ""
        let tid = id + ""
        let eid = "e" + sid + "-" + tid
        nodes.push(
            { id: eid, source: sid, target: tid, animated: true },
        )
    }
    return nodes
}

interface Props {
    params: any
}

interface State {
    tab: string
    settings: boolean
    trials: object[]

    trialsRankingResults: object[]
    trainedPipelinesResults: object
    bestThreePipelines: object[]

    durationGraphData: any[]
    experiment: object
    experimentName: string

    features: string[]
    startTime: any
    endTime: any

    experimentStatus: string
    experimentJob: string
    durations: object
    
    selectedPipeline: string
    allPipelineNames: string[]
    bestThreeGraphData: object[]
    bestThreeGraphVariables: object[]

    topFeatures: boolean
    topFeaturesData: object[]
    optimizer: string
    earlyGuessPunishment: string
    lateGuessPunishment: string
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

class RULRegAutoMLPage extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            tab: 'trials',
            settings: false,
            trials: [],
            trialsRankingResults: [],
            trainedPipelinesResults: null,
            bestThreePipelines: [],
            durationGraphData: [],
            experiment: null,
            experimentName: "",
            features: [],
            startTime: null,
            endTime: null,
            experimentStatus: "-",
            experimentJob: "",
            durations: null,
            selectedPipeline: "",
            allPipelineNames: [],
            bestThreeGraphData: [],
            bestThreeGraphVariables: [],
            topFeatures: false,
            topFeaturesData: [],
            optimizer: "-",
            earlyGuessPunishment: "-",
            lateGuessPunishment: "-"
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

    changeSelectedPipeline = (pipeline_name) => {
        this.setState({selectedPipeline: pipeline_name})
    }

    getExperimentData = () => {
        let modelID = this.props.match.params.pipelineID
        let mid = modelID.substring(0, modelID.length-1)

        AutoMLService.getExperiment({modelID: mid}).then(exp => {
            console.log("exp:", exp)
            let durationsData = exp["durations"]
            let durationsKeys = Object.keys(durationsData)
            let durationGraphData = []
            for(let duration of durationsKeys){
                let d = {}
                d["pipelineName"] = duration
                d["duration"] = durationsData[duration]["duration"]
                durationGraphData.push(d)
            }

            let allParameters = exp["allParameters"]
            let pipelineNames = []
            for(let param of allParameters){
                if(param["name"]){
                    pipelineNames.push(param["name"])
                }
            }

            let scores = exp["pipelineScores"] ? exp["pipelineScores"] : {}
            let scoresKeys = Object.keys(scores)
            let scoreNames = []

            let allScores = []
            for(let score of scoresKeys){
                allScores.push(scores[score])
            }
            // one pipeline's metrics are enough for getting names

            for(let score of scoresKeys){
                let keys = Object.keys(scores[score])
                scoreNames = keys
                break
            }

            let pipelinesAlias = pipelineNames.map(name =>{
                if(name.length){
                    return name.split(" ")[0]
                }
                else{
                    return "-"
                }
            })

            let bestThreeGraphVariables = [{
                key: 'pipeline',
                type: 'point',
                padding: 1,
                values: pipelinesAlias,
                legend: 'pipeline',
                ticksPosition: 'before',
                legendPosition: 'start',
                legendOffset: 20,
                tickRotation: -45
            }]

            for(let name of scoreNames){
                let minData = Math.min.apply(Math, allScores.map(x => x[name]))
                let minGraph = minData - 20
                let minGraphStr = minGraph + ""
                let maxData = Math.max.apply(Math, allScores.map(x => x[name]))
                let maxGraph = maxData + 20
                let maxGraphStr = maxGraph + ""
                bestThreeGraphVariables.push(
                    {
                        key: name,
                        type: 'linear',
                        min: minGraphStr,
                        max: maxGraphStr,
                        ticksPosition: 'before',
                        legend: name,
                        legendPosition: 'start',
                        legendOffset: 20
                    }
                )
            }

            let bestThreeGraphData = []      
            let topFeaturesData = []      

            for(let pipeline of exp["bestThreePipeline"]){
                let pname = pipeline["name"]
                let pipelineScores = scores[pname] ? scores[pname] : {}
                if(pname.length){
                    pipelineScores["pipeline"] = pname.split(" ")[0]
                }
                else{
                    pipelineScores["pipeline"] = "-"
                }
                pipelineScores["topFeatures"] = pipeline["topFeatures"]
                topFeaturesData.push({"pipeline": pipeline["name"], "features": pipeline["topFeatures"]})
                bestThreeGraphData.push(pipelineScores)
            }

            let selectedPipeline = this.state.selectedPipeline.length ?  this.state.selectedPipeline : pipelineNames.length ? pipelineNames[0] : ""
            this.setState({experiment: exp, durationGraphData: durationGraphData, startTime: exp["startTime"], durations: exp["durations"],
                            endTime: exp["endTime"], experimentName: exp["experimentName"], experimentStatus: exp["experimentStatus"],
                            experimentJob: exp["experimentJob"], trials: exp["allParameters"], bestThreePipelines: exp["bestThreePipelines"],
                            trainedPipelinesResults: exp["pipelineScores"], trialsRankingResults: exp["rankingResults"], features: exp["featureNames"],
                            allPipelineNames: pipelineNames, selectedPipeline: selectedPipeline, bestThreeGraphVariables: bestThreeGraphVariables,
                            bestThreeGraphData: bestThreeGraphData, topFeaturesData: topFeaturesData, optimizer: exp["optimizer"] ? exp["optimizer"] : "-",
                            earlyGuessPunishment: exp["earlyGuessPunishment"] ? exp["earlyGuessPunishment"] : "-",
                            lateGuessPunishment: exp["lateGuessPunishment"] ? exp["lateGuessPunishment"] : "-"}, ()=>console.log(this.state))
        }).catch(e => console.log(e))
    }

    numberByStatus = (status) => {
        const { trials } = this.state
        let numbers = trials.filter(t => t["status"] === status)
        return numbers.length
    }

    calculateDuration = () => {
        let start = this.state.startTime
        let end = this.state.endTime
        if(start && end)
            return new Date((end-start)*1000).toISOString().substring(11,19)
        else
            return "-"
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
            let secs = new Date(this.state.startTime * 1000)
            let dates = secs.toISOString().replace("T", ", ").split(":")
            return dates[0] + ":" + dates[1]
        }
        else if (whichDate === "endTime") {
            let secs = new Date(this.state.endTime * 1000)
            let dates = secs.toISOString().replace("T", ", ").split(":")
            return dates[0] + ":" + dates[1]
        }
    }

    isEvalMetricCustom = (evalMLObjective) => {
        let customObjectives = ["Custom ExpVariance", "Custom MAE", "Custom MaxError", "Custom Mean Squared Log Error", 
            "Custom MedianAE", "Custom MSE", "Custom R2", "Custom Root Mean Squared Error", "Custom Root Mean Squared Log Error"]
        return customObjectives.includes(evalMLObjective)
    }

    render() {
        //let sourcePref = `sources/${this.props.params.sourceID}`
        //let modelID = this.props.params.pipelineID

        return (
            <>
                <Page>
                    <Page.Header fullWidth={false}>
                        <Page.Title title={"AutoML"} />
                        {
                            // this.optionsComponents
                        }
                    </Page.Header>
                    <Breadcrumbs separator="/" aria-label="breadcrumb" style={{ color: '#ffffff', marginLeft: '28px', marginTop: '-10px' }}>
                        <Link color="inherit" to="/">
                            <HomeIcon style={{ marginTop: '4px' }} />
                        </Link>
                        <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/allFactories`}>
                            Factories
                        </Link>
                        <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/production-line/${this.props["match"].params.FID}/${this.props["match"].params.PLID}`}>
                            Production Lines
                        </Link>
                        <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/machines/${this.props["match"].params.FID}/${this.props["match"].params.PLID}`}>
                            Machines
                        </Link>
                        <Link color="inherit" to={`/orgs/${this.props["match"].params["orgID"]}/health/${this.props["match"].params.FID}/${this.props["match"].params.PLID}/${this.props["match"].params.MID}`}>
                            {this.props["match"].params.MID} Health Assessment
                        </Link>  
                        <Typography style={{ color: '#ffffff', marginBottom: '8px' }}>{this.props["match"].params.MID} RULReg AutoML</Typography>                 
                    </Breadcrumbs>
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
                                                <h6>Running: 0</h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Completed: {this.state.trials.length}</h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Stopped: 0</h6>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Failed: 0</h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Idle: 0</h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Timeout: 0</h6>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel>
                                    <br /><br />

                                    <Panel style={{ marginRight: '10px', padding: '5px 20px 5px 20px', marginLeft: '10px' }}>
                                        <Grid.Row style={{ paddingTop: '20px' }}>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <label style={{ fontSize: '14px' }}>
                                                    # Total Elapsed Time: <span style={{ color: "#00C9FF" }}>{this.calculateDuration()}</span>
                                                </label>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <label style={{ fontSize: '14px' }}>
                                                    # Objective: <span style={{ color: "#00C9FF"}}>{this.state.optimizer}</span></label>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel>
                                    <br /><br />
                                    {this.isEvalMetricCustom(this.state.optimizer) && (
                                        <Panel style={{ marginRight: '10px', padding: '5px 20px 5px 20px', marginLeft: '10px' }}>
                                            <Grid.Row style={{ paddingTop: '20px' }}>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <label style={{ fontSize: '14px' }}>
                                                        # Early Guess Punishment: <span style={{ color: "#00C9FF" }}>{this.state.earlyGuessPunishment}</span>
                                                    </label>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <label style={{ fontSize: '14px' }}>
                                                        # Late Guess Punishment:: <span style={{ color: "#00C9FF"}}>{this.state.lateGuessPunishment}</span></label>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Panel>
                                    )}
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
                                                <h6>Number of Features: <span style={{ color: 'green' }}><b>{this.state.features.length}</b></span></h6>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <h6>End Time: {this.state.endTime ? this.formatDate("endTime") : "-"}</h6>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Panel>
                                </Grid.Column>
                            </Grid.Row>
                            <br /><br />
                            {this.state.experiment && <RULRegSubSections
                                params={this.props["match"]["params"]}
                                trialsRankingResults={this.state.trialsRankingResults}
                                durationData={this.state.durationGraphData}
                                experimentJob={this.state.experimentJob}
                                allPipelineNames={this.state.allPipelineNames}
                                selectedPipeline={this.state.selectedPipeline}
                                nodeData={elements(this.state.features, this.state.selectedPipeline, this.state.trials)}
                                changeSelectedPipeline={this.changeSelectedPipeline}
                                bestThreeGraphData={this.state.bestThreeGraphData}
                                bestThreeGraphVariables={this.state.bestThreeGraphVariables}
                                topFeaturesData={this.state.topFeaturesData}
                            />}

                            {/* <SubSections
                                params={this.props["match"]["params"]}
                                durationData={durationData}
                                experimentJob={experimentJob}
                                hyperData={hyperData}
                                nodesData={elements(features, experimentJob)}
                                trialsList={trialsList}
                                trialIntermediates={trialIntermediates}
                                didTimeOut={didTimeOut}
                            /> */}
                        </Grid>
                    </Page.Contents>
                </Page>
            </>
        )
    }
}

export default RULRegAutoMLPage