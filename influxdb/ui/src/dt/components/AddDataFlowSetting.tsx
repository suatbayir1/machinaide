// Libraries
import { RouteComponentProps } from 'react-router-dom'
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form, SelectDropdown,
    Button,
    ButtonType,
    ComponentColor,
    Overlay,
    IconFont,
    Grid,
    Columns,
} from '@influxdata/clockface'

// Services
import DTService from 'src/shared/services/DTService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    addDataFlowSettingSuccessfully,
    pleaseFillInTheFormCompletely,
    generalErrorMessage,
    addDataFlowSettingFailure,
} from 'src/shared/copy/notifications'

interface OwnProps {
    visibleAddDataFlowSetting: boolean
    handleCloseAddDataFLowSetting: () => void
    getDataFlowSettings: () => void
}

interface State {
    machineList: string[]
    source: string
    target: string
    dataFlowSettings: object[]
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class AddUpdateMachineActionOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            machineList: [],
            source: "",
            target: "",
            dataFlowSettings: [],
        };
    }

    componentDidMount = async () => {
        await this.getGeneralInfo();
    }

    getGeneralInfo = async () => {
        const result = await DTService.getGeneralInfo();
        this.setState({ machineList: result?.["machineList"] });
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    validationForm = () => {
        const { source, target } = this.state;

        if (source.trim() === "" || target.trim() === "") {
            this.props.notify(pleaseFillInTheFormCompletely("Source and Target cannot be empty"));
            return false;
        }

        if (source === target) {
            this.props.notify(generalErrorMessage("Source and Target cannot be the same"));
            return false;
        }

        return true;
    }

    saveDataFlowSetting = async () => {
        const { source, target } = this.state;
        const { handleCloseAddDataFLowSetting, notify, getDataFlowSettings } = this.props;

        if (!this.validationForm()) {
            return;
        }

        const payload = {
            "@type": "Relationship",
            "name": `${source}To${target}`,
            "source": source,
            "target": target
        }

        const result = await DTService.addRelationship(payload);

        if (result.data.summary.code === 200) {
            notify(addDataFlowSettingSuccessfully());
            getDataFlowSettings();
            handleCloseAddDataFLowSetting();
        } else {
            this.props.notify(addDataFlowSettingFailure());
        }
    }

    render() {
        const { handleCloseAddDataFLowSetting, visibleAddDataFlowSetting } = this.props;
        const { machineList, source, target } = this.state;

        return (
            <Overlay visible={visibleAddDataFlowSetting}>
                <Overlay.Container maxWidth={400}>
                    <Overlay.Header
                        title={"Add Data Flow Setting"}
                        onDismiss={handleCloseAddDataFLowSetting}
                    />

                    <Overlay.Body>
                        <Form>
                            <Grid.Row >
                                <Grid.Column widthXS={Columns.Twelve}>
                                    <Form.Element label="Source">
                                        <SelectDropdown
                                            options={machineList}
                                            selectedOption={source}
                                            onSelect={(e) => this.setState({ source: e })}
                                        />
                                    </Form.Element>
                                </Grid.Column>

                                <Grid.Column widthXS={Columns.Twelve}>
                                    <Form.Element label="Target">
                                        <SelectDropdown
                                            options={machineList}
                                            selectedOption={target}
                                            onSelect={(e) => this.setState({ target: e })}
                                        />
                                    </Form.Element>
                                </Grid.Column>
                            </Grid.Row>

                            <Form.Footer>
                                <Button
                                    text="Cancel"
                                    icon={IconFont.Remove}
                                    color={ComponentColor.Danger}
                                    onClick={handleCloseAddDataFLowSetting}
                                />

                                <Button
                                    text="Save"
                                    icon={IconFont.Checkmark}
                                    color={ComponentColor.Success}
                                    type={ButtonType.Submit}
                                    onClick={this.saveDataFlowSetting}
                                />
                            </Form.Footer>
                        </Form>
                    </Overlay.Body>
                </Overlay.Container>
            </Overlay>
        );
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(AddUpdateMachineActionOverlay);