// Libraries
import React, { PureComponent } from 'react'

// Components
import {
  Page, QuestionMarkTooltip, ComponentColor, InfluxColors, FlexBox,
  SlideToggle, ComponentSize
} from '@influxdata/clockface'
import CloudUpgradeButton from 'src/shared/components/CloudUpgradeButton'

// Constants
import {
  tipStyle, dtMonitorPage,
} from 'src/shared/constants/tips';

interface Props {
  title: string
  onChangeStatus3DScene: () => void
  show3DScene: boolean
}

interface State {
  payload: object
}

class DigitalTwinHeader extends PureComponent<Props, State> {
  constructor(props) {
    super(props);
  }

  public render() {
    const { title, show3DScene } = this.props

    return (
      <>
        <Page.Header fullWidth={true}>
          <Page.Title title={title} />
          <FlexBox margin={ComponentSize.Medium}>
            <h5>Show 3D Scene</h5>
            <SlideToggle
              active={show3DScene}
              size={ComponentSize.Small}
              color={ComponentColor.Success}
              onChange={this.props.onChangeStatus3DScene}
            />
            <QuestionMarkTooltip
              style={{ marginBottom: '8px' }}
              diameter={30}
              tooltipStyle={{ width: '400px' }}
              color={ComponentColor.Secondary}
              tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                <div style={{ color: InfluxColors.Star }}>{"About the Digital Twin Monitor Page:"}
                  <hr style={tipStyle} />
                </div>
                {dtMonitorPage}
              </div>}
            />
          </FlexBox>
          <CloudUpgradeButton />
        </Page.Header>
      </>
    )
  }
}

export default DigitalTwinHeader;