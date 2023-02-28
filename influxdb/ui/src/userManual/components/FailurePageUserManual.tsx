// Libraries
import React, { PureComponent } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// Components
import {
    Grid, ComponentSize, DapperScrollbars, FlexBox, ComponentColor, ButtonType, IconFont, Button,
} from '@influxdata/clockface'


interface Props { }
interface State {
    numPages: number
    pageNumber: number
}

class FailurePageUserManual extends PureComponent<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            numPages: 1,
            pageNumber: 1,
        };
    }

    onDocumentLoadSuccess = ({ numPages }) => {
        this.setState({
            numPages,
        })
    }

    render() {
        const pageList = [];

        for (let page = 1; page <= this.state.numPages; page++) {
            pageList.push(
                <Page
                    key={page}
                    pageNumber={page}
                    width={window.innerWidth - 450}
                    height={800}
                    renderAnnotationLayer={false}
                    renderInteractiveForms={true}
                />
            );
        }

        return (
            <Grid style={{ marginBottom: '30px', background: '#292933', padding: '20px' }}>
                <Grid.Row style={{ marginTop: '-20px', marginBottom: '10px' }}>
                    <FlexBox margin={ComponentSize.Small}>
                        <h2>Documentation for Import Failure File</h2>
                        <FlexBox.Child grow={2} style={{ marginRight: '10px' }}>
                            <div style={{ float: 'right' }}>
                                <FlexBox margin={ComponentSize.Small}>
                                    <a href='/src/userManual/constants/failurePdf.pdf' download>
                                        <Button
                                            text="Download Documentation"
                                            type={ButtonType.Button}
                                            icon={IconFont.Download}
                                            color={ComponentColor.Primary}
                                        />
                                    </a>
                                </FlexBox>
                            </div>
                        </FlexBox.Child>

                    </FlexBox>
                </Grid.Row>

                <Grid.Row>
                    <DapperScrollbars
                        autoHide={false}
                        autoSizeHeight={true}
                        style={{ maxHeight: '800px' }}
                        className="data-loading--scroll-content"
                    >
                        <Document
                            file="/src/userManual/constants/failurePdf.pdf"
                            onLoadSuccess={this.onDocumentLoadSuccess}
                        >
                            {
                                pageList
                            }
                        </Document>
                    </DapperScrollbars>
                </Grid.Row>
            </Grid >
        )
    }
}

export default FailurePageUserManual;