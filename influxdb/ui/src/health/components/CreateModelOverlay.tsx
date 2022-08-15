import React, { PureComponent } from 'react'
import { Overlay, Grid,
    ButtonType, Button, ComponentColor, Columns, SelectDropdown,
    InfluxColors, ComponentSize, Label, Input, MultiSelectDropdown,
    InputType,
    DapperScrollbars, AlignItems, InputToggleType,} from '@influxdata/clockface'
import {ANOMALY_DETECTION_TASK, RUL_TASK, 
        RULREG_TASK, POF_TASK} from '../constants'
import AutoMLSettingsOverlay from "src/health/components/AutoMLSettingsOverlay"
import uuid from 'uuid'

// Services
import DTService from 'src/shared/services/DTService';
import FailureService from 'src/shared/services/FailureService'
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import AutoMLService from 'src/shared/services/AutoMLService'

const optimizers = {
  'Accuracy': 'accuracy',
  'Validation Accuracy': 'val_accuracy',
  'Loss': 'loss',
  'Validation Loss': 'val_loss',
  'Mean Squared Error': 'mse',
  'AUC (Area Under The Curve)': 'auc',
  'True Positives': 'tp',
  'True Negatives': 'tn',
  'False Positives': 'fp',
  'False Negatives': 'fn',
  'Precision': 'precision',
  'Recall': 'recall',
  'Custom': 'custom',
}

interface Props {
    handleChangeNotification: (type: string, message: string) => void
    username: string
    createModelOverlay: boolean
    closeOverlay: () => void
    isComponent: boolean
    parentParams: object
}

interface State {
    task: string
    tasks: string[]
    database: string
    databases: string[]
    measurement: string
    measurements: string[]
    field: string
    fields: string[]
    product: string
    products: string[]
    numberOfDaysThreshold: string
    assetTypes: string[]
    assetType: string
    digitalTwin: object
    asset: object
    assetNames: string[]
    assetName: string
    assetChildren: object[]
    assets: object
    windowSize: string
    // 20.06.22
    allProductionLines: object[]
    allProductionLinesMenu: string[]
    selectedProductionLines: string[]

    allMachines: object[]
    allMachinesMenu: string[]
    selectedMachines: string[]

    allComponents: object[]
    allComponentsMenu: string[]
    selectedComponents: string[]

    allSensors: object[]
    allSensorsMenu: string[]
    selectedSensors: string[]

    allFields: object[]
    allFieldsMenu: string[]
    selectedFields: string[]

    failures: object
    uniqueFailureAssets: string[]
    selectedAsset: string

    modelName: string

    autoMLSettingsOverlay: boolean
    autoMLSettings: object
}

class CreateModelOverlay extends PureComponent<Props, State>{
    state = {
        task: "",
        tasks: [ANOMALY_DETECTION_TASK, RUL_TASK, RULREG_TASK, POF_TASK],
        database: "",
        databases: [],
        measurement: "",
        measurements: [],
        field: "",
        fields: [],
        product: "None",
        products: ["None"],
        numberOfDaysThreshold: "30",
        assetTypes: ["Production Line", "Machine", "Component"],
        assetType: "",
        digitalTwin: null,
        assets: {"productionLines": {}, "machines": {}, "components": {}, "sensors": {}, "fields": {}},
        asset: null,
        assetNames: [],
        assetName: "",
        assetChildren: [],
        windowSize: "30",
        //20.06.22
        allProductionLines: [],
        allProductionLinesMenu: [],
        selectedProductionLines: [],
        allMachines: [],
        allMachinesMenu: [],
        selectedMachines: [],
        allComponents: [],
        allComponentsMenu: [],
        selectedComponents: [],

        allSensors: [],
        allSensorsMenu: [],
        selectedSensors: [],

        allFields: [],
        allFieldsMenu: [],
        selectedFields: [],

        failures: {},
        uniqueFailureAssets: [],
        selectedAsset: "",

        modelName: "",

        autoMLSettingsOverlay: false,
        autoMLSettings: {}
    }

