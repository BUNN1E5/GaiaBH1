import {Vector3} from 'three';
import {CelestialBody} from './celestial-body.js';
import BlackHoleNode from './shaders/blackhole-tsl.js'

export class OrbitManager{    
    constructor(blackHoleNode = null){
        this.blackHoleNode = blackHoleNode ?? new BlackHoleNode();
        this.start();
    }
    simulate = true
    
    static StellarObject = Object.freeze({ Star: 0, BlackHole: 1 });

    _reference_object = OrbitManager.StellarObject.BlackHole
    stationary_reference = true
    get reference_object() {
        return this._reference_object
    }
    set reference_object(value) {
        this._reference_object = Number(value)
    }

    //These are our scaler variables
    //They are our only proper way to modify it
    sim_speed_mul = 1.

    sim_speed_inv =1
    get sim_speed() {
        return this.sim_speed_mul * 1/this.sim_speed_inv
    }
    set sim_speed(value) {
        this.sim_speed_mul = value * this.sim_speed_inv
    }

    AU_SCALE = 10000;
    object_scale = 11.933;
    star_scale_mult = 1.
    bh_scale_mult = 100.

    static SOLAR_RADIUS = 0.00465047;//AU
    static AUS_TO_LIGHT = 499.005 //AU/S
    static LIGHT_IN_AUS = 0.00200399
    static LIGHT_IN_AUD = 173.145
    static SOLAR_MASS   = 1.
    static UNIT_TO_AU   = 6.68459e-12
    static KG_TO_SM     = 5.02785e-31

    //Blackhole stuff
    bh
    //Star Stuff
    star

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
        this.star.mass = 0.93
        this.star.radius = OrbitManager.SOLAR_RADIUS
        this.star.position.set(-1.093386, 0, 0.058931123)
        this.star.velocity.set(0.0038253244, 0, -0.025581008)

        this.bh = new CelestialBody()
        this.bh.mass = 9.27
        this.bh.radius = (2 * CelestialBody.G * this.bh.mass) / (CelestialBody.c**2)
        this.bh.position.set(0.51302415, 0, 0.32600823)
        this.bh.velocity.set(-0.0019253857, 0, 0.012857342)
    }

    update(time){
        this.simulate_orbits(time)
        let reference_pos = new Vector3();
        switch(this.reference_object){
            case OrbitManager.StellarObject.Star:
                reference_pos.copy(this.star.position)
                break;
            case OrbitManager.StellarObject.BlackHole:
                reference_pos.copy(this.bh.position);
                break;
        }

        const reference_offset = this.stationary_reference ? reference_pos : new Vector3();
        let bh_world_pos = new Vector3().subVectors(this.bh.position, reference_offset).multiplyScalar(this.AU_SCALE)
        let star_world_pos = new Vector3().subVectors(this.star.position, reference_offset).multiplyScalar(this.AU_SCALE)

        let star_radius_world = this.star_scale_mult * this.object_scale * this.star.radius * this.AU_SCALE;
        let bh_radius_world = this.bh_scale_mult * this.object_scale * this.bh.radius * this.AU_SCALE

        this.blackHoleNode.black_hole_center.value.copy(bh_world_pos);
        this.blackHoleNode.star_center.value.copy(star_world_pos);
        this.blackHoleNode.schwarzschild_radius.value = bh_radius_world;
        this.blackHoleNode.star_radius.value = star_radius_world;
    }
}