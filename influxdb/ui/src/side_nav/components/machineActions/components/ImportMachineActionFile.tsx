import React, { PureComponent } from "react";
import {
    Form,
    Button,
    ButtonType,
    ComponentColor,
    Overlay,
    IconFont,
    ComponentSize,
    ConfirmationButton,
    Appearance,
    DapperScrollbars,
    Grid,
    SpinnerContainer,
    TechnoSpinner,
    RemoteDataState,
    WaitingText,
} from '@influxdata/clockface'
import classnames from 'classnames'
import { csvToJSON, xlsxToJSON, fileAnalyzer } from 'src/shared/helpers/FileHelper';
import FactoryService from 'src/shared/services/FactoryService';
import { Link } from "react-router-dom"


interface Props {
    fileTypesToAccept?: string
    containerClass?: string
    submitText: string
    submitOnDrop: boolean
    submitOnUpload: boolean
    compact: boolean
    onCancel?: () => void
    className?: string
    overlay: boolean
    onClose: () => void
    getAllMachineActions: () => void
    setNotificationData: (type, message) => void
    orgID: string
}

interface State {
    inputContent: string
    uploadContent: string | ArrayBuffer
    fileName: string
    dragClass: string
    importContent: string
    errors: object[]
    isFatalError: boolean
    showDownloadReport: boolean
    totalRecordCount: number
    generalIstatistic: object
    showDetail: boolean
    spinnerLoading: RemoteDataState
}

let dragCounter = 0

class ImportMachineActionFile extends PureComponent<Props, State> {
    public static defaultProps = {
        submitText: 'Write this File',
        submitOnDrop: false,
        submitOnUpload: false,
        compact: false,
        className: '',
    }

    private fileInput: HTMLInputElement

    constructor(props: Props) {
        super(props)

        this.state = {
            inputContent: null,
            uploadContent: '',
            fileName: '',
            dragClass: 'drag-none',
            importContent: '',
            errors: [],
            isFatalError: false,
            showDownloadReport: false,
            totalRecordCount: 0,
            generalIstatistic: {},
            showDetail: false,
            spinnerLoading: RemoteDataState.Done,
        }
    }

    public componentDidMount() {
        window.addEventListener('dragover', this.handleWindowDragOver)
        window.addEventListener('drop', this.handleFileDrop)
        window.addEventListener('dragenter', this.handleDragEnter)
        window.addEventListener('dragleave', this.handleDragLeave)
    }

    public componentWillUnmount() {
        window.removeEventListener('dragover', this.handleWindowDragOver)
        window.removeEventListener('drop', this.handleFileDrop)
        window.removeEventListener('dragenter', this.handleDragEnter)
        window.removeEventListener('dragleave', this.handleDragLeave)
    }

    private runFileAnalyzer = async () => {
        let scannedTotalRow = 0;

        this.setState({
            spinnerLoading: RemoteDataState.Loading,
        })

        let currentError = [];
        const { uploadContent } = this.state;
        let result;

        if (this.state.fileName.split('.').pop() === 'csv') {
            result = await csvToJSON(uploadContent);
        } else if (this.state.fileName.split('.').pop() === 'xlsx') {
            result = await xlsxToJSON(uploadContent);
        } else {
            let error = {
                "type": "ERROR",
                "color": "red",
                "text": "ERROR: You can only upload files with .csv or .xlsx extensions.",
            }
            currentError.push(error);
            this.setState({
                errors: currentError,
                spinnerLoading: RemoteDataState.Done,
                isFatalError: true,
            }, () => this.calculateGeneralIstatistics());
            return;
        }

        this.setState({
            totalRecordCount: result.length === 0 ? 0 : result.length - 1,
        })
        let headers = ["machineID", "jobName", "material", "startTime", "endTime", "jobDescription"];
        let required = ["machineID", "jobName", "material", "startTime"];

        const { isFatalError, errors } = await fileAnalyzer(headers, required, result, this.state.fileName);


        // iterate all record and check if record already exists
        result.forEach(async (row, index) => {
            let isErrorLine = false;
            required.forEach(requireKey => {
                if (!Object.keys(row).includes(requireKey)) {
                    isErrorLine = true;
                }
            });

            if (!isErrorLine) {
                if (row["jobName"] !== "" && row["material"] !== "" && row["startTime"] !== "") {
                    let response = await FactoryService.isMachineActionExists(row);
                    console.log(response);
                    if (response.data.summary.code === 409) {
                        let error = {
                            "type": "DUPLICATED",
                            "color": "green",
                            "text": `In line: ${index + 1} DUPLICATED: This machine action record already exists.`
                        }
                        this.setState({
                            errors: [...this.state.errors, error],
                        }, () => this.calculateGeneralIstatistics());
                    }
                }
            }

            scannedTotalRow += 1;

            if (scannedTotalRow === this.state.totalRecordCount) {
                this.setState({
                    spinnerLoading: RemoteDataState.Done,
                })
            }
        });

        this.setState({
            errors,
            isFatalError,
        }, () => this.calculateGeneralIstatistics());
    }

