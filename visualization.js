 import { 
    Engine3D,
    Scene3D,
    Object3D,
    Camera3D,
    View3D,
    LitMaterial,
    BoxGeometry,
    MeshRenderer,
    DirectLight,
    HoverCameraController,
    AtmosphericComponent
  } from '@orillusion/core';

async function init() {
  let canvas = document.getElementById('canvas');
  const engine = await Engine3D.init({
    canvasConfig: { canvas }
  });
  let scene = new Scene3D();
  let sky = scene.addComponent(AtmosphericComponent);
  
  let cameraObj = new Object3D();
  let camera = cameraObj.addComponent(Camera3D);
  camera.perspective(60, window.innerWidth / window.innerHeight, 1, 50000.0);

  let controller = cameraObj.addComponent(HoverCameraController);
  controller.setCamera(0,0,15);

  scene.addChild(cameraObj);

  let lightObj = new Object3D();
  let light = lightObj.addComponent(DirectLight);

  lightObj.rotationX = 45;
  lightObj.rotationY = 30;
  light.intensity = 2;
  scene.addChild(lightObj);

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