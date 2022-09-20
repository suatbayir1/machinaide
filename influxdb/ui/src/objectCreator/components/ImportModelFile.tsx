// Libraries
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, Button, IconFont, ComponentColor, ButtonType, Grid, Columns,
    DapperScrollbars, List, FlexBox, Gradients, FlexDirection, ComponentSize,
} from "@influxdata/clockface"

// Constants
import { generalErrorMessage, generalSuccessMessage } from 'src/shared/copy/notifications'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Services
import ObjectService from "src/shared/services/ObjectService";

type Props = {
    onDismiss: () => void
    modelFiles: object[]
    removeNewObjectsFromScene: () => void
    handleSaveImportModel: (model: object) => void
    getModelFiles: () => void
}

type State = {
    selectedImportModel: object
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class UploadModelFile extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);

        this.state = {
            selectedImportModel: {},
        }
    }

    private handleSaveImportModel = async () => {
        const { notify, removeNewObjectsFromScene, handleSaveImportModel, onDismiss } = this.props;
        const { selectedImportModel } = this.state;

        if (Object.keys(selectedImportModel).length === 0) {
            notify(generalErrorMessage("Please select component first"));
            return;
        }

        await removeNewObjectsFromScene();

        await handleSaveImportModel(selectedImportModel);

        notify(generalSuccessMessage("Component successfully added to the scene"));
        onDismiss();
    }

    private handleDeleteModel = async (): Promise<void> => {
        const { notify, getModelFiles, onDismiss } = this.props;
        const { selectedImportModel } = this.state;

        if (Object.keys(selectedImportModel).length === 0) {
            notify(generalErrorMessage("Please select component first"));
            return;
        }

        const result = await ObjectService.deleteModelFile({ file: selectedImportModel["file"] });
        if (result.summary.code !== 200) {
            notify(generalErrorMessage(result.message.text));
            return;
        }

        notify(generalSuccessMessage(result.message.text));
        getModelFiles();
        onDismiss();
    }

    public render(): JSX.Element {
        const { onDismiss, modelFiles } = this.props;
        const { selectedImportModel } = this.state;

        return (
            <Form>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element label="Component">
                            <DapperScrollbars
                                autoHide={false}
                                autoSizeHeight={true} style={{ maxHeight: '200px' }}
                                className="data-loading--scroll-content"
                            >
                                <List>
                                    {
                                        modelFiles.map((object) => {
                                            return (
                                                <List.Item
                                                    key={object["filename"]}
                                                    value={object["filename"]}
                                                    onClick={() => {
                                                        this.setState({
                                                            selectedImportModel: object,
                                                        })
                                                    }}
                                                    title={object["filename"]}
                                                    gradient={Gradients.GundamPilot}
                                                    wrapText={true}
                                                    selected={selectedImportModel["filename"] === object["filename"] ? true : false}
                                                >
                                                    <FlexBox
                                                        direction={FlexDirection.Row}
                                                        margin={ComponentSize.Small}
                                                    >
                                                        <List.Indicator type="dot" />
                                                        <List.Indicator type="checkbox" />
                                                        <div className="selectors--item-value selectors--item__measurement">
                                                            {object["filename"]}
                                                        </div>
                                                    </FlexBox>
                                                </List.Item>
                                            )
                                        })
                                    }
                                </List>
                            </DapperScrollbars>
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>

                <Form.Footer>
                    <Button
                        text="Cancel"
                        icon={IconFont.Remove}
                        onClick={onDismiss}
                    />

                    <Button
                        text="Import"
                        icon={IconFont.Import}
                        color={ComponentColor.Success}
                        type={ButtonType.Submit}
                        onClick={this.handleSaveImportModel}
                    />

                    <Button
                        text="Delete"
                        icon={IconFont.Trash}
                        color={ComponentColor.Danger}
                        type={ButtonType.Submit}
                        onClick={this.handleDeleteModel}
                    />
                </Form.Footer>
            </Form>
        )
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(UploadModelFile);
