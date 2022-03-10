// Libraries
import React, { PureComponent } from 'react'

// Components
import { Overlay, } from '@influxdata/clockface'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import { TabbedPageTab } from 'src/shared/tabbedPage/TabbedPageTabs'
import UploadModelFile from 'src/objectCreator/components/UploadModelFile';
import ImportModelFile from 'src/objectCreator/components/ImportModelFile';

interface Props {
    visible: boolean
    onClose: () => void
    modelFiles: object[]
    getModelFiles: () => void
    removeNewObjectsFromScene: () => void
    handleSaveImportModel: (model: object) => void
}

interface State {
    activeTab: string
}

class ModelFile extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: "upload",
        };
    }

    private handleOnTabClick = (activeTab) => {
        this.setState({
            activeTab,
        })
    }

    public render() {
        const { activeTab } = this.state;
        const { visible, onClose, modelFiles, removeNewObjectsFromScene, handleSaveImportModel } = this.props;


        const tabs: TabbedPageTab[] = [
            {
                text: 'Upload Model',
                id: 'upload',
            },
            {
                text: 'Import Model',
                id: 'import',
            }
        ]

        return (
            <>
                <Overlay visible={visible}>
                    <Overlay.Container maxWidth={500}>
                        <Overlay.Header
                            title="3D Model File"
                            onDismiss={onClose}
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
                                <UploadModelFile
                                    onDismiss={onClose}
                                    getModelFiles={this.props.getModelFiles}
                                />
                            }

                            {
                                activeTab === "import" &&
                                <ImportModelFile
                                    onDismiss={onClose}
                                    modelFiles={modelFiles}
                                    removeNewObjectsFromScene={removeNewObjectsFromScene}
                                    handleSaveImportModel={handleSaveImportModel}
                                    getModelFiles={this.props.getModelFiles}
                                />
                            }
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        );
    }
}

export default ModelFile;