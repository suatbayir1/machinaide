import React, { PureComponent, createRef } from 'react'

import {
    Page, Grid, Columns, Panel, Notification, Orientation, SpinnerContainer, TechnoSpinner, RemoteDataState, EmptyState, Input,
    ComponentColor, ComponentSize, Gradients, IconFont, InfluxColors, WaitingText, QuestionMarkTooltip,
    Button, ButtonType, SelectDropdown, Tabs, GradientBox
} from '@influxdata/clockface'
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import ConfusionMatrixGraph from 'src/health/components/evidently-classification-graphs/ConfusionMatrixGraph'
import ClassRepresentationGraph from 'src/health/components/evidently-classification-graphs/ClassRepresentationGraph'
import QualityMetricGraph from 'src/health/components/evidently-classification-graphs/QualityMetricGraph'
import ClassificatinonQualityByFeatureGraph from 'src/health/components/evidently-classification-graphs/ClassificatinonQualityByFeatureGraph'

enum ReportState {
    Searching = "Searching",
    Creating = "Creating",
    Found = "Found",
    DontExist = "DontExist"
}

interface Props {
    match: any
}

interface State {
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    report: object
    model: object
    modelTask: string
    tabs: object[]
    activeTab: string
    feature: string
    features: string[]
    pageState: RemoteDataState
    reportState: ReportState
}

