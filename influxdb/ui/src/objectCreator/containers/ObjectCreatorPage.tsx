// Libraries
import React, { PureComponent } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";

// Components
import {
    Page, Grid, Columns, Panel, ComponentSize,
} from '@influxdata/clockface'

import PageTitle from "src/objectCreator/components/PageTitle";
import EditObjectFrom from "src/objectCreator/components/EditObjectForm";
import Buttons from "src/objectCreator/components/Buttons";
import ImportComponentOverlay from "src/objectCreator/components/ImportComponentOverlay";
import SaveComponentOverlay from "src/objectCreator/components/SaveComponentOverlay";
import TextureOverlay from "src/objectCreator/components/TextureOverlay";
import ModelFile from "src/objectCreator/components/ModelFile";

// Services
import ObjectService from "src/shared/services/ObjectService";

// Constants
import { generalSuccessMessage } from 'src/shared/copy/notifications'

// Actions
import { notify as notifyAction } from 'src/shared/actions/notifications'

// Utilities
var THREE = require("three");
var OrbitControls = require("three-orbit-controls")(THREE);
var TransformControls = require("three-transform-controls")(THREE);
var initializeDomEvents = require('threex-domevents')
var THREEx = {}
initializeDomEvents(THREE, THREEx)
var camera, controls, scene, renderer, domEvents, transformControl;
var dae, kinematics;

interface OwnProps { }
interface State {
    textures: object[]
    modelFiles: object[]
    dtList: object[]
    selectedDT: object
    componentName: string
    newObjects: object[]
    registeredDT: object[]
    visibleImportComponent: boolean
    registeredObjectList: object[]
    visibleSaveComponent: boolean
    visibleFileUpload: boolean
    visibleModelFile: boolean
}

type ReduxProps = ConnectedProps<typeof connector>
type Props = OwnProps & ReduxProps


class ObjectCreatorPage extends PureComponent<Props, State> {
    private refEditObjectForm: React.RefObject<EditObjectFrom>;

    constructor(props) {
        super(props)
        this.refEditObjectForm = React.createRef();

        this.state = {
            textures: [],
            modelFiles: [],
            dtList: [],
            selectedDT: {},
            componentName: "",
            newObjects: [],
            registeredDT: [],
            visibleImportComponent: false,
            registeredObjectList: [],
            visibleSaveComponent: false,
            visibleFileUpload: false,
            visibleModelFile: false,
        }
    }

    async componentDidMount(): Promise<void> {
        await this.createScene();
        await this.getTextureFiles();
        await this.getModelFiles();
        await this.getDigitalTwinObjects();
        await this.getObjectList();
        await this.responsiveConfiguration();
        await this.addLightsToScene();
    }

    public changeObjectProperties = (object: object): void => {
        scene.children.forEach(async (child) => {
            await transformControl.detach(child);

            console.log("color", object["color"])

            if (child["name"] === object["objectName"]) {
                if (child["type"] == 'ColladaFile') {
                    child.traverse(function (child) {
                        if (child.isMesh) {
                            child.material.flatShading = true;
                            child.material.color.set(object["color"]);
                            child.material.opacity = object["opacity"];
                        }
                    });
                } else {
                    new THREE.TextureLoader().load(
                        `../../assets/images/textures/${object["selectedTexture"]["file"]}`,
                        texture => {
                            child.material.map = texture;
                            child.material.needsUpdate = true;
                            child.texture = object["selectedTexture"];
                            renderer.render(scene, camera);
                        },
                        _ => {
                        },
                        _ => {
                        }
                    )

                    child.material.color.set(object["color"]);
                    child.material.opacity = object["opacity"];
                }

                renderer.render(scene, camera);
            }
        })
    }

    public removeObjectFromScene = (objectName: string) => {
        const { notify } = this.props;

        const tempNewObjects = this.state.newObjects.filter(item =>
            item["name"] !== objectName
        )

        this.setState({
            newObjects: tempNewObjects
        });

        scene.children.forEach(async (child) => {
            if (child["name"] === objectName) {
                await transformControl.detach(child);
                child.geometry = undefined;
                child.material = undefined;
                scene.remove(child);
                renderer.render(scene, camera);

                notify(generalSuccessMessage("Selected object has been successfully removed from the scene"));
            }
        })
    }

