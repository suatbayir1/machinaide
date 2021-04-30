import React, { PureComponent } from 'react'
import AddNewNodeOverlay from "src/dt/components/AddNewNodeOverlay"
import ForceGraph2D from "react-force-graph-2d"
import NLPSearch from 'src/example/NLPSearch'
import { BACKEND } from "src/config";
import 'src/style/custom.css'
import * as d3 from "d3";
import { withSize } from "react-sizeme";
import { history } from 'src/store/history'
import DTService from 'src/shared/services/DTService';
import {
    Panel,
    ComponentSize,
    Form,
    Button,
    Grid,
    Columns,
    ButtonType,
    ComponentColor,
    TechnoSpinner,
    RemoteDataState,
    SpinnerContainer,
    Dropdown,
    IconFont,
    Notification,
    Gradients,
} from '@influxdata/clockface'

interface Props {
    handleNodeClick: () => void
    refreshGeneralInfo: () => void
    refreshVisualizePage: () => void
    changeResultQuery: (payload) => void
    selectedGraphNode: object
    showAllSensorValues: boolean
    refreshGraph: boolean
    orgID: string
}

interface State {
    data: object
    prunedTree: object
    constantData: object
    nodesById: object
    queryParameter: string
    spinnerLoading: RemoteDataState
    constantJsonData: string[]
    selectedGraphType: object
    graphTypeList: object[]
    visibleAddNodeOverlay: boolean
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    currentSensorValue: object[]
    graphWidth: number
}

const withSizeHOC = withSize({ monitorWidth: true, monitorHeight: false, noPlaceholder: true })

