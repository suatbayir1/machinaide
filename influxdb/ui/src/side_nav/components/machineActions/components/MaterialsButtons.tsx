// Libraries
import { RouteComponentProps } from 'react-router-dom'
import React, { PureComponent, createRef } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Button,
    ButtonType,
    ComponentColor,
    IconFont,
    Grid,
    ComponentSize,
    FlexBox,
    Appearance,
    PopoverPosition,
    PopoverInteraction,
    Popover,
} from '@influxdata/clockface'
import ExportFile from 'src/shared/components/ExportFile';
import ImportMaterialFile from 'src/side_nav/components/machineActions/components/ImportMaterialFile'

// Services

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants


interface OwnProps {
    handleOpenAddMaterial: () => void
    materials: object[]
    orgID: string
    getMaterials: () => void
}

interface State {
    visibleImportFile: boolean
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class MaterialsButtons extends PureComponent<Props, State> {
    private importButtonRef = createRef<HTMLButtonElement>();

    constructor(props) {
        super(props);

        this.state = {
            visibleImportFile: false,
        };
    }

    handleCloseImportDataForm = () => {
        this.setState({ visibleImportFile: false });
    }

    render() {
        return (
            <Grid.Row style={{ marginTop: '50px' }}>
                <div style={{ float: 'right' }}>
                    <FlexBox margin={ComponentSize.Small}>
                        <ExportFile
                            headers={["Material Name", "Thickness", "Width", "Height", "Description"]}
                            fields={["materialName", "thickness", "width", "height", "materialDescription"]}
                            fileName={"materials"}
                            exportData={this.props.materials}
                        />
                        <Popover
                            triggerRef={this.importButtonRef}
                            appearance={Appearance.Outline}
                            position={PopoverPosition.Below}
                            showEvent={PopoverInteraction.Hover}
                            hideEvent={PopoverInteraction.Hover}
                            distanceFromTrigger={8}
                            enableDefaultStyles={false}
                            contents={() => (
                                <p>Import in this order: materialName, thickness, width, height, materialDescription</p>
                            )}
                        />
                        {
                            ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                            <Button
                                ref={this.importButtonRef}
                                text="Import"
                                type={ButtonType.Button}
                                icon={IconFont.Import}
                                color={ComponentColor.Success}
                                onClick={() => this.setState({ visibleImportFile: true })}
                                style={{ width: '110px' }}
                                className="show-pc-or-tablet"
                            />
                        }
                        {
                            ["admin", "editor"].includes(localStorage.getItem("userRole")) &&
                            <Button
                                text="Add"
                                type={ButtonType.Button}
                                icon={IconFont.Plus}
                                color={ComponentColor.Primary}
                                style={{ width: '110px' }}
                                onClick={() => { this.props.handleOpenAddMaterial() }}
                                className="show-pc-or-tablet"
                            />
                        }
                    </FlexBox>
                </div>

                <ImportMaterialFile
                    overlay={this.state.visibleImportFile}
                    onClose={this.handleCloseImportDataForm}
                    getMaterials={this.props.getMaterials}
                    fileTypesToAccept=".csv, .xlsx"
                    orgID={this.props.orgID}
                />

            </Grid.Row>
        );
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(MaterialsButtons);