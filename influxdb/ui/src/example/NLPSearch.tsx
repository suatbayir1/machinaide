import React, {PureComponent, createRef, RefObject} from 'react'
import {Input, InputType,
        Button, ButtonType, ButtonShape, Orientation,
        ComponentColor, Appearance, ComponentSize,
        Popover, PopoverInteraction, PopoverPosition, ButtonRef,
        Grid, QuestionMarkTooltip, Tabs, Overlay, Columns, DapperScrollbars,
        Icon, IconFont, Bullet, TextArea, SelectDropdown, InfluxColors, Label,
} from '@influxdata/clockface'
import { BACKEND } from "src/config";
import {TextAnnotator} from 'react-text-annotate'
import {Context} from 'src/clockface'
import SearchWidget from 'src/shared/components/search_widget/SearchWidget'

interface Props{

}

interface State{
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
    annotations: Object[]
    entities: Object[]
    value: Object[]
    tag: string
}

const styles = {
    addIcon: {cursor: "pointer", position: "relative", 
        bottom: "3px", color: "#181820", backgroundColor: "#7ceb6a",
    },
    deleteIcon: { color: "#181820", backgroundColor: "#f95f53", 
        cursor:"pointer", position: "relative", 
    }
}

const colors = {
    'MACH': InfluxColors.Ruby,
    'COMP': InfluxColors.Krypton,
    'SENS': InfluxColors.Topaz,
    'VALUE': InfluxColors.Magenta,
    'RANGE': InfluxColors.Laser
}

const tags = [
    'MACH',
    'COMP',
    'SENS',
    'VALUE',
    'RANGE'
]

class NLPSearch extends PureComponent<Props, State>{
    // private triggerRef: RefObject<ButtonRef> = createRef()
    state = {
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
        annotations: [],
        entities: [],
        value: [],
        tag: 'MACH',
    }

    componentDidMount(){
        console.log("nlp comp is mounted")
    }

