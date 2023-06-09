import React, { PureComponent } from 'react'
import { Overlay, Grid,
    ButtonType, Button, ComponentColor, Columns, SelectDropdown, Table,
    InfluxColors, Input, ComponentSize, Label, Panel, SpinnerContainer, RemoteDataState, TechnoSpinner} from '@influxdata/clockface'

import ForceGraph2D from "react-force-graph-2d"
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import { Box, Tab, Tabs, Typography } from '@material-ui/core'
import { deleteFieldConfirmationText, sensors } from 'src/shared/constants/tips'


  function ParameterTable (props) {
    // console.log("PARAMTABLE", selectedRootCauseModel)
    const selectedRootCauseModel = props.selectedRootCauseModel
    const rootCauseParams = props.rootCauseParams
    const setRootCauseParams = props.setRootCauseParams
    if(selectedRootCauseModel != "") {
        // const [rootCauseParams, setRootCauseParams] = useState(Array(Object.keys(rootCauseModelParameters[selectedRootCauseModel]).length).fill(0))
        function handleChange(index, newValue) {
            const newValues = rootCauseParams.map((value, j) => {
              if (j === index) {
                // Increment the clicked counter
                return newValue;
              } else {
                // The rest haven't changed
                return value;
              }
            });
            setRootCauseParams(newValues);
        }
        // console.log(rootCauseModelParameters[selectedRootCauseModel])
        return(
            <Table>
            <Table.Header>
                <Table.Row>
                    {Object.keys(rootCauseModelParameters[selectedRootCauseModel]).map(parameter => {
                        return <Table.HeaderCell style={{width: "100px"}}>{parameter}</Table.HeaderCell>
                    })}
                    {/* <Table.HeaderCell style={{width: "100px"}}>Selected Failure</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>Top Level Component</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>Model</Table.HeaderCell> */}
                    {/* <Table.HeaderCell style={{width: "100px"}}>RUL</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>RULREG</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>POF</Table.HeaderCell>
                    <Table.HeaderCell style={{width: "100px"}}>Critical</Table.HeaderCell> */}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Table.Row>
                    {Object.keys(rootCauseModelParameters[selectedRootCauseModel]).map((parameter,i)  => {
                        return <Table.Cell style={{width: "100px"}}>{<Input type={rootCauseModelParameters[selectedRootCauseModel][parameter]["Type"]}
                        value={rootCauseParams[i]} onChange={(e) => {
                            handleChange(i, e.target.value)
                        }}></Input>}</Table.Cell>
                    })}
                    {/* <Table.Cell style={{width: "100px"}}>{this.state.failureToAnalyze}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{this.state.topLevelTreeComponent}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{
                        <SelectDropdown
                        style={{width: "100px"}}
                        buttonColor={ComponentColor.Secondary}
                        options={this.state.rootCauseModels}
                        selectedOption={this.state.selectedRootCauseModel}
                        onSelect={(e) => {
                            this.setState({selectedRootCauseModel: e})
                        }}
                    />
                    }</Table.Cell> */}

                    {/* <Table.Cell style={{width: "100px"}}>{rulModelsCount}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{rulregModelsCount}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{pofModelsCount}</Table.Cell>
                    <Table.Cell style={{width: "100px"}}>{criticalCount}</Table.Cell> */}
                </Table.Row>
            </Table.Body>
        </Table>
        )
    } else {
        return(<></>)
    }
}

const rootCauseModelParameters = {
    "HDBSCAN": {
        "prev_hours": {
            "Type": "Number",
            "Value": 72
        },
        "window_size": {
            "Type": "Number",
            "Value": 30
        },
        "bucket_minutes": {
            "Type": "Number",
            "Value": 5
        }
    }
}

function ParameterInfoTable (props) {
    const usedModel = props.usedModel
    const rootCauseParams = props.rootCauseParams
    console.log("usedModel", props)
    return(
        <Table>
        <Table.Header>
            <Table.Row>
                {Object.keys(rootCauseModelParameters[usedModel]).map(parameter => {
                    return <Table.HeaderCell style={{width: "100px"}}>{parameter}</Table.HeaderCell>
                })}
            </Table.Row>
        </Table.Header>
        <Table.Body>
            <Table.Row>
                {Object.keys(rootCauseModelParameters[usedModel]).map((parameter,i)  => {
                    return <Table.Cell style={{width: "100px"}}>{<Input type={rootCauseModelParameters[usedModel][parameter]["Type"]}
                    value={rootCauseParams[i]} ></Input>}</Table.Cell>
                })}
            </Table.Row>
        </Table.Body>
    </Table>
    )
}
  

