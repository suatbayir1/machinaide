// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Overlay, Form, FlexBox, FlexDirection, ComponentSize, ComponentColor,
    IconFont, ButtonType, Button, QuestionMarkTooltip, Grid, DapperScrollbars,
    List, Columns, Gradients, InfluxColors,
} from '@influxdata/clockface'
import { ErrorHandling } from 'src/shared/decorators/errors'

// Constants
import { tipStyle, objectImportComponent, } from 'src/shared/constants/tips';
import { generalErrorMessage, generalSuccessMessage } from 'src/shared/copy/notifications'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Services
import ObjectService from "src/shared/services/ObjectService";

interface OwnProps {
    onClose: () => void
    visible: boolean
    registeredObjectList: object[]
    removeNewObjectsFromScene: () => void
    handleSaveImportComponent: (component: object) => void
    getObjectList: () => void
}

interface State {
    selectedImportObject: object
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

@ErrorHandling
class ImportComponentOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            selectedImportObject: {},
        }
    }

    private handleSaveImportComponent = async () => {
        const { notify, removeNewObjectsFromScene, handleSaveImportComponent } = this.props;
        const { selectedImportObject } = this.state;

        if (Object.keys(selectedImportObject).length === 0) {
            notify(generalErrorMessage("Please select component first"));
            return;
        }

        await removeNewObjectsFromScene();

        if (this.state.selectedImportObject["children"] === undefined) {
            notify(generalErrorMessage("This component does not contain any objects"));
            return;
        }

        await handleSaveImportComponent(selectedImportObject);

        notify(generalSuccessMessage("Component successfully added to the scene"));
    }

    private handleDeleteComponent = async (): Promise<void> => {
        const { notify, getObjectList, onClose } = this.props;
        const { selectedImportObject } = this.state;

        if (Object.keys(selectedImportObject).length === 0) {
            notify(generalErrorMessage("Please select component first"));
            return;
        }

        const result = await ObjectService.deleteComponentModel({ id: selectedImportObject["_id"]["$oid"] });
        if (result.summary.code !== 200) {
            notify(generalErrorMessage(result.message.text));
            return;
        }

        notify(generalSuccessMessage(result.message.text));
        getObjectList();
        onClose();
    }

    public render() {
        const { visible, onClose, registeredObjectList } = this.props;
        const { selectedImportObject } = this.state;

        return (
            <Overlay visible={visible}>
                <Overlay.Container maxWidth={600}>
                    <Overlay.Header
                        title="Import Component"
                        onDismiss={onClose}
                        children={<QuestionMarkTooltip
                            diameter={20}
                            tooltipStyle={{ width: '400px' }}
                            color={ComponentColor.Secondary}
                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                <div style={{ color: InfluxColors.Star }}>{"Import Component:"}
                                    <hr style={tipStyle} />
                                </div>
                                {objectImportComponent}
                            </div>}
                        />}
                    />

                    <Overlay.Body>
                        <Form>
                            <Grid.Row>
                                <Grid.Column widthSM={Columns.Twelve}>
                                    <Form.Element label="Component">
                                        <DapperScrollbars
                                            autoHide={false}
                                            autoSizeHeight={true} style={{ maxHeight: '200px' }}
                                            className="data-loading--scroll-content"
                                        >
                                            <List>
                                                {
                                                    registeredObjectList.map((object) => {
                                                        return (
                                                            <List.Item
                                                                key={object["name"]}
                                                                value={object["name"]}
                                                                onClick={() => {
                                                                    this.setState({
                                                                        selectedImportObject: object,
                                                                    })
                                                                }}
                                                                title={object["name"]}
                                                                gradient={Gradients.GundamPilot}
                                                                wrapText={true}
                                                                selected={selectedImportObject["name"] === object["name"] ? true : false}
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

                            <Form.Footer>
                                <Button
                                    text="Cancel"
                                    icon={IconFont.Remove}
                                    onClick={onClose}
                                />

                                <Button
                                    text="Import"
                                    icon={IconFont.Import}
                                    color={ComponentColor.Success}
                                    type={ButtonType.Submit}
                                    onClick={this.handleSaveImportComponent}
                                />

                                <Button
                                    text="Delete"
                                    icon={IconFont.Trash}
                                    color={ComponentColor.Danger}
                                    type={ButtonType.Submit}
                                    onClick={this.handleDeleteComponent}
                                />
                            </Form.Footer>
                        </Form>
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        )
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(ImportComponentOverlay);
