// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'

// Components
import {
    Form, Button, ButtonType, ComponentColor, Overlay, IconFont, Grid, Columns, Icon,
    Input, ComponentSize, QuestionMarkTooltip, FlexBox, SelectDropdown,
    Dropdown, InputType, ComponentStatus,
} from '@influxdata/clockface'

// Services
import AutoMLService from 'src/shared/services/AutoMLService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    generalSuccessMessage,
    generalErrorMessage,
} from 'src/shared/copy/notifications'

interface OwnProps {
    visible: boolean
    onDismiss: () => void
}

interface State {
    tunerTypeList: string[]
    numberOfFeatureList: string[]
    tunerType: string
    nFeatures: string
    optimizer: string
    optimizerValue: string
    optimizerList: object[]
    nEpochs: Number
    optimizers: object
    userRole: string
    roles: string[]
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class AdminSettings extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            tunerTypeList: ["Hyperband", "Random Search", "Bayesian Optimization"],
            numberOfFeatureList: ["n", "1.5n", "2n"],
            tunerType: '',
            nFeatures: '',
            optimizer: '',
            optimizerValue: '',
            optimizerList: [
                { text: 'Accuracy', value: 'accuracy' },
                { text: 'Validation Accuracy', value: 'val_accuracy' },
                { text: 'Loss', value: 'loss' },
                { text: 'Validation Loss', value: 'val_loss' },
                { text: 'Mean Squared Error', value: 'mse' },
                { text: 'AUC (Area Under The Curve)', value: 'auc' },
                { text: 'True Positives', value: 'tp' },
                { text: 'True Negatives', value: 'tn' },
                { text: 'False Positives', value: 'fp' },
                { text: 'False Negatives', value: 'fn' }, { text: 'Precision', value: 'precision' },
                { text: 'Recall', value: 'recall' }
            ],
            optimizers: {
                'accuracy': 'Accuracy',
                'val_accuracy': 'Validation Accuracy',
                'loss': 'Loss',
                'val_loss': 'Validation Loss',
                'mse': 'Mean Squared Error',
                'auc': 'AUC (Area Under The Curve)',
                'tp': 'True Positives',
                'tn': 'True Negatives',
                'fp': 'False Positives',
                'fn': 'False Negatives',
                'precision': 'Precision',
                'recall': 'Recall'
            },
            nEpochs: 0,
            userRole: localStorage.getItem("userRole"),
            roles: ["superadmin", "admin"]
        };
    }

    async componentDidMount() {
        const { optimizers } = this.state;
        const settings = await AutoMLService.getAutomlSettings();

        this.setState({
            tunerType: settings["tunerType"],
            nFeatures: settings["nfeatures"],
            nEpochs: settings["nepochs"],
            optimizerValue: settings["optimizer"],
            optimizer: optimizers[settings["optimizer"]]
        })
    }

    handleChangeNepoch = (e) => {
        if (e.target.value <= 0) {
            this.setState({ nEpochs: 1 });
        }
        else if (e.target.value > 100) {
            this.setState({ nEpochs: 100 });
        }
        else {
            this.setState({ nEpochs: parseInt(e.target.value) });
        }
    };

    handleUpdate = async () => {
        const { tunerType, nFeatures, nEpochs, optimizerValue } = this.state;
        const { notify } = this.props;

        let settings = {
            "tunerType": tunerType,
            "nfeatures": nFeatures,
            "nepochs": nEpochs,
            "optimizer": optimizerValue
        }

        const result = await AutoMLService.updateAutomlSettings(settings);

        if (result.status == 200) {
            notify(generalSuccessMessage("Experiment settings updated successfully"));
        } else {
            notify(generalSuccessMessage("There was an error occurred while updating a settings"));
        }
    }

    isAdmin = () => {
        const { userRole, roles } = this.state;

        return roles.includes(userRole);
    }

    render() {
        const { visible, onDismiss } = this.props;
        const {
            tunerTypeList, tunerType, numberOfFeatureList, nFeatures, optimizer,
            optimizerList, nEpochs
        } = this.state;

        return (
            <>
                <Overlay visible={visible}>
                    <Overlay.Container maxWidth={800}>
                        <Overlay.Header
                            title={"Experiment Settings"}
                            onDismiss={onDismiss}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element
                                            label="Tuner Type:"
                                            labelAddOn={(): JSX.Element => {
                                                return (
                                                    <FlexBox margin={ComponentSize.Small}>
                                                        <QuestionMarkTooltip
                                                            diameter={16}
                                                            color={ComponentColor.Primary}
                                                            tooltipStyle={{ width: '500px', fontSize: '14px' }}
                                                            tooltipContents={'Keras Tuner types that manages the hyperparameter search process, including model creation, training, and evaluation.'}
                                                        />

                                                        <a href="https://keras.io/api/keras_tuner/tuners/" target="_blank">
                                                            <Icon glyph={IconFont.Link} />
                                                        </a>
                                                    </FlexBox>
                                                )
                                            }}
                                        >
                                            <SelectDropdown
                                                options={tunerTypeList}
                                                selectedOption={tunerType}
                                                onSelect={(e) => this.setState({ tunerType: e })}
                                                buttonStatus={
                                                    !this.isAdmin()
                                                        ? ComponentStatus.Disabled
                                                        : ComponentStatus.Default
                                                }
                                            />
                                        </Form.Element>
                                    </Grid.Column>

                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element
                                            label="Numer of Features:"
                                            labelAddOn={(): JSX.Element => {
                                                return (
                                                    <QuestionMarkTooltip
                                                        diameter={16}
                                                        color={ComponentColor.Primary}
                                                        tooltipStyle={{ width: '500px', fontSize: '14px' }}
                                                        tooltipContents={'n is the number of features in the given train data.'}
                                                    />
                                                )
                                            }}
                                        >
                                            <SelectDropdown
                                                options={numberOfFeatureList}
                                                selectedOption={nFeatures}
                                                onSelect={(e) => this.setState({ nFeatures: e })}
                                                buttonStatus={
                                                    !this.isAdmin()
                                                        ? ComponentStatus.Disabled
                                                        : ComponentStatus.Default
                                                }
                                            />
                                        </Form.Element>
                                    </Grid.Column>

                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element
                                            label="Tuner Optimizer:"
                                            labelAddOn={(): JSX.Element => {
                                                return (
                                                    <FlexBox margin={ComponentSize.Small}>
                                                        <QuestionMarkTooltip
                                                            diameter={16}
                                                            color={ComponentColor.Primary}
                                                            tooltipStyle={{ width: '500px', fontSize: '14px' }}
                                                            tooltipContents={'Keras Tuner objective to select the best models based on the objective value.'}
                                                        />

                                                        <a href="https://keras.io/keras_tuner/" target="_blank">
                                                            <Icon glyph={IconFont.Link} />
                                                        </a>
                                                    </FlexBox>
                                                )
                                            }}
                                        >
                                            <Dropdown
                                                button={(active, onClick) => (
                                                    <Dropdown.Button
                                                        active={active}
                                                        onClick={onClick}
                                                        color={ComponentColor.Default}
                                                        status={
                                                            !this.isAdmin()
                                                                ? ComponentStatus.Disabled
                                                                : ComponentStatus.Default
                                                        }
                                                    >
                                                        {optimizer}
                                                    </Dropdown.Button>
                                                )}
                                                menu={onCollapse => (
                                                    <Dropdown.Menu
                                                        onCollapse={onCollapse}
                                                    >
                                                        {
                                                            optimizerList.map((opt, idx) => {
                                                                return (
                                                                    <Dropdown.Item
                                                                        key={idx}
                                                                        value={opt}
                                                                        onClick={(e) => { this.setState({ optimizer: e.text, optimizerValue: e.value }) }}
                                                                    >
                                                                        {opt["text"]}
                                                                    </Dropdown.Item>
                                                                )

                                                            })
                                                        }
                                                    </Dropdown.Menu>
                                                )}
                                            />
                                        </Form.Element>
                                    </Grid.Column>

                                    <Grid.Column widthXS={Columns.Six}>
                                        <Form.Element
                                            label="Number of Epochs:"
                                        >
                                            <Input
                                                name="sMinValue"
                                                placeholder="0"
                                                onChange={this.handleChangeNepoch}
                                                value={String(nEpochs)}
                                                type={InputType.Number}
                                                status={
                                                    !this.isAdmin()
                                                        ? ComponentStatus.Disabled
                                                        : ComponentStatus.Default
                                                }
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>

                                <Form.Footer>
                                    <Button
                                        text="Cancel"
                                        icon={IconFont.Remove}
                                        color={ComponentColor.Danger}
                                        onClick={onDismiss}
                                    />

                                    <Button
                                        text="Save"
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                        onClick={this.handleUpdate}
                                    />
                                </Form.Footer>
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay >
            </>
        );
    }
}


const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(AdminSettings);