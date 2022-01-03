import React from 'react'
import _ from 'lodash'
import ReactTooltip from 'react-tooltip'
import uuid from 'uuid'
import CompareOverlay from "src/ml/components/CompareOverlay";

// Components
import {
    Panel, Grid, Columns, Form, Input, MultiSelectDropdown, InputType,
    Button, ButtonType, ComponentColor, IconFont, DapperScrollbars,
    SpinnerContainer, RemoteDataState, TechnoSpinner,
} from '@influxdata/clockface'


const tdTip = '<p>Sum of <code>TTC</code> and <code>CTT</code>. Sum of distances of false predictions. <br/><code>Lower value is better.</code></p>'

const ttcTip = '<b>Target to Candidate</b><br/><p>Sum of target<code>(training data)</code> to candidate<code>(predicted result)</code> distances between failure labels. <br/> Punishes <code>false negatives</code>.</p>'

const cttTip = '<b>Candidate to Target</b><br/><p>Sum of candidate<code>(predicted result)</code> to target<code>(training data)</code> distances between failure labels. <br/> Punishes <code>false positives</code>.</p>'

const emTip = '<p>Number of candidate(<code>predicted result</code>) classification failures <br/>that matches exactly the failure label in the target(<code>training data</code>) classification.</p>'

const dmTip = '<p>Number of candidate(<code>predicted result</code>) classification failures <br/>within a given range of the failure label in the target(<code>training data</code>) classification.</p>'

const mfTip = '<p>Number of missed failure labels <br/>that are not present in a given range in the target(<code>training data</code>) classification.</p>'

const ffTip = '<p>Number of normal target(<code>training data</code>) classification points <br/>that are labeled as failure in the candidate(<code>predicted result</code>) classification.</p>'

const fprecisionTip = "<p><code>'Forgiving' Precision:</code> <br/> (<code>Exact Match + Detected Failure</code>) / (<code>Exact Match + Detected Failure + False Failure</code>)</p>"

const frecallTip = "<p><code>'Forgiving' Recall:</code> <br/> (<code>Exact Match + Detected Failure</code>) / (<code>Exact Match + Detected Failure + Missed Failure</code>)</p>"

const pdTip = "<p><b>Sum of probabilities</b><br/>Add the <code>(probability)</code> to sum when no failure labeled at that point. <br/> Add <code>(1-probability)</code> to sum when failure is labeled. <br/><code>p(no failure) + (1-p)(failure)</code></p>"

const colors = {
    "COMPLETED": "#67D74E",
    "INVALID": "#F95F53",
    "IDLE": "#FFE480",
    "STOPPED": "#DC4E58",
    "RUNNING": "#00C9FF",
    "TIMEOUT": "#BF3D5E",
    "KILLED": "#BF3D5E"
}

const rulColumnsDropdown = [
    { id: "trialno", name: 'Trial No' },
    { id: "duration", name: 'Duration' },
    { id: "status", name: 'Status' },
    { id: "accuracy", name: 'Accuracy' },
    { id: "precision", name: 'Precision' },
    { id: "recall", name: 'Recall' },
    { id: "fscore", name: 'F-Score' },
    { id: "td", name: 'Temporal Distance' },
    { id: "ttc", name: 'TTC' },
    { id: "ctt", name: 'CTT' },
    { id: "em", name: 'Exact Match' },
    { id: "df", name: 'Detected Failure' },
    { id: "mf", name: 'Missed Failure' },
    { id: "ff", name: 'False Failure' },
    { id: "fprecision", name: 'Forgiving Precision' },
    { id: "frecall", name: 'Forgiving Recall' },
    { id: "custom", name: 'Custom Metric' },
]

const rulColumnsDropdownSelected = [
    { id: "trialno", name: 'Trial No' },
    { id: "duration", name: 'Duration' },
    { id: "status", name: 'Status' },
    { id: "accuracy", name: 'Accuracy' },
    { id: "precision", name: 'Precision' },
    { id: "recall", name: 'Recall' },
    { id: "fscore", name: 'F-Score' },
    { id: "custom", name: 'Custom Metric' },
]