    public getObjectList = async (): Promise<void> => {
        const result = await ObjectService.getObjectList();

        this.setState({
            registeredObjectList: result,
        })
    }

    public responsiveConfiguration = () => {
        if (document.querySelector("#visualizeGraph") !== null) {
            renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 30, 700);
            renderer.render(scene, camera);
        }

        window.addEventListener('resize', () => {
            if (document.querySelector("#visualizeGraph") !== null) {
                renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 30, 700);
            }
        });
    }

    public getDigitalTwinObjects = async () => {
        const result = await ObjectService.getDigitalTwinObjects();

        if (result == undefined) {
            return;
        }

        const dtList = [];

        result["productionLines"].forEach(pl => {
            pl["machines"].forEach(machine => {
                dtList.push({ "text": machine["name"], "value": machine["name"] });
            })
        })

        let machines = [];
        result["productionLines"].forEach(pl => {
            machines = machines.concat(pl["machines"]);
        })

        this.setState({
            dtList,
            selectedDT: dtList[0],
            registeredDT: machines,
        });

        await this.handleChangeDT(dtList[0]);
    }

    public getTextureFiles = async () => {
        const textures = await ObjectService.getTextureFiles();

        this.setState({ textures });
    }

    public getModelFiles = async () => {
        const modelFiles = await ObjectService.getModelFiles();

        this.setState({ modelFiles });
    }

    private randomTextGenerator = (length) => {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return `object_${result}`;
    }

    private addCube = (type, item, render = false) => {
        if (type === 'loaded') {
            if (item.texture !== undefined && item.texture !== null) { // if adding previously saved cube with texture
                let geometry = new THREE.BoxGeometry(
                    item.boxMeasure.width,
                    item.boxMeasure.height,
                    item.boxMeasure.depth
                );

                var material;
                var loader = new THREE.TextureLoader();

                let vm = this;
                loader.load(
                    item.texture,
                    function (texture) {
                        material = new THREE.MeshBasicMaterial({
                            map: texture,
                            color: item.color
                        });
                        material.transparent = true;
                        material.opacity = item.opacity
                        material.wireframe = true;
                        let cube = new THREE.Mesh(geometry, material);
                        if (item.scale !== undefined) {
                            cube.scale.x = item.scale.x;
                            cube.scale.y = item.scale.y;
                            cube.scale.z = item.scale.z;
                        }
                        cube.rotation.x = item.rotate.x;
                        cube.rotation.y = item.rotate.y;
                        cube.rotation.z = item.rotate.z;
                        cube.position.x = item.position.x;
                        cube.position.y = item.position.y;
                        cube.position.z = item.position.z;
                        cube.name = item.name;

                        if (render) {
                            material.wireframe = false;
                            vm.addToSceneAndClickEvent(cube, "new");
                        } else {
                            scene.add(cube);
                            renderer.render(scene, camera);
                        }
                    },
                    function (_) {
                    },
                    function (_) {
                    }
                );
            } else { // if adding previously saved cube without texture
                let geometry = new THREE.BoxGeometry(
                    item.boxMeasure.width || item.boxMeasure.x,
                    item.boxMeasure.height || item.boxMeasure.y,
                    item.boxMeasure.depth || item.boxMeasure.z
                );
                const material = new THREE.MeshBasicMaterial({ color: item.color });
                material.transparent = true;
                material.opacity = item.opacity
                material.wireframe = true;
                let cube = new THREE.Mesh(geometry, material);
                if (item.scale !== undefined) {
                    cube.scale.x = item.scale.x;
                    cube.scale.y = item.scale.y;
                    cube.scale.z = item.scale.z;
                }
                cube.rotation.x = item.rotate.x;
                cube.rotation.y = item.rotate.y;
                cube.rotation.z = item.rotate.z;
                cube.position.x = item.position.x;
                cube.position.y = item.position.y;
                cube.position.z = item.position.z;
                cube.name = item.name;

                if (render) {
                    material.wireframe = false;
                    this.addToSceneAndClickEvent(cube, "new");
                } else {
                    scene.add(cube);
                    renderer.render(scene, camera);
                }
            }
        } else { // if a new cube is added to the scene
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: '#ffffff' });
            material.transparent = true;
            const cube = new THREE.Mesh(geometry, material);
            cube.name = this.randomTextGenerator(10);
            cube.position.set(-7, -1, 7);
            this.addToSceneAndClickEvent(cube, "new");
        }
    }

    private addSphere = (type, item, render = false) => {
        if (type === 'loaded') {
            if (item.texture !== undefined && item.texture !== null) { // if adding previously saved object with texture
                let geometry = new THREE.SphereGeometry(
                    item.boxMeasure.radius,
                    item.boxMeasure.widthSegments,
                    item.boxMeasure.heightSegments
                );

                var material;
                var loader = new THREE.TextureLoader();

                let vm = this;
                loader.load(
                    item.texture,
                    function (texture) {
                        material = new THREE.MeshBasicMaterial({
                            map: texture,
                            color: item.color
                        });
                        material.transparent = true;
                        material.opacity = item.opacity
                        material.wireframe = true;
                        let sphere = new THREE.Mesh(geometry, material);
                        sphere.scale.x = item.scale.x;
                        sphere.scale.y = item.scale.y;
                        sphere.scale.z = item.scale.z;
                        sphere.rotation.x = item.rotate.x;
                        sphere.rotation.y = item.rotate.y;
                        sphere.rotation.z = item.rotate.z;
                        sphere.position.x = item.position.x;
                        sphere.position.y = item.position.y;
                        sphere.position.z = item.position.z;
                        sphere.name = item.name;

                        if (render) {
                            material.wireframe = false;
                            vm.addToSceneAndClickEvent(sphere, "new");
                        } else {
                            scene.add(sphere);
                            renderer.render(scene, camera);
                        }
                    },
                    function (_) {
                    },
                    function (_) {
                    }
                );
            } else { // if adding previously saved cube without texture
                let geometry = new THREE.SphereGeometry(
                    item.boxMeasure.radius,
                    item.boxMeasure.widthSegments,
                    item.boxMeasure.heightSegments
                );
                const material = new THREE.MeshBasicMaterial({ color: item.color });
                material.transparent = true;
                material.opacity = item.opacity
                material.wireframe = true;
                let sphere = new THREE.Mesh(geometry, material);
                sphere.scale.x = item.scale.x;
                sphere.scale.y = item.scale.y;
                sphere.scale.z = item.scale.z;
                sphere.rotation.x = item.rotate.x;
                sphere.rotation.y = item.rotate.y;
                sphere.rotation.z = item.rotate.z;
                sphere.position.x = item.position.x;
                sphere.position.y = item.position.y;
                sphere.position.z = item.position.z;
                sphere.name = item.name;

                if (render) {
                    material.wireframe = false;
                    this.addToSceneAndClickEvent(sphere, "new");
                } else {
                    scene.add(sphere);
                    renderer.render(scene, camera);
                }
            }
        } else {
            const geometry = new THREE.SphereGeometry(1, 16, 16);
            const material = new THREE.MeshBasicMaterial({ color: '#ffffff' });
            material.transparent = true;
            const sphere = new THREE.Mesh(geometry, material);
            sphere.name = this.randomTextGenerator(10);
            sphere.position.set(-3, -1, 2);
            this.addToSceneAndClickEvent(sphere, "new");
        }
    }

    private addCylinder = (type, item, render = false) => {
        if (type === 'loaded') {
            if (item.texture !== undefined && item.texture !== null) { // if adding previously saved object with texture
                let geometry = new THREE.CylinderGeometry(
                    item.boxMeasure.radiusTop,
                    item.boxMeasure.radiusBottom,
                    item.boxMeasure.height,
                    item.boxMeasure.radialSegments,
                );

                var material;
                var loader = new THREE.TextureLoader();

                let vm = this;
                loader.load(
                    item.texture,
                    function (texture) {
                        material = new THREE.MeshBasicMaterial({
                            map: texture,
                            color: item.color
                        });
                        material.transparent = true;
                        material.opacity = item.opacity
                        material.wireframe = true;
                        let cylinder = new THREE.Mesh(geometry, material);
                        cylinder.scale.x = item.scale.x;
                        cylinder.scale.y = item.scale.y;
                        cylinder.scale.z = item.scale.z;
                        cylinder.rotation.x = item.rotate.x;
                        cylinder.rotation.y = item.rotate.y;
                        cylinder.rotation.z = item.rotate.z;
                        cylinder.position.x = item.position.x;
                        cylinder.position.y = item.position.y;
                        cylinder.position.z = item.position.z;
                        cylinder.name = item.name;

                        if (render) {
                            material.wireframe = false;
                            vm.addToSceneAndClickEvent(cylinder, "new");
                        } else {
                            scene.add(cylinder);
                            renderer.render(scene, camera);
                        }
                    },
                    function (_) {
                    },
                    function (_) {
                    }
                );
            } else { // if adding previously saved object without texture
                let geometry = new THREE.CylinderGeometry(
                    item.boxMeasure.radiusTop,
                    item.boxMeasure.radiusBottom,
                    item.boxMeasure.height,
                    item.boxMeasure.radialSegments,
                );
                const material = new THREE.MeshBasicMaterial({ color: item.color });
                material.transparent = true;
                material.opacity = item.opacity
                material.wireframe = true;
                let cylinder = new THREE.Mesh(geometry, material);
                cylinder.scale.x = item.scale.x;
                cylinder.scale.y = item.scale.y;
                cylinder.scale.z = item.scale.z;
                cylinder.rotation.x = item.rotate.x;
                cylinder.rotation.y = item.rotate.y;
                cylinder.rotation.z = item.rotate.z;
                cylinder.position.x = item.position.x;
                cylinder.position.y = item.position.y;
                cylinder.position.z = item.position.z;
                cylinder.name = item.name;

                if (render) {
                    material.wireframe = false;
                    this.addToSceneAndClickEvent(cylinder, "new");
                } else {
                    scene.add(cylinder);
                    renderer.render(scene, camera);
                }
            }
        } else {
            const geometry = new THREE.CylinderGeometry(1, 1, 2, 12);
            const material = new THREE.MeshBasicMaterial({ color: "#ffffff" });
            material.transparent = true;
            const cylinder = new THREE.Mesh(geometry, material);
            cylinder.name = this.randomTextGenerator(10);
            cylinder.position.set(-3, -1, 2);
            this.addToSceneAndClickEvent(cylinder, "new");
        }
    }

    private addTorus = (type, item, render = false) => {
        if (type === 'loaded') {
            if (item.texture !== undefined && item.texture !== null) { // if adding previously saved object with texture
                let geometry = new THREE.TorusGeometry(
                    item.boxMeasure.radius,
                    item.boxMeasure.tube,
                    item.boxMeasure.radialSegments,
                    item.boxMeasure.tubularSegments,
                );

                var material;
                var loader = new THREE.TextureLoader();
                let vm = this;

                loader.load(
                    item.texture,
                    function (texture) {
                        material = new THREE.MeshBasicMaterial({
                            map: texture,
                            color: item.color
                        });
                        material.transparent = true;
                        material.opacity = item.opacity
                        material.wireframe = true;
                        let torus = new THREE.Mesh(geometry, material);
                        torus.scale.x = item.scale.x;
                        torus.scale.y = item.scale.y;
                        torus.scale.z = item.scale.z;
                        torus.rotation.x = item.rotate.x;
                        torus.rotation.y = item.rotate.y;
                        torus.rotation.z = item.rotate.z;
                        torus.position.x = item.position.x;
                        torus.position.y = item.position.y;
                        torus.position.z = item.position.z;
                        torus.name = item.name;

                        if (render) {
                            material.wireframe = false;
                            vm.addToSceneAndClickEvent(torus, "new");
                        } else {
                            scene.add(torus);
                            renderer.render(scene, camera);
                        }
                    },
                    function (_) {
                    },
                    function (_) {
                    }
                );
            } else { // if adding previously saved object without texture
                let geometry = new THREE.TorusGeometry(
                    item.boxMeasure.radius,
                    item.boxMeasure.tube,
                    item.boxMeasure.radialSegments,
                    item.boxMeasure.tubularSegments,
                );
                const material = new THREE.MeshBasicMaterial({ color: item.color });
                material.transparent = true;
                material.opacity = item.opacity
                material.wireframe = true;
                let torus = new THREE.Mesh(geometry, material);
                torus.scale.x = item.scale.x;
                torus.scale.y = item.scale.y;
                torus.scale.z = item.scale.z;
                torus.rotation.x = item.rotate.x;
                torus.rotation.y = item.rotate.y;
                torus.rotation.z = item.rotate.z;
                torus.position.x = item.position.x;
                torus.position.y = item.position.y;
                torus.position.z = item.position.z;
                torus.name = item.name;

                if (render) {
                    material.wireframe = false;
                    this.addToSceneAndClickEvent(torus, "new");
                } else {
                    scene.add(torus);
                    renderer.render(scene, camera);
                }
            }
        } else {
            const geometry = new THREE.TorusGeometry(10, 3, 16, 10);
            const material = new THREE.MeshBasicMaterial({ color: "#ffffff" });
            material.transparent = true;
            const torus = new THREE.Mesh(geometry, material);
            torus.name = this.randomTextGenerator(10);
            torus.position.set(-3, -1, 2);
            this.addToSceneAndClickEvent(torus, "new");
        }
    }

    public addToSceneAndClickEvent = (object, type) => {
        if (type === "new") {
            this.setState({
                newObjects: [...this.state.newObjects, object]
            })
        };

        scene.add(object);

        let vm = this;
        domEvents.addEventListener(object, 'click', function () {
            vm.changeSelectedObject(object);

            transformControl.attach(object);
            scene.add(transformControl);

            renderer.render(scene, camera);
        })
        renderer.render(scene, camera);
    }

    public createScene = () => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        camera.position.x = 13.6;
        camera.position.y = 5.2;
        camera.position.z = 1.5;
        camera.rotation.x = -1.5;
        camera.rotation.y = 1.1;
        camera.rotation.z = 1.5;

        // camera.position.set(7.5, 3.1, 2);
        // camera.quaternion.set(0.6, -0.04, 0.7, 0.04);
        // camera.rotation.set(-2.6, 1.3, 2.6);

        // camera.lookAt(new THREE.Vector3(0, 0, 0));

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.setClearColor(0x000000);
        renderer.setSize(window.innerWidth * 0.76, window.innerHeight * 0.75);
        // renderer.setSize(window.innerWidth * 0.76, window.innerHeight * 0.75);
        document.getElementById("sceneArea").appendChild(renderer.domElement);

        // Light
        // scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.4));
        // const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        // dirLight.position.set(5, 2, 8);
        // scene.add(dirLight);

        domEvents = new THREEx.DomEvents(camera, renderer.domElement)

        // Mouse Controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZomm = true;
        controls.zoomSpeed = 0.5;
        controls.target.set(-3, 1, 3);
        controls.update();

        // watch camera transform 
        controls.addEventListener("change", () => {
            renderer.render(scene, camera);
        });

        // object moving control
        transformControl = new TransformControls(camera, renderer.domElement);
        transformControl.addEventListener('change', () => {
            this.changeSelectedObject(this.refEditObjectForm.current.state.selectedObject);
            renderer.render(scene, camera);
        })
        transformControl.addEventListener('dragging-changed', function (event) {
            controls.enabled = !event.value;
        })

        window.addEventListener('keydown', function (event) {
            switch (event.keyCode) {
                case 69: // e
                    transformControl.setMode("rotate");
                    break;
                case 82: // r
                    transformControl.setMode("scale");
                    break;
                case 87: // w
                    transformControl.setMode("translate");
                    break;
                case 107: // +
                    transformControl.setSize(transformControl.size + 0.1);
                    break;
                case 109: // -
                    transformControl.setSize(Math.max(transformControl.size - 0.1, 0.1));
                    break;
            }
        })
    }

    public addLightsToScene = () => {
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

    public changeSelectedObject = (cube) => {
        this.refEditObjectForm.current.changeSelectedObject(cube);
    }

    public removeAllObjectFromScene = async () => {
        if (scene !== undefined) {
            let obj;
            for (var i = scene.children.length - 1; i >= 0; i--) {
                if (["GridHelper", "HemisphereLight", "DirectonalLight"].includes(scene.children[i]["type"])) {
                    continue;
                }
                obj = scene.children[i];
                await transformControl.detach(obj);
                obj.material = undefined;
                obj.geometry = undefined;
                await scene.remove(obj);
            }
            renderer.render(scene, camera);
            return true;
        }
        return false;
    }

    public handleChangeDT = async (selectedDT) => {
        await this.removeAllObjectFromScene();

        this.setState({
            selectedDT,
        })

        const objects = [];

        this.state.registeredDT.forEach(machine => {
            if (machine["name"] === selectedDT["value"]) {
                machine["contents"].forEach(component => {
                    if (component["@type"] === "Component") {
                        if (component["visual"] !== undefined && component["visual"] !== "") {
                            component["visual"]["objects"].forEach(visual => {
                                objects.push(visual);
                            })
                        }

                        component["sensors"].forEach(sensor => {
                            if (sensor["visual"] !== undefined && sensor["visual"] !== "") {
                                sensor["visual"]["objects"].forEach(sensorVisual => {
                                    objects.push(sensorVisual);
                                })
                            }
                        })
                    }
                })
            }
        })

        objects.forEach(item => {
            if (item["geometryType"] === "BoxGeometry") {
                this.addCube('loaded', item);
            } else if (item["geometryType"] === "SphereGeometry") {
                this.addSphere('loaded', item);
            } else if (item["geometryType"] === "CylinderGeometry") {
                this.addCylinder('loaded', item);
            } else if (item["geometryType"] === 'TorusGeometry') {
                this.addTorus('loaded', item);
            } else if (item["geometryType"] === 'ColladaFile') {
                this.addColladaFile('loaded', item);
            }
        })
    }

    public addColladaFile = async (type, item, render = true) => {
        const loader = new ColladaLoader();

        let vm = this;
        await loader.load(`../../assets/images/model/${item['fileName']}`, async function (collada) {
            dae = collada.scene;
            dae.traverse(function (child) {
                if (child.isMesh) {
                    child.material.flatShading = true;

                    if (item["color"] !== undefined || item["opacity"] !== undefined) {
                        child.material.color.set(item["color"]);
                        child.material.opacity = item["opacity"];
                    }
                }
            });

            dae.scale.x = type === 'loaded' ? item["boxMeasure"]["x"] : 4;
            dae.scale.y = type === 'loaded' ? item["boxMeasure"]["y"] : 4;
            dae.scale.z = type === 'loaded' ? item["boxMeasure"]["z"] : 4;
            dae.position.x = type === 'loaded' ? item["position"]["x"] : 1;
            dae.position.y = type === 'loaded' ? item["position"]["y"] : 0;
            dae.position.z = type === 'loaded' ? item["position"]["z"] : 1;
            dae.name = type === 'loaded' ? dae["name"] : vm.randomTextGenerator(10);
            dae.type = 'ColladaFile';
            dae.fileName = item["fileName"];
            dae.updateMatrix();
            kinematics = collada.kinematics;

            Object.keys(collada.library.materials).forEach(material => {
                collada.library.materials[material].build.wireframe = render;
            })

            if (render) {
                scene.add(dae);
                renderer.render(scene, camera);
            } else {
                vm.addToSceneAndClickEvent(dae, "new");
            }
        });
        await renderer.render(scene, camera);
    }

    public removeNewObjectsFromScene = async (): Promise<void> => {
        const newObjectsId = [];
        this.state.newObjects.forEach(newItem => {
            if (newItem["uuid"] !== undefined) {
                newObjectsId.push(newItem["uuid"]);
            }
        })

        if (scene !== undefined) {
            let obj;
            for (var i = scene.children.length - 1; i >= 0; i--) {
                if (newObjectsId.includes(scene.children[i]["uuid"])) {
                    obj = scene.children[i];
                    await transformControl.detach(obj);
                    obj.material = undefined;
                    obj.geometry = undefined;
                    await scene.remove(obj);
                }
            }
        }
        renderer.render(scene, camera);
        this.setState({
            newObjects: [],
        })
    }

    public handleSaveImportComponent = async (component: object): Promise<void> => {
        component["children"].forEach(item => {
            this.setState({
                newObjects: [...this.state.newObjects, item]
            })
            if (item["geometryType"] === "BoxGeometry") {
                this.addCube('loaded', item, true);
            } else if (item["geometryType"] === "SphereGeometry") {
                this.addSphere('loaded', item, true);
            } else if (item["geometryType"] === "CylinderGeometry") {
                this.addCylinder('loaded', item, true);
            } else if (item["geometryType"] === 'TorusGeometry') {
                this.addTorus('loaded', item, true);
            } else if (item["geometryType"] === 'ColladaFile') {
                this.addColladaFile('loaded', item, false);
            }
        })

        this.setState({
            componentName: component["name"],
            visibleImportComponent: false,
        })
    }

    public handleClickAddObject = (type) => {
        switch (type["value"]) {
            case 'cube':
                this.addCube('', {});
                break;
            case 'sphere':
                this.addSphere('', {});
                break;
            case 'cylinder':
                this.addCylinder('', {});
                break;
            case 'torus':
                this.addTorus('', {});
                break;
        }
    }

    public handleSaveImportModel = async (model: object): Promise<void> => {
        const item = { "fileName": model["file"] }
        this.addColladaFile('', item, false);
    }

    public render(): JSX.Element {
        const {
            visibleImportComponent, visibleSaveComponent, componentName, newObjects,
            registeredObjectList, visibleFileUpload, textures, visibleModelFile, modelFiles
        } = this.state;

        return (
            <>
                <ImportComponentOverlay
                    visible={visibleImportComponent}
                    onClose={() => {
                        this.setState({
                            visibleImportComponent: false
                        })
                    }}
                    removeNewObjectsFromScene={this.removeNewObjectsFromScene}
                    handleSaveImportComponent={this.handleSaveImportComponent}
                    registeredObjectList={registeredObjectList}
                    getObjectList={this.getObjectList}
                />

                <SaveComponentOverlay
                    visible={visibleSaveComponent}
                    onClose={() => {
                        this.setState({
                            visibleSaveComponent: false
                        })
                    }}
                    componentName={componentName}
                    newObjects={newObjects}
                    getObjectList={this.getObjectList}
                />

                <TextureOverlay
                    visible={visibleFileUpload}
                    onClose={() => {
                        this.setState({
                            visibleFileUpload: false
                        })
                    }}
                    getTextureFiles={this.getTextureFiles}
                    textures={textures}
                />

                <ModelFile
                    visible={visibleModelFile}
                    onClose={() => {
                        this.setState({
                            visibleModelFile: false
                        })
                    }}
                    modelFiles={modelFiles}
                    getModelFiles={this.getModelFiles}
                    removeNewObjectsFromScene={this.removeNewObjectsFromScene}
                    handleSaveImportModel={this.handleSaveImportModel}
                />

                <Page className="show-only-pc">
                    <PageTitle />

                    <Page.Contents fullWidth={true} scrollable={true}>
                        <Grid>
                            <Grid.Row>
                                <Grid.Column
                                    widthXS={Columns.Twelve}
                                    widthSM={Columns.Twelve}
                                    widthMD={Columns.Three}
                                    widthLG={Columns.Two}
                                    style={{ marginTop: '20px' }}
                                >
                                    <EditObjectFrom
                                        ref={this.refEditObjectForm}
                                        changeObjectProperties={this.changeObjectProperties}
                                        removeObjectFromScene={this.removeObjectFromScene}
                                        textures={textures}
                                    />
                                </Grid.Column>

                                <Grid.Column
                                    widthXS={Columns.Twelve}
                                    widthSM={Columns.Twelve}
                                    widthMD={Columns.Nine}
                                    widthLG={Columns.Ten}
                                    style={{ marginTop: '20px' }}
                                >
                                    <Panel>
                                        <Buttons
                                            handleClickAddObject={this.handleClickAddObject}
                                            handleChangeDT={this.handleChangeDT}
                                            handleFileUploadOverlay={() => {
                                                this.setState({
                                                    visibleFileUpload: true
                                                })
                                            }}
                                            handleImportComponentToScene={() => {
                                                this.setState({
                                                    visibleImportComponent: true,
                                                })
                                            }}
                                            handleSaveComponentOverlay={() => {
                                                this.setState({
                                                    visibleSaveComponent: true,
                                                })
                                            }}
                                            handleOpenModelFile={() => {
                                                this.setState({
                                                    visibleModelFile: true,
                                                })
                                            }}
                                            selectedDT={this.state.selectedDT}
                                            dtList={this.state.dtList}
                                        />

                                        <Panel.Body size={ComponentSize.Small} id={"visualizeGraph"}>
                                            <div id="sceneArea"></div>
                                        </Panel.Body>
                                    </Panel>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Page.Contents>
                </Page>
            </>
        )
    }
}

const mdtp = {
    notify: notifyAction,
}

const connector = connect(null, mdtp)

export default connector(ObjectCreatorPage);