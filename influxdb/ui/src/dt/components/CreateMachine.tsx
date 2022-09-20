// Libraries
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, Button, IconFont, ComponentColor, ButtonType, Grid, Input,
    Columns, TextArea, SelectDropdown, MultiSelectDropdown,
} from "@influxdata/clockface"

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";
import { csvToJSON } from 'src/shared/helpers/FileHelper';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Services
import DTService from "src/shared/services/DTService";
import FluxService from "src/shared/services/FluxService";

// Constants
import {
    pleaseFillInTheFormCompletely,
    generalSuccessMessage,
    generalErrorMessage,
} from 'src/shared/copy/notifications'


type Props = {
    orgID: string
    onDismiss: () => void
    refreshGraph: () => void
    refreshGeneralInfo: () => void
    refreshVisualizePage: () => void
    handleDismissAddNode: () => void
    productionLineList: string[]
}

type State = {
    id: string
    productionLine: string
    displayName: string
    description: string
    selectedMeasurements: string[]
    measurements: string[]
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class CreateMachine extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);

        this.state = {
            id: "",
            productionLine: "",
            displayName: "",
            description: "",
            selectedMeasurements: [],
            measurements: [],
        }
    }

    private clearForm = () => {
        this.setState({
            id: "",
            productionLine: "",
            displayName: "",
            description: "",
            selectedMeasurements: [],
            measurements: [],
        })
    }

    public getMeasurements = async (): Promise<void> => {
        const { orgID } = this.props;
        const { productionLine } = this.state;

        const treeStructure = await DTService.getAllDT();

        let bucket;
        treeStructure?.[0]?.["productionLines"].map(pl => {
            if (productionLine === pl["@id"]) {
                bucket = treeStructure[0]["bucket"];
            }
        })

        const query = `
        from(bucket: "${bucket}")
            |> range(start: -1h, stop: now())
            |> filter(fn: (r) => true)
            |> keep(columns: ["_measurement"])
            |> group()
            |> distinct(column: "_measurement")
            |> limit(n: 200)
            |> sort()
        `
        const csvResult = await FluxService.fluxQuery(orgID, query);
        const jsonResult = await csvToJSON(csvResult);

        let measurements = [];
        jsonResult.map(item => {
            if (item["_value\r"] != undefined) {
                measurements = [...measurements, item["_value\r"].replace('\r', '')];
            }
        });

        this.setState({ measurements });
    }


    public handleChangeMeasurements = (option: string) => {
        const { selectedMeasurements } = this.state
        const optionExists = selectedMeasurements.find(opt => opt === option)
        let updatedOptions = selectedMeasurements

        if (optionExists) {
            updatedOptions = selectedMeasurements.filter(fo => fo !== option)
        } else {
            updatedOptions = [...selectedMeasurements, option]
        }

        this.setState({ selectedMeasurements: updatedOptions })
    }

    private create = async (): Promise<void> => {
        const { id, displayName, description, productionLine, selectedMeasurements } = this.state;
        const {
            handleDismissAddNode, refreshGraph, notify,
            refreshGeneralInfo, refreshVisualizePage
        } = this.props;


        if (id.trim() === "" || productionLine.trim() === "" || displayName.trim() === "") {
            notify(pleaseFillInTheFormCompletely("ID, Production Line and Display Name cannot be empty."));
            return;
        }

        const payload = {
            "@id": id,
            "name": id,
            "parent": productionLine,
            "displayName": displayName,
            "description": description,
            "type": "Machine",
            "@type": "Interface",
            "measurements": selectedMeasurements,
            "contents": [],
        }

        const insertResult = await DTService.insertMachine(payload);

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
        const { onDismiss, productionLineList } = this.props;
        const { id, productionLine, displayName, description, selectedMeasurements, measurements } = this.state;

        return (
            <>
                {
                    productionLineList.length > 0 ?
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
                                            label="Production Line"
                                            required={true}
                                        >
                                            <SelectDropdown
                                                options={productionLineList}
                                                selectedOption={productionLine}
                                                onSelect={(e) => this.setState({ productionLine: e }, () => this.getMeasurements())}
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
                                                placeholder="Machine name.."
                                                onChange={this.handleChangeInput}
                                                value={displayName}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column
                                        widthXS={Columns.Six}
                                    >
                                        <Form.Element label="Measurements">
                                            <MultiSelectDropdown
                                                emptyText={""}
                                                options={measurements}
                                                selectedOptions={selectedMeasurements}
                                                onSelect={this.handleChangeMeasurements}
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
                        : <h2>Production line record not found. Please add production line first</h2>
                }
            </>
        )
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(CreateMachine);
