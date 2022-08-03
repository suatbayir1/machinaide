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
    visible: boolean
    onClose: () => void
    productionLine: object
}

interface State {
    relations: object[]
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

class MachineOrderOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            relations: [],
        };
    }

    componentDidMount = async () => {
        await this.relations();
    }

    relations = async () => {
        const { productionLine } = this.props;
        const result = await DTService.getAllDT();
        const relations = [];

        console.log({ productionLine });

        result.map(factory => {
            factory?.productionLines.map(pl => {
                if (pl["@id"] === productionLine["id"]) {
                    pl?.machines.map(machine => {
                        machine?.contents.map(component => {
                            if (component?.["@type"] === "Relationship") {
                                relations.push(component);
                            }
                        })
                    })
                }
            })
        })

        this.setState({ relations });
    }


    render() {
        const { visible, onClose } = this.props;

        return (
            <Overlay visible={visible}>
                <Overlay.Container maxWidth={400}>
                    <Overlay.Header
                        title={"Machine Orders"}
                        onDismiss={onClose}
                    />

                    <Overlay.Body>
                        <Form>

                            <Form.Footer>
                                <Button
                                    text="Cancel"
                                    icon={IconFont.Remove}
                                    color={ComponentColor.Danger}
                                    onClick={onClose}
                                />

                                <Button
                                    text="Save"
                                    icon={IconFont.Checkmark}
                                    color={ComponentColor.Success}
                                    type={ButtonType.Submit}
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

export default connector(MachineOrderOverlay);