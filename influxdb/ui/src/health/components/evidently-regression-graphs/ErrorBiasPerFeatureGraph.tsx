import React, {PureComponent} from 'react'
import ReactApexChart from 'react-apexcharts';

interface Props {
    report: object
    feature: string
}

class ErrorBiasPerFeatureGraph extends PureComponent<Props>{
    constructor(props) {
      super(props);

      this.state = {
        feature: "",
        series: [],
        options: {
          chart: {
            type: 'bar',
            height: 350,
            foreColor: "white",
            //stacked: true,
          },
          stroke: {
            //curve: 'stepline',
          },
          dataLabels: {
            enabled: false
          },
          markers: {
            hover: {
              sizeOffset: 4
            }
          },
          tooltip: {
            theme: "dark",            
          },
          xaxis: {
            labels: {
              formatter: function(val) {
                  let newVal = parseFloat(val)
                  return newVal.toFixed(2)
                  // return parseFloat(val).toFixed(1)
            }},
            title: {
              text: "Value"
           } ,
          },
          yaxis: {
            title: {
              text: "Percent"
            } ,
          }
        },
      };
    }

    updateFeature = () => {
        let report = this.props.report
        let feature = this.props.feature

        if(feature.length){
            let featureData  = JSON.parse(report["features"][feature])
            let predictions = JSON.parse(report["prediction"] ) 
            let feedback = JSON.parse(report["feedback"]) 

            let errors = []
            for(let i=0;i<predictions.length;i++){
                errors.push({index: i, prediction: predictions[i], feedback: feedback[i], error: predictions[i]-feedback[i]})
            }
            errors.sort((a,b) => a.error-b.error)

            let top5 = Math.round(errors.length*(5/100))
            let last5 = Math.round(errors.length-(errors.length*(5/100)))

            console.log(top5, last5)
            let underestimatesArr = errors.slice(0, top5)
            let majorityArr = errors.slice(top5, last5)
            let overestimatesArr = errors.slice(last5, errors.length)

            let underestimation = {}
            let majority = {}
            let overestimation = {}

            for(let i=0;i<underestimatesArr.length;i++){
                if(featureData[underestimatesArr[i]["index"]] in underestimation){
                    underestimation[featureData[underestimatesArr[i]["index"]]] += 1
                }
                else{
                    underestimation[featureData[underestimatesArr[i]["index"]]] = 1
                }
            }

            for(let i=0;i<majorityArr.length;i++){
                if(featureData[majorityArr[i]["index"]] in majority){
                    majority[featureData[majorityArr[i]["index"]]] += 1
                }
                else{
                    majority[featureData[majorityArr[i]["index"]]] = 1
                }
            }

            for(let i=0;i<overestimatesArr.length;i++){
                if(featureData[overestimatesArr[i]["index"]] in overestimation){
                    overestimation[featureData[overestimatesArr[i]["index"]]] += 1
                }
                else{
                    overestimation[featureData[overestimatesArr[i]["index"]]] = 1
                }
            }

            // console.log("hello", underestimation, majority, overestimation)

            let underCats = Object.keys(underestimation)
            let majorCats = Object.keys(majority)
            let overCats = Object.keys(overestimation)
            let cats = [...underCats, ...majorCats, ...overCats]
            let uniqueCats = [...new Set(cats)].sort((a,b)=>parseFloat(a)-parseFloat(b))

            if(uniqueCats.length>10){
                let range = Math.abs(parseFloat(uniqueCats[uniqueCats.length-1])-parseFloat(uniqueCats[0]))
                let partDistance = range/10
                let newRanges = []
                for (let i = 0; i < 10; i++) {
                  newRanges.push(parseFloat(uniqueCats[0]) + i*partDistance)             
                }
                uniqueCats = newRanges
                let underestimation2 = {}
                let majority2 = {}
                let overestimation2 = {}
                for(let key of uniqueCats){
                    let keyStr = key + ""
                    underestimation2[keyStr] = 0
                    majority2[keyStr] = 0
                    overestimation2[keyStr] = 0
                }

                for(let key of Object.keys(underestimation)){
                    for (let index = 0; index < uniqueCats.length-1; index++) {
                      let range1 = uniqueCats[index];
                      let range2 = uniqueCats[index+1];
                      if(parseFloat(key) >= range1 && parseFloat(key) < range2){
                        underestimation2[range1] += underestimation[key]
                        break
                      }                
                    }
                }

                for(let key of Object.keys(majority)){
                    for (let index = 0; index < uniqueCats.length-1; index++) {
                      let range1 = uniqueCats[index];
                      let range2 = uniqueCats[index+1];
                      if(parseFloat(key) >= range1 && parseFloat(key) < range2){
                        majority2[range1] += majority[key]
                        break
                      }                
                    }
                }

                for(let key of Object.keys(overestimation)){
                    for (let index = 0; index < uniqueCats.length-1; index++) {
                      let range1 = uniqueCats[index];
                      let range2 = uniqueCats[index+1];
                      if(parseFloat(key) >= range1 && parseFloat(key) < range2){
                        overestimation2[range1] += overestimation[key]
                        break
                      }                
                    }
                }

                let underSeries = [] 
                let majorSeries = [] 
                let overSeries = []  

                let underSum = 0
                for(let key of uniqueCats){
                    if(key in underestimation2)
                        underSum += underestimation2[key]
                }

                let majorSum = 0
                for(let key of uniqueCats){
                    if(key in majority2)
                        majorSum += majority2[key]
                }

                let overSum = 0
                for(let key of uniqueCats){
                    if(key in overestimation2)
                        overSum += overestimation2[key]
                }

                for(let key of uniqueCats){
                    underSeries.push({x: key+"", y: ((underestimation2[key]/underSum)*100).toFixed(2)})
                }
                for(let key of uniqueCats){
                    majorSeries.push({x: key+"", y: ((majority2[key]/majorSum)*100).toFixed(2)})
                }
                for(let key of uniqueCats){
                    overSeries.push({x: key+"", y: ((overestimation2[key]/overSum)*100).toFixed(2)})
                }
                let uniqueCatsStr = uniqueCats.map(x=>x+"")
                this.setState({series: [{color: "#00A3FF", name: "Underestimation", data: underSeries}, {color: "#34BB55", name: "Majority", data: majorSeries},{color: "#DC4E58", name: "Overestimation", data: overSeries}], options: {...this.state.options, xaxis: {
                    type: 'category',
                    categories: uniqueCatsStr.slice(0, uniqueCatsStr.length-1)
                  }}})
            }
            else{
                console.log("cats", uniqueCats)   
                let underSum = 0
                for(let key of uniqueCats){
                    if(key in underestimation)
                        underSum += underestimation[key]
                }

                let majorSum = 0
                for(let key of uniqueCats){
                    if(key in majority)
                        majorSum += majority[key]
                }

                let overSum = 0
                for(let key of uniqueCats){
                    if(key in overestimation)
                        overSum += overestimation[key]
                }

                let underSeries = [] 
                let majorSeries = [] 
                let overSeries = []    
                console.log(majority, majorSum)
                for(let key of uniqueCats){
                  if(key in underestimation)
                    underSeries.push({x: key, y: ((underestimation[key]/underSum)*100).toFixed(2)})
                  else
                    underSeries.push({x: key, y: 0})
                }
                for(let key of uniqueCats){
                  if(key in majority)
                    majorSeries.push({x: key, y: ((majority[key]/majorSum)*100).toFixed(2)})
                  else
                    majorSeries.push({x: key, y: 0})
                }
                for(let key of uniqueCats){
                  if(key in overestimation)
                    overSeries.push({x: key, y: ((overestimation[key]/overSum)*100).toFixed(2)})
                  else
                    overSeries.push({x: key, y: 0})
                }
                // console.log("<10", uniqueCats, [{color: "#00A3FF", name: "Underestimation", data: underSeries}, {color: "#34BB55", name: "Majority", data: majorSeries},{color: "#DC4E58", name: "Overestimation", data: overSeries}])
                this.setState({series: [{color: "#00A3FF", name: "Underestimation", data: underSeries}, {color: "#34BB55", name: "Majority", data: majorSeries},{color: "#DC4E58", name: "Overestimation", data: overSeries}], options: {...this.state.options, xaxis: {
                  type: 'category',
                  categories: uniqueCats
                }}})
            }

        }
    }

    componentDidMount(){
    }

    componentDidUpdate(prevProps, prevState, snapshot){
        if(prevProps.feature !== this.props.feature){
            this.setState({feature: this.props.feature}, ()=>this.updateFeature())
        }
    }

  

    render() {
      return (
            <div id="chart">
                {this.state.feature.length ? <ReactApexChart options={this.state.options} series={this.state.series} type="bar" height={350} style={{color: "black"}}/> : <></>}
            </div>
        );
    }
}

export default ErrorBiasPerFeatureGraph