interface Props {
    createModelOverlay: boolean
    closeOverlay: ()=>void
    failure: object
    rootCauseModels: string[]
    dtData: object
}

interface State {
    selectedRootCauseModel: string
    rootCauseParams: any[]
    topLevelTreeComponent: string
    compToAnalyze: string
    analysisGraphData: object
    colorInfo: object
    rootCauseGraphData: object
    rootCauseAnalysisInfo: object
    rootCauseTreeLoading: RemoteDataState
    analysisTreeLoading: RemoteDataState
    rootCauseMeasurementSensorInfo: object
}

function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
    createModelOverlay: boolean
    closeOverlay: ()=>void
    failure: object
    rootCauseModels: string[]
    dtData: object
    selectedRootCauseModel: string
    rootCauseParams: any[]
    topLevelTreeComponent: string
    compToAnalyze: string
    rootCauseGraphData: object
    rootCauseTreeLoading: RemoteDataState
    rootCauseMeasurementSensorInfo: object
    handleNodeClick: (e?)=>void
    onRootCauseModelSelect: (e?)=>void
    setRootCauseParameters: (e?)=>void
    startRootCauseAnalysis: (e?)=>void
    onGraphRefresh: (e?)=>void
    setGraphRef: (element?)=>void
  }

interface PrevAnalysisProps {
    children?: React.ReactNode;
    index: number;
    value: number;
    createModelOverlay: boolean
    closeOverlay: ()=>void
    failure: object
    analysisInfo: object
    dtData: object
    rootCauseGraphData: object
    rootCauseTreeLoading: RemoteDataState
    setGraphRef: (element?)=>void
    refreshAnalysisGraph: (topLevelComp?)=>void
}

interface BasicTabProps {
    createModelOverlay: boolean
    closeOverlay: ()=>void
    failure: object
    rootCauseModels: string[]
    dtData: object
    selectedRootCauseModel: string
    rootCauseParams: any[]
    analysisInfo: object
    topLevelTreeComponent: string
    compToAnalyze: string
    rootCauseGraphData: object
    analysisGraphData: object
    rootCauseTreeLoading: RemoteDataState
    analysisTreeLoading: RemoteDataState
    rootCauseMeasurementSensorInfo: object
    handleNodeClick: (e?)=>void
    onRootCauseModelSelect: (e?)=>void
    setRootCauseParameters: (e?)=>void
    startRootCauseAnalysis: (e?)=>void
    onGraphRefresh: (e?)=>void
    setGraphRef: (element?)=>void
    setAnalysisGraphRef: (element?)=>void
    getAnalysisInfo: (failureIDD?)=>void
}

