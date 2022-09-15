import React, { PureComponent, createRef } from 'react'

import {
    Page, Grid, Columns, Panel, Notification, Orientation, SpinnerContainer, TechnoSpinner, RemoteDataState, EmptyState, Input,
    ComponentColor, ComponentSize, Gradients, IconFont, InfluxColors, WaitingText, QuestionMarkTooltip,
    Button, ButtonType, SelectDropdown, Tabs, GradientBox, SquareButton
} from '@influxdata/clockface'
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import PredictedVSActualGraph from 'src/health/components/evidently-regression-graphs/PredictedVSActualGraph'
import PredictedVSActualTimeGraph from 'src/health/components/evidently-regression-graphs/PredictedVSActualTimeGraph'
import PredictedVSActualPerGroupGraph from 'src/health/components/evidently-regression-graphs/PredictedVSActualPerGroupGraph'
import PredictedVSActualErrorGraph from 'src/health/components/evidently-regression-graphs/PredictedVSActualErrorGraph'
import PredictedVSActualAbsolutePercentageErrorGraph from 'src/health/components/evidently-regression-graphs/PredictedVSActualAbsolutePercentageErrorGraph'
import ErrorNormalityGraph from 'src/health/components/evidently-regression-graphs/ErrorNormalityGraph'
import ErrorDistributionGraph from 'src/health/components/evidently-regression-graphs/ErrorDistributionGraph'
import ErrorBiasPerFeatureGraph from 'src/health/components/evidently-regression-graphs/ErrorBiasPerFeatureGraph'
import ErrorBiasTable from 'src/health/components/evidently-regression-graphs/ErrorBiasTable'

enum ReportState {
    Searching = "Searching",
    Creating = "Creating",
    Found = "Found",
    DontExist = "DontExist"
}

interface Props {
    match: any
}

const tabs1 = [{"id": "tab1", "text": "Predicted vs Actual"},{"id": "tab2", "text": "Predicted vs Actual in Time"},
        {"id": "tab3", "text": "Error (Predicted - Actual)"}, {"id": "tab4", "text": "Absolute Percentage Error"},
        {"id": "tab5", "text": "Error Distribution"},]
const tabs2 = [{"id": "tab6", "text": "Error Normality"}, {"id": "tab7", "text": "Predicted vs Actual per Group"},
        {"id": "tab8", "text": "Error Bias per Feature"}, {"id": "tab9", "text": "Error Bias: Mean/Most Common Feature Value per Group"},]

interface State {
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    report: object
    model: object
    modelTask: string
    tabs: object[]
    activeTab: string
    features: string[]
    feature: string
    pageState: RemoteDataState
    reportState: ReportState
}

class RegressionEvidentlyReportPage extends PureComponent<Props, State>{
    constructor(props) {
        super(props)
        this.state = {
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            report: null,
            model: null,
            modelTask: "",
            tabs: tabs1,
            activeTab: "tab1",
            features: [],
            feature: "",
            pageState: RemoteDataState.Loading,
            reportState: ReportState.Searching
        }
    }

    componentDidMount() {
        this.getReport()       
    }

    getReport = async () => {
        await HealthAssessmentService.getEvidentlyReport(this.props.match.params.MID).then((report)=>{
            console.log(report)
            if(report && "task" in report){
                HealthAssessmentService.getMLModel({"modelID": this.props.match.params.MID, "task": report["task"]}).then(model=>{
                    console.log("model ", model)
                    let features = report["regression_performance"]["data"]["num_feature_names"]
                    this.setState({model: model, report: report, modelTask: report["task"], reportState: ReportState.Found,
                        features: features, pageState: RemoteDataState.Done}, ()=>console.log("rulreg", this.state))
                })
            }
            else{
                HealthAssessmentService.getMLModel({"modelID": this.props.match.params.MID, "task": "rulreg"}).then(model=>{
                    console.log("model ", model)
                    this.setState({model: model, reportState: ReportState.DontExist}, ()=>console.log("rulreg - no report: ", this.state))
                })
            }            
        })    
    }

