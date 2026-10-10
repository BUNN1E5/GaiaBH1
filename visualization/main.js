import * as THREE from 'three';
import { pass, mrt, output, emissive } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OrbitManager } from './orbit-manager.js'
import BlackHoleNode from './shaders/blackhole-tsl.js'
import Stats from 'three/addons/libs/stats.module.js';
import { Inspector } from 'three/addons/inspector/Inspector.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

let canvas = document.querySelector( '#c' );

const renderer = new THREE.WebGPURenderer({antialias: true, forceWebGL:false, canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
await renderer.init();

renderer.inspector = new Inspector()

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
cubeTexture.flipY = true

const gui = renderer.inspector.createParameters( 'Settings' );
const blackHoleNode = new BlackHoleNode(cubeTexture);
const orbitManager = new OrbitManager(blackHoleNode);

blackHoleNode.star_emissive.value = 2;
blackHoleNode.iterations.value = 500;
blackHoleNode.max_dist.value = 100000.0;

orbitManager.star_scale_mult = 1
orbitManager.black_hole_scale_mult = 100
orbitManager.near_bh_step_mult = .1
orbitManager.AU_SCALE = 10000
orbitManager.object_scale = 11.933

const orbitFolder = gui.addFolder('Orbit Manager');
orbitFolder.add(orbitManager, 'simulate');
orbitFolder.add(orbitManager, 'stationary_reference');
orbitFolder.add(orbitManager, 'reference_object', {
  Star: OrbitManager.StellarObject.Star,
  BlackHole: OrbitManager.StellarObject.BlackHole
});
orbitFolder.add(orbitManager, 'sim_speed', 0, 100).name('simulation speed');
orbitFolder.add(orbitManager, 'AU_SCALE', 0, 20000);
orbitFolder.add(orbitManager, 'object_scale', 0, 20);
orbitFolder.add(orbitManager, 'star_scale_mult', 0, 100);
orbitFolder.add(orbitManager, 'bh_scale_mult', 0, 600);

const blackHoleFolder = gui.addFolder('Blackhole');
blackHoleFolder.add(blackHoleNode.iterations, 'value', 1, 1000).step(1).name('iterations');
blackHoleFolder.add(blackHoleNode.max_dist, 'value', 1, 100000).name('maximum distance');
blackHoleFolder.add(blackHoleNode.sky_brightness, 'value', 0, 5).name('sky brightness');
blackHoleFolder.add(blackHoleNode.near_bh_step_mult, 'value', 0.001, .25).name('near-hole step');
blackHoleFolder.add(blackHoleNode.use_redshift, 'value').name('redshift');

const starFolder = gui.addFolder('Star');
starFolder.addColor(blackHoleNode.star_color, 'value').name('star color');
starFolder.add(blackHoleNode.star_emissive, 'value', 0, 10).name('star emissive');

const scenePassColor = scenePass.getTextureNode( 'output' );
const bloomPass = bloom( scenePassColor, 1.5, 0.4, 1 );


scene.backgroundNode = blackHoleNode.rgb;
renderPipeline.outputNode = scenePassColor.add( bloomPass );

const orbitControls = new OrbitControls(camera, renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);
stats.showPanel(0);

renderer.setAnimationLoop( render );

const timer = new THREE.Timer()
function render( time ) {
  timer.update()
  //findBestRenderScale(timer.getDelta(), 120)
  canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  orbitManager.update(timer.getDelta());
  renderPipeline.render()
  stats.update();
}

//We want this to hit at least our target FPS
//If the computer can do more than it, cool IG
function findBestRenderScale(delta, targetFPS){
  let targetDelta = 1/targetFPS;
  let deltaS = delta;
  let diff = Math.max(1, 1 - (targetDelta - deltaS))
  console.log(diff)
  renderer.setPixelRatio(window.devicePixelRatio * diff)
}