function PrevAnalysisTab(props: PrevAnalysisProps) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Overlay.Header
                    title="Latest Analysis"
                    onDismiss={props.closeOverlay}
                    
                  />

                  <Overlay.Body>
                    <Grid>
                      <Grid.Row /* style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }} */ style={{marginBottom: "10px"}}>
                        <Grid.Column widthXS={Columns.One} /* style={{ margin: "7px" }} */>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Root cause analysis"}
                                description={""}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Twelve} /* style={{ margin: "7px" }} */>
                        <Grid.Column widthXS={Columns.Eight}
                              widthSM={Columns.Eight}
                              widthMD={Columns.Eight}
                              widthLG={Columns.Eight}
                              style={{ marginTop: '20px' }}>
                          <Panel>
                              <Panel.Header size={ComponentSize.ExtraSmall}>
                              </Panel.Header>
                              <Panel.Body size={ComponentSize.ExtraSmall} id={"graphDiv"}>
                                  {Object.keys(props.rootCauseGraphData).length == 0 ? (
                                      <SpinnerContainer
                                      loading={props.rootCauseTreeLoading}
                                      spinnerComponent={<TechnoSpinner />}
                                      />
                                  ):(
                                      <ForceGraph2D
                                      ref={props.setGraphRef}
                                    //   onNodeClick={props.handleNodeClick}
                                      width={1150}
                                      height={500}
                                      linkDirectionalParticles={3}
                                      linkDirectionalParticleWidth={5}
                                      linkDirectionalArrowRelPos={1}
                                      dagMode={'td'}
                                      dagLevelDistance={50}
                                      graphData={props.rootCauseGraphData}/>
                                  ) }
                              </Panel.Body>
                          </Panel>
                        </Grid.Column>
                        <Grid.Column
                                    widthXS={Columns.Four}
                                    widthSM={Columns.Four}
                                    widthMD={Columns.Four}
                                    widthLG={Columns.Four}
                                    style={{ marginTop: '20px' }}
                                >
                                    <Table>
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell style={{width: "100px"}}>Selected Failure</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Top Level Component</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Model</Table.HeaderCell>
                                                {/* <Table.HeaderCell style={{width: "100px"}}>RUL</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>RULREG</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>POF</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Critical</Table.HeaderCell> */}
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell style={{width: "100px"}}>{props.analysisInfo ? props.analysisInfo["failureName"] : ""}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{props.analysisInfo["topLevelTreeComponent"]}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{props.analysisInfo["usedModel"]}</Table.Cell>

                                                {/* <Table.Cell style={{width: "100px"}}>{rulModelsCount}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{rulregModelsCount}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{pofModelsCount}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{criticalCount}</Table.Cell> */}
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>
                                    <br></br>
                                    <br></br>
                                    {props.analysisInfo["usedModel"] !== "" ? (
                                        // this.setState({rootCauseParams: Array(Object.keys(rootCauseModelParameters[selectedRootCauseModel]).length).fill(0)})
                                        <ParameterInfoTable rootCauseParams={props.analysisInfo["usedParameterValues"]} usedModel={props.analysisInfo["usedModel"]}/>

                                    ):(<></>)}
                                    <br></br>
                                    <br></br>
                                    <Button
                                        color={ComponentColor.Secondary}
                                        titleText="Start Root Cause Analysis"
                                        text="REFRESH"
                                        type={ButtonType.Button}
                                        onClick={() => {props.refreshAnalysisGraph(props.analysisInfo["topLevelTreeComponent"])}}
                                    />
                                </Grid.Column>
                        </Grid.Column>
                      </Grid.Row>                      
                    </Grid>
                  </Overlay.Body>
          </Box>
        )}

      </div>
    )
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Overlay.Header
                    title="Root Cause Analysis"
                    onDismiss={props.closeOverlay}
                    
                  />

                  <Overlay.Body>
                    <Grid>
                      <Grid.Row /* style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }} */ style={{marginBottom: "10px"}}>
                        <Grid.Column widthXS={Columns.One} /* style={{ margin: "7px" }} */>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Root cause analysis"}
                                description={""}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Twelve} /* style={{ margin: "7px" }} */>
                        <Grid.Column widthXS={Columns.Eight}
                              widthSM={Columns.Eight}
                              widthMD={Columns.Eight}
                              widthLG={Columns.Eight}
                              style={{ marginTop: '20px' }}>
                          <Panel>
                              <Panel.Header size={ComponentSize.ExtraSmall}>
                              </Panel.Header>
                              <Panel.Body size={ComponentSize.ExtraSmall} id={"graphDiv"}>
                                  {Object.keys(props.rootCauseGraphData).length == 0 ? (
                                      <SpinnerContainer
                                      loading={props.rootCauseTreeLoading}
                                      spinnerComponent={<TechnoSpinner />}
                                      />
                                  ):(
                                      <ForceGraph2D
                                      ref={props.setGraphRef}
                                      onNodeClick={props.handleNodeClick}
                                      width={1150}
                                      height={500}
                                      linkDirectionalParticles={3}
                                      linkDirectionalParticleWidth={5}
                                      linkDirectionalArrowRelPos={1}
                                      dagMode={'td'}
                                      dagLevelDistance={50}
                                      graphData={props.rootCauseGraphData}/>
                                  ) }
                              </Panel.Body>
                          </Panel>
                        </Grid.Column>
                        <Grid.Column
                                    widthXS={Columns.Four}
                                    widthSM={Columns.Four}
                                    widthMD={Columns.Four}
                                    widthLG={Columns.Four}
                                    style={{ marginTop: '20px' }}
                                >
                                    <Table>
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell style={{width: "100px"}}>Selected Failure</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Top Level Component</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Model</Table.HeaderCell>
                                                {/* <Table.HeaderCell style={{width: "100px"}}>RUL</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>RULREG</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>POF</Table.HeaderCell>
                                                <Table.HeaderCell style={{width: "100px"}}>Critical</Table.HeaderCell> */}
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell style={{width: "100px"}}>{props.failure ? props.failure["ARZKOMPTANIM"] : ""}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{props.topLevelTreeComponent}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{
                                                    <SelectDropdown
                                                    style={{width: "100px"}}
                                                    buttonColor={ComponentColor.Secondary}
                                                    options={props.rootCauseModels}
                                                    selectedOption={props.selectedRootCauseModel}
                                                    onSelect={props.onRootCauseModelSelect}
                                                />
                                                }</Table.Cell>

                                                {/* <Table.Cell style={{width: "100px"}}>{rulModelsCount}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{rulregModelsCount}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{pofModelsCount}</Table.Cell>
                                                <Table.Cell style={{width: "100px"}}>{criticalCount}</Table.Cell> */}
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>
                                    <br></br>
                                    <br></br>
                                    {props.selectedRootCauseModel !== "" ? (
                                        // this.setState({rootCauseParams: Array(Object.keys(rootCauseModelParameters[selectedRootCauseModel]).length).fill(0)})
                                        <ParameterTable rootCauseParams={props.rootCauseParams} setRootCauseParams={props.setRootCauseParameters} selectedRootCauseModel={props.selectedRootCauseModel}/>

                                    ):(<></>)}
                                    <br></br>
                                    <br></br>
                                    <Button
                                        color={ComponentColor.Secondary}
                                        titleText="Start Root Cause Analysis"
                                        text="START"
                                        type={ButtonType.Button}
                                        onClick={props.startRootCauseAnalysis}
                                    />
                                    <br></br>
                                    <br></br>
                                    <Button
                                        color={ComponentColor.Secondary}
                                        titleText="Start Root Cause Analysis"
                                        text="REFRESH"
                                        type={ButtonType.Button}
                                        onClick={props.onGraphRefresh}
                                    />
                                </Grid.Column>
                        </Grid.Column>
                      </Grid.Row>                      
                    </Grid>
                  </Overlay.Body>
          </Box>
        )}
      </div>
    );
  }

