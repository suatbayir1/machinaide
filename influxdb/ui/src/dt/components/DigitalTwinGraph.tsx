// Libraries
import React, { PureComponent } from 'react'
import ForceGraph2D from "react-force-graph-2d"
import * as d3 from "d3";
import { withSize } from "react-sizeme";
import i18next from "i18next";
import { connect, ConnectedProps } from "react-redux";

// Components
import AddNewNodeOverlay from "src/dt/components/AddNewNodeOverlay";
import NLPSearch from 'src/example/NLPSearch';
import VisualizeSensorDataOverlay from "src/dt/overlays/VisualizeSensorDataOverlay";

// Utilities
import { csvToJSON } from 'src/shared/helpers/FileHelper';

// Css
import 'src/style/custom.css'

// Services
import DTService from 'src/shared/services/DTService';
import FluxService from "src/shared/services/FluxService";

// Actions
import { setOverlayStatus } from 'src/dt/actions/dtActions';

import {
    Panel, ComponentSize, Form, Button, Grid, Columns, ButtonType, ComponentColor, TechnoSpinner,
    RemoteDataState, SpinnerContainer, Dropdown, IconFont, Notification, Gradients,
} from '@influxdata/clockface'

interface OwnProps {
    handleNodeClick: (node) => void
    refreshGeneralInfo: () => void
    refreshVisualizePage: () => void
    changeResultQuery: (payload) => void
    selectedGraphNode: object
    showAllSensorValues: boolean
    refreshGraph: boolean
    orgID: string
    generalInfo: string[]
    show3DScene: boolean
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
    fieldsLastData: object[]
    graphWidth: number
    fields: object[]
    openVisualizeSensorDataOverlay: boolean
    valuesByField: object
}


type ReduxProps = ConnectedProps<typeof connector>
type Props = ReduxProps & OwnProps

const withSizeHOC = withSize({ monitorWidth: true, monitorHeight: false, noPlaceholder: true })

