// Libraries
import React, { PureComponent } from 'react'

// Components
import { Organization } from 'src/types'
// import MemberContextMenu from 'src/members/components/MemberContextMenu'
import {
    ButtonType,
    ComponentColor,
    ComponentStatus,
    ResourceCard,
    IconFont,
} from '@influxdata/clockface'
import CloudExclude from 'src/shared/components/cloud/CloudExclude'
import { Context } from 'src/clockface'

interface Props {
    org: Organization
    onDelete: (org: Organization) => void
}

class OrgCard extends PureComponent<Props> {
    public render() {
        const { org, onDelete } = this.props

        return (
            <ResourceCard
                testID="task-card"
                contextMenu={
                    <CloudExclude>
                        <Context>
                            <Context.Menu
                                icon={IconFont.Trash}
                                color={ComponentColor.Danger}
                                testID="context-delete-menu"
                            >
                                <Context.Item
                                    label="Delete"
                                    action={(org) => onDelete(org)}
                                    value={org}
                                    testID="context-delete-task"
                                />
                            </Context.Menu>
                        </Context>
                    </CloudExclude>
                }
            >
                <ResourceCard.Name name={org["name"]} />
                <ResourceCard.Meta>
                    <>Created Date: {new Date(org["createdAt"]).toISOString().substring(0, 10)}</>
                </ResourceCard.Meta>
            </ResourceCard>
        )
    }
}

export default OrgCard;