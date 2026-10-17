import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let canvas = document.querySelector( '#c' );

const renderer = new THREE.WebGPURenderer({antialias: true, forceWebGL:false, canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
await renderer.init();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = -5;
scene.add(camera);
new OrbitControls(camera, renderer.domElement);

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );


renderer.setAnimationLoop( render );

function render( time ) {
    canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.render( scene, camera );
}