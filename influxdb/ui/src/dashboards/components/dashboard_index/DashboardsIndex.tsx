// Libraries
import React, { PureComponent } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { connect, ConnectedProps } from 'react-redux'
import { Switch, Route } from 'react-router-dom'

// Decorators
import { ErrorHandling } from 'src/shared/decorators/errors'

// Components
import DashboardsIndexContents from 'src/dashboards/components/dashboard_index/DashboardsIndexContents'
import { Page, SelectDropdown } from '@influxdata/clockface'
import SearchWidget from 'src/shared/components/search_widget/SearchWidget'
import AddResourceDropdown from 'src/shared/components/AddResourceDropdown'
import GetAssetLimits from 'src/cloud/components/GetAssetLimits'
import RateLimitAlert from 'src/cloud/components/RateLimitAlert'
import ResourceSortDropdown from 'src/shared/components/resource_sort_dropdown/ResourceSortDropdown'
import DashboardImportOverlay from 'src/dashboards/components/DashboardImportOverlay'
import CreateFromTemplateOverlay from 'src/templates/components/createFromTemplateOverlay/CreateFromTemplateOverlay'
import DashboardExportOverlay from 'src/dashboards/components/DashboardExportOverlay'

// Utils
import { pageTitleSuffixer } from 'src/shared/utils/pageTitles'
import { extractDashboardLimits } from 'src/cloud/utils/limits'

// Actions
import { createDashboard as createDashboardAction } from 'src/dashboards/actions/thunks'
import { setDashboardSort } from 'src/dashboards/actions/creators'

// Types
import { AppState, ResourceType } from 'src/types'
import { Sort } from '@influxdata/clockface'
import { SortTypes } from 'src/shared/utils/sort'
import { DashboardSortKey } from 'src/shared/components/resource_sort_dropdown/generateSortItems'

type ReduxProps = ConnectedProps<typeof connector>
type Props = ReduxProps & RouteComponentProps<{ orgID: string }>

interface State {
  dashboardType: string
  dashboardTypes: string[]
  searchTerm: string
}

@ErrorHandling
class DashboardIndex extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      dashboardType: 'All Dashboards',
      dashboardTypes: ["All Dashboards", "Organization's Dashboards", "System Health"],
      searchTerm: '',
    }
  }

  componentDidMount() {
    if (localStorage.getItem("userRole") !== "admin") {
      this.setState({
        dashboardType: "Organization's Dashboards",
        dashboardTypes: this.state.dashboardTypes.filter(d => d !== "All Dashboards")
      })
    }
  }

  public render() {
    const { createDashboard, sortOptions, limitStatus } = this.props
    const { searchTerm } = this.state

    return (
      <>
        <Page
          testID="empty-dashboards-list"
          titleTag={pageTitleSuffixer(['Dashboards'])}
        >
          <Page.Header fullWidth={false}>
            <Page.Title title="Dashboards" />
            <RateLimitAlert />
          </Page.Header>

          <Page.ControlBar fullWidth={false}>
            <Page.ControlBarLeft className="dashboard-filter-buttons">
              <SearchWidget
                placeholderText="Filter dashboards..."
                onSearch={this.handleFilterDashboards}
                searchTerm={searchTerm}
              />
              <ResourceSortDropdown
                resourceType={ResourceType.Dashboards}
                sortDirection={sortOptions.sortDirection}
                sortKey={sortOptions.sortKey}
                sortType={sortOptions.sortType}
                onSelect={this.handleSort}
              />
              <SelectDropdown
                options={this.state.dashboardTypes}
                selectedOption={this.state.dashboardType}
                onSelect={(e) => this.setState({ dashboardType: e })}
                style={{ width: '210px' }}
              />
            </Page.ControlBarLeft>
            <Page.ControlBarRight>
              <AddResourceDropdown
                onSelectNew={createDashboard}
                onSelectImport={this.summonImportOverlay}
                onSelectTemplate={this.summonImportFromTemplateOverlay}
                resourceName="Dashboard"
                canImportFromTemplate={true}
                limitStatus={limitStatus}
              />
            </Page.ControlBarRight>
          </Page.ControlBar>
          <Page.Contents
            className="dashboards-index__page-contents"
            fullWidth={false}
            scrollable={true}
          >
            <GetAssetLimits>
              <DashboardsIndexContents
                searchTerm={searchTerm}
                dashboardType={this.state.dashboardType}
                onFilterChange={this.handleFilterDashboards}
                sortDirection={sortOptions.sortDirection}
                sortType={sortOptions.sortType}
                sortKey={sortOptions.sortKey}
              />
            </GetAssetLimits>
          </Page.Contents>
        </Page>
        <Switch>
          <Route
            path="/orgs/:orgID/dashboards-list/:dashboardID/export"
            component={DashboardExportOverlay}
          />
          <Route
            path="/orgs/:orgID/dashboards-list/import/template"
            component={CreateFromTemplateOverlay}
          />
          <Route
            path="/orgs/:orgID/dashboards-list/import"
            component={DashboardImportOverlay}
          />
        </Switch>
      </>
    )
  }

  private handleSort = (
    sortKey: DashboardSortKey,
    sortDirection: Sort,
    sortType: SortTypes
  ): void => {
    this.props.setDashboardSort({ sortKey, sortDirection, sortType })
  }

  private handleFilterDashboards = (searchTerm: string): void => {
    this.setState({ searchTerm })
  }

  private summonImportOverlay = (): void => {
    const {
      history,
      match: {
        params: { orgID },
      },
    } = this.props
    history.push(`/orgs/${orgID}/dashboards-list/import`)
  }

  private summonImportFromTemplateOverlay = (): void => {
    const {
      history,
      match: {
        params: { orgID },
      },
    } = this.props
    history.push(`/orgs/${orgID}/dashboards-list/import/template`)
  }
}

const mstp = (state: AppState) => {
  const {
    cloud: { limits },
  } = state
  const sortOptions = state.resources.dashboards['sortOptions']

  return {
    limitStatus: extractDashboardLimits(limits),
    sortOptions,
  }
}

const mdtp = {
  createDashboard: createDashboardAction,
  setDashboardSort,
}

const connector = connect(mstp, mdtp)

export default connector(DashboardIndex)
