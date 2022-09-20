// Libraries
import React, { PureComponent } from 'react'

// Components
import {
    Grid, Columns,
} from '@influxdata/clockface'
import DurationGraph from "src/ml/components/DurationGraph";
import HyperparamGraph from "src/ml/components/HyperparamGraph";
import NodeGraph from "src/ml/components/NodeGraph";
import TrialList from "src/ml/components/TrialList";

// Helpers
import { history } from 'src/store/history'


interface Props {
    params: object
    durationData: object[]
    experimentJob: string
    hyperData: object[]
    nodesData: object[]
    trialsList: object[]
    trialIntermediates: object[]
    didTimeOut: boolean
}

interface State {
    tabs: object[]
}

class SubSections extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            tabs: [
                {
                    title: 'Trial Jobs',
                    id: 'trials'
                },
                {
                    title: 'Hyper-parameters',
                    id: 'hyperparameters'
                },
                {
                    title: 'Duration',
                    id: 'duration',
                },
                {
                    title: 'Nodes',
                    id: 'nodes'
                },
            ],
        }
    }

    handleChangeTab = (tab) => {
        history.push(tab.id);
    }

    render() {
        const { tabs } = this.state;

        return (
            <Grid.Row>
                <Grid.Column widthXS={Columns.Three}>
                    <ul className="subsection-list">
                        {tabs.map((tab, idx) => (
                            <li
                                key={idx}
                                onClick={() => { this.handleChangeTab(tab) }}
                                className={this.props.params["tab"] === tab["id"] ? 'active' : ''}
                            >
                                <div>{tab["title"]}</div>
                            </li>
                        ))}
                    </ul>
                </Grid.Column>
                <Grid.Column widthXS={Columns.Nine}>
                    {
                        this.props.params["tab"] === "duration" &&
                        <DurationGraph data={this.props.durationData} experimentJob={this.props.experimentJob} />
                    }
                    {
                        this.props.params["tab"] === "hyperparameters" &&
                        <HyperparamGraph data={this.props.hyperData} experimentJob={this.props.experimentJob} />
                    }
                    {
                        this.props.params["tab"] === "nodes" &&
                        <NodeGraph elements={this.props.nodesData} experimentJob={this.props.experimentJob} />
                    }
                    {
                        this.props.params["tab"] === "trials" &&
                        <TrialList
                            trials={this.props.trialsList}
                            trialIntermediates={this.props.trialIntermediates}
                            didTimeOut={this.props.didTimeOut}
                            experimentJob={this.props.experimentJob}
                        />
                    }
                </Grid.Column>
            </Grid.Row>
        )
    }
}

export default SubSections;