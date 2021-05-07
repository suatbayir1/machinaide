// Libraries
import { RouteComponentProps } from 'react-router-dom'
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'

// Components
import {
    Form,
    Overlay,
    Grid,
} from '@influxdata/clockface'
import MaterialsTable from 'src/side_nav/components/machineActions/components/MaterialsTable';
import MaterialsButtons from 'src/side_nav/components/machineActions/components/MaterialsButtons';

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
    visibleMaterialsPage: boolean
    handleDismissMaterialsPage: () => void
    handleOpenAddMaterial: () => void
    getMaterials: () => void
    materials: object[]
    materialRecordEdit: (editRow) => void
    orgID: string
}

interface State {
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class MaterialsPage extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    clearForm = () => {
        this.setState({

        });
    }

    closeOverlay = () => {
        this.props.handleDismissMaterialsPage();
        this.clearForm();
    }

    handleClickSave = async () => {

    }

    render() {
        const { getMaterials, materials } = this.props;

        return (
            <>
                <Overlay visible={this.props.visibleMaterialsPage}>
                    <Overlay.Container maxWidth={1500}>
                        <Overlay.Header
                            title={"Materials Page"}
                            onDismiss={this.closeOverlay}
                        />

                        <Overlay.Body>
                            <Form>
                                <Grid style={{ background: '#292933', padding: '20px' }}>
                                    <MaterialsTable
                                        getMaterials={getMaterials}
                                        materials={materials}
                                        materialRecordEdit={this.props.materialRecordEdit}
                                    />

                                    <MaterialsButtons
                                        materials={materials}
                                        handleOpenAddMaterial={this.props.handleOpenAddMaterial}
                                        getMaterials={this.props.getMaterials}
                                        orgID={this.props.orgID}
                                    />
                                </Grid>
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

export default connector(MaterialsPage);