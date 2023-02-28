// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import uuid from 'uuid'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import { TabbedPageTab } from 'src/shared/tabbedPage/TabbedPageTabs'

// Components
import {
    Overlay, ComponentColor, QuestionMarkTooltip, InfluxColors,
} from '@influxdata/clockface'
import { ErrorHandling } from 'src/shared/decorators/errors'
import TextureUploadForm from 'src/objectCreator/components/TextureUploadForm'
import TextureDeleteForm from 'src/objectCreator/components/TextureDeleteForm'

// Constants
import { tipStyle, addTexture, } from 'src/shared/constants/tips';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

interface OwnProps {
    onClose: () => void
    visible: boolean
    getTextureFiles: () => void
    textures: object[]
}

interface State {
    activeTab: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps

@ErrorHandling
class TextureOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: "upload",
        }
    }

    private get headerChildren(): JSX.Element[] {
        return [
            <QuestionMarkTooltip
                key={uuid.v4()}
                diameter={20}
                tooltipStyle={{ width: '400px' }}
                color={ComponentColor.Secondary}
                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                    <div style={{ color: InfluxColors.Star }}>{"How to add texture:"}
                        <hr style={tipStyle} />
                    </div>
                    {addTexture}
                </div>}
            />
        ]
    }

    private handleOnTabClick = (activeTab) => {
        this.setState({
            activeTab,
        })
    }

    public render() {
        const { visible, onClose, getTextureFiles, textures } = this.props;
        const { activeTab } = this.state;

        const tabs: TabbedPageTab[] = [
            {
                text: 'Upload Texture',
                id: 'upload',
            },
            {
                text: 'Delete Texture',
                id: 'delete',
            }
        ]

        return (
            <Overlay visible={visible}>
                <Overlay.Container maxWidth={400}>
                    <Overlay.Header
                        title="Texture Upload"
                        onDismiss={onClose}
                        children={this.headerChildren}
                    />

                    <Overlay.Body>
                        <TabbedPageTabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabClick={this.handleOnTabClick}
                        />
                        <br />

                        {
                            activeTab === "upload" &&
                            <TextureUploadForm
                                onClose={onClose}
                                getTextureFiles={getTextureFiles}
                            />
                        }

                        {
                            activeTab === "delete" &&
                            <TextureDeleteForm
                                onClose={onClose}
                                textures={textures}
                                getTextureFiles={getTextureFiles}
                            />
                        }
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

export default connector(TextureOverlay);