    async postQuestion(): Promise<void> {
        const fetchPromise = fetch(BACKEND.NLP_URL + '/postQuestion', {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({"question": this.state.question}),
            headers: {
                'Content-Type': 'application/json'
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
        const fetchPromise = fetch(BACKEND.NLP_URL + '/postTrainData', {
            method: 'PUT',
            mode: 'cors',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
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

    onChange = (e) => {
        this.setState({[e.target.name] : e.target.value})
    }

    handleSearch = () => {
        console.log(this.state.question)
        this.postQuestion().then(res=> {
            console.log("*-",res)
            if(res["error"]){
                this.setState({errorMessage: res["error"], errorHappened: true, resultArrived: false, feedbackArrived: false,
                entities: res["entities"],
                fixedQuestion: res["fixedQuestion"],
                isFixed: res['isFixed'],
                value: []})
            }
            else if(res["data"]){
                let query = res["query"].replaceAll("|>", "\n\t|>")
                this.setState({
                    data: res["data"], 
                    query: query, 
                    entities: res["entities"],
                    fixedQuestion: res["fixedQuestion"],
                    isFixed: res['isFixed'], 
                    errorHappened: false, 
                    resultArrived: true, 
                    feedbackArrived: false,
                    overlayVisible: false,
                    value: [],
                })
            }
            else{
                this.setState({errorMessage: "Something went wrong.", errorHappened: true, resultArrived: false, feedbackArrived: false,
                entities: res["entities"],
                fixedQuestion: res["fixedQuestion"],
                isFixed: res['isFixed'],
                value: []})
            }            
        }).catch(err=>console.log(err))
    }

    addTrainData = () => {
        let data = {question: this.state.fixedQuestion, entities: this.state.entities}
        console.log("yes-->", data)
        this.postTrainData(data).then(res=>{
            console.log(res)
            this.setState({resultArrived: false, feedbackArrived: true, overlayVisible: false, errorHappened: false, entities: []})
        }).catch(err=>console.log(err))
    }

    sendAnnotations = () => {
        let data = {question: this.state.fixedQuestion, entities: []}
        let entities = []
        for(let annotation of this.state.value){
            let entity = {}
            entity["start"] = annotation["start"]
            entity["end"] = annotation["end"]
            entity["tag"] = annotation["tag"]
            entities.push(entity)
        }
        data['entities'] = entities
        console.log("new data ", data)
        this.postTrainData(data).then(res=>{
            console.log(res);
            this.setState({
                annotations: [],
                resultArrived: false, feedbackArrived: true,
                value: [], overlayVisible: false, errorHappened: false, entities: []
            })
        }).catch(err=>console.log(err))
    }

    overlayComponent = () =>{
        return(
            <Overlay visible={this.state.overlayVisible}>
                <Overlay.Container maxWidth={750} style={{minHeight: "300px"}}>
                    <Overlay.Header
                        title="Annotate Question"
                        onDismiss={()=>this.setState({overlayVisible: !this.state.overlayVisible})}
                    />
                    <Overlay.Body>
                        <Grid>
                            <Grid.Row style={{borderBottom: 'solid 1px', borderTop: 'solid 1px'}}>
                                <Grid.Column widthXS={Columns.One}/>
                                <Grid.Column widthXS={Columns.Four} style={{marginBottom: "7px", marginTop: "7px"}}>
                                    <div className="tabbed-page--header-left">
                                        <Icon key="brush" glyph={IconFont.Brush} style={{color: colors[this.state.tag], fontSize: '20px', marginRight: '1px'}} />
                                        <label style={{color: InfluxColors.Mist, marginRight: '10px'}}>Tags: </label>
                                        <SelectDropdown 
                                            selectedOption={this.state.tag} options={tags} onSelect={(selectedTag)=>this.setState({tag: selectedTag})} 
                                        />
                                        <QuestionMarkTooltip
                                            style={{marginLeft: "5px"}}
                                            diameter={15}
                                            color={ComponentColor.Secondary}
                                            tooltipContents={<div style={{whiteSpace: 'pre-wrap', fontSize: "13px"}}>
                                                <div style={{color: InfluxColors.Star}}>{"How to annotate:"}
                                                <hr style={{borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#BE2EE4', boxShadow: '0 0 5px 0 #8E1FC3', margin: '3px'}}/>
                                                </div>
                                                {" - Select the tag from dropdown. \n - Click and highlight the text you want to annotate. \n - Click on the annotation to take it back."}                                            
                                                </div>}
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Seven}/>
                            </Grid.Row>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.One}/>
                                <Grid.Column widthXS={Columns.Ten} style={{marginTop: "12px"}}>
                                    <TextAnnotator
                                        style={{
                                            lineHeight: 1.75,
                                        }}
                                        content={this.state.fixedQuestion}
                                        value={this.state.value}
                                        onChange={value => this.setState({ value: value })}
                                        onMouseDown={(e)=>e.preventDefault()}  
                                        getSpan={span => ({
                                            ...span,
                                            tag: this.state.tag,
                                            color: colors[this.state.tag],
                                            style: {color: "black"}
                                        })}
                                    />
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.One}/>
                            </Grid.Row>
                            <Grid.Row style={{borderTop: 'solid 1px'}}>
                                <Grid.Column widthXS={Columns.One}/>
                                <Grid.Column widthXS={Columns.Ten} >
                                    <Button
                                        color={ComponentColor.Secondary}
                                        titleText="Send Annotations"
                                        text="Send Annotations"
                                        type={ButtonType.Button}
                                        onClick={this.sendAnnotations}
                                        style={{position: 'absolute', right:0, bottom:0, top:'10px'}}
                                    />
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Seven}/>
                            </Grid.Row>
                        </Grid>
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }

    render(){
        return(
            <Grid>
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
                            placeholder="Enter question"
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
                    </div>
                </Grid.Row>
                <Grid.Row>
                    {this.state.resultArrived &&
                    (
                        <div>
                            {this.state.isFixed && (
                                <div style={{textAlign: "center", marginTop: "10px", marginBottom: "5px"}}>
                                    Misspelled words are corrected.
                                    <QuestionMarkTooltip
                                        style={{marginLeft: "5px"}}
                                        diameter={15}
                                        color={ComponentColor.Warning}
                                        tooltipContents={<div style={{whiteSpace: 'pre-wrap', fontSize: "13px"}}>
                                            <div style={{color: InfluxColors.Pineapple}}>{"Corrected question:"}
                                            <hr style={{borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#ffd255', boxShadow: '0 0 5px 0 #f48d38', margin: '3px'}}/>
                                            </div>
                                            {this.state.fixedQuestion}                                            
                                            </div>}
                                    />
                                </div>
                            )}
                            <div style={{textAlign: "center", marginTop: "10px", marginBottom: "5px"}}>
                                Is the result correct?
                                <Button 
                                    text="Yes"
                                    onClick={this.addTrainData}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Success}
                                    style={{marginRight: "5px", marginLeft: "5px"}}
                                />
                                <Button 
                                    text="No, I'll revise"
                                    onClick={()=>this.setState({resultArrived: false, feedbackArrived: false})}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Danger}
                                    style={{marginRight: "5px"}}
                                />
                                <Button 
                                    text="No, but I want to help"
                                    onClick={()=>this.setState({overlayVisible: !this.state.overlayVisible})}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Secondary}
                                    style={{marginRight: "5px"}}
                                />
                                <QuestionMarkTooltip
                                    diameter={18}
                                    tooltipStyle={{width: 'max-content'}}
                                    tooltipContents={<div style={{whiteSpace: 'pre-wrap', fontSize: '13px'}}>
                                        <div style={{color: InfluxColors.Pool}}>{"Created Flux query:"}
                                        <hr style={{borderStyle: 'none none solid none', borderWidth: '2px', borderColor: '#00a3ff', boxShadow: '0 0 5px 0 #066fc5', margin: '3px'}}/>
                                        </div>
                                        {this.state.query}
                                        </div>}
                                />
                                {this.overlayComponent()}
                            </div>
                        </div>
                    )}
                    {this.state.feedbackArrived &&
                        <div style={{textAlign: "center", marginTop: "10px"}}>
                            Thank you for the feedback!
                        </div>
                    }
                    {this.state.errorHappened &&
                        <div style={{textAlign: "center", marginTop: "10px", margin: "5px"}}>
                            <span style={{color: "#f95f53"}}>Error message:</span> {this.state.errorMessage}
                            <Button
                                color={ComponentColor.Warning}
                                size={ComponentSize.ExtraSmall}
                                style={{marginLeft: "5px", marginRight: "5px"}}
                                titleText="Clear Question"
                                text="Clear Question"
                                type={ButtonType.Button}
                                onClick={()=>this.setState({question: "", errorHappened: false})}
                            />
                            <Button 
                                text="This should return a valid result."
                                onClick={()=>this.setState({overlayVisible: !this.state.overlayVisible})}
                                type={ButtonType.Button}
                                color={ComponentColor.Secondary}
                                style={{marginRight: "5px"}}
                            />
                            {this.overlayComponent()}
                        </div>
                    }
                </Grid.Row>
            </Grid>
        )
    }

}

export default NLPSearch