    updateReport = async () => {
        await HealthAssessmentService.getEvidentlyReport(this.props.match.params.MID).then((report)=>{
            console.log(report)
            if(report && "task" in report){
                HealthAssessmentService.getMLModel({"modelID": this.props.match.params.MID, "task": report["task"]}).then(model=>{
                    console.log("model ", model)
                    let features = report["regression_performance"]["data"]["num_feature_names"]
                    this.setState({model: model, report: report, modelTask: report["task"], reportState: ReportState.Found,
                        features: features, pageState: RemoteDataState.Done}, ()=>console.log("rulreg - update", this.state))
                })
            }
            else{
                this.setState({reportState: ReportState.Creating})
            }            
        })
    }

    public handleChangeNotification = (type, message) => {
        this.setState({
            notificationVisible: true,
            notificationType: type,
            notificationMessage: message,
        })
    }

    private intervalID: number
    onClickCreateReport = () => {
        this.setState({reportState: ReportState.Creating}, () => {
            console.log(this.state.model)
            if(this.state.model){
                let settings = {
                    "fields": this.state.model["dataInfo"]["fields"],
                    "daterange": "-30d"
                }
                HealthAssessmentService.createRULRegEvidentlyReport(this.state.model["pipelineID"], settings).then(res=>{
                    this.intervalID = window.setInterval(() => {
                        this.updateReport() 
                    }, 30000)  
                })
            }
        })
    }

    returnQualityMetricsResult = () => {
        let report = this.state.report
        if(report){
            let me = report["regression_performance"]["data"]["metrics"]["reference"]["mean_error"] ? report["regression_performance"]["data"]["metrics"]["reference"]["mean_error"].toFixed(3) : "null"
            let mae = report["regression_performance"]["data"]["metrics"]["reference"]["mean_abs_error"] ? report["regression_performance"]["data"]["metrics"]["reference"]["mean_abs_error"].toFixed(3) : "null"
            let mape = report["regression_performance"]["data"]["metrics"]["reference"]["mean_abs_perc_error"] ? report["regression_performance"]["data"]["metrics"]["reference"]["mean_abs_perc_error"] : "null"
            return {me, mae, mape}
        }
        return {me: "-", mae: "-", mape: "-"}
    }

    returnMeanErrorPerGroup = () => {
        let report = this.state.report
        if(report){
            let majority = report["regression_performance"]["data"]["metrics"]["reference"]["underperformance"]["majority"]["mean_error"] ? report["regression_performance"]["data"]["metrics"]["reference"]["underperformance"]["majority"]["mean_error"].toFixed(3) : "null"
            let underestimation = report["regression_performance"]["data"]["metrics"]["reference"]["underperformance"]["underestimation"]["mean_error"] ? report["regression_performance"]["data"]["metrics"]["reference"]["underperformance"]["underestimation"]["mean_error"].toFixed(3) : "null"
            let overestimation = report["regression_performance"]["data"]["metrics"]["reference"]["underperformance"]["overestimation"]["mean_error"] ? report["regression_performance"]["data"]["metrics"]["reference"]["underperformance"]["overestimation"]["mean_error"].toFixed(3) : "null"
            console.log("hello ", {majority, underestimation, overestimation})
            return {majority, underestimation, overestimation}
        }
        return {majority: "-", underestimation: "-", overestimation: "-"}
    }

    returnSpinner = () => {
        if(this.state.reportState === ReportState.Searching){
            return(
                <div>
                    <TechnoSpinner style={{textAlign: "-webkit-center"}}/>
                    <WaitingText text="Loading the report data" />
                </div>
            )
        }
        else if(this.state.reportState === ReportState.DontExist){
            return(
                <div>
                    <EmptyState testID="empty-tasks-list" size={ComponentSize.Medium}>
                        <EmptyState.Text>{`There is no report created for this model. Please click on "Create Report" button to create Evidently Report.`}</EmptyState.Text>
                    </EmptyState>
                </div>
            )
        }
        else if(this.state.reportState === ReportState.Creating){
            return(
                <div style={{textAlign: "-webkit-center"}}>
                    <TechnoSpinner />
                    <WaitingText text="Creating the report. Please wait" />
                </div>
            )
        }
        else{
            return(
                <div>
                    <TechnoSpinner />
                </div>
            )
        }
    }