    private calculateGeneralIstatistics = () => {
        let occurences = this.state.errors.reduce(function (r, row) {
            r[row['type']] = ++r[row['type']] || 1;
            return r;
        }, {});

        let result = Object.keys(occurences).map(function (key) {
            return { key: key, value: occurences[key] };
        });

        let obj = {};
        result.forEach(item => {
            obj[item["key"]] = item["value"]
        });

        this.setState({
            generalIstatistic: obj
        })
    }

    private downloadErrors = () => {
        let errors = "";
        this.state.errors.map(error => {
            errors += error["text"] + "\n";
        })

        let fileTitle = this.state.fileName.split(".")[0] + "-errors";
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(errors));
        element.setAttribute('download', fileTitle);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    private handleWriteData = async () => {
        const { uploadContent } = this.state;
        let result;


        if (this.state.fileName.split('.').pop() === 'csv') {
            result = await csvToJSON(uploadContent);
        } else if (this.state.fileName.split('.').pop() === 'xlsx') {
            result = await xlsxToJSON(uploadContent);
        }

        const errorLines = [];
        const requiredList = ["machineID", "jobName", "material", "startTime"];

        result.forEach(async (row, index) => {
            let isErrorLine = false;
            requiredList.forEach(requireKey => {
                if (!Object.keys(row).includes(requireKey)) {
                    isErrorLine = true;
                }
            });

            if (isErrorLine) {
                errorLines.push(index);
            } else {
                if (row["jobName"] !== "" && row["material"] !== "" && row["startTime"] !== "") {
                    await FactoryService.addMachineAction(row);
                }
            }
        });


        this.props.getAllMachineActions();
        this.setState({
            showDownloadReport: true
        })
    }

    private handleWindowDragOver = (event: DragEvent) => {
        event.preventDefault()
    }

    private get fileTypesToAccept(): string {
        const { fileTypesToAccept } = this.props

        if (!fileTypesToAccept) {
            return '*'
        }

        return fileTypesToAccept
    }

    private get containerClass(): string {
        const { dragClass } = this.state
        const { compact, className } = this.props

        return classnames('drag-and-drop', {
            compact,
            [dragClass]: true,
            [className]: className,
        })
    }

    private get infoClass(): string {
        const { uploadContent } = this.state

        return classnames('drag-and-drop--graphic', { success: uploadContent })
    }

    private get dragAreaClass(): string {
        const { uploadContent } = this.state

        return classnames('drag-and-drop--form', { active: !uploadContent })
    }

    private get dragAreaHeader(): JSX.Element {
        const { uploadContent, fileName } = this.state

        if (uploadContent) {
            return <div className="drag-and-drop--header selected">{fileName}</div>
        }

        return (
            <div className="drag-and-drop--header empty">
                Drop a file here or click to upload
            </div>
        )
    }

