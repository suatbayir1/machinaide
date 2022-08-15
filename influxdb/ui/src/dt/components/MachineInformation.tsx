// Libraries
import React, { PureComponent } from "react";
import i18next from "i18next";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    DapperScrollbars, List, Gradients, TextArea, ComponentStatus
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";

// Services
import DTService from "src/shared/services/DTService";
import FluxService from "src/shared/services/FluxService";

// Utils
import { csvToJSON } from 'src/shared/helpers/FileHelper';
import { handleValidation } from "src/shared/helpers/FormValidator";

// Constants
import { updateMachineConfirmationText, deleteMachineConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    refreshGeneralInfo: () => void
    clickPartDetail: () => void
    clickBrands: () => void
    orgID: string
}

type State = {
    displayName: string
    description: string
    measurements: string[]
    selectedMeasurements: string[]
    operationType: "update" | "delete"
    visibleConfirmationOverlay: boolean
}

class MachineInformation extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            displayName: "",
            description: "",
            measurements: [],
            selectedMeasurements: [],
            operationType: "update",
            visibleConfirmationOverlay: false,
        }
    }

    public async componentDidMount(): Promise<void> {
        await this.getMeasurements();
        this.setForm();
    }

    public async componentDidUpdate(prevProps: Readonly<Props>): Promise<void> {
        if (prevProps.selectedGraphNode !== this.props.selectedGraphNode) {
            await this.getMeasurements();
            this.setForm();
        }
    }

    private setForm = (): void => {
        const { selectedGraphNode } = this.props;

        this.setState({
            displayName: selectedGraphNode["displayName"],
            description: selectedGraphNode["description"],
            selectedMeasurements: selectedGraphNode["measurements"],
        })
    }

    public getMeasurements = async (): Promise<void> => {
        const { selectedGraphNode, orgID } = this.props;

        const treeStructure = await DTService.getAllDT();

        let bucket;
        treeStructure[0]["productionLines"].map(pl => {
            pl["machines"].map(machine => {
                if (selectedGraphNode["@id"] === machine["@id"]) {
                    bucket = treeStructure[0]["bucket"];
                }
            })
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

    private deleteMachine = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;

        const payload = {
            "id": selectedGraphNode["@id"]
        }

        const deletedResult = await DTService.deleteMachine(payload);

        if (deletedResult.summary.code === 200) {
            handleChangeNotification("success", deletedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", deletedResult.message.text);
        }
    }

    private updateMachineConfirmed = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;
        const { displayName, description, selectedMeasurements } = this.state;

        const payload = {
            "id": selectedGraphNode["id"],
            displayName,
            description,
            "measurements": selectedMeasurements
        }

        const updatedResult = await DTService.updateMachine(payload);

        if (updatedResult.summary.code === 200) {
            handleChangeNotification("success", updatedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", updatedResult.message.text);
        }

        this.setState({ visibleConfirmationOverlay: false })
    }

    private getComponentCount = (content): number => {
        let components = content.filter(c => c?.["@type"] === "Component");
        return components.length;
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

    public render() {
        const { selectedGraphNode } = this.props;
        const {
            displayName, description, selectedMeasurements,
            operationType, visibleConfirmationOverlay
        } = this.state;

        return (
            <>
                <DangerConfirmationOverlay
                    title={i18next.t('warning.are_you_sure')}
                    message={operationType == "update" ? updateMachineConfirmationText : deleteMachineConfirmationText}
                    visible={visibleConfirmationOverlay}
                    onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                    onConfirm={() => { operationType == "update" ? this.updateMachineConfirmed() : this.deleteMachine() }}
                />

                <Form key={selectedGraphNode["id"]}>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Four}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.type')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={selectedGraphNode["type"]}
                                        description={i18next.t('dt.type')}
                                        color={InfluxColors.Ocean}
                                        id={selectedGraphNode["type"]}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Four}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.parent')}>
                                    <Label
                                        size={ComponentSize.Small}
                                        name={selectedGraphNode["parent"]}
                                        description={i18next.t('dt.parent')}
                                        color={InfluxColors.Ocean}
                                        id={selectedGraphNode["parent"]}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Four}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element
                                    label={i18next.t('dt.display_name')}
                                    errorMessage={handleValidation(displayName)}
                                    required={true}
                                >
                                    <Label
                                        size={ComponentSize.Small}
                                        name={displayName}
                                        description={i18next.t('dt.display_name')}
                                        color={InfluxColors.Ocean}
                                        id={displayName}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Twelve}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.description')}>
                                    <TextArea
                                        name="description"
                                        value={description}
                                        placeholder={i18next.t('dt.description')}
                                        status={ComponentStatus.Disabled}
                                        rows={4}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Four}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.measurements')}>
                                    {
                                        selectedMeasurements.length > 0 ?
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true}
                                                style={{ maxHeight: '100px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                {
                                                    selectedMeasurements.map((measurement, idx) => {
                                                        return (
                                                            <List.Item
                                                                key={idx}
                                                                value={measurement}
                                                                title={i18next.t('dt.measurements')}
                                                                gradient={Gradients.GundamPilot}
                                                                wrapText={true}
                                                            >
                                                                <List.Indicator type="dot" />
                                                                <div className="selectors--item-value selectors--item__measurement">
                                                                    {measurement}
                                                                </div>
                                                            </List.Item>
                                                        )
                                                    })
                                                }
                                            </DapperScrollbars>
                                            : <h6>{i18next.t('warning.no_measurement_selected')}</h6>
                                    }
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Twelve}>
                                <Form.Element label={`${i18next.t('dt.component_list')} (${this.getComponentCount(selectedGraphNode["contents"])})`}>
                                    {
                                        this.getComponentCount(selectedGraphNode["contents"]) > 0 ?
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true}
                                                style={{ maxHeight: '100px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                {
                                                    selectedGraphNode["contents"].map((component, idx) => {
                                                        return (
                                                            <List.Item
                                                                key={idx}
                                                                value={component.displayName}
                                                                title={i18next.t('dt.component_name')}
                                                                gradient={Gradients.GundamPilot}
                                                                wrapText={true}
                                                            >
                                                                <List.Indicator type="dot" />
                                                                <div className="selectors--item-value selectors--item__measurement">
                                                                    {component.displayName}
                                                                </div>
                                                            </List.Item>
                                                        )
                                                    })
                                                }
                                            </DapperScrollbars>
                                            : <h6>{i18next.t('warning.no_component_found')}</h6>
                                    }
                                </Form.Element>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Form>
            </>
        )
    }
}

export default MachineInformation;