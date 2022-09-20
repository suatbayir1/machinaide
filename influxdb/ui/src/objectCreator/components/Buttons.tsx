// Libraries
import React, { PureComponent } from 'react'

// Components
import {
    Grid, Panel, ComponentSize, FlexBox, Button, ButtonType, IconFont, ComponentColor,
    QuestionMarkTooltip, Dropdown, InfluxColors,
} from '@influxdata/clockface'

// Constants
import { tipStyle, objectSelectDT, } from 'src/shared/constants/tips';

type Props = {
    handleClickAddObject: (type: object) => void
    handleChangeDT: (object: object) => void
    handleFileUploadOverlay: () => void
    handleImportComponentToScene: () => void
    handleSaveComponentOverlay: () => void
    handleOpenModelFile: () => void
    selectedDT: object
    dtList: object[]
}

type State = {
    addObjectType: object[]
}

class Buttons extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            addObjectType: [
                { text: 'Add Cube', value: 'cube' },
                { text: 'Add Sphere', value: 'sphere' },
                { text: 'Add Cylinder', value: 'cylinder' },
                { text: 'Add Torus', value: 'torus' },
            ],
        }
    }

    public render(): React.ReactNode {
        const {
            handleClickAddObject, selectedDT, handleChangeDT, handleFileUploadOverlay,
            handleImportComponentToScene, handleSaveComponentOverlay, handleOpenModelFile
        } = this.props;

        const addObjectType = this.state.addObjectType.map(item => {
            return (
                <Dropdown.Item
                    id={item['text']}
                    key={item['text']}
                    value={item}
                    onClick={handleClickAddObject}
                >
                    {item['text']}
                </Dropdown.Item>
            )
        })

        const dtList = this.props.dtList.map(item => {
            return (
                <Dropdown.Item
                    testID="dropdown-item generate-token--read-write"
                    id={item['value']}
                    key={item['value']}
                    value={item}
                    onClick={handleChangeDT}
                >
                    {item['text']}
                </Dropdown.Item>
            )
        })

        return (
            <Panel.Header size={ComponentSize.ExtraSmall}>
                <Grid>
                    <Grid.Row>
                        <FlexBox margin={ComponentSize.Small} className="object-creator-flex-container">
                            <div className="object-creator-left-buttons">
                                <Dropdown
                                    style={{ width: '150px' }}
                                    button={(active, onClick) => (
                                        <Dropdown.Button
                                            icon={IconFont.Plus}
                                            active={active}
                                            onClick={onClick}
                                            color={ComponentColor.Secondary}
                                        >
                                            {"Add Object"}
                                        </Dropdown.Button>
                                    )}
                                    menu={onCollapse => (
                                        <Dropdown.Menu
                                            style={{ maxWidth: '150px' }}
                                            onCollapse={onCollapse}
                                        >
                                            {
                                                addObjectType
                                            }
                                        </Dropdown.Menu>
                                    )}
                                />
                                <Button
                                    text="Texture Upload"
                                    icon={IconFont.Export}
                                    onClick={handleFileUploadOverlay}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Primary}
                                />
                                <Button
                                    text="Model File"
                                    icon={IconFont.Export}
                                    onClick={handleOpenModelFile}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Primary}
                                />
                                <Button
                                    text="Import Component"
                                    icon={IconFont.Import}
                                    onClick={handleImportComponentToScene}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Primary}
                                />
                                <Button
                                    text="Save Component"
                                    icon={IconFont.Checkmark}
                                    onClick={handleSaveComponentOverlay}
                                    type={ButtonType.Button}
                                    color={ComponentColor.Success}
                                />
                            </div>

                            <div className="tabbed-page--header-right">
                                <QuestionMarkTooltip
                                    diameter={20}
                                    tooltipStyle={{ width: '400px' }}
                                    color={ComponentColor.Secondary}
                                    tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                        <div style={{ color: InfluxColors.Star }}>{"Select Digital Twin:"}
                                            <hr style={tipStyle} />
                                        </div>
                                        {objectSelectDT}
                                    </div>}
                                />
                                <Dropdown
                                    style={{ width: '150px' }}
                                    button={(active, onClick) => (
                                        <Dropdown.Button
                                            active={active}
                                            onClick={onClick}
                                            color={ComponentColor.Primary}
                                        >
                                            {selectedDT['text']}
                                        </Dropdown.Button>
                                    )}
                                    menu={onCollapse => (
                                        <Dropdown.Menu
                                            style={{ width: '150px' }}
                                            onCollapse={onCollapse}
                                        >
                                            {
                                                dtList
                                            }
                                        </Dropdown.Menu>
                                    )}
                                />
                            </div>
                        </FlexBox>
                    </Grid.Row>
                </Grid>
            </Panel.Header>
        )
    }
}

export default Buttons;