    private get buttons(): JSX.Element | null {
        const { uploadContent } = this.state
        const { submitText, submitOnDrop } = this.props

        if (!uploadContent) {
            return null
        }

        if (submitOnDrop) {
            return (
                <span className="drag-and-drop--buttons">
                    <Button
                        color={ComponentColor.Default}
                        text="Cancel"
                        size={ComponentSize.Medium}
                        type={ButtonType.Button}
                        onClick={this.handleCancelFile}
                    />
                </span>
            )
        }

        if (this.state.spinnerLoading === RemoteDataState.Done) {
            return (
                <span className="drag-and-drop--buttons">
                    <Button
                        color={ComponentColor.Danger}
                        text="Cancel"
                        type={ButtonType.Submit}
                        onClick={this.handleCancelFile}
                        style={{ width: '125px' }}
                        icon={IconFont.Remove}
                    />
                    {
                        this.state.generalIstatistic["ERROR"] === undefined &&
                        !this.state.isFatalError &&
                        <ConfirmationButton
                            icon={IconFont.Pencil}
                            onConfirm={this.handleSubmit}
                            text={submitText}
                            popoverColor={ComponentColor.Success}
                            popoverAppearance={Appearance.Outline}
                            color={ComponentColor.Success}
                            confirmationLabel="Do you want to continue ?"
                            confirmationButtonColor={ComponentColor.Success}
                            confirmationButtonText="Yes"
                            style={{ width: '125px' }}
                        />
                    }
                </span>
            )
        }
    }

    private handleSubmit = () => {
        this.handleWriteData();
    }

    private handleFileClick = (e: any): void => {
        const file: File = e.currentTarget.files[0]

        if (!file) {
            return
        }

        e.preventDefault()
        e.stopPropagation()

        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = () => {
            this.setState(
                {
                    uploadContent: reader.result,
                    fileName: file.name,
                    showDetail: false,
                    totalRecordCount: 0,
                },
                () => this.submitOnUpload()
            )
        }
    }

    private handleFileDrop = (e: any): void => {
        const file = e.dataTransfer.files[0]
        this.setState({
            dragClass: 'drag-none',
        })

        if (!file) {
            return
        }

        e.preventDefault()
        e.stopPropagation()

        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = () => {
            this.setState(
                {
                    uploadContent: reader.result,
                    fileName: file.name,
                    showDetail: false,
                    totalRecordCount: 0,
                },
                () => this.submitOnDrop()
            )
        }
    }

    private submitOnDrop() {
        this.runFileAnalyzer();
        const { submitOnDrop } = this.props
        if (submitOnDrop) {
            this.handleSubmit()
        }
    }

    private submitOnUpload() {
        this.runFileAnalyzer();
        const { submitOnUpload } = this.props
        if (submitOnUpload) {
            this.handleSubmit()
        }
    }

    private handleFileOpen = (): void => {
        const { uploadContent } = this.state
        if (uploadContent === '') {
            this.fileInput.click()
        }
    }

    private handleCancelFile = (): void => {
        const { onCancel } = this.props
        this.setState({
            uploadContent: '',
            errors: [],
            isFatalError: false,
            generalIstatistic: {},
            showDetail: false,
        })
        this.fileInput.value = ''
        if (onCancel) {
            onCancel()
        }
    }

    private handleDragEnter = (e: DragEvent): void => {
        dragCounter += 1
        e.preventDefault()
        this.setState({ dragClass: 'drag-over' })
    }

    private handleDragLeave = (e: DragEvent): void => {
        dragCounter -= 1
        e.preventDefault()
        if (dragCounter === 0) {
            this.setState({ dragClass: 'drag-none' })
        }
    }

    private onDismissDialog = () => {
        this.setState({
            inputContent: null,
            uploadContent: '',
            fileName: '',
            dragClass: 'drag-none',
            importContent: '',
            errors: [],
            isFatalError: false,
            showDownloadReport: false,
            showDetail: false,
        });
        this.props.onClose();
    }

