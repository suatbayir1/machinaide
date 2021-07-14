// Libraries
import React, { PureComponent } from 'react'

// Components
import {
    Page, Grid, Columns, Panel, ComponentSize, Form, Input, InputType,
    FlexBox, ColorPicker, Button, ButtonType, IconFont, ComponentColor,
    ComponentStatus, QuestionMarkTooltip, FlexDirection, DapperScrollbars,
    List, Gradients, Notification, Dropdown, Overlay, InfluxColors,
} from '@influxdata/clockface'
import TabbedPageTabs from 'src/shared/tabbedPage/TabbedPageTabs'
import { TabbedPageTab } from 'src/shared/tabbedPage/TabbedPageTabs'

// Constants
import {
    tipStyle, dtManagementPage, objectOpacity, objectTexture, objectUpdateRemove, objectSelectDT,
    addTexture, objectImportComponent, objectSaveAndSaveAs,
} from 'src/shared/constants/tips';
import { BACKEND } from "src/config";


// Utilities
var THREE = require("three");
var OrbitControls = require("three-orbit-controls")(THREE);
var TransformControls = require("three-transform-controls")(THREE);
var initializeDomEvents = require('threex-domevents')
var THREEx = {}
initializeDomEvents(THREE, THREEx)
var camera, controls, scene, renderer, domEvents, transformControl;


interface Props { }
interface State {
    objectName: string
    boxMeasureX: number
    boxMeasureY: number
    boxMeasureZ: number
    positionX: number
    positionY: number
    positionZ: number
    rotationX: number
    rotationY: number
    rotationZ: number
    color: string
    opacity: number
    selectedObject: object
    selectedFile: string
    textures: object[]
    selectedTexture: object
    notificationVisible: boolean
    notificationType: string
    notificationMessage: string
    dtList: object[]
    selectedDT: object
    componentName: string
    newObjects: object[]
    registeredDT: object[]
    visibleImportComponent: boolean
    registeredObjectList: object[]
    selectedImportObject: object
    visibleSaveComponent: boolean
    activeTab: string
    saveAsComponentName: string
    visibleFileUpload: boolean
    addObjectType: object[]
    textureFileName: string
}