const rulColumns = [
    "trialno", "duration", "status", "accuracy", "precision", "recall", "fscore", "custom",
]

const pofColumnsDropdown = [
    { id: "trialno", name: 'Trial No' },
    { id: "duration", name: 'Duration' },
    { id: "status", name: 'Status' },
    { id: "pd", name: 'Probability Distance' },
    { id: "custom", name: 'Custom Metric' },
]

const pofColumnsDropdownSelected = [
    { id: "trialno", name: 'Trial No' },
    { id: "duration", name: 'Duration' },
    { id: "status", name: 'Status' },
    { id: "custom", name: 'Custom Metric' },
]

const pofColumns = [
    "trialno", "duration", "status", "custom",
]

enum Direction {
    ASC = 'asc',
    DESC = 'desc',
    NONE = 'none',
}

interface Props {
    trials: any[]
    trialIntermediates: any[]
    didTimeOut: boolean
    experimentJob: string
}

interface State {
    trials: any[]
    filteredTrials: any[]
    selectedTypes: any[]
    selectedTypesArray: any[]
    selectedColumns: any[]
    selectedColumnsDropdown: any[]
    selectedColumnsDropdownArray: any[]
    compare: boolean
    sortKey: string
    sortDirection: Direction
    trialInts: any[]
    beta: number
    statusList: object[]
}

class TrialList extends React.Component<Props, State>{
    state = {
        trials: [],
        filteredTrials: [],
        selectedTypesArray: [],
        selectedTypes: [],
        selectedColumns: this.props.experimentJob === "rul" ? rulColumns
            : this.props.experimentJob === "pof"
                ? pofColumns : [],
        selectedColumnsDropdown: this.props.experimentJob === "rul" ? rulColumnsDropdownSelected
            : this.props.experimentJob === "pof"
                ? pofColumnsDropdownSelected : [],
        selectedColumnsDropdownArray: [],
        compare: false,
        sortKey: "",
        sortDirection: Direction.NONE,
        trialInts: [],
        beta: 1,
        statusList: [
            { name: 'COMPLETED', id: "success" },
            { name: 'INVALID', id: "fail" },
            { name: 'IDLE', id: "wait" },
            { name: 'RUNNING', id: "run" },
            { name: 'STOPPED', id: "stop" }
        ]
    }

    componentDidMount() {
        // Initialize selectedColumnsDropdownArray value
        const arrayList = this.props.experimentJob === "rul" ? rulColumnsDropdownSelected
            : this.props.experimentJob === "pof"
                ? pofColumnsDropdownSelected : [];

        this.setState({ selectedColumnsDropdownArray: this.arrayOfObjectToArray(arrayList) });

        let trials = this.props.trials
        let trialsFromDB = this.props.trialIntermediates
        let numberedTrials = []
        let ids = []
        trialsFromDB.forEach(trial => ids.push(trial["trialID"]))
        for (let trial of trialsFromDB) {
            for (let t of trials) {
                if (t["trialID"] === trial["trialID"]) {
                    t["trialNo"] = trial["trialNo"]
                    numberedTrials.push(t)
                }
            }
        }
        for (let t of trials) {
            if (!ids.includes(t["trialID"])) {
                // this means trial is still running so it is the last one
                let lastNum = trials.length
                t["trialNo"] = lastNum
                if (this.props.didTimeOut && t["status"] === "RUNNING") {
                    t["status"] = "TIMEOUT"
                }
                numberedTrials.push(t)
            }
        }
        // , beta: parseInt(this.props.beta)
        this.setState({ trials: numberedTrials, filteredTrials: numberedTrials, trialInts: this.props.trialIntermediates })
    }

    checkedStatus = (trialNo) => {
        let trial = this.state.trials.find(x => x["trialNo"] === trialNo)
        return trial["checked"]
    }

