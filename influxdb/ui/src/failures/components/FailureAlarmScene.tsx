// Libraries
import React, { PureComponent } from "react";

// Components
import {
    RemoteDataState, Columns, Overlay, Grid, ComponentColor,
    Dropdown,
} from '@influxdata/clockface'
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";
import FailureAlarmInformationBox from 'src/failures/components/FailureAlarmInformationBox';

// Services
import DTService from "src/shared/services/DTService";

// Constants
var THREE = require("three");
var OrbitControls = require("three-orbit-controls")(THREE);
var TransformControls = require("three-transform-controls")(THREE);
var initializeDomEvents = require('threex-domevents')
var THREEx = {}
initializeDomEvents(THREE, THREEx)
var camera, controls, scene, renderer, domEvents, transformControl;
var dae, kinematics, kinematicsTween;
var greenColor = "#29a329";
const tweenParameters = {};
const TWEEN = require("@tweenjs/tween.js");

interface Props {
    handleDismissFailureAlarmScene: () => void
    visibleFailureAlarmScene: boolean
    failures: object[]
}

interface State {
    startEndTimeRangeOpen: boolean
    startEndTimeRange: object
    clickedObject: string
    cubeInfo: object,
    constantJsonData: string[]
    spinnerLoading: RemoteDataState
    currentMachine: object
    rightClickedObject: string
    filteredFailures: object[]
}

