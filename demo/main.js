import * as THREE from 'three';
import { pass, mrt, output, emissive } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
  rk4(star, blackhole, dt * simSettings.timescale);
  rk4(blackhole, star, dt * simSettings.timescale);

  blackHole.black_hole_center.value.copy(blackhole.position.clone().sub(referencePoint.position).multiplyScalar(simSettings.AUScale));
  blackHole.schwarzschild_radius.value = 2 * G * blackhole.mass / (c * c) * simSettings.AUScale * simSettings.blackHoleScaleMult * simSettings.scaleMult;

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

function rk4(body, other, s) {
    const pos = body.position.clone();
    const vel = body.velocity.clone();

    const k1pos = vel.clone();
    const k1vel = acceleration(other.mass, pos, other.position);

    const k2pos =  vel.clone().add(k1vel.clone().multiplyScalar(s * 0.5));
    const k2vel = acceleration(other.mass, pos.clone().add(k1pos.clone().multiplyScalar(s * 0.5)), other.position);

    const k3pos = vel.clone().add(k2vel.clone().multiplyScalar(s * 0.5));
    const k3vel = acceleration(other.mass, pos.clone().add(k2pos.clone().multiplyScalar(s * 0.5)), other.position);

    const k4pos = vel.clone().add(k3vel.clone().multiplyScalar(s));
    const k4vel = acceleration(other.mass, pos.clone().add(k3pos.clone().multiplyScalar(s)), other.position);

    const nextPos = pos.clone().add(
        k1pos.clone()
            .add(k2pos.clone().multiplyScalar(2))
            .add(k3pos.clone().multiplyScalar(2))
            .add(k4pos)
            .multiplyScalar(s / 6)
    );

    const nextVel = vel.clone().add(
        k1vel.clone()
            .add(k2vel.clone().multiplyScalar(2))
            .add(k3vel.clone().multiplyScalar(2))
            .add(k4vel)
            .multiplyScalar(s / 6)
    );

    body.position.copy(nextPos);
    body.velocity.copy(nextVel);
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
  background: 'starmap'
};

renderer.inspector = new Inspector();
const gui = renderer.inspector.createParameters('Settings');
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
uniformsFolder.add(blackHole.MAX_STEPS, 'value', 1, 200, 1).name('Max Steps');
uniformsFolder.add(blackHole.EPSILON, 'value', 0.001, 2).name('Hit Epsilon');
uniformsFolder.add(blackHole.bh_step_mult, 'value', 0.01, 1).name('BH Step Mult');
for (const axis of ['x', 'y', 'z']) {
  uniformsFolder.add(blackHole.star_color.value, axis, 0, 2)
    .name(`Star Color ${axis.toUpperCase()}`);
}