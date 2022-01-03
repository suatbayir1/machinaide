// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { BACKEND } from "src/config";

// Components
import DigitalTwinHeader from 'src/dt/components/DigitalTwinHeader'
import DigitalTwinVisualize from 'src/dt/components/DigitalTwinVisualize'
import DigitalTwinInformation from 'src/dt/components/DigitalTwinInformation'
import DigitalTwinGraph from 'src/dt/components/DigitalTwinGraph'
import { Page, Grid, Columns, RemoteDataState } from '@influxdata/clockface'

// Actions
import {
  clearTask,
} from 'src/tasks/actions/creators'

import { saveNewScript, cancel } from 'src/tasks/actions/thunks'

// Types
import { AppState } from 'src/types'

type ReduxProps = ConnectedProps<typeof connector>
type Props = ReduxProps

interface State {
  selectedGraphNode: object,
  generalInfo: string[],
  spinnerLoadingInformationPage: RemoteDataState,
  refreshVisualizePage: boolean
  resultNLPQuery: object
  showAllSensorValues: boolean
  refreshGraph: boolean
}

class DigitalTwinPage extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      selectedGraphNode: {},
      generalInfo: [],
      spinnerLoadingInformationPage: RemoteDataState.Loading,
      refreshVisualizePage: false,
      resultNLPQuery: {},
      showAllSensorValues: false,
      refreshGraph: false,
    }
  }

  public componentWillUnmount() {
    this.props.clearTask()
  }

  public render(): JSX.Element {
    const { selectedGraphNode, generalInfo, spinnerLoadingInformationPage, refreshVisualizePage, resultNLPQuery } = this.state;

    return (
      <Page>
        <DigitalTwinHeader
          title="Digital Twin Monitor"
        />

        <Page.Contents fullWidth={true} scrollable={true}>
          <Grid>
            <Grid.Row>
              <Grid.Column
                widthXS={Columns.Twelve}
                widthSM={Columns.Twelve}
                widthMD={Columns.Four}
                widthLG={Columns.Two}
                style={{ marginTop: '20px' }}
              >
                <DigitalTwinInformation
                  selectedGraphNode={selectedGraphNode}
                  generalInfo={generalInfo}
                  spinnerLoading={spinnerLoadingInformationPage}
                  changeShowAllSensorValues={this.changeShowAllSensorValues}
                  showAllSensorValues={this.state.showAllSensorValues}
                  refreshGraph={this.refreshGraph}
                  refreshVisualizePage={this.refreshVisualizePage}
                />
              </Grid.Column>
              <Grid.Column
                widthXS={Columns.Twelve}
                widthSM={Columns.Twelve}
                widthMD={Columns.Eight}
                widthLG={Columns.Six}
                style={{ marginTop: '20px' }}
              >
                <DigitalTwinGraph
                  handleNodeClick={this.onClickNode}
                  refreshGeneralInfo={this.refreshGeneralInfo}
                  refreshVisualizePage={this.refreshVisualizePage}
                  selectedGraphNode={selectedGraphNode}
                  changeResultQuery={this.changeResultQuery}
                  showAllSensorValues={this.state.showAllSensorValues}
                  refreshGraph={this.state.refreshGraph}
                  orgID={this.props["match"].params.orgID}
                />
              </Grid.Column>
              <div id="dt-3d-scene">
                <Grid.Column
                  widthXS={Columns.Twelve}
                  widthSM={Columns.Twelve}
                  widthMD={Columns.Twelve}
                  widthLG={Columns.Four}
                  style={{ marginTop: '20px' }}
                >
                  <DigitalTwinVisualize
                    selectedGraphNode={selectedGraphNode}
                    resultNLPQuery={resultNLPQuery}
                    refreshVisualizePage={refreshVisualizePage}
                  />
                </Grid.Column>
              </div>

            </Grid.Row>
          </Grid>
        </Page.Contents>
      </Page>
    )
  }

  changeShowAllSensorValues = () => {
    this.setState({
      showAllSensorValues: !this.state.showAllSensorValues
    })
  }

  changeResultQuery = (payload) => {
    this.setState({
      resultNLPQuery: payload
    })
  }

  onClickNode = async (node) => {
    this.setState({ selectedGraphNode: node })
  }


  async componentDidMount(): Promise<void> {
    await this.refreshGeneralInfo();
  }

  refreshGeneralInfo = async () => {
    const generalInfo = await this.getGeneralInfo();
    this.setState({
      generalInfo,
      spinnerLoadingInformationPage: RemoteDataState.Done
    })
  }

  getGeneralInfo = async () => {
    const url = `${BACKEND.API_URL}dt/getGeneralInfo`;

    const request = fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
        'token': window.localStorage.getItem("token")
      }
    })

    try {
      const response = await request;
      const res = await response.json();

      if (res.data.success !== true) return;
      const result = JSON.parse(res.data.data)
      return result;
    } catch (err) {
      console.error(err);
    }
  }

  refreshVisualizePage = () => {
    this.setState({
      refreshVisualizePage: !this.state.refreshVisualizePage,
      selectedGraphNode: {},
    })
  }

  refreshGraph = () => {
    this.setState({
      refreshGraph: !this.state.refreshGraph
    })
  }
}

const mstp = (state: AppState) => {
  const { tasks } = state.resources
  const { taskOptions, newScript } = tasks

  return {
    taskOptions,
    newScript,
  }
}

const mdtp = {
  saveNewScript,
  clearTask,
  cancel,
}

const connector = connect(mstp, mdtp)

export default connector(DigitalTwinPage)
