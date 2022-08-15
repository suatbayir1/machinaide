// Libraries
import React, { useEffect, useState, FC } from 'react'
import { connect, ConnectedProps, useDispatch } from 'react-redux'
import { Route, Switch } from 'react-router-dom'

// Components
import { MePage } from 'src/me'
import TasksPage from 'src/tasks/containers/TasksPage'
import TaskPage from 'src/tasks/containers/TaskPage'
import TaskRunsPage from 'src/tasks/components/TaskRunsPage'
import TaskEditPage from 'src/tasks/containers/TaskEditPage'
import DataExplorerPage from 'src/dataExplorer/components/DataExplorerPage'
import DashboardsIndex from 'src/dashboards/components/dashboard_index/DashboardsIndex'
import DashboardContainer from 'src/dashboards/components/DashboardContainer'
import NotebookPage from 'src/notebooks/components/Notebook'
import BucketsIndex from 'src/buckets/containers/BucketsIndex'
import TokensIndex from 'src/authorizations/containers/TokensIndex'
import TelegrafsPage from 'src/telegrafs/containers/TelegrafsPage'
import ScrapersIndex from 'src/scrapers/containers/ScrapersIndex'
import WriteDataPage from 'src/writeData/containers/WriteDataPage'
import VariablesIndex from 'src/variables/containers/VariablesIndex'
import TemplatesIndex from 'src/templates/containers/TemplatesIndex'
import LabelsIndex from 'src/labels/containers/LabelsIndex'
import OrgProfilePage from 'src/organizations/containers/OrgProfilePage'
import AlertingIndex from 'src/alerting/components/AlertingIndex'
import AlertHistoryIndex from 'src/alerting/components/AlertHistoryIndex'
import CheckHistory from 'src/checks/components/CheckHistory'
import MembersIndex from 'src/members/containers/MembersIndex'
import UsersIndex from 'src/users/containers/UsersIndex'
import RouteToDashboardList from 'src/dashboards/components/RouteToDashboardList'
import ClientLibrariesPage from 'src/writeData/containers/ClientLibrariesPage'
import TelegrafPluginsPage from 'src/writeData/containers/TelegrafPluginsPage'
import FlowsIndex from 'src/notebooks/components/FlowsIndex'

// My Added Components
import DigitalTwinPage from 'src/dt/containers/DigitalTwinPage'
// import FactorySceneOverlay from 'src/dt/components/FactorySceneOverlay'
import ObjectCreatorPage from 'src/objectCreator/containers/ObjectCreatorPage'
import ReportsContainer from 'src/reports/containers/ReportsContainer';
import ReportViewContainer from 'src/reports/containers/ReportViewContainer';
import DashboardRouter from 'src/dashboards/components/dashboard_index/DashboardRouter';
import SnapshotRouter from 'src/dashboards/components/dashboard_index/SnapshotRouter';


// Factory, Machine, Component, Sensor
import AllFactories from 'src/side_nav/components/factoriesPanel/containers/AllFactories';
import ProductionLineContainer from 'src/side_nav/components/productionLines/containers/ProductionLineContainer';
import MachinesPanel from 'src/side_nav/components/newAdd/MachinesPanel';
import ComponentsPanel from 'src/side_nav/components/newAdd/ComponentsPanel';
import ComponentAlertHistoryTable from 'src/side_nav/components/newAdd/ComponentAlertHistoryTable';
import FailureTable from 'src/side_nav/components/newAdd/modules/failureTable';
import SensorsTable from 'src/side_nav/components/newAdd/modules/SensorsTable';
import PredictionPage from 'src/side_nav/components/newAdd/modules/PredictionPage';
import PredictionPageShowAll from 'src/side_nav/components/newAdd/modules/PredictionPageShowAll';
import AlertsPage from 'src/side_nav/components/newAdd/modules/AlertsPage';
import MaintenancePage from 'src/maintenance/containers/MaintenancePage';
import MachineActionsPage from 'src/side_nav/components/machineActions/containers/MachineActionsPage';
import LanguagesContainer from "src/settings/containers/LanguagesContainer";

