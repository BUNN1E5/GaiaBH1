// import * as Orillusion from 'orillusion';

// async function init() {
//   const canvas = document.getElementById('canvas');
//   const engine = new Orillusion.Engine3D({
//     canvas,
//   });

//   await engine.init();

//   // Create a simple scene
//   const scene = new Orillusion.Scene3D();
//   engine.sceneManager.addScene(scene);

//   // Add camera
//   const camera = new Orillusion.Camera3D();
//   camera.transform.position.set(0, 5, 10);
//   scene.addChild(camera);

//   // Add a cube (or whatever 3D object you want)
//   const cube = new Orillusion.Object3D();
//   scene.addChild(cube);

//   // Start render loop
//   await engine.run();
// }

// init();