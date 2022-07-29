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
import RULRegDurationGraph from 'src/health/components/RULRegDurationGraph';
import RULRegRankingResultList from 'src/health/components/RULRegRankingResultList';
import RULRegPipelinesStructure from 'src/health/components/RULRegPipelinesStructure';
import RULRegBestThreeParallelGraph from 'src/health/components/RULRegBestThreeParallelGraph';

// Helpers
import { history } from 'src/store/history'


interface Props {
    params: object
    durationData: object[]
    experimentJob: string
    trialsRankingResults: object[]
    allPipelineNames: string[]
    selectedPipeline: string
    nodeData: any[]
    bestThreeGraphData: object[]
    bestThreeGraphVariables: object[]
    topFeaturesData: object[]
    changeSelectedPipeline: (selectedPipeline: string) => void
    // hyperData: object[]
    // nodesData: object[]
    // trialsList: object[]
    // trialIntermediates: object[]
    // didTimeOut: boolean
}

interface State {
    tabs: object[]
}

class RULRegSubSections extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            tabs: [
                {
                    title: 'Trial Jobs',
                    id: 'trials'
                },
                {
                    title: 'Duration',
                    id: 'duration'
                },
                {
                    title: 'Pipeline Structure',
                    id: 'pipeline-structure',
                },
                {
                    title: 'Best 3 Pipelines',
                    id: 'best-three-pipelines'
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
                        <RULRegDurationGraph data={this.props.durationData} experimentJob={this.props.experimentJob} />
                    }
                    {
                        this.props.params["tab"] === "trials" &&
                        // <HyperparamGraph data={this.props.hyperData} experimentJob={this.props.experimentJob} />
                        <RULRegRankingResultList
                            trials={this.props.trialsRankingResults}
                            experimentJob={this.props.experimentJob}
                            durations={this.props.durationData}
                        />
                    }
                    {
                        this.props.params["tab"] === "pipeline-structure" &&
                        // <NodeGraph elements={this.props.nodesData} experimentJob={this.props.experimentJob} />
                        <RULRegPipelinesStructure
                            allPipelineNames={this.props.allPipelineNames}
                            selectedPipeline={this.props.selectedPipeline}
                            nodeData={this.props.nodeData}
                            changeSelectedPipeline={this.props.changeSelectedPipeline}
                        />
                    }
                    {
                        this.props.params["tab"] === "best-three-pipelines" &&
                        <RULRegBestThreeParallelGraph
                            data={this.props.bestThreeGraphData}
                            variables={this.props.bestThreeGraphVariables}
                            topFeaturesData={this.props.topFeaturesData}
                        />
                        
                    }
                </Grid.Column>
            </Grid.Row>
        )
    }
}

export default RULRegSubSections;