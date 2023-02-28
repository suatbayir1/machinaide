// Libraries
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from 'react-redux'

// Actions
import { setOverlayStatus } from 'src/dt/actions/dtActions';

// Components
import {
    Overlay, ComponentSize, EmptyState, FlexBox, Button, ButtonType, ComponentColor,
    IconFont, DapperScrollbars,
} from '@influxdata/clockface'


interface OwnProps {
}

interface State {
    showErrors: boolean
    errors: string[]
    istatistic: object
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = ReduxProps & OwnProps;


class ShowDataSourceInformation extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = {
            showErrors: false,
            errors: [],
            istatistic: {
                "bucketSet": 0,
                "bucketNotSet": 0,
                "measurementSet": 0,
                "measurementNotSet": 0,
                "fieldSet": 0,
                "fieldNotSet": 0,
            }
        }
    }

    public componentDidMount(): void {
        const { dt } = this.props;
        const errors = [];
        let istatistic = {
            "bucketSet": 0,
            "bucketNotSet": 0,
            "measurementSet": 0,
            "measurementNotSet": 0,
            "fieldSet": 0,
            "fieldNotSet": 0,
        }

        if (dt.bucket == null || dt.bucket == undefined || dt.bucket.trim() == "") {
            errors.push(`Bucket Not Set: ${dt.name}`);
            istatistic["bucketNotSet"] += 1;
        } else {
            istatistic["bucketSet"] += 1;
        }

        dt.productionLines.forEach(pl => {
            pl.machines.forEach(machine => {
                if (machine.measurements == null || machine.measurements == undefined || machine.measurements.length == 0) {
                    errors.push(`Measurement Not Set: ${machine.name}`);
                    istatistic["measurementNotSet"] += 1;
                } else {
                    istatistic["measurementSet"] += 1;
                }

                machine.contents.forEach(comp => {
                    if (comp["@type"] == "Component") {
                        comp.sensors.forEach(sensor => {
                            sensor.fields.forEach(field => {
                                if (field.measurement == null || field.measurement == undefined || field.measurement.length == 0 ||
                                    field.dataSource == null || field.dataSource == undefined || field.dataSource.length == 0) {
                                    errors.push(`Measurement and Field Not Set: ${field.name}`);
                                    istatistic["fieldNotSet"] += 1;
                                } else {
                                    istatistic["fieldSet"] += 1;
                                }
                            })
                        })
                    }
                })
            })
        });

        this.setState({ istatistic, errors });
    }

    render() {
        const { dt } = this.props;
        const { showErrors, errors, istatistic } = this.state;

        console.log(errors);

        return (
            <Overlay.Container maxWidth={600}>
                <Overlay.Header
                    title="Report of Data Source Configuration"
                    onDismiss={() => { this.props.setOverlayStatus(null) }}
                />
                <Overlay.Body>

                    {
                        Object.keys(dt).length > 0 ?
                            <React.Fragment>
                                <FlexBox margin={ComponentSize.Large}>
                                    <h6 style={{ paddingBottom: '0px', marginBottom: '0px' }}>
                                        <span style={{ color: 'blue' }}> Bucket </span>
                                        Set Count: {istatistic["bucketSet"]}
                                    </h6>

                                    <h6 style={{ paddingBottom: '0px', marginBottom: '0px' }}>
                                        <span style={{ color: 'blue' }}> Bucket </span>
                                        Not Set Count: {istatistic["bucketNotSet"]}
                                    </h6>
                                </FlexBox>
                                <FlexBox margin={ComponentSize.Large}>
                                    <h6 style={{ paddingBottom: '0px', marginBottom: '0px' }}>
                                        <span style={{ color: 'red' }}> Measurement </span>
                                        Set Count: {istatistic["measurementSet"]}
                                    </h6>

                                    <h6 style={{ paddingBottom: '0px', marginBottom: '0px' }}>
                                        <span style={{ color: 'red' }}> Measurement </span>
                                        Not Set Count: {istatistic["measurementNotSet"]}
                                    </h6>
                                </FlexBox>
                                <FlexBox margin={ComponentSize.Large}>
                                    <h6 style={{ paddingBottom: '0px', marginBottom: '0px' }}>
                                        <span style={{ color: 'yellow' }}> Field </span>
                                        Set Count: {istatistic["fieldSet"]}
                                    </h6>

                                    <h6 style={{ paddingBottom: '0px', marginBottom: '0px' }}>
                                        <span style={{ color: 'yellow' }}> Field </span>
                                        Not Set Count: {istatistic["fieldNotSet"]}
                                    </h6>
                                </FlexBox>
                                <Button
                                    style={{ marginLeft: '80%' }}
                                    icon={showErrors ? IconFont.CaretUp : IconFont.CaretDown}
                                    color={showErrors ? ComponentColor.Danger : ComponentColor.Success}
                                    text={showErrors ? "Close Detail" : "Open Detail"}
                                    size={ComponentSize.Small}
                                    type={ButtonType.Button}
                                    onClick={() => { this.setState({ showErrors: !showErrors }) }}
                                />

                                {
                                    errors.length > 0 ?
                                        <DapperScrollbars
                                            autoHide={false}
                                            autoSizeHeight={true}
                                            style={{ maxHeight: '300px' }}
                                            className="data-loading--scroll-content"
                                        >
                                            {
                                                showErrors && errors.map((error, idx) => (
                                                    <p key={idx} style={{ fontSize: '14px', color: `red`, padding: '0px', margin: '0px' }}>{error}</p>
                                                ))
                                            }
                                        </DapperScrollbars>
                                        :
                                        <>
                                            {
                                                showErrors && <EmptyState size={ComponentSize.Medium}>
                                                    <EmptyState.Text>
                                                        <b style={{ color: `green` }}>Data source matches are all set</b>
                                                    </EmptyState.Text>
                                                </EmptyState>
                                            }
                                        </>
                                }
                            </React.Fragment>
                            :
                            <EmptyState size={ComponentSize.Medium}>
                                <EmptyState.Text>
                                    <b>Digital Twin information not found</b>
                                </EmptyState.Text>
                            </EmptyState>
                    }

                </Overlay.Body>
            </Overlay.Container>
        )
    }
}


const mstp = (state) => {
    return {
        dt: state.dtReducer.dt
    };
};

const mdtp = (dispatch) => {
    return {
        setOverlayStatus: (overlayID) => dispatch(setOverlayStatus(overlayID)),
    };
};

const connector = connect(mstp, mdtp)

export default connector(ShowDataSourceInformation);