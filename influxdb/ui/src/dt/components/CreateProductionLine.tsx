// Libraries
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, Button, IconFont, ComponentColor, ButtonType, Grid, Input,
    Columns, TextArea, ComponentStatus,
} from "@influxdata/clockface"

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Services
import DTService from "src/shared/services/DTService";

// Constants
import {
    pleaseFillInTheFormCompletely,
    generalSuccessMessage,
    generalErrorMessage,
} from 'src/shared/copy/notifications'

type Props = {
    onDismiss: () => void
    refreshGraph: () => void
    refreshGeneralInfo: () => void
    refreshVisualizePage: () => void
    handleDismissAddNode: () => void
    factoryID: string
}

type State = {
    id: string
    displayName: string
    description: string
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class CreateProductionLine extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);

        this.state = {
            id: "",
            displayName: "",
            description: "",
        }
    }

    private clearForm = () => {
        this.setState({
            id: "",
            displayName: "",
            description: "",
        })
    }

    private create = async (): Promise<void> => {
        const { id, displayName, description } = this.state;
        const {
            handleDismissAddNode, refreshGraph, notify, factoryID,
            refreshGeneralInfo, refreshVisualizePage
        } = this.props;

        if (factoryID.trim() === "") {
            notify(generalErrorMessage("Factory record not found. Please add factory first"));
            return;
        }

        if (id.trim() === "") {
            notify(pleaseFillInTheFormCompletely("ID and Factory cannot be empty."));
            return;
        }

        const payload = {
            "@id": id,
            "name": id,
            "parent": factoryID,
            "displayName": displayName,
            "description": description,
            "type": "ProductionLine",
            "machines": [],
        }

        const insertResult = await DTService.insertProductionLine(payload);

        if (insertResult.summary.code === 200) {
            handleDismissAddNode();
            notify(generalSuccessMessage(insertResult.message.text));
            refreshGraph();
            refreshGeneralInfo();
            refreshVisualizePage();
            this.clearForm();

        } else {
            notify(generalErrorMessage(insertResult.message.text));
        }
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    public render(): JSX.Element {
        const { onDismiss, factoryID } = this.props;
        const { id, displayName, description } = this.state;

        return (
            <>
                {
                    factoryID.trim() !== "" ?
                        <Form>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column widthSM={Columns.Six}>
                                        <Form.Element
                                            label="Unique ID/Name"
                                            errorMessage={handleValidation(id)}
                                            required={true}
                                        >
                                            <Input
                                                name="id"
                                                placeholder="Unique ID.."
                                                onChange={this.handleChangeInput}
                                                value={id}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column widthSM={Columns.Six}>
                                        <Form.Element
                                            label="Factory"
                                            required={true}
                                        >
                                            <Input
                                                value={factoryID}
                                                status={ComponentStatus.Disabled}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthSM={Columns.Twelve}>
                                        <Form.Element
                                            label="Display Name"
                                            errorMessage={handleValidation(displayName)}
                                            required={true}
                                        >
                                            <Input
                                                name="displayName"
                                                placeholder="Display name.."
                                                onChange={this.handleChangeInput}
                                                value={displayName}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthSM={Columns.Twelve}>
                                        <Form.Element label="Description">
                                            <TextArea
                                                name="description"
                                                value={description}
                                                placeholder="Description.."
                                                onChange={this.handleChangeInput}
                                                rows={5}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>

                            <Form.Footer>
                                <Button
                                    text="Cancel"
                                    icon={IconFont.Remove}
                                    onClick={onDismiss}
                                />

                                <Button
                                    text="Save"
                                    icon={IconFont.Checkmark}
                                    color={ComponentColor.Success}
                                    type={ButtonType.Submit}
                                    onClick={this.create}
                                />
                            </Form.Footer>
                        </Form >
                        : <h2>Factory record not found. Please add factory first</h2>
                }
            </>
        )
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(CreateProductionLine)