// ML
import MLContainer from "src/ml/containers/MLContainer";
import MLAdvancedContainer from "src/ml/containers/MLAdvancedContainer"
import RetrainControlContainer from "src/ml/containers/RetrainControlContainer"

// AutoML
import AutoMLPage from "src/health/components/AutoMLPage"
import RULRegAutoMLPage from 'src/health/components/RULRegAutoMLPage'


import PermittedRoute from 'src/shared/middleware/PermittedRoute';

// Errors Page
import Error401Page from 'src/shared/errors/Error401Page';

// User Manual
import UserManualContainer from 'src/userManual/containers/UserManualContainer';

// Logs Page
import LogsPage from 'src/logs/containers/LogsPage';

// Example components
import ExamplePage from 'src/example/Example'

// ML Monitor pages
import AnomalyMonitorPage from 'src/example/anomalyMonitor/AnomalyMonitorPage'
import POFMonitorPage from 'src/example/pofMonitor/POFMonitorPage'
import RULMonitorPage from 'src/example/rulMonitor/RULMonitorPage'

// Health Assessment
import MachineHealthPage from 'src/health/containers/MachineHealthPage'

// Types
import { AppState, Organization, ResourceType } from 'src/types'

// Constants
import { CLOUD } from 'src/shared/constants'
import {
  LOAD_DATA,
  TELEGRAF_PLUGINS,
  CLIENT_LIBS,
} from 'src/shared/constants/routes'

// Actions
import { setOrg } from 'src/organizations/actions/creators'

// Utils
import { updateReportingContext } from 'src/cloud/utils/reporting'
import { isFlagEnabled } from 'src/shared/utils/featureFlag'

// Decorators
import { RouteComponentProps } from 'react-router-dom'
import {
  RemoteDataState,
  SpinnerContainer,
  TechnoSpinner,
} from '@influxdata/clockface'

// Selectors
import { getAll } from 'src/resources/selectors'