function BasicTabs(props: BasicTabProps) {
    const [value, setValue] = React.useState(0);
  
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
    };

    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="Root Cause Analysis" {...a11yProps(0)} />
            <Tab label="Previous Analysis" {...a11yProps(1)} />
            {/* <Tab label="Item Three" {...a11yProps(2)} /> */}
          </Tabs>
        </Box>
        <TabPanel value={value} 
        index={0} 
        createModelOverlay={props.createModelOverlay} 
        closeOverlay={props.closeOverlay} 
        failure={props.failure} 
        rootCauseModels={props.rootCauseModels} 
        dtData={props.dtData}
        selectedRootCauseModel={props.selectedRootCauseModel}
        rootCauseParams={props.rootCauseParams}
        topLevelTreeComponent={props.topLevelTreeComponent}
        compToAnalyze={props.compToAnalyze}
        rootCauseGraphData={props.rootCauseGraphData}
        rootCauseTreeLoading={props.rootCauseTreeLoading}
        rootCauseMeasurementSensorInfo={props.rootCauseMeasurementSensorInfo}
        handleNodeClick={props.handleNodeClick}
        onRootCauseModelSelect={props.onRootCauseModelSelect}
        setRootCauseParameters={props.setRootCauseParameters}
        startRootCauseAnalysis={props.startRootCauseAnalysis}
        onGraphRefresh={props.onGraphRefresh}
        setGraphRef={props.setGraphRef}>
          Item One
        </TabPanel>
        <PrevAnalysisTab
        value={value}
        index={1} 
        createModelOverlay={props.createModelOverlay} 
        closeOverlay={props.closeOverlay} 
        failure={props.failure}
        dtData={props.dtData}
        analysisInfo={props.analysisInfo}
        rootCauseTreeLoading={props.analysisTreeLoading}
        refreshAnalysisGraph={props.getAnalysisInfo}
        setGraphRef={props.setAnalysisGraphRef}
        rootCauseGraphData={props.analysisGraphData}
        >

        </PrevAnalysisTab>
        {/* <TabPanel value={value} index={2}>
          Item Three
        </TabPanel> */}
      </Box>
    );
  }

const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const [value, setValue] = React.useState(0);

    setValue(newValue);
};

