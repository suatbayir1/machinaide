// Libraries
import React, { PureComponent } from "react";

// Services
import DTService from "src/shared/services/DTService";

// Components
import {
  Panel,
  ComponentSize,
  TechnoSpinner,
  RemoteDataState,
  SpinnerContainer
} from '@influxdata/clockface'
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";

// Helpers
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
  selectedGraphNode: object
  refreshVisualizePage: boolean
  resultNLPQuery: object
}

interface State {
  clickedObject: string
  cubeInfo: object,
  constantJsonData: string[]
  spinnerLoading: RemoteDataState
}

class DigitalTwinVisualize extends PureComponent<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      clickedObject: "",
      cubeInfo: [],
      constantJsonData: [],
      spinnerLoading: RemoteDataState.Loading
    }
  }

  async componentDidMount(): Promise<void> {
    await this.renderVisualizeData();
    await this.responsiveConfiguration();
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.cubeInfo !== this.props.selectedGraphNode) {
      if (scene === undefined) { return; }

      if (Object.keys(this.props.selectedGraphNode).length > 0) {
        const isRemovedScene = await this.removeAllObjectFromScene();
        if (isRemovedScene) {
          const payload = {
            "type": this.props.selectedGraphNode["type"],
            "name": this.props.selectedGraphNode["name"]
          };
          let cubeInfo = await this.filterSceneBySelectedNode(payload);
          this.cubeCreator(cubeInfo);
          this.addLightsToScene();
        }
      }
    }

    if (prevProps.refreshVisualizePage !== this.props.refreshVisualizePage) {
      await this.removeAllObjectFromScene();
      const cubeInfo = await DTService.getAllDT();
      const renderedCubeInfo = await this.renderInitialCubeInfo(cubeInfo);
      this.setState({
        cubeInfo: renderedCubeInfo,
        constantJsonData: cubeInfo,
        spinnerLoading: RemoteDataState.Done
      })
      this.cubeCreator(renderedCubeInfo);
      this.addLightsToScene();
    }

    if (prevProps.resultNLPQuery !== this.props.resultNLPQuery) {
      await this.removeAllObjectFromScene();
      let cubeInfo = await this.handleResultNLPQuery(this.props.resultNLPQuery);
      this.cubeCreator(cubeInfo);
      this.addLightsToScene();
    }
  }

  async componentWillUnmount() {
    await this.removeAllObjectFromScene();
    window.removeEventListener('resize', () => {
      renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 30, document.querySelector("#visualizeGraph").clientHeight - 30);
    });
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

  responsiveConfiguration = () => {
    renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 30, document.querySelector("#visualizeGraph").clientHeight - 30);
    renderer.render(scene, camera);

    window.addEventListener('resize', () => {
      if (document.querySelector("#visualizeGraph") !== null) {
        renderer.setSize(document.querySelector("#visualizeGraph").clientWidth - 30, document.querySelector("#visualizeGraph").clientHeight - 30);
      }
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

  handleResultNLPQuery = async (payload) => {
    let cubeInfo = JSON.parse(JSON.stringify(this.state.constantJsonData[0]));

    const machineList = [];
    const componentList = [];
    const sensorList = [];

    await cubeInfo["productionLines"].forEach(pl => {
      pl["machines"].forEach(machine => {
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
    })

    let searchMachines = []
    let searchComponents = []
    let searchSensors = []

    if (payload["machines"] === "*") {
      searchMachines = machineList;
    } else {
      searchMachines = payload["machines"];
    }

    if (payload["components"] === "*") {
      searchComponents = componentList;
    } else {
      searchComponents = payload["components"];
    }

    if (payload["sensors"] === "*") {
      searchSensors = sensorList;
    } else {
      searchSensors = payload["sensors"];
    }

    cubeInfo["productionLines"].forEach(pl => {
      pl["machines"].forEach(machine => {
        if (searchMachines.includes(machine["name"])) {
          machine["contents"].forEach(component => {
            if (component["@type"] === "Component") {
              if (searchComponents.includes(component["name"])) {
                if (component["visual"] !== undefined) {
                  component["visual"].forEach(componentVisual => {
                    componentVisual["isRender"] = true;
                  })
                }

                component["sensors"].forEach(sensor => {
                  if (searchSensors.includes(sensor["name"])) {
                    if (sensor["visual"] !== undefined) {
                      sensor["visual"]["isRender"] = true;
                    }
                  }
                })
              }
            }
          })
        }
      })
    })

    return cubeInfo;
  }

  renderInitialCubeInfo = async (payload) => {
    let cubeInfo = JSON.parse(JSON.stringify(payload));

    cubeInfo?.[0]?.["productionLines"].forEach(pl => {
      pl?.["machines"].forEach(machine => {
        machine?.["contents"].forEach(component => {
          if (component["@type"] === "Component") {
            if (component["visual"] !== undefined && component["visual"] !== "") {
              component["visual"]["objects"].forEach(visual => {
                visual["isRender"] = true;
              })
            }

            component?.["sensors"].forEach(sensor => {
              if (sensor["visual"] !== undefined && sensor["visual"] !== "") {
                sensor["visual"]["objects"].forEach(visual => {
                  visual["isRender"] = true;
                })
              }
            })
          }
        })
      })
    })

    return cubeInfo;
  }

  removeAllObjectFromScene = async () => {
    if (scene !== undefined) {
      let obj;
      for (var i = scene.children.length - 1; i >= 0; i--) {
        obj = scene.children[i];
        obj.material = undefined;
        obj.geometry = undefined;
        await scene.remove(obj);
      }
      renderer.render(scene, camera);
      return true;
    }
    return false;
  }

  createSceneAndCamera() {
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
    renderer.setSize(555, 750);
    document.getElementById("visualizeArea").appendChild(renderer.domElement);

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

  addLightsToScene = () => {
    // grid
    const grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
    scene.add(grid);

    // lights
    const light = new THREE.HemisphereLight(0xffeeee, 0x111122);
    scene.add(light);

    renderer.render(scene, camera);
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

  addColladaFile = async (object, wireframe) => {
    const loader = new ColladaLoader();

    let vm = this;
    await loader.load(`../../assets/images/model/${object['fileName']}`, async function (collada) {
      dae = collada.scene;
      dae.traverse(function (child) {
        if (child.isMesh) {
          child.material.flatShading = true;

          if (object["color"] !== undefined || object["opacity"] !== undefined) {
            child.material.color.set(object["color"]);
            child.material.opacity = object["opacity"];
          }
        }
      });

      dae.scale.x = object["boxMeasure"]["x"];
      dae.scale.y = object["boxMeasure"]["y"];
      dae.scale.z = object["boxMeasure"]["z"];
      dae.position.x = object["position"]["x"];
      dae.position.y = object["position"]["y"];
      dae.position.z = object["position"]["z"];

      dae.updateMatrix();
      // kinematics = collada.kinematics;

      Object.keys(collada.library.materials).forEach(material => {
        collada.library.materials[material].build.wireframe = wireframe;
      })

      vm.addObjectToScene(dae);

      scene.add(dae);
      renderer.render(scene, camera);
      // vm.setupTween();
      // vm.animate();
    });
    await renderer.render(scene, camera);
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

  filterSceneBySelectedNode = (payload) => {
    let cubeInfo = JSON.parse(JSON.stringify(this.state.constantJsonData[0]));

    switch (payload["type"]) {
      case "Factory":
        cubeInfo["productionLines"].forEach(pl => {
          pl["machines"].forEach(machine => {
            machine["contents"].forEach(component => {
              if (component["@type"] === "Component") {
                if (component["visual"] !== undefined && component["visual"] !== "") {
                  component["visual"]["objects"].forEach(visual => {
                    visual["isRender"] = true;
                  })
                }

                component["sensors"].forEach(sensor => {
                  if (sensor["visual"] !== undefined && sensor["visual"] !== "") {
                    sensor["visual"]["objects"].forEach(sensorVisual => {
                      sensorVisual["isRender"] = true;
                    })
                  }
                })
              }
            })
          })
        })
        break;
      case "ProductionLine":
        cubeInfo["productionLines"].forEach(pl => {
          if (pl["name"] === payload["name"]) {
            pl["machines"].forEach(machine => {
              machine["contents"].forEach(component => {
                if (component["@type"] === "Component") {
                  if (component["visual"] !== undefined && component["visual"] !== "") {
                    component["visual"]["objects"].forEach(visual => {
                      visual["isRender"] = true;
                    })
                  }

                  component["sensors"].forEach(sensor => {
                    if (sensor["visual"] !== undefined && sensor["visual"] !== "") {
                      sensor["visual"]["objects"].forEach(sensorVisual => {
                        sensorVisual["isRender"] = true;
                      })
                    }
                  })
                }
              })
            })
          }
        })
        break;
      case "Machine":
        cubeInfo["productionLines"].forEach(pl => {
          pl["machines"].forEach(machine => {
            if (machine["displayName"] === payload["name"]) {
              machine["contents"].forEach(component => {
                if (component["@type"] === "Component") {
                  if (component["visual"] !== undefined && component["visual"] !== "") {
                    component["visual"]["objects"].forEach(visual => {
                      visual["isRender"] = true;
                    })
                  }

                  component["sensors"].forEach(sensor => {
                    if (sensor["visual"] !== undefined && sensor["visual"] !== "") {
                      sensor["visual"]["objects"].forEach(sensorVisual => {
                        sensorVisual["isRender"] = true;
                      })
                    }
                  })
                }
              })
            }
          })
        })
        break;
      case "Component":
        cubeInfo["productionLines"].forEach(pl => {
          pl["machines"].forEach(machine => {
            machine["contents"].forEach(component => {
              if (component["@type"] === "Component" && component["name"] === payload["name"]) {
                if (component["visual"] !== undefined && component["visual"] !== "") {
                  component["visual"]["objects"].forEach(visual => {
                    visual["isRender"] = true;
                  })
                }

                component["sensors"].forEach(sensor => {
                  if (sensor["visual"] !== undefined && sensor["visual"] !== "") {
                    sensor["visual"]["objects"].forEach(sensorVisual => {
                      sensorVisual["isRender"] = true;
                    })
                  }
                })
              }
            })
          })
        })
        break;
      case "Sensor":
        cubeInfo["productionLines"].forEach(pl => {
          pl["machines"].forEach(machine => {
            machine["contents"].forEach(component => {
              if (component["@type"] === "Component") {
                component["sensors"].forEach(sensor => {
                  if (sensor["name"] === payload["name"]) {
                    if (sensor["visual"] !== undefined && sensor["visual"] !== "") {
                      sensor["visual"]["objects"].forEach(sensorVisual => {
                        sensorVisual["isRender"] = true;
                      })
                    }
                  }
                })
              }
            })
          })
        })
        break;
      case "Field":
        cubeInfo["productionLines"].forEach(pl => {
          pl["machines"].forEach(machine => {
            machine["contents"].forEach(component => {
              if (component["@type"] === "Component") {
                component["sensors"].forEach(sensor => {
                  sensor["fields"].forEach(field => {
                    if (field["name"] === payload["name"]) {
                      if (sensor["visual"] !== undefined && sensor["visual"] !== "") {
                        sensor["visual"]["objects"].forEach(sensorVisual => {
                          sensorVisual["isRender"] = true;
                        })
                      }
                    }
                  })
                })
              }
            })
          })
        })
        break;
    }

    return cubeInfo;
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

  cubeCreator(payload) {
    let CubeInfo = payload;
    let wireframe;

    if (CubeInfo == undefined) {
      return;
    }

    if (payload.productionLines === undefined) {
      CubeInfo = payload[0];
    }

    if (CubeInfo == undefined) {
      return;
    }

    CubeInfo["productionLines"].forEach(pl => {
      pl["machines"].forEach((machine) => {
        if (machine["contents"] !== undefined) {
          machine["contents"].forEach((component) => {
            if (component["@type"] === "Component") {
              if (component["visual"] !== undefined && component["visual"] !== "") {
                component["visual"]["objects"].forEach((visualObject) => {
                  wireframe = visualObject["isRender"] ? false : true;
                  this.handleAddObjectType(visualObject, wireframe);
                });
              }

              component["sensors"].forEach((sensor) => {
                if (sensor["visual"] !== undefined && sensor["visual"] !== "") {
                  sensor["visual"]["objects"].forEach((sensorVisualObject) => {
                    wireframe = sensorVisualObject["isRender"] ? false : true;
                    this.handleAddObjectType(sensorVisualObject, wireframe);
                  })
                }
              })
            }
          })
        }
      })
    })

    renderer.render(scene, camera);
  }

  public render() {
    const { spinnerLoading } = this.state

    return (
      <>
        <Panel>
          <Panel.Body size={ComponentSize.ExtraSmall} id={"visualizeGraph"}>
            <SpinnerContainer loading={spinnerLoading} spinnerComponent={<TechnoSpinner />}>
            </SpinnerContainer>
            <div id="visualizeArea"></div>
          </Panel.Body>
        </Panel>
      </>
    );
  }
}

export default DigitalTwinVisualize;