    changeTrial = (e, trialNo) => {
        e.preventDefault()
        let trialsChanged = this.state.trials
        for (let trial of trialsChanged) {
            if (trial["trialNo"] === trialNo) {
                trial["checked"] = !trial["checked"]
            }
        }
        //let enabledChanged = this.state.enabled
        //enabledChanged[trialNo] = !this.state.enabled[trialNo]
        this.setState({ trials: trialsChanged }) //, enabled: enabledChanged, changed: !this.state.changed
    }

    returnDuration = (trialID) => {
        trialID = trialID.toString()
        const { trialIntermediates } = this.props
        let trialDetail = trialIntermediates.find(t => t["trialID"] === trialID)
        if (trialDetail) {
            let duration = new Date(trialDetail["duration"] * 1000).toISOString().substr(11, 8)
            return duration
        }
        else {
            return "00:00:00"
        }

    }

    returnTemporalDistance = (ttc, ctt) => {
        if (ttc !== undefined) {
            if (ctt !== undefined) {
                return ((parseFloat(ttc) + parseFloat(ctt)).toFixed(2))
            }
            else {
                return ttc
            }
        }
        else {
            if (ctt !== undefined) {
                return ctt
            }
            else {
                return "-"
            }
        }
    }

    returnForgivingPrecision = (em, df, ff) => {
        return (parseFloat(parseFloat(em) + parseFloat(df)) / parseFloat(parseFloat(em) + parseFloat(df) + parseFloat(ff))).toFixed(2)

    }

    returnForgivingRecall = (em, df, mf) => {
        return (parseFloat(parseFloat(em) + parseFloat(df)) / parseFloat(parseFloat(em) + parseFloat(df) + parseFloat(mf))).toFixed(2)
    }

    getCheckedTrials = () => {
        let checkedTrials = []
        for (let trial of this.state.trials) {
            if (trial["checked"]) {
                checkedTrials.push(trial)
                /* for(let t of this.state.trialInts){
                    if(t["trialID"] === trial["trialID"])
                    checkedTrials.push(trial)
                }   */
            }
        }
        return checkedTrials
    }

    uncheckAll = () => {
        let trialsChanged = this.state.trials
        for (let trial of trialsChanged) {
            trial["checked"] = false
        }
        this.setState({ trials: trialsChanged })
    }

    filterTrials = () => {
        let trialsChanged = this.state.trials.filter(trial => {
            if (this.state.selectedTypes.length === 0)
                return true
            else {
                let types = this.state.selectedTypes.map(selected => selected.name)
                return types.includes(trial["status"])
            }
        })
        this.setState({ filteredTrials: trialsChanged }, () => this.uncheckAll())
    }

