import React, { useState, useEffect } from "react";
//import { InfluxDB } from "@influxdata/influxdb-client";
import { ResponsiveLine } from "@nivo/line";
// Apis
import {runQuery} from 'src/shared/apis/query'

const token =  "YOUR-TOKEN";
const org = "org-name";
const bucket = "bucket-name";
const url = "INFLUX-DB-URL";

let query = `from(bucket: "air-sensor")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "airSensors")
  |> filter(fn: (r) => r["_field"] == "co")
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
  |> yield(name: "mean")`;

const script = `from(bucket: "Ermetal")
      |> range(start: -1m)`

export const InfluxChart = (orgID) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    let res = [];
    const influxQuery = async () => {
      //create InfluxDB client
      //const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);
      const queryApi = await runQuery(orgID, script).promise
      //make query
      await queryApi.queryRows(query, {
        next(row, tableMeta) {
        
          const o = tableMeta.toObject(row);
         //push rows from query into an array object
          res.push(o);
        },
        complete() {
          
          let finalData = []
 
          //variable is used to track if the current ID already has a key
          var exists = false

          //nested for loops aren’t ideal, this could be optimized but gets the job done
          for(let i = 0; i < res.length; i++) {
            for(let j =0; j < finalData.length; j++) {
              //check if the sensor ID is already in the array, if true we want to add the current data point to the array
              if(res[i]['sensor_id'] === finalData[j]['id']) {
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
              d["id"] = res[i]["sensor_id"];
              d['data'] = []
              let point = {}
              point["x"] = res[i]["_time"];
              point["y"] = res[i]["_value"];
              d['data'].push(point)
              finalData.push(d)
              }
              //need to set this back to false
              exists = false
              
            
          }

          setData(finalData);
         
      
        },
        error(error) {
          console.log("query failed- ", error);
        }
      });
     
    };

    influxQuery();
  }, []);

  return (
    <ResponsiveLine 
        data={data}
    />
  )
};

export default InfluxChart