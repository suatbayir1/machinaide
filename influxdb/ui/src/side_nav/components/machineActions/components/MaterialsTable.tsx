// Libraries
import { RouteComponentProps } from 'react-router-dom'
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Button,
    ButtonType,
    ComponentColor,
    IconFont,
    Grid,
    Table,
    DapperScrollbars,
    BorderType,
    ComponentSize,
    FlexBox,
    ConfirmationButton,
    Appearance,
} from '@influxdata/clockface'

// Services
import FactoryService from 'src/shared/services/FactoryService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    materialDeletedSuccessfully,
    materialDeletedFailure,
} from 'src/shared/copy/notifications'

interface OwnProps {
    getMaterials: () => void
    materials: object[]
    materialRecordEdit: (editRow) => void
}

interface State {
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class MaterialsTable extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    removeMaterial = async (material) => {
        const payload = {
            "recordId": material["_id"]["$oid"]
        };

        const result = await FactoryService.deleteMaterial(payload);
        if (result.data.summary.code !== 200) {
            alert("error");
            this.props.notify(materialDeletedFailure());
            return;
        }
        this.props.getMaterials();
        this.props.notify(materialDeletedSuccessfully());
    }

    render() {
        const { materials } = this.props;

        return (
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
                                <Table.HeaderCell style={{ width: "200px" }}>Material Name</Table.HeaderCell>
                                <Table.HeaderCell style={{ width: "100px" }}>Thickness</Table.HeaderCell>
                                <Table.HeaderCell style={{ width: "100px" }}>Height</Table.HeaderCell>
                                <Table.HeaderCell style={{ width: "100px" }}>Width</Table.HeaderCell>
                                <Table.HeaderCell style={{ width: "200px" }}>Description</Table.HeaderCell>
                                <Table.HeaderCell style={{ width: "100px" }}></Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {
                                materials.map((row, index) => {
                                    return (
                                        <Table.Row key={index}>
                                            <Table.Cell>{row["materialName"]}</Table.Cell>
                                            <Table.Cell>{row["thickness"]}</Table.Cell>
                                            <Table.Cell>{row["height"]}</Table.Cell>
                                            <Table.Cell>{row["width"]}</Table.Cell>
                                            <Table.Cell>
                                                {String(row["materialDescription"]).substring(0, 50)}</Table.Cell>
                                            <Table.Cell>
                                                <FlexBox margin={ComponentSize.Medium} >
                                                    {
                                                        ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                                                        <Button
                                                            size={ComponentSize.ExtraSmall}
                                                            icon={IconFont.Pencil}
                                                            color={ComponentColor.Primary}
                                                            type={ButtonType.Submit}
                                                            onClick={() => { this.props.materialRecordEdit(row) }}
                                                        />
                                                    }
                                                    {
                                                        ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                                                        <ConfirmationButton
                                                            icon={IconFont.Remove}
                                                            onConfirm={() => { this.removeMaterial(row) }}
                                                            text={""}
                                                            size={ComponentSize.ExtraSmall}
                                                            popoverColor={ComponentColor.Danger}
                                                            popoverAppearance={Appearance.Outline}
                                                            color={ComponentColor.Danger}
                                                            confirmationLabel="Do you want to delete ?"
                                                            confirmationButtonColor={ComponentColor.Danger}
                                                            confirmationButtonText="Yes"
                                                        />
                                                    }
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
        );
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(MaterialsTable);