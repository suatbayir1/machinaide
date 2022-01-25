// Libraries
import React, { PureComponent } from 'react'
import ReactTooltip from 'react-tooltip'

// Components
import {
    Form, Button, ButtonType, ComponentColor, Overlay, IconFont, Grid, Columns,
} from '@influxdata/clockface'
import AllPartsTimelineGraph from "src/dt/components/AllPartsTimelineGraph";
import StepLineGraph from 'src/dt/components/StepLineGraph'
import TimelineGraph from 'src/dt/components/TimelineGraph'

// Images
import graph1 from '../../../assets/images/graph/graph1.jpg';
import graph2 from '../../../assets/images/graph/graph2.jpg';
import graph3 from '../../../assets/images/graph/graph3.jpg';

// Constants
import { GRAPH_COLORS, FAILURE_COLOR, MAINTENANCE_COLOR } from 'src/shared/constants';

type StatusProps = {
    visible: boolean
    onDismiss: () => void
    selectedPart: object
    oldParts: object[]
    currentDeploymentDate: string
    currentFailures: object[]
    currentMaintenanceRecords: object[]
    currentBrandModel: string
    oldFailures: object[]
    oldMaintenanceRecords: object[]
}

type StatusState = {
    allPartsTimelineGraphData: object[]
    maxLifetime: number
    stepLineGraphData: object[]
    stepLineCategories: any[]
    timelineGraphData: object[]
    colors: string[]
}

class StatusOverlay extends PureComponent<StatusProps, StatusState> {
    constructor(props) {
        super(props);

        this.state = {
            allPartsTimelineGraphData: [],
            stepLineGraphData: [],
            stepLineCategories: [],
            timelineGraphData: [],
            colors: [],
            maxLifetime: 0,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.visible !== this.props.visible && this.props.visible) {
            this.setDataForGraphs();
        }
    }

