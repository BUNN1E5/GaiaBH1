import * as THREE from 'three';
import { pass, mrt, output, emissive } from 'three/tsl';
import { BlackHoleCamera } from './blackholeCamera.js';
import { BlackHole } from './blackhole.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { Inspector } from 'three/addons/inspector/Inspector.js';

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

const blackHoleCamera = new BlackHoleCamera(camera, renderer.domElement);

scene.add(camera);

const cubemapFaces = [ // I have some hosted here
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_0.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_1.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_2.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_3.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_4.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/face_5.jpg',
];

const starmapFaces = [ // I have some hosted here
    'https://goldenneedham.com/demos/GaiaBH1/textures/star_0.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/star_1.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/star_2.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/star_3.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/star_4.jpg',
    'https://goldenneedham.com/demos/GaiaBH1/textures/star_5.jpg',
];

const cubeTexture = await new THREE.CubeTextureLoader().loadAsync(cubemapFaces);
cubeTexture.colorSpace = THREE.SRGBColorSpace;
cubeTexture.flipY = false;

const starTexture = await new THREE.CubeTextureLoader().loadAsync(starmapFaces);
starTexture.colorSpace = THREE.SRGBColorSpace;
starTexture.flipY = false;

const blackHole = new BlackHole(starTexture);
blackHole.background_brightness.value = 50;
blackHole.bh_step_mult.value = 0.25;
blackHole.MAX_STEPS.value = 65;
scene.backgroundNode = blackHole.main()


renderer.setAnimationLoop( render );
const timer = new THREE.Timer();
function render( time ) {

    timer.update(time);
    if (resizeRendererToDisplaySize(renderer)) {
        canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    blackHoleCamera.update();
    renderPipeline.render()
    orbit(timer.getDelta());

}

//Lets define some constants and initial values for our simulation
const simSettings = {
  AUScale: 1000,
  timescale: 1 / 80, // 1 = 1 year per second, 10 = 10 years per second, etc
  scaleMult: 5,
  blackHoleScaleMult: 200,
  starScalMult: 10
};

const G = 39.478; // Gravitational constant in AU^3 / (yr^2 * solar mass)
const c = 63241.08; // Speed of light in AU/yr
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
  const timestep = dt * simSettings.timescale;

  const sA = acceleration(blackhole.mass, star.position, blackhole.position).multiplyScalar(timestep);
  const bhA = acceleration(star.mass, blackhole.position, star.position).multiplyScalar(timestep);

  star.velocity.add(sA);
  star.position.addScaledVector(star.velocity, timestep);

  blackhole.velocity.add(bhA);
  blackhole.position.addScaledVector(blackhole.velocity, timestep);

  blackHole.black_hole_center.value.copy(blackhole.position.clone().sub(referencePoint.position).multiplyScalar(simSettings.AUScale));
  blackHole.schwarzschild_radius.value = 2 * G * blackhole.mass / (c * c) * simSettings.AUScale * simSettings.blackHoleScaleMult * simSettings.scaleMult;
  blackHoleCamera.shwarzschildRadius = blackHole.schwarzschild_radius.value;
  blackHoleCamera.minDistance = .076 * blackHoleCamera.shwarzschildRadius;

  blackHole.star_pos.value.copy(star.position.clone().sub(referencePoint.position).multiplyScalar(simSettings.AUScale));
  blackHole.star_radius.value = .97 * SOLAR_RADII_TO_AU * simSettings.AUScale * simSettings.starScalMult * simSettings.scaleMult;
}

//Cowells Method (inside the summation)
function acceleration(otherMass, selfPosition, otherPosition) {
  const r = new THREE.Vector3().subVectors(otherPosition, selfPosition); 
  const numerator = r.clone().normalize().multiplyScalar(G * otherMass);
  const denominator = r.lengthSq(); //r^2 because noramlize already divides by r
  return numerator.divideScalar(denominator);
}

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

const backgroundTextures = {
  cubemap: {texture:cubeTexture, brightness:1},
  starmap: {texture:starTexture, brightness:50}
};

const params = {
  background: 'starmap',
  use_rk4: false
};



const queryString = window.location.search; 
const urlParams = new URLSearchParams(queryString);
const noInspector = urlParams.has('noinspector') || urlParams.has('mini'); 



if(urlParams.has('mini') || urlParams.has('stoppable')){
  //So we can stop it from a main page
  window.addEventListener("message", (event)=>{
    if (event.origin !== window.location.origin) return;

    const msg = event.data;
    if (typeof msg !== "object" || msg === null) return;

    if (msg.type === "halt" || msg.type === "stop") {
      renderer.setAnimationLoop( null );
    }

    if (msg.type === "resume" || msg.type === "start") {
      renderer.setAnimationLoop( render );
    }
  })
}

if(!noInspector) {
  renderer.inspector = new Inspector();
  const gui = renderer.inspector.createParameters('Settings');

  renderer.inspector.hide();

  gui.addSelect(params, 'background', ['cubemap', 'starmap']).name('Background').onChange((value) => {
      blackHole.cubemap.value = backgroundTextures[value].texture;
      blackHole.background_brightness.value = backgroundTextures[value].brightness;
  });
  gui.add(blackHole.background_brightness, 'value', 1, 100).name('Background Brightness');

  gui.addSelect(simSettings, 'referencePoint', ['blackhole', 'star', '(0,0,0)']).name('Reference Point').onChange((value) => {
      switch(value){
          case 'blackhole':
              referencePoint = blackhole;
              break;
          case 'star':
              referencePoint = star;
              break;
          case '(0,0,0)':
              referencePoint = {position: new THREE.Vector3(0, 0, 0)};
              break;
      }
  });
  

  const orbitFolder = gui.addFolder('Orbit');
  orbitFolder.add(simSettings, 'AUScale', 1, 1000).name('AU Scale');
  orbitFolder.add(simSettings, 'timescale', 0, .5).name('Time Scale');

  const scaleFolder = gui.addFolder('Scale');
  scaleFolder.add(simSettings, 'scaleMult', 0, 50).name('Stellar Object Scale');
  scaleFolder.add(simSettings, 'blackHoleScaleMult', 0, 20000).name('Black Hole Scale');
  scaleFolder.add(simSettings, 'starScalMult', 0, 100).name('Star Scale');

  const uniformsFolder = gui.addFolder('Shader Uniforms');
  uniformsFolder.add(blackHole.use_rk4, 'value').name("Use RK4");
  uniformsFolder.add(blackHole.MAX_STEPS, 'value', 1, 200, 1).name('Max Steps');
  uniformsFolder.add(blackHole.EPSILON, 'value', 0.001, 2).name('Hit Epsilon');
  uniformsFolder.add(blackHole.bh_step_mult, 'value', 0.01, 1).name('BH Step Mult');
  for (const axis of ['x', 'y', 'z']) {
    uniformsFolder.add(blackHole.star_color.value, axis, 0, 2)
      .name(`Star Color ${axis.toUpperCase()}`);
  }
}