interface OwnProps {
  children: React.ReactElement<any>
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = ReduxProps & OwnProps & RouteComponentProps<{ orgID: string }>

const SetOrg: FC<Props> = ({
  match: {
    params: { orgID },
  },
  orgs,
  history,
}) => {
  const [loading, setLoading] = useState(RemoteDataState.Loading)
  const dispatch = useDispatch()
  const foundOrg = orgs.find(o => o.id === orgID)
  const firstOrgID = orgs[0]?.id

  useEffect(() => {
    // does orgID from url match any orgs that exist
    if (foundOrg) {
      dispatch(setOrg(foundOrg))
      updateReportingContext({ orgID: orgID })
      setLoading(RemoteDataState.Done)
      return
    }
    updateReportingContext({ orgID: null })

    if (!orgs.length) {
      history.push(`/no-orgs`)
      return
    }

    // else default to first org
    history.push(`/orgs/${firstOrgID}`)
  }, [orgID, firstOrgID, foundOrg, dispatch, history, orgs.length])

  const orgPath = '/orgs/:orgID'

  return (
    <SpinnerContainer loading={loading} spinnerComponent={<TechnoSpinner />}>
      <Switch>
        {/* Alerting */}
        <Route path={`${orgPath}/alerting`} component={AlertingIndex} />
        <Route path={`${orgPath}/alert-history`} component={AlertHistoryIndex} />
        <Route path={`${orgPath}/checks/:checkID`} component={CheckHistory} />

        {/* Tasks */}
        <Route path={`${orgPath}/tasks/:id/runs`} component={TaskRunsPage} />
        <Route path={`${orgPath}/tasks/:id/edit`} component={TaskEditPage} />
        <Route path={`${orgPath}/tasks/new`} component={TaskPage} />
        <Route path={`${orgPath}/tasks`} component={TasksPage} />

        {/* DT */}
        <PermittedRoute exact path={`${orgPath}/dt`} component={DigitalTwinPage} allowedRoles={["member", "admin", "editor"]} />
        {/* <PermittedRoute exact path={`${orgPath}/dt/factory-scene`} component={FactorySceneOverlay} allowedRoles={["member", "admin", "editor"]} /> */}


        {/* ObjectCreator */}
        <PermittedRoute exact path={`${orgPath}/object-creator`} component={ObjectCreatorPage} allowedRoles={["admin"]} />

        {/* Factory/Machines/Components/Sensors Hierarchy */}
        <Route path={`${orgPath}/allFactories`} component={AllFactories} />
        <Route path={`${orgPath}/production-line/:FID/:PLID`} component={ProductionLineContainer} />
        <Route exact path={`${orgPath}/machines/:FID/:PLID`} component={MachinesPanel} />
        <Route exact path={`${orgPath}/components/:FID/:PLID/:MID`} component={ComponentsPanel} />
        <Route exact path={`${orgPath}/machines/:FID/:MID/:CID/history`} component={ComponentAlertHistoryTable} />
        <Route exact path={`${orgPath}/sensors/:FID/:PLID/:MID/:CID`} component={SensorsTable} />
        <Route exact path={`${orgPath}/machines/:FID/:PLID/:MID/actions`} component={MachineActionsPage} />
        <Route exact path={`${orgPath}/failures/:FID/:MID/:CID`} component={FailureTable} />
        <Route exact path={`${orgPath}/failures/:FID/:MID`} component={FailureTable} />
        <Route exact path={`${orgPath}/failures/:FID`} component={FailureTable} />
        <Route exact path={`${orgPath}/failures`} component={FailureTable} />
        <Route exact path={`${orgPath}/maintenance-records/:FID`} component={MaintenancePage} />

        <Route exact path={`${orgPath}/predictions/:FID/:PLID/:MID`} component={PredictionPage} />
        <Route exact path={`${orgPath}/predictions/:FID/:PLID/:MID/:CID`} component={PredictionPage} />

        <Route exact path={`${orgPath}/prediction-info/:FID/:PLID/:MID/:PID`} component={PredictionPageShowAll} />
        <Route exact path={`${orgPath}/prediction-info/:FID/:PLID/:MID/:CID/:PID`} component={PredictionPageShowAll} />

        <Route exact path={`${orgPath}/alerts`} component={AlertsPage} />
        <Route exact path={`${orgPath}/alerts/:hardwareName`} component={AlertsPage} />

        {/* ML */}
        <Route exact path={`${orgPath}/ml`} component={MLContainer} />
        <Route exact path={`${orgPath}/advanced-ml`} component={MLAdvancedContainer} />
        <Route exact path={`${orgPath}/retrain`} component={RetrainControlContainer} />
        {/* <Route exact path={`${orgPath}/automl/:experimentName/:tab`} component={AutoML} /> */}
        <Route exact path={`${orgPath}/automl/:experimentName/:tab`} component={AutoMLPage} />
        <Route exact path={`${orgPath}/rulreg-automl/:pipelineID/:tab`} component={RULRegAutoMLPage} />

        {/* User Manual */}
        <PermittedRoute exact path={`${orgPath}/user-manual`} component={UserManualContainer} allowedRoles={["member", "admin", "editor"]} />
        <PermittedRoute exact path={`${orgPath}/user-manual/:page`} component={UserManualContainer} allowedRoles={["member", "admin", "editor"]} />

        {/* ERRORS PAGE */}
        <Route exact path={`${orgPath}/errors/401`} component={Error401Page} />

        {/* LOGS PAGE */}
        <PermittedRoute exact path={`${orgPath}/logs`} component={LogsPage} allowedRoles={["admin"]} />

        {/* EXAMPLE */}
        <Route path={`${orgPath}/examples`} component={ExamplePage} />

        {/* ML MONITOR */}
        <Route path="/public/iris_model_performance_dashboard" component={AnomalyMonitorPage} />
        <Route path={`${orgPath}/anomaly-monitor`} component={AnomalyMonitorPage} />
        <Route path={`${orgPath}/pof-monitor`} component={POFMonitorPage} />
        <Route path={`${orgPath}/rul-monitor`} component={RULMonitorPage} />

        {/* HEALTH ASSESSMENT */}
        <Route path={`${orgPath}/health/:FID/:PLID/:MID/:CID`} component={MachineHealthPage} />
        <Route path={`${orgPath}/health/:FID/:PLID/:MID`} component={MachineHealthPage} />

        {/* Data Explorer */}
        <Route path={`${orgPath}/data-explorer`} component={DataExplorerPage} />

        {/* Dashboards */}
        <Route
          path={`${orgPath}/dashboards-list`}
          component={DashboardsIndex}
        />
        <Route
          path={`${orgPath}/dashboards/:dashboardID`}
          component={DashboardContainer}
        />
        <Route
          path={`${orgPath}/dashboard-router/:id`}
          component={DashboardRouter}
        />
        <Route
          path={`${orgPath}/snapshot-router/:id`}
          component={SnapshotRouter}
        />
        <Route
          exact
          path={`${orgPath}/dashboards`}
          component={RouteToDashboardList}
        />

        {/* Flows  */}
        {isFlagEnabled('notebooks') && (
          <Route path={`${orgPath}/notebooks/:id`} component={NotebookPage} />
        )}

        {isFlagEnabled('notebooks') && (
          <Route path={`${orgPath}/flows`} component={FlowsIndex} />
        )}

        {/* Write Data */}
        <Route
          path={`${orgPath}/${LOAD_DATA}/sources`}
          component={WriteDataPage}
        />
        <Route
          path={`${orgPath}/${LOAD_DATA}/${CLIENT_LIBS}`}
          component={ClientLibrariesPage}
        />
        <Route
          path={`${orgPath}/${LOAD_DATA}/${TELEGRAF_PLUGINS}`}
          component={TelegrafPluginsPage}
        />

        {/* Load Data */}
        <Route
          exact
          path={`${orgPath}/${LOAD_DATA}`}
          component={WriteDataPage}
        />
        <Route
          path={`${orgPath}/${LOAD_DATA}/scrapers`}
          component={ScrapersIndex}
        />
        <Route
          path={`${orgPath}/${LOAD_DATA}/telegrafs`}
          component={TelegrafsPage}
        />
        <Route
          path={`${orgPath}/${LOAD_DATA}/tokens`}
          component={TokensIndex}
        />
        <Route
          path={`${orgPath}/${LOAD_DATA}/buckets`}
          component={BucketsIndex}
        />

        {/* Settings */}
        <Route
          path={`${orgPath}/settings/variables`}
          component={VariablesIndex}
        />
        <Route
          path={`${orgPath}/settings/templates`}
          component={TemplatesIndex}
        />
        <Route
          exact
          path={`${orgPath}/settings/labels`}
          component={LabelsIndex}
        />
        <Route
          exact
          path={`${orgPath}/settings/languages`}
          component={LanguagesContainer}
        />
        <Route exact path={`${orgPath}/settings`} component={VariablesIndex} />

        {/* Members */}
        {!CLOUD && (
          <Route path={`${orgPath}/members`} component={MembersIndex} />
        )}

        {/* Users */}
        {!CLOUD && (
          <PermittedRoute exact path={`${orgPath}/users`} component={UsersIndex} allowedRoles={["admin"]} />
        )}

        {/* REPORTS */}
        <Route exact path={`${orgPath}/reports`} component={ReportsContainer} />
        <Route exact path={`${orgPath}/report-view/:id`} component={ReportViewContainer} />


        {/* About */}
        <Route path={`${orgPath}/about`} component={OrgProfilePage} />

        {/* Getting Started */}
        <Route exact path="/orgs/:orgID" component={MePage} />

        {/* Not Found Page */}
        {/* <Route path="" component={Error404Page} /> */}
      </Switch>
    </SpinnerContainer>
  )
}

const mstp = (state: AppState) => {
  const orgs = getAll<Organization>(state, ResourceType.Orgs)

  return { orgs }
}

const connector = connect(mstp)

export default connector(SetOrg)
