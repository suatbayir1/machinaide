// Libraries
import React, { FunctionComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import { Overlay } from '@influxdata/clockface'
import ShowDataSourceInformation from 'src/dt/overlays/ShowDataSourceInformation'

// Actions
import { dismissOverlay } from 'src/overlays/actions/overlays'

type ReduxProps = ConnectedProps<typeof connector>
type OverlayControllerProps = ReduxProps

const OverlayController: FunctionComponent<OverlayControllerProps> = props => {
    let activeOverlay = <></>
    let visibility = true

    const { overlayID } = props

    console.log("overlayID", overlayID);

    switch (overlayID) {
        case 'data-source':
            activeOverlay = <ShowDataSourceInformation />
            break
        default:
            visibility = false
    }

    return <Overlay visible={visibility}>{activeOverlay}</Overlay>
}

const mstp = (state) => {
    return {
        overlayID: state.dtReducer.overlayID
    }
}

const mdtp = {
    clearOverlayControllerState: dismissOverlay,
}

const connector = connect(mstp, mdtp)
export default connector(OverlayController)
