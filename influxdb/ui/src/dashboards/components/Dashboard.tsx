// Libraries
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

// Components
import Cells from 'src/shared/components/cells/Cells'
// import CustomAddedCells from 'src/dashboards/components/CustomAddedCells'
import DashboardEmpty from 'src/dashboards/components/dashboard_empty/DashboardEmpty'
import {
  Page,
  SpinnerContainer,
  TechnoSpinner,
  RemoteDataState,
} from '@influxdata/clockface'

// Types
import { Cell, AppState } from 'src/types'

// Decorators
import { ErrorHandling } from 'src/shared/decorators/errors'

// Utils
import { getCells } from 'src/cells/selectors'

// Services
import DashboardService from 'src/shared/services/DashboardService'

interface State {
  isExists: boolean
}

interface StateProps {
  cells: Cell[]
  status: RemoteDataState
}
interface OwnProps {
  manualRefresh: number
  dashboard: object
}

type Props = OwnProps & StateProps

@ErrorHandling
class DashboardComponent extends PureComponent<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      isExists: false
    }
  }

  async componentDidMount() {
    const isExists = await DashboardService.isDashboardExists({ dashboardID: this.props.dashboard?.["id"] });
    this.setState({ isExists: isExists.data.summary.code === 409 ? true : false })
  }

  public render() {
    const { cells, status, manualRefresh } = this.props
    const { isExists } = this.state;

    return (
      <SpinnerContainer loading={status} spinnerComponent={<TechnoSpinner />}>
        <Page.Contents fullWidth={true} scrollable={true} className="dashboard">
          {!!cells.length ? (
            <>
              {/* {
                isExists &&
                <CustomAddedCells manualRefresh={manualRefresh} />
              } */}
              <Cells manualRefresh={manualRefresh} />
            </>
          ) : (
            <DashboardEmpty />
          )}
          {/* This element is used as a portal container for note tooltips in cell headers */}
          <div className="cell-header-note-tooltip-container" />
        </Page.Contents>
      </SpinnerContainer>
    )
  }
}

const mstp = (state: AppState) => {
  return {
    cells: getCells(state, state.currentDashboard.id),
    status: state.resources.cells.status,
  }
}

export default connect<StateProps, {}, OwnProps>(mstp)(DashboardComponent)