class DigitalTwinGraph extends PureComponent<Props, State> {
    private graphRef: React.RefObject<HTMLInputElement>;
    private intervalID: NodeJS.Timer

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
            selectedGraphType: { text: i18next.t('layout_button.top_to_down'), value: 'td' },
            graphTypeList: [
                { text: i18next.t('layout_button.top_to_down'), value: 'td' },
                { text: i18next.t('layout_button.bottom_to_up'), value: 'bu' },
                { text: i18next.t('layout_button.left_to_right'), value: 'lr' },
                { text: i18next.t('layout_button.right_to_left'), value: 'rl' },
                { text: i18next.t('layout_button.radial_out'), value: 'radialout' },
                { text: i18next.t('layout_button.radial_in'), value: 'radialin' },
            ],
            visibleAddNodeOverlay: false,
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            fieldsLastData: [],
            graphWidth: 860,
            openVisualizeSensorDataOverlay: false,
            fields: [],
            valuesByField: {},
        };
    }

    async componentDidMount(): Promise<void> {
        await this.createGraph();
        // this.getRealTimeSensorData();
        this.responsiveConfiguration();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', () => {
            this.setState({
                graphWidth: document.querySelector("#graphDiv").clientWidth - 30
            })
        });

        clearInterval(this.intervalID);
    }

    responsiveConfiguration = () => {
        this.setState({
            graphWidth: document.querySelector("#graphDiv").clientWidth - 30
        })
        window.addEventListener('resize', () => {
            console.log(document.querySelector("#graphDiv").clientWidth);
            if (document.querySelector("#graphDiv") !== null) {
                this.setState({
                    graphWidth: document.querySelector("#graphDiv").clientWidth - 30
                })
            }
        });
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.refreshGraph !== this.props.refreshGraph) {
            await this.createGraph();

            if (Object.keys(this.props.selectedGraphNode).length > 0) {
                this.state.prunedTree["nodes"].map(n => {
                    if (n["id"] === this.props.selectedGraphNode["id"]) {
                        this.props.handleNodeClick(n);
                    }
                })
            }
        }

        if (prevProps.showAllSensorValues !== this.props.showAllSensorValues && this.props.showAllSensorValues) {
            await clearInterval(this.intervalID);
            this.getRealTimeSensorData();
            this.intervalID = setInterval(() => {
                this.getRealTimeSensorData();
            }, 5000)

        }

        if (prevProps.show3DScene !== this.props.show3DScene) {
            this.setState({
                graphWidth: document.querySelector("#graphDiv").clientWidth - 30
            })
        }
    }

    getRealTimeSensorData = async () => {
        const { fields } = this.state;
        let valuesByField = {};

        const query = `
            from(bucket: "Ermetal")
            |> range(start: -5)
            |> last()
        `

        const csvResult = await FluxService.fluxQuery(this.props.orgID, query);
        const jsonResult = await csvToJSON(csvResult);

        console.log({ jsonResult });
        console.log({ fields });
        for (const field of fields) {
            for (const data of jsonResult) {
                if (data["_measurement"] === field["measurement"] && data["_field"] === field["dataSource"]) {
                    valuesByField[field["name"]] = Number(data["_value"]).toFixed(2)
                }
            }
        }

        this.setState({ valuesByField });
    }

    createGraph = async () => {
        const graphInfo = await DTService.getAllDT();
        const fields = [];

        this.setState({
            constantJsonData: graphInfo
        });

        const nodes = [];
        const links = [];

        graphInfo.map(factory => {
            nodes.push(Object.assign({
                id: factory?.factoryName,
                color: "blue",
                size: 500,
                src: "../../assets/images/graph/ermetal.png",
                symbolType: "star",
            }, factory));

            factory["productionLines"].map(pl => {
                nodes.push(Object.assign({
                    id: pl?.name,
                    color: "red",
                    size: 400,
                    symbolType: "circle",
                    src: "../../assets/images/graph/pl.jpg",
                }, pl));

                links.push({
                    source: pl?.parent,
                    target: pl?.name
                });

                pl["machines"].map(machine => {
                    nodes.push(Object.assign({
                        id: machine?.name,
                        color: "red",
                        size: 400,
                        symbolType: "circle",
                        src: "../../assets/images/graph/machine.jpg",
                    }, machine));

                    links.push({
                        source: machine?.parent,
                        target: machine?.name
                    });

                    machine["contents"].map(component => {
                        if (component["@type"] !== "Component") {
                            return;
                        }

                        nodes.push(Object.assign({
                            id: component?.name,
                            color: "green",
                            size: 300,
                            symbolType: "square",
                            src: "../../assets/images/graph/component.png",
                        }, component))

                        links.push({
                            source: component?.parent,
                            target: component?.name
                        })

                        component["sensors"].map(sensor => {
                            nodes.push(Object.assign({
                                id: sensor?.name,
                                color: "orange",
                                size: 300,
                                symbolType: "triangle",
                                src: "../../assets/images/graph/sensor.jpg",
                            }, sensor))

                            links.push({
                                source: sensor?.parent,
                                target: sensor?.name
                            })

                            sensor["fields"].map(field => {
                                fields.push(field);

                                nodes.push(Object.assign({
                                    id: field?.["name"],
                                    color: "orange",
                                    size: 300,
                                    symbolType: "triangle",
                                    src: "../../assets/images/graph/measurement.jpg",
                                }, field))

                                links.push({
                                    source: field?.parent,
                                    target: field?.name
                                })
                            })
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
            spinnerLoading: RemoteDataState.Done,
            fields,
        })

        await this.initialCameraPosition();
    }

    initialCameraPosition = async () => {
        this.graphRef.zoom(1, 2000);
        this.graphRef.centerAt(0, 0, 2000)
        this.graphRef.d3Force('collide', d3.forceCollide(5));
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

    handleNodeClick = (node) => {
        console.log(this.graphRef);
        console.log(node);
        this.graphRef.centerAt(node.x, node.y, 2000);
        this.graphRef.zoom(3, 2000);
        this.props.handleNodeClick(node);
    }

    render() {
        const {
            prunedTree,
            spinnerLoading,
            selectedGraphType,
            graphTypeList,
            visibleAddNodeOverlay,
        } = this.state;
        // const { handleNodeClick } = this.props;

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
                                        <div className="dt-graph-buttons">
                                            <Button
                                                text={""}
                                                icon={IconFont.Undo}
                                                onClick={this.initialCameraPosition}
                                                type={ButtonType.Button}
                                                color={ComponentColor.Primary}
                                                className="show-only-pc"
                                            />
                                            {
                                                ["admin"].includes(localStorage.getItem("userRole")) &&
                                                <Button
                                                    text={i18next.t('button.add')}
                                                    icon={IconFont.Plus}
                                                    onClick={this.openAddNodeOverlay}
                                                    type={ButtonType.Button}
                                                    color={ComponentColor.Primary}
                                                    className="show-only-pc"
                                                />
                                            }

                                            <Dropdown
                                                testID="dropdown--gen-token"
                                                style={{ width: '150px' }}
                                                button={(active, onClick) => (
                                                    <Dropdown.Button
                                                        active={active}
                                                        onClick={onClick}
                                                        color={ComponentColor.Primary}
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

                                            <Button
                                                text={i18next.t('button.data_sources')}
                                                icon={IconFont.Link}
                                                onClick={() => this.props.setOverlayStatus("data-source")}
                                                type={ButtonType.Button}
                                                color={ComponentColor.Primary}
                                                className="show-only-pc"
                                            />

                                            {this.props.selectedGraphNode["type"] === "Field" ?
                                                <Button
                                                    text={i18next.t('button.show_data_in_chart')}
                                                    icon={IconFont.BarChart}
                                                    type={ButtonType.Button}
                                                    color={ComponentColor.Secondary}
                                                    onClick={() => this.setState({ openVisualizeSensorDataOverlay: true })}
                                                />
                                                : null
                                            }
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
                            onNodeClick={this.handleNodeClick}
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
                                if (this.props.showAllSensorValues && node["type"] === "Field") {
                                    if (this.state.valuesByField[node["name"]] < node["minValue"]) {
                                        ctx.fillStyle = "yellow"
                                    } else if (this.state.valuesByField[node["name"]] > node["maxValue"]) {
                                        ctx.fillStyle = "red"
                                    } else {
                                        ctx.fillStyle = "white"
                                    }

                                    ctx.font = "4px Arial";
                                    ctx.fillText(String(this.state.valuesByField[node["name"]]), node.x - 4, node.y + 8);
                                }

                                if (this.props.selectedGraphNode["name"] === node["name"]) {
                                    ctx.drawImage(img, node.x - 4, node.y - 4, 8, 8);
                                    ctx.strokeStyle = '#f00';
                                    ctx.lineWidth = 1;
                                    ctx.strokeRect(node.x - 4, node.y - 4, 8, 8);
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
                            orgID={this.props.orgID}
                            generalInfo={this.props.generalInfo}
                        />

                        <VisualizeSensorDataOverlay
                            visible={this.state.openVisualizeSensorDataOverlay}
                            onClose={() => this.setState({ openVisualizeSensorDataOverlay: false })}
                            field={this.props.selectedGraphNode}
                            dt={this.state.constantJsonData}
                            orgID={this.props.orgID}
                        />
                    </Panel.Body>
                </Panel>
            </>
        );
    }
}


const mstp = (state) => {
    return {
        visibleDataSourceInformationOverlay: state.dtReducer.visibleDataSourceInformationOverlay,
    };
};

const mdtp = (dispatch) => {
    return {
        setOverlayStatus: (overlayID) => dispatch(setOverlayStatus(overlayID)),
    };
};

const connector = connect(mstp, mdtp)

export default (connector)(withSizeHOC(DigitalTwinGraph));