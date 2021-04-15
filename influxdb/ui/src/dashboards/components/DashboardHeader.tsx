// Libraries
import React, { FC, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'

// Components
import AutoRefreshDropdown from 'src/shared/components/dropdown_auto_refresh/AutoRefreshDropdown'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import PresentationModeToggle from 'src/shared/components/PresentationModeToggle'
import DashboardLightModeToggle from 'src/dashboards/components/DashboardLightModeToggle'
import GraphTips from 'src/shared/components/graph_tips/GraphTips'
import RenamablePageTitle from 'src/pageLayout/components/RenamablePageTitle'
import TimeZoneDropdown from 'src/shared/components/TimeZoneDropdown'
import { Button, IconFont, ComponentColor, Page } from '@influxdata/clockface'

// Actions
import { toggleShowVariablesControls as toggleShowVariablesControlsAction } from 'src/userSettings/actions'
import { updateDashboard as updateDashboardAction } from 'src/dashboards/actions/thunks'
import {
  setAutoRefreshInterval as setAutoRefreshIntervalAction,
  setAutoRefreshStatus as setAutoRefreshStatusAction,
} from 'src/shared/actions/autoRefresh'
import {
  setDashboardTimeRange as setDashboardTimeRangeAction,
  updateQueryParams as updateQueryParamsAction,
} from 'src/dashboards/actions/ranges'

// Utils
import { event } from 'src/cloud/utils/reporting'
import { resetQueryCache } from 'src/shared/apis/queryCache'
import { isFlagEnabled } from 'src/shared/utils/featureFlag'

// Selectors
import { getTimeRange } from 'src/dashboards/selectors'
import { getByID } from 'src/resources/selectors'
import { getOrg } from 'src/organizations/selectors'

// Constants
import { DemoDataDashboardNames } from 'src/cloud/constants'
import {
  DEFAULT_DASHBOARD_NAME,
  DASHBOARD_NAME_MAX_LENGTH,
} from 'src/dashboards/constants/index'

// Types
import {
  AppState,
  AutoRefresh,
  AutoRefreshStatus,
  Dashboard,
  ResourceType,
  TimeRange,
} from 'src/types'

import SystemInfoBox from 'src/side_nav/components/newAdd/modules/SystemInfoBox'
import { INFLUX } from 'src/config'

interface OwnProps {
  autoRefresh: AutoRefresh
  onManualRefresh: () => void
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps & RouteComponentProps<{ orgID: string }>

const DashboardHeader: FC<Props> = ({
  dashboard,
  onManualRefresh,
  toggleShowVariablesControls,
  showVariablesControls,
  onSetAutoRefreshStatus,
  setAutoRefreshInterval,
  autoRefresh,
  timeRange,
  updateDashboard,
  updateQueryParams,
  setDashboardTimeRange,
  history,
  org,
}) => {
  const demoDataset = DemoDataDashboardNames[dashboard.name]
  const [dialogBox, setDialogBox] = React.useState(false);
  const [interval, setInterval] = React.useState(1500);
  const [allCellData, setAllCellData] = React.useState([]);

  useEffect(() => {
    if (dashboard && dashboard.name.includes("Monitor")) {
      // window.setInterval(() => {
      queryResults(timeRange, autoRefresh);
      // }, autoRefresh["interval"]);
    }

    if (demoDataset) {
      event('demoData_dashboardViewed', { demo_dataset: demoDataset })
    }
  }, [dashboard.id, demoDataset])

  const handleAddNote = () => {
    history.push(`/orgs/${org.id}/dashboards/${dashboard.id}/notes/new`)
  }

  const handleAddCell = () => {
    history.push(`/orgs/${org.id}/dashboards/${dashboard.id}/cells/new`)
  }

  const handleSystemInfo = () => {
    setDialogBox(true);
  }

  const handleCloseSystemInfo = () => {
    setDialogBox(false);
  }

  const handleRenameDashboard = (name: string) => {
    updateDashboard(dashboard.id, { name })
  }

  const handleChooseAutoRefresh = (milliseconds: number) => {
    setInterval(milliseconds);

    setAutoRefreshInterval(dashboard.id, milliseconds)

    if (milliseconds === 0) {
      onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Paused)
      return
    }

    onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Active)
  }

  const handleChooseTimeRange = (timeRange: TimeRange) => {
    if (isFlagEnabled('queryCacheForDashboards')) {
      resetQueryCache()
    }
    setDashboardTimeRange(dashboard.id, timeRange)
    updateQueryParams({
      lower: timeRange.lower,
      upper: timeRange.upper,
    })

    if (timeRange.type === 'custom') {
      onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Disabled)
      return
    }

    if (autoRefresh.status === AutoRefreshStatus.Disabled) {
      if (autoRefresh.interval === 0) {
        onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Paused)
        return
      }

      onSetAutoRefreshStatus(dashboard.id, AutoRefreshStatus.Active)
    }
  }

  const resetCacheAndRefresh = (): void => {
    // We want to invalidate the existing cache when a user manually refreshes the dashboard
    if (isFlagEnabled('queryCacheForDashboards')) {
      resetQueryCache()
    }
    onManualRefresh()
  }

  const getDashboardCells = async () => {
    let url = `${INFLUX.CHRONOGRAF_URL}api/v2/dashboards/${dashboard.id}?include=properties`;

    const fetchPromise = fetch(url)

    try {
      const response = await fetchPromise;
      const res = await response.json();

      return res
    }
    catch (err) {
      console.log("Error getting average: ", err);
    }
  }

  const resolveQuery = async (query: string): Promise<any> => {
    let url = `${INFLUX.CHRONOGRAF_URL}api/v2/query?orgID=${org.id}`;
    // let url = "http://localhost:9090/api/v2/query?orgID=d572bde16b31757c";

    const fetchPromise = fetch(url, {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify({
        'query': query,
      }),
      headers: {
        'Content-Type': 'application/json',
      }
    })

    try {
      const response = await fetchPromise;
      const res = await response.text();
      return res;
    }
    catch (err) {
      console.log("Error while executing query: ", err);
    }
  }

  const replaceQueryVariable = (query, timeRange, interval) => {
    let tempVariables = {
      "v.timeRangeStart": `-${timeRange.duration}`,
      "v.timeRangeStop": 'now()',
      "v.windowPeriod": (interval.interval / 1000).toString() + 's'
    }

    for (let key in tempVariables) {
      if (query.includes(key)) {
        query = query.replace(key, tempVariables[key]);
      }
    }

    return query;
  }

  const csvToJSON = async (csv) => {
    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(",");

    for (var i = 1; i < lines.length; i++) {
      var obj = {};
      var currentline = lines[i].split(",");

      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push(obj);
    }

    return result;
  }



  const queryResults = async (timeRange, interval) => {
    const dashboard = await getDashboardCells();
    const allCellData = [];

    let numberOfCells = dashboard.cells.length;
    let allCells = dashboard.cells;

    for (let x = 0; x < numberOfCells; x++) {
      let cell = allCells[x];
      let cellName = cell.name;
      let query = cell.properties.queries[0].text;

      let newQuery = replaceQueryVariable(query, timeRange, interval);

      let response = await resolveQuery(newQuery);
      let responseJson = await csvToJSON(response);


      let objArray = {};

      responseJson.forEach(item => {
        if (Object.keys(objArray).includes(item["_field"])) {
          objArray[item["_field"]].push(Number(item["_value"]));
        } else {
          objArray[item["_field"]] = [Number(item["_value"])];
        }
      })


      Object.keys(objArray).forEach(key => {
        let values = objArray[key];
        let sum = values.reduce((previous, current) => current += previous);
        let avg = sum / values.length;

        objArray[key] = avg;
      })


      delete objArray["undefined"];

      const jsonData = {
        "cellName": cellName,
        "jsonData": objArray
      };

      allCellData.push(jsonData);
    }

    setAllCellData(allCellData);
  }

  return (
    <>
      <Page.Header fullWidth={true}>
        <RenamablePageTitle
          maxLength={DASHBOARD_NAME_MAX_LENGTH}
          onRename={handleRenameDashboard}
          name={dashboard && dashboard.name}
          placeholder={DEFAULT_DASHBOARD_NAME}
        />
      </Page.Header>

      <SystemInfoBox
        overlay={dialogBox}
        onClose={handleCloseSystemInfo}
        timeRange={timeRange}
        interval={interval}
        allCellData={allCellData}
      />

      <Page.ControlBar fullWidth={true}>
        <Page.ControlBarLeft>
          <Button
            icon={IconFont.AddCell}
            color={ComponentColor.Primary}
            onClick={handleAddCell}
            text="Add Cell"
            titleText="Add cell to dashboard"
          />
          <Button
            icon={IconFont.TextBlock}
            text="Add Note"
            onClick={handleAddNote}
            testID="add-note--button"
          />
          <Button
            icon={IconFont.Cube}
            text="Variables"
            testID="variables--button"
            onClick={toggleShowVariablesControls}
            color={
              showVariablesControls
                ? ComponentColor.Secondary
                : ComponentColor.Default
            }
          />
          {
            dashboard.name.includes("Monitor") ? (
              <Button
                color={ComponentColor.Success}
                icon={IconFont.Zap}
                text="System Info"
                onClick={handleSystemInfo}
                testID="add-note--button"
              />
            ) : null
          }
          <DashboardLightModeToggle />
          <PresentationModeToggle />
          <GraphTips />
        </Page.ControlBarLeft>
        <Page.ControlBarRight>
          <TimeZoneDropdown />
          <AutoRefreshDropdown
            onChoose={handleChooseAutoRefresh}
            onManualRefresh={resetCacheAndRefresh}
            selected={autoRefresh}
          />
          <TimeRangeDropdown
            onSetTimeRange={handleChooseTimeRange}
            timeRange={timeRange}
          />
        </Page.ControlBarRight>
      </Page.ControlBar>
    </>
  )
}

const mstp = (state: AppState) => {
  const { showVariablesControls } = state.userSettings
  const dashboard = getByID<Dashboard>(
    state,
    ResourceType.Dashboards,
    state.currentDashboard.id
  )

  const timeRange = getTimeRange(state)
  const org = getOrg(state)

  return {
    org,
    dashboard,
    timeRange,
    showVariablesControls,
  }
}

const mdtp = {
  toggleShowVariablesControls: toggleShowVariablesControlsAction,
  updateDashboard: updateDashboardAction,
  onSetAutoRefreshStatus: setAutoRefreshStatusAction,
  updateQueryParams: updateQueryParamsAction,
  setDashboardTimeRange: setDashboardTimeRangeAction,
  setAutoRefreshInterval: setAutoRefreshIntervalAction,
}

const connector = connect(mstp, mdtp)

export default connector(withRouter(DashboardHeader))