    async componentDidMount() {
      console.log("parent params", this.props)
      let dt = await DTService.getAllDT();
      let autoMLSettings = await AutoMLService.getAutoMLSettings()
      this.setState({autoMLSettings: autoMLSettings}, ()=>console.log("automl settings, ", autoMLSettings))
      
      let assets = {"productionLines": {}, "machines": {}, "components": {}, "sensors": {}, "fields": {}}
      dt = dt[0] ? dt[0] : {}
      let pls = dt["productionLines"] ? dt["productionLines"] : []
      console.log(dt, pls)
      for(let pl of pls){
        console.log(pl)
        assets["productionLines"][pl["@id"]] = {"name": pl["name"], "object": pl}
        let machines = pl["machines"]
        for(let machine of machines){
          assets["machines"][machine["@id"]] = {"name": pl["name"] + "." + machine["name"], "object": machine}
          let contents = machine["contents"]
          for(let content of contents){
            if(content["@type"] === "Component"){
              assets["components"][content["@id"]] = {"name": pl["name"] + "." + machine["name"] + "." + content["name"], "object": content}
              let sensors = content["sensors"]
              for(let sensor of sensors){
                assets["sensors"][sensor["@id"]] = {"name": pl["name"] + "." + machine["name"] + "." + content["name"] + "." + sensor["name"], "object": sensor}
                let fields = sensor["fields"]
                for(let field of fields){
                  field["database"] = dt["bucket"]
                  assets["fields"][field["@id"]] = {"name": pl["name"] + "." + machine["name"] + "." + content["name"] + "." + sensor["name"] + "." + field["name"], "object": field}
                }
              }
            }
          }
        }        
      }
      console.log("assets:", assets)
      let allProductionLines = Object.entries(assets["productionLines"]).map(x=>x[1])
      let allProductionLinesMenu = Object.entries(assets["productionLines"]).map(x=>x[1]["name"])

      let allMachines = Object.entries(assets["machines"]).map(x=>x[1])
      let allMachinesMenu = Object.entries(assets["machines"]).map(x=>x[1]["name"])

      let allComponents = Object.entries(assets["components"]).map(x=>x[1])
      let allComponentsMenu = Object.entries(assets["components"]).map(x=>x[1]["name"])

      if(!this.props.isComponent){
        // if we are in machine health assessment page
        let mid = this.props.parentParams["MID"]
        allComponents = allComponents.filter(c=>c["object"]["parent"] === mid)
        allComponentsMenu = allComponents.map(c=>c["name"])

        let allSensors = Object.entries(assets["sensors"]).map(x=>x[1]).filter(s=>s["name"].includes(`.${mid}.`))
        let allSensorsMenu = allSensors.map(s=>s["name"])
        // console.log("------", allSensors, allSensorsMenu)

        let allFields = Object.entries(assets["fields"]).map(x=>x[1]).filter(f=>f["name"].includes(`.${mid}.`))
        let allFieldsMenu = allFields.map(c=>c["name"])
        //console.log("------", allFields, allFieldsMenu)

        let failures = await FailureService.getAllFailures()
        let uniqueFailureAssets = {}
        failures.forEach(failure=>{
          if(failure["sourceName"].includes(mid) && (failure["sourceName"] in uniqueFailureAssets)){
            uniqueFailureAssets[failure["sourceName"]].push(failure)
          }
          else if(failure["sourceName"].includes(mid)){
            uniqueFailureAssets[failure["sourceName"]] = [failure]
          }
        })
        console.log("--failures: ", uniqueFailureAssets, Object.keys(uniqueFailureAssets))

        this.setState({digitalTwin: dt, assets: assets, allProductionLines: allProductionLines, 
          allProductionLinesMenu: allProductionLinesMenu, selectedProductionLines: allProductionLinesMenu,
          allMachines: allMachines, allMachinesMenu: allMachinesMenu, selectedMachines: allMachinesMenu,
          allComponents: allComponents, allComponentsMenu: allComponentsMenu, selectedComponents: allComponentsMenu,
          allSensors: allSensors, allSensorsMenu: allSensorsMenu, selectedSensors: allSensorsMenu,
          allFields: allFields, allFieldsMenu: allFieldsMenu, selectedFields: allFieldsMenu,
          failures: uniqueFailureAssets, uniqueFailureAssets: Object.keys(uniqueFailureAssets)}, ()=>console.log(this.state))
      }
      else{
        // if we are in component health assessment page
        let mid = this.props.parentParams["MID"]
        let cid = this.props.parentParams["CID"]
        allComponents = [allComponents.find(c=>c["object"]["@id"] === cid)]
        allComponentsMenu = allComponents.map(c=>c["name"])
        console.log("comps------", allComponents, allComponentsMenu)

        let allSensors = Object.entries(assets["sensors"]).map(x=>x[1]).filter(s=>s["name"].includes(`.${mid}.${cid}.`))
        let allSensorsMenu = allSensors.map(s=>s["name"])
        // console.log("------", allSensors, allSensorsMenu)

        let allFields = Object.entries(assets["fields"]).map(x=>x[1]).filter(f=>f["name"].includes(`.${mid}.${cid}.`))
        let allFieldsMenu = allFields.map(c=>c["name"])
        //console.log("------", allFields, allFieldsMenu)

        let failures = await FailureService.getAllFailures()
        let uniqueFailureAssets = {}
        failures.forEach(failure=>{
          if(failure["sourceName"].includes(`${mid}.${cid}`) && (failure["sourceName"] in uniqueFailureAssets)){
            uniqueFailureAssets[failure["sourceName"]].push(failure)
          }
          else if(failure["sourceName"].includes(`${mid}.${cid}`)){
            uniqueFailureAssets[failure["sourceName"]] = [failure]
          }
        })
        console.log("--failures: ", uniqueFailureAssets, Object.keys(uniqueFailureAssets))

        this.setState({digitalTwin: dt, assets: assets, allProductionLines: allProductionLines, 
          allProductionLinesMenu: allProductionLinesMenu, selectedProductionLines: allProductionLinesMenu,
          allMachines: allMachines, allMachinesMenu: allMachinesMenu, selectedMachines: allMachinesMenu,
          allComponents: allComponents, allComponentsMenu: allComponentsMenu, selectedComponents: allComponentsMenu,
          allSensors: allSensors, allSensorsMenu: allSensorsMenu, selectedSensors: allSensorsMenu,
          allFields: allFields, allFieldsMenu: allFieldsMenu, selectedFields: allFieldsMenu,
          failures: uniqueFailureAssets, uniqueFailureAssets: Object.keys(uniqueFailureAssets)}, ()=>console.log(this.state))
        
      }

      /* let allSensors = Object.entries(assets["sensors"]).map(x=>x[1])
      let allSensorsMenu = Object.entries(assets["sensors"]).map(x=>x[1]["name"])

      let allFields = Object.entries(assets["fields"]).map(x=>x[1])
      let allFieldsMenu = Object.entries(assets["fields"]).map(x=>x[1]["name"])

      console.log(allSensors, allFields)

      let failures = await FailureService.getAllFailures()
      let uniqueFailureAssets = {}
      failures.forEach(failure=>{
        if(failure["sourceName"] in uniqueFailureAssets){
          uniqueFailureAssets[failure["sourceName"]].push(failure)
        }
        else{
          uniqueFailureAssets[failure["sourceName"]] = [failure]
        }
      })
      console.log("failures: ", uniqueFailureAssets, Object.keys(uniqueFailureAssets))

      this.setState({digitalTwin: dt, assets: assets, allProductionLines: allProductionLines, 
        allProductionLinesMenu: allProductionLinesMenu, selectedProductionLines: allProductionLinesMenu,
        allMachines: allMachines, allMachinesMenu: allMachinesMenu, selectedMachines: allMachinesMenu,
        allComponents: allComponents, allComponentsMenu: allComponentsMenu, selectedComponents: allComponentsMenu,
        allSensors: allSensors, allSensorsMenu: allSensorsMenu, selectedSensors: allSensorsMenu,
        allFields: allFields, allFieldsMenu: allFieldsMenu, selectedFields: allFieldsMenu,
        failures: uniqueFailureAssets, uniqueFailureAssets: Object.keys(uniqueFailureAssets)}, ()=>console.log(this.state)) */

    }

