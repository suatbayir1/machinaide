// Libraries
import React, { PureComponent } from 'react'
import { TextAnnotator } from 'react-text-annotate'
import { withRouter, RouteComponentProps } from 'react-router-dom'

// Components
import {
    Button, ButtonType, FlexBox, ComponentColor, ComponentSize, Grid, QuestionMarkTooltip,
    Overlay, Columns, Icon, IconFont, TextArea, SelectDropdown, InfluxColors, Page,
    Tabs, SquareGrid, SparkleSpinner, WaitingText
} from '@influxdata/clockface'
import Microphone from 'src/dt/components/Microphone';
import GaugeChart from 'src/shared/components/GaugeChart'
import SingleStat from 'src/shared/components/SingleStat';
import SpeechRecognitionAlternativeList from 'src/dt/components/SpeechRecognitionAlternativeList';

// Utilities
import { BACKEND } from "src/config";

// Types
import { Color } from 'src/types'
import { GaugeViewProperties } from 'src/types/dashboards'
import { RemoteDataState } from 'src/types'

// Helpers
import { defaultViewQuery } from 'src/views/helpers'
import { csvToJSON } from 'src/shared/helpers/FileHelper';

// Services
import FactoryDashboardService from 'src/side_nav/components/factoriesPanel/services/FactoryDashboardService';
import NLPService from 'src/shared/services/NLPService';

// Constants
import {
    tipStyle, textToQuery,
} from 'src/shared/constants/tips';
import {
    DEFAULT_GAUGE_COLORS,
} from 'src/shared/constants/thresholds'


var speech = window.speechSynthesis

type Props = RouteComponentProps<{ orgID: string }>

interface State {
    question: string
    fixedQuestion: string
    data: string
    query: string
    errorMessage: string
    isFixed: boolean
    resultArrived: boolean
    feedbackArrived: boolean
    errorHappened: boolean
    overlayVisible: boolean
    graphOverlay: boolean
    annotations: Object[]
    entities: Object[]
    value: Object[]
    tag: string
    category: string
    mongoTemplate: string
    properties: GaugeViewProperties
    textcatLabels: any[]
    fluxResults: Object
    fluxQueries: Object[]
    intervalId: number
    resultText: string
    queryResult: object
    mongoTextcat: string
    speaking: boolean
    speechRecognitionAlternatives: object[]
    similarQuestions: object[]
    visibleSpeechRecognitionAlternativesOverlay: boolean
    influxGauges: object[]
    queryDone: boolean
}

const colors = {
    'MACH': InfluxColors.Ruby,
    'COMP': InfluxColors.Krypton,
    'SENS': InfluxColors.Topaz,
    'VALUE': InfluxColors.Magenta,
    'RANGE': InfluxColors.Laser,
    'SVR': InfluxColors.Rainforest,
    'MTYPE': InfluxColors.Daisy
}

const tags = [
    'MACH',
    'COMP',
    'SENS',
    'VALUE',
    'RANGE',
    'SVR',
    'MTYPE'
]

const cats = [
    'Sensor data',
    'Metadata'
]

const templates = [
    'Maintenance',
    'Maintenance Count',
    'Failure',
    'Failure Count',
    'Completed Job',
]

const tagInfo = ` - Select the tag from dropdown. \n - Click and highlight the text you want to annotate. 
 - Click on the annotation to take it back. \n Tags: \n -'MACH': machine name
 - 'COMP': component name \n - 'SENS': sensor name
 - 'VALUE': numerical comparison value \n - 'RANGE': timestamps/dates etc.
 - 'SVR': failure severity type \n - 'MTYPE': maintenance type`

const tempInfo = ` Select the relevant template type.\n Types:
 - "Maintenance": Returns source names that have specified maintenance records
 - "Maintenance Count": Returns the count of specified maintenance records
 - "Failure": Returns source names that have specified failure records
 - "Failure Count": Returns the count of specified failure records`

const sensorsMapping = {
    "heat": ["Yaglama_sic_act", "Robot_hava_sic_act", "Kavr_hava_sic_act", "Frn_grup_sic_act", "Deng_hava_sic_act", "Ana_hava_sic_act", // Pres31-DB1
                "AM_Govde_sic", "Volan_Yatak_sic"], // Pres31-DB2
    "vibration": ["AM_Arka_Vib", "AM_On_Vib", "Hid_Pomp_Vib", "Volan_Vib"] // Pres31-DB2
} 

