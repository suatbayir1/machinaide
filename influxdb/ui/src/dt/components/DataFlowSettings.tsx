// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'

// Components
import AddDataFlowSetting from 'src/dt/components/AddDataFlowSetting';
import {
    Panel, ComponentSize, Form, Grid,
    DapperScrollbars, Table, BorderType, FlexBox, IconFont, Button,
    ComponentColor, ConfirmationButton, Appearance, ButtonType,
} from '@influxdata/clockface'

// Services
import DTService from 'src/shared/services/DTService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    deleteDataFlowSettingSuccessfully,
} from 'src/shared/copy/notifications'

interface OwnProps { }
interface State {
    visibleAddDataFlowSetting: boolean
    dataFlowSettings: object[]
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class DataFlowSettings extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            visibleAddDataFlowSetting: false,
            dataFlowSettings: [],
        }
    }

    componentDidMount = async () => {
        await this.getDataFlowSettings();
    }

    getDataFlowSettings = async () => {
        const result = await DTService.getAllDT();
        const dataFlowSettings = [];

        result.map(factory => {
            factory?.productionLines.map(pl => {
                pl?.machines.map(machine => {
                    machine?.contents.map(component => {
                        if (component?.["@type"] === "Relationship") {
                            dataFlowSettings.push(component);
                        }
                    })
                })
            })
        })

        this.setState({ dataFlowSettings });
    }

    removeRelationship = async (item) => {
        const { notify } = this.props;

        const payload = {
            "name": item["name"]
        };

        const result = await DTService.removeRelationship(payload);

        if (result.data.summary.code === 200) {
            notify(deleteDataFlowSettingSuccessfully());
            this.getDataFlowSettings();
        }
    }

    handleCloseAddDataFLowSetting = () => {
        this.setState({ visibleAddDataFlowSetting: false })
    }

    public render() {
        const { visibleAddDataFlowSetting, dataFlowSettings } = this.state;

        return (
            <>
                <Panel>
                    <Panel.Header size={ComponentSize.ExtraSmall}>
                        <Form>
                            <Grid>
                                <Grid.Row>
                                    <div className="tabbed-page--header-right">
                                        <Button
                                            text="Add"
                                            size={ComponentSize.Small}
                                            icon={IconFont.Plus}
                                            color={ComponentColor.Primary}
                                            type={ButtonType.Submit}
                                            onClick={() => { this.setState({ visibleAddDataFlowSetting: true }) }}
                                        />
                                    </div>
                                </Grid.Row>


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
                                                    <Table.HeaderCell style={{ width: "150px" }}>Source</Table.HeaderCell>
                                                    <Table.HeaderCell style={{ width: "150px" }}>Target</Table.HeaderCell>
                                                    <Table.HeaderCell style={{ width: "20px" }}></Table.HeaderCell>
                                                </Table.Row>
                                            </Table.Header>
                                            <Table.Body>
                                                {
                                                    dataFlowSettings.map((row, idx) => {
                                                        return (
                                                            <Table.Row key={idx}>
                                                                <Table.Cell>{row["source"]}</Table.Cell>
                                                                <Table.Cell>{row["target"]}</Table.Cell>
                                                                <Table.Cell>
                                                                    <FlexBox margin={ComponentSize.Medium} >
                                                                        <ConfirmationButton
                                                                            icon={IconFont.Remove}
                                                                            onConfirm={() => { this.removeRelationship(row) }}
                                                                            text={""}
                                                                            size={ComponentSize.ExtraSmall}
                                                                            popoverColor={ComponentColor.Danger}
                                                                            popoverAppearance={Appearance.Outline}
                                                                            color={ComponentColor.Danger}
                                                                            confirmationLabel="Do you want to delete ?"
                                                                            confirmationButtonColor={ComponentColor.Danger}
                                                                            confirmationButtonText="Yes"
                                                                        />
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
                        </Form>
                    </Panel.Header>
                </Panel>

                <AddDataFlowSetting
                    visibleAddDataFlowSetting={visibleAddDataFlowSetting}
                    handleCloseAddDataFLowSetting={this.handleCloseAddDataFLowSetting}
                    getDataFlowSettings={this.getDataFlowSettings}
                />
            </>
        )
    }
}


const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(DataFlowSettings);