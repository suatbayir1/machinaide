// Libraries
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, Button, IconFont, ComponentColor, ButtonType, Grid, Input,
    Columns, TextArea, SelectDropdown, InputType,
} from "@influxdata/clockface"

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Services
import DTService from "src/shared/services/DTService";
import FluxService from "src/shared/services/FluxService";

// Utils
import { csvToJSON } from 'src/shared/helpers/FileHelper';

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
    sensorList: string[]
    orgID: string
}

type State = {
    id: string
    sensor: string
    displayName: string
    minValue: number
    maxValue: number
    description: string
    measurements: string[]
    measurement: string
    bucket: string
    fields: string[]
    field: string
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class CreateField extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);

        this.state = {
            id: "",
            sensor: "",
            displayName: "",
            minValue: 0,
            maxValue: 0,
            description: "",
            measurements: [],
            measurement: "",
            bucket: "",
            fields: [],
            field: "",
        }
    }

    private clearForm = () => {
        this.setState({
        })
    }

    public getMeasurements = async (): Promise<void> => {
        const { sensor: selectedSensor } = this.state;

        const treeStructure = await DTService.getAllDT();

        let bucket = "";
        let measurements = [];

        treeStructure?.[0]?.["productionLines"].map(pl => {
            pl?.["machines"].map(machine => {
                machine?.["contents"].map(component => {
                    if (component["@type"] === "Component") {
                        component?.["sensors"].map(sensor => {
                            if (sensor["@id"] == selectedSensor) {
                                bucket = treeStructure[0]?.["bucket"];
                                measurements = machine?.["measurements"];
                            }
                        })
                    }
                })
            })
        })

        this.setState({ bucket, measurements });
    }

    private getFields = async (): Promise<void> => {
        const { orgID } = this.props;
        const { bucket, measurement } = this.state;

        if (bucket == "" || measurement == "") {
            return;
        }

        const query = `
            from(bucket: "${bucket}")
            |> range(start: -1h, stop: now())
            |> filter(fn: (r) => (r["_measurement"] == "${measurement}"))
            |> keep(columns: ["_field"])
            |> group()
            |> distinct(column: "_field")
            |> limit(n: 200)
            |> sort()
        `
        const csvResult = await FluxService.fluxQuery(orgID, query);
        const jsonResult = await csvToJSON(csvResult);

        let fields = [];
        jsonResult.map(item => {
            if (item["_value\r"] != undefined) {
                fields = [...fields, item["_value\r"].replace('\r', '')];
            }
        });

        this.setState({ fields })
    }

    private create = async (): Promise<void> => {
        const { id, minValue, maxValue, sensor, field, displayName, measurement, description } = this.state;
        const {
            handleDismissAddNode, refreshGraph, notify,
            refreshGeneralInfo, refreshVisualizePage
        } = this.props;

        if (id.trim() === ""
            || sensor.trim() === ""
            || displayName.trim() === ""
        ) {
            notify(pleaseFillInTheFormCompletely("ID, Sensor, and Display Name cannot be empty."));
            return;
        }

        if (Number(minValue) > Number(maxValue)) {
            notify(generalErrorMessage("Min value cannot greater than max value."));
            return;
        }

        const payload = {
            "@id": id,
            "name": id,
            "minValue": minValue,
            "maxValue": maxValue,
            "parent": sensor,
            "type": "Field",
            "dataSource": field,
            "measurement": measurement,
            "description": description,
            "displayName": displayName,
        }

        const insertResult = await DTService.insertField(payload);

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
        const { onDismiss, sensorList } = this.props;
        const { id, sensor, displayName, minValue, maxValue, description, measurements, measurement, fields, field } = this.state;

        return (
            <>
                {
                    sensorList.length > 0 ?
                        <>
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
                                                label="Sensor"
                                                required={true}
                                            >
                                                <SelectDropdown
                                                    options={sensorList}
                                                    selectedOption={sensor}
                                                    onSelect={(e) => this.setState({ sensor: e }, () => this.getMeasurements())}
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
                                                label="Measurement"
                                            >
                                                <SelectDropdown
                                                    options={measurements}
                                                    selectedOption={measurement}
                                                    onSelect={(e) => this.setState({ measurement: e }, () => this.getFields())}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column widthSM={Columns.Six}>
                                            <Form.Element
                                                label="Data Source"
                                            >
                                                <SelectDropdown
                                                    options={fields}
                                                    selectedOption={field}
                                                    onSelect={(e) => this.setState({ field: e })}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                        <Grid.Column widthSM={Columns.Three}>
                                            <Form.Element label="Min Value">
                                                <Input
                                                    name="minValue"
                                                    onChange={this.handleChangeInput}
                                                    value={minValue}
                                                    type={InputType.Number}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                        <Grid.Column widthSM={Columns.Three}>
                                            <Form.Element label="Max Value">
                                                <Input
                                                    name="maxValue"
                                                    onChange={this.handleChangeInput}
                                                    value={maxValue}
                                                    type={InputType.Number}
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
                        </>
                        : <h2>Sensor record not found. Please add sensor first</h2>
                }
            </>
        )
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(CreateField);
