// Libraries
import { RouteComponentProps } from 'react-router-dom'
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form,
    Input,
    Button,
    ButtonType,
    ComponentColor,
    Overlay,
    IconFont,
    Grid,
    Columns,
    TextArea,
    InputType,
} from '@influxdata/clockface'

// Services
import FactoryService from 'src/shared/services/FactoryService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    pleaseFillInTheFormCompletely,
    materialAddedSuccessfully,
    materialAddedFailure,
} from 'src/shared/copy/notifications'

interface OwnProps {
    visibleAddMaterial: boolean
    handleDismissAddMaterial: () => void
    getMaterials: () => void
}

interface State {
    materialName: string
    thickness: number
    width: number
    height: number
    materialDescription: string
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class AddMaterialOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            materialName: "",
            thickness: 0,
            width: 0,
            height: 0,
            materialDescription: "",
        };
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    clearForm = () => {
        this.setState({
            materialName: "",
            thickness: 0,
            width: 0,
            height: 0,
            materialDescription: "",
        });
    }

    closeOverlay = () => {
        this.props.handleDismissAddMaterial();
        this.clearForm();
    }

    handleClickSave = async () => {
        if (this.state.materialName === "") {
            this.props.notify(pleaseFillInTheFormCompletely("Material Name cannot be empty."));
            return;
        }

        const payload = {
            "materialName": this.state.materialName,
            "thickness": this.state.thickness,
            "width": this.state.width,
            "height": this.state.height,
            "materialDescription": this.state.materialDescription,
        }

        const result = await FactoryService.addMaterial(payload);

        if (result.data.summary.code !== 200) {
            this.props.notify(materialAddedFailure());
            return;
        }

        this.props.notify(materialAddedSuccessfully());
        this.closeOverlay();
        this.props.getMaterials();
    }

    render() {
        return (
            <>
                <Overlay visible={this.props.visibleAddMaterial}>
                    <Overlay.Container maxWidth={600}>
                        <Overlay.Header
                            title={"Add Material"}
                            onDismiss={this.closeOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid.Row >
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Material Name">
                                                    <Input
                                                        name="materialName"
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.materialName}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Thickness">
                                                    <Input
                                                        name="thickness"
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.thickness}
                                                        type={InputType.Number}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Width">
                                                    <Input
                                                        name="width"
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.width}
                                                        type={InputType.Number}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>

                                            <Grid.Column widthXS={Columns.Six}>
                                                <Form.Element label="Height">
                                                    <Input
                                                        name="height"
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.height}
                                                        type={InputType.Number}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Grid.Row>
                                            <Grid.Column widthXS={Columns.Twelve}>
                                                <Form.Element label="Material Description">
                                                    <TextArea
                                                        rows={5}
                                                        value={this.state.materialDescription}
                                                        onChange={(e) => this.setState({ materialDescription: e.target.value })}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid.Column>
                                </Grid.Row>

                                <Form.Footer>
                                    <Button
                                        text="Cancel"
                                        icon={IconFont.Remove}
                                        onClick={this.closeOverlay}
                                        color={ComponentColor.Danger}
                                    />

                                    <Button
                                        text="Save"
                                        icon={IconFont.Checkmark}
                                        color={ComponentColor.Success}
                                        type={ButtonType.Submit}
                                        onClick={this.handleClickSave}
                                    />
                                </Form.Footer>
                            </Form>
                        </Overlay.Body>
                    </Overlay.Container>
                </Overlay>
            </>
        );
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(AddMaterialOverlay);