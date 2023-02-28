// Libraries
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, Button, IconFont, ComponentColor, ButtonType, Grid, Input, Columns,
    RemoteDataState, SpinnerContainer, TechnoSpinner,
} from "@influxdata/clockface"

// Constants
import { generalErrorMessage, generalSuccessMessage } from 'src/shared/copy/notifications'

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Services
import ObjectService from "src/shared/services/ObjectService";

type Props = {
    onDismiss: () => void
    getModelFiles: () => void
}

type State = {
    modelFileName: string
    spinnerLoading: RemoteDataState
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class UploadModelFile extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);

        this.state = {
            modelFileName: "",
            spinnerLoading: RemoteDataState.Done,
        }
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    private handleFileUpload = async (event): Promise<void> => {
        event.preventDefault();

        const { notify, onDismiss, getModelFiles } = this.props;
        const { modelFileName } = this.state;

        const inputFile = document.getElementById("inputFile");
        const formData = new FormData();
        formData.append('file', inputFile["files"][0]);
        formData.append('filename', modelFileName);

        if (inputFile["files"][0] === undefined) {
            notify(generalErrorMessage("Please select file first"));
            return;
        }

        if (modelFileName.trim() === "") {
            notify(generalErrorMessage("Model Name cannot be empty"));
            return;
        }

        this.setState({ spinnerLoading: RemoteDataState.Loading });

        const result = await ObjectService.modelFileUpload(formData);

        this.setState({ spinnerLoading: RemoteDataState.Done });

        if (result.summary.code !== 200) {
            notify(generalErrorMessage(result.message.text));
            return;
        }

        notify(generalSuccessMessage(result.message.text));
        onDismiss();
        getModelFiles();
    }

    public render(): JSX.Element {
        const { onDismiss } = this.props;
        const { modelFileName, spinnerLoading } = this.state;

        return (
            <>
                {
                    spinnerLoading == RemoteDataState.Loading ?
                        <SpinnerContainer
                            loading={spinnerLoading}
                            spinnerComponent={<TechnoSpinner />}
                        />
                        :
                        <Form>
                            <Grid.Row>
                                <Grid.Column widthSM={Columns.Twelve}>
                                    <Form.Element
                                        label="Model File Name"
                                        errorMessage={handleValidation(modelFileName)}
                                        required={true}
                                    >
                                        <Input
                                            name="modelFileName"
                                            placeholder="Model file name.."
                                            onChange={this.handleChangeInput}
                                            value={modelFileName}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                            </Grid.Row>
                            <Grid.Row>
                                <Grid.Column widthSM={Columns.Twelve}>
                                    <Form.Element label="Model File Upload">
                                        <input
                                            name="file"
                                            type="file"
                                            id="inputFile"
                                            accept=".dae, .glb"
                                        />
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
                                    text="Upload"
                                    icon={IconFont.Export}
                                    color={ComponentColor.Success}
                                    type={ButtonType.Submit}
                                    onClick={this.handleFileUpload}
                                />
                            </Form.Footer>
                        </Form>
                }
            </>
        )
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(UploadModelFile);
