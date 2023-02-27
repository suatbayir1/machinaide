// Libraries
import React, { Component } from 'react'
import uuid from "uuid"

// Components
import {
    Grid, Overlay, DapperScrollbars, InputLabel, Button, IconFont, ComponentColor, ButtonType,
    ComponentSize, ConfirmationButton, Appearance, Label, InfluxColors, SelectDropdown,
    FlexBox, AlignItems, Bullet, Form, Columns, QuestionMarkTooltip, GradientBox, Panel, Gradients
} from '@influxdata/clockface'

import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'

interface Props {
    visible: boolean
    onDismiss: () => void
    getModelLogsData: () => void
    log: object
    modelID: string
    failures: object[]
    user?: object
}

interface State {
    feedback: string
    feedbackRange: string
}

class FeedbackOverlay extends Component<Props, State> {
    constructor(props){
        super(props)
        this.state ={
            feedback: "",
            feedbackRange: "1h"
        }
    }

    componentDidMount(): void {
        this.setState({feedback: "feedback" in this.props.log ? this.props.log["feedback"] : "", 
                feedbackRange: "feedbackRange" in this.props.log ? this.props.log["feedbackRange"] : ""})
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (JSON.stringify(prevProps) !== JSON.stringify(this.props)) {
            console.log("diff", prevProps.log, this.props.log)
            this.setState({feedback: "feedback" in this.props.log ? this.props.log["feedback"] : "", 
                feedbackRange: "feedbackRange" in this.props.log ? this.props.log["feedbackRange"] : ""})
            
        }
    }   

    updateModelLogFeedback = async () => {
        console.log(this.props)
        await HealthAssessmentService.updateModelLogFeedback({"modelID": this.props.modelID, "timestamp": this.props.log["time"], 
            "feedback": this.state.feedback, "feedbackRange": this.state.feedbackRange})
        this.props.getModelLogsData()
        this.props.onDismiss()
    }

    returnSeverityColor = (severity) => {
        if(severity === "acceptable"){
            return InfluxColors.Pineapple
        }
        else if(severity === "major"){
            return InfluxColors.Topaz
        }
        else if(severity === "critical"){
            return InfluxColors.Fire
        }
        else{
            return InfluxColors.Magenta
        }
    }

