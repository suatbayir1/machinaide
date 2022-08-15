// Libraries
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from 'react-redux'
import i18next from "i18next";

// Components
import {
    Form, Button, IconFont, ComponentColor, ButtonType, Grid, Input,
    Columns, SelectDropdown, TextArea,
} from "@influxdata/clockface"

// Utils
import { handleValidation } from "src/shared/helpers/FormValidator";
import { getAll } from 'src/resources/selectors'

// Types
import { AppState, Bucket, ResourceType } from 'src/types'

// Services
import DTService from "src/shared/services/DTService";

type Props = {
    onDismiss: () => void
    refreshGraph: () => void
    refreshGeneralInfo: () => void
    refreshVisualizePage: () => void
    handleChangeNotification: (type, message) => void
    handleDismissAddNode: () => void
    factoryID: string
}

type State = {
    id: string
    factoryName: string
    bucket: string
    location: string
    description: string
}

type ReduxProps = ConnectedProps<typeof connector>
type IProps = ReduxProps & Props

class CreateFactory extends PureComponent<IProps, State> {
    constructor(props) {
        super(props);

        this.state = {
            id: "",
            factoryName: "",
            bucket: "",
            location: "",
            description: "",
        }
    }

    private clearForm = () => {
        this.setState({
            id: "",
            factoryName: "",
            bucket: "",
            location: "",
            description: "",
        })
    }

    private create = async (): Promise<void> => {
        const { id, factoryName, bucket, location, description } = this.state;
        const {
            handleDismissAddNode, handleChangeNotification, refreshGraph,
            refreshGeneralInfo, refreshVisualizePage
        } = this.props;

        if (id.trim() === "" || factoryName.trim() === "", location.trim() === "") {
            handleChangeNotification('error', "ID, Factory Name and Location cannot be empty");
            return;
        }

        const payload = {
            id,
            factoryName,
            bucket,
            location,
            description,
            "name": id,
            "type": "Factory",
            "productionLines": [],
        }

        const insertResult = await DTService.insertFactory(payload);

        if (insertResult.summary.code === 200) {
            handleDismissAddNode();
            handleChangeNotification('success', insertResult.message.text);
            refreshGraph();
            refreshGeneralInfo();
            refreshVisualizePage();
            this.clearForm();

        } else {
            this.props.handleChangeNotification("error", insertResult.message.text);
        }
    }

    private handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    public render(): JSX.Element {
        const { onDismiss, bucketNames, factoryID } = this.props;
        const { id, factoryName, location, bucket, description } = this.state;

        return (
            <>
                {
                    factoryID.trim() === "" ?
                        <Form>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column widthSM={Columns.Six}>
                                        <Form.Element
                                            label={i18next.t('form.unique_id_name')}
                                            errorMessage={handleValidation(id)}
                                            required={true}
                                        >
                                            <Input
                                                name="id"
                                                placeholder={i18next.t('form.unique_id_name')}
                                                onChange={this.handleChangeInput}
                                                value={id}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column widthSM={Columns.Six}>
                                        <Form.Element
                                            label={i18next.t('dt.factory_name')}
                                            errorMessage={handleValidation(factoryName)}
                                            required={true}
                                        >
                                            <Input
                                                name="factoryName"
                                                placeholder={i18next.t('dt.factory_name')}
                                                onChange={this.handleChangeInput}
                                                value={factoryName}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column widthSM={Columns.Six}>
                                        <Form.Element label="Bucket">
                                            <SelectDropdown
                                                options={bucketNames}
                                                selectedOption={bucket}
                                                onSelect={(e) => this.setState({ bucket: e })}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                    <Grid.Column widthSM={Columns.Six}>
                                        <Form.Element
                                            label={i18next.t('dt.location')}
                                            errorMessage={handleValidation(factoryName)}
                                            required={true}
                                        >
                                            <Input
                                                name="location"
                                                placeholder={i18next.t('dt.location')}
                                                onChange={this.handleChangeInput}
                                                value={location}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthSM={Columns.Twelve}>
                                        <Form.Element label={i18next.t('dt.description')}>
                                            <TextArea
                                                name="description"
                                                value={description}
                                                placeholder={i18next.t('dt.description')}
                                                onChange={this.handleChangeInput}
                                                rows={5}
                                            />
                                        </Form.Element>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>

                            <Form.Footer>
                                <Button
                                    text={i18next.t('button.cancel')}
                                    icon={IconFont.Remove}
                                    onClick={onDismiss}
                                />

                                <Button
                                    text={i18next.t('button.save')}
                                    icon={IconFont.Checkmark}
                                    color={ComponentColor.Success}
                                    type={ButtonType.Submit}
                                    onClick={this.create}
                                />
                            </Form.Footer>
                        </Form>
                        : <h2>{i18next.t('warning.factory_already_created')}</h2>
                }
            </>
        )
    }
}

const mstp = (state: AppState) => {
    const buckets = getAll<Bucket>(state, ResourceType.Buckets)
    const bucketNames = buckets.map(bucket => bucket.name || '')

    return { bucketNames }
}

const connector = connect(mstp, null)

export default connector(CreateFactory)
