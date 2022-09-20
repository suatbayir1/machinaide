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
    log: object
    modelID: string
    failures: object[]
    user?: object
}

interface State {
    feedback: string
}

class FeedbackOverlay extends Component<Props, State> {
    constructor(props){
        super(props)
        this.state ={
            feedback: ""
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if ((prevProps.log && this.props.log) ) {
            //console.log("--<", prevProps.annotationObject, this.props.annotationObject)
            if(prevProps.log["timestamp"] !== this.props.log["timestamp"] ||
                (prevProps.log["feedback"] ?  prevProps.log["feedback"] !== this.props.log["feedback"] : false)){
                    if("feedback" in this.props.log){
                        this.setState({feedback: this.props.log["feedback"]})
                    }
                    else{
                        this.setState({feedback: ""})
                    }
            }
            /* else{
                if(prevState.code !== this.props.annotationObject["code"]){
                    this.setState({code: this.props.annotationObject["code"]})
                }
            }
            if(prevProps.annotationObject["description"] !== this.props.annotationObject["description"]){
                console.log(prevState)
                this.setState({description: this.props.annotationObject["description"]})
            }
            else{
                if(prevState.description !== this.props.annotationObject["description"]){
                    this.setState({description: this.props.annotationObject["description"]})
                }
            } */
            
            /* if(prevProps.annotationObject["description"] !== this.props.annotationObject["description"]){
                this.setState({description: this.props.annotationObject["description"]})
            }
            if(prevProps.annotationObject["code"] !== this.props.annotationObject["code"]){
                this.setState({code: this.props.annotationObject["code"]})
            } */
        }
        else if(!prevProps.log && this.props.log ){
            if("feedback" in this.props.log){
                this.setState({feedback: this.props.log["feedback"]})
            }
            else{
                this.setState({feedback: ""})
            }
        }
    }

    updateModelLogFeedback = async () => {
        await HealthAssessmentService.updateModelLogFeedback({"modelID": this.props.modelID, "timestamp": this.props.log["time"], "feedback": this.state.feedback})
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
                                    feedback: ""
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
                                    <Grid.Column widthXS={Columns.Four} /* style={{ margin: "7px" }} */>
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