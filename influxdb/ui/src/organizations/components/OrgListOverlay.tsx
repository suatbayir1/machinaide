// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'

// Components
import { Overlay } from '@influxdata/clockface'
import OrgCard from 'src/organizations/components/OrgCard';
import OrganizationService from 'src/organizations/services/OrganizationService';

// Types
import { AppState, Bucket, Organization, ResourceType } from 'src/types';
import {
    ComponentStatus,
} from '@influxdata/clockface'

// Actions
import { createOrgWithBucket, deleteOrg } from 'src/organizations/actions/thunks'

// Selectors
import { getAll } from 'src/resources/selectors'

interface OwnProps { }

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps & RouteComponentProps

interface State {
    org: Organization
    bucket: Bucket
    orgNameInputStatus: ComponentStatus
    bucketNameInputStatus: ComponentStatus
    orgErrorMessage: string
    bucketErrorMessage: string
}

class OrgListOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props)
        this.state = {
            org: { name: '' },
            bucket: { name: '', retentionRules: [], readableRetention: 'forever' },
            orgNameInputStatus: ComponentStatus.Default,
            bucketNameInputStatus: ComponentStatus.Default,
            orgErrorMessage: '',
            bucketErrorMessage: '',
        }
    }

    public render() {
        return (
            <Overlay visible={true}>
                <Overlay.Container maxWidth={500}>
                    <Overlay.Header
                        title="Organization List"
                        onDismiss={this.closeModal}
                        testID="create-org-overlay--header"
                    />
                    <Overlay.Body>
                        {
                            this.props.orgs.length > 0 && this.props.orgs.map(org => (
                                <OrgCard key={org["id"]} org={org} onDelete={() => this.deleteOrganization(org)} />
                            ))
                        }
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }

    private deleteOrganization = async (org: Organization) => {
        await OrganizationService.deleteOrganizationFromUsers({ "orgID": org["id"] });
        this.props.deleteOrg(org);
    }

    private closeModal = () => {
        this.props.history.goBack()
    }
}

const mstp = (state: AppState) => {
    const orgs = getAll<Organization>(state, ResourceType.Orgs)

    return {
        orgs,
    }
}

const mdtp = {
    createOrgWithBucket,
    deleteOrg,
}

const connector = connect(mstp, mdtp)

export default connector(withRouter(OrgListOverlay))
