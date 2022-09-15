// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import i18next from "i18next";

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
import { loadBuckets } from 'src/timeMachine/actions/queryBuilder'
import { saveNewScript, cancel } from 'src/tasks/actions/thunks'

// Types
import { AppState } from 'src/types'

// Services
import DTService from 'src/shared/services/DTService';

// Helpers
import { getDTInfoByID } from 'src/shared/helpers/DTHelper';

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
  dt: object[]
  show3DScene: boolean
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
      dt: [],
      show3DScene: true
    }
  }

  public parseQueryParams = async () => {
    if (this.props["location"].search === "") {
      return;
    }

    const query = new URLSearchParams(this.props["location"].search);

    const nodeID = query.get('nodeID');

    const node = await getDTInfoByID(this.state.dt, nodeID);

    this.onClickNode(node);
  }

  public componentWillUnmount() {
    this.props.clearTask()
  }

  public render(): JSX.Element {
    const { selectedGraphNode, generalInfo, spinnerLoadingInformationPage, refreshVisualizePage, resultNLPQuery, show3DScene } = this.state;

    return (
      <Page>
        <DigitalTwinHeader
          title={i18next.t("headers.dt")}
          onChangeStatus3DScene={() => { this.setState({ show3DScene: !this.state.show3DScene }) }}
          show3DScene={show3DScene}
        />

        <Page.Contents fullWidth={true} scrollable={true}>
          <Grid>
            <Grid.Row>
              <Grid.Column
                widthXS={Columns.Twelve}
                widthSM={Columns.Twelve}
                widthMD={Columns.Four}
                widthLG={show3DScene ? Columns.Two : Columns.Four}
                style={{ marginTop: '20px' }}
              >
                <DigitalTwinInformation
                  selectedGraphNode={selectedGraphNode}
                  refreshGeneralInfo={this.refreshGeneralInfo}
                  generalInfo={generalInfo}
                  spinnerLoading={spinnerLoadingInformationPage}
                  changeShowAllSensorValues={this.changeShowAllSensorValues}
                  showAllSensorValues={this.state.showAllSensorValues}
                  refreshGraph={this.refreshGraph}
                  refreshVisualizePage={this.refreshVisualizePage}
                  orgID={this.props["match"].params.orgID}
                />
              </Grid.Column>
              <Grid.Column
                widthXS={Columns.Twelve}
                widthSM={Columns.Twelve}
                widthMD={Columns.Eight}
                widthLG={show3DScene ? Columns.Six : Columns.Eight}
                style={{ marginTop: '20px' }}
              >
                <DigitalTwinGraph
                  handleNodeClick={this.onClickNode}
                  generalInfo={generalInfo}
                  refreshGeneralInfo={this.refreshGeneralInfo}
                  refreshVisualizePage={this.refreshVisualizePage}
                  selectedGraphNode={selectedGraphNode}
                  changeResultQuery={this.changeResultQuery}
                  showAllSensorValues={this.state.showAllSensorValues}
                  refreshGraph={this.state.refreshGraph}
                  orgID={this.props["match"].params.orgID}
                  show3DScene={show3DScene}

                />
              </Grid.Column>
              {
                show3DScene &&
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
              }
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
    console.log(node);
    this.setState({ selectedGraphNode: node })
  }


  async componentDidMount(): Promise<void> {
    this.props.onLoadBuckets()
    await this.refreshGeneralInfo();
    const dt = await DTService.getAllDT();
    this.setState({ dt })
    this.parseQueryParams();
  }

  refreshGeneralInfo = async () => {
    const generalInfo = await DTService.getGeneralInfo();

    this.setState({
      generalInfo,
      spinnerLoadingInformationPage: RemoteDataState.Done
    })
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
  onLoadBuckets: loadBuckets,
}

const connector = connect(mstp, mdtp)

export default connector(DigitalTwinPage)
