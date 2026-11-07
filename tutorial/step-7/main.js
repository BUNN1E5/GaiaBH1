/* playground-fold */
import * as THREE from 'three';
import { pass, mrt, output, emissive } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BlackHole } from './blackhole.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
/* playground-fold-end */


/* playground-fold */
let canvas = document.querySelector( '#c' );

const renderer = new THREE.WebGPURenderer({antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
await renderer.init();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
/* playground-fold-end */

const renderPipeline = new THREE.RenderPipeline(renderer);
const scenePass = pass( scene, camera );
scenePass.setMRT( mrt( {
	output,
	emissive
}));

const scenePassColor = scenePass.getTextureNode( 'output' );
const bloomPass = bloom( scenePassColor, 1.5, 0.4, 1 );

renderPipeline.outputNode = scenePassColor.add( bloomPass );


/* playground-fold */

new OrbitControls(camera, renderer.domElement);

scene.add(camera);

const cubemapFaces = [ // I have some hosted here
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_0.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_1.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_2.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_3.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_4.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_5.jpg',
];
const cubeTexture = await new THREE.CubeTextureLoader().loadAsync(cubemapFaces);
cubeTexture.colorSpace = THREE.SRGBColorSpace;
cubeTexture.flipY = false;
const blackHole = new BlackHole(cubeTexture);
scene.backgroundNode = blackHole.main()

renderer.setAnimationLoop( render );
/* playground-fold-end */

function render( time ) {
    /* playground-fold */

    if (resizeRendererToDisplaySize(renderer)) {
        canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    /* playground-fold-end */

    renderPipeline.render()
    //renderer.render( scene, camera );
}

/* playground-fold */
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
/* playground-fold-end */
