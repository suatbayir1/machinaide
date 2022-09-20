// Libraries
import { RouteComponentProps } from 'react-router-dom'
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Components
import {
    Form,
    Button,
    ButtonType,
    ComponentColor,
    Overlay,
    IconFont,
    Grid, Alert,
} from '@influxdata/clockface'

// Services
import DTService from 'src/shared/services/DTService';

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Constants
import {
    addDataFlowSettingSuccessfully,
    addDataFlowSettingFailure,
} from 'src/shared/copy/notifications'

interface OwnProps {
    visible: boolean
    onClose: () => void
    productionLine: object
    getMachineOrders: () => void
}

interface State {
    machines: any[]
    grid: number
    alertVisible: boolean
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & RouteComponentProps & ReduxProps

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};
const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,
    color: 'white',

    // change background colour if dragging
    background: isDragging ? "lightgreen" : "grey",

    // styles we need to apply on draggables
    ...draggableStyle
});
const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? "lightblue" : "lightgrey",
    padding: grid,
    width: '100%',
    maxHeight: 400,
    overflowY: 'scroll'
});


class MachineOrderOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            machines: [],
            grid: 8,
            alertVisible: false
        };

        this.onDragEnd = this.onDragEnd.bind(this);
    }

    onDragEnd(result) {
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        const machines = reorder(
            this.state.machines,
            result.source.index,
            result.destination.index
        );

        this.setState({
            machines
        });
    }

    componentDidMount = async () => {
        await this.machineOrders();
    }

    machineOrders = async () => {
        const { productionLine } = this.props;
        const machines = [];

        const machineOrders = await DTService.getMachineOrders({ "plID": productionLine["id"] });

        // if machine orders not configured then fetch machines from dt
        if (machineOrders.length === 0) {
            const result = await DTService.getAllDT();

            result.map(factory => {
                factory?.productionLines.map(pl => {
                    if (pl["@id"] === productionLine["id"]) {
                        pl?.machines.map(machine => {
                            machines.push(machine);
                        })
                    }
                })
            })

            this.setState({ machines, alertVisible: true });
        } else {
            this.setState({ machines: machineOrders["machines"] });

        }
    }

    save = async () => {
        const { machines } = this.state;
        const { notify, productionLine } = this.props;

        machines.map((machine, index) => {
            machine["rank"] = index + 1;
        })

        const payload = {
            "plID": productionLine["id"],
            machines
        }

        const result = await DTService.saveMachineOrders(payload);

        if (result.summary.code === 200) {
            notify(addDataFlowSettingSuccessfully());
            this.props.onClose();
            this.props.getMachineOrders();
        } else {
            this.props.notify(addDataFlowSettingFailure());
        }
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
                            <Grid.Row>
                                {
                                    this.state.alertVisible &&
                                    <Alert color={ComponentColor.Danger} icon={IconFont.AlertTriangle}>
                                        To adjust the order between the machines, please drag and drop the elements on the list below with the help of the mouse.
                                    </Alert>
                                }
                            </Grid.Row>

                            <Grid.Row>
                                <DragDropContext onDragEnd={this.onDragEnd}>
                                    <Droppable droppableId="droppable">
                                        {(provided, snapshot) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                style={getListStyle(snapshot.isDraggingOver)}
                                            >
                                                {this.state.machines.map((item, index) => (
                                                    <Draggable key={item.name} draggableId={item.name} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={getItemStyle(
                                                                    snapshot.isDragging,
                                                                    provided.draggableProps.style
                                                                )}
                                                            >
                                                                {item.name}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </Grid.Row>

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
                                    onClick={this.save}
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