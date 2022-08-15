// Libraries
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from 'react-redux'
import uuid from "uuid";

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
    onClose: () => void
    textures: object[]
    getTextureFiles: () => void
}

type State = {
    selectedTexture: object
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class TextureDeleteForm extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);

        this.state = {
            selectedTexture: {},
        }
    }

    private handleDeleteTexture = async (): Promise<void> => {
        const { notify, getTextureFiles, onClose } = this.props;
        const { selectedTexture } = this.state;

        if (Object.keys(selectedTexture).length === 0) {
            notify(generalErrorMessage("Please select texture first"));
            return;
        }

        const result = await ObjectService.deleteTexture({ file: selectedTexture["file"] });
        if (result.summary.code !== 200) {
            notify(generalErrorMessage(result.message.text));
            return;
        }

        notify(generalSuccessMessage(result.message.text));
        getTextureFiles();
        onClose();
    }

    public render(): JSX.Element {
        const { onClose, textures } = this.props;
        const { selectedTexture } = this.state;

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
                                        textures.map((object) => {
                                            return (
                                                <List.Item
                                                    key={uuid.v4()}
                                                    value={object["filename"]}
                                                    onClick={() => {
                                                        this.setState({
                                                            selectedTexture: object,
                                                        })
                                                    }}
                                                    title={object["filename"]}
                                                    gradient={Gradients.GundamPilot}
                                                    wrapText={true}
                                                    selected={selectedTexture["filename"] === object["filename"] ? true : false}
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
                        onClick={onClose}
                    />

                    <Button
                        text="Delete"
                        icon={IconFont.Trash}
                        color={ComponentColor.Danger}
                        type={ButtonType.Submit}
                        onClick={this.handleDeleteTexture}
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

export default connector(TextureDeleteForm);
