import React, { PureComponent } from 'react'
import { Overlay, Grid,
    ButtonType, Button, ComponentColor, Columns, SelectDropdown,
    InfluxColors, ComponentSize, Label, Input, MultiSelectDropdown,
    InputType,
    DapperScrollbars, AlignItems, InputToggleType,} from '@influxdata/clockface'
import {ANOMALY_DETECTION_TASK, RUL_TASK, 
        RULREG_TASK, POF_TASK} from '../constants'
import uuid from 'uuid'

// Services
import DTService from 'src/shared/services/DTService';


interface Props {
    handleChangeNotification: (type: string, message: string) => void
    username: string
    mlReportOverlay: boolean
    closeOverlay: () => void
    parentParams: object
}

interface State {
}

class MLReportOverlay extends PureComponent<Props, State>{
    state = {
    }

    componentDidMount() {
      console.log("generate report")
    }

    public render(){
        return(
            <Overlay visible={this.props.mlReportOverlay}>
                <Overlay.Container maxWidth={800}>
                  <Overlay.Header
                    title="ML Models Report"
                    onDismiss={this.props.closeOverlay}
                  />
                  <Overlay.Body>
                    <Grid>
                      <Grid.Row> {/* style={{marginBottom: "10px"}} */}
                        <Grid.Column widthXS={Columns.Two} /* style={{ margin: "7px" }} */>
                          ML Results Report
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Ten} /* style={{ margin: "7px" }} */>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Overlay.Body>
                  <Overlay.Footer>
                    <Grid>
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Six}>
                          <div className="tabbed-page--header-left">
                            <Button
                              color={ComponentColor.Primary}
                              titleText=""
                              text="Button"
                              type={ButtonType.Submit}
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Six}>
                          <div className="tabbed-page--header-right">
                            <Button
                              color={ComponentColor.Secondary}
                              titleText=""
                              text="Button"
                              type={ButtonType.Submit}
                            />
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Overlay.Footer>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default MLReportOverlay