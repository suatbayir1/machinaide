// Libraries
import React, { PureComponent } from 'react'
import memoizeOne from 'memoize-one'
import AddMemberOverlay from 'src/members/components/AddMemberOverlay';

// Components
import {
  ResourceList,
  ComponentSize,
  Button,
  IconFont,
  ComponentColor,
  ButtonType,
} from '@influxdata/clockface'
import MemberCard from 'src/members/components/MemberCard'

// Types
import { Member } from 'src/types'
import { SortTypes } from 'src/shared/utils/sort'
import { Sort } from '@influxdata/clockface'

// Selectors
import { getSortedResources } from 'src/shared/utils/sort'

type SortKey = keyof Member

interface Props {
  members: Member[]
  emptyState: JSX.Element
  onDelete: (member: Member) => void
  getMembers: () => void
  handleChangeNotification: (type, message) => void
  sortKey: string
  sortDirection: Sort
  sortType: SortTypes
  onClickColumn: (nextSort: Sort, sortKey: SortKey) => void
  orgID: string
}

interface State {
  visibleAddMemberOverlay: boolean
}

export default class MemberList extends PureComponent<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      visibleAddMemberOverlay: false,
    };
  }

  private memGetSortedResources = memoizeOne<typeof getSortedResources>(
    getSortedResources
  )

  addMember = async () => {
    this.setState({
      visibleAddMemberOverlay: true
    })
  }

  handleDismissAddMemberOverlay = () => {
    this.setState({
      visibleAddMemberOverlay: false
    })
  }

  public render() {
    const { sortKey, sortDirection, onClickColumn } = this.props

    return (
      <React.Fragment>

        <ResourceList>
          <ResourceList.Header>
            <ResourceList.Sorter
              name="Username"
              sortKey={this.headerKeys[0]}
              sort={sortKey === this.headerKeys[0] ? sortDirection : Sort.None}
              onClick={onClickColumn}
            />
            <ResourceList.Sorter
              name="Role"
              sortKey={this.headerKeys[1]}
              sort={sortKey === this.headerKeys[1] ? sortDirection : Sort.None}
              onClick={onClickColumn}
            />
            {
              ["admin"].includes(localStorage.getItem("userRole")) &&
              <Button
                text={"Add Member"}
                size={ComponentSize.Small}
                icon={IconFont.Plus}
                color={ComponentColor.Success}
                type={ButtonType.Submit}
                onClick={this.addMember}
              />
            }
          </ResourceList.Header>
          <ResourceList.Body
            emptyState={this.props.emptyState}
            data-testid="members-list"
          >
            {this.rows}
          </ResourceList.Body>
        </ResourceList>

        <AddMemberOverlay
          visibleAddMemberOverlay={this.state.visibleAddMemberOverlay}
          handleDismissAddMemberOverlay={this.handleDismissAddMemberOverlay}
          orgID={this.props.orgID}
          getMembers={this.props.getMembers}
          handleChangeNotification={this.props.handleChangeNotification}
        />
      </React.Fragment>
    )
  }

  private get headerKeys(): SortKey[] {
    return ['name', 'role']
  }

  private get rows(): JSX.Element[] {
    const { members, sortKey, sortDirection, sortType, onDelete } = this.props
    const sortedMembers = this.memGetSortedResources(
      members,
      sortKey,
      sortDirection,
      sortType
    )

    return sortedMembers.map(member => (
      <MemberCard key={member.id} member={member} onDelete={onDelete} />
    ))
  }
}