class RootCauseAnalysisOverlay extends PureComponent<Props, State>{
    private graphRef: React.RefObject<HTMLInputElement>;
    private analysisGraphRef: React.RefObject<HTMLInputElement>;
    state = {
      selectedRootCauseModel: "",
      rootCauseParams: [],
      topLevelTreeComponent: "",
      compToAnalyze: "",
      analysisGraphData: {},
      analysisTreeLoading: RemoteDataState.Loading,
      rootCauseGraphData: {},
      rootCauseAnalysisInfo: {},
      colorInfo:{},
      rootCauseTreeLoading: RemoteDataState.Loading,
      rootCauseMeasurementSensorInfo: {}
    }
 
    componentDidMount(): void {
        console.log(this.props, "props")
        this.createRootCauseGraph()
    }

    setRootCauseParameters = (newParameters) => {
      this.setState({rootCauseParams: newParameters})
    }

    handleRootCauseModelSelect = (e) => {
        this.setState({selectedRootCauseModel: e, rootCauseParams: Array(Object.keys(rootCauseModelParameters[e]).length).fill(0)})
    }

    handleNodeClick = async (node) => {
      let m2s = {}
      // let settings = {
      //     sessionID: Date.now(),
      //     m2s: {},
      //     prev_hours: 72,
      //     window_size: 30,
      //     bucket_minutes: 5
      // }
      // console.log(node)
      this.setState({topLevelTreeComponent: node.id, compToAnalyze: node.id})
      if (Object.keys(node).includes("object")) {
          if (node.object["@type"] == "Interface") {
              node.object.contents.map(component => {
                  component.sensors.map(sensor => {
                      sensor.fields.map(field => {
                          if (!Object.keys(m2s).includes(field.measurement)) {
                              m2s[field.measurement] = [];
                          }
                          m2s[field.measurement].push(field["@id"].replace("F_", ""))
                      })
                  })
              })
          } else if(node.object["@type"] == "Component") {
              node.object.sensors.map(sensor => {
                  sensor.fields.map(field => {
                      if (!Object.keys(m2s).includes(field.measurement)) {
                          m2s[field.measurement] = [];
                      }
                      m2s[field.measurement].push(field["@id"].replace("F_", ""))
                  })
              })
          }

      } else if(node["@type"] == "Component") {
          node.sensors.map(sensor => {
              sensor.fields.map(field => {
                  if (!Object.keys(m2s).includes(field.measurement)) {
                      m2s[field.measurement] = [];
                  }
                  m2s[field.measurement].push(field["@id"].replace("F_", ""))
              })
          })
      } else if(node.type == "Sensor") {
          node.fields.map(field => {
              if (!Object.keys(m2s).includes(field.measurement)) {
                  m2s[field.measurement] = [];
              }
              m2s[field.measurement].push(field["@id"].replace("F_", ""))
          })
      } else if(node.type == "Field") {
          if (!Object.keys(m2s).includes(node.measurement)) {
              m2s[node.measurement] = [];
          }
          m2s[node.measurement].push(node["@id"].replace("F_", ""))
      }

      this.setState({rootCauseMeasurementSensorInfo: m2s})
      // 
      this.createRootCauseGraph()

  }

  onGraphRefresh = async () => {
    this.setState({compToAnalyze: this.props.failure.sid})
    await this.createRootCauseGraph()
    await this.getRootCauseAnalysis(this.props.failure.IDD)
  }

