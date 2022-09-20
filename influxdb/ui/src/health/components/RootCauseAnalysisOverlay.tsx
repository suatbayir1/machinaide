import React, { PureComponent } from 'react'
import { Overlay, Grid,
    ButtonType, Button, ComponentColor, Columns, SelectDropdown,
    InfluxColors, ComponentSize, Label} from '@influxdata/clockface'

interface Props {
    createModelOverlay: boolean
    closeOverlay: ()=>void
    failure: object
}

interface State {

}

class RootCauseAnalysisOverlay extends PureComponent<Props, State>{
    state = {
    }

    componentDidMount(): void {
        console.log(this.props)
    }

    public render(){
        return(
            <Overlay visible={this.props.createModelOverlay}>
                <Overlay.Container maxWidth={800}>
                  <Overlay.Header
                    title="Root Cause Analysis"
                    onDismiss={this.props.closeOverlay}
                  />
                  <Overlay.Body>
                    <Grid>
                      <Grid.Row /* style={{ borderTop: 'solid 1px', borderBottom: 'solid 1px' }} */ style={{marginBottom: "10px"}}>
                        <Grid.Column widthXS={Columns.Two} /* style={{ margin: "7px" }} */>
                          <div className="tabbed-page--header-left">
                            <Label
                                size={ComponentSize.Small}
                                name={"Root cause analysis"}
                                description={""}
                                color={InfluxColors.Castle}
                                id={"icon-label"} 
                            />
                          </div>
                        </Grid.Column>
                        <Grid.Column widthXS={Columns.Ten} /* style={{ margin: "7px" }} */>
                        </Grid.Column>
                      </Grid.Row>                      
                    </Grid>
                  </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default RootCauseAnalysisOverlay