// Libraries
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, Button, IconFont, ComponentColor, ButtonType, Grid, Input,
    Columns, TextArea, SelectDropdown, DapperScrollbars,
    List, FlexBox, ComponentSize, FlexDirection, Gradients,
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
    machineList: string[]
    objectList: object[]
}

type State = {
    id: string
    machine: string
    displayName: string
    description: string
    selectedObject: object
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class CreateComponent extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);

        this.state = {
            id: "",
            machine: "",
            displayName: "",
            description: "",
            selectedObject: {},
        }
    }

    private clearForm = () => {
        this.setState({
            id: "",
            machine: "",
            displayName: "",
            description: "",
            selectedObject: {},
        })
    }


    private create = async (): Promise<void> => {
        const { id, displayName, description, machine, selectedObject } = this.state;
        const {
            handleDismissAddNode, refreshGraph, notify,
            refreshGeneralInfo, refreshVisualizePage
        } = this.props;


        if (id.trim() === "" || machine.trim() === "" || displayName.trim() === "") {
            notify(pleaseFillInTheFormCompletely("ID, Machine and Display Name cannot be empty."));
            return;
        }

        const payload = {
            "@id": id,
            "@type": "Component",
            "name": id,
            "displayName": displayName,
            "description": description,
            "type": "Component",
            "parent": machine,
            "sensors": [],
            "visual": selectedObject["children"] !== undefined ? selectedObject['_id']['$oid'] : ""
        }

        const insertResult = await DTService.insertComponent(payload);

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

    private handleClickObject = (object) => {
        this.setState({
            selectedObject: object
        })
    }

    public render(): JSX.Element {
        const { onDismiss, machineList, objectList } = this.props;
        const { id, machine, displayName, description, selectedObject } = this.state;

        return (
            <>
                {
                    machineList.length > 0 ?
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
                                            label="Machine"
                                            required={true}
                                        >
                                            <SelectDropdown
                                                options={machineList}
                                                selectedOption={machine}
                                                onSelect={(e) => this.setState({ machine: e })}
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

                                <Grid.Row>
                                    <Grid.Column widthSM={Columns.Twelve}>
                                        <Form.Element label="Visual">
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true} style={{ maxHeight: '150px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                <List>
                                                    {
                                                        objectList.map((object) => {
                                                            return (
                                                                <List.Item
                                                                    key={object["name"]}
                                                                    value={object["name"]}
                                                                    onClick={() => this.handleClickObject(object)}
                                                                    title={object["name"]}
                                                                    gradient={Gradients.GundamPilot}
                                                                    wrapText={true}
                                                                    selected={selectedObject["name"] === object["name"] ? true : false}
                                                                >
                                                                    <FlexBox
                                                                        direction={FlexDirection.Row}
                                                                        margin={ComponentSize.Small}
                                                                    >
                                                                        <List.Indicator type="dot" />
                                                                        <List.Indicator type="checkbox" />
                                                                        <div className="selectors--item-value selectors--item__measurement">
                                                                            {object["name"]}
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
                        : <h2>Machine record not found. Please add machine first</h2>
                }
            </>
        )
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(CreateComponent);