class NLPSearch extends PureComponent<Props, State>{
    // private triggerRef: RefObject<ButtonRef> = createRef()
    state: Readonly<State> = {
        question: '',
        fixedQuestion: '',
        data: '',
        query: '',
        errorMessage: '',
        isFixed: false,
        resultArrived: false,
        feedbackArrived: false,
        errorHappened: false,
        overlayVisible: false,
        graphOverlay: false,
        annotations: [],
        entities: [],
        value: [],
        tag: 'MACH',
        category: 'Sensor data',
        mongoTemplate: 'Maintenance',
        properties: {
            queries: [{
                name: defaultViewQuery().name,
                text: `from(bucket:"system")
            |> range(start:-1h)
            |> filter(fn: (r) =>
              r._measurement == "cpu" and
              r._field == "usage_system" and
              r["cpu"] == "cpu0"
            )
            |> last()`,
                editMode: defaultViewQuery().editMode,
                builderConfig: defaultViewQuery().builderConfig
            }],
            colors: DEFAULT_GAUGE_COLORS as Color[],
            prefix: '',
            tickPrefix: '',
            suffix: '',
            tickSuffix: '',
            note: '',
            showNoteWhenEmpty: false,
            decimalPlaces: {
                isEnforced: true,
                digits: 2,
            },
            type: 'gauge',
            shape: 'chronograf-v2',
            legend: {}
        } as GaugeViewProperties,
        textcatLabels: [],
        fluxResults: {},
        fluxQueries: [{
            key: "cpu_usage_system",
            display: "CPU Usage Percent",
            type: 'gauge',
            loading: RemoteDataState.Loading,
            query: `
            from(bucket:"system")
            |> range(start:-1h)
            |> filter(fn: (r) =>
              r._measurement == "cpu" and
              r._field == "usage_system" and
              r["cpu"] == "cpu0"
            )
            |> last()
            `,
            properties: {
                queries: [defaultViewQuery()],
                colors: [] as Color[],
                prefix: '',
                tickPrefix: '',
                suffix: '',
                tickSuffix: '',
                note: '',
                showNoteWhenEmpty: false,
                decimalPlaces: {
                    isEnforced: false,
                    digits: 2,
                },
                type: 'gauge',
                shape: 'chronograf-v2',
                legend: {}
            }
        }],
        intervalId: 0,
        resultText: "",
        queryResult: {},
        mongoTextcat: "",
        speaking: false,
        speechRecognitionAlternatives: [],
        similarQuestions: [],
        visibleSpeechRecognitionAlternativesOverlay: false,
        influxGauges: [],
        queryDone: false
    }

    async componentDidMount() {
        await this.generateChartValues();
        let intervalId = window.setInterval(this.generateChartValues, 15000);
        this.setState({ intervalId });
    }

