// Libraries
import React, { PureComponent } from "react";
import i18next from "i18next";

// Components
import {
    Form, ComponentSize, Grid, Columns, Label, InfluxColors,
    SelectDropdown, ComponentStatus, DapperScrollbars, List,
    Gradients, ConfirmationButton, IconFont, ComponentColor,
    Appearance, Input, TextArea, Overlay
} from '@influxdata/clockface'
import DangerConfirmationOverlay from "src/shared/overlays/DangerConfirmationOverlay";

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
    isFactoryInformationOverlayVisible: boolean
    handleDismissFactoryInformationOverlay: () => void
}

type State = {
    factoryName: string
    location: string
    bucket: string
    description: string
    visibleConfirmationOverlay: boolean
    operationType: "delete" | "update"
}

class FactoryInformationOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            factoryName: "",
            location: "",
            bucket: "",
            description: "",
            visibleConfirmationOverlay: false,
            operationType: "update",
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

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
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
            this.props.handleDismissFactoryInformationOverlay()
            handleChangeNotification("success", updatedResult.message.text);
            refreshGraph();
            refreshVisualizePage();
            refreshGeneralInfo();
        } else {
            handleChangeNotification("error", updatedResult.message.text);
        }

        this.setState({ visibleConfirmationOverlay: false })
    }

    private updateFactory = async (): Promise<void> => {
        const { selectedGraphNode, handleChangeNotification } = this.props;
        const { factoryName, location, bucket } = this.state;

        if (factoryName.trim() === "" || location.trim() === "") {
            handleChangeNotification("error", "Factory name and Location cannot be empty");
            return;
        }

        if (bucket != selectedGraphNode["bucket"]) {
            this.setState({ visibleConfirmationOverlay: true })
        } else {
            this.updateFactoryConfirmed();
        }
    }

    public render(): JSX.Element {
        const { selectedGraphNode, bucketNames, isFactoryInformationOverlayVisible, handleDismissFactoryInformationOverlay } = this.props;
        const { factoryName, location, bucket, description, visibleConfirmationOverlay, operationType } = this.state;

        return (
            <>
                <Overlay visible={isFactoryInformationOverlayVisible}>
                    <Overlay.Container maxWidth={750}>
                        <Overlay.Header
                            title={i18next.t('headers.edit_factory')}
                            onDismiss={handleDismissFactoryInformationOverlay}
                        />
                        <Overlay.Body>
                            <DangerConfirmationOverlay
                                title={i18next.t('warning.are_you_sure')}
                                message={operationType == "update" ? bucketConfirmationText : deleteFactoryConfirmationText}
                                visible={visibleConfirmationOverlay}
                                onClose={() => { this.setState({ visibleConfirmationOverlay: false }) }}
                                onConfirm={() => { operationType == "update" ? this.updateFactoryConfirmed() : this.deleteFactory() }}
                            />

                            <Form>
                                <Grid>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Six}>
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
                                        <Grid.Column widthXS={Columns.Six}>
                                            <Form.Element
                                                label={i18next.t('dt.factory_name')}
                                                errorMessage={handleValidation(factoryName)}
                                                required={true}
                                            >
                                                <Input
                                                    name="factoryName"
                                                    placeholder={i18next.t('dt.factory_name')}
                                                    onChange={this.handleChangeInput}
                                                    value={factoryName}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Six}>
                                            <Form.Element
                                                label={i18next.t('dt.location')}
                                                errorMessage={handleValidation(location)}
                                                required={true}
                                            >
                                                <Input
                                                    name="location"
                                                    placeholder={i18next.t('dt.location')}
                                                    onChange={this.handleChangeInput}
                                                    value={location}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                        <Grid.Column widthXS={Columns.Six}>
                                            <Form.Element label="Bucket">
                                                <SelectDropdown
                                                    buttonStatus={["admin"].includes(localStorage.getItem("userRole"))
                                                        ? ComponentStatus.Valid
                                                        : ComponentStatus.Disabled
                                                    }
                                                    options={bucketNames}
                                                    selectedOption={bucket}
                                                    onSelect={(e) => this.setState({ bucket: e })}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label={i18next.t('dt.description')}>
                                                <TextArea
                                                    name="description"
                                                    value={description}
                                                    placeholder={i18next.t('dt.description')}
                                                    onChange={this.handleChangeInput}
                                                    rows={4}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label={`${i18next.t('dt.production_lines')} List (${selectedGraphNode["productionLines"] ? selectedGraphNode["productionLines"].length : 0})`}>
                                                {
                                                    selectedGraphNode["productionLines"] && selectedGraphNode["productionLines"].length > 0 ?
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
                                    <Grid.Row>
                                        <div className="dt-information-buttons">
                                            {
                                                ["admin"].includes(localStorage.getItem("userRole")) &&
                                                <ConfirmationButton
                                                    icon={IconFont.Checkmark}
                                                    onConfirm={() => {
                                                        this.setState({ operationType: "update" },
                                                            () => this.updateFactory())
                                                    }}
                                                    text={i18next.t('button.update')}
                                                    popoverColor={ComponentColor.Success}
                                                    popoverAppearance={Appearance.Outline}
                                                    color={ComponentColor.Success}
                                                    confirmationLabel={i18next.t('warning.do_you_want_to_update')}
                                                    confirmationButtonColor={ComponentColor.Success}
                                                    confirmationButtonText={i18next.t('button.yes')}
                                                />
                                            }
                                            {
                                                ["admin"].includes(localStorage.getItem("userRole")) &&
                                                <ConfirmationButton
                                                    icon={IconFont.Remove}
                                                    onConfirm={() => {
                                                        this.setState({
                                                            operationType: "delete",
                                                            visibleConfirmationOverlay: true
                                                        })
                                                    }}
                                                    text={i18next.t('button.delete')}
                                                    popoverColor={ComponentColor.Danger}
                                                    popoverAppearance={Appearance.Outline}
                                                    color={ComponentColor.Danger}
                                                    confirmationLabel={i18next.t('warning.do_you_want_to_delete')}
                                                    confirmationButtonColor={ComponentColor.Danger}
                                                    confirmationButtonText={i18next.t('button.yes')}
                                                />
                                            }
                                        </div>
                                    </Grid.Row>
                                </Grid>
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        )
    }
}

export default FactoryInformationOverlay;