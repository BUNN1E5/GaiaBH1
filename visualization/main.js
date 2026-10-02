
import { 
    Engine3D,
    Scene3D,
    Object3D,
    Camera3D,
    View3D,
    Material,
    LitMaterial,
    BoxGeometry,
    TriGeometry,
    MeshRenderer,
    DirectLight,
    FlyCameraController
  } from '@orillusion/core';
import { Stats } from "@orillusion/stats"
import { OrbitManager } from './orbit-manager.js';

async function init() {
  let canvas = document.getElementById('canvas');
  const engine = await Engine3D.init({
    canvasConfig: { canvas }
  });
  let scene = new Scene3D();
  scene.addComponent(Stats);
  
  let cameraObj = new Object3D();
  let camera = cameraObj.addComponent(Camera3D);
  camera.perspective(60, window.innerWidth / window.innerHeight, 1, 50000.0);
  cameraObj.addComponent(FlyCameraController);
  scene.addChild(cameraObj);

  let lightObj = new Object3D();
  let light = lightObj.addComponent(DirectLight);

  lightObj.rotationX = 45;
  lightObj.rotationY = 30;
  light.intensity = 2;
  scene.addChild(lightObj);

  let orbitManagerObj = new Object3D();
  let orbitMR = orbitManagerObj.addComponent(MeshRenderer);
  orbitMR.alwaysRender = true;
  orbitMR.geometry = new TriGeometry(1);
  let orbitManager = orbitManagerObj.addComponent(OrbitManager);

  const orbitMaterial = new Material();
  orbitMaterial.shader = orbitManager.shader;  
  const skyTexture = await engine.res.loadTextureCubeStd(
    // new URL('./starmap_2020_1920.jpg', import.meta.url).href
    new URL('./cubemap-ce5e089c5c27fbd2a65d664e021bef64.jpg', import.meta.url).href
  );

  orbitMaterial.setTexture('baseMap', skyTexture);
  orbitMR.material = orbitMaterial;

  scene.addChild(orbitManagerObj);

  //scene.addChild(orbitManagerObj);

  const obj = new Object3D();
  let mr = obj.addComponent(MeshRenderer);
  mr.geometry = new BoxGeometry(5,5,5);
  mr.material = new LitMaterial();

  scene.addChild(obj);

  let view = new View3D();
  view.scene = scene;
  view.camera = camera;
  engine.startRenderView(view);
}

init();