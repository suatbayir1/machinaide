import React, { PureComponent } from 'react'
import { Overlay, Grid,
    ButtonType, Button, ComponentColor, Columns, SelectDropdown,
    InfluxColors, ComponentSize, Label, Input, Notification,
    InputType, QuestionMarkTooltip,
    DapperScrollbars, AlignItems, InputToggleType,} from '@influxdata/clockface'
import {ANOMALY_DETECTION_TASK, RUL_TASK, 
        RULREG_TASK, POF_TASK} from '../constants'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import uuid from 'uuid'

// Services
import AutoMLService from 'src/shared/services/AutoMLService'
import DTService from 'src/shared/services/DTService';
import FailureService from 'src/shared/services/FailureService'

const optimizers = {
    'accuracy' : 'Accuracy',
    'val_accuracy': 'Validation Accuracy',
    'loss': 'Loss',
    'val_loss': 'Validation Loss',
    'mse': 'Mean Squared Error',
    'auc': 'AUC (Area Under The Curve)',
    'tp': 'True Positives',
    'tn': 'True Negatives',
    'fp': 'False Positives',
    'fn': 'False Negatives',
    'precision': 'Precision',
    'recall': 'Recall',
    'custom': 'Custom',
}

export const customMetricTipText = `Create a custom optimizer for classification problems. Use:
 - tp (for true positive)
 - tn (for true negative)
 - fp (for false positive)
 - fn (for false negative)`

const tipStyle = {
    borderStyle: 'none none solid none',
    borderWidth: '2px',
    borderColor: '#BE2EE4',
    boxShadow: '0 0 5px 0 #8E1FC3',
    margin: '3px'
}

interface Props {
    handleChangeNotification: (type: string, message: string) => void
    autoMLSettingsOverlay: boolean
    closeOverlay: ()=>void
}

interface State {
    activeTab: string

    selectedKerasTunerType: string
    kerasTunerTypes: string[]
    selectedKerasTunerOptimizer: string
    kerasTunerOptimizers: string[]
    kerasTunerNumberOfEpochs: string
    kerasTunerMinDataPoints: string
    kerasTunerCustomMetricEquation: string
    selectedKerasTunerCustomMetricDirection: string
    kerasTunerCustomMetricDirections: string[]

    selectedEvalMLObjective: string
    evalMLObjectives: string[]
    selectedEvalMLTimeout: string
    evalMLTimeouts: string[]
    selectedEvalMLMaxIterations: string
    evalMLMaxIterations: string[]
    evalMLMinDataPoints: string
    evalMLEarlyGuessPunishment: string
    evalMLLateGuessPunishment: string
}

class AutoMLSettingsOverlay extends PureComponent<Props, State>{
    state = {
        activeTab: "kerasTuner",
        selectedKerasTunerType: "HyperBand",
        kerasTunerTypes: ["HyperBand", "Random Search", "Bayesian Optimization"],
        selectedKerasTunerOptimizer: "Accuracy",
        kerasTunerOptimizers: ['Accuracy', 'Validation Accuracy', 'Loss', 'Validation Loss', 'Mean Squared Error','AUC (Area Under The Curve)', 
            'True Positives', 'True Negatives', 'False Positives', 'False Negatives', 'Precision', 'Recall', 'Custom'],
        kerasTunerNumberOfEpochs: "20",
        kerasTunerMinDataPoints: "200",
        kerasTunerCustomMetricEquation: "",
        selectedKerasTunerCustomMetricDirection: "Maximize",
        kerasTunerCustomMetricDirections: ["Maximize", "Minimize"],

        selectedEvalMLObjective: "MAE",
        evalMLObjectives: ["ExpVariance", "MAE", "MaxError", "Mean Squared Log Error", 
        "MedianAE", "MSE", "R2", "Root Mean Squared Error", "Root Mean Squared Log Error",
        "Custom ExpVariance", "Custom MAE", "Custom MaxError", "Custom Mean Squared Log Error", 
        "Custom MedianAE", "Custom MSE", "Custom R2", "Custom Root Mean Squared Error", "Custom Root Mean Squared Log Error",],
        selectedEvalMLTimeout: "1 h",
        evalMLTimeouts: ["1 h", "2 h", "3 h", "4 h", "5 h", "10 h", "24 h"],
        selectedEvalMLMaxIterations: "10",
        evalMLMaxIterations: ["5", "10", "15", "20"],
        evalMLMinDataPoints: "200",
        evalMLEarlyGuessPunishment: "1",
        evalMLLateGuessPunishment: "1",
    }