  createRootCauseGraph = async () => {
    const nodes = []
    const links =  []
    console.log(this.state.colorInfo)

    // console.log(this.props.dtData, "dt")
    if (Object.keys(this.props.dtData["machines"]).includes(this.state.compToAnalyze)) {
        let itemOfInterest = this.props.dtData["machines"][this.state.compToAnalyze]
        nodes.push(Object.assign({
            id: this.state.compToAnalyze,
            color: "red",
            size: 400,
            symbolType: "circle",
            src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/machine.jpg",
        }, itemOfInterest));
        itemOfInterest["object"]["contents"].map(component => {
            if (component["@type"] !== "Component") {
                return;
            }

            nodes.push(Object.assign({
                id: component?.name,
                color: "#BC544B",
                size: 300,
                symbolType: "square",
                src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/component.png",
            }, component))

            links.push({
                source: component?.parent,
                target: component?.name
            })

            component["sensors"].map(sensor => {
                nodes.push(Object.assign({
                    id: sensor?.name,
                    color: "orange",
                    size: 300,
                    symbolType: "triangle",
                    src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/sensor.jpg",
                }, sensor))

                links.push({
                    source: sensor?.parent,
                    target: sensor?.name
                })
                sensor["fields"].map(field => {
                    // fields.push(field);

                    nodes.push(Object.assign({
                        id: field?.["name"],
                        color: "purple",
                        size: 300,
                        symbolType: "triangle",
                        src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/measurement.jpg",
                    }, field))

                    links.push({
                        source: field?.parent,
                        target: field?.name
                    })
                })
            })
        })

        const returnData = {
            nodes,
            links
        }

        this.setState({rootCauseGraphData: returnData, rootCauseTreeLoading: RemoteDataState.Done})

        await this.initialCameraPosition();
    } else if(Object.keys(this.props.dtData["components"]).includes(this.state.compToAnalyze)) {
        let itemOfInterest = this.props.dtData["components"][this.state.compToAnalyze]

        nodes.push(Object.assign({
            id: this.state.compToAnalyze,
            color: "#BC544B",
            size: 400,
            symbolType: "circle",
            src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/component.jpg",
        }, itemOfInterest));
        itemOfInterest["object"]["sensors"].map(sensor => {
            nodes.push(Object.assign({
                id: sensor?.name,
                color: "orange",
                size: 300,
                symbolType: "triangle",
                src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/sensor.jpg",
            }, sensor))

            links.push({
                source: sensor?.parent,
                target: sensor?.name
            })
            sensor["fields"].map(field => {
                // fields.push(field);

                nodes.push(Object.assign({
                    id: field?.["name"],
                    color: "purple",
                    size: 300,
                    symbolType: "triangle",
                    src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/measurement.jpg",
                }, field))

                links.push({
                    source: field?.parent,
                    target: field?.name
                })
            })
        })

        const returnData = {
            nodes,
            links
        }

        this.setState({rootCauseGraphData: returnData, rootCauseTreeLoading: RemoteDataState.Done})

        await this.initialCameraPosition();
    }
}

createAnalysisGraph = async (topLevelComp) => {
    const nodes = []
    const links =  []
    console.log(this.state.colorInfo, "colorInfo")

    // console.log(this.props.dtData, "dt")
    if (Object.keys(this.props.dtData["machines"]).includes(topLevelComp)) {
        let itemOfInterest = this.props.dtData["machines"][topLevelComp]
        nodes.push(Object.assign({
            id: topLevelComp,
            color: "#BC544B",
            size: 400,
            symbolType: "circle",
            src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/machine.jpg",
        }, itemOfInterest));
        itemOfInterest["object"]["contents"].map(component => {
            if (component["@type"] !== "Component") {
                return;
            }

            nodes.push(Object.assign({
                id: component?.name,
                color: Object.keys(this.state.colorInfo).includes(component?.name) ? this.state.colorInfo[component?.name] : "green",
                size: 300,
                symbolType: "square",
                src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/component.png",
            }, component))

            links.push({
                source: component?.parent,
                target: component?.name
            })

            component["sensors"].map(sensor => {
                nodes.push(Object.assign({
                    id: sensor?.name,
                    color: Object.keys(this.state.colorInfo).includes(sensor?.name) ? this.state.colorInfo[sensor?.name] : "green",
                    size: 300,
                    symbolType: "triangle",
                    src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/sensor.jpg",
                }, sensor))

                links.push({
                    source: sensor?.parent,
                    target: sensor?.name
                })
                sensor["fields"].map(field => {
                    // fields.push(field);

                    nodes.push(Object.assign({
                        id: field?.["name"],
                        color: Object.keys(this.state.colorInfo).includes(field?.name) ? this.state.colorInfo[field?.name] : "green",
                        size: 300,
                        symbolType: "triangle",
                        src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/measurement.jpg",
                    }, field))

                    links.push({
                        source: field?.parent,
                        target: field?.name
                    })
                })
            })
        })

        const returnData = {
            nodes,
            links
        }

        this.setState({analysisGraphData: returnData, analysisTreeLoading: RemoteDataState.Done})

        await this.analysisCameraPosition();
    } else if(Object.keys(this.props.dtData["components"]).includes(topLevelComp)) {
        let itemOfInterest = this.props.dtData["components"][topLevelComp]

        nodes.push(Object.assign({
            id: topLevelComp,
            color: Object.keys(this.state.colorInfo).includes(topLevelComp) ? this.state.colorInfo[topLevelComp] : "green",
            size: 400,
            symbolType: "circle",
            src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/component.jpg",
        }, itemOfInterest));
        itemOfInterest["object"]["sensors"].map(sensor => {
            nodes.push(Object.assign({
                id: sensor?.name,
                color: Object.keys(this.state.colorInfo).includes(sensor?.name) ? this.state.colorInfo[sensor?.name] : "green",
                size: 300,
                symbolType: "triangle",
                src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/sensor.jpg",
            }, sensor))

            links.push({
                source: sensor?.parent,
                target: sensor?.name
            })
            sensor["fields"].map(field => {
                // fields.push(field);
                console.log(field.name)
                nodes.push(Object.assign({
                    id: field?.["name"],
                    color: Object.keys(this.state.colorInfo).includes(field?.["name"]) ? this.state.colorInfo[field?.name] : "green",
                    size: 300,
                    symbolType: "triangle",
                    src: "/home/machinaide/project/machinaide/influxdb/ui/assets/images/graph/measurement.jpg",
                }, field))

                links.push({
                    source: field?.parent,
                    target: field?.name
                })
            })
        })

        const returnData = {
            nodes,
            links
        }

        this.setState({analysisGraphData: returnData, analysisTreeLoading: RemoteDataState.Done})

        await this.analysisCameraPosition();
    }
}