    render() {
        return (
            <Overlay visible={this.props.overlay}>
                <Overlay.Container maxWidth={600}>
                    <Overlay.Header
                        title="Import Machine Action File"
                        onDismiss={() => { this.onDismissDialog() }}
                    />

                    <DapperScrollbars
                        autoHide={false}
                        autoSizeHeight={true}
                        style={{ maxHeight: '600px' }}
                        className="data-loading--scroll-content"
                    >
                        <Overlay.Body>
                            <Form>
                                <Grid.Row>

                                    {
                                        !this.state.showDownloadReport &&
                                        <div className={this.containerClass}>
                                            <div className={this.dragAreaClass} onClick={this.handleFileOpen}>
                                                {this.dragAreaHeader}
                                                <div className={this.infoClass} />
                                                <input
                                                    type="file"
                                                    data-testid="drag-and-drop--input"
                                                    ref={r => (this.fileInput = r)}
                                                    className="drag-and-drop--input"
                                                    accept={this.fileTypesToAccept}
                                                    onChange={this.handleFileClick}
                                                />
                                                {this.buttons}
                                            </div>
                                        </div>
                                    }

                                    {
                                        <div style={{ marginTop: '20px' }}>
                                            <SpinnerContainer
                                                loading={this.state.spinnerLoading}
                                                spinnerComponent={
                                                    <>
                                                        <TechnoSpinner />
                                                        <WaitingText text="File is scanning" style={{ color: '#34BB55' }} />
                                                    </>
                                                }
                                            >
                                            </SpinnerContainer>
                                        </div>
                                    }


                                    {
                                        this.state.spinnerLoading === RemoteDataState.Done && this.state.errors.length > 0 ? (
                                            <React.Fragment>
                                                <h5>Report of importing {this.state.fileName}:</h5>
                                                <h6 style={{ padding: '0px', margin: '0px' }}>Total
                                                <span style={{ color: 'blue' }}> RECORD </span>
                                                Count: {this.state.totalRecordCount}
                                                </h6>
                                                <h6 style={{ padding: '0px', margin: '0px' }}>Total
                                                <span style={{ color: 'red' }}> ERROR </span>
                                                Count: {this.state.generalIstatistic["ERROR"] !== undefined ? this.state.generalIstatistic["ERROR"] : 0}
                                                </h6>
                                                <h6 style={{ padding: '0px', margin: '0px' }}>
                                                    Total
                                                <span style={{ color: 'yellow' }}> WARNING </span>
                                                Count: {this.state.generalIstatistic["WARNING"] !== undefined ? this.state.generalIstatistic["WARNING"] : 0}
                                                </h6>
                                                <h6 style={{ padding: '0px', margin: '0px' }}>
                                                    Total
                                                <span style={{ color: 'green' }}> DUPLICATED </span>
                                                Count: {this.state.generalIstatistic["DUPLICATED"] !== undefined ? this.state.generalIstatistic["DUPLICATED"] : 0}
                                                </h6>
                                                {
                                                    !this.state.showDownloadReport &&
                                                    <Button
                                                        style={{ marginLeft: '80%' }}
                                                        icon={this.state.showDetail ? IconFont.CaretUp : IconFont.CaretDown}
                                                        color={this.state.showDetail ? ComponentColor.Danger : ComponentColor.Success}
                                                        text={this.state.showDetail ? "Close Detail" : "Open Detail"}
                                                        size={ComponentSize.Small}
                                                        type={ButtonType.Button}
                                                        onClick={() => { this.setState({ showDetail: !this.state.showDetail }) }}
                                                    />
                                                }

                                            </React.Fragment>
                                        ) : null
                                    }

                                    <div id="errorText">
                                        {
                                            !this.state.showDownloadReport && this.state.showDetail && this.state.errors.map((error, idx) => (
                                                <p key={idx} style={{ fontSize: '14px', color: `${error["color"]}`, padding: '0px', margin: '0px' }}>{error["text"]}</p>
                                            ))
                                        }
                                    </div>

                                    {
                                        this.state.showDownloadReport ? (
                                            <React.Fragment>
                                                {/* <h5>Report of importing {this.state.fileName}:</h5> */}
                                                <h6>The records with no errors in the {this.state.fileName} file were imported. You can download the import report via the button below</h6>
                                                <Button
                                                    color={ComponentColor.Primary}
                                                    text="Download Report"
                                                    size={ComponentSize.Small}
                                                    type={ButtonType.Button}
                                                    icon={IconFont.Download}
                                                    style={{ marginLeft: '70%' }}
                                                    onClick={() => { this.downloadErrors() }}
                                                />
                                            </React.Fragment>
                                        ) : null
                                    }

                                    {
                                        this.state.uploadContent === "" &&
                                        <Link color="inherit" to={`/orgs/${this.props.orgID}/user-manual`}>
                                            <Button
                                                color={ComponentColor.Primary}
                                                text="User Manual"
                                                size={ComponentSize.Small}
                                                type={ButtonType.Button}
                                                icon={IconFont.Download}
                                                style={{ 'float': 'right', marginTop: '20px' }}
                                            />
                                        </Link>

                                    }
                                </Grid.Row>

                            </Form>
                        </Overlay.Body>
                    </DapperScrollbars>
                </Overlay.Container>
            </Overlay>
        )
    }
}

export default ImportMachineActionFile;