// Libraries
import React, { PureComponent } from "react";

// Components
import {
    Form, Button, ComponentSize, Panel, Table, BorderType,
    Overlay, IconFont, Grid, DapperScrollbars, FlexBox,
    ComponentColor, ButtonType,
} from '@influxdata/clockface'

interface Props {
    visibleCreatedReportsList: boolean
    handleCloseCreatedReportsList: () => void
    createdReportsData: object[]
    selectedReport: object
}

interface State { }

class CreatedReportsListOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    getCreatedDate = (item) => {
        const name_splitted = item.split("_");
        const time_splitted = name_splitted[3].split(".");
        const date = new Date(Number(time_splitted[0]))

        return `${date.toDateString()}, ${date.toLocaleTimeString()}`;
    }

    getFileUrl = (item) => {
        const { createdReportsData } = this.props;

        console.log(createdReportsData);
        console.log(item);

        return `${createdReportsData["root_path"]}/${item}`;
    }

    redirectReportView = (report) => {
        const { selectedReport, history } = this.props;
        console.log(report);
        console.log(selectedReport);

        console.log(this.props);
        history.push(`report-view/${selectedReport?.["_id"]?.["$oid"]}`);
    }

    render() {
        const { visibleCreatedReportsList, handleCloseCreatedReportsList, createdReportsData, selectedReport } = this.props;

        return (
            <Overlay visible={visibleCreatedReportsList}>
                <Overlay.Container maxWidth={500}>
                    <Overlay.Header
                        title={selectedReport["ReportConfig"]?.title}
                        onDismiss={handleCloseCreatedReportsList}
                    />

                    <Overlay.Body>
                        <Form>
                            {/* {
                                createdReportsData["files"]?.length > 0 && createdReportsData["files"].map(item => {
                                    return (
                                        <Grid.Column
                                            widthXS={Columns.Two}
                                            key={item}
                                        >
                                            <ResourceCard
                                                style={{ marginBottom: '20px', height: '150px' }}
                                            >
                                                <ResourceCard.Name name="" />
                                                <ResourceCard.Description description={this.getCreatedDate(item)} />
                                                <ResourceCard.Meta>
                                                    <Button
                                                        size={ComponentSize.Small}
                                                        icon={IconFont.Link}
                                                        text={"View"}
                                                        color={ComponentColor.Primary}
                                                        type={ButtonType.Submit}
                                                        onClick={() => { }}
                                                    />
                                                    <a href={this.getFileUrl(item)} download>
                                                        Download
                                                    </a>
                                                </ResourceCard.Meta>
                                            </ResourceCard>
                                        </Grid.Column>
                                    )
                                })
                            } */}

                            <Panel style={{ marginTop: '30px' }}>
                                <Panel.Header size={ComponentSize.ExtraSmall}>
                                    <Grid>
                                        <Grid.Row>
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true}
                                                style={{ maxHeight: '400px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                <Table
                                                    borders={BorderType.Vertical}
                                                    fontSize={ComponentSize.ExtraSmall}
                                                    cellPadding={ComponentSize.ExtraSmall}
                                                >
                                                    <Table.Header>
                                                        <Table.Row>
                                                            <Table.HeaderCell style={{ width: "300px" }}>Created at</Table.HeaderCell>
                                                            <Table.HeaderCell style={{ width: "100px" }}></Table.HeaderCell>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {
                                                            createdReportsData["files"]?.length > 0 && createdReportsData["files"].map(item => {
                                                                return (
                                                                    <Table.Row key={item}>
                                                                        <Table.Cell>{this.getCreatedDate(item)}</Table.Cell>
                                                                        <Table.Cell>
                                                                            <FlexBox margin={ComponentSize.Medium} >
                                                                                <Button
                                                                                    size={ComponentSize.ExtraSmall}
                                                                                    icon={IconFont.Link}
                                                                                    color={ComponentColor.Primary}
                                                                                    type={ButtonType.Submit}
                                                                                    onClick={() => { this.redirectReportView(item) }}
                                                                                />
                                                                                <a href={this.getFileUrl(item)} download>
                                                                                    <Button
                                                                                        size={ComponentSize.ExtraSmall}
                                                                                        type={ButtonType.Button}
                                                                                        icon={IconFont.Download}
                                                                                        color={ComponentColor.Success}
                                                                                    />
                                                                                </a>
                                                                            </FlexBox>
                                                                        </Table.Cell>
                                                                    </Table.Row>
                                                                )
                                                            })
                                                        }
                                                    </Table.Body>
                                                </Table>
                                            </DapperScrollbars>
                                        </Grid.Row>
                                    </Grid>
                                </Panel.Header>
                            </Panel>
                        </Form>
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default CreatedReportsListOverlay;