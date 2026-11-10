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

const renderPipeline = new THREE.RenderPipeline(renderer);
const scenePass = pass( scene, camera );
scenePass.setMRT( mrt( {
	output,
	emissive
}));

const scenePassColor = scenePass.getTextureNode( 'output' );
const bloomPass = bloom( scenePassColor, 1.5, 0.4, 1 );

renderPipeline.outputNode = scenePassColor.add( bloomPass );

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
const timer = new THREE.Timer();
timer.connect(document);
function render( time ) {
    /* playground-fold */

    timer.update(time);
    if (resizeRendererToDisplaySize(renderer)) {
        canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    renderPipeline.render()
    /* playground-fold-end */
    orbit(timer.getDelta());

}

//Lets define some constants and initial values for our simulation
const AUScale = 20;
const timescale = 1/80; // 1 = 1 year per second, 10 = 10 years per second, etc

//Generic Scaling Factors for our Stellar Bodies
var scaleMult = 1;
var blackHoleScaleMult = scaleMult * 20000;
var starScalMult = scaleMult * 20;

const G = 39.478; //Gravitational constant in AU^3 / (yr^2 * solar mass)
const c = 63241.08; //Speed of light in AU/yr
const AU_TO_SOLAR_RADII = 215.032; //1 AU = 215.032 Solar Radii
const SOLAR_RADII_TO_AU = 1 / AU_TO_SOLAR_RADII; //1 Solar Radii = 0.00465047 AU


//Inital Values for our Stellar Bodies
var blackhole = {
  mass: 9.27, // Solar Masses
  position: new THREE.Vector3(-0.18283, 0, 0),
  velocity: new THREE.Vector3(0, 0, -0.97351)
};

var star = {
  mass: .93, // Solar Masses
  position: new THREE.Vector3(1.82239, 0, 0),
  velocity: new THREE.Vector3(0, 0, 9.70365)
}

//Center point of our sim
var referencePoint = blackhole;


function orbit(dt){
  //Euler is good enough for us
  const timestep = dt * timescale;

  const sA = acceleration(blackhole.mass, star.position, blackhole.position).multiplyScalar(timestep);
  const bhA = acceleration(star.mass, blackhole.position, star.position).multiplyScalar(timestep);

  star.velocity.add(sA);
  star.position.addScaledVector(star.velocity, timestep);

  blackhole.velocity.add(bhA);
  blackhole.position.addScaledVector(blackhole.velocity, timestep);

  blackHole.black_hole_center.value.copy(blackhole.position.clone().sub(referencePoint.position).multiplyScalar(AUScale ));  
  blackHole.schwarzschild_radius.value = 2 * G * blackhole.mass / (c * c) * AUScale * blackHoleScaleMult;

  blackHole.star_pos.value.copy(star.position.clone().sub(referencePoint.position).multiplyScalar(AUScale));
  blackHole.star_radius.value = .97 * SOLAR_RADII_TO_AU * AUScale * starScalMult;
}

//Cowells Method (inside the summation)
function acceleration(otherMass, selfPosition, otherPosition) {
  const r = new THREE.Vector3().subVectors(otherPosition, selfPosition); 
  const numerator = r.clone().normalize().multiplyScalar(G * otherMass);
  const denominator = r.lengthSq(); //r^2 because noramlize already divides by r
  return numerator.divideScalar(denominator);
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
