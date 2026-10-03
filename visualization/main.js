import * as THREE from 'three';
import { pass, screenUV } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OrbitManager } from './orbit-manager.js'
import BlackHoleNode from './shaders/blackhole-tsl.js'
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'dat.gui'

import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';

let canvas = document.querySelector( '#c' );

const renderer = new THREE.WebGPURenderer({antialias: true, forceWebGL:true, canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
await renderer.init();

const renderPipeline = new THREE.RenderPipeline(renderer);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
scene.add(camera);


const scenePass = pass(scene, camera);
renderPipeline.outputNode = scenePass;

const cubemapFaces = [
  './visualization/face_0.jpg',
  './visualization/face_1.jpg',
  './visualization/face_2.jpg',
  './visualization/face_3.jpg',
  './visualization/face_4.jpg',
  './visualization/face_5.jpg',
];
const cubeTexture = await new THREE.CubeTextureLoader().loadAsync(cubemapFaces);
cubeTexture.colorSpace = THREE.SRGBColorSpace;

const gui = new GUI();
const blackHoleNode = new BlackHoleNode(cubeTexture);
const orbitManager = new OrbitManager(blackHoleNode);

orbitManager.reference_object = OrbitManager.StellarObject.Star;

const orbitFolder = gui.addFolder('Orbit Manager');
orbitFolder.add(orbitManager, 'simulate');
orbitFolder.add(orbitManager, 'reference_object', {
  Star: OrbitManager.StellarObject.Star,
  BlackHole: OrbitManager.StellarObject.BlackHole
});
orbitFolder.add(orbitManager, 'sim_speed', 0, 10).name('simulation speed');
orbitFolder.add(orbitManager, 'AU_SCALE', 0, 50);
orbitFolder.add(orbitManager, 'object_scale', 0, 10);
orbitFolder.add(orbitManager, 'star_scale_mult', 0, 100);
orbitFolder.add(orbitManager, 'bh_scale_mult', 0, 100);

function addBodyControls(name, body) {
  const folder = gui.addFolder(name);
  folder.add(body, 'mass', 0, 20);
  folder.add(body, 'radius', 0, 1);
  folder.add(body, 'drag', 0, 1);

  const positionFolder = folder.addFolder('position');
  for (const axis of ['x', 'y', 'z']) {
    positionFolder.add(body.position, axis);
  }

  const velocityFolder = folder.addFolder('velocity');
  for (const axis of ['x', 'y', 'z']) {
    velocityFolder.add(body.velocity, axis);
  }
}

addBodyControls('Star', orbitManager.star);
addBodyControls('Black Hole', orbitManager.bh);

const blackHoleFolder = gui.addFolder('Black Hole Rendering');
blackHoleFolder.add(blackHoleNode.iterations, 'value', 1, 500).step(1).name('iterations');
blackHoleFolder.add(blackHoleNode.max_dist, 'value', 1, 100000).name('maximum distance');
blackHoleFolder.add(blackHoleNode.sky_brightness, 'value', 0, 5).name('sky brightness');
blackHoleFolder.add(blackHoleNode.epsilon, 'value', 0.000001, 0.01).name('surface tolerance');
blackHoleFolder.add(blackHoleNode.near_bh_step_mult, 'value', 0.001, 1).name('near-hole step');
blackHoleFolder.add(blackHoleNode.use_redshift, 'value').name('redshift');

const starColor = { color: `#${blackHoleNode.star_color.value.getHexString()}` };
blackHoleFolder.addColor(starColor, 'color').name('star color').onChange((value) => {
  blackHoleNode.star_color.value.set(value);
});
orbitFolder.open();
blackHoleFolder.open();

scene.backgroundNode = blackHoleNode;

const orbitControls = new OrbitControls(camera, renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);
stats.showPanel(0);

renderer.setAnimationLoop( render );

const clock = new THREE.Clock()
function render( time ) {
  canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  //renderer.render(scene, camera);
  orbitManager.update(clock.getDelta());
  renderPipeline.render()
  // scene.update();
  stats.update();
}