    setDataForGraphs = () => {
        console.log("oldParts", this.props.oldParts);
        //console.log("status page ", this.props)
        let oldParts = this.props.oldParts
        let allPartsTimelineGraphData = []
        let maxLifetime = 0

        let stepLineGraphData = []
        let lifetimeDays = []

        let timelineGraphData = []

        //add current part data
        let currentPartData = {}
        let currentTimelineData = {}
        let currentName = this.props.currentBrandModel.length ? this.props.currentBrandModel : "unknown brand"
        let currentDeploymentDate = this.props.currentDeploymentDate.length ? this.props.currentDeploymentDate.substr(0, 10) : "unknown deployment date"
        currentPartData["name"] = currentName + "-" + currentDeploymentDate
        currentTimelineData["name"] = currentName + "-" + currentDeploymentDate

        let currentGraph1Data = []
        let currentGraph3Data = []
        let currentOldPartBar = {}
        let currentTimelinePart = {}

        currentOldPartBar["x"] = currentName + "-" + currentDeploymentDate
        currentTimelinePart["x"] = "Lifetime"

        let currentY = []
        let currentTimelineY = []
        currentY.push(0)

        let currDeploymentDate = this.props.currentDeploymentDate.length ? this.props.currentDeploymentDate : new Date().toISOString().substr(0, 16)
        let currTerminationDate = new Date().toISOString().substr(0, 16)
        let currLifetime = Math.round((new Date(currTerminationDate).getTime() - new Date(currDeploymentDate).getTime()) / (1000 * 3600 * 24))

        maxLifetime = maxLifetime < currLifetime ? currLifetime : maxLifetime
        currentY.push(currLifetime)
        currentTimelineY.push(new Date(currDeploymentDate).getTime())
        currentTimelineY.push(new Date(currTerminationDate).getTime())

        currentOldPartBar["y"] = currentY
        currentTimelinePart["y"] = currentTimelineY

        currentGraph1Data.push(currentOldPartBar)
        currentGraph3Data.push(currentTimelinePart)

        currentPartData["data"] = currentGraph1Data
        currentTimelineData["data"] = currentGraph3Data

        allPartsTimelineGraphData.push(currentPartData)
        timelineGraphData.push(currentTimelineData)


        for (let oldPart of oldParts) {
            let oldPartData = {}
            let timelineData = {}
            let name = oldPart["brandModelText"] ? oldPart["brandModelText"] : "unknown brand"
            let deploymentDateStr = oldPart["deploymentTime"] ? oldPart["deploymentTime"].substr(0, 10) : "unknown deployment date"
            oldPartData["name"] = name + "-" + deploymentDateStr
            timelineData["name"] = name + "-" + deploymentDateStr
            let graph1Data = []
            let graph3Data = []
            let oldPartBar = {}
            let timelinePart = {}
            oldPartBar["x"] = name + "-" + deploymentDateStr
            timelinePart["x"] = "Lifetime"
            let y = []
            let timelineY = []
            y.push(0)
            let deploymentDate = oldPart["deploymentTime"] ? oldPart["deploymentTime"] : new Date().toISOString().substr(0, 16)
            let terminationDate = oldPart["terminationTime"] ? oldPart["terminationTime"] : new Date().toISOString().substr(0, 16)
            let lifetime = Math.round((new Date(terminationDate).getTime() - new Date(deploymentDate).getTime()) / (1000 * 3600 * 24))
            lifetimeDays.push({ lifetime: lifetime, old: true })
            maxLifetime = maxLifetime < lifetime ? lifetime : maxLifetime
            y.push(lifetime)
            timelineY.push(new Date(deploymentDate).getTime())
            timelineY.push(new Date(terminationDate).getTime())

            oldPartBar["y"] = y
            timelinePart["y"] = timelineY

            graph1Data.push(oldPartBar)
            graph3Data.push(timelinePart)

            oldPartData["data"] = graph1Data
            timelineData["data"] = graph3Data

            allPartsTimelineGraphData.push(oldPartData)
            timelineGraphData.push(timelineData)
        }

        // step graph data build
        let currentState = Math.round((new Date().getTime() - new Date(this.props.currentDeploymentDate).getTime()) / (1000 * 3600 * 24))
        lifetimeDays.push({ lifetime: currentState, old: false })
        lifetimeDays.sort((a, b) => a.lifetime - b.lifetime)
        let stepObj = {}
        let stepData = []
        stepData.push({ x: 0, y: 0 })
        let probability = 0
        for (let day of lifetimeDays) {
            let oneData = {}
            oneData["x"] = day["lifetime"]
            if (day["old"])
                probability = probability + (1 / (lifetimeDays.length - 1))
            oneData["y"] = parseFloat(probability.toFixed(2))
            stepData.push(oneData)
        }
        stepObj["data"] = stepData
        stepLineGraphData.push(stepObj)

        let failuresData = { "name": "Failure" }
        let failureData = []
        let timelineFailuresData = { "name": "Failure" }
        let timelineFailureData = []

        for (let failure of this.props.currentFailures) {
            let fdata = {}
            let timelineFdata = {}

            fdata["x"] = currentName + "-" + currentDeploymentDate
            timelineFdata["x"] = "Lifetime"

            let fy = []
            let timelineFy = []

            //currDeploymentDate
            let failureStartTime = failure["failureStartTime"] ? failure["failureStartTime"] : new Date().toISOString().substr(0, 16)
            let failureEndTime = failure["failureEndTime"] ? failure["failureEndTime"] : failureStartTime

            let y1 = Math.round((new Date(failureStartTime).getTime() - new Date(currDeploymentDate).getTime()) / (1000 * 3600 * 24))
            // y1 = y1<0 ? y1 * -1 : y1
            let y2 = Math.round((new Date(failureEndTime).getTime() - new Date(currDeploymentDate).getTime()) / (1000 * 3600 * 24))
            y2 = y2 < 0 ? y2 * -1 : y2

            // if maintenance day is not in the range of deployment-termination date it will return negative number
            if (y1 < 0) {
                continue
            }

            fy.push(y1)
            fy.push(y2)

            timelineFy.push(new Date(failureStartTime).getTime())
            timelineFy.push(new Date(failureEndTime).getTime())

            fdata["y"] = fy
            timelineFdata["y"] = timelineFy

            failureData.push(fdata)
            timelineFailureData.push(timelineFdata)
        }

        for (let obj of this.props.oldFailures) {
            for (let failure of obj["failures"]) {
                let fdata = {}
                let timelineFdata = {}

                fdata["x"] = obj["name"]
                timelineFdata["x"] = "Lifetime"

                let deploymentDate = obj["deploymentTime"] ? obj["deploymentTime"] : new Date().toISOString().substr(0, 16)

                let fy = []
                let timelineFy = []

                let failureStartTime = failure["startTime"] ? failure["startTime"] : new Date().toISOString().substr(0, 16)
                let failureEndTime = failure["endTime"] ? failure["endTime"] : failureStartTime

                let y1 = Math.round((new Date(failureStartTime).getTime() - new Date(deploymentDate).getTime()) / (1000 * 3600 * 24))
                // y1 = y1<0 ? y1 * -1 : y1
                let y2 = Math.round((new Date(failureEndTime).getTime() - new Date(deploymentDate).getTime()) / (1000 * 3600 * 24))
                y2 = y2 < 0 ? y2 * -1 : y2

                // if maintenance day is not in the range of deployment-termination date it will return negative number
                if (y1 < 0) {
                    continue
                }

                fy.push(y1)
                fy.push(y2)

                timelineFy.push(new Date(failureStartTime).getTime())
                timelineFy.push(new Date(failureEndTime).getTime())

                fdata["y"] = fy
                timelineFdata["y"] = timelineFy

                failureData.push(fdata)
                timelineFailureData.push(timelineFdata)
            }
        }

        let mrecordsData = { "name": "Maintenance" }
        let mrecordData = []
        let timelineMrecordsData = { "name": "Maintenance" }
        let timelineMrecordData = []

        for (let maintenance of this.props.currentMaintenanceRecords) {
            let mdata = {}
            let timelineMdata = {}

            mdata["x"] = currentName + "-" + currentDeploymentDate
            timelineMdata["x"] = "Lifetime"

            let my = []
            let timelineMy = []

            let maintenanceStartTime = maintenance["maintenanceTime"] ? maintenance["maintenanceTime"] : new Date().toISOString().substr(0, 16)

            let y1 = Math.round((new Date(maintenanceStartTime).getTime() - new Date(currDeploymentDate).getTime()) / (1000 * 3600 * 24))

            // if maintenance day is not in the range of deployment-termination date it will return negative number
            // y1 = y1<0 ? y1 * -1 : y1
            if (y1 < 0) {
                continue
            }

            my.push(y1)
            my.push(y1)

            timelineMy.push(new Date(maintenanceStartTime).getTime())
            timelineMy.push(new Date(maintenanceStartTime).getTime())

            mdata["y"] = my
            timelineMdata["y"] = timelineMy

            mrecordData.push(mdata)
            timelineMrecordData.push(timelineMdata)
        }

        for (let obj of this.props.oldMaintenanceRecords) {
            for (let maintenance of obj["maintenanceRecords"]) {
                let mdata = {}
                let timelineMdata = {}

                mdata["x"] = obj["name"]
                timelineMdata["x"] = "Lifetime"

                let deploymentDate = obj["deploymentTime"] ? obj["deploymentTime"] : new Date().toISOString().substr(0, 16)

                let my = []
                let timelineMy = []

                let maintenanceStartTime = maintenance["maintenanceTime"] ? maintenance["maintenanceTime"] : new Date().toISOString().substr(0, 16)

                let y1 = Math.round((new Date(maintenanceStartTime).getTime() - new Date(deploymentDate).getTime()) / (1000 * 3600 * 24))

                // if maintenance day is not in the range of deployment-termination date it will return negative number
                // y1 = y1<0 ? y1 * -1 : y1
                if (y1 < 0) {
                    continue
                }

                my.push(y1)
                my.push(y1)

                timelineMy.push(new Date(maintenanceStartTime).getTime())
                timelineMy.push(new Date(maintenanceStartTime).getTime())

                mdata["y"] = my
                timelineMdata["y"] = timelineMy

                mrecordData.push(mdata)
                timelineMrecordData.push(timelineMdata)
            }
        }

        failuresData["data"] = failureData
        timelineFailuresData["data"] = timelineFailureData

        mrecordsData["data"] = mrecordData
        timelineMrecordsData["data"] = timelineMrecordData

        allPartsTimelineGraphData.push(failuresData)
        allPartsTimelineGraphData.push(mrecordsData)

        timelineGraphData.push(timelineFailuresData)
        timelineGraphData.push(timelineMrecordsData)

        this.setState({
            allPartsTimelineGraphData: allPartsTimelineGraphData,
            maxLifetime: maxLifetime, stepLineGraphData: stepLineGraphData,
            stepLineCategories: this.calculateCats(stepLineGraphData),
            timelineGraphData: timelineGraphData
        })//, ()=>console.log("step state", this.stat
    }

