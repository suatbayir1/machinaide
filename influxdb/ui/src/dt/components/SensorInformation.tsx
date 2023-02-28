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

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";

// Constants
import { deleteSensorConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    refreshGeneralInfo: () => void
    clickPartDetail: () => void
    clickBrands: () => void
    objectList: object[]
}

type State = {
    typeList: string[]
    type: string
    units: string[]
    unit: string
    statusList: string[]
    status: string
    displayName: string
    description: string
    visibleConfirmationOverlay: boolean
    selectedObject: string
}

class SensorInformation extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            typeList: ['Temperature', 'Vibration', 'Pressure', 'AirFlow'],
            type: "",
            units: ['real', 'bit', 'double', 'float', 'integer'],
            unit: "",
            statusList: ["enable", "disable"],
            status: "",
            displayName: "",
            description: "",
            visibleConfirmationOverlay: false,
            selectedObject: "",
        }
    }

    public async componentDidMount(): Promise<void> {
        this.setForm();
    }

    public async componentDidUpdate(prevProps: Readonly<Props>): Promise<void> {
        if (prevProps.selectedGraphNode !== this.props.selectedGraphNode) {
            this.setForm();
        }
    }

    private setForm = (): void => {
        const { selectedGraphNode } = this.props;

        this.setState({
            unit: selectedGraphNode["unit"],
            status: selectedGraphNode["status"],
            type: selectedGraphNode["@type"][1],
            displayName: selectedGraphNode["displayName"],
            description: selectedGraphNode["description"],
            selectedObject: selectedGraphNode["visual"] !== "" && selectedGraphNode["visual"] !== undefined ? selectedGraphNode["visual"]["id"] : "",
        })
    }

    private deleteSensor = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;

        const payload = {
            "id": selectedGraphNode["@id"]
        }

        const deletedResult = await DTService.deleteSensor(payload);

        if (deletedResult.summary.code === 200) {
            handleChangeNotification("success", deletedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", deletedResult.message.text);
        }
    }

    public render() {
        const { selectedGraphNode, objectList } = this.props;
        const { unit, status, displayName, description,
            type, visibleConfirmationOverlay, selectedObject
        } = this.state;
        const selectedObjectName = objectList.find(x => selectedObject === x["_id"]["$oid"])

        return (
            <>
                <DangerConfirmationOverlay
                    title={i18next.t('warning.are_you_sure')}
                    message={deleteSensorConfirmationText}
                    visible={visibleConfirmationOverlay}
                    onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                    onConfirm={() => { this.deleteSensor() }}
                />

                <Form key={selectedGraphNode["@id"]}>
                    <Grid>
                        <Grid.Row>
                            <DapperScrollbars
                                autoHide={false}
                                autoSizeHeight={true} style={{ maxHeight: '450px' }}
                                className="data-loading--scroll-content"
                            >
                                <Grid.Column
                                    widthXS={Columns.Six}
                                    widthSM={Columns.Three}
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
                                    widthXS={Columns.Six}
                                    widthSM={Columns.Three}
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
                                    widthSM={Columns.Three}
                                    widthMD={Columns.Six}
                                    widthLG={Columns.Six}
                                >
                                    <Form.Element
                                        label={i18next.t('dt.unit')}
                                    >
                                        <Label
                                            size={ComponentSize.Small}
                                            name={unit}
                                            description={i18next.t('dt.unit')}
                                            color={InfluxColors.Ocean}
                                            id={unit}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column
                                    widthXS={Columns.Six}
                                    widthSM={Columns.Three}
                                    widthMD={Columns.Six}
                                    widthLG={Columns.Six}
                                >
                                    <Form.Element
                                        label={i18next.t('dt.status')}
                                    >
                                        <Label
                                            size={ComponentSize.Small}
                                            name={status}
                                            description={i18next.t('dt.status')}
                                            color={InfluxColors.Ocean}
                                            id={status}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column
                                    widthXS={Columns.Six}
                                    widthSM={Columns.Six}
                                    widthMD={Columns.Twelve}
                                    widthLG={Columns.Twelve}
                                >
                                    <Form.Element label={i18next.t('dt.data_type')}>
                                        <Label
                                            size={ComponentSize.Small}
                                            name={type}
                                            description={i18next.t('dt.data_type')}
                                            color={InfluxColors.Ocean}
                                            id={type}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column
                                    widthXS={Columns.Six}
                                    widthSM={Columns.Six}
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
                                <Grid.Column widthSM={Columns.Twelve}>
                                    <Form.Element label={i18next.t('dt.visual')}>
                                        <Label
                                            size={ComponentSize.Small}
                                            name={selectedObjectName ? selectedObjectName["name"] : "-"}
                                            description={i18next.t('dt.visual')}
                                            color={InfluxColors.Ocean}
                                            id={selectedObjectName ? selectedObjectName["name"] : "noVisual"}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <Form.Element label={`${i18next.t('dt.field_list')} (${selectedGraphNode["fields"].length})`}>
                                        {
                                            selectedGraphNode["fields"].length > 0 ?
                                                <DapperScrollbars
                                                    autoHide={false}
                                                    autoSizeHeight={true}
                                                    style={{ maxHeight: '100px' }}
                                                    className="data-loading--scroll-content"
                                                >
                                                    {
                                                        selectedGraphNode["fields"].map((field, idx) => {
                                                            return (
                                                                <List.Item
                                                                    key={idx}
                                                                    value={field.name}
                                                                    title={i18next.t('dt.field_name')}
                                                                    gradient={Gradients.GundamPilot}
                                                                    wrapText={true}
                                                                >
                                                                    <List.Indicator type="dot" />
                                                                    <div className="selectors--item-value selectors--item__measurement">
                                                                        {field.name}
                                                                    </div>
                                                                </List.Item>
                                                            )
                                                        })
                                                    }
                                                </DapperScrollbars>
                                                : <h6>{i18next.t('warning.no_field_found')}</h6>
                                        }
                                    </Form.Element>
                                </Grid.Column>
                            </DapperScrollbars>
                        </Grid.Row>
                    </Grid>
                </Form>
            </>
        )
    }
}

export default SensorInformation;