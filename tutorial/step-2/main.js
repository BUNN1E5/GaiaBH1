import * as THREE from 'three';
import { texture } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BlackHole } from './blackhole.js';

let canvas = document.querySelector( '#c' );

const renderer = new THREE.WebGPURenderer({antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
await renderer.init();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = -5;
new OrbitControls(camera, renderer.domElement);

scene.add(camera);

//New Code!!

const cubemapFaces = [
    './textures/face_0.jpg',
    './textures/face_1.jpg',
    './textures/face_2.jpg',
    './textures/face_3.jpg',
    './textures/face_4.jpg',
    './textures/face_5.jpg',
];
const cubeTexture = await new THREE.CubeTextureLoader().loadAsync(cubemapFaces);
cubeTexture.colorSpace = THREE.SRGBColorSpace;
cubeTexture.flipY = false;
const blackHole = new BlackHole(cubeTexture);

//End new code

scene.backgroundNode = blackHole.main()

renderer.setAnimationLoop( render );

function render( time ) {
    canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.render( scene, camera );
}