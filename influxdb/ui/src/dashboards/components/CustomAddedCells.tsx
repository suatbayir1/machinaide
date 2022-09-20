// Libraries
import React, { Component } from 'react'
import uuid from "uuid"

// Components
import {
    Grid,
    Columns,
} from '@influxdata/clockface'

interface Props {
    manualRefresh: number
}

interface State {
    boxList: object[]
}

class CustomAddedCells extends Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            boxList: [
                { text: "Total Alerts", value: 10 },
                { text: "Total Maintenance", value: 20 },
                { text: "Total Failures", value: 30 },
                { text: "Total Machine Actions", value: 40 },
                { text: "Total Machine Actions", value: 50 },
                { text: "Total Machine Actions", value: 60 },
            ]
        }
    }

    render() {
        const { boxList } = this.state;

        return (
            <Grid.Row>
                {
                    boxList.map(box => {
                        return (
                            <Grid.Column
                                key={uuid.v4()}
                                widthXS={Columns.Six}
                                widthSM={Columns.Four}
                                widthMD={Columns.Four}
                                widthLG={Columns.Two}
                                className={"dashboard-box-column"}
                            >
                                <div className="dashboard-cell-wrapper">
                                    <h4>{box["text"]}</h4>
                                    <h4>{box["value"]}</h4>
                                </div>
                            </Grid.Column>
                        )
                    })
                }
            </Grid.Row>
        )
    }
}

export default CustomAddedCells;