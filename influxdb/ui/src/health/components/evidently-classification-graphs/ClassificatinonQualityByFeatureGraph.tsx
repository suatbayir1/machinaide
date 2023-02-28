import React, {PureComponent} from 'react'
import ReactApexChart from 'react-apexcharts';

interface Props {
    report: object
    feature:  string
}

class ClassificatinonQualityByFeatureGraph extends PureComponent<Props>{
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
              text: "Count"
            } ,
          }
        },
      };
    }

    updateFeature = () => {
      let report = this.props.report
      let feature = this.props.feature
      this.setState({feature: feature})
      if(feature.length){
          let featureData  = JSON.parse(report["features"][feature])
          let prediction = JSON.parse(report["prediction"] ) 
          let feedback = JSON.parse(report["feedback"]) 
          let tp = {}
          let tn = {}
          let fp = {}
          let fn = {}
          for (let i = 0; i < prediction.length; i++) {
              if(prediction[i] === 1 && feedback[i] === 1){
                 if(featureData[i] in tp){
                  tp[featureData[i]] += 1
                 }
                 else{
                  tp[featureData[i]] = 1
                 }
              }
              else if(prediction[i] === 0 && feedback[i] === 0){
                if(featureData[i] in tn){
                 tn[featureData[i]] += 1
                }
                else{
                 tn[featureData[i]] = 1
                }
             }
             else if(prediction[i] === 1 && feedback[i] === 0){
              if(featureData[i] in fp){
               fp[featureData[i]] += 1
              }
              else{
               fp[featureData[i]] = 1
              }
            }
            else if(prediction[i] === 0 && feedback[i] === 1){
              if(featureData[i] in fn){
               fn[featureData[i]] += 1
              }
              else{
               fn[featureData[i]] = 1
              }
            }           
          }

          let tpCats = Object.keys(tp)
          let tnCats = Object.keys(tn)
          let fpCats = Object.keys(fp)
          let fnCats = Object.keys(fn)
          let cats = [...tpCats, ...tnCats, ...fpCats, ...fnCats]
          let uniqueCats = [...new Set(cats)].sort((a,b)=>parseFloat(a)-parseFloat(b))
          if(uniqueCats.length>10){
            let range = Math.abs(parseFloat(uniqueCats[uniqueCats.length-1])-parseFloat(uniqueCats[0]))
            let partDistance = range/10
            let newRanges = []
            for (let i = 0; i < 10; i++) {
              newRanges.push(parseFloat(uniqueCats[0]) + i*partDistance)             
            }
            uniqueCats = newRanges
            console.log("cats", uniqueCats)
            let tp2 = {}
            let tn2 = {}
            let fp2 = {}
            let fn2 = {}
            
            for(let key of uniqueCats){
              let keyStr = key + ""
              tp2[keyStr] = 0
              tn2[keyStr] = 0
              fp2[keyStr] = 0
              fn2[keyStr] = 0
            }

            for(let key of Object.keys(tp)){
              for (let index = 0; index < uniqueCats.length-1; index++) {
                let range1 = uniqueCats[index];
                let range2 = uniqueCats[index+1];
                if(parseFloat(key) >= range1 && parseFloat(key) < range2){
                  tp2[range1] += tp[key]
                  break
                }                
              }
            }

            for(let key of Object.keys(tn)){
              for (let index = 0; index < uniqueCats.length-1; index++) {
                let range1 = uniqueCats[index];
                let range2 = uniqueCats[index+1];
                if(parseFloat(key) >= range1 && parseFloat(key) < range2){
                  tn2[range1] += tn[key]
                  break
                }                
              }
            }

            for(let key of Object.keys(fp)){
              for (let index = 0; index < uniqueCats.length-1; index++) {
                let range1 = uniqueCats[index];
                let range2 = uniqueCats[index+1];
                if(parseFloat(key) >= range1 && parseFloat(key) < range2){
                  fp2[range1] += fp[key]
                  break
                }                
              }
            }

            for(let key of Object.keys(fn)){
              for (let index = 0; index < uniqueCats.length-1; index++) {
                let range1 = uniqueCats[index];
                let range2 = uniqueCats[index+1];
                if(parseFloat(key) >= range1 && parseFloat(key) < range2){
                  fn2[range1] += fn[key]
                  break
                }                
              }
            }

            console.log("********", tp, tp2)

            let tpSeries = []         
            let tnSeries = [] 
            let fpSeries = [] 
            let fnSeries = []    
            for(let key of uniqueCats){
              tpSeries.push({x: key+"", y: tp2[key]})
            }
            for(let key of uniqueCats){
              tnSeries.push({x: key+"", y: tn2[key]})
            }
            for(let key of uniqueCats){
              fpSeries.push({x: key+"", y: fp2[key]})
            }
            for(let key of uniqueCats){
              fnSeries.push({x: key+"", y: fn2[key]})
            }
            let uniqueCatsStr = uniqueCats.map(x=>x+"")
            console.log("HEREE", uniqueCats, uniqueCatsStr)
            this.setState({series: [{name: "TP", data: tpSeries}, {name: "TN", data: tnSeries},{name: "FP", data: fpSeries},{name: "FN", data: fnSeries}], options: {...this.state.options, xaxis: {
              type: 'category',
              categories: uniqueCatsStr.slice(0, uniqueCatsStr.length-1)
            }}})
          }
          else{
            console.log("cats", uniqueCats)
            let tpSeries = []         
            let tnSeries = [] 
            let fpSeries = [] 
            let fnSeries = []    
            for(let key of uniqueCats){
              if(key in tp)
                tpSeries.push({x: key, y: tp[key]})
              else
                tpSeries.push({x: key, y: 0})
            }
            for(let key of uniqueCats){
              if(key in tn)
                tnSeries.push({x: key, y: tn[key]})
              else
                tnSeries.push({x: key, y: 0})
            }
            for(let key of uniqueCats){
              if(key in fp)
                fpSeries.push({x: key, y: fp[key]})
              else
                fpSeries.push({x: key, y: 0})
            }
            for(let key of uniqueCats){
              if(key in fn)
                fnSeries.push({x: key, y: fn[key]})
              else
                fnSeries.push({x: key, y: 0})
            }
            console.log("<10", uniqueCats, [{name: "TP", data: tpSeries}, {name: "TN", data: tnSeries},{name: "FP", data: fpSeries},{name: "FN", data: fnSeries}])
            this.setState({series: [{name: "TP", data: tpSeries}, {name: "TN", data: tnSeries},{name: "FP", data: fpSeries},{name: "FN", data: fnSeries}], options: {...this.state.options, xaxis: {
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

export default ClassificatinonQualityByFeatureGraph