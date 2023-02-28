// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Overlay, Form, ComponentColor, IconFont, ButtonType, Button, QuestionMarkTooltip, Grid,
    Columns, InfluxColors, Input, ComponentStatus,
} from '@influxdata/clockface'
import { ErrorHandling } from 'src/shared/decorators/errors'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import { TabbedPageTab } from 'src/shared/tabbedPage/TabbedPageTabs'

// Constants
import { tipStyle, objectSaveAndSaveAs, } from 'src/shared/constants/tips';
import { generalErrorMessage, generalSuccessMessage } from 'src/shared/copy/notifications'

// Services
import ObjectService from "src/shared/services/ObjectService";

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

interface OwnProps {
    onClose: () => void
    getObjectList: () => void
    visible: boolean
    componentName: string
    newObjects: object[]
}

interface State {
    activeTab: string
    componentName: string
    saveAsComponentName: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

@ErrorHandling
class SaveComponentOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: "save",
            componentName: "",
            saveAsComponentName: "",
        }
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    public componentWillReceiveProps(props) {
        this.setState({ componentName: props.componentName })
    }

    private getNewObjects = (newObjects: object[]): object[] => {
        const objects = [];

        newObjects.forEach((child) => {
            if (child["type"] === 'Mesh') {
                let object = {
                    "isRender": false,
                    "name": child["name"],
                    "geometryType": child["geometry"]["type"],
                    "boxMeasure": child["geometry"]["parameters"],
                    "scale": {
                        "x": child["scale"]["x"],
                        "y": child["scale"]["y"],
                        "z": child["scale"]["z"],
                    },
                    "position": {
                        "x": child["position"]["x"],
                        "y": child["position"]["y"],
                        "z": child["position"]["z"],
                    },
                    "rotate": {
                        "x": child["rotation"]["x"],
                        "y": child["rotation"]["y"],
                        "z": child["rotation"]["z"],
                    },
                    "color": `#${child["material"]["color"].getHexString()}`,
                    "opacity": child["material"]["opacity"],
                    "texture": child["material"]["map"] !== undefined && child["material"]["map"] !== null ? child["material"]["map"]["image"]["currentSrc"] : null,
                }
                objects.push(object);
            } else if (child["type"] === 'ColladaFile') {
                let color;
                let opacity;

                child["traverse"](function (child) {
                    if (child.isMesh) {
                        color = `#${child.material.color.getHexString()}`;
                        opacity = child.material.opacity;
                    }
                })


                let object = {
                    "isRender": false,
                    "name": child["name"],
                    "geometryType": child["type"],
                    "fileName": child["fileName"],
                    "boxMeasure": {
                        "x": child["scale"]["x"],
                        "y": child["scale"]["y"],
                        "z": child["scale"]["z"],
                    },
                    "scale": {
                        "x": child["scale"]["x"],
                        "y": child["scale"]["y"],
                        "z": child["scale"]["z"],
                    },
                    "position": {
                        "x": child["position"]["x"],
                        "y": child["position"]["y"],
                        "z": child["position"]["z"],
                    },
                    "rotate": {
                        "x": child["rotation"]["x"],
                        "y": child["rotation"]["y"],
                        "z": child["rotation"]["z"],
                    },
                    "color": color,
                    "opacity": opacity
                }
                objects.push(object);
            } else if (child["type"] === 'GlbFile') {
                let color;
                let opacity;

                child["traverse"](function (child) {
                    if (child.isMesh) {
                        color = `#${child.material.color.getHexString()}`;
                        opacity = child.material.opacity;
                    }
                })


                let object = {
                    "isRender": false,
                    "name": child["name"],
                    "geometryType": child["type"],
                    "fileName": child["fileName"],
                    "boxMeasure": {
                        "x": child["scale"]["x"],
                        "y": child["scale"]["y"],
                        "z": child["scale"]["z"],
                    },
                    "scale": {
                        "x": child["scale"]["x"],
                        "y": child["scale"]["y"],
                        "z": child["scale"]["z"],
                    },
                    "position": {
                        "x": child["position"]["x"],
                        "y": child["position"]["y"],
                        "z": child["position"]["z"],
                    },
                    "rotate": {
                        "x": child["rotation"]["x"],
                        "y": child["rotation"]["y"],
                        "z": child["rotation"]["z"],
                    },
                    "color": color,
                    "opacity": opacity
                }
                objects.push(object);
            }
        })

        return objects
    }

    private saveComponentObjects = async () => {
        const { newObjects, notify, onClose, getObjectList } = this.props;
        const { componentName } = this.state;

        if (newObjects.length < 1) {
            notify(generalErrorMessage("Please add a new object first"));
            return;
        }

        if (componentName.trim() === "") {
            notify(generalErrorMessage("Component name cannot be empty"));
            return;
        }

        const objects = await this.getNewObjects(newObjects);

        const payload = {
            "name": componentName,
            "children": objects
        }

        const updateResult = await ObjectService.saveComponentObject(payload);

        if (updateResult.summary.code == 200) {
            notify(generalSuccessMessage(updateResult.message.text));
            onClose();
            getObjectList();
            return;
        }

        notify(generalErrorMessage(updateResult.message.text));
    }

    private saveAsComponentObjects = async () => {
        const { newObjects, notify, onClose, getObjectList } = this.props;
        const { saveAsComponentName } = this.state;

        if (newObjects.length < 1) {
            notify(generalErrorMessage("Please add a new object first"));
            return;
        }

        if (saveAsComponentName.trim() === "") {
            notify(generalErrorMessage("Component name cannot be empty"));
            return;
        }

        const objects = await this.getNewObjects(newObjects);

        const payload = {
            "name": saveAsComponentName,
            "children": objects
        }

        console.log(objects);
        console.log(payload);

        const insertResult = await ObjectService.saveAsComponentObject(payload);

        if (insertResult.summary.code == 200) {
            notify(generalSuccessMessage(insertResult.message.text));
            onClose();
            getObjectList();
            this.setState({ componentName: saveAsComponentName, })
            return;
        }

        notify(generalErrorMessage(insertResult.message.text));
    }

    public render() {
        const { visible, onClose } = this.props;
        const { activeTab, componentName, saveAsComponentName } = this.state;

        const tabs: TabbedPageTab[] = [
            {
                text: 'Save',
                id: 'save',
            },
            {
                text: 'Save as',
                id: 'saveas',
            },
        ]

        return (
            <Overlay visible={visible}>
                <Overlay.Container maxWidth={400}>
                    <Overlay.Header
                        title="Save Component"
                        onDismiss={onClose}
                        children={
                            <QuestionMarkTooltip
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"Save Component:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {objectSaveAndSaveAs}
                                </div>}
                            />
                        }
                    />

                    <Overlay.Body>
                        <TabbedPageTabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabClick={(e) => { this.setState({ activeTab: e }) }}
                        />
                        <br />
                        {
                            this.state.activeTab === "save"
                                ? (
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label="Component name">
                                                <Input
                                                    name="componentName"
                                                    placeholder="Component name.."
                                                    onChange={this.handleChangeInput}
                                                    value={componentName}
                                                    status={ComponentStatus.Disabled}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                )
                                : (
                                    <Grid.Row>
                                        <Grid.Column widthXS={Columns.Twelve}>
                                            <Form.Element label="Component name">
                                                <Input
                                                    name="saveAsComponentName"
                                                    placeholder="Component name.."
                                                    onChange={this.handleChangeInput}
                                                    value={saveAsComponentName}
                                                />
                                            </Form.Element>
                                        </Grid.Column>
                                    </Grid.Row>
                                )
                        }
                        <Form>
                            <Form.Footer>
                                <Button
                                    text="Cancel"
                                    icon={IconFont.Remove}
                                    onClick={onClose}
                                />

                                <Button
                                    text="Save"
                                    icon={IconFont.Checkmark}
                                    color={ComponentColor.Success}
                                    type={ButtonType.Submit}
                                    onClick={() => {
                                        activeTab === 'save' ?
                                            this.saveComponentObjects() :
                                            this.saveAsComponentObjects()
                                    }}
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

export default connector(SaveComponentOverlay);
