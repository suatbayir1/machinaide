// Libraries
import React, { PureComponent } from 'react'
import {
    Overlay,
} from '@influxdata/clockface'
var THREE = require("three");
var OrbitControls = require("three-orbit-controls")(THREE);
var initializeDomEvents = require('threex-domevents')
var THREEx = {}
initializeDomEvents(THREE, THREEx)
var camera, controls, scene, renderer;
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"

interface Props { }
interface State {
}

class FactorySceneOverlay extends PureComponent<Props, State> {
    constructor(props) {
        super(props)

        this.state = {
        }
    }

    async componentDidMount(): Promise<void> {
        setTimeout(async () => {
            await this.createScene();
            await this.renderGLTFModel();
            await this.responsiveConfiguration();
        }, 1000);
    }

    componentWillUnmount() {
        window.addEventListener('resize', () => {
            if (document.querySelector("#visualizeGraph") !== null) {
                renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 40, 700);
            }
        });
    }


    renderGLTFModel = async () => {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();

        dracoLoader.setDecoderPath("../../node_modules/three/examples/js/libs/draco/");
        loader.setDRACOLoader(dracoLoader);

        await loader.load(
            '../../assets/images/model/ermetal.glb',

            async function (gltf) {
                gltf.scene.scale.set(0.01, 0.01, 0.01);
                gltf.scene.position.set(0, 0, 0)
                renderer.setClearColor(0xbfe3dd);
                await scene.add(gltf.scene);
                await renderer.render(scene, camera);
            },

            function (xhr) {
            },

            function (error) {
            }
        );
        await renderer.render(scene, camera);
    }

    createScene = async () => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        camera.position.set(454.94, 105.60, 225.82);
        camera.quaternion.set(0.83, -0.8, 0.52, -0.05);
        camera.rotation.set(-0.43, 1.06, 0.39);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.setClearColor(0x000000);
        renderer.setSize(window.innerWidth * 0.90, window.innerHeight * 0.80);

        const element = await document.getElementById("sceneArea");
        element.appendChild(renderer.domElement);

        // Light
        scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.4));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 2, 8);
        scene.add(dirLight);

        // Mouse Controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZomm = true;
        controls.zoomSpeed = 0.5;
        controls.update();

        // watch camera transform 
        controls.addEventListener("change", () => {
            renderer.render(scene, camera);
        });

    }

    responsiveConfiguration = () => {
        renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 40, 700);
        renderer.render(scene, camera);

        window.addEventListener('resize', () => {
            if (document.querySelector("#visualizeGraph") !== null) {
                renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 40, 700);
            }
        });
    }

    private closeModal = () => {
        this.props["history"].goBack()
    }

    public render(): JSX.Element {
        return (
            <Overlay visible={true}>
                <Overlay.Container maxWidth={1500}>
                    <Overlay.Header
                        title="Factory Scene"
                        onDismiss={this.closeModal}
                    />
                    <Overlay.Body id={"visualizeGraph"}>
                        <div id="sceneArea"></div>
                    </Overlay.Body>

                </Overlay.Container>
            </Overlay>
        )
    }
}

export default FactorySceneOverlay;