    calculateCats = (stepLineGraphData) => {
        let cats = []
        let data = stepLineGraphData[0] ? stepLineGraphData[0]["data"] ? stepLineGraphData[0]["data"] : [] : []
        for (let d of data) {
            cats.unshift(d["x"])
        }
        return cats
    }

    render() {
        const { visible, onDismiss, selectedPart } = this.props;
        let currentState = Math.round((new Date().getTime() - new Date(this.props.currentDeploymentDate).getTime()) / (1000 * 3600 * 24))
        let colors = [...GRAPH_COLORS.slice(0, this.props.oldParts.length + 1), FAILURE_COLOR, MAINTENANCE_COLOR]

        return (
            <>
                <Overlay visible={visible}>
                    <Overlay.Container maxWidth={1000}>
                        <Overlay.Header
                            title={`Status of ${selectedPart["name"]}`}
                            onDismiss={onDismiss}
                        />

                        <Overlay.Body>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <label style={{ width: "auto" }}>Old {selectedPart["type"]}s Compare Graph</label>
                                    <div
                                        className="graph-tips"
                                        data-for="graph-tips-tooltip1"
                                        data-tip={`<h6>Graph Tips:</h6><img src=${graph1} width="400px" height="200px"/>`}
                                    >
                                        <span style={{ backgroundColor: "#22ADF6" }}>?</span>
                                        <ReactTooltip
                                            id="graph-tips-tooltip1"
                                            effect="solid"
                                            html={true}
                                            place="bottom"
                                            class="influx-tooltip"
                                        />
                                    </div>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Twelve}>
                                    <div style={{ height: 470, maxWidth: 1000 }}>
                                        <AllPartsTimelineGraph
                                            type={selectedPart["type"]}
                                            data={this.state.allPartsTimelineGraphData}
                                            colors={colors}
                                            maxLifetime={this.state.maxLifetime}
                                        />
                                    </div>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Twelve}>
                                    <label style={{ width: "auto" }}>Failure Probability Graph</label>
                                    <div
                                        className="graph-tips"
                                        data-for="graph-tips-tooltip2"
                                        data-tip={`<h1>Graph Tips:</h1><img src=${graph2} width="400px" height="200px"/>`}
                                    >
                                        <span style={{ backgroundColor: "#22ADF6" }}>?</span>
                                        <ReactTooltip
                                            id="graph-tips-tooltip2"
                                            effect="solid"
                                            html={true}
                                            place="bottom"
                                            class="influx-tooltip"
                                        />
                                    </div>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Twelve}>
                                    <div style={{ height: 400, maxWidth: 1000 }}>
                                        <StepLineGraph
                                            type={selectedPart["type"]}
                                            data={this.state.stepLineGraphData}
                                            currentState={currentState}
                                            cats={this.state.stepLineCategories}
                                        />
                                    </div>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Twelve}>
                                    <label style={{ width: "auto" }}>Overall Timeline Graph</label>
                                    <div
                                        className="graph-tips"
                                        data-for="graph-tips-tooltip3" //src={require("../../icons/dashboards-icon.png")} 
                                        data-tip={`<h1>Graph Tips:</h1><img src=${graph3} width="400px" height="200px"/>`}
                                    >
                                        <span style={{ backgroundColor: "#22ADF6" }}>?</span>
                                        <ReactTooltip
                                            id="graph-tips-tooltip3"
                                            effect="solid"
                                            html={true}
                                            place="bottom"
                                            class="influx-tooltip"
                                        />
                                    </div>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Twelve}>
                                    <div style={{ height: 450, maxWidth: 1000 }}>
                                        <TimelineGraph
                                            type={selectedPart["type"]}
                                            data={this.state.timelineGraphData}
                                            colors={colors}
                                        />
                                    </div>
                                </Grid.Column>
                            </Grid.Row>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay >
            </>
        );
    }
}

export default StatusOverlay;