    initialCameraPosition = async () => {
        // this.graphRef.zoom(1, 2000);
        this.graphRef.centerAt(0, 0, 2000)
        this.graphRef.d3Force('collide', d3.forceCollide(5));
    }

    analysisCameraPosition = async() => {
        this.analysisGraphRef.centerAt(0, 0, 2000)
        this.analysisGraphRef.d3Force('collide', d3.forceCollide(5));
    }

    startRootCauseAnalysis = async () => {
        let settings = {
            sessionID: Date.now().toString(),
            m2s: this.state.rootCauseMeasurementSensorInfo,
            end_date: this.props.failure ? this.props.failure["endTime"] : "",
            failureIDD: this.props.failure ? this.props.failure.IDD : "",
            failureName: this.props.failure ? this.props.failure["ARZKOMPTANIM"] : "",
            topLevelTreeComponent: this.state.topLevelTreeComponent,
            usedModel: this.state.selectedRootCauseModel
        }
        Object.keys(rootCauseModelParameters[this.state.selectedRootCauseModel]).forEach((parameter, i) => {
            settings[parameter] = this.state.rootCauseParams[i]
        })

        console.log(settings)
        const test = await HealthAssessmentService.startRootCauseAnalysis(settings)
    }

    setGraphRef = (element) => {
        this.graphRef = element
    }

    setAnalysisGraphRef = (element) => {
        this.analysisGraphRef = element
    }

    calculateColors = (helperInfo, anoInfo) => {
        let colorInfo = {}
        let colorScores = {}
        console.log(anoInfo, "anoInfo")
        console.log(helperInfo, "helperInfo")
        if(Object.keys(this.props.dtData["components"]).includes(helperInfo["topLevelTreeComponent"])) {
            colorInfo[this.props.dtData["components"][helperInfo["topLevelTreeComponent"]].object.name] = "#BC544B"
            Object.keys(helperInfo["result"]).forEach(anoField=> {
                let innerTotal = helperInfo["result"][anoField].reduce((a, b) => {return a + b})
                if (innerTotal === 0) {
                    colorScores["F_" + anoField] = 0
                    return;
                }
                helperInfo["result"][anoField].forEach((anoCount, i) => {
                    if(!Object.keys(colorScores).includes("F_" + anoField)) {colorScores["F_" + anoField] = 0}
                    if(i < helperInfo["result"][anoField].length/2) {
                        // colorScores["F_" + anoField] += (((i + (anoCount) / (innerTotal)) / helperInfo["result"][anoField].length)) * ((anoCount) / (innerTotal)) * innerTotal / anoInfo["allSum"]
                        colorScores["F_" + anoField] += 0.5 * ((anoCount) / (innerTotal)) * innerTotal / anoInfo["allSum"]

                    } else {
                        colorScores["F_" + anoField] += ((anoCount) / (innerTotal)) * innerTotal / anoInfo["allSum"]
                    }
                })
            })

            Object.keys(colorScores).forEach(anoField => {
                if(colorScores[anoField] > 0.7) {
                    colorInfo[anoField] = "#9B1003"
                } else if(colorScores[anoField] > 0.5) {
                    colorInfo[anoField] = "#BC544B"
                } else {
                    colorInfo[anoField] = "green"
                }
                this.props.dtData["components"][helperInfo["topLevelTreeComponent"]]["object"]["sensors"].forEach(sensor => {
                    if (!Object.keys(colorInfo).includes(sensor.name))
                        colorInfo[sensor.name] = "green"
                    sensor.fields.forEach(dtField => {
                        console.log(dtField.name, anoField, "anfld")
                        if(dtField.name === anoField) {
                            console.log(dtField.name, colorInfo[dtField.name])
                            if (colorInfo[dtField.name] === "green") {
                                return
                            }
                            colorInfo[sensor.name] = "#BC544B"

                        }
                    })
                    // colorInfo[sensor.name] 
                })
            })
            
            // Object.keys(anoInfo).forEach(field=> {
            //     // if(field === "Yaglama_sic_act")
            //     //     return;
            //     // colorInfo["F_" + field] = "#BC544B"
            //     // this.props.dtData["components"][helperInfo["topLevelTreeComponent"]]["object"]["sensors"].forEach(sensor => {
            //     //     sensor.fields.forEach(dtField => {
            //     //         if(dtField.name === "F_" + field) {
            //     //             colorInfo[sensor.name] = "#BC544B"
            //     //         }
            //     //     })
            //     // })

            // })
        }
        console.log(colorScores, "helperInfo", "anoInfo")
        

        this.setState({colorInfo: colorInfo})
    }

