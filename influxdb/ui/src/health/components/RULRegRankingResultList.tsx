import React from 'react'
import _ from 'lodash'
import ReactTooltip from 'react-tooltip'
import uuid from 'uuid'
// import CompareOverlay from "src/ml/components/CompareOverlay";
import RULRegCompareOverlay from "src/health/components/RULRegCompareOverlay"

// Components
import {
    Panel, Grid, Columns, Form, Input, MultiSelectDropdown, InputType,
    Button, ButtonType, ComponentColor, IconFont, DapperScrollbars,
    SpinnerContainer, RemoteDataState, TechnoSpinner, ComponentStatus
} from '@influxdata/clockface'


// metric tips 

const mcvTip = '<p><code>Mean Cross Validation Score</code><br/>Average of selected objective metric score in all CV iterations.</p>'

const stdcvTip = '<p><code>Standard Deviation Cross Validation Score</code><br/>Standard deviation in all CV iterations.</p>'

const vsTip = '<p><code>Validation Score</code><br/>The score on the validation dataset.</p>'

const hvcvTip = '<p><code>High Variance Cross Validation Score</code><br/>Tells whether or not the model is over fitting.</p>'

const pbtbTip = '<p><code>Percent Better Than Baseline</code><br/>How many percent the model is better than baseline.</p>'

const colors = {
    "COMPLETED": "#67D74E",
    "INVALID": "#F95F53",
    "IDLE": "#FFE480",
    "STOPPED": "#DC4E58",
    "RUNNING": "#00C9FF",
    "TIMEOUT": "#BF3D5E",
    "KILLED": "#BF3D5E"
}

/* const listColumnsDropdown = [
    {id:"pipeline_name", name:'Pipeline Name'},
    {id:"duration", name:'Duration'},
    {id:"mean_cv_score", name:'Mean CV Score'},
    {id:"standard_deviation_cv_score", name:'Standard Deviation CV Score'},
    {id:"validation_score", name:'Validation Score '},
    {id:"percent_better_than_baseline", name:'Percent Better Than Baseline'},
    {id:"high_variance_cv", name:'High Variance CV'}
] */

const listColumnsDropdown = [
    'Pipeline Name',
    'Duration',
    'Mean CV Score',
    'Standard Deviation CV Score',
    'Validation Score',
    'Percent Better Than Baseline',
    'High Variance CV'
]

/* const listColumnsDropdownSelected = [
    {id:"pipeline_name", name:'Pipeline Name'},
    {id:"duration", name:'Duration'},
    {id:"mean_cv_score", name:'Mean CV Score'},
    {id:"standard_deviation_cv_score", name:'Standard Deviation CV Score'},
] */

const listColumnsDropdownSelected = [
    'Pipeline Name',
    'Duration',
    'Mean CV Score',
    'Standard Deviation CV Score',
]

enum Direction {
    ASC = 'asc',
    DESC = 'desc',
    NONE = 'none',
}

interface Props {
    trials: any[]
    experimentJob: string
    durations: object
}

interface State {
    trials: any[]
    filteredTrials: any[]
    selectedTypes: any[]
    selectedColumnsDropdown: any[]
    compareOverlay: boolean
    sortKey: string
    sortDirection: Direction
    selectedPipelinesData: object[]
    graphVariables: object[]
}

class RULRegRankingResultList extends React.Component<Props, State>{
    state = {
        trials : [],
        filteredTrials: [],
        selectedTypes: [],
        selectedColumnsDropdown: listColumnsDropdownSelected,
        compareOverlay: false,
        sortKey: "",
        sortDirection: Direction.NONE,
        selectedPipelinesData: [],
        graphVariables: [],
    }

    componentDidMount() {
        let trials = this.props.trials
        let durations = this.props.durations
        let trialsData = []
        for(let trial of trials){
            let tdata = trial
            tdata["duration"] = durations[trial["pipeline_name"]] ? durations[trial["pipeline_name"]]["duration"] : 0
            tdata["checked"] = false
            trialsData.push(tdata)
        }
        // , beta: parseInt(this.props.beta)
        this.setState({trials: trialsData, filteredTrials: trialsData}, ()=>console.log(this.state))
    }

    checkedStatus = (pipelineID) => {
        let trial = this.state.trials.find(x=>x["id"]===pipelineID)
        return trial["checked"]
    }

