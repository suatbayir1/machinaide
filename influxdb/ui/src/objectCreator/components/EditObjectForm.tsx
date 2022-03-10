// Libraries
import React, { PureComponent } from 'react'
import uuid from 'uuid';

// Components
import {
    Grid, Columns, Panel, ComponentSize, Form, Input, InputType,
    FlexBox, ColorPicker, Button, ButtonType, IconFont, ComponentColor,
    ComponentStatus, QuestionMarkTooltip, FlexDirection, DapperScrollbars,
    Dropdown, InfluxColors,
} from '@influxdata/clockface'

// Constants
import { tipStyle, objectOpacity, objectTexture, objectUpdateRemove, } from 'src/shared/constants/tips';

type Props = {
    changeObjectProperties: (object?: object) => void
    removeObjectFromScene: (objectName: string) => void
    textures: object[]
}

type State = {
    visibleTexture: boolean
    componentName: string
    boxMeasureX: number
    boxMeasureY: number
    boxMeasureZ: number
    positionX: number
    positionY: number
    positionZ: number
    rotationX: number
    rotationY: number
    rotationZ: number
    color: string
    opacity: number
    selectedTexture: object
    selectedObject: object
    objectName: string
}

class EditObjectForm extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            visibleTexture: true,
            componentName: "",
            boxMeasureX: 0,
            boxMeasureY: 0,
            boxMeasureZ: 0,
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            color: "#eeeff2",
            opacity: 0.1,
            selectedTexture: {},
            selectedObject: {},
            objectName: "",
        }
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    private changeObjectProperties = (): void => {
        const { changeObjectProperties } = this.props;
        const { objectName, selectedTexture, color, opacity } = this.state;

        const object = {
            objectName,
            selectedTexture,
            color,
            opacity,
        }

        changeObjectProperties(object);
    }

    public changeSelectedObject = (cube) => {
        let color;
        let opacity;
        let visibleTexture = true;

        if (cube["type"] === "ColladaFile") {
            cube.traverse(function (child) {
                if (child.isMesh) {
                    color = `#${child.material.color.getHexString()}`;
                    opacity = child.material.opacity;
                }
            })
            visibleTexture = false;
        }

        this.setState({
            visibleTexture,
            selectedObject: cube,
            objectName: cube.name,
            boxMeasureX: cube.scale.x,
            boxMeasureY: cube.scale.y,
            boxMeasureZ: cube.scale.z,
            positionX: cube.position.x,
            positionY: cube.position.y,
            positionZ: cube.position.z,
            rotationX: cube.rotation.x,
            rotationY: cube.rotation.y,
            rotationZ: cube.rotation.z,
            color: cube.material !== undefined
                ? `#${cube.material.color.getHexString()}`
                : color,
            opacity: cube.material !== undefined
                ? cube.material.opacity
                : opacity,
            selectedTexture: cube.texture !== undefined ? cube.texture : {}
        })
    }

    public render(): React.ReactNode {
        const { removeObjectFromScene, textures } = this.props;
        const {
            componentName, boxMeasureX, boxMeasureY, boxMeasureZ, positionX, positionY, positionZ,
            rotationX, rotationY, rotationZ, color, opacity, selectedTexture, objectName, visibleTexture,
        } = this.state;

        const textureList = textures.map(texture => {
            return (
                <Dropdown.Item
                    id={texture['filename']}
                    key={uuid.v4()}
                    value={texture}
                    onClick={(e) => { this.setState({ selectedTexture: e }) }}
                >
                    {texture['filename']}
                </Dropdown.Item>
            )
        })

        return (
            <Panel>
                <Panel.Header size={ComponentSize.ExtraSmall}>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Six}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
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
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Six}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Box Measure">
                                    <FlexBox margin={ComponentSize.Small}>
                                        <Input
                                            name="boxMeasureX"
                                            placeholder="x"
                                            onChange={this.handleChangeInput}
                                            value={boxMeasureX}
                                            type={InputType.Number}
                                            status={ComponentStatus.Disabled}
                                        />

                                        <Input
                                            name="boxMeasureY"
                                            placeholder="y"
                                            onChange={this.handleChangeInput}
                                            value={boxMeasureY}
                                            type={InputType.Number}
                                            status={ComponentStatus.Disabled}
                                        />

                                        <Input
                                            name="boxMeasureZ"
                                            placeholder="z"
                                            onChange={this.handleChangeInput}
                                            value={boxMeasureZ}
                                            type={InputType.Number}
                                            status={ComponentStatus.Disabled}
                                        />
                                    </FlexBox>
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Six}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Position">
                                    <FlexBox margin={ComponentSize.Small}>
                                        <Input
                                            name="positionX"
                                            placeholder="x"
                                            onChange={this.handleChangeInput}
                                            value={positionX}
                                            type={InputType.Number}
                                            status={ComponentStatus.Disabled}
                                        />

                                        <Input
                                            name="positionY"
                                            placeholder="y"
                                            onChange={this.handleChangeInput}
                                            value={positionY}
                                            type={InputType.Number}
                                            status={ComponentStatus.Disabled}
                                        />

                                        <Input
                                            name="positionZ"
                                            placeholder="z"
                                            onChange={this.handleChangeInput}
                                            value={positionZ}
                                            status={ComponentStatus.Disabled}
                                            type={InputType.Number}
                                        />
                                    </FlexBox>
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Six}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Rotation">
                                    <FlexBox margin={ComponentSize.Small}>
                                        <Input
                                            name="rotationX"
                                            placeholder="x"
                                            onChange={this.handleChangeInput}
                                            value={rotationX}
                                            status={ComponentStatus.Disabled}
                                            type={InputType.Number}
                                        />

                                        <Input
                                            name="rotationY"
                                            placeholder="y"
                                            onChange={this.handleChangeInput}
                                            value={rotationY}
                                            status={ComponentStatus.Disabled}
                                            type={InputType.Number}
                                        />

                                        <Input
                                            name="rotationZ"
                                            placeholder="z"
                                            onChange={this.handleChangeInput}
                                            value={rotationZ}
                                            status={ComponentStatus.Disabled}
                                            type={InputType.Number}
                                        />
                                    </FlexBox>
                                </Form.Element>
                            </Grid.Column>
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Six}
                                widthMD={Columns.Twelve}
                                widthLG={Columns.Twelve}
                            >
                                <Form.Element label="Color">
                                    <ColorPicker
                                        color={color}
                                        onChange={(e) => { this.setState({ color: e }) }}
                                    />
                                </Form.Element>
                            </Grid.Column>
                            {
                                visibleTexture &&
                                <Grid.Column
                                    widthXS={Columns.Twelve}
                                    widthSM={Columns.Six}
                                    widthMD={Columns.Twelve}
                                    widthLG={Columns.Twelve}
                                >
                                    <FlexBox margin={ComponentSize.Medium}>
                                        <Form.Element label="Texture">
                                            <Dropdown
                                                button={(active, onClick) => (
                                                    <Dropdown.Button
                                                        active={active}
                                                        onClick={onClick}
                                                        color={ComponentColor.Secondary}
                                                    >
                                                        {
                                                            Object.keys(selectedTexture).length === 0
                                                                ? 'No texture selected'
                                                                : selectedTexture['filename']
                                                        }
                                                    </Dropdown.Button>
                                                )}
                                                menu={onCollapse => (
                                                    <Dropdown.Menu onCollapse={onCollapse}>
                                                        <DapperScrollbars
                                                            autoHide={false}
                                                            autoSizeHeight={true} style={{ maxHeight: '150px' }}
                                                            className="data-loading--scroll-content"
                                                        >
                                                            {
                                                                textureList
                                                            }
                                                        </DapperScrollbars>
                                                    </Dropdown.Menu>
                                                )}
                                            />
                                        </Form.Element>
                                        <QuestionMarkTooltip
                                            style={{ marginTop: '8px' }}
                                            diameter={20}
                                            tooltipStyle={{ width: '400px' }}
                                            color={ComponentColor.Secondary}
                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                <div style={{ color: InfluxColors.Star }}>{"Texture:"}
                                                    <hr style={tipStyle} />
                                                </div>
                                                {objectTexture}
                                            </div>}
                                        />
                                    </FlexBox>
                                </Grid.Column>
                            }
                            <Grid.Column widthSM={Columns.Six}>
                                <Form.Element label="Opacity">
                                    <FlexBox
                                        direction={FlexDirection.Row}
                                        margin={ComponentSize.Small}
                                    >
                                        <Input
                                            name="opacity"
                                            placeholder="Opacity.."
                                            onChange={this.handleChangeInput}
                                            value={opacity}
                                            type={InputType.Number}
                                            maxLength={1}
                                            max={1}
                                            min={0.1}
                                            step={0.1}
                                        />
                                        <QuestionMarkTooltip
                                            diameter={20}
                                            tooltipStyle={{ width: '400px' }}
                                            color={ComponentColor.Secondary}
                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                <div style={{ color: InfluxColors.Star }}>{"Opacity:"}
                                                    <hr style={tipStyle} />
                                                </div>
                                                {objectOpacity}
                                            </div>}
                                        />
                                    </FlexBox>
                                </Form.Element>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Panel.Header>

                <Panel.Body size={ComponentSize.ExtraSmall}>
                    <Grid.Row>
                        <div className="object-creator-info-buttons">
                            <QuestionMarkTooltip
                                diameter={20}
                                tooltipStyle={{ width: '400px' }}
                                color={ComponentColor.Secondary}
                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                    <div style={{ color: InfluxColors.Star }}>{"Update - Remove:"}
                                        <hr style={tipStyle} />
                                    </div>
                                    {objectUpdateRemove}
                                </div>}
                            />
                            <Button
                                text="Remove"
                                onClick={() => { removeObjectFromScene(objectName) }}
                                type={ButtonType.Button}
                                icon={IconFont.Remove}
                                color={ComponentColor.Danger}
                            />
                            <Button
                                text="Update"
                                onClick={this.changeObjectProperties}
                                type={ButtonType.Button}
                                icon={IconFont.Checkmark}
                                color={ComponentColor.Success}
                            />
                        </div>
                    </Grid.Row>
                </Panel.Body>
            </Panel>
        )
    }
}

export default EditObjectForm;