    //sort functions
    private changeSort = (key: string): (() => void) => (): void => {
        // if we're using the key, reverse order; otherwise, set it with ascending
        if (this.state.sortKey === key) {
            const reverseDirection: Direction =
                this.state.sortDirection === Direction.ASC
                    ? Direction.DESC
                    : Direction.ASC
            this.setState({ sortDirection: reverseDirection })
        } else {
            this.setState({ sortKey: key, sortDirection: Direction.ASC })
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
        if (key === "duration") {
            switch (direction) {
                case Direction.ASC:
                    return _.sortBy<any>(trials, e => this.returnDuration(e["trialID"]))
                case Direction.DESC:
                    return _.sortBy<any>(trials, e => this.returnDuration(e["trialID"])).reverse()
                default:
                    return trials
            }
        }
        else if (key === "f1score") {
            switch (direction) {
                case Direction.ASC:
                    return _.sortBy<any>(trials, e => this.calculateFscore(parseFloat(e["precision"]), parseFloat(e["recall"])).toFixed(2))
                case Direction.DESC:
                    return _.sortBy<any>(trials, e => this.calculateFscore(parseFloat(e["precision"]), parseFloat(e["recall"]))).reverse()
                default:
                    return trials
            }
        }
        else if (key === "td") {
            switch (direction) {
                case Direction.ASC:
                    return _.sortBy<any>(trials, e => this.returnTemporalDistance(parseFloat(e["ttc"]), parseFloat(e["ctt"])))
                case Direction.DESC:
                    return _.sortBy<any>(trials, e => this.returnTemporalDistance(parseFloat(e["ttc"]), parseFloat(e["ctt"]))).reverse()
                default:
                    return trials
            }
        }
        else if (key === "fprecision") {
            switch (direction) {
                case Direction.ASC:
                    return _.sortBy<any>(trials, e => this.returnForgivingPrecision(parseFloat(e["exactMatch"]), parseFloat(e["detectedFailure"]), parseFloat(e["falseFailure"])))
                case Direction.DESC:
                    return _.sortBy<any>(trials, e => this.returnForgivingPrecision(parseFloat(e["exactMatch"]), parseFloat(e["detectedFailure"]), parseFloat(e["falseFailure"]))).reverse()
                default:
                    return trials
            }
        }
        else if (key === "frecall") {
            switch (direction) {
                case Direction.ASC:
                    return _.sortBy<any>(trials, e => this.returnForgivingRecall(parseFloat(e["exactMatch"]), parseFloat(e["detectedFailure"]), parseFloat(e["missedFailure"])))
                case Direction.DESC:
                    return _.sortBy<any>(trials, e => this.returnForgivingRecall(parseFloat(e["exactMatch"]), parseFloat(e["detectedFailure"]), parseFloat(e["missedFailure"]))).reverse()
                default:
                    return trials
            }
        }
        else {
            switch (direction) {
                case Direction.ASC:
                    return _.sortBy<any>(trials, e => e[key])
                case Direction.DESC:
                    return _.sortBy<any>(trials, e => e[key]).reverse()
                default:
                    return trials
            }
        }
    }

    handleChange = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    calculateFscore = (precision, recall) => {
        const { beta } = this.state
        let fScore = (1 + beta * beta) * (precision * recall) / ((beta * beta * precision) + recall)
        return fScore
    }

    handleChangeDropdownStatus = (option: string) => {

        const { selectedTypesArray, statusList } = this.state
        const optionExists = selectedTypesArray.find(opt => opt === option)
        let updatedOptions = selectedTypesArray

        if (optionExists) {
            updatedOptions = selectedTypesArray.filter(fo => fo !== option)
        } else {
            updatedOptions = [...selectedTypesArray, option]
        }

        let arrayOfObject = statusList.filter(item => updatedOptions.includes(item.name));

        this.setState({ selectedTypes: arrayOfObject, selectedTypesArray: updatedOptions }, () => this.filterTrials())
    }

    handleChangeDropdownColumns = (option: string) => {

        const { selectedColumnsDropdownArray, statusList } = this.state
        const optionExists = selectedColumnsDropdownArray.find(opt => opt === option)
        let updatedOptions = selectedColumnsDropdownArray

        if (optionExists) {
            updatedOptions = selectedColumnsDropdownArray.filter(fo => fo !== option)
        } else {
            updatedOptions = [...selectedColumnsDropdownArray, option]
        }

        const objectList = this.props.experimentJob === "rul"
            ? rulColumnsDropdown
            : this.props.experimentJob === "pof"
                ? pofColumnsDropdown
                : [{ id: "none", name: "none" }]


        let arrayOfObject = objectList.filter(item => updatedOptions.includes(item.name));

        const cols = arrayOfObject.map(item => item.id);

        this.setState({
            selectedColumnsDropdown: arrayOfObject,
            selectedColumnsDropdownArray: updatedOptions,
            selectedColumns: cols
        }, () => this.filterTrials())
    }

    arrayOfObjectToArray = (arrayOfObject) => {
        let array = arrayOfObject.map(item => item.name);
        return array;
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
                            <CompareOverlay
                                visible={this.state.compare}
                                errorThrown={() => console.log("error")}
                                onDismiss={() => this.setState({ compare: false })}
                                trials={this.getCheckedTrials()}
                                trialIntermediates={this.props.trialIntermediates}
                                experimentJob={this.props.experimentJob}
                            />
                        </Grid.Row>

                        <Grid.Row>
                            <Grid.Column widthXS={Columns.Three}>
                                <Form.Element label="Filter By Status">
                                    <MultiSelectDropdown
                                        emptyText={"Select Request Type"}
                                        options={this.arrayOfObjectToArray(this.state.statusList)}
                                        selectedOptions={this.state.selectedTypesArray}
                                        onSelect={this.handleChangeDropdownStatus}
                                    />
                                </Form.Element>
                            </Grid.Column>

                            <Grid.Column widthXS={Columns.Three}>
                                <Form.Element label="Select Columns">
                                    <MultiSelectDropdown
                                        emptyText={"Select Columns"}
                                        options={
                                            this.props.experimentJob === "rul"
                                                ? this.arrayOfObjectToArray(rulColumnsDropdown)
                                                : this.props.experimentJob === "pof"
                                                    ? this.arrayOfObjectToArray(pofColumnsDropdown)
                                                    : this.arrayOfObjectToArray([{ id: "none", name: "none" }])
                                        }
                                        selectedOptions={this.state.selectedColumnsDropdownArray}
                                        onSelect={this.handleChangeDropdownColumns}
                                    />
                                </Form.Element>
                            </Grid.Column>

                            <Grid.Column widthXS={Columns.Two}>
                                {this.props.experimentJob === "rul" &&
                                    <Form.Element label="β in F score:">
                                        <Input
                                            name="beta"
                                            onChange={this.handleChange}
                                            value={this.state.beta}
                                            type={InputType.Number}
                                        />
                                    </Form.Element>
                                }
                            </Grid.Column>

                            <Grid.Column widthXS={Columns.Two}>
                            </Grid.Column>

                            <Grid.Column widthXS={Columns.Two}>
                                <Form.Element label="">
                                    <Button
                                        style={{ marginTop: '18px' }}
                                        text="Compare"
                                        type={ButtonType.Button}
                                        icon={IconFont.GraphLine}
                                        color={ComponentColor.Primary}
                                        onClick={() => this.setState({ compare: !this.state.compare })}
                                    />
                                </Form.Element>
                            </Grid.Column>
                        </Grid.Row>
                        <br />
                        <br />

                        <div className="alert-history-table">
                            <div className="alert-history-table--thead">
                                {this.state.selectedColumns.includes("trialno") && <div
                                    onClick={this.changeSort('trialno')}
                                    className={this.sortableClasses('trialno')}
                                    style={{ width: '120px' }}
                                >
                                    Trial No <span className="icon caret-up" />
                                </div>}
                                {this.state.selectedColumns.includes("duration") && <div
                                    onClick={this.changeSort('duration')}
                                    className={this.sortableClasses('duration')}
                                    style={{ width: '150px' }}
                                >
                                    Duration <span className="icon caret-up" />
                                </div>}
                                {this.state.selectedColumns.includes("status") && <div
                                    onClick={this.changeSort('status')}
                                    className={this.sortableClasses('status')}
                                    style={{ width: '150px' }}
                                >
                                    Status <span className="icon caret-up" />
                                </div>}
                                {this.props.experimentJob === "rul" && <>
                                    {this.state.selectedColumns.includes("accuracy") && <div
                                        onClick={this.changeSort('accuracy')}
                                        className={this.sortableClasses('accuracy')}
                                        style={{ width: '120px' }}
                                    >
                                        Accuracy <span className="icon caret-up" />
                                    </div>}
                                    {this.state.selectedColumns.includes("precision") && <div
                                        onClick={this.changeSort('precision')}
                                        className={this.sortableClasses('precision')}
                                        style={{ width: '120px' }}
                                    >
                                        Precision <span className="icon caret-up" />
                                    </div>}
                                    {this.state.selectedColumns.includes("recall") && <div
                                        onClick={this.changeSort('recall')}
                                        className={this.sortableClasses('recall')}
                                        style={{ width: '120px' }}
                                    >
                                        Recall <span className="icon caret-up" />
                                    </div>}
                                    {this.state.selectedColumns.includes("fscore") && <div
                                        onClick={this.changeSort('f1score')}
                                        className={this.sortableClasses('f1score')}
                                        style={{ width: '120px' }}
                                    >
                                        F-Score <span className="icon caret-up" />
                                    </div>}
                                    {this.state.selectedColumns.includes("td") && <div
                                        onClick={this.changeSort('td')}
                                        className={this.sortableClasses('td')}
                                        style={{ width: '155px' }}
                                    >
                                        Temporal Distance <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={tdTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                    {this.state.selectedColumns.includes("ttc") && <div
                                        onClick={this.changeSort('ttc')}
                                        className={this.sortableClasses('ttc')}
                                        style={{ width: '120px' }}
                                    >
                                        TTC <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={ttcTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                    {this.state.selectedColumns.includes("ctt") && <div
                                        onClick={this.changeSort('ctt')}
                                        className={this.sortableClasses('ctt')}
                                        style={{ width: '120px' }}
                                    >
                                        CTT <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={cttTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                    {this.state.selectedColumns.includes("em") && <div
                                        onClick={this.changeSort('exactMatch')}
                                        className={this.sortableClasses('exactMatch')}
                                        style={{ width: '120px' }}
                                    >
                                        Exact Match <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={emTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                    {this.state.selectedColumns.includes("df") && <div
                                        onClick={this.changeSort('detectedFailure')}
                                        className={this.sortableClasses('detectedFailure')}
                                        style={{ width: '140px' }}
                                    >
                                        Detected Failure <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={dmTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                    {this.state.selectedColumns.includes("mf") && <div
                                        onClick={this.changeSort('missedFailure')}
                                        className={this.sortableClasses('missedFailure')}
                                        style={{ width: '130px' }}
                                    >
                                        Missed Failure <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={mfTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                    {this.state.selectedColumns.includes("ff") && <div
                                        onClick={this.changeSort('falseFailure')}
                                        className={this.sortableClasses('falseFailure')}
                                        style={{ width: '120px' }}
                                    >
                                        False Failure <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={ffTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                    {this.state.selectedColumns.includes("fprecision") && <div
                                        onClick={this.changeSort('fprecision')}
                                        className={this.sortableClasses('fprecision')}
                                        style={{ width: '160px' }}
                                    >
                                        Forgiving Precision <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={fprecisionTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                    {this.state.selectedColumns.includes("frecall") && <div
                                        onClick={this.changeSort('frecall')}
                                        className={this.sortableClasses('frecall')}
                                        style={{ width: '160px' }}
                                    >
                                        Forgiving Recall <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={frecallTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                </>}
                                {this.props.experimentJob === "pof" && <>
                                    {this.state.selectedColumns.includes("pd") && <div
                                        onClick={this.changeSort('probabilityDistance')}
                                        className={this.sortableClasses('probabilityDistance')}
                                        style={{ width: '165px' }}
                                    >
                                        Probability Distance <span className="icon caret-up" />
                                        <div
                                            className="graph-tips"
                                            data-for="graph-tips-tooltip"
                                            data-tip={pdTip}
                                        >
                                            <span style={{ fontSize: '15px' }}>?</span>
                                            <ReactTooltip
                                                id="graph-tips-tooltip"
                                                effect="solid"
                                                html={true}
                                                place="bottom"
                                                class="influx-tooltip"
                                            />
                                        </div>
                                    </div>}
                                </>}
                                {this.state.selectedColumns.includes("custom") && <div
                                    onClick={this.changeSort('metric')}
                                    className={this.sortableClasses('metric')}
                                    style={{ width: '120px' }}
                                >
                                    Custom Metric <span className="icon caret-up" />
                                </div>}
                                <div
                                    className={'compare'}
                                    style={{ width: '50px' }}
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
                                    {trials.map(({ trialID, trialNo, duration, status, accuracy, precision, recall, metric, probabilityDistance,
                                        ttc, ctt, exactMatch, detectedFailure, missedFailure, falseFailure, checked }) => {
                                        return (
                                            <div className="alert-history-table--tr" key={uuid.v4()}>
                                                {this.state.selectedColumns.includes("trialno") && <div
                                                    className="alert-history-table--td"
                                                    style={{ width: '120px' }}
                                                >
                                                    {trialNo}
                                                </div>}
                                                {this.state.selectedColumns.includes("duration") && <div
                                                    className="alert-history-table--td"
                                                    style={{ width: '150px' }}
                                                >
                                                    {this.returnDuration(trialID)}
                                                </div>}
                                                {this.state.selectedColumns.includes("status") && <div
                                                    className="alert-history-table--td"
                                                    style={{ width: '150px', color: colors[status] }}
                                                >
                                                    {status}
                                                </div>}
                                                {this.props.experimentJob === "rul" && <>
                                                    {this.state.selectedColumns.includes("accuracy") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '120px' }}
                                                    >
                                                        {accuracy}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("precision") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '120px' }}
                                                    >
                                                        {precision}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("recall") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '120px' }}
                                                    >
                                                        {recall}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("fscore") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '120px' }}
                                                    >
                                                        {this.calculateFscore(parseFloat(precision), parseFloat(recall)).toFixed(2)}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("td") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '155px' }}
                                                    >
                                                        {this.returnTemporalDistance(ttc, ctt)}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("ttc") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '120px' }}
                                                    >
                                                        {ttc !== undefined ? ttc : "-"}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("ctt") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '120px' }}
                                                    >
                                                        {ctt !== undefined ? ctt : "-"}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("em") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '120px' }}
                                                    >
                                                        {exactMatch !== undefined ? exactMatch : "-"}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("df") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '140px' }}
                                                    >
                                                        {detectedFailure !== undefined ? detectedFailure : "-"}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("mf") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '130px' }}
                                                    >
                                                        {missedFailure !== undefined ? missedFailure : "-"}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("ff") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '120px' }}
                                                    >
                                                        {falseFailure !== undefined ? falseFailure : "-"}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("fprecision") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '160px' }}
                                                    >
                                                        {this.returnForgivingPrecision(exactMatch, detectedFailure, falseFailure)}
                                                    </div>}
                                                    {this.state.selectedColumns.includes("frecall") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '160px' }}
                                                    >
                                                        {this.returnForgivingRecall(exactMatch, detectedFailure, missedFailure)}
                                                    </div>}
                                                </>}
                                                {this.props.experimentJob === "pof" && <>
                                                    {this.state.selectedColumns.includes("pd") && <div
                                                        className="alert-history-table--td"
                                                        style={{ width: '165px' }}
                                                    >
                                                        {probabilityDistance ? probabilityDistance : "-"}
                                                    </div>}
                                                </>}
                                                {this.state.selectedColumns.includes("custom") && <div
                                                    className="alert-history-table--td"
                                                    style={{ width: '120px' }}
                                                >
                                                    {metric}
                                                </div>}
                                                <div
                                                    className="alert-history-table--td"
                                                    style={{ width: '50px' }}
                                                >
                                                    <div className={"dark-checkbox"}>
                                                        <input
                                                            id={`trialno-${trialNo}`}
                                                            className="form-control-static"
                                                            type="checkbox"
                                                            checked={this.checkedStatus(trialNo)}
                                                            onChange={(e) => this.changeTrial(e, trialNo)}
                                                        />
                                                        <label htmlFor={`trialno-${trialNo}`} />
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

export default TrialList