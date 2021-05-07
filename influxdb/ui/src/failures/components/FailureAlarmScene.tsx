// Libraries
import React, { PureComponent } from "react";

// Components
import {
    RemoteDataState,
    Overlay,
} from '@influxdata/clockface'
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";

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
const tweenParameters = {};
const TWEEN = require("@tweenjs/tween.js");

interface Props {
    handleDismissFailureAlarmScene: () => void
    visibleFailureAlarmScene: boolean
    failures: object[]
}

interface State {
    clickedObject: string
    cubeInfo: object,
    constantJsonData: string[]
    spinnerLoading: RemoteDataState
}

class FailureAlarmScene extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            clickedObject: "",
            cubeInfo: [],
            constantJsonData: [],
            spinnerLoading: RemoteDataState.Loading
        }
    }

    async componentDidUpdate(prevProps) {
        if (this.props.visibleFailureAlarmScene && prevProps.visibleFailureAlarmScene !== this.props.visibleFailureAlarmScene) {
            await this.renderVisualizeData();
            await this.responsiveConfiguration();
        }
    }

    responsiveConfiguration = () => {
        renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 40, 700);
        renderer.render(scene, camera);

        window.addEventListener('resize', () => {
            renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 40, 700);
        });
    }

    renderVisualizeData = async () => {
        const cubeInfo = await DTService.getAllDT();
        const renderedCubeInfo = await this.renderInitialCubeInfo(cubeInfo);
        this.setState({
            cubeInfo: renderedCubeInfo,
            constantJsonData: cubeInfo,
            spinnerLoading: RemoteDataState.Done
        })
        this.createSceneAndCamera();
        this.addLightsToScene();
    }

    addLightsToScene = () => {
        // grid
        const grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        scene.add(grid);

        // lights
        const light = new THREE.HemisphereLight(0xffeeee, 0x111122);
        scene.add(light);

        renderer.render(scene, camera);
    }

    getFailureColor = (level) => {
        let failureColor;

        if (level === "acceptable") {
            failureColor = "blue";
        }

        if (level === "major") {
            failureColor = "orange";
        }

        if (level === "critical") {
            failureColor = "red";
        }

        return failureColor
    }

    renderInitialCubeInfo = async (payload) => {
        let cubeInfo = JSON.parse(JSON.stringify(payload));
        const { failures } = this.props;
        let splittedSource;

        // color all machine errors
        await failures.map(failure => {
            splittedSource = failure["sourceName"].split(".");

            if (splittedSource.length === 1) {
                cubeInfo[0]["machines"].forEach(machine => {
                    if (splittedSource[0] === machine["name"]) {
                        machine["contents"].forEach(component => {
                            if (component["@type"] === "Component") {
                                if (component["visual"] !== undefined) {
                                    component["visual"].forEach(async visual => {
                                        visual["isRender"] = true;
                                        visual["color"] = await this.getFailureColor(failure["severity"])
                                    })
                                }

                                component["sensors"].forEach(async sensor => {
                                    if (sensor["visual"] !== undefined) {
                                        sensor["visual"]["isRender"] = true;
                                        sensor["visual"]["color"] = await this.getFailureColor(failure["severity"])
                                    }
                                })
                            }
                        })
                    } else {
                        machine["contents"].forEach(component => {
                            if (component["@type"] === "Component") {
                                if (component["visual"] !== undefined) {
                                    component["visual"].forEach(visual => {
                                        visual["isRender"] = true;
                                        visual["color"] = "#29a329";
                                    })
                                }

                                component["sensors"].forEach(sensor => {
                                    if (sensor["visual"] !== undefined) {
                                        sensor["visual"]["isRender"] = true;
                                        sensor["visual"]["color"] = "#29a329";
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })

        // color all component errors
        await failures.map(failure => {
            splittedSource = failure["sourceName"].split(".");

            if (splittedSource.length === 2) {
                cubeInfo[0]["machines"].forEach(machine => {
                    machine["contents"].forEach(component => {
                        if (component["@type"] === "Component") {
                            if (splittedSource[1] === component["name"]) {
                                if (component["visual"] !== undefined) {
                                    component["visual"].forEach(async visual => {
                                        visual["isRender"] = true;
                                        visual["color"] = await this.getFailureColor(failure["severity"])
                                    })
                                }

                                component["sensors"].forEach(async sensor => {
                                    if (sensor["visual"] !== undefined) {
                                        sensor["visual"]["isRender"] = true;
                                        sensor["visual"]["color"] = await this.getFailureColor(failure["severity"])
                                    }
                                })
                            }
                        }
                    })
                })
            }
        })

        // color all component sensors
        await failures.map(failure => {
            splittedSource = failure["sourceName"].split(".");

            if (splittedSource.length === 3) {
                cubeInfo[0]["machines"].forEach(machine => {
                    machine["contents"].forEach(component => {
                        if (component["@type"] === "Component") {
                            component["sensors"].forEach(async sensor => {
                                if (splittedSource[2] === sensor["name"]) {
                                    if (sensor["visual"] !== undefined) {
                                        sensor["visual"]["isRender"] = true;
                                        sensor["visual"]["color"] = await this.getFailureColor(failure["severity"])
                                    }
                                }
                            })
                        }
                    })
                })
            }
        })





        // cubeInfo[0]["machines"].forEach(machine => {
        //     machine["contents"].forEach(component => {
        //         if (component["@type"] === "Component") {
        //             if (component["visual"] !== undefined) {
        //                 component["visual"].forEach(visual => {
        //                     visual["isRender"] = true;
        //                     visual["color"] = "#29a329";
        //                 })
        //             }

        //             component["sensors"].forEach(sensor => {
        //                 if (sensor["visual"] !== undefined) {
        //                     sensor["visual"]["isRender"] = true;
        //                     sensor["visual"]["color"] = "#29a329";
        //                 }
        //             })
        //         }
        //     })
        // })

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

                    // cube.rotation.x = cubeInfo.rotate.x;
                    // cube.rotation.y = cubeInfo.rotate.y;
                    // cube.rotation.z = cubeInfo.rotate.z;

                    cube.position.x = cubeInfo.position.x;
                    cube.position.y = cubeInfo.position.y;
                    cube.position.z = cubeInfo.position.z;
                    cube.name = cubeInfo.name;

                    vm.addObjectToScene(cube);
                },
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                function (xhr) {
                    console.log('An error happened', xhr);
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

            // cube.rotation.x = cubeInfo.rotate.x;
            // cube.rotation.y = cubeInfo.rotate.y;
            // cube.rotation.z = cubeInfo.rotate.z;

            cube.position.x = cubeInfo.position.x;
            cube.position.y = cubeInfo.position.y;
            cube.position.z = cubeInfo.position.z;

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
        scene.add(object);

        domEvents.addEventListener(object, 'click', function () {
            transformControl.attach(object);
            scene.add(transformControl);
            renderer.render(scene, camera);
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

    public render() {
        const { visibleFailureAlarmScene, handleDismissFailureAlarmScene } = this.props;

        return (
            <Overlay visible={visibleFailureAlarmScene}>
                <Overlay.Container maxWidth={1500}>
                    <Overlay.Header
                        title="Failure Alarm Scene"
                        onDismiss={handleDismissFailureAlarmScene}
                    />
                    <Overlay.Body id={"visualizeGraph"}>
                        <div id="visualizeArea"></div>
                    </Overlay.Body>

                </Overlay.Container>
            </Overlay>

        );
    }
}

export default FailureAlarmScene;
