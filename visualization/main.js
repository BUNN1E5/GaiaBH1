import * as THREE from 'three';
import { pass } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OrbitManager } from './orbit-manager.js'
import BlackHoleNode from './shaders/blackhole-tsl.js'
import Stats from 'three/addons/libs/stats.module.js';

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
const blurredPass = gaussianBlur( scenePass, 1);

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
//scene.background = cubeTexture;

const blackHoleNode = new BlackHoleNode(cubeTexture);
//const orbitManager = new OrbitManager(blackHoleNode);
//orbitManager.bh_scale_mult = 0;


renderPipeline.outputNode = blurredPass;
renderPipeline.outputNode = blackHoleNode;


const orbitControls = new OrbitControls(camera, renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);
stats.showPanel(0);

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

renderer.setAnimationLoop( render );

function render( time ) {
  canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  //orbitManager.update(time * 0.001);
  orbitControls.update();
  camera.updateMatrixWorld();
  renderPipeline.render()
  stats.update();
}
