import React, { PureComponent, createRef } from 'react'

import {
    Page, Grid, Columns, Panel, Notification, Orientation,ResourceCard, TechnoSpinner, RemoteDataState, InputType, Input,
    ComponentColor, ComponentSize, Gradients, IconFont, Icon, InfluxColors, WaitingText, QuestionMarkTooltip,
    Button, ButtonType, SelectDropdown, Alignment, ButtonBase, ButtonShape, ButtonBaseRef, SparkleSpinner,
    BorderType, Table, DapperScrollbars, SlideToggle, InputLabel, Label, SquareButton, CTAButton, GridColumn,
    AlignItems, InputToggleType, Toggle, FlexBox, Tabs, GradientBox, PaginationNav
} from '@influxdata/clockface'
import HealthAssessmentService from 'src/shared/services/HealthAssessmentService'
import ConfusionMatrixGraph from 'src/health/components/ConfusionMatrixGraph'
import ClassRepresentationGraph from 'src/health/components/ClassRepresentationGraph'
import QualityMetricGraph from 'src/health/components/QualityMetricGraph'

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
    tabs2: object[]
    activeTab: string
    feature: string
}

class RegEvidentlyReportPage extends PureComponent<Props, State>{
    constructor(props) {
        super(props)
        this.state = {
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            report: null,
            model: null,
            modelTask: "",
            tabs: [{"id": "tab1", "text": "Predicted vs Actual"},{"id": "tab2", "text": "Predicted vs Actual in Time"},
            {"id": "tab3", "text": "Error (Predicted - Actual)"}, {"id": "tab4", "text": "Absolute Percentage Error"},
            {"id": "tab5", "text": "Error Distribution"}, {"id": "tab6", "text": "Error Normality"},
            ],
            tabs2: [{"id": "tab7", "text": "Mean Error per Group"}, {"id": "tab8", "text": "Predicted vs Actual per Groupy"},
            {"id": "tab9", "text": "Error Bias: Mean/Most Common Feature Value per Group"}, {"id": "tab10", "text": "Error Bias per Feature"},
            {"id": "tab11", "text": "Predicted vs Actual per Feature"},],
            activeTab: "tab1",
            feature: "",
        }
    }

    async componentDidMount() {
        await HealthAssessmentService.getEvidentlyReport(this.props.match.params.MID).then((report)=>{
            console.log(report)
            HealthAssessmentService.getMLModel({"modelID": this.props.match.params.MID, "task": report["task"]}).then(model=>{
                console.log("model ", model)
                this.setState({model: model, report: report["report"], modelTask: report["task"]}, ()=>console.log("rulreg", this.state))
            })
        })
        
    }

    public handleChangeNotification = (type, message) => {
        this.setState({
            notificationVisible: true,
            notificationType: type,
            notificationMessage: message,
        })
    }

    returnConfusionMatrix = () => {
        let report = this.state.report
        if(report){
            let confusionMatrix = report["classification_performance"]["data"]["metrics"]["reference"]["confusion_matrix"]["values"]
            let tn = confusionMatrix[0][0]
            let fp = confusionMatrix[0][1]
            let fn = confusionMatrix[1][0]
            let tp = confusionMatrix[1][1]
            return {tn, tp, fn, fp}
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
                            color={ComponentColor.Secondary}
                            titleText=""
                            text="Update Report"
                            type={ButtonType.Button}
                            icon={IconFont.Refresh}
                            onClick={() => console.log("lol")}
                        />
                    </div>
                </Page.Header>
                <Page.Contents
                    fullWidth={true}
                    scrollable={true}
                    className="alert-history-page--contents"
                >
                    <Grid>
                        <Grid.Row>
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
                        </Grid.Row>
                        <Grid.Row style={{ border: 'solid 2px #999dab', borderRadius: '4px' }}>
                                <Panel>
                                    <Grid.Column widthXS={Columns.Six}>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <h6>Model Name: <span style={{ color: 'green', marginLeft: "5px" }}><b>{model ? model["modelName"] : "-"}</b></span></h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <h6>Model Task: <span style={{ color: 'green', marginLeft: "5px" }}><b>{model ? model["task"] : "-"}</b></span></h6>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid.Column>
                                    <Grid.Column widthXS={Columns.Six}>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Accuracy: 
                                                    <span style={{ color: 'green', marginLeft: "5px" }}><b>{report ? report["classification_performance"]["data"]["metrics"]["reference"]["accuracy"].toFixed(2) : "-"}</b></span>
                                                </h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Precision: 
                                                    <span style={{ color: 'green', marginLeft: "5px" }}><b>{report ? report["classification_performance"]["data"]["metrics"]["reference"]["precision"].toFixed(2) : "-"}</b></span>
                                                </h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>Recall: 
                                                    <span style={{ color: 'green', marginLeft: "5px" }}><b>{report ? report["classification_performance"]["data"]["metrics"]["reference"]["recall"].toFixed(2) : "-"}</b></span>
                                                </h6>
                                            </Grid.Column>
                                            <Grid.Column widthXS={Columns.Three}>
                                                <h6>F1: 
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
                            {modelTask === "rul" && activeTab === "tab1" && (
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Six}>
                                            {/* <ClassRepresentationGraph report={this.state.report}/> */}
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
                                                        <div><span style={{color: InfluxColors.Galaxy}}>Class 0</span> shows the number of non-failure examples we have: <span style={{color: InfluxColors.Galaxy}}>{cmArr[0][0] + cmArr[0][1]}</span></div><br/>
                                                        <div><span style={{color: InfluxColors.Ruby}}>Class 1</span> shows the number of failure examples we have: <span style={{color: InfluxColors.Ruby}}>{cmArr[1][0] + cmArr[1][1]}</span></div>
                                                    </Panel.Body>
                                                    
                                                </Panel>
                                            </GradientBox>
                                            
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>
                            )}
                            {modelTask === "rul" && activeTab === "tab2" && (
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Six}>
                                            {/* <ConfusionMatrixGraph report={this.state.report}/> */}
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
                            {modelTask === "rul" && activeTab === "tab3" && (
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Six}>
                                            {/* <QualityMetricGraph report={this.state.report}/> */}
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
                            {modelTask === "rul" && activeTab === "tab4" && (
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Six}>
                                            {/* <SelectDropdown
                                                // style={{width: "10%"}}
                                                options={["type1", "type2", "type3"]}
                                                selectedOption={this.state.feature}
                                                onSelect={(e) => {this.setState({feature: e})}}
                                            />  */}
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Six}>
                                            graph
                                        </Grid.Column>
                                        <Grid.Column widthXS={Columns.Six}>
                                            açıklama
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>                                    
                            )}            
                        </Grid.Row>
                    </Grid>
                </Page.Contents>

            </Page>
        )
    }
}

export default RegEvidentlyReportPage