class DigitalTwinGraph extends PureComponent<Props, State> {
    private graphRef: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);

        this.graphRef = React.createRef();

        this.state = {
            data: {
                nodes: [],
                links: [],
            },
            prunedTree: {
                nodes: [],
                links: [],
            },
            constantData: {
                nodes: [],
                links: [],
            },
            nodesById: {
                nodes: [],
                links: [],
            },
            queryParameter: "",
            spinnerLoading: RemoteDataState.Loading,
            constantJsonData: [],
            selectedGraphType: { text: 'Top to down', value: 'td' },
            graphTypeList: [
                { text: 'Top to down', value: 'td' },
                { text: 'Bottom to up', value: 'bu' },
                { text: 'Left to right', value: 'lr' },
                { text: 'Right to left', value: 'rl' },
                { text: 'Radial out', value: 'radialout' },
                { text: 'Radial in', value: 'radialin' },
            ],
            visibleAddNodeOverlay: false,
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            currentSensorValue: [],
            graphWidth: 860,
        };
    }

    async componentDidMount(): Promise<void> {
        await this.createGraph();
        this.getRealTimeSensorData();
        this.responsiveConfiguration();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', () => {
            this.setState({
                graphWidth: document.querySelector("#graphDiv").clientWidth - 30
            })
        });
    }

    responsiveConfiguration = () => {
        this.setState({
            graphWidth: document.querySelector("#graphDiv").clientWidth - 30
        })
        window.addEventListener('resize', () => {
            this.setState({
                graphWidth: document.querySelector("#graphDiv").clientWidth - 30
            })
        });
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.refreshGraph !== this.props.refreshGraph) {
            await this.createGraph();
        }

        if (prevProps.showAllSensorValues !== this.props.showAllSensorValues) {
            this.getRealTimeSensorData();
        }
    }

    getRealTimeSensorData = async () => {
        let eventSource = new EventSource(`${BACKEND.API_URL}topic/sensors_data`);

        if (!this.props.showAllSensorValues) {
            eventSource.close();
            return;
        }

        eventSource.onmessage = e => {
            let currentData = JSON.parse(e.data);

            console.log(currentData);

            let tempCurrentSensorValue = this.state.currentSensorValue;

            let found = false;
            tempCurrentSensorValue.forEach(item => {
                if (item["name"] === currentData["name"]) {
                    item["current_value"] = currentData["current_value"];
                    found = true;
                }
            })

            if (!found) {
                tempCurrentSensorValue.push(currentData);
            }

            this.setState({ currentSensorValue: tempCurrentSensorValue });
        }
    }

    createGraph = async () => {
        const graphInfo = await DTService.getAllDT();

        this.setState({
            constantJsonData: graphInfo
        });

        const nodes = [];
        const links = [];

        Object.keys(graphInfo).forEach((factory) => {
            nodes.push(Object.assign({
                id: graphInfo[factory].factoryName,
                color: "blue",
                size: 500,
                src: "../../assets/images/graph/ermetal.png",
                symbolType: "star",
            }, graphInfo[factory]));

            Object.keys(graphInfo[factory].machines).forEach((machine) => {
                nodes.push(Object.assign({
                    id: graphInfo[factory].machines[machine].displayName,
                    color: "red",
                    size: 400,
                    symbolType: "circle",
                    src: "../../assets/images/graph/machine.jpg",
                }, graphInfo[factory].machines[machine]));

                links.push({
                    source: graphInfo[factory].machines[machine].parent,
                    target: graphInfo[factory].machines[machine].displayName
                });

                Object.keys(graphInfo[factory].machines[machine].contents).forEach((component) => {
                    nodes.push(Object.assign({
                        id: graphInfo[factory].machines[machine].contents[component].name,
                        color: "green",
                        size: 300,
                        symbolType: "square",
                        src: "../../assets/images/graph/component.png",
                    }, graphInfo[factory].machines[machine].contents[component]))

                    links.push({
                        source: graphInfo[factory].machines[machine].contents[component].parent,
                        target: graphInfo[factory].machines[machine].contents[component].name
                    })

                    Object.keys(graphInfo[factory].machines[machine].contents[component].sensors).forEach((sensor) => {
                        nodes.push(Object.assign({
                            id: graphInfo[factory].machines[machine].contents[component].sensors[sensor].displayName,
                            color: "orange",
                            size: 300,
                            symbolType: "triangle",
                            src: "../../assets/images/graph/sensor.jpg",
                        }, graphInfo[factory].machines[machine].contents[component].sensors[sensor]))

                        links.push({
                            source: graphInfo[factory].machines[machine].contents[component].sensors[sensor].parent,
                            target: graphInfo[factory].machines[machine].contents[component].sensors[sensor].displayName
                        })
                    })
                })
            })
        })

        const returnData = {
            nodes,
            links
        }

        // Set NodesById for collapse / expand
        const rootId = "Ermetal"
        const nodesById = Object.fromEntries(
            returnData["nodes"].map((node) => [node.id, node])
        );

        returnData["nodes"].forEach((node) => {
            node["collapsed"] = node.id !== rootId;
            node["childLinks"] = [];
        });

        returnData["links"].forEach((link) => {
            nodesById[link.source]["childLinks"].push(link)
        });

        this.setState({
            data: returnData,
            prunedTree: returnData,
            constantData: returnData,
            nodesById: nodesById,
            spinnerLoading: RemoteDataState.Done
        })

        this.graphRef.zoom(3, 1000);
        this.graphRef.d3Force('collide', d3.forceCollide(4))
    }

    onChangeInput = (e) => {
        this.setState({ queryParameter: e.target.value })
    }

    handleQuery = () => {
        let resultQuery = {
            "machines": ["Press030"],
            "components": ["dengeleme", "volan"],
            "sensors": ["sensor1", "sensor2"],
        }

        const machineList = [];
        const componentList = [];
        const sensorList = [];

        this.state.constantJsonData[0]["machines"].forEach(machine => {
            machineList.push(machine["name"]);
            machine["contents"].forEach(component => {
                if (component["@type"] === "Component") {
                    componentList.push(component["name"]);
                    component["sensors"].forEach(sensor => {
                        sensorList.push(sensor["name"]);
                    })
                }
            })
        })

        let searchMachines;
        let searchComponents;
        let searchSensors;

        if (String(resultQuery["machines"]) === "*") {
            searchMachines = machineList;
        } else {
            searchMachines = resultQuery["machines"];
        }

        if (String(resultQuery["components"]) === "*") {
            searchComponents = componentList;
        } else {
            searchComponents = resultQuery["components"];
        }

        if (String(resultQuery["sensors"]) === "*") {
            searchSensors = sensorList;
        } else {
            searchSensors = resultQuery["sensors"];
        }

        this.props.changeResultQuery(resultQuery);

        let nodes = [];
        let links = [];
        let newData = this.state.constantData;
        let queryList = [];

        queryList = queryList.concat(searchMachines, searchComponents, searchSensors)

        newData["nodes"].forEach(node => {
            queryList.forEach(currentNode => {
                let foundNode = false;
                if (node["name"].toLowerCase() === currentNode.toLowerCase()) {
                    nodes.push(node);
                    foundNode = true;
                }

                if (foundNode) {
                    function findParent(node) {
                        let foundParent = "";
                        if (node["parent"] !== undefined) {
                            newData["nodes"].forEach(parentNode => {
                                if (parentNode["id"].toLowerCase() === node["parent"].toLowerCase()) {
                                    foundParent = parentNode
                                }
                            })
                        }
                        return foundParent;
                    }

                    // found parent each node
                    while (true) {
                        let result = getParentNode(node);

                        if (!result) {
                            break;
                        }

                        function getParentNode(node) {
                            let parent = findParent(node);
                            if (parent !== "") {
                                nodes.push(parent);

                                links.push({
                                    source: node["parent"],
                                    target: node["name"]
                                })

                                if (parent["parent"] === undefined) {
                                    return false;
                                } else {
                                    getParentNode(parent);
                                }
                            } else {
                                return false;
                            }
                        }
                    }
                }
            })
        })

        const uniqueNodes = [...new Set(nodes)];
        const uniqueLinks = links.filter(function (a) {
            var key = a.source + '|' + a.target;
            if (!this[key]) {
                this[key] = true;
                return true;
            }
        }, Object.create(null));

        let returnData = {
            nodes: uniqueNodes,
            links: uniqueLinks,
        }

        this.setState({ prunedTree: returnData })
    }

    getPrunedTree = () => {
        const rootId = "Ermetal"
        const nodesById = this.state.nodesById;
        const visibleNodes = [];
        const visibleLinks = [];

        (function traverseTree(node = nodesById[rootId]) {
            visibleNodes.push(node);
            if (node["collapsed"]) return;
            visibleLinks.push(...node["childLinks"]);
            node["childLinks"]
                .map((link) =>
                    typeof link.target === "object" ? link.target : nodesById[link.target]
                )
                .forEach(traverseTree);
        })();

        let visibleData = {
            nodes: visibleNodes,
            links: visibleLinks,
        }

        this.setState({ prunedTree: visibleData });
    };

    handleNodeRightClick = (node) => {
        node.collapsed = !node.collapsed;
        this.getPrunedTree();
    }

    handleChangeGraphType = (selectedGraphType) => {
        this.setState({
            selectedGraphType
        })
    }

    openAddNodeOverlay = () => {
        this.setState({
            visibleAddNodeOverlay: true,
        })
    }

    handleDismissAddNode = () => {
        this.setState({
            visibleAddNodeOverlay: false,
        })
    }

    handleChangeNotification = (type, message) => {
        this.setState({
            notificationVisible: true,
            notificationType: type,
            notificationMessage: message,
        })
    }

    render() {
        const {
            prunedTree,
            spinnerLoading,
            selectedGraphType,
            graphTypeList,
            visibleAddNodeOverlay,
        } = this.state;
        const { handleNodeClick } = this.props;

        const graphTypeMenuList = graphTypeList.map(item => {
            return (
                <Dropdown.Item
                    testID="dropdown-item generate-token--read-write"
                    id={item['value']}
                    key={item['value']}
                    value={item}
                    onClick={this.handleChangeGraphType}
                >
                    {item['text']}
                </Dropdown.Item>
            )
        })

        return (
            <>
                <Panel>
                    <Panel.Header size={ComponentSize.ExtraSmall}>
                        <Form>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <NLPSearch />
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column widthXS={Columns.Twelve}>
                                        <div className="tabbed-page--header-left">
                                            {
                                                ["admin"].includes(localStorage.getItem("userRole")) &&
                                                <Button
                                                    text="Add"
                                                    icon={IconFont.Plus}
                                                    onClick={this.openAddNodeOverlay}
                                                    type={ButtonType.Button}
                                                    color={ComponentColor.Primary}
                                                />
                                            }

                                            <Button
                                                text="View Factory"
                                                icon={IconFont.Pulse}
                                                onClick={() => history.push(`/orgs/${this.props.orgID}/dt/factory-scene`)}
                                                type={ButtonType.Button}
                                                color={ComponentColor.Primary}
                                            />

                                            <Dropdown
                                                testID="dropdown--gen-token"
                                                style={{ width: '125px' }}
                                                button={(active, onClick) => (
                                                    <Dropdown.Button
                                                        active={active}
                                                        onClick={onClick}
                                                        color={ComponentColor.Primary}
                                                        testID="dropdown-button--gen-token"
                                                    >
                                                        {selectedGraphType['text']}
                                                    </Dropdown.Button>
                                                )}
                                                menu={onCollapse => (
                                                    <Dropdown.Menu onCollapse={onCollapse}>
                                                        {
                                                            graphTypeMenuList
                                                        }
                                                    </Dropdown.Menu>
                                                )}
                                            />
                                        </div>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Form>
                    </Panel.Header>
                    <Panel.Body size={ComponentSize.ExtraSmall} id={"graphDiv"}>
                        <SpinnerContainer
                            loading={spinnerLoading}
                            spinnerComponent={<TechnoSpinner />}
                        />
                        <ForceGraph2D
                            ref={element => { this.graphRef = element }}
                            onNodeClick={handleNodeClick}
                            onNodeRightClick={this.handleNodeRightClick}
                            linkColor={() => "rgb(6, 111, 197)"}
                            linkWidth={3}
                            width={this.state.graphWidth}
                            height={600}
                            linkDirectionalParticles={2}
                            linkDirectionalParticleWidth={3}
                            linkDirectionalArrowRelPos={1}
                            dagMode={selectedGraphType['value']}
                            dagLevelDistance={50}
                            graphData={prunedTree}
                            d3VelocityDecay={0.3}
                            nodeCanvasObject={(node, ctx) => {
                                const img = new Image();
                                img.src = node["src"];
                                img.style.padding = "50px"
                                img.style.margin = "50px"

                                // show all sensor values
                                this.props.showAllSensorValues && this.state.currentSensorValue.forEach(item => {
                                    if (item["name"] === node["name"]) {

                                        if (item["current_value"] < node["minValue"]) {
                                            ctx.fillStyle = "yellow"
                                        } else if (item["current_value"] > node["maxValue"]) {
                                            ctx.fillStyle = "red"
                                        } else {
                                            ctx.fillStyle = "white"
                                        }

                                        ctx.font = "4px Arial";
                                        ctx.fillText(String(item["current_value"]), node.x - 2, node.y + 8);

                                    }
                                })


                                if (this.props.selectedGraphNode["name"] === node["name"]) {
                                    ctx.drawImage(img, node.x - 4, node.y - 4, 8, 8);
                                    ctx.strokeStyle = '#f00';
                                    ctx.lineWidth = 1;
                                    ctx.strokeRect(node.x - 4, node.y - 4, 8, 8);

                                    // show only selected sensor value
                                    this.state.currentSensorValue.forEach(item => {
                                        if (item["name"] === node["name"]) {

                                            if (item["current_value"] < node["minValue"]) {
                                                ctx.fillStyle = "yellow"
                                            } else if (item["current_value"] > node["maxValue"]) {
                                                ctx.fillStyle = "red"
                                            } else {
                                                ctx.fillStyle = "white"
                                            }

                                            ctx.font = "4px Arial";
                                            ctx.fillText(String(item["current_value"]), node.x - 2, node.y + 8);
                                        }
                                    })
                                } else {
                                    ctx.drawImage(img, node.x - 4, node.y - 4, 8, 8);
                                }
                            }}
                        />


                        <Notification
                            key={"id"}
                            id={"id"}
                            icon={
                                this.state.notificationType === 'success'
                                    ? IconFont.Checkmark
                                    : IconFont.Alerts
                            }
                            duration={5000}
                            size={ComponentSize.Small}
                            visible={this.state.notificationVisible}
                            gradient={
                                this.state.notificationType === 'success'
                                    ? Gradients.HotelBreakfast
                                    : Gradients.DangerDark
                            }
                            onTimeout={() => this.setState({ notificationVisible: false })}
                            onDismiss={() => this.setState({ notificationVisible: false })}
                        >
                            <span className="notification--message">{this.state.notificationMessage}</span>
                        </Notification>

                        <AddNewNodeOverlay
                            visibleAddNodeOverlay={visibleAddNodeOverlay}
                            handleDismissAddNode={this.handleDismissAddNode}
                            refreshGraph={this.createGraph}
                            refreshGeneralInfo={this.props.refreshGeneralInfo}
                            refreshVisualizePage={this.props.refreshVisualizePage}
                            handleChangeNotification={this.handleChangeNotification}
                        />

                    </Panel.Body>
                </Panel>
            </>
        );
    }
}

export default withSizeHOC(DigitalTwinGraph);