class ClassificationEvidentlyReportPage extends PureComponent<Props, State>{
    constructor(props) {
        super(props)
        this.state = {
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            report: null,
            model: null,
            modelTask: "",
            tabs: [{"id": "tab1", "text": "Class Representation"},{"id": "tab2", "text": "Confusion Matrix"},{"id": "tab3", "text": "Quality Metric"}, {"id": "tab4", "text": "Quality by Feature"}],
            activeTab: "tab1",
            feature: "",
            features: [],
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
                    let features = report["classification_performance"]["data"]["num_feature_names"]
                    this.setState({model: model, report: report, modelTask: report["task"], reportState: ReportState.Found,
                        features: features, pageState: report ? RemoteDataState.Done : RemoteDataState.Loading})
                })
            }
            else{
                HealthAssessmentService.getMLModel({"modelID": this.props.match.params.MID, "task": "rul"}).then(model=>{
                    console.log("model ", model)
                    this.setState({reportState: ReportState.DontExist, model: model})
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
                    let features = report["classification_performance"]["data"]["num_feature_names"]
                    this.setState({model: model, report: report, modelTask: report["task"], reportState: ReportState.Found,
                        features: features, pageState: RemoteDataState.Done})
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
                HealthAssessmentService.createRULEvidentlyReport(this.state.model["modelID"], settings).then(res=>{
                    this.intervalID = window.setInterval(() => {
                        this.updateReport() 
                    }, 30000)  
                })
            }
        })
    }

    returnConfusionMatrix = () => {
        let report = this.state.report
        if(report){
            let confusionMatrix = report["classification_performance"]["data"]["metrics"]["reference"]["confusion_matrix"]["values"]
            console.log("confusion matrix:", confusionMatrix)
            console.log(report)
            if(confusionMatrix.length === 2){
                let tn = confusionMatrix[0][0]
                let fp = confusionMatrix[0][1]
                let fn = confusionMatrix[1][0]
                let tp = confusionMatrix[1][1]
                return {tn, tp, fn, fp}
            }
            else if(confusionMatrix.length === 1){
                let tn = 0
                let fp = 0
                let fn = 0
                let tp = confusionMatrix[0][0]
                return {tn, tp, fn, fp}
            }
            else{
                return {tn: 0, tp: 0, fn: 0, fp: 0}
            }
        }
        else{
            return {tn: 0, tp: 0, fn: 0, fp: 0}
        }
    }

    returnCM = () => {
        let report = this.state.report
        if(report){
            let confusionMatrix = report["classification_performance"]["data"]["metrics"]["reference"]["confusion_matrix"]["values"]
            return confusionMatrix
        }
        return [[0, 0], [0, 0]]
    }

    returnZeroClass = (cmArr) => {
        if(cmArr.length === 2){
            return cmArr[0][0] + cmArr[0][1]
        }
        else{
            let label = this.state.report["classification_performance"]["data"]["metrics"]["reference"]["confusion_matrix"]["labels"][0]
            if(!label){
                return cmArr[0][0]
            }
            else{
                return 0
            }
        }
    } 

    returnOneClass = (cmArr) => {
        if(cmArr.length === 2){
            return cmArr[1][0] + cmArr[1][1]
        }
        else{
            let label = this.state.report["classification_performance"]["data"]["metrics"]["reference"]["confusion_matrix"]["labels"][0]
            if(label){
                return cmArr[0][0]
            }
            else{
                return 0
            }
        }
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
        const cm = this.returnConfusionMatrix()
        const cmArr = this.returnCM()
        return(
            <Page
                titleTag="Evidently Report"
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
                            onClick={() => this.getReport()}
                        />}
                        {this.state.pageState === RemoteDataState.Done && <Button
                            color={ComponentColor.Secondary}
                            titleText=""
                            text="Update Report"
                            type={ButtonType.Button}
                            icon={IconFont.Redo}
                            onClick={() => {this.handleChangeNotification("success", "update report"); this.onClickCreateReport();}}
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
                                        <Grid.Column widthXS={Columns.Six}>
                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <h6 style={{fontSize: "18px"}}>Model Name: <span style={{ color: 'green', marginLeft: "5px" }}><b>{model ? model["modelName"] : "-"}</b></span></h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Six}>
                                                    <h6 style={{fontSize: "18px"}}>Model Task: <span style={{ color: 'green', marginLeft: "5px" }}><b>{model ? model["task"] : "-"}</b></span></h6>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid.Column>
                                        <Grid.Column widthXS={Columns.Six}>
                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Three}>
                                                    <h6 style={{fontSize: "18px"}}>Accuracy: 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{report ? report["classification_performance"]["data"]["metrics"]["reference"]["accuracy"].toFixed(2) : "-"}</b></span>
                                                    </h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Three}>
                                                    <h6 style={{fontSize: "18px"}}>Precision: 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{report ? report["classification_performance"]["data"]["metrics"]["reference"]["precision"].toFixed(2) : "-"}</b></span>
                                                    </h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Three}>
                                                    <h6 style={{fontSize: "18px"}}>Recall: 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{report ? report["classification_performance"]["data"]["metrics"]["reference"]["recall"].toFixed(2) : "-"}</b></span>
                                                    </h6>
                                                </Grid.Column>
                                                <Grid.Column widthXS={Columns.Three}>
                                                    <h6 style={{fontSize: "18px"}}>F1: 
                                                        <span style={{ color: 'green', marginLeft: "5px" }}><b>{report ? report["classification_performance"]["data"]["metrics"]["reference"]["f1"].toFixed(2) : "-"}</b></span>
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
                                {activeTab === "tab1" && (
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <ClassRepresentationGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Class Representation Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Shows the number of objects of each class.</div><br/>
                                                            <div><span style={{color: InfluxColors.Galaxy}}>Class 0</span> shows the number of non-failure examples we have: <span style={{color: InfluxColors.Galaxy}}>{this.returnZeroClass(cmArr)}</span></div><br/>
                                                            <div><span style={{color: InfluxColors.Ruby}}>Class 1</span> shows the number of failure examples we have: <span style={{color: InfluxColors.Ruby}}>{this.returnOneClass(cmArr)}</span></div>
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
                                                <ConfusionMatrixGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Confusion Matrix Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>A confusion matrix is a table that is used to define the performance of a classification algorithm.</div><br/>
                                                            <div><span style={{color: InfluxColors.Rainforest}}>True Positive</span> shows the number of positive examples classified accurately we have: <span style={{color: InfluxColors.Rainforest}}>{cm["tp"]}</span></div><br/>
                                                            <div><span style={{color: InfluxColors.Amethyst}}>True Negative</span> shows the number of negative examples classified accurately we have: <span style={{color: InfluxColors.Amethyst}}>{cm["tn"]}</span></div><br/>
                                                            <div><span style={{color: InfluxColors.Pineapple}}>False Positive</span> shows the number of actual negative examples classified as positive we have: <span style={{color: InfluxColors.Pineapple}}>{cm["fp"]}</span></div><br/>
                                                            <div><span style={{color: InfluxColors.Fire}}>False Negative</span> shows the number of actual positive examples classified as negative we have: <span style={{color: InfluxColors.Fire}}>{cm["fn"]}</span></div><br/>
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
                                                <QualityMetricGraph report={this.state.report}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2>Quality Metrics by Class Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Shows the model quality metrics for the individual classes.</div>
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
                                                <SelectDropdown
                                                    // style={{width: "10%"}}
                                                    options={this.state.features}
                                                    selectedOption={this.state.feature.length ? this.state.feature : "Select a feature"}
                                                    onSelect={(e) => {this.setState({feature: e})}}
                                                /> 
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <ClassificatinonQualityByFeatureGraph report={this.state.report} feature={this.state.feature}/>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <GradientBox
                                                    borderGradient={Gradients.MiyazakiSky}
                                                    borderColor={InfluxColors.Raven}
                                                >
                                                    <Panel backgroundColor={InfluxColors.Raven}>
                                                        <Panel.Header>
                                                            <h2> Classification Quality by Feature Report</h2>
                                                        </Panel.Header>
                                                        <Panel.Body>
                                                            <div>Shows distribution of the True Positive, True Negative, False Positive, and False Negative predictions alongside the values of the feature.</div>
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

export default ClassificationEvidentlyReportPage