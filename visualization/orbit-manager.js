import {Vector3} from 'three';
import {CelestialBody} from './celestial-body.js';

//const blackholeWGSL = await fetch(new URL('./shaders/blackhole.wgsl', import.meta.url));
//ShaderLib.register('BlackHoleShader', await blackholeWGSL.text());

export class OrbitManager extends ComponentBase{    
    constructor(){
        super();

        // let renderShader = new RenderShaderPass('BlackHoleShader', 'BlackHoleShader');
        // renderShader.setShaderEntry('vs_main', 'fs_main');
        // renderShader.shaderState.cullMode = GPUCullMode.none;
        // renderShader.shaderState.writeMasks = [15, 0, 0, 0];

        // let shader = new Shader();
        // shader.addRenderPass(renderShader);
        // shader.setUniformFloat('skybox_brightness', 1.0);
        // shader.setUniformVector4('star_color', new Vector4(1, 1, 1, 1));
        // shader.setUniformFloat('near_bh_step_mult', 0.02);
        // shader.setUniformFloat('max_dist', 1000.0);
        // shader.setUniformFloat('epsilon', 0.001);
        // shader.setUniformInt32('iterations', 32);
        // shader.setUniformInt32('use_redshift', 0);
        // this.shader = shader;
    }
    
    shader

    simulate = true
    
    static StellarObject = Object.freeze({ Star: 0, BlackHole: 1 });

    stationary_reference = false;
    reference_object = OrbitManager.StellarObject.BlackHole

    //These are our scaler variables
    //They are our only proper way to modify it
    sim_speed_mul  = 1.

    sim_speed_inv =1
    get sim_speed() {
        return this.sim_speed_mul * 1/this.sim_speed_inv
    }

    AU_SCALE = 1;
    object_scale = 1;
    star_scale_mult = 1.
    bh_scale_mult = 1.

    static SOLAR_RADIUS = 0.00465047;//AU
    static AUS_TO_LIGHT = 499.005 //AU/S
    static LIGHT_IN_AUS = 0.00200399
    static LIGHT_IN_AUD = 173.145
    static SOLAR_MASS   = 1.
    static UNIT_TO_AU   = 6.68459e-12
    static KG_TO_SM     = 5.02785e-31

    //Blackhole stuff
    bh
    bh_radius_world = 0

    //Star Stuff
    star
    star_radius_world = 0

    simulate_orbits(delta){
        if(!this.simulate) return;

        var sim_delta = delta * this.sim_speed
        
        //Gravity Equation
        // F = ma = G * (m1 * m2) / r^2
        // v += ma * dt ==> v += G * m2 / r^2
        this.bh.integrate_adaptive(sim_delta, this.star)
        this.star.integrate_adaptive(sim_delta, this.bh)
        //var ship_accel = dist.normalized() * (G * bh.mass / (r ** 2.0 * (1.0- (bh.radius/r))));
        //ship.integrate_adaptive(sim_delta, bh)
    }

    start(){
        this.star = new CelestialBody()
        this.star.mass = 1.0
        this.star.radius = OrbitManager.SOLAR_RADIUS

        this.bh = new CelestialBody()
        this.bh.mass = 1.0
        this.bh.radius = (2 * CelestialBody.G * this.bh.mass) / (CelestialBody.c**2)

        this.star.position = new Vector3(0.72232, 0, 0)
        this.star.velocity = new Vector3(0, 0, 0.06703)
        this.bh.position = new Vector3(-0.07246, 0, 0)
        this.bh.velocity = new Vector3(0, 0, -0.00672)
        this.bh.radius = (2 * CelestialBody.G * this.bh.mass) / (CelestialBody.c**2)
        this.bh_size_from_ship = this.bh_size_from_ship
    }

    onUpdate(){
        this.simulate_orbits(Time.delta)
        let reference_pos;
        switch(this.reference_object){
            case OrbitManager.StellarObject.Star:
                reference_pos = this.star.position
                break;
            case OrbitManager.StellarObject.BlackHole:
                reference_pos = this.bh.position
                break;
        }

        //We are removing non stationary references cause it isnt needed for this demonstration
        //var bh_world_pos = (bh.position - reference_pos * float(stationary_reference)) * AU_SCALE
	    //var star_world_pos = (star.position - reference_pos * float(stationary_reference)) * AU_SCALE
        let bh_world_pos = new Vector3().subVectors(this.bh.position, reference_pos).multiplyScalar(this.AU_SCALE)
        let star_world_pos = new Vector3().subVectors(this.star.position, reference_pos).multiplyScalar(this.AU_SCALE)

        //star_radius_world = star_scale_mult * object_scale * star.radius * AU_SCALE
	    //bh_radius_world = bh_scale_mult * object_scale * bh.radius * AU_SCALE
        this.star_radius_world = this.star_scale_mult * this.object_scale * this.star.radius * this.AU_SCALE;
        this.bh_radius_world = this.bh_scale_mult * this.object_scale * this.bh.radius * this.AU_SCALE

        // this.shader.setUniformFloat("sim_speed", this.sim_speed)
        // this.shader.setUniformVector3("black_hole_center", bh_world_pos)
        // this.shader.setUniformVector3("star_center", star_world_pos)        

        // this.shader.setUniformFloat("star_radius", this.star_radius_world)
        // this.shader.setUniformFloat("schwarzschild_radius", this.bh_radius_world)
    }
}