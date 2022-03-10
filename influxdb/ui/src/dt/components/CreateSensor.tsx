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
    objectList: object[]
    componentList: string[]
}

type State = {
    id: string
    component: string
    displayName: string
    description: string
    selectedObject: object
    typeList: string[]
    type: string
    units: string[]
    unit: string
    statusList: string[]
    status: string
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class CreateSensor extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);

        this.state = {
            id: "",
            component: "",
            displayName: "",
            description: "",
            selectedObject: {},
            typeList: ['Temperature', 'Vibration', 'Pressure', 'AirFlow'],
            type: "Temperature",
            units: ['real', 'bit', 'double', 'float', 'integer'],
            unit: "real",
            statusList: ["enable", "disable"],
            status: "enable",
        }
    }

    private clearForm = () => {
        this.setState({
            id: "",
            component: "",
            displayName: "",
            description: "",
            selectedObject: {},
            typeList: ['Temperature', 'Vibration', 'Pressure', 'AirFlow'],
            type: "Temperature",
            units: ['real', 'bit', 'double', 'float', 'integer'],
            unit: "real",
            statusList: ["enable", "disable"],
            status: "enable",
        })
    }

    private create = async (): Promise<void> => {
        const { id, component, displayName, type, unit, status, description, selectedObject } = this.state;
        const {
            handleDismissAddNode, refreshGraph, notify,
            refreshGeneralInfo, refreshVisualizePage
        } = this.props;

        if (id.trim() === ""
            || component.trim() === ""
            || displayName.trim() === ""
            || Object.keys(selectedObject).length < 1
        ) {
            notify(pleaseFillInTheFormCompletely("ID, Component, Display Name and Visual cannot be empty."));
            return;
        }

        if (selectedObject?.["children"]) {
            if (selectedObject["children"].length > 1) {
                notify(generalErrorMessage(`Your visual object can contain only 1 item. 
                    But the object you selected contains ${selectedObject["children"].length} items`
                ));
                return;
            }
        }

        const payload = {
            "@id": id,
            "@type": ["Telemetry", type],
            "name": id,
            "schema": unit,
            "type": "Sensor",
            "parent": component,
            "unit": unit,
            "displayName": displayName,
            "description": description,
            "status": status,
            "visual": selectedObject["_id"]["$oid"],
            "fields": [],
        }

        const insertResult = await DTService.insertSensor(payload);

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
        const { onDismiss, objectList, componentList } = this.props;
        const {
            id, component, displayName, description, selectedObject, typeList,
            type, units, unit, statusList, status
        } = this.state;

        return (
            <>
                {
                    componentList.length > 0 ?
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
                                            label="Component"
                                            required={true}
                                        >
                                            <SelectDropdown
                                                options={componentList}
                                                selectedOption={component}
                                                onSelect={(e) => this.setState({ component: e })}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthSM={Columns.Six}>
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
                                    <Grid.Column widthSM={Columns.Six}>
                                        <Form.Element
                                            label="Type"
                                        >
                                            <SelectDropdown
                                                options={typeList}
                                                selectedOption={type}
                                                onSelect={(e) => this.setState({ type: e })}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthSM={Columns.Six}>
                                        <Form.Element
                                            label="Unit"
                                        >
                                            <SelectDropdown
                                                options={units}
                                                selectedOption={unit}
                                                onSelect={(e) => this.setState({ unit: e })}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column widthSM={Columns.Six}>
                                        <Form.Element
                                            label="Status"
                                        >
                                            <SelectDropdown
                                                options={statusList}
                                                selectedOption={status}
                                                onSelect={(e) => this.setState({ status: e })}
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
                                        <Form.Element
                                            label="Visual"
                                            required={true}
                                        >
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
                        : <h2>Component record not found. Please add component first</h2>
                }
            </>
        )
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(CreateSensor);