class ObjectCreatorPage extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
            objectName: "",
            boxMeasureX: 0,
            boxMeasureY: 0,
            boxMeasureZ: 0,
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            color: "#eeeff2",
            opacity: 0.1,
            selectedObject: {},
            selectedFile: "",
            textures: [],
            selectedTexture: {},
            notificationVisible: false,
            notificationType: '',
            notificationMessage: '',
            dtList: [],
            selectedDT: {},
            componentName: "",
            newObjects: [],
            registeredDT: [],
            visibleImportComponent: false,
            registeredObjectList: [],
            selectedImportObject: {},
            visibleSaveComponent: false,
            activeTab: "save",
            saveAsComponentName: "",
            visibleFileUpload: false,
            addObjectType: [
                { text: 'Add Cube', value: 'cube' },
                { text: 'Add Sphere', value: 'sphere' },
                { text: 'Add Cylinder', value: 'cylinder' },
                { text: 'Add Torus', value: 'torus' },
            ],
            textureFileName: "",
        }
    }

    handleChangeInput = (e): void => {
        if (Object.keys(this.state).includes(e.target.name)) {
            this.setState({ [e.target.name]: e.target.value } as Pick<State, keyof State>);
        }
    }

    handleColorChange = (e) => {
        this.setState({
            color: e
        })
    }

    changeObjectProperties = () => {
        scene.children.forEach((child) => {
            transformControl.detach(child);

            if (child["name"] === this.state.objectName) {
                new THREE.TextureLoader().load(
                    `../../assets/images/textures/${this.state.selectedTexture["file"]}`,
                    texture => {
                        child.material.map = texture;
                        child.material.needsUpdate = true;
                        child.texture = this.state.selectedTexture;
                        renderer.render(scene, camera);
                    },
                    _ => {
                    },
                    _ => {
                    }
                )

                child.material.color.set(this.state.color);
                child.material.opacity = this.state.opacity;
                renderer.render(scene, camera);
            }
        })
    }

    removeObjectFromMongo = async (object) => {
        const payload = {
            "name": object["name"]
        }

        const url = `${BACKEND.API_URL}object/removeObject`;
        const request = fetch(url, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(payload),
        })

        try {
            const response = await request;
            await response.json();
            return true;
        } catch (err) {
            console.error(err);
        }
    }

    removeObjectFromScene = () => {
        const tempNewObjects = this.state.newObjects.filter(item =>
            item["name"] !== this.state.objectName
        )

        this.setState({
            newObjects: tempNewObjects
        });

        scene.children.forEach(async (child) => {
            if (child["name"] === this.state.objectName) {
                transformControl.detach(child);
                child.geometry = undefined;
                child.material = undefined;
                scene.remove(child);
                renderer.render(scene, camera);

                this.setState({
                    notificationVisible: true,
                    notificationType: "success",
                    notificationMessage: 'Selected object has been successfully removed from the scene'
                })
            }
        })
    }

    async componentDidMount(): Promise<void> {
        await this.createScene();
        await this.getTextureFiles();
        await this.getDigitalTwinObjects();
        await this.getObjectList();
        await this.responsiveConfiguration();
        // await this.renderGLTFModel();
    }

    responsiveConfiguration = () => {
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

    // renderGLTFModel = async () => {
    //     const loader = new GLTFLoader();
    //     const dracoLoader = new DRACOLoader();

    //     dracoLoader.setDecoderPath("../../node_modules/three/examples/js/libs/draco/");
    //     loader.setDRACOLoader(dracoLoader);

    //     await loader.load(
    //         '../../assets/images/model/ermetal.glb',

    //         async function (gltf) {
    //             gltf.scene.scale.set(0.01, 0.01, 0.01);
    //             gltf.scene.position.set(0, 0, 0)
    //             renderer.setClearColor(0xbfe3dd);
    //             await scene.add(gltf.scene);

    //             await renderer.render(scene, camera);
    //         },

    //         function (xhr) {
    //         },

    //         function (error) {
    //         }
    //     );
    //     await renderer.render(scene, camera);
    // }

    getDigitalTwinObjects = async () => {
        const url = `${BACKEND.API_URL}dt/`;

        const request = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            }
        })

        try {
            const response = await request;
            const res = await response.json();

            if (res.data.success !== true) return;
            const result = JSON.parse(res.data.data)[0];

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
        } catch (err) {
            console.error(err);
        }
    }

    getObjectList = async () => {
        const url = `${BACKEND.API_URL}object/getObjectPool`;

        const request = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            }
        })

        try {
            const response = await request;
            const res = await response.json();

            if (res.data.success !== true) return;
            const result = JSON.parse(res.data.data);

            this.setState({
                registeredObjectList: result,
            })
        } catch (err) {
            console.error(err);
        }
    }

    getTextureFiles = async () => {
        const url = `${BACKEND.API_URL}dt/getFileInfo`;

        const request = fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
        })

        try {
            const response = await request;
            const res = await response.json();
            const result = JSON.parse(res.data.data);

            this.setState({
                textures: result
            });
        } catch (err) {
            console.error(err);
        }
    }

    randomTextGenerator = (length) => {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return `object_${result}`;
    }

    addCube = (type, item, render = false) => {
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

    addSphere = (type, item, render = false) => {
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

    addCylinder = (type, item, render = false) => {
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

    addTorus = (type, item, render = false) => {
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

    addToSceneAndClickEvent = (object, type) => {
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

    createScene = () => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );


        camera.position.set(7.5, 3.1, 2);
        camera.quaternion.set(0.6, -0.04, 0.7, 0.04);
        camera.rotation.set(-2.6, 1.3, 2.6);

        camera.lookAt(new THREE.Vector3(0, 0, 0));

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.setClearColor(0x000000);
        renderer.setSize(window.innerWidth * 0.76, window.innerHeight * 0.75);
        // renderer.setSize(window.innerWidth * 0.76, window.innerHeight * 0.75);
        document.getElementById("sceneArea").appendChild(renderer.domElement);

        // Light
        scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.4));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 2, 8);
        scene.add(dirLight);

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
            this.changeSelectedObject(this.state.selectedObject);
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

    changeSelectedObject = (cube) => {
        this.setState({
            selectedObject: cube,
            objectName: cube.name,
            boxMeasureX: cube.scale.x,
            boxMeasureY: cube.scale.y,
            boxMeasureZ: cube.scale.z,
            positionX: cube.position.x,
            positionY: cube.position.y,
            positionZ: cube.position.z,
            rotationX: cube.rotation.x,
            rotationY: cube.rotation.y,
            rotationZ: cube.rotation.z,
            color: `#${cube.material.color.getHexString()}`,
            opacity: cube.material.opacity,
            selectedTexture: cube.texture !== undefined ? cube.texture : {}
        })
    }

    handleFileUpload = async (event) => {
        event.preventDefault();

        const inputFile = document.getElementById("inputFile");
        const formData = new FormData();
        formData.append('file', inputFile["files"][0]);
        formData.append('filename', this.state.textureFileName);

        if (inputFile["files"][0] === undefined) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: 'Please select file first'
            })
            return;
        }

        if (this.state.textureFileName.trim() === "") {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: 'Texture Name cannot be empty'
            })
            return;
        }

        const url = `${BACKEND.API_URL}dt/fileUpload`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                // 'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: formData,
        })

        try {
            const response = await request;
            const res = await response.json();
            if (res.data.message.text === 'File_Already_Exists') {
                this.setState({
                    notificationVisible: true,
                    notificationType: "error",
                    notificationMessage: 'Selected file already exists'
                })
            } else if (res.data.message.text === 'File_Uploaded_Successfully') {
                this.setState({
                    visibleFileUpload: false,
                    notificationVisible: true,
                    notificationType: "success",
                    notificationMessage: 'Selected file has been uploaded successfully'
                })
                this.getTextureFiles();
            }
        } catch (err) {
            console.error(err);
        }
    }

    handleClickTexture = (texture) => {
        this.setState({
            selectedTexture: texture
        })
    }

    saveComponentObjects = async () => {
        if (this.state.newObjects.length < 1) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: 'Please add a new object first'
            })
            return;
        }

        if (this.state.componentName.trim() === "") {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: 'Component name cannot be empty'
            })
            return;
        }

        const objects = [];

        this.state.newObjects.forEach((child) => {
            if (child["type"] === 'Mesh') {
                let object = {
                    "isRender": true,
                    "name": child["name"],
                    "geometryType": child["geometry"]["type"],
                    "boxMeasure": child["geometry"]["parameters"],
                    "scale": {
                        "x": child["scale"]["x"],
                        "y": child["scale"]["y"],
                        "z": child["scale"]["z"],
                    },
                    "position": {
                        "x": child["position"]["x"],
                        "y": child["position"]["y"],
                        "z": child["position"]["z"],
                    },
                    "rotate": {
                        "x": child["rotation"]["x"],
                        "y": child["rotation"]["y"],
                        "z": child["rotation"]["z"],
                    },
                    "color": `#${child["material"]["color"].getHexString()}`,
                    "opacity": child["material"]["opacity"],
                    "texture": child["material"]["map"] !== undefined && child["material"]["map"] !== null ? child["material"]["map"]["image"]["currentSrc"] : null,
                }
                objects.push(object);
            }
        })

        const payload = {
            "name": this.state.componentName,
            "children": objects
        }

        const url = `${BACKEND.API_URL}object/saveComponentObject`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(payload),
        })

        try {
            const response = await request;
            const res = await response.json();
            if (res.data.message.text === 'All_Objects_Saved_Successfully') {
                this.setState({
                    visibleSaveComponent: false,
                    notificationVisible: true,
                    notificationType: "success",
                    notificationMessage: 'Component saved successfully',
                })
                this.getObjectList();
            }
        } catch (err) {
            console.error(err);
        }
    }

    saveAsComponentObjects = async () => {
        if (this.state.newObjects.length < 1) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: 'Please add a new object first'
            })
            return;
        }

        if (this.state.saveAsComponentName.trim() === "") {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: 'Component name cannot be empty'
            })
            return;
        }

        const objects = [];

        this.state.newObjects.forEach((child) => {
            if (child["type"] === 'Mesh') {
                let object = {
                    "isRender": true,
                    "name": child["name"],
                    "geometryType": child["geometry"]["type"],
                    "boxMeasure": child["geometry"]["parameters"],
                    "scale": {
                        "x": child["scale"]["x"],
                        "y": child["scale"]["y"],
                        "z": child["scale"]["z"],
                    },
                    "position": {
                        "x": child["position"]["x"],
                        "y": child["position"]["y"],
                        "z": child["position"]["z"],
                    },
                    "rotate": {
                        "x": child["rotation"]["x"],
                        "y": child["rotation"]["y"],
                        "z": child["rotation"]["z"],
                    },
                    "color": `#${child["material"]["color"].getHexString()}`,
                    "opacity": child["material"]["opacity"],
                    "texture": child["material"]["map"] !== undefined && child["material"]["map"] !== null ? child["material"]["map"]["image"]["currentSrc"] : null,
                }
                objects.push(object);
            }
        })

        const payload = {
            "name": this.state.saveAsComponentName,
            "children": objects
        }

        const url = `${BACKEND.API_URL}object/saveAsComponentObject`;

        const request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                'token': window.localStorage.getItem("token")
            },
            body: JSON.stringify(payload),
        })

        try {
            const response = await request;
            const res = await response.json();
            if (res.data.message.text === 'All_Objects_Saved_Successfully') {
                this.setState({
                    visibleSaveComponent: false,
                    componentName: this.state.saveAsComponentName,
                    notificationVisible: true,
                    notificationType: "success",
                    notificationMessage: 'Component saved successfully',
                })
                this.getObjectList();
            } else if (res.data.message.text === 'Object_Already_Exists') {
                this.setState({
                    notificationVisible: true,
                    notificationType: "error",
                    notificationMessage: 'This component name already exists'
                })
            }
        } catch (err) {
            console.error(err);
        }
    }

    removeAllObjectFromScene = async () => {
        if (scene !== undefined) {
            let obj;
            for (var i = scene.children.length - 1; i >= 0; i--) {
                obj = scene.children[i];
                obj.material = undefined;
                obj.geometry = undefined;
                transformControl.detach(obj);
                await scene.remove(obj);
            }
            renderer.render(scene, camera);
            return true;
        }
        return false;
    }

    handleUpdateName = (value) => {
        if (this.state.objectName === "" || this.state.objectName === null) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: "Please select an object first"
            })
        } else {
            let isExists = false;
            scene.children.forEach(child => {
                if (child["name"] === value) {
                    isExists = true;
                }
            })

            if (!isExists) {
                scene.children.forEach(child => {
                    if (child["name"] === this.state.objectName) {
                        child["name"] = value;

                        this.setState({
                            objectName: value
                        })

                        this.setState({
                            notificationVisible: true,
                            notificationType: "success",
                            notificationMessage: "The name of the selected object has been successfully changed"
                        })
                    }
                })
            } else {
                this.setState({
                    notificationVisible: true,
                    notificationType: "error",
                    notificationMessage: "This object name already exists"
                })
            }
        }
    }

    handleChangeDT = async (selectedDT) => {
        await this.removeAllObjectFromScene();

        this.setState({
            selectedDT,
        })

        const objects = [];

        this.state.registeredDT.forEach(machine => {
            if (machine["name"] === selectedDT["value"]) {
                machine["contents"].forEach(component => {
                    if (component["@type"] === "Component") {
                        component["visual"].forEach(visual => {
                            objects.push(visual);
                        })

                        component["sensors"].forEach(sensorVisual => {
                            if (sensorVisual["visual"] !== undefined) {
                                objects.push(sensorVisual["visual"]);
                            }
                        })
                    }
                })
            }
        })

        objects.forEach(item => {
            if (item["geometryType"] === "BoxGeometry") {
                this.addCube('loaded', item);
            }

            if (item.children !== undefined) {
                item.children.forEach(child => {
                    if (child["geometryType"] === "BoxGeometry") {
                        this.addCube('loaded', child);
                    } else if (child["geometryType"] === "SphereGeometry") {
                        this.addSphere('loaded', child);
                    } else if (child["geometryType"] === "CylinderGeometry") {
                        this.addCylinder('loaded', child);
                    } else if (child["geometryType"] === 'TorusGeometry') {
                        this.addTorus('loaded', child);
                    }
                })
            }
        })
    }

    handleImportComponentToScene = () => {
        this.setState({
            visibleImportComponent: true,
        })
    }

    handleDismissImportComponent = () => {
        this.setState({
            visibleImportComponent: false
        })
    }

    removeNewObjectsFromScene = async () => {
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
                    obj.material = undefined;
                    obj.geometry = undefined;
                    transformControl.detach(obj);
                    await scene.remove(obj);
                }
            }
        }
        renderer.render(scene, camera);
        this.setState({
            newObjects: [],
        })
    }

    handleSaveImportComponent = async () => {
        if (Object.keys(this.state.selectedImportObject).length === 0) {
            this.setState({
                notificationVisible: true,
                notificationType: "error",
                notificationMessage: 'Please select component first'
            })
            return;
        }

        await this.removeNewObjectsFromScene();

        if (this.state.selectedImportObject["children"] !== undefined) {
            this.state.selectedImportObject["children"].forEach(item => {
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
                }
            })
        } else {
            this.setState({
                newObjects: [...this.state.newObjects, this.state.selectedImportObject]
            })
            if (this.state.selectedImportObject["geometryType"] === "BoxGeometry") {
                this.addCube('loaded', this.state.selectedImportObject, true);
            } else if (this.state.selectedImportObject["geometryType"] === "SphereGeometry") {
                this.addSphere('loaded', this.state.selectedImportObject, true);
            } else if (this.state.selectedImportObject["geometryType"] === "CylinderGeometry") {
                this.addCylinder('loaded', this.state.selectedImportObject, true);
            } else if (this.state.selectedImportObject["geometryType"] === 'TorusGeometry') {
                this.addTorus('loaded', this.state.selectedImportObject, true);
            }
        }

        this.setState({
            componentName: this.state.selectedImportObject["name"],
            saveAsComponentName: this.state.selectedImportObject["name"],
            visibleImportComponent: false,
            notificationVisible: true,
            notificationType: "success",
            notificationMessage: 'Component successfully added to the scene'
        })
    }

    handleSelectImportComponent = (object) => {
        this.setState({
            selectedImportObject: object,
        })
    }

    handleSaveComponentOverlay = () => {
        this.setState({
            visibleSaveComponent: true,
        })
    }

    handleDismissSaveComponent = () => {
        this.setState({
            visibleSaveComponent: false
        })
    }

    handleSaveSaveComponent = () => {
        switch (this.state.activeTab) {
            case 'save':
                this.saveComponentObjects();
                break;
            case 'saveas':
                this.saveAsComponentObjects();
                break;
        }
    }

    handleOnTabClick = (activeTab) => {
        this.setState({
            activeTab,
        })
    }

    handleFileUploadOverlay = () => {
        this.setState({
            visibleFileUpload: true
        })
    }

    handleDismissFileUpload = () => {
        this.setState({
            visibleFileUpload: false
        })
    }

    handleClickAddObject = (type) => {
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

    private get headerChildren(): JSX.Element[] {
        return [
            <QuestionMarkTooltip
                diameter={20}
                tooltipStyle={{ width: '400px' }}
                color={ComponentColor.Secondary}
                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                    <div style={{ color: InfluxColors.Star }}>{"How to add texture:"}
                        <hr style={tipStyle} />
                    </div>
                    {addTexture}
                </div>}
            />
        ]
    }

    public render(): JSX.Element {
        const dtList = this.state.dtList.map(item => {
            return (
                <Dropdown.Item
                    testID="dropdown-item generate-token--read-write"
                    id={item['value']}
                    key={item['value']}
                    value={item}
                    onClick={this.handleChangeDT}
                >
                    {item['text']}
                </Dropdown.Item>
            )
        })

        const textureList = this.state.textures.map(texture => {
            return (
                <Dropdown.Item
                    id={texture['filename']}
                    key={texture['filename']}
                    value={texture}
                    onClick={this.handleClickTexture}
                >
                    {texture['filename']}
                </Dropdown.Item>
            )
        })

        const addObjectType = this.state.addObjectType.map(item => {
            return (
                <Dropdown.Item
                    id={item['text']}
                    key={item['text']}
                    value={item}
                    onClick={this.handleClickAddObject}
                >
                    {item['text']}
                </Dropdown.Item>
            )
        })

        const tabs: TabbedPageTab[] = [
            {
                text: 'Save',
                id: 'save',
            },
            {
                text: 'Save as',
                id: 'saveas',
            },
        ]

        return (
            <Page>
                <Page.Header fullWidth={true}>
                    <Page.Title title={"Digital Twin Management"}></Page.Title>
                    <QuestionMarkTooltip
                        style={{ marginBottom: '8px' }}
                        diameter={30}
                        tooltipStyle={{ width: '400px' }}
                        color={ComponentColor.Secondary}
                        tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                            <div style={{ color: InfluxColors.Star }}>{"About the Digital Twin Monitor Page:"}
                                <hr style={tipStyle} />
                            </div>
                            {dtManagementPage}
                        </div>}
                    />
                </Page.Header>
                <Page.Contents fullWidth={true} scrollable={true}>
                    <Grid>
                        <Grid.Row>
                            {/* Left Side */}
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Twelve}
                                widthMD={Columns.Two}
                                widthLG={Columns.Two}
                                style={{ marginTop: '20px' }}
                            >
                                <Panel>
                                    <Panel.Header size={ComponentSize.ExtraSmall}>
                                        <Grid>
                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Twelve}>
                                                    <Form.Element label="Component name">
                                                        <Input
                                                            name="componentName"
                                                            placeholder="Component name.."
                                                            onChange={this.handleChangeInput}
                                                            value={this.state.componentName}
                                                            status={ComponentStatus.Disabled}
                                                        />
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Twelve}>
                                                    <Form.Element label="Box Measure">
                                                        <FlexBox margin={ComponentSize.Small}>
                                                            <Input
                                                                name="boxMeasureX"
                                                                placeholder="x"
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.boxMeasureX}
                                                                type={InputType.Number}
                                                                status={ComponentStatus.Disabled}
                                                            />

                                                            <Input
                                                                name="boxMeasureY"
                                                                placeholder="y"
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.boxMeasureY}
                                                                type={InputType.Number}
                                                                status={ComponentStatus.Disabled}
                                                            />

                                                            <Input
                                                                name="boxMeasureZ"
                                                                placeholder="z"
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.boxMeasureZ}
                                                                type={InputType.Number}
                                                                status={ComponentStatus.Disabled}
                                                            />
                                                        </FlexBox>
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Twelve}>
                                                    <Form.Element label="Position">
                                                        <FlexBox margin={ComponentSize.Small}>
                                                            <Input
                                                                name="positionX"
                                                                placeholder="x"
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.positionX}
                                                                type={InputType.Number}
                                                                status={ComponentStatus.Disabled}
                                                            />

                                                            <Input
                                                                name="positionY"
                                                                placeholder="y"
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.positionY}
                                                                type={InputType.Number}
                                                                status={ComponentStatus.Disabled}
                                                            />

                                                            <Input
                                                                name="positionZ"
                                                                placeholder="z"
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.positionZ}
                                                                status={ComponentStatus.Disabled}
                                                                type={InputType.Number}
                                                            />
                                                        </FlexBox>
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Column widthXS={Columns.Twelve}>
                                                    <Form.Element label="Rotation">
                                                        <FlexBox margin={ComponentSize.Small}>
                                                            <Input
                                                                name="rotationX"
                                                                placeholder="x"
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.rotationX}
                                                                status={ComponentStatus.Disabled}
                                                                type={InputType.Number}
                                                            />

                                                            <Input
                                                                name="rotationY"
                                                                placeholder="y"
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.rotationY}
                                                                status={ComponentStatus.Disabled}
                                                                type={InputType.Number}
                                                            />

                                                            <Input
                                                                name="rotationZ"
                                                                placeholder="z"
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.rotationZ}
                                                                status={ComponentStatus.Disabled}
                                                                type={InputType.Number}
                                                            />
                                                        </FlexBox>
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Column widthSM={Columns.Twelve}>
                                                    <Form.Element label="Color">
                                                        <ColorPicker
                                                            color={this.state.color}
                                                            onChange={this.handleColorChange}
                                                        />
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Column>
                                                    <FlexBox margin={ComponentSize.Medium}>
                                                        <Form.Element label="Texture">
                                                            <Dropdown
                                                                button={(active, onClick) => (
                                                                    <Dropdown.Button
                                                                        active={active}
                                                                        onClick={onClick}
                                                                        color={ComponentColor.Secondary}
                                                                    >
                                                                        {
                                                                            Object.keys(this.state.selectedTexture).length === 0
                                                                                ? 'No texture selected'
                                                                                : this.state.selectedTexture['filename']
                                                                        }
                                                                    </Dropdown.Button>
                                                                )}
                                                                menu={onCollapse => (
                                                                    <Dropdown.Menu onCollapse={onCollapse}>
                                                                        <DapperScrollbars
                                                                            autoHide={false}
                                                                            autoSizeHeight={true} style={{ maxHeight: '150px' }}
                                                                            className="data-loading--scroll-content"
                                                                        >
                                                                            {
                                                                                textureList
                                                                            }
                                                                        </DapperScrollbars>
                                                                    </Dropdown.Menu>
                                                                )}
                                                            />
                                                        </Form.Element>
                                                        <QuestionMarkTooltip
                                                            style={{ marginTop: '8px' }}
                                                            diameter={20}
                                                            tooltipStyle={{ width: '400px' }}
                                                            color={ComponentColor.Secondary}
                                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                                <div style={{ color: InfluxColors.Star }}>{"Texture:"}
                                                                    <hr style={tipStyle} />
                                                                </div>
                                                                {objectTexture}
                                                            </div>}
                                                        />
                                                    </FlexBox>
                                                </Grid.Column>
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Column widthSM={Columns.Six}>
                                                    <Form.Element label="Opacity">
                                                        <FlexBox
                                                            direction={FlexDirection.Row}
                                                            margin={ComponentSize.Small}
                                                        >
                                                            <Input
                                                                name="opacity"
                                                                placeholder="Opacity.."
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.opacity}
                                                                type={InputType.Number}
                                                                maxLength={1}
                                                                max={1}
                                                                min={0.1}
                                                                step={0.1}
                                                            />
                                                            <QuestionMarkTooltip
                                                                diameter={20}
                                                                tooltipStyle={{ width: '400px' }}
                                                                color={ComponentColor.Secondary}
                                                                tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                                    <div style={{ color: InfluxColors.Star }}>{"Opacity:"}
                                                                        <hr style={tipStyle} />
                                                                    </div>
                                                                    {objectOpacity}
                                                                </div>}
                                                            />
                                                        </FlexBox>
                                                    </Form.Element>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Panel.Header>

                                    <Panel.Body size={ComponentSize.ExtraSmall}>
                                        <Grid.Row>
                                            <div style={{ float: 'right' }}>
                                                <QuestionMarkTooltip
                                                    diameter={20}
                                                    style={{ marginRight: '10px' }}
                                                    tooltipStyle={{ width: '400px' }}
                                                    color={ComponentColor.Secondary}
                                                    tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                        <div style={{ color: InfluxColors.Star }}>{"Update - Remove:"}
                                                            <hr style={tipStyle} />
                                                        </div>
                                                        {objectUpdateRemove}
                                                    </div>}
                                                />
                                                <Button
                                                    text="Remove"
                                                    onClick={this.removeObjectFromScene}
                                                    type={ButtonType.Button}
                                                    icon={IconFont.Remove}
                                                    color={ComponentColor.Danger}
                                                    style={{ marginRight: '10px', marginBottom: '20px' }}
                                                />
                                                <Button
                                                    text="Update"
                                                    onClick={this.changeObjectProperties}
                                                    type={ButtonType.Button}
                                                    icon={IconFont.Checkmark}
                                                    color={ComponentColor.Success}
                                                />
                                            </div>
                                        </Grid.Row>
                                    </Panel.Body>
                                </Panel>
                            </Grid.Column>

                            {/* Right Side */}
                            <Grid.Column
                                widthXS={Columns.Twelve}
                                widthSM={Columns.Twelve}
                                widthMD={Columns.Ten}
                                widthLG={Columns.Ten}
                                style={{ marginTop: '20px' }}
                            >
                                <Panel>
                                    <Panel.Header size={ComponentSize.ExtraSmall}>
                                        <Grid>
                                            <Grid.Row>
                                                <FlexBox margin={ComponentSize.Small}>
                                                    <Dropdown
                                                        style={{ maxWidth: '150px', width: '150px' }}
                                                        button={(active, onClick) => (
                                                            <Dropdown.Button
                                                                style={{ maxWidth: '150px' }}
                                                                icon={IconFont.Plus}
                                                                active={active}
                                                                onClick={onClick}
                                                                color={ComponentColor.Secondary}
                                                            >
                                                                {"Add Object"}
                                                            </Dropdown.Button>
                                                        )}
                                                        menu={onCollapse => (
                                                            <Dropdown.Menu
                                                                style={{ maxWidth: '150px' }}
                                                                onCollapse={onCollapse}
                                                            >
                                                                {
                                                                    addObjectType
                                                                }
                                                            </Dropdown.Menu>
                                                        )}
                                                    />
                                                    <Button
                                                        text="Texture Upload"
                                                        icon={IconFont.Export}
                                                        onClick={this.handleFileUploadOverlay}
                                                        type={ButtonType.Button}
                                                        color={ComponentColor.Primary}
                                                    />
                                                    <Button
                                                        text="Import Component"
                                                        icon={IconFont.Import}
                                                        onClick={this.handleImportComponentToScene}
                                                        type={ButtonType.Button}
                                                        color={ComponentColor.Primary}
                                                    />
                                                    <Button
                                                        text="Save Component"
                                                        icon={IconFont.Checkmark}
                                                        onClick={this.handleSaveComponentOverlay}
                                                        type={ButtonType.Button}
                                                        color={ComponentColor.Success}
                                                    />

                                                    <div className="tabbed-page--header-right">
                                                        <QuestionMarkTooltip
                                                            diameter={20}
                                                            tooltipStyle={{ width: '400px' }}
                                                            color={ComponentColor.Secondary}
                                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                                <div style={{ color: InfluxColors.Star }}>{"Select Digital Twin:"}
                                                                    <hr style={tipStyle} />
                                                                </div>
                                                                {objectSelectDT}
                                                            </div>}
                                                        />
                                                        <Dropdown
                                                            style={{ width: '150px' }}
                                                            button={(active, onClick) => (
                                                                <Dropdown.Button
                                                                    active={active}
                                                                    onClick={onClick}
                                                                    color={ComponentColor.Primary}
                                                                >
                                                                    {this.state.selectedDT['text']}
                                                                </Dropdown.Button>
                                                            )}
                                                            menu={onCollapse => (
                                                                <Dropdown.Menu
                                                                    style={{ width: '150px' }}
                                                                    onCollapse={onCollapse}
                                                                >
                                                                    {
                                                                        dtList
                                                                    }
                                                                </Dropdown.Menu>
                                                            )}
                                                        />
                                                    </div>
                                                </FlexBox>
                                            </Grid.Row>
                                        </Grid>
                                    </Panel.Header>

                                    <Panel.Body size={ComponentSize.Small} id={"visualizeGraph"}>
                                        <div id="sceneArea"></div>
                                    </Panel.Body>
                                </Panel>
                            </Grid.Column>
                        </Grid.Row>

                        {/* Notification Component */}
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

                        {/* Import Component Overlay */}
                        <Overlay visible={this.state.visibleImportComponent}>
                            <Overlay.Container maxWidth={600}>
                                <Overlay.Header
                                    title="Import Component"
                                    onDismiss={this.handleDismissImportComponent}
                                    children={<QuestionMarkTooltip
                                        diameter={20}
                                        tooltipStyle={{ width: '400px' }}
                                        color={ComponentColor.Secondary}
                                        tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                            <div style={{ color: InfluxColors.Star }}>{"Import Component:"}
                                                <hr style={tipStyle} />
                                            </div>
                                            {objectImportComponent}
                                        </div>}
                                    />}
                                />

                                <Overlay.Body>
                                    <Form>
                                        <Grid.Row>
                                            <Grid.Column widthSM={Columns.Twelve}>
                                                <Form.Element label="Component">
                                                    <DapperScrollbars
                                                        autoHide={false}
                                                        autoSizeHeight={true} style={{ maxHeight: '200px' }}
                                                        className="data-loading--scroll-content"
                                                    >
                                                        <List>
                                                            {
                                                                this.state.registeredObjectList.map((object) => {
                                                                    return (
                                                                        <List.Item
                                                                            key={object["name"]}
                                                                            value={object["name"]}
                                                                            onClick={() => this.handleSelectImportComponent(object)}
                                                                            title={object["name"]}
                                                                            gradient={Gradients.GundamPilot}
                                                                            wrapText={true}
                                                                            selected={this.state.selectedImportObject["name"] === object["name"] ? true : false}
                                                                        >
                                                                            <FlexBox
                                                                                direction={FlexDirection.Row}
                                                                                margin={ComponentSize.Small}
                                                                            >
                                                                                <List.Indicator type="dot" />
                                                                                <List.Indicator type="checkbox" />
                                                                                <div className="selectors--item-value selectors--item__measurement">
                                                                                    {object["name"]}
                                                                                </div>
                                                                            </FlexBox>
                                                                        </List.Item>
                                                                    )
                                                                })
                                                            }
                                                        </List>
                                                    </DapperScrollbars>
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Form.Footer>
                                            <Button
                                                text="Cancel"
                                                icon={IconFont.Remove}
                                                onClick={this.handleDismissImportComponent}
                                            />

                                            <Button
                                                text="Import"
                                                icon={IconFont.Import}
                                                color={ComponentColor.Success}
                                                type={ButtonType.Submit}
                                                onClick={this.handleSaveImportComponent}
                                            />
                                        </Form.Footer>
                                    </Form>
                                </Overlay.Body>
                            </Overlay.Container>
                        </Overlay>

                        {/* Save Component Overlay */}
                        <Overlay visible={this.state.visibleSaveComponent}>
                            <Overlay.Container maxWidth={400}>
                                <Overlay.Header
                                    title="Save Component"
                                    onDismiss={this.handleDismissSaveComponent}
                                    children={
                                        <QuestionMarkTooltip
                                            diameter={20}
                                            tooltipStyle={{ width: '400px' }}
                                            color={ComponentColor.Secondary}
                                            tooltipContents={<div style={{ whiteSpace: 'pre-wrap', fontSize: "13px" }}>
                                                <div style={{ color: InfluxColors.Star }}>{"Save Component:"}
                                                    <hr style={tipStyle} />
                                                </div>
                                                {objectSaveAndSaveAs}
                                            </div>}
                                        />
                                    }
                                />

                                <Overlay.Body>
                                    <TabbedPageTabs
                                        tabs={tabs}
                                        activeTab={this.state.activeTab}
                                        onTabClick={this.handleOnTabClick}
                                    />
                                    <br />
                                    {
                                        this.state.activeTab === "save"
                                            ? (
                                                <Grid.Row>
                                                    <Grid.Column widthXS={Columns.Twelve}>
                                                        <Form.Element label="Component name">
                                                            <Input
                                                                name="componentName"
                                                                placeholder="Component name.."
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.componentName}
                                                                status={ComponentStatus.Disabled}
                                                            />
                                                        </Form.Element>
                                                    </Grid.Column>
                                                </Grid.Row>
                                            )
                                            : (
                                                <Grid.Row>
                                                    <Grid.Column widthXS={Columns.Twelve}>
                                                        <Form.Element label="Component name">
                                                            <Input
                                                                name="saveAsComponentName"
                                                                placeholder="Component name.."
                                                                onChange={this.handleChangeInput}
                                                                value={this.state.saveAsComponentName}
                                                            />
                                                        </Form.Element>
                                                    </Grid.Column>
                                                </Grid.Row>
                                            )
                                    }
                                    <Form>
                                        <Form.Footer>
                                            <Button
                                                text="Cancel"
                                                icon={IconFont.Remove}
                                                onClick={this.handleDismissSaveComponent}
                                            />

                                            <Button
                                                text="Save"
                                                icon={IconFont.Checkmark}
                                                color={ComponentColor.Success}
                                                type={ButtonType.Submit}
                                                onClick={this.handleSaveSaveComponent}
                                            />
                                        </Form.Footer>
                                    </Form>
                                </Overlay.Body>
                            </Overlay.Container>
                        </Overlay>

                        {/* File Upload Overlay */}
                        <Overlay visible={this.state.visibleFileUpload}>
                            <Overlay.Container maxWidth={400}>
                                <Overlay.Header
                                    title="Texture Upload"
                                    onDismiss={this.handleDismissFileUpload}
                                    children={this.headerChildren}
                                />

                                <Overlay.Body>
                                    <Form>
                                        <Grid.Row>
                                            <Grid.Column widthSM={Columns.Twelve}>
                                                <Form.Element label="Texture Name">
                                                    <Input
                                                        name="textureFileName"
                                                        placeholder="Texture name.."
                                                        onChange={this.handleChangeInput}
                                                        value={this.state.textureFileName}
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column widthSM={Columns.Twelve}>
                                                <Form.Element label="File Upload">
                                                    <input
                                                        name="file"
                                                        type="file"
                                                        id="inputFile"
                                                        accept=".jpg, .jpeg, .png, .svg"
                                                    />
                                                </Form.Element>
                                            </Grid.Column>
                                        </Grid.Row>

                                        <Form.Footer>
                                            <Button
                                                text="Cancel"
                                                icon={IconFont.Remove}
                                                onClick={this.handleDismissFileUpload}
                                            />

                                            <Button
                                                text="Upload"
                                                icon={IconFont.Export}
                                                color={ComponentColor.Success}
                                                type={ButtonType.Submit}
                                                onClick={this.handleFileUpload}
                                            />
                                        </Form.Footer>
                                    </Form>
                                </Overlay.Body>
                            </Overlay.Container>
                        </Overlay>
                    </Grid>
                </Page.Contents>
            </Page>
        )
    }
}

export default ObjectCreatorPage;
