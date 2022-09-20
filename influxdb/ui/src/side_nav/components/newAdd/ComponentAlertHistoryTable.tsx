import React, { PureComponent } from "react";
import {
    Page,
    Grid,
    IconFont,
    ComponentColor,
    ComponentSize,
    Button,
    ButtonType,
    Table,
    DapperScrollbars,
    BorderType,
} from '@influxdata/clockface'

interface Props { }
interface State { }

class ComponentAlertHistoryTable extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <Page>
                <Page.Header fullWidth={true}>
                    <Page.Title title={"Failures"} />
                </Page.Header>


                <Page.Contents fullWidth={true}>
                    <Grid>
                        <Grid.Row>
                            <DapperScrollbars
                                autoHide={false}
                                autoSizeHeight={true}
                                style={{ maxHeight: '150px' }}
                                className="data-loading--scroll-content"
                            >
                                <Table
                                    borders={BorderType.Vertical}
                                    fontSize={ComponentSize.ExtraSmall}
                                    cellPadding={ComponentSize.ExtraSmall}
                                >
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>Name</Table.HeaderCell>
                                            <Table.HeaderCell>Description</Table.HeaderCell>
                                            <Table.HeaderCell></Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        <Table.Row key={1}>
                                            <Table.Cell>a</Table.Cell>
                                            <Table.Cell>B</Table.Cell>
                                            <Table.Cell>
                                                <Button
                                                    size={ComponentSize.ExtraSmall}
                                                    icon={IconFont.Remove}
                                                    color={ComponentColor.Danger}
                                                    type={ButtonType.Submit}
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.Body>
                                </Table>
                            </DapperScrollbars>
                        </Grid.Row>
                    </Grid>
                </Page.Contents>
            </Page>
        )
    }
}

export default ComponentAlertHistoryTable;