    getAssets = () => {
      let type = this.state.assetType
      if(type === "Production Line"){
        let assets = this.state.assets
        let pls = assets["productionLines"]
        let assetNames = Object.entries(pls).map(x=>x[1]["name"])
        this.setState({assetNames: assetNames})
      }
      else if(type === "Machine"){
        let assets = this.state.assets
        let machines = assets["machines"]
        let assetNames = Object.entries(machines).map(x=>x[1]["name"])
        this.setState({assetNames: assetNames})
      }
      else if(type === "Component"){
        let assets = this.state.assets
        let comps = assets["components"]
        let assetNames = Object.entries(comps).map(x=>x[1]["name"])
        this.setState({assetNames: assetNames})
      }
    }

    getChildren = () => {
      let type = this.state.assetType
      if(type === "Production Line"){
        let assets = this.state.assets
        let pls = assets["productionLines"]
        pls = Object.entries(pls)
        console.log(pls)
        let pl = pls.find(x=>{
          console.log("--", x[0], this.state.assetName)
          return x[0] === this.state.assetName
        })
        pl = pl.length ? pl[1] : {}
        pl = pl["object"] ? pl["object"] : {}
        console.log("pl",pl)
        let children = pl["machines"] ? pl["machines"] : []
        this.setState({asset: pl, assetChildren: children}, ()=> console.log("get child", this.state))
      }
      else if(type === "Machine"){
        let assets = this.state.assets
        let machines = assets["machines"]
        machines = Object.entries(machines)
        let machine = machines.find(x=>{
          console.log("--", x[0], this.state.assetName)
          return x[0] === this.state.assetName
        })
        machine = machine.length ? machine[1] : {}
        machine = machine["object"] ? machine["object"] : {}
        console.log("machine",machine)
        let children = machine["contents"] ? machine["contents"] : []
        this.setState({asset: machine, assetChildren: children}, ()=> console.log("get child", this.state))
      }
      else if(type === "Component"){
        let assets = this.state.assets
        let comps = assets["components"]
        let assetNames = Object.entries(comps).map(x=>x[1]["name"])
        this.setState({assetNames: assetNames})
      }
    }

