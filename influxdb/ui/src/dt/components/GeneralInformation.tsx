// Libraries
import React, { PureComponent } from "react";
import i18next from "i18next";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    FlexBox, SlideToggle, ComponentColor, QuestionMarkTooltip,
} from '@influxdata/clockface'

// Constants
import {
    tipStyle, showAllSensorValues,
} from 'src/shared/constants/tips';

type Props = {
    info: object
    showAllSensorValues: boolean
    changeShowAllSensorValues: () => void
}

type State = {}

class GeneralInformation extends PureComponent<Props, State> {
    public render() {
        const { info } = this.props;

        return (
            <Grid>
                <Grid.Row>
                    <Grid.Column
                        widthXS={Columns.Six}
                        widthSM={Columns.Three}
                        widthMD={Columns.Six}
                        widthLG={Columns.Twelve}
                    >
                        <Form.Element label={i18next.t('dt.factory')}>
                            <Label
                                size={ComponentSize.Small}
                                name={info["factory"]}
                                description={i18next.t('dt.factory')}
                                color={InfluxColors.Viridian}
                                id={info["factoryName"]}
                            />
                        </Form.Element>
                    </Grid.Column>
                    <Grid.Column
                        widthXS={Columns.Six}
                        widthSM={Columns.Three}
                        widthMD={Columns.Six}
                        widthLG={Columns.Four}
                    >
                        <Form.Element label={i18next.t('dt.machine_count')}>
                            <Label
                                size={ComponentSize.Small}
                                name={info["machineCount"]}
                                description={i18next.t('dt.machine_count')}
                                color={InfluxColors.Viridian}
                                id={info["machineCount"]}
                            />
                        </Form.Element>
                    </Grid.Column>
                    <Grid.Column
                        widthXS={Columns.Six}
                        widthSM={Columns.Three}
                        widthMD={Columns.Six}
                        widthLG={Columns.Four}
                    >
                        <Form.Element label={i18next.t('dt.component_count')}>
                            <Label
                                size={ComponentSize.Small}
                                name={info["componentCount"]}
                                description={i18next.t('dt.component_count')}
                                color={InfluxColors.Viridian}
                                id={info["componentCount"]}
                            />
                        </Form.Element>
                    </Grid.Column>
                    <Grid.Column
                        widthXS={Columns.Six}
                        widthSM={Columns.Three}
                        widthMD={Columns.Six}
                        widthLG={Columns.Four}
                    >
                        <Form.Element label={i18next.t('dt.sensor_count')}>
                            <Label
                                size={ComponentSize.Small}
                                name={info["sensorCount"]}
                                description={i18next.t('dt.sensor_count')}
                                color={InfluxColors.Viridian}
                                id={info["sensorCount"]}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row>
                    <div
                        style={{
                            marginTop: '10px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            display: 'flex',
                        }}
                    >
                        <FlexBox
                            margin={ComponentSize.Large}
                        >
                            <h5>{i18next.t('dt.show_all_sensor_values')}</h5>
                            <SlideToggle
                                active={this.props.showAllSensorValues}
                                size={ComponentSize.Small}
                                color={ComponentColor.Success}
                                onChange={this.props.changeShowAllSensorValues}
                            />
                            <QuestionMarkTooltip
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"Show all sensor values:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {showAllSensorValues}
                                </div>}
                            />
                        </FlexBox>
                    </div>
                </Grid.Row>
            </Grid>
        )
    }
}

export default GeneralInformation;