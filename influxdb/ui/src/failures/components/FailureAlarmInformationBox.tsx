import React, { PureComponent, createRef } from 'react'
import {
    Form, Grid, Columns, InfluxColors, Button, ButtonType, IconFont,
    Panel, FlexBox, Label, ComponentSize, DateRangePicker,
    QuestionMarkTooltip, ComponentColor, PopoverInteraction,
    DapperScrollbars, Popover, Appearance, PopoverPosition,
} from '@influxdata/clockface'

interface Props {
    selectedObject: string
    failures: object[]
    objects: object
    currentMachine: object
    handleOpenStartEndDateRange: (type) => void
    handleChangeStartEndTimeRange: (e) => void
    startEndTimeRangeOpen: boolean
    startEndTimeRange: object
}

interface State {
    foundPart: string
    foundPartFailures: object[]
    failureDistribution: object
}

class FailureAlarmInformationBox extends PureComponent<Props, State> {
    private startDateTimeRangeRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props);

        this.state = {
            foundPart: "",
            foundPartFailures: [],
            failureDistribution: {
                acceptable: 0,
                major: 0,
                critical: 0,
            },
        }
    }

    componentDidMount() {
        this.calculateFailureDistribution();
    }

    componentDidUpdate(prevProps) {
        const { selectedObject, failures, startEndTimeRange, currentMachine } = this.props;

        if (prevProps.selectedObject !== selectedObject) {
            this.findPartByObject();
        }

        if (prevProps.failures !== failures || prevProps.startEndTimeRange !== startEndTimeRange || prevProps.currentMachine !== currentMachine) {
            this.calculateFailureDistribution();
            this.findPartByObject();
        }
    }

    calculateFailureDistribution = () => {
        const { failures, currentMachine } = this.props;
        let splitted;
        let acceptable = 0;
        let major = 0;
        let critical = 0;

        failures.map(failure => {
            splitted = failure["sourceName"].split(".");

            if (splitted[0] === currentMachine["name"]) {
                switch (failure["severity"]) {
                    case "acceptable":
                        acceptable += 1;
                        break;
                    case "major":
                        major += 1;
                        break;
                    case "critical":
                        critical += 1;
                        break;
                }
            }
        })

        this.setState({
            failureDistribution: { acceptable, major, critical }
        })
    }

    dateFormat = (dayDifference) => {
        let dateOffset = (24 * 60 * 60 * 1000) * dayDifference;
        let now = new Date().getTime() - dateOffset;
        let nowDate = new Date(now);
        let options = { year: 'numeric', month: 'long', day: 'numeric' };

        return nowDate.toLocaleDateString("en-US", options);
    }

    findPartByObject = () => {
        const { objects, selectedObject } = this.props;
        let foundPart;

        objects[0]["machines"].forEach(machine => {
            machine["contents"].forEach(component => {
                if (component["@type"] === "Component") {
                    if (component["visual"] !== undefined) {
                        component["visual"].forEach(async visual => {
                            if (visual["name"] === selectedObject) {
                                foundPart = `${machine["name"]}.${component["name"]}`;
                                return;
                            }
                        })
                    }

                    component["sensors"].forEach(async sensor => {
                        if (sensor["visual"] !== undefined) {
                            if (sensor["visual"]["name"] === selectedObject) {
                                foundPart = `${machine["name"]}.${component["name"]}.${sensor["name"]}`;
                                return;
                            }
                        }
                    })
                }
            })
        })

        this.setState({ foundPart }, () => { this.mapFailuresByFoundPart() });
    }

    mapFailuresByFoundPart = () => {
        const { failures } = this.props;
        const { foundPart } = this.state;

        let foundPartFailures = failures.filter(f => f["sourceName"] === foundPart);

        foundPartFailures.sort((a, b) => {
            return new Date(b["startTime"]).getTime() - new Date(a["startTime"]).getTime()
        })

        this.setState({ foundPartFailures });
    }

    getLabelColor = (level) => {
        let color;

        switch (level) {
            case "acceptable":
                color = InfluxColors.Sapphire;
                break;
            case "major":
                color = InfluxColors.Tiger;
                break;
            case "critical":
                color = InfluxColors.Fire;
                break;
        }

        return {
            color: 'white',
            margin: '5px 0px',
            borderRadius: '15px',
            backgroundColor: color
        }

    }

    getFailureDisplayFormat = (failure) => {
        return `${String(failure["description"]).substring(0, 20)}`;
    }

    getDayDifference = (startTime) => {
        const date1 = new Date(startTime).getTime();
        const date2 = new Date().getTime();
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const dayOrDays = diffDays > 1 ? "days" : "day";

        return `${diffDays} ${dayOrDays} ago`;
    }

    public render() {
        const { currentMachine, startEndTimeRangeOpen, startEndTimeRange } = this.props;
        const { foundPart, foundPartFailures, failureDistribution } = this.state;

        return (
            <>
                <Panel>
                    <Panel.Header size={ComponentSize.ExtraSmall}>
                        <Grid>
                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <Form.Element label="Start Time">
                                        <Popover
                                            appearance={Appearance.Outline}
                                            position={PopoverPosition.Below}
                                            triggerRef={this.startDateTimeRangeRef}
                                            visible={startEndTimeRangeOpen}
                                            showEvent={PopoverInteraction.None}
                                            hideEvent={PopoverInteraction.None}
                                            distanceFromTrigger={8}
                                            testID="timerange-popover"
                                            enableDefaultStyles={false}
                                            contents={() => (
                                                <DateRangePicker
                                                    timeRange={startEndTimeRange}
                                                    onSetTimeRange={(e) => { this.props.handleChangeStartEndTimeRange(e) }}
                                                    onClose={() => { this.props.handleOpenStartEndDateRange(false) }}
                                                    position={
                                                        { position: 'relative' }
                                                    }
                                                />
                                            )}
                                        />
                                        <Button
                                            ref={this.startDateTimeRangeRef}
                                            text={
                                                `
                                            ${new Date(startEndTimeRange["lower"]).toISOString().slice(0, 10)} | 
                                            ${new Date(startEndTimeRange["upper"]).toISOString().slice(0, 10)}
                                            `
                                            }
                                            onClick={() => { this.props.handleOpenStartEndDateRange(true) }}
                                            type={ButtonType.Button}
                                            icon={IconFont.Calendar}
                                            color={ComponentColor.Default}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                            </Grid.Row>

                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <Form.Element label="Selected Machine">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={currentMachine["name"]}
                                            description="Selected Digital Twin"
                                            color={InfluxColors.Graphite}
                                            id={"currentMachine"}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                            </Grid.Row>

                            <Grid.Row>
                                <Grid.Column widthXS={Columns.Four}>
                                    <Form.Element label="Acceptable">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={failureDistribution["acceptable"]}
                                            description="Machine Count"
                                            color={InfluxColors.Sapphire}
                                            id={"75"}
                                        />
                                    </Form.Element>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Four}>
                                    <Form.Element label="Major">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={failureDistribution["major"]}
                                            description="Machine Count"
                                            color={InfluxColors.Tiger}
                                            style={{ color: 'white' }}
                                            id={"75"}
                                        />
                                    </Form.Element>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Four}>
                                    <Form.Element label="Critical">
                                        <Label
                                            size={ComponentSize.Small}
                                            name={failureDistribution["critical"]}
                                            description="Machine Count"
                                            color={InfluxColors.Fire}
                                            id={"75"}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Panel.Header>
                </Panel>

                {
                    foundPart !== undefined &&
                    <Panel style={{ marginTop: '50px' }}>
                        <Panel.Header size={ComponentSize.ExtraSmall}>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Form.Element label="Selected Part">
                                            <Label
                                                size={ComponentSize.Small}
                                                name={foundPart}
                                                description="Factory Name"
                                                color={InfluxColors.Graphite}
                                                id={"Press030"}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>


                                < Grid.Row >
                                    <p style={{ marginBottom: '4px', padding: '0px 20px', fontSize: '13px', color: '#999dab', fontWeight: 500 }}>Failures</p>
                                    <DapperScrollbars
                                        autoHide={false}
                                        autoSizeHeight={true}
                                        style={{ maxHeight: '210px' }}
                                        className="data-loading--scroll-content"
                                    >
                                        {
                                            foundPartFailures.length > 0 ? foundPartFailures.map((failure, idx) =>
                                                <Grid.Column widthXS={Columns.Twelve} key={idx}>
                                                    <FlexBox
                                                        margin={ComponentSize.Medium}
                                                        style={this.getLabelColor(failure["severity"])}
                                                    >
                                                        <p style={{ padding: '10px 12px', fontSize: '13px' }}>
                                                            {String(failure["description"]).substring(0, 25)}...
                                                        </p>

                                                        <div className="tabbed-page--header-right">
                                                            <p style={{ fontSize: '13px' }}>
                                                                {this.getDayDifference(failure["startTime"])}
                                                            </p>

                                                            <QuestionMarkTooltip
                                                                diameter={18}
                                                                color={ComponentColor.Secondary}
                                                                tooltipContents={failure["description"]}
                                                                style={{ marginRight: '12px' }}
                                                            />
                                                        </div>
                                                    </FlexBox>
                                                </Grid.Column>
                                            ) : (
                                                <p style={{ padding: '10px 12px', fontSize: '13px' }}>
                                                    No failure records were found between the selected dates
                                                </p>
                                            )
                                        }
                                    </DapperScrollbars>
                                </Grid.Row>

                            </Grid>
                        </Panel.Header>
                    </Panel>
                }
            </>
        )
    }
}

export default FailureAlarmInformationBox;