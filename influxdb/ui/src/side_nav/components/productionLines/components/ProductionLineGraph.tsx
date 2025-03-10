// Libraries
import React, { PureComponent } from 'react'
import ForceGraph2D from "react-force-graph-2d"
import { withSize } from "react-sizeme";
// import * as d3 from "d3";

// Styles
import 'src/style/custom.css'

// Components
import {
    Panel, ComponentSize, TechnoSpinner, RemoteDataState, SpinnerContainer,
} from '@influxdata/clockface'

interface Props {
    productionLine: object
    machineOrders: any[]
}

interface State {
    data: object
    spinnerLoading: RemoteDataState
    selectedGraphType: object
    graphWidth: number
    hoveredNode: object
}

const withSizeHOC = withSize({ monitorWidth: true, monitorHeight: false, noPlaceholder: true })

class ProductionLineGraph extends PureComponent<Props, State> {
    private graphRef: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);

        this.graphRef = React.createRef();

        this.state = {
            data: {
                nodes: [],
                links: [],
            },
            spinnerLoading: RemoteDataState.Loading,
            selectedGraphType: { text: 'Top to down', value: 'lr' },
            graphWidth: 860,
            hoveredNode: {},
        };
    }

    async componentDidMount(): Promise<void> {
        if (this.props.machineOrders.length > 0) {
            await this.createGraph(this.props.machineOrders);
        }
        this.responsiveConfiguration();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.machineOrders !== this.props.machineOrders) {
            this.createGraph(this.props.machineOrders);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.responsiveConfiguration);
    }

    responsiveConfiguration = () => {
        this.setState({
            graphWidth: document.querySelector("#graphDiv").clientWidth - 30
        })
        window.addEventListener('resize', () => {
            if (document.querySelector("#graphDiv") !== null) {
                this.setState({
                    graphWidth: document.querySelector("#graphDiv").clientWidth - 30
                })
            }
        });
    }

    createGraph = async (machineOrders) => {
        const nodes = [];
        const links = [];

        machineOrders.map((machine, index) => {
            nodes.push(Object.assign({
                id: machine["@id"],
                color: "red",
                size: 400,
                symbolType: "circle",
                src: String(machine["@id"]).toLowerCase().includes("robot")
                    ? "../../assets/icons/machine-card-icon.png"
                    : "../../assets/images/graph/machine.jpg",
            }, machine));


            if ((index + 1) !== machineOrders.length) {
                links.push({
                    source: machine["@id"],
                    target: machineOrders[index + 1]["@id"]
                });
            }
        })

        const returnData = {
            nodes,
            links
        }

        this.setState({
            data: returnData,
            spinnerLoading: RemoteDataState.Done
        })

        this.graphRef.zoom(2, 1000);
    }

    onNodeHover = (node, prevNode) => {
        this.setState({
            hoveredNode: {
                "name": node !== null ? node["name"] : "",
                "status": prevNode !== null ? false : true
            }
        })
    }

    render() {
        const {
            data,
            spinnerLoading,
            selectedGraphType,
        } = this.state;


        return (
            <>
                <Panel>
                    <Panel.Header size={ComponentSize.ExtraSmall}>
                    </Panel.Header>
                    <Panel.Body size={ComponentSize.ExtraSmall} id={"graphDiv"}>
                        <SpinnerContainer
                            loading={spinnerLoading}
                            spinnerComponent={<TechnoSpinner />}
                        />
                        <ForceGraph2D
                            ref={element => { this.graphRef = element }}
                            linkColor={() => "rgb(6, 111, 197)"}
                            linkWidth={3}
                            width={this.state.graphWidth}
                            height={200}
                            linkDirectionalParticles={3}
                            linkDirectionalParticleWidth={5}
                            linkDirectionalArrowRelPos={1}
                            dagMode={selectedGraphType['value']}
                            dagLevelDistance={50}
                            graphData={data}
                            onNodeHover={this.onNodeHover}
                            d3VelocityDecay={0.3}
                            nodeCanvasObject={(node, ctx) => {
                                const img = new Image();
                                img.src = node["src"];
                                img.style.padding = "50px"
                                img.style.margin = "50px"
                                ctx.drawImage(img, node.x - 10, node.y - 10, 20, 20);

                                if (node["name"] === this.state.hoveredNode["name"] && this.state.hoveredNode["status"]) {
                                    ctx.font = "8px Arial";
                                    ctx.fillStyle = "white"
                                    // ctx.lineWidth = 4;
                                    // ctx.rect(node.x - 10, node.y - 60, 100, 40);
                                    // ctx.stroke();
                                    ctx.fillText("Material: Material Name", node.x, node.y - 40);
                                    ctx.fillText("Temperature: 30", node.x, node.y - 30);
                                    ctx.fillText("Vibration: 30", node.x, node.y - 20);
                                }
                            }}
                        />
                    </Panel.Body>
                </Panel>
            </>
        );
    }
}

export default withSizeHOC(ProductionLineGraph);