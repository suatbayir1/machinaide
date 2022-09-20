import * as api from './api'
import React, { PureComponent, useState } from 'react'
import { useInterval } from "./useInterval"
import { ResourceCard, Grid, Columns, Button, ButtonType, ComponentColor, IconFont, ComponentStatus, TechnoSpinner, Overlay } from "@influxdata/clockface"
import { Context } from 'src/clockface'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import { InfluxColors } from '@influxdata/clockface'


function CardContextMenu({
    setOverlayOpen
}) {
    return (
      <Context>
        <Context.Menu
          icon={IconFont.Duplicate}
          color={ComponentColor.Primary}
        >
          <Context.Item
            label="Information"
            action={() => setOverlayOpen(true)}
            testID="clone-dashboard"
          />
        </Context.Menu>
        <Context.Menu
          icon={IconFont.Trash}
          color={ComponentColor.Danger}
          testID="context-delete-menu"
        >
          <Context.Item
            label="Delete"
            action={() => console.log("icon click")}
            testID="context-delete-dashboard"
          />
        </Context.Menu>
      </Context>
    )
}

function CellSection({
    model,
    // cellDataReceived
}) {
    let bgColor = ""
    if (model.Status === "running") {
        bgColor = InfluxColors.Emerald
    } else if (model.Status === "idle") {
        bgColor = InfluxColors.Void
    } else if (model.Status === "training") {
        bgColor = InfluxColors.Smoke
    }

    const [overlayOpen, setOverlayOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("tab1")

    // if (model.Status === "training") {
    //     useInterval(async () => {
    //         let obj = await api.getCellData(model.sessionID, model.modelID)
    //         cellDataReceived(obj, model.modelID)
    //     }, 1000)
    // } else {
    //     useInterval(null, 0)
    // }

    return (
        <Grid.Column
            widthXS={Columns.Three}
            widthSM={Columns.Three}
            widthMD={Columns.Three}
            widthLG={Columns.Three}>
                <ResourceCard
                    style={{backgroundColor: bgColor}}
                    key="example-resource-card"
                    testID="example-resource-card"
                    contextMenu={<CardContextMenu setOverlayOpen={setOverlayOpen}/>}
                >
                    {Object.keys(model).map(key => {
                        if (key == "Algorithm") {
                            return (
                                <ResourceCard.Name
                                    name={model[key]}
                                    testID="dashboard-card--name"/>
                            )
                        }
                        else if (key !== "id" && key !== "optional" && key !== "job_specs" && key !== "features" && key!== "_id" && key !== "sessionID" && key !== "modelID" && key !== "Parameters" && key !== "MetaInfo" && key !== "Explanation") {
                            return (
                                <ResourceCard.Description
                                    description={key + ": " + model[key]}/>
                            )
                        }
                    })}
                    <ResourceCard.Meta>
                        {/* {model.Status === "training" ? <TechnoSpinner style={{ width: "30px", height: "30px" }}/> : [ */}
                        {
                        [
                            <Button
                                color={ComponentColor.Primary}
                                // text="Start Session"
                                titleText="Start Task"
                                icon={IconFont.Play}
                                type={ButtonType.Button}
                                onClick={() => console.log("click action")}
                                status={model.Status === "running" ? ComponentStatus.Disabled : ComponentStatus.Valid}/>,
                            <Button
                                color={ComponentColor.Danger}
                                // text="Stop Session"
                                titleText="Cancel Task"
                                icon={IconFont.Remove}
                                type={ButtonType.Button}
                                onClick={() => console.log("click action")}
                                status={model.Status === "running" ? ComponentStatus.Valid : ComponentStatus.Disabled}/>
                        ]}
                    </ResourceCard.Meta>
                </ResourceCard>
                <Overlay visible={overlayOpen}>
                    <Overlay.Container maxWidth={600}>
                    <Overlay.Header
                        title="Information"
                        onDismiss={() => setOverlayOpen(false)}
                    />

                    <Overlay.Body>
                        <TabbedPageTabs
                        tabs={[{
                            text: 'Features',
                            id: 'tab1',
                        },
                        {
                            text: 'Job Specs',
                            id: 'tab2',
                        }]}
                        activeTab={activeTab}
                        onTabClick={(e) => setActiveTab(e)}
                        />
                        <br />
                        <div>{activeTab === "tab1" ? Object.keys(model.features).map(feature => {
                            return <p style={{ fontSize: '16px', fontWeight: 600 }}>{feature + ": " + model.features[feature]}</p>
                        }) : Object.keys(model["job_specs"]).map(spec => {
                            return <p style={{ fontSize: '16px', fontWeight: 600 }}>{spec + ": " + model["job_specs"][spec]}</p>
                        })}</div>
                    </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
                <br/>
        </Grid.Column>
    )
}

export default function TaskSection({
    tasks
}) {
    // if (models.length === 0) {
    //     useInterval(async () => {
    //         let obj = await api.getCellCount(sessionID)
    //         setCellCountAndIDs(obj)
    //     }, 10000)
    // } else {
    //     useInterval(null, 0)
    // }
    // // if (status === "count") {
    //     useInterval(async () => {
    //         let obj = await api.getCellCount(sessionID)
    //         setCellCountAndIDs(obj)
    //     }, 1000)
    // }
    return (
        <Grid>
            {tasks.map((model: any) => {
                return (
                    <CellSection
                        model={model}
                        />
                )
            })}
        </Grid>
    )
}