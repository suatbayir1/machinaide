import React, { PureComponent } from 'react'
import { Overlay, Grid,
    ButtonType, Button, ComponentColor, Columns} from '@influxdata/clockface'

interface Props {
    rulFeedbackOverlay: boolean
    closeFeedbackOverlay: ()=>void
    prediction: object
}

interface State {
    
}

class RULFeedbackOverlay extends PureComponent<Props, State>{
    state = {

    }

    public render(){
        return(
            <Overlay visible={this.props.rulFeedbackOverlay}>
                <Overlay.Container maxWidth={600}>
                  <Overlay.Header
                    title="Remaining Useful Lifetime Prediction"
                    onDismiss={this.props.closeFeedbackOverlay}
                  />
                  <Overlay.Body>
                    <Grid>
                      <Grid.Row style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }}>
                        <Grid.Column widthXS={Columns.Four} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">
                            Log Date: {this.props.prediction ? this.props.prediction["logDate"] : "-"}
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.One}>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Four} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">
                            Prediction: {this.props.prediction ? this.props.prediction["result"] : "-"}
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                      <br />
                      <Grid.Row style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }}>
                        <Grid.Column widthXS={Columns.Four} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">
                            Feedback: "-"
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                      <br />
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Twelve} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">
                            Send Feedback. Prediction is:
                            <Button
                              color={ComponentColor.Success}
                              titleText="Learn more about alerting"
                              text="Correct"
                              type={ButtonType.Submit}
                              onClick={() => console.log("click action")}
                              style={{ marginLeft: "10px", marginRight: "10px" }}
                            />
                            <Button
                              color={ComponentColor.Danger}
                              titleText="Learn more about alerting"
                              text="Incorrect"
                              type={ButtonType.Submit}
                              onClick={() => console.log("- click action")}
                            />
                          </div>
                        </Grid.Column>
                      </Grid.Row>
                      <br />
                      <Grid.Row>
                        <Grid.Column widthXS={Columns.Two} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">

                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Two} style={{ margin: "7px" }}>
                          <div className="tabbed-page--header-left">

                          </div>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default RULFeedbackOverlay