    public render(): React.ReactNode {
        const {report, model, tabs, activeTab, modelTask} = this.state
        const activeTabName = tabs.find(t => t["id"] === activeTab)["text"]
        const {me, mae, mape} = this.returnQualityMetricsResult()
        const {majority, underestimation, overestimation} = this.returnMeanErrorPerGroup()

        return(
            <Page
                titleTag="Regression Evidently Report"
                className="alert-history-page"
            >
                <Page.Header fullWidth={true}>
                    <Page.Title
                        title="Evidently Report"
                    />
                    <div className="tabbed-page--header-right">
                        <Button
                            color={ComponentColor.Primary}
                            titleText=""
                            text="Return to Feedback Page"
                            type={ButtonType.Button}
                            icon={IconFont.CaretLeft}
                            onClick={() => this.props.history.goBack()}
                        />
                        {this.state.pageState === RemoteDataState.Done && <Button
                            color={ComponentColor.Primary}
                            titleText=""
                            text="Refresh Report"
                            type={ButtonType.Button}
                            icon={IconFont.Refresh}
                            onClick={() =>this.getReport()}
                        />}
                        {this.state.pageState === RemoteDataState.Done && <Button
                            color={ComponentColor.Secondary}
                            titleText=""
                            text="Update Report"
                            type={ButtonType.Button}
                            icon={IconFont.Redo}
                            onClick={() => console.log("lol")}
                        />}
                        {this.state.pageState === RemoteDataState.Loading && this.state.reportState === ReportState.DontExist && <Button
                            color={ComponentColor.Secondary}
                            titleText=""
                            text="Create Report"
                            type={ButtonType.Button}
                            icon={IconFont.TextBlock}
                            onClick={() => this.onClickCreateReport()}
                        />}
                    </div>
                </Page.Header>
                <Page.Contents
                    fullWidth={true}
                    scrollable={true}
                    className="alert-history-page--contents"
                >
                    <Notification
                        key={"id"}
                        id={"id"}
                        icon={
                            this.state.notificationType === 'success'
                                ? IconFont.Checkmark
                                : IconFont.Alerts
                        }
                        duration={5000}
                        size={ComponentSize.Small}
                        visible={this.state.notificationVisible}
                        gradient={
                            this.state.notificationType === 'success'
                                ? Gradients.HotelBreakfast
                                : Gradients.DangerDark
                        }
                        onTimeout={() => this.setState({ notificationVisible: false })}
                        onDismiss={() => this.setState({ notificationVisible: false })}
                    >
                        <span className="notification--message">{this.state.notificationMessage}</span>
                    </Notification>
                    <SpinnerContainer
                        loading={this.state.pageState}
                        spinnerComponent={this.returnSpinner()}
                    >
                        <Grid>
                            <Grid.Row style={{ border: 'solid 2px #999dab', borderRadius: '4px' }}>
                                    <Panel>
                                        <Grid.Column widthXS={Columns.Four}>
                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <h6 style={{fontSize: "18px"}}>Model Name: <span style={{ color: 'green', marginLeft: "5px" }}><b>{model ? model["modelName"] : "-"}</b></span></h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <h6 style={{fontSize: "18px"}}>Model Task: <span style={{ color: 'green', marginLeft: "5px" }}><b>{model ? model["task"] : "-"}</b></span></h6>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid.Column>
                                        <Grid.Column widthXS={Columns.Eight}>
                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Two}>
                                                    <h6 style={{fontSize: "18px"}}>Mean Error (ME): 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{me}</b></span>
                                                    </h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Two}>
                                                    <h6 style={{fontSize: "18px"}}>Mean Absolute Error (MAE): 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{mae}</b></span>
                                                    </h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Two}>
                                                    <h6 style={{fontSize: "18px"}}>Mean Absolute Percentage Error (MAPE): 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{mape}</b></span>
                                                    </h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Two}>
                                                    <h6 style={{fontSize: "18px"}}>Majority (90%): 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{majority}</b></span>
                                                    </h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Two}>
                                                    <h6 style={{fontSize: "18px"}}>Underestimation (5%): 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{underestimation}</b></span>
                                                    </h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Two}>
                                                    <h6 style={{fontSize: "18px"}}>Overestimation (5%): 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{overestimation}</b></span>
                                                    </h6>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid.Column>
                                        
                                    </Panel>
                            </Grid.Row>
                            <Grid.Row>
                                <Tabs.Container orientation={Orientation.Horizontal}>
                                    <Tabs
                                        orientation={Orientation.Horizontal}
                                        size={ComponentSize.Large}
                                        dropdownBreakpoint={872}
                                        dropdownLabel={activeTabName}
                                    >
                                        {tabs.map(t => {
                                            let tabElement = (
                                                <Tabs.Tab
                                                    key={t["id"]}
                                                    text={t["text"]}
                                                    id={t["id"]}
                                                    onClick={()=>this.setState({activeTab: t["id"]}, ()=>console.log("state: ", this.state))}
                                                    active={t["id"] === activeTab}
                                                />
                                            )
                                            return tabElement
                                        })}
                                    </Tabs>
                                </Tabs.Container>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Eleven}>

                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.One}>
                                        <div className="tabbed-page--header-right">
                                            <SquareButton
                                                icon={IconFont.CaretLeft}
                                                onClick={()=>{this.setState({tabs: tabs1, activeTab: "tab1"})}}
                                                size={ComponentSize.Small}
                                            />
                                            <SquareButton
                                                icon={IconFont.CaretRight}
                                                onClick={()=>{this.setState({tabs: tabs2, activeTab: "tab6"})}}
                                                size={ComponentSize.Small}
                                            />
                                        </div>
                                    </Grid.Column>
                                </Grid.Row> 
                                {activeTab === "tab1" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <PredictedVSActualGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Predicted vs Actual Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Predicted versus actual values in a scatter plot.</div><br/>
                                                        </Panel.Body>
                                                        
                                                    </Panel>
                                                </GradientBox>
                                                
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                )}
                                {activeTab === "tab2" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <PredictedVSActualTimeGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Predicted vs Actual in Time Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Predicted and Actual values over time or by index, if no datetime is provided.</div><br/>
                                                        </Panel.Body>                                                
                                                    </Panel>
                                                </GradientBox>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                )}
                                {activeTab === "tab3" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <PredictedVSActualErrorGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Error (Predicted - Actual) Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Model error values over time or by index, if no datetime is provided.</div>
                                                        </Panel.Body>                                                
                                                    </Panel>
                                                </GradientBox>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                )}
                                {activeTab === "tab4" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <PredictedVSActualAbsolutePercentageErrorGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Absolute Percentage Error Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Absolute percentage error values over time or by index, if no datetime is provided.</div>
                                                        </Panel.Body>                                                
                                                    </Panel>
                                                </GradientBox>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>                                   
                                )}      
                                {activeTab === "tab5" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <ErrorDistributionGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Error Distribution Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Distribution of the model error values.</div>
                                                        </Panel.Body>                                                
                                                    </Panel>
                                                </GradientBox>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>                                   
                                )}  
                                {activeTab === "tab6" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <ErrorNormalityGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Error Normality Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Quantile-quantile plot (Q-Q plot) to estimate value normality.</div>
                                                        </Panel.Body>                                                
                                                    </Panel>
                                                </GradientBox>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>                                   
                                )}
                                {activeTab === "tab7" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <PredictedVSActualPerGroupGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Predicted vs Actual per Group</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>We plot the predictions, coloring them by the group they belong to. It visualizes the regions where the model underestimates and overestimates the target function.</div>
                                                        </Panel.Body>                                                
                                                    </Panel>
                                                </GradientBox>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>                                   
                                )}    
                                {activeTab === "tab8" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <SelectDropdown
                                                    options={this.state.features}
                                                    selectedOption={this.state.feature.length ? this.state.feature : "Select a feature"}
                                                    onSelect={(e) => {this.setState({feature: e})}}
                                                />                                            
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <ErrorBiasPerFeatureGraph report={this.state.report} feature={this.state.feature}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Error Bias per Feature Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Shows a histogram to visualize the distribution of its values in the segments with extreme errors and in the rest of the data.</div>
                                                        </Panel.Body>                                                
                                                    </Panel>
                                                </GradientBox>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>                                    
                                )}      
                                {activeTab === "tab9" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <ErrorBiasTable report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Error Bias Table</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>This table helps quickly see the differences in feature values between the 3 groups: <span style={{color: InfluxColors.Fire}}>OVER</span> (top-5% of predictions with overestimation), 
                                                             <span style={{color: InfluxColors.Amethyst}}>UNDER</span> (top-5% of the predictions with underestimation), <span style={{color: InfluxColors.Rainforest}}>MAJORITY</span> (the rest 90%) </div>
                                                        </Panel.Body>                                                
                                                    </Panel>
                                                </GradientBox>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>                                   
                                )}        
                            </Grid.Row>
                        </Grid>
                    </SpinnerContainer>
                </Page.Contents>
            </Page>
        )
    }
}

export default RegressionEvidentlyReportPage