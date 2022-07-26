import React, { PureComponent } from 'react'

import _ from 'lodash'
import RULModelLogGraph from "src/health/components/RULModelLogGraph"
import RULRegModelLogGraph from "src/health/components/RULRegModelLogGraph"
import POFModelLogGraph from "src/health/components/POFModelLogGraph"
import FailureService from 'src/shared/services/FailureService'
import AutoMLService from 'src/shared/services/AutoMLService'

import { Overlay, Grid,
    ButtonType, Button, ComponentColor, Columns, SelectDropdown,
    InfluxColors, ComponentSize, Label, Input, Notification,
    InputType, QuestionMarkTooltip,
    DapperScrollbars, AlignItems, InputToggleType,} from '@influxdata/clockface'

interface Props {
    model: object
    modelLogGraphOverlay: boolean
    closeOverlay: () => void
}

interface State {
    assetFailurePoints: object[]
    modelData: any[]
    loadingModelData: boolean
}

class ModelLogGraphOverlay extends PureComponent<Props, State>{
    state ={
        assetFailurePoints: [],
        modelData: [],
        loadingModelData: true
    }

    async componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
      if(prevProps.model){
          if(prevProps.model["modelID"] !== this.props.model["modelID"]){
            this.getModelData()
          }
      }
      else{
          if(this.props.model){
            this.getModelData()
          }
      }
    }

    getModelData = async (days=30, groupIn="None") => {
      let model = this.props.model
      console.log("model logs: ", this.props)
      let failures = await FailureService.getFailures({"sourceName": model["assetName"]})
      console.log(failures)
      let failPoints = []
      for (let failure of failures) {
          let date = new Date(new Date(failure["startTime"]).getTime() + (1000*60*60*2)).toLocaleString("sv-SE").replace(" ", "T").split(".")[0].substring(0,16) + ":00.000000"
          let anno = {
            axis: 'x',
            value: date,
            lineStyle: { stroke: '#00A3FF', strokeWidth: 2 },
            legend: ""
          }
          failPoints.push(anno)
      }
      /* failPoints.push({
          axis:"x",
          value: '2022-05-18T15:04:21.711010',
          lineStyle: { stroke: '#00A3FF', strokeWidth: 2 },
          legend: ""
      }) */
      this.setState({ assetFailurePoints: failPoints })
      if(model["pipelineID"]){
          AutoMLService.getModelLogs(model["pipelineID"]).then(res=>{
          if(model["task"] === "rulreg"){
            this.setState({modelData: this.createRULRegGraphData(res, groupIn, failPoints), loadingModelData: false})
          }        
          }).catch(err=>console.log(err))
      }
      else{
          if(model["modelID"]){
              AutoMLService.getModelLogs(model["modelID"]).then(res=>{
              if(model["task"] === "pof"){
              this.setState({modelData: this.createPOFGraphData(res, days, failPoints), loadingModelData: false})
              }
              else if(model["task"] === "rul"){
              this.setState({modelData: this.createRULGraphData(res, failPoints), loadingModelData: false})
              }    
          }).catch(err=>console.log(err))
          }
          else{
            this.setState({modelData: [], loadingModelData: false})
          }
      } 
    }
    
    createRULGraphData = (data, fails) => {
        // rul one log: {"time": isotimestring, "prediction": int(0/1)}
        let graphData = []
        for(let log of data){
          graphData.push({"x": log["time"], "y": log["prediction"]})
        }
        for(let fail of fails){
          graphData.push({"x": fail["value"], "y": null})
        }
        // console.log("before", graphData)
        graphData.sort((a, b)=>{
          // console.log(a, b)
          return new Date(a.x).getTime()-new Date(b.x).getTime()})
        // console.log("after", graphData)
        //console.log(graphData)
        return graphData
    }

    createPOFGraphData = (data, days, fails) => {
        // rul one log: {"time": isotimestring, "prediction": int(0/1)}
        let graphData = []
        for(let log of data){
          if(!log["prediction"]){
            graphData.push({"x": log["time"], "y": null})
          }
          else{
            let prob = this.findProbability(log["prediction"][0], log["prediction"][1], days)
            graphData.push({"x": log["time"], "y": prob.toFixed(3)})
          }      
        }
        for(let fail of fails){
          graphData.push({"x": fail["value"], "y": null})
        }
        graphData.sort((a, b)=>{
          // console.log(a, b)
          return new Date(a.x).getTime()-new Date(b.x).getTime()})
        //console.log(graphData)
        return graphData
    }

    findProbability = (alpha, beta, days) => {
        if(alpha !== 0 || alpha !== "0"){
          let probability = 1 - Math.E ** (-1 * (days/alpha)**beta)
          return probability
        }
        else{
          let probability = 0
          return probability
        }
    }

    createRULRegGraphData = (data, groupIn, fails) => {
        // rul one log: {"time": isotimestring, "prediction": int(0/1)}
        let graphData = []
        for(let log of data){
          graphData.push({"x": log["time"], "y": log["prediction"]+""})
        }
    
        for(let fail of fails){
          graphData.push({"x": fail["value"], "y": null})
        }
        //console.log("before", graphData)
        graphData.sort((a, b)=>{
          //console.log(a, b)
          return new Date(a.x).getTime()-new Date(b.x).getTime()})
        //console.log("after", graphData)
        if(groupIn != "None"){
          if(graphData.length){
            if(groupIn === "By Day"){
              let groupedByDay = _.groupBy(graphData, (item)=> item["x"].slice(8,10))
              let days = Object.keys(groupedByDay)
              let gdata = []
              for(let day of days){
                let one = _.meanBy(groupedByDay[day], (item)=> parseInt(item["y"]))
                gdata.push({x: groupedByDay[day][0]["x"].slice(0,10) + "T00:00:00.000000",y: one.toFixed(0) + ""})
              }
              graphData = gdata
            }
            else if(groupIn === "By Week"){
              let weekdata = []
              let copyDates = [...graphData]
              while(copyDates && copyDates.length){
                // group by week
                let firstDate = copyDates[0]["x"]
                let fd = new Date(firstDate)
                let ld = new Date(firstDate)
                ld.setDate(ld.getDate() + 7)
                
                let weekx = _.groupBy(copyDates, (item)=> (new Date(item["x"])>=fd && new Date(item["x"])<=ld))
                console.log(weekx)
                
                let weeks = Object.keys(weekx)
                console.log(weeks)
                
                let one = _.meanBy(weekx[true], (item)=> parseInt(item["y"]))
                weekdata.push({x: weekx[true][0]["x"].slice(0,10) + "T00:00:00.000000",y: one.toFixed(0) + ""})
                copyDates = weekx[false]
              }
              graphData = weekdata
            }
            else if(groupIn === "By Month"){
              let groupedByMonth = _.groupBy(graphData, (item)=> item["x"].slice(5,7))
              let months = Object.keys(groupedByMonth)
              let gdata = []
              for(let month of months){
                let one = _.meanBy(groupedByMonth[month], (item)=> parseInt(item["y"]))
                gdata.push({x: groupedByMonth[month][0]["x"].slice(0,10) + "T00:00:00.000000",y: one.toFixed(0) + ""})
              }
              graphData = gdata
            }
          }
        }
        console.log(graphData)
        return graphData
    }

    render(): React.ReactNode {
        return(
        <Overlay visible={this.props.modelLogGraphOverlay}>
            <Overlay.Container maxWidth={800}>
                <Overlay.Header
                    title="Model Logs"
                    onDismiss={this.props.closeOverlay}
                />
                <Overlay.Body>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Twelve} style={{height: "500px"}}>
                                {this.props.model && this.props.model["task"] === "pof" && 
                                  <POFModelLogGraph 
                                    modelLogDataPoints={this.state.modelData} 
                                    annotations={this.state.assetFailurePoints}
                                  />
                                }
                                {this.props.model && this.props.model["task"] === "rul" && 
                                  <RULModelLogGraph 
                                    modelLogDataPoints={this.state.modelData} 
                                    annotations={this.state.assetFailurePoints}
                                  />
                                }
                                {this.props.model && this.props.model["task"] === "rulreg" && 
                                  <RULRegModelLogGraph 
                                    modelLogDataPoints={this.state.modelData} 
                                    annotations={this.state.assetFailurePoints}
                                  />
                                }
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Overlay.Body>
            </Overlay.Container>
        </Overlay>
        )
    }
}

export default ModelLogGraphOverlay