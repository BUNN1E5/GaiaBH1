import * as THREE from 'three';
import { pass, mrt, output, emissive } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OrbitManager } from './orbit-manager.js'
import BlackHoleNode from './shaders/blackhole-tsl.js'
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'dat.gui'

import { bloom } from 'three/addons/tsl/display/BloomNode.js';

let canvas = document.querySelector( '#c' );

const renderer = new THREE.WebGPURenderer({antialias: true, forceWebGL:false, canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
await renderer.init();

const renderPipeline = new THREE.RenderPipeline(renderer);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
scene.add(camera);


const scenePass = pass( scene, camera );
scenePass.setMRT( mrt( {
	output,
	emissive
}));

const scenePassColor = scenePass.getTextureNode( 'output' );
const emissivePass = scenePass.getTextureNode( 'emissive' );
const bloomPass = bloom( emissivePass );
renderPipeline.outputNode = scenePassColor.add( bloomPass );

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

blackHoleNode.star_color.value.set(new THREE.Vector4(1, 1, 1, 1));
blackHoleNode.iterations = 500
blackHoleNode.max_dist = 100000.0

orbitManager.star_scale_mult = 1
orbitManager.black_hole_scale_mult = 100
orbitManager.near_bh_step_mult = .1
orbitManager.AU_SCALE = 10000
orbitManager.object_scale = 11.933


// const orbitFolder = gui.addFolder('Orbit Manager');
// orbitFolder.add(orbitManager, 'simulate');
// orbitFolder.add(orbitManager, 'stationary_reference');
// orbitFolder.add(orbitManager, 'reference_object', {
//   Star: OrbitManager.StellarObject.Star,
//   BlackHole: OrbitManager.StellarObject.BlackHole
// });
// orbitFolder.add(orbitManager, 'sim_speed', 0, 100).name('simulation speed');
// orbitFolder.add(orbitManager, 'AU_SCALE', 0, 20000);
// orbitFolder.add(orbitManager, 'object_scale', 0, 20);
// orbitFolder.add(orbitManager, 'star_scale_mult', 0, 100);
// orbitFolder.add(orbitManager, 'bh_scale_mult', 0, 600);

// const blackHoleFolder = gui.addFolder('Blackhole');
// blackHoleFolder.add(blackHoleNode, 'iterations', 1, 1000).name('iterations');
// blackHoleFolder.add(blackHoleNode, 'max_dist', 1, 10000000).name('maximum distance');
// blackHoleFolder.add(blackHoleNode.sky_brightness, 'value', 0, 5).name('sky brightness');
// blackHoleFolder.add(blackHoleNode.near_bh_step_mult, 'value', 0.001, .25).name('near-hole step');
// blackHoleFolder.add(blackHoleNode.use_redshift, 'value').name('redshift');
// blackHoleFolder.open();

// const starFolder = gui.addFolder('Star');
// const starColor = { color: `#${blackHoleNode.star_color.value.getHexString()}` };
// starFolder.addColor(starColor, 'color').name('star color').onChange((value) => {
//   blackHoleNode.star_color.value.set(value);
// });
// starFolder.open();
// orbitFolder.open();


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