    async postQuestion(): Promise<void> {
        const fetchPromise = fetch(BACKEND.API_URL + 'nlp/postQuestion', {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ "question": this.state.question }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            }
        })

        try {
            const response = await fetchPromise;
            const res = await response.json()
            console.log("nlp response", res);
            return res
        }
        catch (err) {
            return err;
        }
    };

    postTrainData = async (data) => {
        const fetchPromise = fetch(BACKEND.API_URL + 'nlp/postTrainData', {
            method: 'PUT',
            mode: 'cors',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            }
        })

        try {
            const response = await fetchPromise;
            const res = await response.json()
            console.log("data addition response: ", res);
            return res
        }
        catch (err) {
            return err;
        }
    }

    speak = (text) => {
        // window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        console.log(text);
        speech.speak(new SpeechSynthesisUtterance(text))
        this.setState({ speaking: true })
    }

    cancel = () => {
        speech.cancel();
        this.setState({ speaking: false })
    }

    getSpeechRecognitionAlternatives = async (alternatives, lastSentence) => {
        console.log("last sentence", lastSentence);

        const wordFrequency = await NLPService.getWordFrequency();
        const payload = { "question": lastSentence }
        const res = await NLPService.getSimilarQuestions(payload);

        const similarQuestions = JSON.parse(res.data.data);

        console.log("similarQuestions", similarQuestions);

        const new_alternatives = [];

        Object.keys(alternatives).map(alternative => {
            let splitted_alternative = alternatives[alternative].transcript.split(" ");
            splitted_alternative = [...new Set(splitted_alternative)];
            let alternative_score = 0;

            splitted_alternative.forEach(word => {
                if (Object.keys(wordFrequency.result.word_frequency).includes(String(word).toLowerCase())) {
                    alternative_score += wordFrequency.result.word_frequency[word];
                }
            })

            console.log(alternatives[alternative].transcript, alternative_score);

            new_alternatives.push({
                transcript: alternatives[alternative].transcript,
                score: (alternative_score / wordFrequency.result.total_word).toFixed(2),
            })
        })

        console.log(new_alternatives);

        new_alternatives.sort(function (l, r) {
            return r.score - l.score;
        });

        console.log(new_alternatives);


        this.setState({
            speechRecognitionAlternatives: new_alternatives,
            similarQuestions: similarQuestions,
            visibleSpeechRecognitionAlternativesOverlay: true,
        })
    }

    dismissSpeechRecognitionAlternativesOverlay = () => {
        this.setState({ visibleSpeechRecognitionAlternativesOverlay: false })
    }

    onChange = (e) => {
        this.setState({ [e.target.name]: e.target.value })
    }

    parseTemplateType = (type) => {
        if (type === 'maintenance')
            return 'Maintenance'
        else if (type === 'maintenancecount')
            return 'Maintenance Count'
        else if (type === 'failure')
            return 'Failure'
        else if (type === 'failurecount')
            return 'Failure Count'
        else
            return type
    }

    handleSearch = () => {
        this.postQuestion().then(res => {
            if (res["error"]) {
                console.log("error");
                this.setState({
                    errorMessage: res["error"], errorHappened: true, resultArrived: false, feedbackArrived: false,
                    entities: res["entities"],
                    fixedQuestion: res["fixedQuestion"],
                    isFixed: res['isFixed'],
                    value: [], textcatLabels: res['textcatLabels']
                })
            }
            else if (res["data"]) {
                let query = res["query"].replaceAll("|>", "\n\t|>")
                let q2 = query.replaceAll("\\", "")
                this.setState({
                    queryResult: res,
                    data: res["data"],
                    category: res["data"] === "mongo-data" ? "Metadata" : "Sensor data",
                    query: query,
                    entities: res["entities"],
                    fixedQuestion: res["fixedQuestion"],
                    isFixed: res['isFixed'],
                    errorHappened: false,
                    resultArrived: true,
                    feedbackArrived: false,
                    overlayVisible: false,
                    mongoTextcat: res["mongoTextcat"],
                    resultText: res["resultText"],
                    // graphOverlay: res["graphOverlay"],
                    graphOverlay: true,
                    value: [], textcatLabels: res['textcatLabels'], mongoTemplate: res['mongoTextcat'],
                    fluxQueries: [res["graphOverlay"] ? (res['textcatLabels'] === 'mongodb' ? { ...this.state.fluxQueries[0], type: 'single-stat' } : { ...this.state.fluxQueries[0], query: q2 }) : { ...this.state.fluxQueries[0] }]
                }, () => { console.log(this.stae); this.speak(res["resultText"]) })
            }
            else {
                this.setState({
                    errorMessage: "Something went wrong.", errorHappened: true, resultArrived: false, feedbackArrived: false,
                    entities: res["entities"],
                    fixedQuestion: res["fixedQuestion"],
                    isFixed: res['isFixed'],
                    value: [], textcatLabels: res['textcatLabels']
                })
            }
        }).catch(err => console.log(err))
    }

    addTrainData = () => {
        let data = {
            question: this.state.fixedQuestion,
            entities: this.state.entities,
            cat: this.state.category,
            mongoTextcat: this.state.mongoTemplate
        }
        console.log("yes-->", data)
        this.postTrainData(data).then(res => {
            console.log(res)
            this.setState({ resultArrived: false, feedbackArrived: true, overlayVisible: false, errorHappened: false, entities: [] })
        }).catch(err => console.log(err))
    }

    sendAnnotations = () => {
        let data = { question: this.state.fixedQuestion, entities: [], cat: this.state.category, mongoTextcat: this.state.mongoTemplate }
        let entities = []
        for (let annotation of this.state.value) {
            let entity = {}
            entity["start"] = annotation["start"]
            entity["end"] = annotation["end"]
            entity["tag"] = annotation["tag"]
            entities.push(entity)
        }
        data['entities'] = entities
        console.log("new data ", data)
        this.postTrainData(data).then(res => {
            console.log(res);
            this.setState({
                annotations: [],
                resultArrived: false, feedbackArrived: true,
                value: [], overlayVisible: false, errorHappened: false, entities: [],
                tag: 'MACH', category: 'Sensor data', mongoTemplate: 'Maintenance',
            })
        }).catch(err => console.log(err))
    }

    generateChartValues = async () => {
        if (this.state.graphOverlay && this.state.textcatLabels[0] === 'influxdb') {
            await this.loadingCharts();
            this.state.fluxQueries.map(query => {
                this.fluxQueryResult(query);
            })
        }
    }

    loadingCharts = () => {
        let queries = [...this.state.fluxQueries];
        queries = queries.map(q => {
            q["loading"] = RemoteDataState.Loading
            return q;
        })
        this.setState({
            fluxQueries: queries
        })
    }

    fluxQueryResult = async (query) => {
        console.log("? query: ",query, this.state.question)
        const csvResult = await FactoryDashboardService.fluxQuery(this.props.match.params.orgID, query["query"]);
        const jsonResult = await csvToJSON(csvResult);
        // console.log("? 2 ",csvResult, jsonResult)
        let queries = [...this.state.fluxQueries];
        /* let influxGauges = []
        let influxGaugesDict = {}
        for(let jres of jsonResult){
            console.log("one ", jres["_field\r"], jres)
            if("_field\r"!== undefined){
                if(!(jres["_field\r"] in influxGaugesDict)){
                    influxGaugesDict[jres["_field\r"]] = jres
                    influxGauges.push(jres)
                }
            }
        }
        console.log("dict: ", influxGaugesDict) */
        if(this.state.question.includes("heat")){
            let selectedFields = []
            for(let jres of jsonResult.slice(0, -2)){
                // console.log("one ", jres["_field\r"], sensorsMapping["heat"], jres["_field\r"] in sensorsMapping["heat"])
                if(jres["_field\r"].includes("_sic")){
                    selectedFields.push(jres)
                }
            }
            console.log("heat: ", selectedFields)
            this.setState({influxGauges: selectedFields, queryDone: true})
        }
        else if(this.state.question.includes("vibration")){
            let selectedFields = []
            for(let jres of jsonResult.slice(0, -2)){
                // console.log("one ", jres["_field\r"], sensorsMapping["vibration"], jres["_field\r"] in sensorsMapping["vibration"])
                if(jres["_field\r"].includes("_Vib")){
                    selectedFields.push(jres)
                }
            }
            console.log("vib: ", selectedFields)
            this.setState({influxGauges: selectedFields, queryDone: true})
        }
        else if(this.state.question.includes("pressure")){
            let selectedFields = []
            for(let jres of jsonResult.slice(0, -2)){
                // console.log("one ", jres["_field\r"], sensorsMapping["vibration"], jres["_field\r"] in sensorsMapping["vibration"])
                if(jres["_field\r"].includes("_bas")){
                    selectedFields.push(jres)
                }
            }
            console.log("bas: ", selectedFields)
            this.setState({influxGauges: selectedFields, queryDone: true})
        }
        else{
            console.log("else final gauges: ", jsonResult.slice(0, -2))
            this.setState({influxGauges: jsonResult.slice(0, -2), queryDone: true})
        }
        console.log("fields: ", jsonResult)
        console.log("final gauges: ", jsonResult.slice(0, -2))
        console.log("? 3: ", queries)
        queries = queries.map(q => {
            if (q["key"] === query["key"]) {
                q["loading"] = RemoteDataState.Done
            }
            return q;
        })
        console.log("? 4: ", queries)
        console.log("? 5: ", [query["key"]], jsonResult[0] !== undefined ? Number(Number(jsonResult[0]["_value"]).toFixed(2)) : 0)
        this.setState({
            fluxResults: {
                ...this.state.fluxResults,
                [query["key"]]: jsonResult[0] !== undefined ? Number(Number(jsonResult[0]["_value"]).toFixed(2)) : 0,
            },
            fluxQueries: queries
        })
    }

    overlayComponent = () => {
        return (
            <Overlay visible={this.state.overlayVisible}>
                <Overlay.Container maxWidth={900} style={{ minHeight: "350px" }}>
                    <Overlay.Header
                        title="Annotate Question"
                        onDismiss={() => this.setState({ overlayVisible: !this.state.overlayVisible})}
                    />
                    <Overlay.Body>
                        <Grid>
                            <Grid.Row style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }}>
                                <Grid.Column widthXS={Columns.Three} style={{ marginBottom: "7px", marginTop: "7px", borderRight: 'solid 1px' }}>
                                    <div className="tabbed-page--header-left">
                                        <Icon key="brush" glyph={IconFont.Brush} style={{ color: colors[this.state.tag], fontSize: '20px', marginRight: '1px' }} />
                                        <label style={{ color: InfluxColors.Mist, marginRight: '10px' }}>Tags: </label>
                                        <SelectDropdown
                                            selectedOption={this.state.tag} options={tags} onSelect={(selectedTag) => this.setState({ tag: selectedTag })}
                                        />
                                        <QuestionMarkTooltip
                                            style={{ marginLeft: "5px" }}
                                            diameter={15}
                                            color={ComponentColor.Secondary}
                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                <div style={{ color: InfluxColors.Star }}>{"How to annotate:"}
                                                    <hr style={{ borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#BE2EE4', boxShadow: '0 0 5px 0 #8E1FC3', margin: '3px' }} />
                                                </div>
                                                {tagInfo}
                                            </div>}
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Four} style={{ marginBottom: "7px", marginTop: "7px" }}>
                                    <div className="tabbed-page--header-right">
                                        <Icon key="brush" glyph={IconFont.Annotate} style={{ color: InfluxColors.Galaxy, fontSize: '22px', marginRight: '3px' }} />
                                        <label style={{ color: InfluxColors.Mist, marginRight: '10px' }}>Category: </label>
                                        <SelectDropdown
                                            selectedOption={this.state.category} options={cats} onSelect={(selectedCat) => this.setState({ category: selectedCat })}
                                        />
                                        <QuestionMarkTooltip
                                            style={{ marginLeft: "5px" }}
                                            diameter={15}
                                            color={ComponentColor.Secondary}
                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                <div style={{ color: InfluxColors.Star }}>{"Text Classification:"}
                                                    <hr style={{ borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#BE2EE4', boxShadow: '0 0 5px 0 #8E1FC3', margin: '3px' }} />
                                                </div>
                                                {"Select the category of the text to help the model to choose correct sources."}
                                            </div>}
                                        />
                                    </div>
                                </Grid.Column>
                                {this.state.category === 'Metadata' &&
                                    <Grid.Column widthXS={Columns.Five} style={{ marginBottom: "7px", marginTop: "7px", borderLeft: 'solid 1px' }}>
                                        <div className="tabbed-page--header-right">
                                            <Icon key="brush" glyph={IconFont.AnnotatePlus} style={{ color: InfluxColors.Chartreuse, fontSize: '22px', marginRight: '3px' }} />
                                            <label style={{ color: InfluxColors.Mist, marginRight: '10px' }}>Template: </label>
                                            <SelectDropdown
                                                selectedOption={this.parseTemplateType(this.state.mongoTemplate)} options={templates} onSelect={(selectedTemp) => this.setState({ mongoTemplate: selectedTemp })}
                                            />
                                            <QuestionMarkTooltip
                                                style={{ marginLeft: "5px" }}
                                                diameter={15}
                                                color={ComponentColor.Secondary}
                                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                    <div style={{ color: InfluxColors.Star }}>{"Metadata templates:"}
                                                        <hr style={{ borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#BE2EE4', boxShadow: '0 0 5px 0 #8E1FC3', margin: '3px' }} />
                                                    </div>
                                                    {tempInfo}
                                                </div>}
                                            />
                                        </div>
                                    </Grid.Column>}
                            </Grid.Row>
                            <Grid.Row style={{ minHeight: '25px', borderBottom: 'solid 1px' }}></Grid.Row>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.One} />
                                <Grid.Column widthXS={Columns.Ten} style={{ marginTop: "12px" }}>
                                    <TextAnnotator
                                        style={{
                                            lineHeight: 1.75,
                                        }}
                                        content={this.state.fixedQuestion}
                                        value={this.state.value}
                                        onChange={value => this.setState({ value: value })}
                                        onMouseDown={(e) => e.preventDefault()}
                                        getSpan={span => ({
                                            ...span,
                                            tag: this.state.tag,
                                            color: colors[this.state.tag],
                                            style: { color: "black" }
                                        })}
                                    />
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.One} />
                            </Grid.Row>
                            <Grid.Row style={{ borderTop: 'solid 1px' }}>
                                <Grid.Column widthXS={Columns.One} />
                                <Grid.Column widthXS={Columns.Ten} >
                                    <Button
                                        color={ComponentColor.Secondary}
                                        titleText="Send Annotations"
                                        text="Send Annotations"
                                        type={ButtonType.Button}
                                        onClick={this.sendAnnotations}
                                        style={{ position: 'absolute', right: 0, bottom: 0, top: '10px' }}
                                    />
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Seven} />
                            </Grid.Row>
                        </Grid>
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }

    graphOverlayComponent = () => {
        return (
            <Overlay visible={this.state.graphOverlay}>
                <Overlay.Container maxWidth={this.state.textcatLabels[0] === 'influxdb' ? 900 : 750} style={{ minHeight: this.state.textcatLabels[0] === 'influxdb' ? '700px' : "300px" }}>
                    <Overlay.Header
                        title="NLPAIDE"
                        onDismiss={() => this.setState({ graphOverlay: !this.state.graphOverlay, queryDone: false, influxGauges: [] })}
                    />
                    <Overlay.Body>
                        <Grid>
                            <Grid.Row>
                                <div style={{ textAlign: 'center' }}>Question: {this.state.question}</div>
                                <div style={{ textAlign: 'center', marginTop: '10px' }}>Answer: {this.state.resultText}</div>
                            </Grid.Row>
                            <Grid.Row>
                                <div style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    display: 'flex',
                                    // textAlign: 'center', 
                                    marginTop: '40px'
                                }}>
                                    <FlexBox margin={ComponentSize.Medium}>
                                        <Button
                                            text="Say Again"
                                            onClick={() => { this.speak(this.state.queryResult["resultText"]) }}
                                            type={ButtonType.Button}
                                            icon={IconFont.Play}
                                            color={ComponentColor.Success}
                                        />
                                        <Button
                                            text="Cancel"
                                            onClick={this.cancel}
                                            type={ButtonType.Button}
                                            icon={IconFont.Pause}
                                            color={ComponentColor.Danger}
                                        />
                                        {/* <Button
                                            text="Say last record"
                                            onClick={this.recognition}
                                            type={ButtonType.Button}
                                            icon={IconFont.Search}
                                            color={ComponentColor.Primary}
                                        /> */}
                                    </FlexBox>
                                </div>
                            </Grid.Row>
                            <Grid.Row>
                                {/* <Grid.Column widthXS={Columns.Three} /> */}
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <div style={{ width: 'auto', height:this.state.textcatLabels[0] === 'influxdb' ? '500px' : '250px' }}>
                                        {
                                            this.state.textcatLabels.length > 0 && this.state.fluxQueries.map((query, idx) => {
                                                if (this.state.textcatLabels[0] === 'influxdb') {
                                                    return(
                                                        <Page
                                                            className="load-data-page"
                                                            titleTag=""
                                                            style={{height: "500px", marginTop: "20px", border: 'solid 2px #999dab', borderRadius: '4px'}}
                                                        >
                                                            <Page.Header fullWidth={false}>
                                                                <h4 style={{color: InfluxColors.Mist}}>{`Count: ${this.state.influxGauges.length}`}</h4>
                                                            </Page.Header>
                                                            <Page.Contents
                                                                //className="models-index__page-contents"
                                                                fullWidth={false}
                                                                scrollable={true}
                                                                style={{textAlign: "-webkit-center"}}
                                                            >
                                                                {(this.state.influxGauges.length === 0 && !this.state.queryDone) && (
                                                                            <>
                                                                                <SparkleSpinner style={{alignSelf: "center"}} sizePixels={75} loading={RemoteDataState.Loading} />
                                                                                <WaitingText style={{textAlign: "center"}} text="Query is running" />
                                                                            </>
                                                                        )}
                                                                {(this.state.influxGauges.length === 0 && this.state.queryDone) && (
                                                                            <h4>No sensor returned</h4>
                                                                        )}
                                                                <Tabs.TabContents>
                                                                <div
                                                                    className="write-data--section"
                                                                    data-testid={`write-model-section`}
                                                                >
                                                                    <SquareGrid cardSize="200px" gutter={ComponentSize.ExtraSmall} style={{gridGap: "20px"}}>
                                                                    
                                                                            {this.state.influxGauges.map((gauge, i) => (
                                                                                <>
                                                                                    <Grid.Row style={{textAlign: "center", border: `1px solid ${InfluxColors.Mint}`, borderRadius: "25px"}}>
                                                                                    <label style={{ color: InfluxColors.Pool}}>
                                                                                        <b>{gauge["_field\r"]}</b>
                                                                                    </label>
                                                                                    
                                                                                        <GaugeChart
                                                                                            key={idx}
                                                                                            value={Number(gauge["_value"]).toFixed(2)}
                                                                                            //value={this.state.textcatLabels[0] === 'influxdb' ? (this.state.fluxResults[query["key"]] !== undefined ? this.state.fluxResults[query["key"]] : 0) : parseInt(this.state.query)}
                                                                                            properties={this.state.properties}
                                                                                            theme={'dark'}
                                                                                        />
                                                                                        
                                                                                    </Grid.Row>
                                                                                </>
                                                                            ))}
                                                                    </SquareGrid>
                                                                </div>
                                                                </Tabs.TabContents>
                                                            </Page.Contents> 
                                                        </Page>
                                                    )
                                                    
                                                } else {
                                                    switch (this.state.mongoTextcat) {
                                                        case 'maintenancecount':
                                                        case 'failurecount':
                                                            return (
                                                                <SingleStat
                                                                    key={idx}
                                                                    stat={parseInt(this.state.query) ? parseInt(this.state.query) : 0}
                                                                    properties={query["properties"]}
                                                                    theme={'dark'}
                                                                />
                                                            )
                                                    }
                                                }
                                                // switch (this.state.textcatLabels[0]) {
                                                //     case 'influxdb':
                                                //         return (
                                                //             <GaugeChart
                                                //                 key={idx}
                                                //                 value={this.state.textcatLabels[0] === 'influxdb' ? (this.state.fluxResults[query["key"]] !== undefined ? this.state.fluxResults[query["key"]] : 0) : parseInt(this.state.query)}
                                                //                 properties={this.state.properties}
                                                //                 theme={'dark'}
                                                //             />)
                                                //     case 'mongodb':
                                                //         return (
                                                //             <SingleStat
                                                //                 key={idx}
                                                //                 stat={parseInt(this.state.query) ? parseInt(this.state.query) : 0}
                                                //                 properties={query["properties"]}
                                                //                 theme={'dark'}
                                                //             />
                                                //         )
                                                // }
                                            })}
                                    </div>
                                </Grid.Column>
                                {/* <Grid.Column widthXS={Columns.Three} /> */}
                            </Grid.Row>
                        </Grid>
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }

    defaultGaugeViewProperties = () => {
        let query = defaultViewQuery()
        query.text = `from(bucket:"system")
        |> range(start:-1h)
        |> filter(fn: (r) =>
          r._measurement == "cpu" and
          r._field == "usage_system" and
          r["cpu"] == "cpu0"
        )
        |> last()`
        return {
            queries: [query],
            colors: DEFAULT_GAUGE_COLORS as Color[],
            prefix: '',
            tickPrefix: '',
            suffix: '',
            tickSuffix: '',
            note: '',
            showNoteWhenEmpty: false,
            decimalPlaces: {
                isEnforced: true,
                digits: 2,
            },
        }
    }

    getTextQuery = (text) => {
        this.setState({
            question: text
        })
    }

    handleSelectAlternative = (alternative) => {
        this.setState({ question: alternative, visibleSpeechRecognitionAlternativesOverlay: false })
    }

    render() {
        return (
            <Grid>
                <SpeechRecognitionAlternativeList
                    visible={this.state.visibleSpeechRecognitionAlternativesOverlay}
                    dismiss={this.dismissSpeechRecognitionAlternativesOverlay}
                    speechRecognitionAlternatives={this.state.speechRecognitionAlternatives}
                    similarQuestions={this.state.similarQuestions}
                    handleSelectAlternative={this.handleSelectAlternative}
                />
                <Grid.Row>
                    <div className="tabbed-page--header-left">
                        {/* <Input
                            name="question"
                            placeholder="Enter question"
                            onChange={this.onChange}
                            value={this.state.question}
                        /> */}
                        <TextArea
                            spellCheck={true}
                            name="question"
                            value={this.state.question}
                            placeholder="Enter a question"
                            onChange={this.onChange}
                            rows={2}
                        />
                        <Button
                            text=""
                            onClick={this.handleSearch}
                            type={ButtonType.Button}
                            icon={IconFont.Search}
                            color={ComponentColor.Primary}
                        />

                        <Microphone
                            getTextQuery={this.getTextQuery}
                            getSpeechRecognitionAlternatives={this.getSpeechRecognitionAlternatives}
                        />

                        <QuestionMarkTooltip
                            diameter={25}
                            tooltipStyle={{ width: '400px' }}
                            color={ComponentColor.Secondary}
                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                <div style={{ color: InfluxColors.Star }}>{"Text to query:"}
                                    <hr style={tipStyle} />
                                </div>
                                {textToQuery}
                            </div>}
                        />
                        {/* <Button
                            text=""
                            onClick={()=>this.setState({graphOverlay: !this.state.graphOverlay})}
                            type={ButtonType.Button}
                            icon={IconFont.AddCell}
                            color={ComponentColor.Secondary}
                        /> */}
                        {this.graphOverlayComponent()}
                    </div>
                </Grid.Row>
                <Grid.Row>
                    {this.state.resultArrived &&
                        (
                            <div>
                                {this.state.isFixed && (
                                    <div style={{ textAlign: "center", marginTop: "10px", marginBottom: "5px" }}>
                                        Misspelled words are corrected.
                                        <QuestionMarkTooltip
                                            style={{ marginLeft: "5px" }}
                                            diameter={15}
                                            color={ComponentColor.Warning}
                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                <div style={{ color: InfluxColors.Pineapple }}>{"Corrected question:"}
                                                    <hr style={{ borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#ffd255', boxShadow: '0 0 5px 0 #f48d38', margin: '3px' }} />
                                                </div>
                                                {this.state.fixedQuestion}
                                            </div>}
                                        />
                                    </div>
                                )}
                                <div style={{ textAlign: "center", marginTop: "10px", marginBottom: "5px" }}>
                                    Is the result correct?
                                    <Button
                                        text="Yes"
                                        onClick={this.addTrainData}
                                        type={ButtonType.Button}
                                        color={ComponentColor.Success}
                                        style={{ marginRight: "5px", marginLeft: "5px" }}
                                    />
                                    <Button
                                        text="No, I'll revise"
                                        onClick={() => this.setState({ resultArrived: false, feedbackArrived: false })}
                                        type={ButtonType.Button}
                                        color={ComponentColor.Danger}
                                        style={{ marginRight: "5px" }}
                                    />
                                    <Button
                                        text="No, but I want to help"
                                        onClick={() => this.setState({ overlayVisible: !this.state.overlayVisible })}
                                        type={ButtonType.Button}
                                        color={ComponentColor.Secondary}
                                        style={{ marginRight: "5px" }}
                                    />
                                    <QuestionMarkTooltip
                                        diameter={18}
                                        tooltipStyle={{ width: 'max-content' }}
                                        tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>
                                            <div style={{ color: InfluxColors.Pool }}>{this.state.textcatLabels[0] === "influxdb" ? "Created Flux query:" : "Result:"}
                                                <hr style={{ borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#00a3ff', boxShadow: '0 0 5px 0 #066fc5', margin: '3px' }} />
                                            </div>
                                            {this.state.query}
                                        </div>}
                                    />
                                    {this.overlayComponent()}
                                </div>
                            </div>
                        )}
                    {this.state.feedbackArrived &&
                        <div style={{ textAlign: "center", marginTop: "10px" }}>
                            Thank you for the feedback!
                        </div>
                    }
                    {this.state.errorHappened &&
                        <div style={{ textAlign: "center", marginTop: "10px", margin: "5px" }}>
                            <span style={{ color: "#f95f53" }}>Error message:</span> {this.state.errorMessage}
                            <Button
                                color={ComponentColor.Warning}
                                size={ComponentSize.ExtraSmall}
                                style={{ marginLeft: "5px", marginRight: "5px" }}
                                titleText="Clear Question"
                                text="Clear Question"
                                type={ButtonType.Button}
                                onClick={() => this.setState({ question: "", errorHappened: false })}
                            />
                            <Button
                                text="This should return a valid result."
                                onClick={() => this.setState({ overlayVisible: !this.state.overlayVisible })}
                                type={ButtonType.Button}
                                color={ComponentColor.Secondary}
                                style={{ marginRight: "5px" }}
                            />
                            {this.overlayComponent()}
                        </div>
                    }
                </Grid.Row>
                <Grid.Row>
                    <div style={{ borderBottom: "solid 2px", borderColor: InfluxColors.Mountain }}>{(this.state.textcatLabels && this.state.textcatLabels.length) ? JSON.stringify(this.state.textcatLabels) : ''}</div>
                </Grid.Row>
            </Grid>
        )
    }

}

export default withRouter(NLPSearch)