    getRootCauseAnalysis = async (failureIDD) => {
        function percentage(partialValue, totalValue) {
            return (100 * partialValue) / totalValue;
        } 
        const info = await HealthAssessmentService.getRootCauseAnalysis(failureIDD)
        let colorCalculationInfo = {
            allSum: 0,
            percentageArray: []
        }
        // let allSum = 0
        // let percentageArray = []
        info.result["ALL"].forEach(count => {
            colorCalculationInfo.allSum += count
        })
        let runningSum = 0
        info.result["ALL"].forEach(count => {
            runningSum += count
            colorCalculationInfo.percentageArray.push(percentage(runningSum, colorCalculationInfo.allSum))
        })

        Object.keys(info.result).forEach(field => {
            if (field !== "ALL") {
                let allSumPartial = 0
                colorCalculationInfo[field] = []
                let runningSumPartial = 0
                info.result[field].forEach(count => {
                    allSumPartial += count
                })
                info.result[field].forEach(count => {
                    runningSumPartial += count
                    colorCalculationInfo[field].push(percentage(runningSumPartial, allSumPartial))
                })
            }
        })

        console.log(colorCalculationInfo)
        this.calculateColors(info, colorCalculationInfo)
        this.setState({rootCauseAnalysisInfo: info})
        // console.log(info, failureIDD)
    }



    public render(){

        return(
            <>
            <Overlay visible={this.props.createModelOverlay}>
                <Overlay.Container maxWidth={2000}>
                  <BasicTabs createModelOverlay={this.props.createModelOverlay} 
                  closeOverlay={this.props.closeOverlay} 
                  failure={this.props.failure} 
                  rootCauseModels={this.props.rootCauseModels} 
                  dtData={this.props.dtData}
                  selectedRootCauseModel={this.state.selectedRootCauseModel}
                  rootCauseParams={this.state.rootCauseParams}
                  topLevelTreeComponent={this.state.topLevelTreeComponent}
                  compToAnalyze={this.state.compToAnalyze}
                  rootCauseGraphData={this.state.rootCauseGraphData}
                  rootCauseTreeLoading={this.state.rootCauseTreeLoading}
                  rootCauseMeasurementSensorInfo={this.state.rootCauseMeasurementSensorInfo}
                  handleNodeClick={this.handleNodeClick}
                  onRootCauseModelSelect={this.handleRootCauseModelSelect}
                  setRootCauseParameters={this.setRootCauseParameters}
                  startRootCauseAnalysis={this.startRootCauseAnalysis}
                  onGraphRefresh={this.onGraphRefresh}
                  setGraphRef={this.setGraphRef}
                  analysisInfo={this.state.rootCauseAnalysisInfo}
                  getAnalysisInfo={this.createAnalysisGraph}
                  analysisGraphData={this.state.analysisGraphData}
                  setAnalysisGraphRef={this.setAnalysisGraphRef}
                  analysisTreeLoading={this.state.analysisTreeLoading}
                  />
                </Overlay.Container>
            </Overlay>
            </>
        )
    }
}

export default RootCauseAnalysisOverlay