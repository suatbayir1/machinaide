// Libraries
import React, { PureComponent } from 'react'

// Libraries
import { isEmpty } from 'lodash'
import { connect, ConnectedProps } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'

// Components
import TabbedPageHeader from 'src/shared/components/tabbed_page/TabbedPageHeader'
import {
  EmptyState,
  Sort,
  Notification,
  IconFont,
  Gradients
} from '@influxdata/clockface'
import SearchWidget from 'src/shared/components/search_widget/SearchWidget'
import MemberList from 'src/members/components/MemberList'
import FilterList from 'src/shared/components/FilterList'

// Actions
import { deleteMember, getMembers } from 'src/members/actions/thunks'
import MemberService from 'src/members/services/MemberService';

// Types
import { ComponentSize } from '@influxdata/clockface'
import { AppState, Member, ResourceType } from 'src/types'
import { SortTypes } from 'src/shared/utils/sort'

// Selectors
import { getAll } from 'src/resources/selectors'

type ReduxProps = ConnectedProps<typeof connector>
type Props = ReduxProps

interface State {
  searchTerm: string
  sortKey: SortKey
  sortDirection: Sort
  sortType: SortTypes
  notificationVisible: boolean
  notificationType: string
  notificationMessage: string
}

type SortKey = keyof Member

const FilterMembers = FilterList<Member>()

class Members extends PureComponent<
  Props & RouteComponentProps<{ orgID: string }>,
  State
> {
  constructor(props) {
    super(props)
    this.state = {
      searchTerm: '',
      sortKey: 'name',
      sortDirection: Sort.Ascending,
      sortType: SortTypes.String,
      notificationVisible: false,
      notificationType: '',
      notificationMessage: '',
    }
  }

  public render() {
    const { searchTerm, sortKey, sortDirection, sortType } = this.state

    return (
      <>
        <TabbedPageHeader
          childrenLeft={
            <SearchWidget
              placeholderText="Filter members..."
              searchTerm={searchTerm}
              onSearch={this.handleFilterChange}
            />
          }
        />
        <FilterMembers
          list={this.props.members}
          searchKeys={['name']}
          searchTerm={searchTerm}
        >
          {ms => (
            <MemberList
              members={ms}
              emptyState={this.emptyState}
              onDelete={this.removeMember}
              getMembers={this.getMembers}
              handleChangeNotification={this.handleChangeNotification}
              sortKey={sortKey}
              sortDirection={sortDirection}
              sortType={sortType}
              onClickColumn={this.handleClickColumn}
              orgID={this.props.match.params.orgID}
            />
          )}
        </FilterMembers>
        <Notification
          key={"id"}
          id={"id"}
          icon={
            this.state.notificationType === 'success'
              ? IconFont.Checkmark
              : IconFont.Alerts
          }
          duration={5000}
          size={ComponentSize.Small}
          visible={this.state.notificationVisible}
          gradient={
            this.state.notificationType === 'success'
              ? Gradients.HotelBreakfast
              : Gradients.DangerDark
          }
          onTimeout={() => this.setState({ notificationVisible: false })}
          onDismiss={() => this.setState({ notificationVisible: false })}
        >
          <span className="notification--message">{this.state.notificationMessage}</span>
        </Notification>
      </>
    )
  }

  private handleChangeNotification = (type, message) => {
    this.setState({
      notificationVisible: true,
      notificationType: type,
      notificationMessage: message
    })
  }

  private handleClickColumn = (nextSort: Sort, sortKey: SortKey) => {
    const sortType = SortTypes.String
    this.setState({ sortKey, sortDirection: nextSort, sortType })
  }

  private removeMember = async (member: Member) => {
    const { onRemoveMember } = this.props
    onRemoveMember(member)

    const payload = {
      "name": member["name"],
      "orgID": this.props.match.params.orgID
    };

    await MemberService.removeMemberFromOrganizationMongo(payload);
  }

  private getMembers = () => {
    this.props.getMembers();
  }

  private handleFilterChange = (searchTerm: string): void => {
    this.setState({ searchTerm })
  }

  private get emptyState(): JSX.Element {
    const { searchTerm } = this.state

    if (isEmpty(searchTerm)) {
      return (
        <EmptyState size={ComponentSize.Medium}>
          <EmptyState.Text>
            Looks like there aren't any <b>Members</b>.
          </EmptyState.Text>
        </EmptyState>
      )
    }

    return (
      <EmptyState size={ComponentSize.Medium}>
        <EmptyState.Text>No Members match your query</EmptyState.Text>
      </EmptyState>
    )
  }
}

const mstp = (state: AppState) => {
  const members = getAll<Member>(state, ResourceType.Members)
  return { members }
}

const mdtp = {
  onRemoveMember: deleteMember,
  getMembers: getMembers
}

const connector = connect(mstp, mdtp)

export default connector(withRouter(Members))