    onSelectProductionLine = (selectedProductionLine: string) => {
      const {selectedProductionLines} = this.state
      const {selectedMachines, selectedComponents, selectedSensors, selectedFields} = this.state
      if (selectedProductionLines.includes(selectedProductionLine)) {
        const filteredOptions = selectedProductionLines.filter(o => o !== selectedProductionLine)
        // deselect all the related ones
        const filteredMachines = selectedMachines.filter(o => !o.includes(selectedProductionLine))
        const filteredComponents = selectedComponents.filter(o => !o.includes(selectedProductionLine))
        const filteredSensors = selectedSensors.filter(o => !o.includes(selectedProductionLine))
        const filteredFields = selectedFields.filter(o => !o.includes(selectedProductionLine))
        return this.setState({selectedProductionLines: filteredOptions, selectedMachines: filteredMachines, selectedComponents: filteredComponents,
          selectedSensors: filteredSensors, selectedFields: filteredFields})
      }

      const filteredOptions = [...selectedProductionLines, selectedProductionLine]
      // select all the related ones
      const {allMachinesMenu, allComponentsMenu, allSensorsMenu, allFieldsMenu} = this.state
      const filteredMachines = allMachinesMenu.filter(o => o.includes(selectedProductionLine) && !selectedMachines.includes(o))
      const filteredComponents = allComponentsMenu.filter(o => o.includes(selectedProductionLine) && !selectedComponents.includes(o))
      const filteredSensors = allSensorsMenu.filter(o => o.includes(selectedProductionLine) && !selectedSensors.includes(o))
      const filteredFields = allFieldsMenu.filter(o => o.includes(selectedProductionLine) && !selectedFields.includes(o))
      this.setState({selectedProductionLines: filteredOptions, selectedMachines: filteredMachines, selectedComponents: filteredComponents, 
        selectedSensors: filteredSensors, selectedFields: filteredFields})
    }

