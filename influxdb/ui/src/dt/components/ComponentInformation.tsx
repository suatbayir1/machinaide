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
import { deleteComponentConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    clickPartDetail: () => void
    clickBrands: () => void
    refreshGeneralInfo: () => void
    objectList: object[]
}

type State = {
    displayName: string
    description: string
    visibleConfirmationOverlay: boolean
    selectedObject: string
}

class ComponentInformation extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
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
            selectedObject: selectedGraphNode["visual"] !== "" && selectedGraphNode["visual"] !== undefined ? selectedGraphNode["visual"]["id"] : "",
            displayName: selectedGraphNode["displayName"],
            description: selectedGraphNode["description"],
        })
    }

    private deleteComponent = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;

        const payload = {
            "id": selectedGraphNode["id"]
        }

        const deletedResult = await DTService.deleteComponent(payload);

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
        const { displayName, description, visibleConfirmationOverlay, selectedObject } = this.state;
        const selectedObjectName = objectList.find(x => selectedObject === x["_id"]["$oid"])

        return (
            <>
                <DangerConfirmationOverlay
                    title={i18next.t('warning.are_you_sure')}
                    message={deleteComponentConfirmationText}
                    visible={visibleConfirmationOverlay}
                    onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                    onConfirm={() => { this.deleteComponent() }}
                />

                <Form key={selectedGraphNode["id"]}>
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
                                    <Form.Element label={`${i18next.t('dt.sensor_list')} (${selectedGraphNode["sensors"].length})`}>
                                        {
                                            selectedGraphNode["sensors"].length > 0 ?
                                                <DapperScrollbars
                                                    autoHide={false}
                                                    autoSizeHeight={true}
                                                    style={{ maxHeight: '100px' }}
                                                    className="data-loading--scroll-content"
                                                >
                                                    {
                                                        selectedGraphNode["sensors"].map((sensor, idx) => {
                                                            return (
                                                                <List.Item
                                                                    key={idx}
                                                                    value={sensor.displayName}
                                                                    title={i18next.t('dt.sensor_name')}
                                                                    gradient={Gradients.GundamPilot}
                                                                    wrapText={true}
                                                                >
                                                                    <List.Indicator type="dot" />
                                                                    <div className="selectors--item-value selectors--item__measurement">
                                                                        {sensor.displayName}
                                                                    </div>
                                                                </List.Item>
                                                            )
                                                        })
                                                    }
                                                </DapperScrollbars>
                                                : <h6>{i18next.t('dt.no_sensor_found')}</h6>
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

export default ComponentInformation;