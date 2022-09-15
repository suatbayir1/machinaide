// Libraries
import React, { Component } from 'react'
import uuid from "uuid"

// Components
import {
    Grid, Overlay, Gradients, List, Button, IconFont, ComponentColor, ButtonType,
    ComponentSize, ConfirmationButton, Appearance, Label, InfluxColors, SelectDropdown,
    TextArea, AutoComplete, Wrap, Form, Columns
} from '@influxdata/clockface'

interface Props {
    visible: boolean
    onDismiss: () => void
    annotation: object
    annotationObject: object
    timestamp: number
    user: object
    addAnnotation: (type: string, annotationType: string, description: string, username: string) => void
    deleteAnnotation: (timestamp: number) => void
    updateAnnotation: (timestamp: number, anomaly: object) => void
    changeFeedback: (timestamp: number, feedback: string) => void
}

interface State {
    type: string
    feedback: string
    code: string
    description: string
}

class FailureAnnotationOverlay extends Component<Props, State> {
    constructor(props){
        super(props)
        this.state ={
            code: "type1",
            description: "",
            type: "",
            feedback: ""
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (prevProps.annotationObject && this.props.annotationObject ) {
            //console.log("--<", prevProps.annotationObject, this.props.annotationObject)
            if(prevProps.annotationObject["code"] !== this.props.annotationObject["code"] ||
                prevProps.annotationObject["type"] !== this.props.annotationObject["type"] ||
                prevProps.annotationObject["description"] !== this.props.annotationObject["description"]){
                this.setState({code: this.props.annotationObject["code"],
                        type: this.props.annotationObject["type"],
                        description: this.props.annotationObject["description"]})
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
        if(!prevProps.annotationObject && this.props.annotationObject ){
            this.setState({code: this.props.annotationObject["code"], 
                description: this.props.annotationObject["description"],
                type: this.props.annotationObject["type"]})
        }
        if(prevProps.annotationObject && !this.props.annotationObject ){
            this.setState({code: "type1", description: "", type: ""})
        }
    }

    getFeedbackText = (feedback) => {
        if(feedback === "unlabeled")
            return "Unlabeled"
        else if(feedback === "tp")
            return "True Positive"
        else if(feedback === "fp")
            return "False Positive"
    }

    getFeedbackLabel = (feedback) => {
        if(feedback === "Unlabeled")
            return "unlabeled"
        else if(feedback === "True Positive")
            return "tp"
        else if(feedback === "False Positive")
            return "fp"
    }

    /* componentDidMount(): void {
        console.log("overlay", this.props)
        if(this.props.annotationObject){
            this.setState({feedback: this.props.annotationObject["feedback"]})
        }
    } */
    
    /* componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if(prevProps.timestamp !== this.props.annotation.timestamp){
            if(this.props.annotation){
                this.setState({type: this.props.annotationObject.type, description: this.props.annotationObject.description})
            }
            else{
                this.setState({type: "type1", description: ""})
            }
        }
    } */

    render(){
        return(
            <Overlay visible={this.props.visible}>
                <Overlay.Container maxWidth={900}>
                    <Overlay.Header
                        title="Anomaly Annotation"
                        onDismiss={() =>{
                            if(this.props.annotation === null){
                                this.setState({
                                    code: "type1",
                                    description: "",
                                    type: "",
                                    feedback: ""
                                })
                            }                            
                            this.props.onDismiss()
                        }}
                    />
                    <Overlay.Body>
                        {this.props.annotation === null ? (
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Six} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="Timestamp">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={new Date(this.props.timestamp).toLocaleDateString() + " " + new Date(this.props.timestamp).toLocaleTimeString()}
                                                description={"timestamp to add anomaly"}
                                                color={InfluxColors.Pepper}
                                                id={"icon-label"} 
                                                style={{marginLeft: "10px"}}
                                            />
                                        </Form.Element> 
                                    </Grid.Column>   
                                    <Grid.Column widthXS={Columns.Six} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="Type">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"manual"}
                                                description={""}
                                                color={InfluxColors.Pepper}
                                                id={"icon-label"} 
                                                style={{marginLeft: "10px"}}
                                            />
                                        </Form.Element> 
                                    </Grid.Column>                                 
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Six} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="Anomaly Code">
                                            <SelectDropdown
                                                // style={{width: "10%"}}
                                                options={["type1", "type2", "type3"]}
                                                selectedOption={this.state.code}
                                                onSelect={(e) => {this.setState({code: e})}}
                                            /> 
                                        </Form.Element> 
                                    </Grid.Column> 
                                    <Grid.Column widthXS={Columns.Six} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="User">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={this.props.user ? this.props.user["name"] ? this.props.user["name"] : "-" : "-"}
                                                description={"timestamp to add anomaly"}
                                                color={InfluxColors.Pepper}
                                                id={"icon-label"} 
                                                style={{marginLeft: "10px"}}
                                            />
                                        </Form.Element> 
                                    </Grid.Column>                                
                                </Grid.Row>
                                <Grid.Row>
                                    <Form.Element label="Description">
                                        <TextArea
                                            className="alert-builder--message-template"
                                            autoFocus={false}
                                            autocomplete={AutoComplete.On}
                                            form=""
                                            maxLength={500}
                                            minLength={5}
                                            name="statusMessageTemplate"
                                            onChange={(e)=>this.setState({description: e.target.value})}
                                            readOnly={false}
                                            required={false}
                                            size={ComponentSize.Medium}
                                            spellCheck={true}
                                            testID="status-message-textarea"
                                            value={this.state.description}
                                            wrap={Wrap.Soft}
                                            placeholder=""
                                        />
                                    </Form.Element>                                     
                                </Grid.Row>
                            </Grid> 
                        ) : (
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Six} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="Timestamp">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={new Date(this.props.timestamp).toLocaleDateString() + " " + new Date(this.props.timestamp).toLocaleTimeString()}
                                                description={"timestamp to add anomaly"}
                                                color={InfluxColors.Pepper}
                                                id={"icon-label"} 
                                                style={{marginLeft: "10px"}}
                                            />
                                        </Form.Element> 
                                    </Grid.Column>  
                                    <Grid.Column widthXS={Columns.Six} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="Type">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={this.props.annotationObject ? this.props.annotationObject["type"] : "manual"}
                                                description={""}
                                                color={InfluxColors.Pepper}
                                                id={"icon-label"} 
                                                style={{marginLeft: "10px"}}
                                            />
                                        </Form.Element> 
                                    </Grid.Column>                                 
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Six} /* style={{ margin: "7px" }} */>
                                        <Form.Element label="Anomaly Code">
                                            {/* <Label
                                                size={ComponentSize.Small}
                                                name={this.props.annotationObject ? this.props.annotationObject["code"] : "type1"}
                                                description={""}
                                                color={InfluxColors.Pepper}
                                                id={"icon-label"} 
                                                style={{marginLeft: "10px"}}
                                            /> */}
                                            <SelectDropdown
                                                // style={{width: "10%"}}
                                                options={["type1", "type2", "type3"]}
                                                selectedOption={this.state.code}
                                                onSelect={(e) => {this.setState({code: e})}}
                                            /> 
                                        </Form.Element> 
                                    </Grid.Column>  
                                    {this.props.annotationObject["type"] === "manual" && (
                                        <Grid.Column widthXS={Columns.Six} /* style={{ margin: "7px" }} */>
                                            <Form.Element label="User">
                                                <Label
                                                    size={ComponentSize.Small}
                                                    name={this.props.annotationObject ? this.props.annotationObject["user"] : "-"}
                                                    description={""}
                                                    color={InfluxColors.Pepper}
                                                    id={"icon-label"} 
                                                    style={{marginLeft: "10px"}}
                                                />
                                            </Form.Element> 
                                        </Grid.Column>
                                    )}
                                    {this.props.annotationObject["type"] === "model" && (
                                        <Grid.Column widthXS={Columns.Six} /* style={{ margin: "7px" }} */>
                                            <Form.Element label="Feedback">
                                            <SelectDropdown
                                                // style={{width: "10%"}}
                                                options={["Unlabeled", "True Positive", "False Positive"]}
                                                selectedOption={this.getFeedbackText(this.props.annotationObject["feedback"])}
                                                onSelect={(e) => {this.setState({feedback: e}, ()=>this.props.changeFeedback(this.props.timestamp, this.getFeedbackLabel(e)))}}
                                            /> 
                                            </Form.Element> 
                                        </Grid.Column>
                                    )}                              
                                </Grid.Row>
                                <Grid.Row>
                                    <Form.Element label="Description">
                                        {/* <TextArea
                                            className="alert-builder--message-template"
                                            autoFocus={false}
                                            form=""
                                            maxLength={500}
                                            minLength={5}
                                            name="statusMessageTemplate"
                                            readOnly={true}
                                            required={false}
                                            size={ComponentSize.Medium}
                                            spellCheck={true}
                                            testID="status-message-textarea"
                                            value={this.props.annotationObject ? this.props.annotationObject["description"] : ""}
                                            wrap={Wrap.Soft}
                                            placeholder=""
                                        /> */}
                                        <TextArea
                                            className="alert-builder--message-template"
                                            autoFocus={false}
                                            autocomplete={AutoComplete.On}
                                            form=""
                                            maxLength={500}
                                            minLength={5}
                                            name="statusMessageTemplate"
                                            onChange={(e)=>this.setState({description: e.target.value})}
                                            readOnly={this.props.annotationObject["type"] === "model"}
                                            required={false}
                                            size={ComponentSize.Medium}
                                            spellCheck={true}
                                            testID="status-message-textarea"
                                            value={this.state.description}
                                            wrap={Wrap.Soft}
                                            placeholder=""
                                        />
                                    </Form.Element>                                     
                                </Grid.Row>
                            </Grid>
                        )}
                    </Overlay.Body>
                    <Overlay.Footer>
                        {this.props.annotation === null ? (
                            <>
                                <Button
                                    icon={IconFont.Plus}
                                    color={ComponentColor.Secondary}
                                    titleText="Add anomaly annotation to the selecten timestamp"
                                    text="Add annotation"
                                    type={ButtonType.Button}
                                    onClick={() => {
                                        this.props.addAnnotation(this.state.type, this.state.code, this.state.description, this.props.user["name"])
                                        this.setState({type: "", code: "type1", description: ""})
                                    }}
                                    style={{marginRight: "10px"}}
                                />
                                <Button
                                    icon={IconFont.Undo}
                                    color={ComponentColor.Primary}
                                    titleText="Cancel anomaly addition task"
                                    text="Go Back"
                                    type={ButtonType.Button}
                                    onClick={this.props.onDismiss}
                                />
                            </>
                        ) : (
                            <>
                            {this.props.annotationObject["type"] === "manual" && (
                                <>
                                    <Button
                                        icon={IconFont.WrenchNav}
                                        color={ComponentColor.Success}
                                        titleText=""
                                        text="Update Annotation"
                                        type={ButtonType.Button}
                                        onClick={()=>this.props.updateAnnotation(this.props.timestamp, {"code": this.state.code, "description": this.state.description})}
                                    />
                                    <ConfirmationButton
                                        icon={IconFont.Trash}
                                        onConfirm={() => this.props.deleteAnnotation(this.props.annotation.x)}
                                        text="Delete Annotation"
                                        popoverColor={ComponentColor.Danger}
                                        popoverAppearance={Appearance.Outline}
                                        color={ComponentColor.Danger}
                                        confirmationLabel="Are you sure you want to delete this anomaly annotation?"
                                        confirmationButtonColor={ComponentColor.Danger}
                                        confirmationButtonText="Click to confirm"
                                        size={ComponentSize.Small}
                                        style={{marginRight: "10px"}}
                                    />
                                </>
                            )}
                                
                                <Button
                                    icon={IconFont.Undo}
                                    color={ComponentColor.Primary}
                                    titleText=""
                                    text="Go Back"
                                    type={ButtonType.Button}
                                    onClick={this.props.onDismiss}
                                />
                            </>
                        )}
                    </Overlay.Footer>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default FailureAnnotationOverlay