    onSelectMachine = (selectedMachine: string) => {
      const {selectedMachines} = this.state
      const {selectedComponents, selectedSensors, selectedFields} = this.state
      if (selectedMachines.includes(selectedMachine)) {
        const filteredOptions = selectedMachines.filter(o => o !== selectedMachine)
        // deselect all the related ones
        const filteredComponents = selectedComponents.filter(o => !o.includes(selectedMachine))
        const filteredSensors = selectedSensors.filter(o => !o.includes(selectedMachine))
        const filteredFields = selectedFields.filter(o => !o.includes(selectedMachine))
        return this.setState({selectedMachines: filteredOptions, selectedComponents: filteredComponents,
          selectedSensors: filteredSensors, selectedFields: filteredFields})
      }

      const filteredOptions = [...selectedMachines, selectedMachine]
      // select all the related ones
      const {allComponentsMenu, allSensorsMenu, allFieldsMenu} = this.state
      const filteredComponents = allComponentsMenu.filter(o => o.includes(selectedMachine) && !selectedComponents.includes(o))
      const filteredSensors = allSensorsMenu.filter(o => o.includes(selectedMachine) && !selectedSensors.includes(o))
      const filteredFields = allFieldsMenu.filter(o => o.includes(selectedMachine) && !selectedFields.includes(o))
      this.setState({selectedMachines: filteredOptions, selectedComponents: [...selectedComponents, ...filteredComponents],
        selectedSensors: [...selectedSensors, ...filteredSensors], selectedFields: [...selectedFields, ...filteredFields]})
    }

    onSelectComponent = (selectedComponent: string) => {
      const {selectedComponents} = this.state
      const {selectedSensors, selectedFields} = this.state
      if (selectedComponents.includes(selectedComponent)) {
        const filteredOptions = selectedComponents.filter(o => o !== selectedComponent)
        // deselect all the related ones
        const filteredSensors = selectedSensors.filter(o => !o.includes(selectedComponent))
        const filteredFields = selectedFields.filter(o => !o.includes(selectedComponent))
        return this.setState({selectedComponents: filteredOptions, selectedSensors: filteredSensors, selectedFields: filteredFields})
      }

      const filteredOptions = [...selectedComponents, selectedComponent]
      // select all the related ones
      const {allSensorsMenu, allFieldsMenu} = this.state
      const filteredSensors = allSensorsMenu.filter(o => o.includes(selectedComponent) && !selectedSensors.includes(o))
      const filteredFields = allFieldsMenu.filter(o => o.includes(selectedComponent) && !selectedFields.includes(o))
      this.setState({selectedComponents: filteredOptions, selectedSensors: [...selectedSensors, ...filteredSensors], selectedFields: [...selectedFields, ...filteredFields]})
    }

    onSelectSensor = (selectedSensor: string) => {
      const {selectedSensors} = this.state
      const {selectedFields} = this.state
      if (selectedSensors.includes(selectedSensor)) {
        const filteredOptions = selectedSensors.filter(o => o !== selectedSensor)
        // deselect all the related ones
        const filteredFields = selectedFields.filter(o => !o.includes(selectedSensor))
        return this.setState({selectedSensors: filteredOptions, selectedFields: filteredFields})
      }

      const filteredOptions = [...selectedSensors, selectedSensor]
      // select all the related ones
      const {allFieldsMenu} = this.state
      const filteredFields = allFieldsMenu.filter(o => o.includes(selectedSensor) && !selectedFields.includes(o))
      this.setState({selectedSensors: filteredOptions, selectedFields: [...selectedFields, ...filteredFields]})
    }