    changeTrial = (e, id) =>{
        e.preventDefault()
        let trialsChanged = this.state.trials
        for(let trial of trialsChanged){
            if(trial["id"] === id){
                trial["checked"] = !trial["checked"]
            }
        }
        //let enabledChanged = this.state.enabled
        //enabledChanged[trialNo] = !this.state.enabled[trialNo]
        this.setState({trials: trialsChanged}) //, enabled: enabledChanged, changed: !this.state.changed
    }

    returnDuration = (durationSecs) => {
        // console.log(durationSecs)
        if(durationSecs){
            let duration = new Date(durationSecs * 1000).toISOString().substr(11, 8)
            return duration  
        }
        else{
            return "00:00:00"
        }        
    }

    getCheckedTrials = () => {
        let checkedTrials = []
        for(let trial of this.state.trials){
            if(trial["checked"]){
                checkedTrials.push(trial)    
            }
        }
        return checkedTrials
    }

    isCompareButtonActive = () => {
        let checkedPipelines = this.getCheckedTrials()
        if(checkedPipelines.length > 0){
            return ComponentStatus.Default
        }
        return ComponentStatus.Disabled
    }

    uncheckAll = () => {
        let trialsChanged = this.state.trials
        for(let trial of trialsChanged){
            trial["checked"] = false
        }
        this.setState({trials: trialsChanged})
    }

    createCheckPipelinesData = () => {
        let pipelineData = this.props.trials
        let pipelineNames = []

        for(let pipeline of pipelineData){
            if(pipeline["pipeline_name"]){
                if(pipeline["pipeline_name"].length){
                    pipelineNames.push(pipeline["pipeline_name"].split(" ")[0])
                }                
            }
        }

        let checkedPipelines = this.getCheckedTrials()

        let minMeanCV = Math.min.apply(Math, checkedPipelines.map(x => x["mean_cv_score"]))
        let maxMeanCV = Math.max.apply(Math, checkedPipelines.map(x => x["mean_cv_score"]))

        let minSTDCV = Math.min.apply(Math, checkedPipelines.map(x => x["standard_deviation_cv_score"]))
        let maxSTDCV = Math.max.apply(Math, checkedPipelines.map(x => x["standard_deviation_cv_score"]))

        let minValCV = Math.min.apply(Math, checkedPipelines.map(x => x["validation_score"]))
        let maxValCV = Math.max.apply(Math, checkedPipelines.map(x => x["validation_score"]))

        let minPerCV = Math.min.apply(Math, checkedPipelines.map(x => x["percent_better_than_baseline"]))
        let maxPerCV = Math.max.apply(Math, checkedPipelines.map(x => x["percent_better_than_baseline"]))

        let variables = [
            {
                key: 'pipeline',
                type: 'point',
                padding: 1,
                values: pipelineNames,
                legend: 'pipeline',
                ticksPosition: 'before',
                legendPosition: 'start',
                legendOffset: 20,
                tickRotation: -45
            },
            {
                key: "mean_cv_score",
                type: 'linear',
                min: ((minMeanCV - 100) + ""),
                max: ((maxMeanCV + 100) + ""),
                ticksPosition: 'before',
                legend: "mean_cv_score",
                legendPosition: 'start',
                legendOffset: 20
            },
            {
                key: "standard_deviation_cv_score",
                type: 'linear',
                min: ((minSTDCV - 100) + ""),
                max: ((maxSTDCV + 100) + ""),
                ticksPosition: 'before',
                legend: "standard_deviation_cv_score",
                legendPosition: 'start',
                legendOffset: 20
            },
            {
                key: "validation_score",
                type: 'linear',
                min: ((minValCV - 100) + ""),
                max: ((maxValCV + 100) + ""),
                ticksPosition: 'before',
                legend: "validation_score",
                legendPosition: 'start',
                legendOffset: 20
            },
            {
                key: "percent_better_than_baseline",
                type: 'linear',
                min: ((minPerCV - 20) + ""),
                max: ((maxPerCV + 20) + ""),
                ticksPosition: 'before',
                legend: "percent_better_than_baseline",
                legendPosition: 'start',
                legendOffset: 20
            },
            {
                key: "high_variance_cv",
                type: 'point',
                padding: 1,
                values: ["True", "False"],
                legend: "high_variance_cv",
                ticksPosition: 'before',
                legendPosition: 'start',
                legendOffset: 20,
            },
        ]

        let selectedGraphData = []    

        for(let pipeline of checkedPipelines){
            let data = {}
            data["pipeline"] = pipeline["pipeline_name"] ? pipeline["pipeline_name"].length ? pipeline["pipeline_name"].split(" ")[0] : "-" : "-"
            data["mean_cv_score"] = pipeline["mean_cv_score"] ? pipeline["mean_cv_score"] : null
            data["standard_deviation_cv_score"] = pipeline["standard_deviation_cv_score"] ? pipeline["standard_deviation_cv_score"] : null
            data["validation_score"] = pipeline["validation_score"] ? pipeline["validation_score"] : null
            data["percent_better_than_baseline"] = pipeline["percent_better_than_baseline"] ? pipeline["percent_better_than_baseline"] : null
            data["high_variance_cv"] = pipeline["high_variance_cv"] ? "True" : "False"
            selectedGraphData.push(data)
        }

        this.setState({compareOverlay: !this.state.compareOverlay, selectedPipelinesData: selectedGraphData, graphVariables: variables})

    }

