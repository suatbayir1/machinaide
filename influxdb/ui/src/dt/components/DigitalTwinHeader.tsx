// Libraries
import React, { PureComponent } from 'react'

// Components
import {
  Page,
} from '@influxdata/clockface'
import CloudUpgradeButton from 'src/shared/components/CloudUpgradeButton'

interface Props {
  title: string
}

interface State {
  payload: object
}

class DigitalTwinHeader extends PureComponent<Props, State> {
  constructor(props) {
    super(props);
  }

  public render() {
    const { title } = this.props
    return (
      <>
        <Page.Header fullWidth={true}>
          <Page.Title title={title} />
          <CloudUpgradeButton />
        </Page.Header>
      </>
    )
  }
}

export default DigitalTwinHeader;