class FailureAlarmScene extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            startEndTimeRangeOpen: false,
            startEndTimeRange: {
                lower: new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString(),
                upper: new Date(new Date().getTime() + 1000 * 60 * 60 * 24).toISOString(),
            },

            clickedObject: "",
            cubeInfo: [],
            constantJsonData: [],
            spinnerLoading: RemoteDataState.Loading,
            currentMachine: {},
            rightClickedObject: "",
            filteredFailures: [],
        }
    }

    async componentDidMount() {
        await this.handleChangeStartEndTimeRange(this.state.startEndTimeRange);
    }

    async componentDidUpdate(prevProps) {
        if (this.props.visibleFailureAlarmScene && prevProps.visibleFailureAlarmScene !== this.props.visibleFailureAlarmScene) {
            this.setState({
                spinnerLoading: RemoteDataState.Loading
            })
            await this.handleChangeStartEndTimeRange(this.state.startEndTimeRange);
            await this.renderVisualizeData();
            await this.responsiveConfiguration();
            this.setState({
                spinnerLoading: RemoteDataState.Done
            })
            renderer.render(scene, camera);

        }

        if (this.props.visibleFailureAlarmScene && prevProps.failures !== this.props.failures) {
        }
    }

    responsiveConfiguration = () => {
        renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 40, 700);
        renderer.render(scene, camera);

        window.addEventListener('resize', () => {
            renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 40, 700);
        });
    }

    handleOpenStartEndDateRange = (type) => {
        this.setState({ startEndTimeRangeOpen: type })
    }

    handleChangeStartEndTimeRange = (e) => {
        this.setState({
            startEndTimeRangeOpen: false,
            startEndTimeRange: e,
        });

        const { failures } = this.props;

        let lower = new Date(e.lower).getTime();
        let upper = new Date(e.upper).getTime();

        let filteredFailures = failures.filter(failure => {
            let startTime = new Date(failure["startTime"]).getTime();
            let endTime = failure["endTime"] === "" ? new Date().getTime() : new Date(failure["endTime"]).getTime();

            if (startTime >= lower && endTime <= upper) {
                return failure;
            }
        })

        this.setState({ filteredFailures }, () => { this.changeObjectsColorByDateRange() });
    }

    renderVisualizeData = async () => {
        const cubeInfo = await DTService.getAllDT();
        const renderedCubeInfo = await this.renderInitialCubeInfo(cubeInfo);
        this.setState({
            cubeInfo: renderedCubeInfo,
            constantJsonData: cubeInfo,
            currentMachine: cubeInfo[0]["machines"][0],
        })
        this.createSceneAndCamera();
        this.addLightsToScene();
    }

    addLightsToScene = () => {
        // grid
        let grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        grid["name"] = "grid";
        scene.add(grid);

        // lights
        let light = new THREE.HemisphereLight(0xffeeee, 0x111122);
        light["name"] = "light";
        scene.add(light);

        renderer.render(scene, camera);
    }

    getFailureColor = (level) => {
        let failureColor;

        if (level === "acceptable") {
            failureColor = "#0000b3";
        }

        if (level === "major") {
            failureColor = "#e69500";
        }

        if (level === "critical") {
            failureColor = "#b30000";
        }

        return failureColor
    }

    renderInitialCubeInfo = async (payload) => {
        let cubeInfo = JSON.parse(JSON.stringify(payload));
        const { filteredFailures } = this.state;

        let splittedSource;

        await cubeInfo[0]["machines"].forEach(machine => {
            let visible = cubeInfo[0]["machines"][0]["@id"] === machine["@id"] ? true : false;

            machine["contents"].forEach(component => {
                if (component["@type"] === "Component") {
                    if (component["visual"] !== undefined) {
                        component["visual"].forEach(async visual => {
                            visual["visible"] = visible;
                            visual["isRender"] = true;
                            visual["color"] = greenColor;
                        })
                    }

                    component["sensors"].forEach(async sensor => {
                        if (sensor["visual"] !== undefined) {
                            // if visual objects of the sensor consist of more than one object
                            if (sensor["visual"]["children"] !== undefined) {
                                sensor["visual"]["children"].forEach((sensorVisualObject) => {
                                    sensorVisualObject["visible"] = visible;
                                    sensorVisualObject["isRender"] = true;
                                    sensorVisualObject["color"] = greenColor;
                                    sensor["visual"]["isRender"] = true;
                                });
                            } else {
                                // If the visual object of the sensor consists of a single object
                                sensor["visual"]["visible"] = visible;
                                sensor["visual"]["isRender"] = true;
                                sensor["visual"]["color"] = greenColor;
                            }
                        }
                    })
                }
            })
        })



        // color all machine errors
        await filteredFailures.map(failure => {
            splittedSource = failure["sourceName"].split(".");

            if (splittedSource.length === 1) {
                cubeInfo[0]["machines"].forEach(machine => {
                    if (splittedSource[0] === machine["name"]) {
                        machine["contents"].forEach(component => {
                            if (component["@type"] === "Component") {
                                if (component["visual"] !== undefined) {
                                    component["visual"].forEach(async visual => {
                                        visual["color"] = await this.getFailureColor(failure["severity"])
                                    })
                                }

                                component["sensors"].forEach(async sensor => {
                                    if (sensor["visual"] !== undefined) {
                                        // if visual objects of the sensor consist of more than one object
                                        if (sensor["visual"]["children"] !== undefined) {
                                            sensor["visual"]["children"].forEach(async (sensorVisualObject) => {
                                                sensorVisualObject["color"] = await this.getFailureColor(failure["severity"]);
                                            });
                                        } else {
                                            // If the visual object of the sensor consists of a single object
                                            sensor["visual"]["color"] = await this.getFailureColor(failure["severity"]);
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })

        // color all component errors
        await filteredFailures.map(failure => {
            splittedSource = failure["sourceName"].split(".");

            if (splittedSource.length === 2) {
                cubeInfo[0]["machines"].forEach(machine => {
                    machine["contents"].forEach(component => {
                        if (component["@type"] === "Component") {
                            if (splittedSource[1] === component["name"]) {
                                if (component["visual"] !== undefined) {
                                    component["visual"].forEach(async visual => {
                                        visual["color"] = await this.getFailureColor(failure["severity"])
                                    })
                                }

                                component["sensors"].forEach(async sensor => {
                                    if (sensor["visual"] !== undefined) {
                                        // if visual objects of the sensor consist of more than one object
                                        if (sensor["visual"]["children"] !== undefined) {
                                            sensor["visual"]["children"].forEach(async (sensorVisualObject) => {
                                                sensorVisualObject["color"] = await this.getFailureColor(failure["severity"]);
                                            });
                                        } else {
                                            // If the visual object of the sensor consists of a single object
                                            sensor["visual"]["color"] = await this.getFailureColor(failure["severity"]);
                                        }
                                        // sensor["visual"]["color"] = await this.getFailureColor(failure["severity"])
                                    }
                                })
                            }
                        }
                    })
                })
            }
        })

        // color all component sensors
        await filteredFailures.map(failure => {
            splittedSource = failure["sourceName"].split(".");

            if (splittedSource.length === 3) {
                cubeInfo[0]["machines"].forEach(machine => {
                    machine["contents"].forEach(component => {
                        if (component["@type"] === "Component") {
                            component["sensors"].forEach(async sensor => {
                                if (splittedSource[2] === sensor["name"]) {
                                    if (sensor["visual"] !== undefined) {
                                        // if visual objects of the sensor consist of more than one object
                                        if (sensor["visual"]["children"] !== undefined) {
                                            sensor["visual"]["children"].forEach(async (sensorVisualObject) => {
                                                sensorVisualObject["color"] = await this.getFailureColor(failure["severity"]);
                                            });
                                        } else {
                                            // If the visual object of the sensor consists of a single object
                                            sensor["visual"]["color"] = await this.getFailureColor(failure["severity"]);
                                        }
                                    }
                                }
                            })
                        }
                    })
                })
            }
        })
        return cubeInfo;
    }

    createSceneAndCamera = async () => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        camera.position.x = 7.6;
        camera.position.y = 5.3;
        camera.position.z = 6.7;
        camera.rotation.x = -0.2;
        camera.rotation.y = 0.8;
        camera.rotation.z = 0.2;

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(555, 700);

        const element = await document.getElementById("visualizeArea");
        element.appendChild(renderer.domElement);

        // document.getElementById("visualizeArea").appendChild(renderer.domElement);

        domEvents = new THREEx.DomEvents(camera, renderer.domElement)

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZomm = true;
        controls.zoomSpeed = 0.5;
        controls.update();

        // watch camera transform 
        controls.addEventListener("change", () => {
            renderer.render(scene, camera);
        });

        // object moving control
        transformControl = new TransformControls(camera, renderer.domElement);
        transformControl.addEventListener('change', () => {
            renderer.render(scene, camera);
        })
        transformControl.addEventListener('dragging-changed', function (event) {
            controls.enabled = !event.value;
        })

        this.cubeCreator(this.state.cubeInfo[0]);
    }

    cubeCreator(payload) {
        let CubeInfo = payload;
        let wireframe;

        if (CubeInfo === undefined) {
            return;
        }

        if (payload.machines === undefined) {
            CubeInfo = payload[0];
        }

        CubeInfo["machines"].forEach((machine) => {
            if (machine["contents"] !== undefined) {
                machine["contents"].forEach((component) => {
                    if (component["visual"] !== undefined) {
                        component["visual"].forEach((visualObject) => {
                            wireframe = visualObject["isRender"] ? false : true;
                            this.handleAddObjectType(visualObject, wireframe);
                        });

                        component["sensors"].forEach((sensor) => {
                            if (sensor["visual"] !== undefined) {
                                wireframe = sensor["visual"]["isRender"] ? false : true;
                                // if visual objects of the sensor consist of more than one object
                                if (sensor["visual"]["children"] !== undefined) {
                                    sensor["visual"]["children"].forEach((sensorVisualObject) => {
                                        this.handleAddObjectType(sensorVisualObject, wireframe);
                                    });
                                } else {
                                    // If the visual object of the sensor consists of a single object
                                    this.handleAddObjectType(sensor["visual"], wireframe);
                                }
                            }
                        })
                    }
                })
            }
        })
        renderer.render(scene, camera);
    }

    handleAddObjectType = (object, wireframe) => {
        switch (object["geometryType"]) {
            case "BoxGeometry":
                this.addCube(object, wireframe);
                break;
            case "SphereGeometry":
                this.addSphere(object, wireframe);
                break;
            case "CylinderGeometry":
                this.addCylinder(object, wireframe);
                break
            case "TorusGeometry":
                this.addTorus(object, wireframe);
                break;
            case "ColladaFile":
                this.addColladaFile(object, wireframe);
                break;
        }
    }

    addCube(cubeInfo, wireframe) {
        if (typeof cubeInfo !== 'object' || cubeInfo === null) {
            return;
        }

        if (cubeInfo.texture !== undefined && cubeInfo.texture !== null) {
            let geometry = new THREE.BoxGeometry(
                cubeInfo.boxMeasure.width,
                cubeInfo.boxMeasure.height,
                cubeInfo.boxMeasure.depth
            );

            var material;
            var loader = new THREE.TextureLoader();
            let vm = this;

            loader.load(
                cubeInfo.texture,
                function (texture) {
                    material = new THREE.MeshBasicMaterial({
                        map: texture,
                        color: cubeInfo.color
                    });
                    material.transparent = true;
                    material.opacity = cubeInfo.opacity
                    let cube = new THREE.Mesh(geometry, material);

                    cube.scale.x = cubeInfo.scale.x;
                    cube.scale.y = cubeInfo.scale.y;
                    cube.scale.z = cubeInfo.scale.z;

                    cube.position.x = cubeInfo.position.x;
                    cube.position.y = cubeInfo.position.y;
                    cube.position.z = cubeInfo.position.z;
                    cube.name = cubeInfo.name;
                    cube.visible = cubeInfo.visible;

                    vm.addObjectToScene(cube);
                },
                function () {
                },
                function () {
                }
            );
        } else {
            if (cubeInfo.boxMeasure === undefined) {
                return;
            }


            let geometry = new THREE.BoxGeometry(
                cubeInfo.boxMeasure.x,
                cubeInfo.boxMeasure.y,
                cubeInfo.boxMeasure.z
            );
            let material = new THREE.MeshBasicMaterial({
                color: cubeInfo.color
            });

            material.transparent = true;
            material.opacity = cubeInfo.opacity;
            material.wireframe = wireframe;

            let cube = new THREE.Mesh(geometry, material);

            cube.position.x = cubeInfo.position.x;
            cube.position.y = cubeInfo.position.y;
            cube.position.z = cubeInfo.position.z;

            if (cubeInfo.scale !== undefined) {
                cube.scale.x = cubeInfo.scale.x;
                cube.scale.y = cubeInfo.scale.y;
                cube.scale.z = cubeInfo.scale.z;
            }
            cube.name = cubeInfo.name;
            cube.visible = cubeInfo.visible;

            this.addObjectToScene(cube);
        }
    }

    addSphere(cubeInfo, wireframe) {
        if (typeof cubeInfo !== 'object' || cubeInfo === null) {
            return;
        }

        if (cubeInfo.texture !== undefined && cubeInfo.texture !== null) {
            let geometry = new THREE.SphereGeometry(
                cubeInfo.boxMeasure.radius,
                cubeInfo.boxMeasure.widthSegments,
                cubeInfo.boxMeasure.heightSegments
            );

            var material;
            var loader = new THREE.TextureLoader();
            let vm = this;

            loader.load(
                cubeInfo.texture,
                function (texture) {
                    material = new THREE.MeshBasicMaterial({
                        map: texture,
                        color: cubeInfo.color
                    });
                    material.transparent = true;
                    material.opacity = cubeInfo.opacity
                    let cube = new THREE.Mesh(geometry, material);

                    cube.scale.x = cubeInfo.scale.x;
                    cube.scale.y = cubeInfo.scale.y;
                    cube.scale.z = cubeInfo.scale.z;

                    cube.position.x = cubeInfo.position.x;
                    cube.position.y = cubeInfo.position.y;
                    cube.position.z = cubeInfo.position.z;

                    cube.rotation.x = cubeInfo.rotate.x;
                    cube.rotation.y = cubeInfo.rotate.y;
                    cube.rotation.z = cubeInfo.rotate.z;

                    cube.name = cubeInfo.name;

                    vm.addObjectToScene(cube);
                },
                function () {
                },
                function () {
                }
            );
        } else {
            if (cubeInfo.boxMeasure === undefined) {
                return;
            }

            let geometry = new THREE.SphereGeometry(
                cubeInfo.boxMeasure.radius,
                cubeInfo.boxMeasure.widthSegments,
                cubeInfo.boxMeasure.heightSegments
            );
            let material = new THREE.MeshBasicMaterial({
                color: cubeInfo.color
            });

            material.transparent = true;
            material.opacity = cubeInfo.opacity;
            material.wireframe = wireframe;

            let cube = new THREE.Mesh(geometry, material);

            cube.position.x = cubeInfo.position.x;
            cube.position.y = cubeInfo.position.y;
            cube.position.z = cubeInfo.position.z;

            cube.rotation.x = cubeInfo.rotate.x;
            cube.rotation.y = cubeInfo.rotate.y;
            cube.rotation.z = cubeInfo.rotate.z;

            if (cubeInfo.scale !== undefined) {
                cube.scale.x = cubeInfo.scale.x;
                cube.scale.y = cubeInfo.scale.y;
                cube.scale.z = cubeInfo.scale.z;
            }
            cube.name = cubeInfo.name;

            this.addObjectToScene(cube);
        }
    }

    addCylinder(cubeInfo, wireframe) {
        if (typeof cubeInfo !== 'object' || cubeInfo === null) {
            return;
        }

        if (cubeInfo.texture !== undefined && cubeInfo.texture !== null) {
            let geometry = new THREE.CylinderGeometry(
                cubeInfo.boxMeasure.radiusTop,
                cubeInfo.boxMeasure.radiusBottom,
                cubeInfo.boxMeasure.height,
                cubeInfo.boxMeasure.radialSegments,
            );

            var material;
            var loader = new THREE.TextureLoader();
            let vm = this;

            loader.load(
                cubeInfo.texture,
                function (texture) {
                    material = new THREE.MeshBasicMaterial({
                        map: texture,
                        color: cubeInfo.color
                    });
                    material.transparent = true;
                    material.opacity = cubeInfo.opacity
                    let cube = new THREE.Mesh(geometry, material);

                    cube.scale.x = cubeInfo.scale.x;
                    cube.scale.y = cubeInfo.scale.y;
                    cube.scale.z = cubeInfo.scale.z;

                    cube.position.x = cubeInfo.position.x;
                    cube.position.y = cubeInfo.position.y;
                    cube.position.z = cubeInfo.position.z;

                    cube.rotation.x = cubeInfo.rotate.x;
                    cube.rotation.y = cubeInfo.rotate.y;
                    cube.rotation.z = cubeInfo.rotate.z;

                    cube.name = cubeInfo.name;

                    vm.addObjectToScene(cube);
                },
                function () {
                },
                function () {
                }
            );
        } else {
            if (cubeInfo.boxMeasure === undefined) {
                return;
            }

            let geometry = new THREE.CylinderGeometry(
                cubeInfo.boxMeasure.radiusTop,
                cubeInfo.boxMeasure.radiusBottom,
                cubeInfo.boxMeasure.height,
                cubeInfo.boxMeasure.radialSegments,
            );

            let material = new THREE.MeshBasicMaterial({
                color: cubeInfo.color
            });

            material.transparent = true;
            material.opacity = cubeInfo.opacity;
            material.wireframe = wireframe;

            let cube = new THREE.Mesh(geometry, material);

            cube.position.x = cubeInfo.position.x;
            cube.position.y = cubeInfo.position.y;
            cube.position.z = cubeInfo.position.z;

            cube.rotation.x = cubeInfo.rotate.x;
            cube.rotation.y = cubeInfo.rotate.y;
            cube.rotation.z = cubeInfo.rotate.z;

            if (cubeInfo.scale !== undefined) {
                cube.scale.x = cubeInfo.scale.x;
                cube.scale.y = cubeInfo.scale.y;
                cube.scale.z = cubeInfo.scale.z;
            }
            cube.name = cubeInfo.name;

            this.addObjectToScene(cube);
        }
    }

    addTorus(cubeInfo, wireframe) {
        if (typeof cubeInfo !== 'object' || cubeInfo === null) {
            return;
        }

        if (cubeInfo.texture !== undefined && cubeInfo.texture !== null) {
            let geometry = new THREE.TorusGeometry(
                cubeInfo.boxMeasure.radius,
                cubeInfo.boxMeasure.tube,
                cubeInfo.boxMeasure.radialSegments,
                cubeInfo.boxMeasure.tubularSegments,
            );

            var material;
            var loader = new THREE.TextureLoader();
            let vm = this;

            loader.load(
                cubeInfo.texture,
                function (texture) {
                    material = new THREE.MeshBasicMaterial({
                        map: texture,
                        color: cubeInfo.color
                    });
                    material.transparent = true;
                    material.opacity = cubeInfo.opacity
                    let cube = new THREE.Mesh(geometry, material);

                    cube.scale.x = cubeInfo.scale.x;
                    cube.scale.y = cubeInfo.scale.y;
                    cube.scale.z = cubeInfo.scale.z;

                    cube.position.x = cubeInfo.position.x;
                    cube.position.y = cubeInfo.position.y;
                    cube.position.z = cubeInfo.position.z;

                    cube.rotation.x = cubeInfo.rotate.x;
                    cube.rotation.y = cubeInfo.rotate.y;
                    cube.rotation.z = cubeInfo.rotate.z;

                    cube.name = cubeInfo.name;

                    vm.addObjectToScene(cube);
                },
                function () {
                },
                function () {
                }
            );
        } else {
            if (cubeInfo.boxMeasure === undefined) {
                return;
            }

            let geometry = new THREE.TorusGeometry(
                cubeInfo.boxMeasure.radius,
                cubeInfo.boxMeasure.tube,
                cubeInfo.boxMeasure.radialSegments,
                cubeInfo.boxMeasure.tubularSegments,
            );

            let material = new THREE.MeshBasicMaterial({
                color: cubeInfo.color
            });

            material.transparent = true;
            material.opacity = cubeInfo.opacity;
            material.wireframe = wireframe;

            let cube = new THREE.Mesh(geometry, material);

            cube.position.x = cubeInfo.position.x;
            cube.position.y = cubeInfo.position.y;
            cube.position.z = cubeInfo.position.z;

            cube.rotation.x = cubeInfo.rotate.x;
            cube.rotation.y = cubeInfo.rotate.y;
            cube.rotation.z = cubeInfo.rotate.z;

            if (cubeInfo.scale !== undefined) {
                cube.scale.x = cubeInfo.scale.x;
                cube.scale.y = cubeInfo.scale.y;
                cube.scale.z = cubeInfo.scale.z;
            }
            cube.name = cubeInfo.name;

            this.addObjectToScene(cube);
        }
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        renderer.render(scene, camera);
        TWEEN.update();
    }

    setupTween = async () => {
        const duration = THREE.MathUtils.randInt(1000, 5000);
        const target = {};
        for (const prop in kinematics.joints) {
            if (kinematics.joints.hasOwnProperty(prop)) {
                if (!kinematics.joints[prop].static) {
                    const joint = kinematics.joints[prop];
                    const old = tweenParameters[prop];
                    const position = old ? old : joint.zeroPosition;
                    tweenParameters[prop] = position;
                    target[prop] = THREE.MathUtils.randInt(joint.limits.min, joint.limits.max);
                }
            }
        }

        kinematicsTween = new TWEEN.Tween(tweenParameters).to(target, duration).easing(TWEEN.Easing.Quadratic.Out);
        kinematicsTween.onUpdate(function (object) {
            for (const prop in kinematics.joints) {
                if (kinematics.joints.hasOwnProperty(prop)) {
                    if (!kinematics.joints[prop].static) {
                        kinematics.setJointValue(prop, object[prop]);
                    }
                }
            }
        });
        kinematicsTween.start();
        setTimeout(this.setupTween, duration);
    }

    addObjectToScene = (object) => {
        let vm = this;
        scene.add(object);

        domEvents.addEventListener(object, 'click', function () {
            if (object.visible) {
                transformControl.attach(object);
                scene.add(transformControl);
                renderer.render(scene, camera);
            }
        })

        domEvents.addEventListener(object, 'contextmenu', function () {
            if (object.visible) {
                vm.setState({ rightClickedObject: object["name"] });
            }
        })
        renderer.render(scene, camera);
    }

    addColladaFile = async (object, wireframe) => {
        const loader = new ColladaLoader();

        let vm = this;
        await loader.load(`../../assets/images/model/${object["fileName"]}`, async function (collada) {
            dae = collada.scene;
            dae.traverse(function (child) {
                if (child.isMesh) {
                    child.material.flatShading = true;
                    child.material.color.set(object.color);
                }
            });

            dae.scale.x = object["boxMeasure"]["x"];
            dae.scale.y = object["boxMeasure"]["y"];
            dae.scale.z = object["boxMeasure"]["z"];
            dae.position.x = object["position"]["x"];
            dae.position.y = object["position"]["y"];
            dae.position.z = object["position"]["z"];
            dae.name = object["name"];
            dae.visible = object["visible"];
            dae.updateMatrix();
            kinematics = collada.kinematics;

            Object.keys(collada.library.materials).forEach(material => {
                collada.library.materials[material].build.wireframe = wireframe;
            })

            vm.addObjectToScene(dae);
            vm.setupTween();
            vm.animate();
        });
        await renderer.render(scene, camera);
    }

    handleChangeMachine = (machine) => {
        this.setState({ currentMachine: machine });
        let names = [];

        machine["contents"].forEach(component => {
            if (component["@type"] === "Component") {
                if (component["visual"] !== undefined) {
                    component["visual"].forEach(async visual => {
                        names.push(visual["name"]);
                    })
                }

                component["sensors"].forEach(async sensor => {
                    if (sensor["visual"] !== undefined) {
                        // if visual objects of the sensor consist of more than one object
                        if (sensor["visual"]["children"] !== undefined) {
                            sensor["visual"]["children"].forEach(async (sensorVisualObject) => {
                                names.push(sensorVisualObject["name"]);

                            });
                        } else {
                            // If the visual object of the sensor consists of a single object
                            names.push(sensor["visual"]["name"]);
                        }
                    }
                })
            }
        })

        scene.children.map(child => {
            if (["light", "grid"].includes(child["name"])) {
                return;
            }

            if (!names.includes(child["name"])) {
                transformControl.detach(child);
                child["visible"] = false;
                return;
            }
            child["visible"] = true;
        })

        renderer.render(scene, camera);
    }

    changeObjectsColorByDateRange = async () => {
        const { filteredFailures, cubeInfo } = this.state;
        let splittedSource;
        let objects = [];

        if (cubeInfo[0] === undefined) {
            return;
        }

        // color all machine errors
        await filteredFailures.map(failure => {
            splittedSource = failure["sourceName"].split(".");

            if (splittedSource.length === 1) {
                cubeInfo[0]["machines"].forEach(machine => {
                    if (splittedSource[0] === machine["name"]) {
                        machine["contents"].forEach(component => {
                            if (component["@type"] === "Component") {
                                if (component["visual"] !== undefined) {
                                    component["visual"].forEach(async visual => {
                                        objects.push({ "name": visual["name"], "color": await this.getFailureColor(failure["severity"]) });
                                    })
                                }

                                component["sensors"].forEach(async sensor => {
                                    if (sensor["visual"] !== undefined) {
                                        if (sensor["visual"]["children"] !== undefined) {
                                            sensor["visual"]["children"].forEach(async (sensorVisualObject) => {
                                                objects.push({
                                                    "name": sensorVisualObject["name"],
                                                    "color": await this.getFailureColor(failure["severity"])
                                                });
                                            });
                                        } else {
                                            objects.push({
                                                "name": sensor["visual"]["name"],
                                                "color": await this.getFailureColor(failure["severity"])
                                            });
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })

        // color all component errors
        await filteredFailures.map(failure => {
            splittedSource = failure["sourceName"].split(".");

            if (splittedSource.length === 2) {
                cubeInfo[0]["machines"].forEach(machine => {
                    machine["contents"].forEach(component => {
                        if (component["@type"] === "Component") {
                            if (splittedSource[1] === component["name"]) {
                                if (component["visual"] !== undefined) {
                                    component["visual"].forEach(async visual => {
                                        objects.push({ "name": visual["name"], "color": await this.getFailureColor(failure["severity"]) });
                                    })
                                }

                                component["sensors"].forEach(async sensor => {
                                    if (sensor["visual"] !== undefined) {
                                        if (sensor["visual"]["children"] !== undefined) {
                                            sensor["visual"]["children"].forEach(async (sensorVisualObject) => {
                                                objects.push({
                                                    "name": sensorVisualObject["name"],
                                                    "color": await this.getFailureColor(failure["severity"])
                                                });
                                            });
                                        } else {
                                            objects.push({
                                                "name": sensor["visual"]["name"],
                                                "color": await this.getFailureColor(failure["severity"])
                                            });
                                        }
                                    }
                                })
                            }
                        }
                    })
                })
            }
        })

        // color all component sensors
        await filteredFailures.map(failure => {
            splittedSource = failure["sourceName"].split(".");

            if (splittedSource.length === 3) {
                cubeInfo[0]["machines"].forEach(machine => {
                    machine["contents"].forEach(component => {
                        if (component["@type"] === "Component") {
                            component["sensors"].forEach(async sensor => {
                                if (splittedSource[2] === sensor["name"]) {
                                    if (sensor["visual"] !== undefined) {
                                        if (sensor["visual"]["children"] !== undefined) {
                                            sensor["visual"]["children"].forEach(async (sensorVisualObject) => {
                                                objects.push({
                                                    "name": sensorVisualObject["name"],
                                                    "color": await this.getFailureColor(failure["severity"])
                                                });
                                            });
                                        } else {
                                            objects.push({
                                                "name": sensor["visual"]["name"],
                                                "color": await this.getFailureColor(failure["severity"])
                                            });
                                        }
                                    }
                                }
                            })
                        }
                    })
                })
            }
        })


        let uniqueObjects = [];
        let founded;

        objects.forEach(object => {
            founded = false;

            uniqueObjects.forEach(uniqueObject => {
                if (object["name"] === uniqueObject["name"]) {
                    uniqueObject["color"] = object["color"];
                    founded = true;
                    return;
                }
            })

            if (!founded) {
                uniqueObjects.push(object);
            }
        });

        await this.setAllObjectsGreen();

        await scene.children.map(child => {
            uniqueObjects.map(object => {
                if (child["name"] === object["name"]) {
                    // if child has material 
                    if (child.material !== undefined) {
                        child.material.color.set(object.color);
                    } else {
                        child.traverse(function (child) {
                            if (child.isMesh) {
                                child.material.flatShading = true;
                                child.material.color.set(object.color);
                            }
                        });
                    }
                }
            })
        })

        renderer.render(scene, camera);
    }

    setAllObjectsGreen = async () => {
        await scene.children.map(child => {
            if (["light", "grid"].includes(child["name"])) {
                return;
            }

            if (child.material !== undefined) {
                child.material.color.set(greenColor);
            } else {
                child.traverse(function (child) {
                    if (child.isMesh) {
                        child.material.flatShading = true;
                        child.material.color.set(greenColor);
                    }
                });
            }
        })
    }

    private get headerChildren(): JSX.Element[] {
        const { constantJsonData, currentMachine } = this.state;

        if (constantJsonData[0] === undefined) {
            return;
        }

        return [
            < Dropdown
                key="changeMachineDropdown"
                style={{ width: '150px' }}
                button={(active, onClick) => (
                    <Dropdown.Button
                        active={active}
                        onClick={onClick}
                        color={ComponentColor.Default}
                    >
                        {currentMachine["name"]}
                    </Dropdown.Button>
                )}
                menu={onCollapse => (
                    <Dropdown.Menu
                        onCollapse={onCollapse}
                    >
                        {
                            constantJsonData[0]["machines"].map((machine, idx) =>
                                <Dropdown.Item
                                    key={idx}
                                    value={machine}
                                    onClick={this.handleChangeMachine}
                                >
                                    {machine["name"]}
                                </Dropdown.Item>
                            )
                        }
                    </Dropdown.Menu>
                )}
            />
        ]
    }

    public render() {
        const { visibleFailureAlarmScene, handleDismissFailureAlarmScene } = this.props;
        const {
            rightClickedObject,
            constantJsonData,
            filteredFailures,
            currentMachine,
            startEndTimeRangeOpen,
            startEndTimeRange,
        } = this.state;

        return (
            <>
                <Overlay visible={visibleFailureAlarmScene}>
                    <Overlay.Container maxWidth={1500}>
                        <Overlay.Header
                            title="Failure Alarm Scene"
                            onDismiss={handleDismissFailureAlarmScene}
                            children={this.headerChildren}
                        />
                        <Overlay.Body>
                            <Grid.Row>
                                <Grid.Column
                                    id={"visualizeGraph"}
                                    widthXS={Columns.Twelve}
                                    widthSM={Columns.Eight}
                                    widthMD={Columns.Nine}
                                    widthLG={Columns.Nine}
                                >
                                    <div id="visualizeArea"></div>
                                </Grid.Column>

                                <Grid.Column
                                    widthXS={Columns.Twelve}
                                    widthSM={Columns.Four}
                                    widthMD={Columns.Three}
                                    widthLG={Columns.Three}
                                >
                                    <FailureAlarmInformationBox
                                        selectedObject={rightClickedObject}
                                        failures={filteredFailures}
                                        objects={constantJsonData}
                                        currentMachine={currentMachine}
                                        handleOpenStartEndDateRange={this.handleOpenStartEndDateRange}
                                        handleChangeStartEndTimeRange={this.handleChangeStartEndTimeRange}
                                        startEndTimeRangeOpen={startEndTimeRangeOpen}
                                        startEndTimeRange={startEndTimeRange}
                                    />
                                </Grid.Column>
                            </Grid.Row>
                        </Overlay.Body>

                    </Overlay.Container>
                </Overlay>
            </>
        );
    }
}

export default FailureAlarmScene;