    render(){
        let startTimeDate = this.props.log ? new Date(this.props.log["time"]) : ""
        return(
            <Overlay visible={this.props.visible}>
                <Overlay.Container maxWidth={900}>
                    <Overlay.Header
                        title="Give Feedback"
                        onDismiss={() =>{
                            if(this.props.log === null){
                                this.setState({
                                    feedback: "",
                                    feedbackRange: "",
                                })
                            }                            
                            this.props.onDismiss()
                        }}
                    />
                    <Overlay.Body>
                        {this.props.log ? (
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Four} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="Timestamp">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={(startTimeDate instanceof Date && !isNaN(startTimeDate.valueOf())) ? startTimeDate.toLocaleString() : ""}
                                                description={"timestamp to add anomaly"}
                                                color={InfluxColors.Pepper}
                                                id={"icon-label"} 
                                                style={{marginLeft: "10px"}}
                                            />
                                        </Form.Element> 
                                    </Grid.Column>  
                                    <Grid.Column widthXS={Columns.One} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="Log">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={this.props.log["prediction"] ? this.props.log["prediction"] : ""}
                                                description={""}
                                                color={InfluxColors.Pepper}
                                                id={"icon-label"} 
                                                style={{marginLeft: "10px"}}
                                            />
                                        </Form.Element> 
                                    </Grid.Column>     
                                    <Grid.Column widthXS={Columns.Three} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="Feedback">
                                            <FlexBox
                                                alignItems={AlignItems.Center}
                                                margin={ComponentSize.Small}
                                                className="view-options--checkbox"
                                                key={uuid.v4()}
                                            >
                                                <SelectDropdown
                                                    // style={{width: "10%"}}
                                                    options={["Positive", "Negative"]}
                                                    selectedOption={this.state.feedback}
                                                    onSelect={(e) => {this.setState({feedback: e})}}
                                                /> 
                                                <QuestionMarkTooltip
                                                    style={{ marginLeft: "5px" }}
                                                    diameter={15}
                                                    color={ComponentColor.Primary}
                                                    tooltipContents={"Is this prediction useful or harmful for you?"}
                                                />
                                            </FlexBox>
                                        </Form.Element> 
                                    </Grid.Column>  
                                    {this.state.feedback.length ? (
                                        <Grid.Column widthXS={Columns.Four} /* style={{ margin: "7px" }} */>
                                            <Form.Element label="Feedback">
                                                <FlexBox
                                                    alignItems={AlignItems.Center}
                                                    margin={ComponentSize.Small}
                                                    className="view-options--checkbox"
                                                    key={uuid.v4()}
                                                >
                                                    <SelectDropdown
                                                        // style={{width: "10%"}}
                                                        options={["1h", "2h", "6h", "12h", "24h"]}
                                                        selectedOption={this.state.feedbackRange}
                                                        onSelect={(e) => {this.setState({feedbackRange: e})}}
                                                    /> 
                                                    <QuestionMarkTooltip
                                                        style={{ marginLeft: "5px" }}
                                                        diameter={15}
                                                        color={ComponentColor.Primary}
                                                        tooltipContents={"How many hours is valid for this feedback?"}
                                                    />
                                                </FlexBox>
                                            </Form.Element> 
                                        </Grid.Column>      
                                    ) : <Grid.Column widthXS={Columns.Four}></Grid.Column>}                           
                                </Grid.Row>
                                <Grid.Row>  
                                    <Grid.Column widthXS={Columns.Six}>
                                        <div className="tabbed-page--header-left" style={{marginBottom: "10px"}}>
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"Failures in the 7-day range"}
                                                description={""}
                                                color={InfluxColors.Amethyst}
                                                id={"failure-label"} 
                                            />
                                        </div>                                
                                        <DapperScrollbars
                                            autoHide={false}
                                            autoSizeHeight={false}
                                            style={{ height: this.props.failures.length ? 50*this.props.failures.length + "px" : "50px", background: InfluxColors.Castle}}
                                            className="data-loading--scroll-content"
                                        >
                                            {this.props.failures.map(failure => {
                                                return (<FlexBox
                                                    alignItems={AlignItems.Center}
                                                    margin={ComponentSize.Small}
                                                    className="view-options--checkbox"
                                                    key={uuid.v4()}
                                                >
                                                    <Bullet
                                                        size={ComponentSize.ExtraSmall}
                                                        color="white"
                                                        backgroundColor={this.returnSeverityColor(failure["severity"])}
                                                        glyph={IconFont.Bell}
                                                    />
                                                    <InputLabel style={{color: this.returnSeverityColor(failure["severity"])}}>{failure["severity"]}</InputLabel>
                                                    <InputLabel>{new Date(failure["startTime"]).toLocaleString()}</InputLabel>
                                                    <QuestionMarkTooltip
                                                        style={{ marginLeft: "5px" }}
                                                        diameter={15}
                                                        color={ComponentColor.Secondary}
                                                        tooltipContents={failure["description"]}
                                                    />
                                                </FlexBox>)
                                            })}
                                            {!this.props.failures.length ? <InputLabel>No failure in the 7-day range</InputLabel> : <></>}
                                        </DapperScrollbars>   
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Six}>
                                        <div className="tabbed-page--header-left" style={{marginBottom: "10px"}}>
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"Summary"}
                                                description={""}
                                                color={InfluxColors.Amethyst}
                                                id={"summary-label"} 
                                            />
                                        </div>  
                                        <GradientBox
                                            borderGradient={Gradients.MiyazakiSky}
                                            borderColor={InfluxColors.Raven}
                                        >
                                            <Panel backgroundColor={InfluxColors.Raven}>
                                                <Panel.Body>
                                                    {!this.props.failures.length ? <div>There is no failure in the selected log's time range.</div>
                                                    :<div>There {this.props.failures.length>1 ? "is" : "are"} {this.props.failures.length} failure in the selected log's time range.</div>}
                                                    
                                                </Panel.Body>                                                
                                            </Panel>
                                        </GradientBox>
                                    </Grid.Column>                                                               
                                </Grid.Row>
                            </Grid>

                        ) : <></>}
                    </Overlay.Body>
                    <Overlay.Footer>
                        <>
                            <ConfirmationButton
                                icon={IconFont.Refresh}
                                onConfirm={() => this.updateModelLogFeedback()}
                                text="Update Feedback"
                                popoverColor={ComponentColor.Secondary}
                                popoverAppearance={Appearance.Outline}
                                color={ComponentColor.Secondary}
                                confirmationLabel="Are you sure you want to change feedback of this log?"
                                confirmationButtonColor={ComponentColor.Success}
                                confirmationButtonText="Click to confirm"
                                size={ComponentSize.Small}
                                style={{marginRight: "10px"}}
                            />                                
                            <Button
                                icon={IconFont.Undo}
                                color={ComponentColor.Primary}
                                titleText=""
                                text="Go Back"
                                type={ButtonType.Button}
                                onClick={this.props.onDismiss}
                            />
                        </>                
                    </Overlay.Footer>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default FeedbackOverlay