    //sort functions
    private changeSort = (key: string): (() => void) => (): void => {
        // if we're using the key, reverse order; otherwise, set it with ascending
        if (this.state.sortKey === key) {
            const reverseDirection: Direction =
            this.state.sortDirection === Direction.ASC
                ? Direction.DESC
                : Direction.ASC
            this.setState({sortDirection: reverseDirection})
        } else {
            this.setState({sortKey: key, sortDirection: Direction.ASC})
        }
    }

    private sortableClasses = (key: string): string => {
        if (this.state.sortKey === key) {
            if (this.state.sortDirection === Direction.ASC) {
            return 'alert-history-table--th sortable-header sorting-ascending'
            }
            return 'alert-history-table--th sortable-header sorting-descending'
        }
        return 'alert-history-table--th sortable-header'
    }

    private sort = (
        trials: any[],
        key: string,
        direction: Direction
        ): any[] => {
        switch (direction) {
            case Direction.ASC:
            return _.sortBy<any>(trials, e => e[key])
            case Direction.DESC:
            return _.sortBy<any>(trials, e => e[key]).reverse()
            default:
            return trials
        }       
    }

    handleChange = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    checkisNaN = (num) => {
        if(num){
            if(isNaN(num)){
                return "Baseline"
            }
            else{
                return num.toFixed(2)
            }
        }
        else{
            return "Baseline"
        }
    }

    handleSelectedColumnsDropdown = (selectedColumn: string) => {
        const {selectedColumnsDropdown} = this.state
        // const {selectedProductionLines, selectedMachines, selectedComponents, selectedSensors} = this.state
        if (selectedColumnsDropdown.includes(selectedColumn)) {
            const filteredOptions = selectedColumnsDropdown.filter(o => o !== selectedColumn)
            // remove upper level
            //const filteredSensors = selectedSensors.filter(o => !selectedField.includes(o))
            return this.setState({selectedColumnsDropdown: filteredOptions})
        }

        const filteredOptions = [...selectedColumnsDropdown, selectedColumn]
        // if all fields selected? 
        // const {allFieldsMenu, allSensorsMenu} = this.state
        // const filteredSensors = allSensorsMenu
        this.setState({selectedColumnsDropdown: filteredOptions})
    }