    onSelectField = (selectedField: string) => {
      const {selectedFields} = this.state
      // const {selectedProductionLines, selectedMachines, selectedComponents, selectedSensors} = this.state
      if (selectedFields.includes(selectedField)) {
        const filteredOptions = selectedFields.filter(o => o !== selectedField)
        // remove upper level
        //const filteredSensors = selectedSensors.filter(o => !selectedField.includes(o))
        return this.setState({selectedFields: filteredOptions})
      }

      const filteredOptions = [...selectedFields, selectedField]
      // if all fields selected? 
      // const {allFieldsMenu, allSensorsMenu} = this.state
      // const filteredSensors = allSensorsMenu
      this.setState({selectedFields: filteredOptions})
    }

    formatKerasOptimizerName = (optimizer) => {
      if(optimizer in optimizers){
        return optimizers[optimizer]
      }
      else{
        return "val_accuracy"
      }
    }

    trainModel = async () => {
      let fields = []
      let allFields = this.state.assets["fields"]
      let fieldPairs = Object.entries(allFields)
      console.log(fieldPairs)
      for(let fieldName of this.state.selectedFields){
        for(let fieldPair of fieldPairs){
          if(fieldName === fieldPair[1]["name"]){
            fields.push(fieldPair[1]["object"])
          }
        }
      }
      
      console.log("fields: ", fields)
      if(this.state.task === RUL_TASK){
        let kerasTunerMinDataPoints = this.state.autoMLSettings["kerasTunerMinDataPoints"] ? this.state.autoMLSettings["kerasTunerMinDataPoints"] : "200"
        let kerasTunerCustomMetricEquation = this.state.autoMLSettings["kerasTunerCustomMetricEquation"] ? this.state.autoMLSettings["kerasTunerCustomMetricEquation"] : "-"
        let kerasTunerCustomMetricDirection = this.state.autoMLSettings["kerasTunerCustomMetricDirection"] ? this.state.autoMLSettings["kerasTunerCustomMetricDirection"] : "-"
        let kerasTunerType = this.state.autoMLSettings["kerasTunerType"] ? this.state.autoMLSettings["kerasTunerType"] : "Hyperband"
        let kerasTunerOptimizer = this.state.autoMLSettings["kerasTunerOptimizer"] ? this.formatKerasOptimizerName(this.state.autoMLSettings["kerasTunerOptimizer"]) : "val_accuracy"
        let kerasTunerNumberOfEpochs = this.state.autoMLSettings["kerasTunerNumberOfEpochs"] ? this.state.autoMLSettings["kerasTunerNumberOfEpochs"] : "50"

        let settings = {
          "assetName": this.state.selectedAsset, "fields": fields,
          "minDataPoints": kerasTunerMinDataPoints, "customMetricEquation": kerasTunerCustomMetricEquation, "customMetricDirection": kerasTunerCustomMetricDirection,
          "timeout": "2h", "numberOfEpochs": kerasTunerNumberOfEpochs, "sessionID": Date.now(), "experimentName": this.state.modelName, "creator": this.props.username,
          "tunerType": kerasTunerType, "optimizer": kerasTunerOptimizer, "windowLength": this.state.windowSize, "productID": "-1", "token": window.localStorage.getItem("token")
        }
        const test = await HealthAssessmentService.startRULAutoMLSession(settings)
        console.log("test token res:", test)
      }
      else if(this.state.task === POF_TASK){
        let kerasTunerMinDataPoints = this.state.autoMLSettings["kerasTunerMinDataPoints"] ? this.state.autoMLSettings["kerasTunerMinDataPoints"] : "200"
        let kerasTunerCustomMetricEquation = this.state.autoMLSettings["kerasTunerCustomMetricEquation"] ? this.state.autoMLSettings["kerasTunerCustomMetricEquation"] : "-"
        let kerasTunerCustomMetricDirection = this.state.autoMLSettings["kerasTunerCustomMetricDirection"] ? this.state.autoMLSettings["kerasTunerCustomMetricDirection"] : "-"
        let kerasTunerNumberOfEpochs = this.state.autoMLSettings["kerasTunerNumberOfEpochs"] ? this.state.autoMLSettings["kerasTunerNumberOfEpochs"] : "50"
        let kerasTunerType = this.state.autoMLSettings["kerasTunerType"] ? this.state.autoMLSettings["kerasTunerType"] : "Hyperband"
        let settings = {
          "assetName": this.state.selectedAsset, "fields": fields,
          "minDataPoints": kerasTunerMinDataPoints, "customMetricEquation": kerasTunerCustomMetricEquation, "customMetricDirection": kerasTunerCustomMetricDirection,
          "timeout": "4h", "numberOfEpochs": kerasTunerNumberOfEpochs, "sessionID": Date.now(), "experimentName": this.state.modelName, "creator": this.props.username,
          "tunerType": kerasTunerType, "optimizer": "val_loss", "productID": "-1", "token": window.localStorage.getItem("token")
        }
        const test = await HealthAssessmentService.startPOFAutoMLSession(settings)
        console.log("test token res:", test)
      }
      else if(this.state.task === RULREG_TASK){
        let evalMLMinDataPoints = this.state.autoMLSettings["evalMLMinDataPoints"] ? this.state.autoMLSettings["evalMLMinDataPoints"] : "200"
        let evalMLCustomLateGuessPunishment = this.state.autoMLSettings["evalMLCustomLateGuessPunishment"] ? this.state.autoMLSettings["evalMLCustomLateGuessPunishment"] : "-"
        let evalMLCustomEarlyGuessPunishment = this.state.autoMLSettings["evalMLCustomEarlyGuessPunishment"] ? this.state.autoMLSettings["evalMLCustomEarlyGuessPunishment"] : "-"
        let evalMLMaxIterations = this.state.autoMLSettings["evalMLMaxIterations"] ? this.state.autoMLSettings["evalMLMaxIterations"] : "10"
        let evalMLObjective = this.state.autoMLSettings["evalMLObjective"] ? this.state.autoMLSettings["evalMLObjective"] : "MSE"
        let settings = {
          "assetName": this.state.selectedAsset, "fields": fields,
          "minDataPoints": evalMLMinDataPoints, "lateGuessPunishment": evalMLCustomLateGuessPunishment, "earlyGuessPunishment": evalMLCustomEarlyGuessPunishment,
          "timeout": "4", "sessionID": Date.now(), "experimentName": this.state.modelName, "creator": this.props.username,
          "maxIterations": evalMLMaxIterations, "objective": evalMLObjective, "productID": "-1", "token": window.localStorage.getItem("token")
        }
        const test = await HealthAssessmentService.startRULRegAutoMLSession(settings)
        console.log("test token res:", test)
      }
      this.props.closeOverlay()
      
  }

