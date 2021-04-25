import React, { PureComponent } from "react";
import {
    Form,
    Overlay,
    Grid,
    Columns,
    ResourceCard,
} from '@influxdata/clockface'

import {
    AppState,
    AutoRefresh,
    AutoRefreshStatus,
    Dashboard,
    ResourceType,
    TimeRange,
} from 'src/types'

import Typography from '@material-ui/core/Typography';



interface Props {
    overlay: boolean
    onClose: () => void
    timeRange: TimeRange
    interval: number
    allCellData: object[]
}
interface State {
    data: object[]
    percentCellList: string[]
}

class SystemInfoBox extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            data: [
                {
                    title: 'Title 1',
                    content: 'content',
                    fields: {
                        field1: 'value1',
                        field2: 'value2',
                        field3: 'value3',
                    }
                },
                {
                    title: 'Title 2',
                    content: 'content',
                    fields: {
                        field1: 'value1',
                        field2: 'value2',
                    }
                },
                {
                    title: 'Title 3',
                    content: 'content',
                    fields: {
                        field1: 'value1',
                        field2: 'value2',
                        field3: 'value3',
                    }
                },
                {
                    title: 'Title 4',
                    content: 'content',
                    fields: {
                        field1: 'value1',
                        field2: 'value2',
                    }
                },
                {
                    title: 'Title 5',
                    content: 'content',
                    fields: {
                        field1: 'value1',
                        field2: 'value2',
                        field3: 'value3',
                    }
                },
                {
                    title: 'Title 6',
                    content: 'content',
                    fields: {
                        field1: 'value1',
                        field2: 'value2',
                    }
                },
            ],
            percentCellList: ["System Memory Usage", "CPU Usage", "System Load", "System CPU Usage"],
        };
    }

    componentDidUpdate() {
    }

    render() {
        const { percentCellList } = this.state;

        return (
            <Overlay visible={this.props.overlay}>
                <Overlay.Container maxWidth={1400}>
                    <Overlay.Header
                        title="System Information"
                        onDismiss={this.props.onClose}
                    />

                    <Overlay.Body>
                        <Form>
                            <p>
                                The Screen provides further information regarding the various metrics being measured and displayed regarding the Systems Health.
                                Each Section describes in textual detail the corressponding cell.
                                For further clarification, refer to the corressponding cell.
                            </p>

                            <p>
                                Period of Cell Updates: {this.props.interval / 1000} seconds <br></br>
                                TimeFrame being Compared: {this.props.timeRange.lower}
                            </p>


                            {
                                this.props.allCellData.map(item => {
                                    if (item["cellName"] === "File System Usage") {
                                        return (
                                            <Grid.Column
                                                widthXS={Columns.Three}
                                                key={item["cellName"]}
                                            >
                                                <ResourceCard
                                                    key={item["cellName"]}
                                                    style={{ marginTop: '20px', height: '250px' }}
                                                >
                                                    <ResourceCard.Name
                                                        name={item["cellName"]}
                                                    />

                                                    <div>
                                                        {
                                                            Object.keys(item["jsonData"]).map(key => {
                                                                return (
                                                                    <React.Fragment key={key}>
                                                                        <Typography key={"disk_used"} variant="body1" gutterBottom>
                                                                            Disk Percentage Used: {item["jsonData"][key].toFixed(2)} %
                                                                        </Typography>

                                                                        <Typography key={"disk_remaining"} variant="body1" gutterBottom>
                                                                            Disk Percent Remaining:  {(100 - item["jsonData"][key]).toFixed(2)} %
                                                                        </Typography>
                                                                    </React.Fragment>
                                                                )
                                                            })
                                                        }
                                                        {/* <Typography variant="body1" gutterBottom>
                                                            Disk Percent Remaining : 88.33
                                                        </Typography> */}
                                                        {/* <Typography variant="body1" gutterBottom>
                                                            Approx Time Till Full Usage:
                                                        </Typography> */}
                                                    </div>
                                                </ResourceCard>
                                            </Grid.Column>
                                        )
                                    } else {
                                        return (
                                            <Grid.Column
                                                widthXS={Columns.Three}
                                                key={item["cellName"]}
                                            >
                                                <ResourceCard
                                                    key={item["cellName"]}
                                                    style={{ marginTop: '20px', height: '250px' }}
                                                >
                                                    <ResourceCard.Name
                                                        name={item["cellName"]}
                                                        testID="dashboard-card--name"
                                                    />

                                                    {
                                                        Object.keys(item["jsonData"]).map(key => {
                                                            if (percentCellList.includes(item["cellName"])) {
                                                                return (
                                                                    <Typography key={key} variant="body1" gutterBottom>
                                                                        {key}: {item["jsonData"][key].toFixed(2)} %
                                                                    </Typography>
                                                                )
                                                            } else if (item["cellName"] === "Total Memory") {
                                                                return (
                                                                    <Typography key={key} variant="body1" gutterBottom>
                                                                        {key}: { Math.round(item["jsonData"][key])} GB
                                                                    </Typography>
                                                                )
                                                            }
                                                        })
                                                    }

                                                </ResourceCard>
                                            </Grid.Column>
                                        )
                                    }
                                })
                            }
                        </Form>

                        <Form.Footer>
                        </Form.Footer>
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default SystemInfoBox;