    async componentDidMount() {
        let settings = await AutoMLService.getAutoMLSettings()
        this.setState({
            selectedKerasTunerType: settings["kerasTunerType"],
            selectedKerasTunerOptimizer: settings["kerasTunerOptimizer"],
            kerasTunerNumberOfEpochs: settings["kerasTunerNumberOfEpochs"],
            kerasTunerMinDataPoints: settings["kerasTunerMinDataPoints"],
            kerasTunerCustomMetricEquation: settings["kerasTunerCustomMetricEquation"],
            selectedKerasTunerCustomMetricDirection: settings["kerasTunerCustomMetricDirection"],

            selectedEvalMLObjective: settings["evalMLObjective"],
            selectedEvalMLTimeout: settings["evalMLTimeout"],
            selectedEvalMLMaxIterations: settings["evalMLMaxIterations"],
            evalMLMinDataPoints: settings["evalMLMinDataPoints"],
            evalMLEarlyGuessPunishment: settings["evalMLCustomEarlyGuessPunishment"],
            evalMLLateGuessPunishment: settings["evalMLCustomLateGuessPunishment"],
        })
        console.log("did mount", settings)
    }

    handleSubmitAutoMLSettings = async (): Promise<void> => {
        if(this.state.activeTab === "kerasTuner"){
            let settings = {settingsType: "kerasTuner"}
            settings["kerasTunerType"] = this.state.selectedKerasTunerType
            settings["kerasTunerOptimizer"] = this.state.selectedKerasTunerOptimizer
            settings["kerasTunerNumberOfEpochs"] = this.state.kerasTunerNumberOfEpochs
            settings["kerasTunerMinDataPoints"] = this.state.kerasTunerMinDataPoints
            settings["kerasTunerCustomMetricEquation"] = this.state.kerasTunerCustomMetricEquation
            settings["kerasTunerCustomMetricDirection"] = this.state.selectedKerasTunerCustomMetricDirection
            
            const updatedResult = await AutoMLService.updateAutoMLSettings(settings)

            if (updatedResult.summary.code === 200) {
                this.props.handleChangeNotification("success", "KerasTuner settings are updated");
            } else {
                this.props.handleChangeNotification("error", "There was an error while updating KerasTuner settings");
            }
        }
        else if(this.state.activeTab === "evalML"){
            let settings = {settingsType: "evalML"}
            settings["evalMLObjective"] = this.state.selectedEvalMLObjective
            settings["evalMLMinDataPoints"] = this.state.evalMLMinDataPoints
            settings["evalMLMaxIterations"] = this.state.selectedEvalMLMaxIterations
            settings["evalMLTimeout"] = this.state.selectedEvalMLTimeout
            settings["evalMLCustomEarlyGuessPunishment"] = this.state.evalMLEarlyGuessPunishment
            settings["evalMLCustomLateGuessPunishment"] = this.state.evalMLLateGuessPunishment
            console.log(settings)
            const updatedResult = await AutoMLService.updateAutoMLSettings(settings)

            if (updatedResult.summary.code === 200) {
                this.props.handleChangeNotification("success", "EvalML settings are updated");
            } else {
                this.props.handleChangeNotification("error", "There was an error while updating EvalML settings");
            }
        }
    }


