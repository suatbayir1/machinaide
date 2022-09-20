// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, ComponentColor, IconFont, ButtonType, Button,
    Grid, Columns, Input
} from '@influxdata/clockface'
import { ErrorHandling } from 'src/shared/decorators/errors'

// Constants
import { generalErrorMessage, generalSuccessMessage } from 'src/shared/copy/notifications'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Services
import ObjectService from "src/shared/services/ObjectService";

interface OwnProps {
    onClose: () => void
    getTextureFiles: () => void
}

interface State {
    textureFileName: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

@ErrorHandling
class TextureUploadForm extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            textureFileName: "",
        }
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    private handleFileUpload = async (event) => {
        event.preventDefault();

        const { notify, onClose, getTextureFiles } = this.props;
        const { textureFileName } = this.state;

        const inputFile = document.getElementById("inputFile");
        const formData = new FormData();
        formData.append('file', inputFile["files"][0]);
        formData.append('filename', textureFileName);

        if (inputFile["files"][0] === undefined) {
            notify(generalErrorMessage("Please select file first"));
            return;
        }

        if (textureFileName.trim() === "") {
            notify(generalErrorMessage("Texture Name cannot be empty"));
            return;
        }

        const result = await ObjectService.fileUpload(formData);

        if (result.summary.code !== 200) {
            notify(generalErrorMessage(result.message.text));
            return;
        }

        notify(generalSuccessMessage(result.message.text));
        onClose();
        getTextureFiles();
    }

    public render() {
        const { onClose } = this.props;

        return (
            <Form>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element label="Texture Name">
                            <Input
                                name="textureFileName"
                                placeholder="Texture name.."
                                onChange={this.handleChangeInput}
                                value={this.state.textureFileName}
                            />
                        </Form.Element>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column widthSM={Columns.Twelve}>
                        <Form.Element label="File Upload">
                            <input
                                name="file"
                                type="file"
                                id="inputFile"
                                accept=".jpg, .jpeg, .png, .svg"
                            />
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
                        text="Upload"
                        icon={IconFont.Export}
                        color={ComponentColor.Success}
                        type={ButtonType.Submit}
                        onClick={this.handleFileUpload}
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

export default connector(TextureUploadForm);
