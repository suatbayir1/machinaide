import React, { PureComponent } from 'react'
import {Panel, ComponentSize, DapperScrollbars, Grid, Columns, InfluxColors, Icon, IconFont} from '@influxdata/clockface'
import InnerHTML from 'dangerously-set-html-content'
//import "./ReportWrapper.scss"

interface Props {
    html: string
    path: string
}

interface State {

}
class ReportWrapper extends PureComponent<Props, State>{
    render(){
        return(
        <Panel>
            <Panel.Header size={ComponentSize.Medium}>
                <p className="preview-data-margins">Model's Report</p>
            </Panel.Header>
            <Panel.Body size={ComponentSize.Medium}>
                <Grid.Row>
                    <Grid.Column widthXS={Columns.Two}>
                        <Icon key="i1" glyph={IconFont.EyeOpen} style={{ color: InfluxColors.Pool, marginRight: "5px" }} />
                        <a href={this.props.path} target="_blank">View report in a new tab</a>
                    </Grid.Column>
                    <Grid.Column widthXS={Columns.Two}>
                        <Icon key="i1" glyph={IconFont.Download} style={{ color: InfluxColors.Pool, marginRight: "5px" }} />
                        <a href={this.props.path} download>Download report</a>
                    </Grid.Column>
                </Grid.Row>
                <br/>
                <DapperScrollbars
                      autoHide={false}
                      autoSizeHeight={true} style={{ maxHeight: '450px' }}
                      className="data-loading--scroll-content"
                >
                    <InnerHTML html={this.props.html} />
                </DapperScrollbars>
                                
            </Panel.Body>
        </Panel>)
    }
}

export default ReportWrapper