    public render(){
        return(
            <Overlay visible={this.props.autoMLSettingsOverlay}>
                <Overlay.Container maxWidth={800}>
                  <Overlay.Header
                    title="AutoML Settings"
                    onDismiss={this.props.closeOverlay}
                  />
                  <Overlay.Body>
                    <TabbedPageTabs
                        tabs={[{
                            text: 'KerasTuner Settings',
                            id: 'kerasTuner',
                        },
                        {
                            text: 'EvalML settings',
                            id: 'evalML',
                        }]}
                        activeTab={this.state.activeTab}
                        onTabClick={(e) => this.setState({ activeTab: e })}
                    />
                    <br/>
                    { this.state.activeTab === "kerasTuner" && (
                        <Grid>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Two}>
                                    <div className="tabbed-page--header-left">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={"Tuner Type:"}
                                            description={"KerasTuner Type"}
                                            color={InfluxColors.Castle}
                                            id={"icon-label"} 
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Four}>
                                    <div className="tabbed-page--header-left">
                                        <SelectDropdown
                                            options={this.state.kerasTunerTypes}
                                            selectedOption={this.state.selectedKerasTunerType}
                                            onSelect={(e) => {this.setState({selectedKerasTunerType: e})}}
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Two}>
                                    <div className="tabbed-page--header-left">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={"Optimizer:"}
                                            description={"Optimizer"}
                                            color={InfluxColors.Castle}
                                            id={"icon-label"} 
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Four}>
                                    <div className="tabbed-page--header-left">
                                        <SelectDropdown
                                            options={this.state.kerasTunerOptimizers}
                                            selectedOption={this.state.selectedKerasTunerOptimizer}
                                            onSelect={(e) => {this.setState({selectedKerasTunerOptimizer: e})}}
                                        />
                                    </div>
                                </Grid.Column>
                            </Grid.Row>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Three}>
                                    <div className="tabbed-page--header-left">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={"Number Of Epochs:"}
                                            description={"Number Of Epochs"}
                                            color={InfluxColors.Castle}
                                            id={"icon-label"} 
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Three}>
                                    <div className="tabbed-page--header-left">
                                        <Input
                                            onChange={(e) => this.setState({ kerasTunerNumberOfEpochs: e.target.value })}
                                            name="kerasTunerNumberOfEpochs"
                                            type={InputType.Text}
                                            value={this.state.kerasTunerNumberOfEpochs}
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Three}>
                                    <div className="tabbed-page--header-left">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={"Minimum Data Points:"}
                                            description={"Minimum Data Points"}
                                            color={InfluxColors.Castle}
                                            id={"icon-label"} 
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Three}>
                                    <div className="tabbed-page--header-left">
                                        <Input
                                            onChange={(e) => this.setState({ kerasTunerMinDataPoints: e.target.value })}
                                            name="kerasTunerMinDataPoints"
                                            type={InputType.Text}
                                            value={this.state.kerasTunerMinDataPoints}
                                        />
                                    </div>
                                </Grid.Column>
                            </Grid.Row>
                            { this.state.selectedKerasTunerOptimizer === "Custom" ? <>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <div className="tabbed-page--header-left">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"Custom Optimizer Creation:"}
                                                description={"Custom Optimizer Creation"}
                                                color={InfluxColors.Castle}
                                                id={"icon-label"} 
                                            />
                                            <QuestionMarkTooltip
                                                diameter={15}
                                                tooltipStyle={{ width: '400px' }}
                                                color={ComponentColor.Secondary}
                                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                    <div style={{ color: InfluxColors.Star }}>{"Text to query:"}
                                                        <hr style={tipStyle} />
                                                    </div>
                                                    {customMetricTipText}
                                                </div>}
                                            />
                                        </div>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Two}>
                                        <div className="tabbed-page--header-left">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"Equation:"}
                                                description={"Equation"}
                                                color={InfluxColors.Castle}
                                                id={"icon-label"} 
                                            />
                                        </div>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Six}>
                                        <div className="tabbed-page--header-left">
                                            <Input
                                                onChange={(e) => this.setState({ kerasTunerCustomMetricEquation: e.target.value })}
                                                name="kerasTunerCustomMetricEquation"
                                                type={InputType.Text}
                                                value={this.state.kerasTunerCustomMetricEquation}
                                            />
                                        </div>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Two}>
                                        <div className="tabbed-page--header-left">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"Direction:"}
                                                description={"Direction"}
                                                color={InfluxColors.Castle}
                                                id={"icon-label"} 
                                            />
                                        </div>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Two}>
                                        <div className="tabbed-page--header-left">
                                            <SelectDropdown
                                                options={this.state.kerasTunerCustomMetricDirections}
                                                selectedOption={this.state.selectedKerasTunerCustomMetricDirection}
                                                onSelect={(e) => {this.setState({selectedKerasTunerCustomMetricDirection: e})}}
                                            />
                                        </div>
                                    </Grid.Column>
                                </Grid.Row>
                            </> : <></>}
                        </Grid>
                    )}
                    { this.state.activeTab === "evalML" && (
                        <Grid>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Two}>
                                    <div className="tabbed-page--header-left">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={"Objective:"}
                                            description={"EvalML Objective"}
                                            color={InfluxColors.Castle}
                                            id={"icon-label"} 
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Four}>
                                    <div className="tabbed-page--header-left">
                                        <SelectDropdown
                                            options={this.state.evalMLObjectives}
                                            selectedOption={this.state.selectedEvalMLObjective}
                                            onSelect={(e) => {this.setState({selectedEvalMLObjective: e})}}
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Two}>
                                    <div className="tabbed-page--header-left">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={"Timeout:"}
                                            description={"Timeout"}
                                            color={InfluxColors.Castle}
                                            id={"icon-label"} 
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Four}>
                                    <div className="tabbed-page--header-left">
                                        <SelectDropdown
                                            options={this.state.evalMLTimeouts}
                                            selectedOption={this.state.selectedEvalMLTimeout}
                                            onSelect={(e) => {this.setState({selectedEvalMLTimeout: e})}}
                                        />
                                    </div>
                                </Grid.Column>
                            </Grid.Row>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Three}>
                                    <div className="tabbed-page--header-left">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={"Maximum Iterations:"}
                                            description={"Maximum Iterations"}
                                            color={InfluxColors.Castle}
                                            id={"icon-label"} 
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Three}>
                                    <div className="tabbed-page--header-left">
                                        <SelectDropdown
                                            options={this.state.evalMLMaxIterations}
                                            selectedOption={this.state.selectedEvalMLMaxIterations}
                                            onSelect={(e) => {this.setState({selectedEvalMLMaxIterations: e})}}
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Three}>
                                    <div className="tabbed-page--header-left">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={"Minimum Data Points:"}
                                            description={"Minimum Data Points"}
                                            color={InfluxColors.Castle}
                                            id={"icon-label"} 
                                        />
                                    </div>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Three}>
                                    <div className="tabbed-page--header-left">
                                        <Input
                                            onChange={(e) => this.setState({ evalMLMinDataPoints: e.target.value })}
                                            name="evalMLMinDataPoints"
                                            type={InputType.Text}
                                            value={this.state.evalMLMinDataPoints}
                                        />
                                    </div>
                                </Grid.Column>
                            </Grid.Row>
                            { this.state.selectedEvalMLObjective.includes("Custom") ? <>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <div className="tabbed-page--header-left">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"Custom Optimizer Creation:"}
                                                description={"Custom Optimizer Creation"}
                                                color={InfluxColors.Castle}
                                                id={"icon-label"} 
                                            />
                                            <QuestionMarkTooltip
                                                diameter={15}
                                                tooltipStyle={{ width: '400px' }}
                                                color={ComponentColor.Secondary}
                                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                    <div style={{ color: InfluxColors.Star }}>{"Text to query:"}
                                                        <hr style={tipStyle} />
                                                    </div>
                                                    {customMetricTipText}
                                                </div>}
                                            />
                                        </div>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Three}>
                                        <div className="tabbed-page--header-left">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"Early Guess Punishment:"}
                                                description={"Early Guess Punishment"}
                                                color={InfluxColors.Castle}
                                                id={"icon-label"} 
                                            />
                                        </div>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Three}>
                                        <div className="tabbed-page--header-left">
                                            <Input
                                                onChange={(e) => this.setState({ evalMLEarlyGuessPunishment: e.target.value })}
                                                name="evalMLEarlyGuessPunishment"
                                                type={InputType.Text}
                                                value={this.state.evalMLEarlyGuessPunishment}
                                            />
                                        </div>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Three}>
                                        <div className="tabbed-page--header-left">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={"Late Guess Punishment::"}
                                                description={"Late Guess Punishment"}
                                                color={InfluxColors.Castle}
                                                id={"icon-label"} 
                                            />
                                        </div>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Three}>
                                        <div className="tabbed-page--header-left">
                                            <Input
                                                onChange={(e) => this.setState({ evalMLLateGuessPunishment: e.target.value })}
                                                name="evalMLLateGuessPunishment"
                                                type={InputType.Text}
                                                value={this.state.evalMLLateGuessPunishment}
                                            />
                                        </div>
                                    </Grid.Column>
                                </Grid.Row>
                            </> : <></>}
                        </Grid>
                    )}
                  </Overlay.Body>
                  <Overlay.Footer>
                    <Button
                        color={ComponentColor.Primary}
                        titleText=""
                        text="Submit"
                        type={ButtonType.Submit}
                        onClick={() => this.handleSubmitAutoMLSettings()}
                    />
                  </Overlay.Footer>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default AutoMLSettingsOverlay