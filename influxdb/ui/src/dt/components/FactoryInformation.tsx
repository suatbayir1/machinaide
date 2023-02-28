// Libraries
import React, { PureComponent } from "react";
import i18next from "i18next";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    ComponentStatus, DapperScrollbars, List,
    Gradients, IconFont, ComponentColor, TextArea, Button, ButtonType,
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";
import FactorySceneOverlay from "src/dt/components/FactorySceneOverlay";

// Services
import DTService from "src/shared/services/DTService";

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";

// Constants
import { bucketConfirmationText, deleteFactoryConfirmationText } from 'src/shared/constants/tips';

type Props = {
    selectedGraphNode: object
    bucketNames: string[]
    handleChangeNotification: (type: string, message: string) => void
    refreshGraph: () => void
    refreshVisualizePage: () => void
    refreshGeneralInfo: () => void
}

type State = {
    factoryName: string
    location: string
    bucket: string
    description: string
    visibleConfirmationOverlay: boolean
    operationType: "delete" | "update"
    visibleFactory3DOverlay: boolean
}

class FactoryInformation extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            factoryName: "",
            location: "",
            bucket: "",
            description: "",
            visibleConfirmationOverlay: false,
            operationType: "update",
            visibleFactory3DOverlay: false
        }
    }

    public componentDidMount(): void {
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
            factoryName: selectedGraphNode["factoryName"],
            location: selectedGraphNode["location"],
            bucket: selectedGraphNode["bucket"],
            description: selectedGraphNode["description"],
        })
    }

    private deleteFactory = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;

        const payload = {
            "id": selectedGraphNode["id"]
        }

        const deletedResult = await DTService.deleteFactory(payload);

        if (deletedResult.summary.code === 200) {
            handleChangeNotification("success", deletedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", deletedResult.message.text);
        }
    }

    private updateFactoryConfirmed = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification, refreshGraph, refreshVisualizePage, refreshGeneralInfo } = this.props;
        const { factoryName, location, bucket, description } = this.state;

        const payload = {
            "id": selectedGraphNode["id"],
            factoryName,
            location,
            bucket,
            description
        }

        const updatedResult = await DTService.updateFactory(payload);

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

    public render(): JSX.Element {
        const { selectedGraphNode, } = this.props;
        const { factoryName, location, bucket, description, visibleConfirmationOverlay, operationType, visibleFactory3DOverlay } = this.state;

        return (
            <>
                {
                    visibleFactory3DOverlay &&
                    <FactorySceneOverlay
                        visible={visibleFactory3DOverlay}
                        onClose={() => this.setState({ visibleFactory3DOverlay: false })}
                    />
                }


                <DangerConfirmationOverlay
                    title={"Are you sure ?"}
                    message={operationType == "update" ? bucketConfirmationText : deleteFactoryConfirmationText}
                    visible={visibleConfirmationOverlay}
                    onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                    onConfirm={() => { operationType == "update" ? this.updateFactoryConfirmed() : this.deleteFactory() }}
                />

                <Form>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Six}
                                widthMD={Columns.Six}
                                widthLG={Columns.Six}
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
                                widthSM={Columns.Six}
                                widthMD={Columns.Six}
                                widthLG={Columns.Six}
                            >
                                <Form.Element label={i18next.t('dt.3d_view')}>
                                    <Button
                                        text={i18next.t('dt.3d_view')}
                                        icon={IconFont.Pulse}
                                        onClick={() => this.setState({ visibleFactory3DOverlay: true })}
                                        type={ButtonType.Button}
                                        color={ComponentColor.Secondary}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Six}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element
                                    label={i18next.t('dt.factory_name')}
                                    errorMessage={handleValidation(factoryName)}
                                    required={true}
                                >
                                    <Label
                                        size={ComponentSize.Small}
                                        name={factoryName}
                                        description={i18next.t('dt.factory_name')}
                                        color={InfluxColors.Ocean}
                                        id={factoryName}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Six}
                                widthSM={Columns.Six}
                                widthMD={Columns.Six}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Bucket">
                                    <Label
                                        size={ComponentSize.Small}
                                        name={bucket}
                                        description="Bucket"
                                        color={InfluxColors.Ocean}
                                        id={bucket}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Six}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element
                                    label={i18next.t('dt.location')}
                                    errorMessage={handleValidation(location)}
                                    required={true}
                                >
                                    <TextArea
                                        name="location"
                                        value={location}
                                        placeholder={i18next.t('dt.location')}
                                        rows={2}
                                        status={ComponentStatus.Disabled}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Six}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label={i18next.t('dt.description')}>
                                    <TextArea
                                        name="description"
                                        value={description}
                                        placeholder={i18next.t('dt.description')}
                                        rows={4}
                                        status={ComponentStatus.Disabled}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column widthXS={Columns.Twelve}>
                                <Form.Element label={`${i18next.t('dt.production_lines')} (${selectedGraphNode["productionLines"].length})`}>
                                    {
                                        selectedGraphNode["productionLines"].length > 0 ?
                                            <DapperScrollbars
                                                autoHide={false}
                                                autoSizeHeight={true}
                                                style={{ maxHeight: '150px' }}
                                                className="data-loading--scroll-content"
                                            >
                                                {
                                                    selectedGraphNode["productionLines"].map(pl => {
                                                        return (
                                                            <List.Item
                                                                key={pl["@id"]}
                                                                value={pl["displayName"]}
                                                                title={i18next.t('dt.production_line_name')}
                                                                gradient={Gradients.GundamPilot}
                                                                wrapText={true}
                                                            >
                                                                <List.Indicator type="dot" />
                                                                <div className="selectors--item-value selectors--item__measurement">
                                                                    {pl["displayName"]}
                                                                </div>
                                                            </List.Item>
                                                        )
                                                    })
                                                }
                                            </DapperScrollbars>
                                            : <h6>{i18next.t('dt.no_production_line_found')}</h6>
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

export default FactoryInformation;