    public render(){
        return(
            <Overlay visible={this.props.createModelOverlay}>
                <Overlay.Container maxWidth={800}>
                  <Overlay.Header
                    title="Train a Model"
                    onDismiss={this.props.closeOverlay}
                  />
                  <Overlay.Body>
                    <Grid>
                      <AutoMLSettingsOverlay
                        handleChangeNotification={this.props.handleChangeNotification}
                        autoMLSettingsOverlay={this.state.autoMLSettingsOverlay}
                        closeOverlay={()=>this.setState({autoMLSettingsOverlay: !this.state.autoMLSettingsOverlay})}
                      />
                      <Grid.Row> {/* style={{marginBottom: "10px"}} */}
                        <Grid.Column widthXS={Columns.Two} /* style={{ margin: "7px" }} */>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"I want to:"}
                                description={"ML task"}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Ten} /* style={{ margin: "7px" }} */>
                          <div className="tabbed-page--header-left">
                            <SelectDropdown
                                // style={{width: "10%"}}
                                options={this.state.tasks}
                                selectedOption={this.state.task}
                                onSelect={(e) => {this.setState({task: e})}}
                            />
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                      {this.state.task === RUL_TASK && (
                        <Grid.Row> {/* style={{marginBottom: "10px"}} */}
                          <Grid.Column widthXS={Columns.Three} /* style={{ margin: "7px" }} */>
                            <div className="tabbed-page--header-left">
                              <Label
                                  size={ComponentSize.Small}
                                  name={"Days Prior To Failure"}
                                  description={"ML task"}
                                  color={InfluxColors.Castle}
                                  id={"icon-label"} 
                              />
                            </div>
                          </Grid.Column>
                          <Grid.Column widthXS={Columns.Nine} /* style={{ margin: "7px" }} */>
                            <div className="tabbed-page--header-left">
                              <SelectDropdown
                                  // style={{width: "10%"}}
                                  options={["15", "20", "30", "45", "60"]}
                                  selectedOption={this.state.windowSize}
                                  onSelect={(e) => {this.setState({windowSize: e})}}
                              />
                            </div>
                          </Grid.Column>
                        </Grid.Row>
                      )}
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Two} /* style={{ margin: "7px" }} */>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Model Name:"}
                                description={"Model Name"}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Ten} /* style={{ margin: "7px" }} */>
                          <div className="tabbed-page--header-left">
                            <Input
                              onChange={(e) => this.setState({ modelName: e.target.value })}
                              name="modelNamae"
                              type={InputType.Text}
                              value={this.state.modelName}
                            />
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                      {/* <Grid.Row>
                        <Grid.Column widthXS={Columns.Two}>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Production Lines:"}
                                description={"Production Lines"}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Four}>
                          <div className="tabbed-page--header-left">
                            <MultiSelectDropdown
                              emptyText={"multiselect dropdown"}
                              options={this.state.allProductionLinesMenu}
                              selectedOptions={this.state.selectedProductionLines}
                              onSelect={this.onSelectProductionLine}
                            />  
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Two}>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Machines:"}
                                description={"Machines"}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Four}>
                          <div className="tabbed-page--header-left">
                            <MultiSelectDropdown
                              emptyText={"multiselect dropdown"}
                              options={this.state.allMachinesMenu}
                              selectedOptions={this.state.selectedMachines}
                              onSelect={this.onSelectMachine}
                            />  
                          </div>
                        </Grid.Column>
                      </Grid.Row> */}
                      {this.props.isComponent ? <></> : <Grid.Row>
                        <Grid.Column widthXS={Columns.Two}>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Components:"}
                                description={"Components"}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Ten}>
                          <div className="tabbed-page--header-left">
                            <MultiSelectDropdown
                              emptyText={"select components"}
                              options={this.state.allComponentsMenu}
                              selectedOptions={this.state.selectedComponents}
                              onSelect={this.onSelectComponent}
                            />  
                          </div>
                        </Grid.Column>
                      </Grid.Row>}
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Two}>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Sensors:"}
                                description={"Sensors"}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Ten}>
                          <div className="tabbed-page--header-left">
                            <MultiSelectDropdown
                              emptyText={"select sensors"}
                              options={this.state.allSensorsMenu}
                              selectedOptions={this.state.selectedSensors}
                              onSelect={this.onSelectSensor}
                            />  
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Two}>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Fields:"}
                                description={"Fields"}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Ten}>
                          <div className="tabbed-page--header-left">
                            <MultiSelectDropdown
                              emptyText={"select fields"}
                              options={this.state.allFieldsMenu}
                              selectedOptions={this.state.selectedFields}
                              onSelect={this.onSelectField}
                            />  
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Two}>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Failure Records:"}
                                description={"Assets that have failure records"}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Ten}>
                          <div className="tabbed-page--header-left">
                            <SelectDropdown
                                options={this.state.uniqueFailureAssets}
                                selectedOption={this.state.selectedAsset}
                                onSelect={(e) => {this.setState({selectedAsset: e})}}
                            />
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Overlay.Body>
                  <Overlay.Footer>
                    <Grid>
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Six}>
                          <div className="tabbed-page--header-left">
                            <Button
                              color={ComponentColor.Primary}
                              titleText=""
                              text="AutoML Setings"
                              type={ButtonType.Submit}
                              onClick={() => this.setState({autoMLSettingsOverlay: !this.state.autoMLSettingsOverlay})}
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Six}>
                          <div className="tabbed-page--header-right">
                            <Button
                              color={ComponentColor.Secondary}
                              titleText=""
                              text="Start Training"
                              type={ButtonType.Submit}
                              onClick={() => this.trainModel()}
                            />
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Overlay.Footer>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default CreateModelOverlay