    render() {
        const trials = this.sort(
            this.state.filteredTrials,
            this.state.sortKey,
            this.state.sortDirection
        )

        return (
            <Panel>
                {
                    this.props.trials.length < 1 &&
                    <SpinnerContainer loading={RemoteDataState.Loading} spinnerComponent={<TechnoSpinner />}>
                    </SpinnerContainer>
                }
                {
                    this.props.trials.length > 0 &&
                    <Grid style={{ padding: '10px 30px 30px 30px' }}>
                        <Grid.Row>
                            <RULRegCompareOverlay
                                visible={this.state.compareOverlay}
                                onDismiss={() => this.setState({ compareOverlay: false })}
                                data={this.state.selectedPipelinesData} 
                                variables={this.state.graphVariables}
                            />
                        </Grid.Row>

                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Three}>
                                <Form.Element label="Select Columns">
                                    <MultiSelectDropdown
                                        emptyText={"Select Columns"}
                                        options={listColumnsDropdown}
                                        selectedOptions={this.state.selectedColumnsDropdown}
                                        onSelect={this.handleSelectedColumnsDropdown}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Seven}/>
                            <Grid.Column widthXS={Columns.Two}>
                                <Form.Element label="">
                                    <Button
                                        color={ComponentColor.Primary}
                                        titleText=""
                                        text="Compare"
                                        type={ButtonType.Submit}
                                        status={this.isCompareButtonActive()}
                                        onClick={() => this.createCheckPipelinesData()}
                                    />
                                </Form.Element>
                            </Grid.Column>
                        </Grid.Row>
                        <br />
                        <br />

                        <div className="alert-history-table">
                            <div className="alert-history-table--thead">
                                <div
                                    onClick={this.changeSort('id')}
                                    className={this.sortableClasses('id')}
                                    style={{ width: '80px' }}
                                >
                                    Pipeline ID <span className="icon caret-up" />
                                </div>

                                {this.state.selectedColumnsDropdown.includes("Pipeline Name") && <div
                                    onClick={this.changeSort('pipeline_name')}
                                    className={this.sortableClasses('pipeline_name')}
                                    style={{ width: '200px' }}
                                >
                                    Pipeline Name <span className="icon caret-up" />
                                </div>}

                                {this.state.selectedColumnsDropdown.includes("Duration") && <div
                                    onClick={this.changeSort('duration')}
                                    className={this.sortableClasses('duration')}
                                    style={{ width: '150px' }}
                                >
                                    Duration <span className="icon caret-up" />
                                </div>}

                                {this.state.selectedColumnsDropdown.includes("Mean CV Score") && <div
                                    onClick={this.changeSort('mean_cv_score')}
                                    className={this.sortableClasses('mean_cv_score')}
                                    style={{width: '150px'}}
                                >
                                    Mean CV Score <span className="icon caret-up" />
                                    <div
                                        className="graph-tips"
                                        data-for="graph-tips-tooltip"
                                        data-tip={mcvTip}
                                    >
                                        <span style={{fontSize: '15px'}}>?</span>
                                        <ReactTooltip
                                            id="graph-tips-tooltip"
                                            effect="solid"
                                            html={true}
                                            place="bottom"
                                            class="influx-tooltip"
                                        />
                                    </div>
                                </div>}

                                {this.state.selectedColumnsDropdown.includes("Standard Deviation CV Score") && <div
                                    onClick={this.changeSort('standard_deviation_cv_score')}
                                    className={this.sortableClasses('standard_deviation_cv_score')}
                                    style={{width: '150px'}}
                                >
                                    Standard Deviation CV Score <span className="icon caret-up" />
                                    <div
                                        className="graph-tips"
                                        data-for="graph-tips-tooltip"
                                        data-tip={stdcvTip}
                                    >
                                        <span style={{fontSize: '15px'}}>?</span>
                                        <ReactTooltip
                                            id="graph-tips-tooltip"
                                            effect="solid"
                                            html={true}
                                            place="bottom"
                                            class="influx-tooltip"
                                        />
                                    </div>
                                </div>}

                                {this.state.selectedColumnsDropdown.includes("Validation Score") && <div
                                    onClick={this.changeSort('validation_score')}
                                    className={this.sortableClasses('validation_score')}
                                    style={{width: '150px'}}
                                >
                                    Validation Score <span className="icon caret-up" />
                                    <div
                                        className="graph-tips"
                                        data-for="graph-tips-tooltip"
                                        data-tip={vsTip}
                                    >
                                        <span style={{fontSize: '15px'}}>?</span>
                                        <ReactTooltip
                                            id="graph-tips-tooltip"
                                            effect="solid"
                                            html={true}
                                            place="bottom"
                                            class="influx-tooltip"
                                        />
                                    </div>
                                </div>}

                                {this.state.selectedColumnsDropdown.includes("Percent Better Than Baseline") && <div
                                    onClick={this.changeSort('percent_better_than_baseline')}
                                    className={this.sortableClasses('percent_better_than_baseline')}
                                    style={{width: '150px'}}
                                >
                                    Percent Better Than Baseline <span className="icon caret-up" />
                                    <div
                                        className="graph-tips"
                                        data-for="graph-tips-tooltip"
                                        data-tip={pbtbTip}
                                    >
                                        <span style={{fontSize: '15px'}}>?</span>
                                        <ReactTooltip
                                            id="graph-tips-tooltip"
                                            effect="solid"
                                            html={true}
                                            place="bottom"
                                            class="influx-tooltip"
                                        />
                                    </div>
                                </div>}

                                {this.state.selectedColumnsDropdown.includes("High Variance CV") && <div
                                    onClick={this.changeSort('high_variance_cv')}
                                    className={this.sortableClasses('high_variance_cv')}
                                    style={{width: '100px'}}
                                >
                                    High Variance CV <span className="icon caret-up" />
                                    <div
                                        className="graph-tips"
                                        data-for="graph-tips-tooltip"
                                        data-tip={hvcvTip}
                                    >
                                        <span style={{fontSize: '15px'}}>?</span>
                                        <ReactTooltip
                                            id="graph-tips-tooltip"
                                            effect="solid"
                                            html={true}
                                            place="bottom"
                                            class="influx-tooltip"
                                        />
                                    </div>
                                </div>}

                                <div
                                    className={'compare'}
                                    style={{width: '50px'}}
                                >
                                </div>
                            </div>

                            <div style={{ height: "400px" }}>
                                <DapperScrollbars
                                    autoHide={false}
                                    autoSizeHeight={true}
                                    style={{ maxHeight: '400px' }}
                                    className="data-loading--scroll-content"
                                >
                                    {trials.map(({id, pipeline_name, duration, mean_cv_score, standard_deviation_cv_score, validation_score,
                                        percent_better_than_baseline, high_variance_cv}) => {
                                        return (
                                            <div className="alert-history-table--tr" key={uuid.v4()}>
                                                <div
                                                    className="alert-history-table--td"
                                                    style={{width: '80px'}}
                                                >
                                                    {id}
                                                </div>
                                                {this.state.selectedColumnsDropdown.includes("Pipeline Name") && <div
                                                    className="alert-history-table--td"
                                                    style={{width: '200px'}}
                                                >
                                                    {pipeline_name}
                                                </div>}

                                                {this.state.selectedColumnsDropdown.includes("Duration") && <div
                                                    className="alert-history-table--td"
                                                    style={{width: '150px'}}
                                                >
                                                    {this.returnDuration(duration)}
                                                </div>}
                                                
                                                {this.state.selectedColumnsDropdown.includes("Mean CV Score") && <div
                                                    className="alert-history-table--td"
                                                    style={{width: '150px'}}
                                                >
                                                    {this.checkisNaN(mean_cv_score)}
                                                </div>}

                                                {this.state.selectedColumnsDropdown.includes("Standard Deviation CV Score") && <div
                                                    className="alert-history-table--td"
                                                    style={{width: '150px'}}
                                                >
                                                    {this.checkisNaN(standard_deviation_cv_score)}
                                                </div>}

                                                {this.state.selectedColumnsDropdown.includes("Validation Score") && <div
                                                    className="alert-history-table--td"
                                                    style={{width: '150px'}}
                                                >
                                                    {this.checkisNaN(validation_score)}
                                                </div>}

                                                {this.state.selectedColumnsDropdown.includes("Percent Better Than Baseline") && <div
                                                    className="alert-history-table--td"
                                                    style={{width: '150px'}}
                                                >
                                                    {this.checkisNaN(percent_better_than_baseline)}
                                                </div>}

                                                {this.state.selectedColumnsDropdown.includes("High Variance CV") && <div
                                                    className="alert-history-table--td"
                                                    style={{width: '100px'}}
                                                >
                                                    {high_variance_cv ? "True" : "False"}
                                                </div>}
                                                <div
                                                    className="alert-history-table--td"
                                                    style={{ width: '50px' }}
                                                >
                                                    <div className={"dark-checkbox"}>
                                                        <input
                                                            id={`pipelineID-${id}`}
                                                            className="form-control-static"
                                                            type="checkbox"
                                                            checked={this.checkedStatus(id)}
                                                            onChange={(e)=>this.changeTrial(e, id)}
                                                        />
                                                        <label htmlFor={`pipelineID-${id}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </DapperScrollbars>
                            </div>
                        </div>
                        
                    </Grid>
                }
            </Panel>

        )
    }
}

export default RULRegRankingResultList