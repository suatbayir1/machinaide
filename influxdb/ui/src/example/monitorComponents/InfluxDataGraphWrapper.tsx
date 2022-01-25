import React, { useState, useEffect } from "react";
import { InfluxDB } from "@influxdata/influxdb-client"
import {ERMETAL_TOKEN} from "src/config"
import {Grid, Columns, MultiSelectDropdown, SlideToggle, ButtonType, ComponentColor,
        Input, InputType, SelectDropdown, Button} from '@influxdata/clockface'
import InfluxDataGraph from "./InfluxDataGraph"

const token =  ERMETAL_TOKEN;
const bucket = "Ermetal";
const url = process.env.INFLUX_URL || "https://vmi474601.contaboserver.net:8086"

const onSelectAll = (data, setShownData, sensors, setSelectedOptions) => {
  setShownData(data)
  setSelectedOptions(sensors)
}

const onDeselectAll = (setShownData, setSelectedOptions) => {
  setShownData([])
  setSelectedOptions([])
}

const onSelectOptions = (option: string, selectedOptions, setSelectedOptions, data, setShownData, setSelectedInParent) => {
  console.log("option", option)
  const optionExists = selectedOptions.find(opt => opt === option)
  let updatedOptions = selectedOptions

  if (optionExists) {
    updatedOptions = selectedOptions.filter(fo => fo !== option)
  } else {
    updatedOptions = [...selectedOptions, option]
  }
  setSelectedOptions(updatedOptions)
  setSelectedInParent(updatedOptions)
  let newData = data.filter(d => updatedOptions.includes(d.id))
  console.log("new data", data, newData)
  setShownData(newData)
}

export const InfluxDataGraphWrapper = ({key, orgID, query, onClick, selectedSensors, setSelectedInParent, anomalies}) => {
  const [selectedOptions, setSelectedOptions] = useState([])
  const [sensors, setSensors] = useState([]);
  const [shownData, setShownData] = useState([]);
  const [data, setData] = useState([]);
  //console.log("**", orgID, query)
  useEffect(() => {
    let res = [];
    const influxQuery = async () => {
      //create InfluxDB client
      const queryApi = await new InfluxDB({ url, token }).getQueryApi(orgID);
      //make query
      //console.log(query, "---", query_field)
      await queryApi.queryRows(query, {
        next(row, tableMeta) {
        
          const o = tableMeta.toObject(row);
         //push rows from query into an array object
          res.push(o);
        },
        complete() {
          console.log("query res", res)
          
          let finalData = []
          let sensors = []
 
          //variable is used to track if the current ID already has a key
          var exists = false
          //res = res.slice(0,51)
          //nested for loops aren’t ideal, this could be optimized but gets the job done
          for(let i = 0; i < res.length; i++) {
            for(let j =0; j < finalData.length; j++) {
              //check if the sensor ID is already in the array, if true we want to add the current data point to the array
              if(res[i]['_field'] === finalData[j]['id']) {
                exists = true
        
                let point = {}
                point["x"] = res[i]["_time"];
                point["y"] = res[i]["_value"];
                finalData[j]["data"].push(point)
              }
              
            }
             //if the ID does not exist, create the key and append first data point to array
              if(!exists) {
                let d = {}
                d["id"] = res[i]["_field"];
                d['data'] = []
                let point = {}
                point["x"] = res[i]["_time"];
                point["y"] = res[i]["_value"];
                d['data'].push(point)
                finalData.push(d)
                sensors.push(res[i]["_field"])
              }
              //need to set this back to false
              exists = false
              
            
          }
          console.log(finalData, sensors)
          setData(finalData);
          //getBucketNumber(finalData, setBuckets, setBucketNo)
          //get50points(finalData, bucketNo, setBucketNo, setShownData)
          //setShownData(finalData)
          setSensors(sensors)
          
          if(selectedSensors.length == 0){
            let count = sensors.length % 6
            let selected = []
            if(count == 0 && sensors.length>0){
              selected = sensors.slice(0,1)
              setSelectedOptions(sensors.slice(0,1))
            }
            else if(sensors.length>0){
              selected = sensors.slice(0,count)
              setSelectedOptions(sensors.slice(0,count))
            }
            let newData = finalData.filter(d => selected.includes(d.id))
            console.log("new data 2", newData, selected)
            setShownData(newData)
          }
          else{
            setSelectedOptions(selectedSensors)
            let newData = finalData.filter(d => selectedSensors.includes(d.id))
            console.log("new data 2", newData, selectedSensors)
            setShownData(newData)
          }
      
        },
        error(error) {
          console.log("query failed- ", error);
        }
      });
     
    };

    influxQuery();
  }, [query]);

  return (
    <>
      <Grid.Row>
        <Grid.Column widthXS={Columns.Eight}/> 
        <Grid.Column widthXS={Columns.Two}>
          <MultiSelectDropdown
            emptyText={"Select sensors"}
            options={sensors}
            selectedOptions={selectedOptions}
            onSelect={(e)=>onSelectOptions(e, selectedOptions, setSelectedOptions, data, setShownData, setSelectedInParent)}
          />
        </Grid.Column>  
        <Grid.Column widthXS={Columns.Two}>
          <Button
              color={ComponentColor.Primary}
              titleText=""
              text="Select All"
              type={ButtonType.Submit}
              onClick={() => onSelectAll(data, setShownData, sensors, setSelectedOptions)}
              style={{marginRight: "5px"}}
          />  
          <Button
            color={ComponentColor.Secondary}
            titleText=""
            text="Deselect All"
            type={ButtonType.Submit}
            onClick={() => onDeselectAll(setShownData, setSelectedOptions)}
            style={{marginRight: "5px"}}
          />
        </Grid.Column>                  
      </Grid.Row>
      <Grid.Row>
        <Grid.Column widthXS={Columns.Twelve}>
          <div style={{ height: '475px', background: "white", color: "black" }}>
            <InfluxDataGraph key={key} data={shownData} onClick={onClick} anomalies={anomalies}/>
          </div>
        </Grid.Column>                    
      </Grid.Row>
    </>
  )
};