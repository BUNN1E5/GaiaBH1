import {Vector3} from 'three';

export class CelestialBody{
    //Physical Constant used in Gravity Equation
    // G = 4* PI^2 * AU^3 / (SOLAR_MASS * 
    // G = (4 * PI^2) / (SOLAR_MASS * DAYS_IN_YEAR^2)
    static G = 4 * Math.PI ** 2 / (1. * 365.256 ** 2)
    static c = 173.145;
    static MAX_ACCEL = 35. // AU/Day
    static MAX_VEL = 10. // AU/DAY

    position = new Vector3()
    radius = 1.0
    mass = 1.0
    drag = 0.0
    velocity = new Vector3()

    get velocity_mag(){
        return this.velocity.length();
    } 

    acceleration(_position, _velocity, _other_position, _other_mass, _other_radius){
        let accel = new Vector3().subVectors(_other_position, _position) //distance
        let r = accel.length()
        if(r < _other_radius){
            return new Vector3()
        }
        let mag = Math.min((CelestialBody.G * _other_mass / (accel.lengthSq() * (1.0 - (_other_radius/r)))), CelestialBody.MAX_ACCEL)
        return accel.normalize().multiplyScalar(mag).addScaledVector(_velocity, -this.drag)
    }

    clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    integrate_adaptive(delta, other){
        let step_sensitivity = 1
        let r = this.position.distanceToSquared(other.position);
        if(r < other.radius ** 2){
            //we are inside something else
            this.velocity = new Vector3()
            return
        }
        let sub_steps = Math.floor(this.clamp(1./r * step_sensitivity, 1, 400))
        let sub_delta = delta / sub_steps
        for(let i = 0; i < sub_steps; i++){
            this._rk4_step(other, sub_delta)
        }
    }

    _rk4_step(other, dt){
        const [rk4_pos, rk4_vel] = this._get_next_rk4_state(this.position, this.velocity, other, dt)
        this.position.copy(rk4_pos)
        this.velocity.copy(rk4_vel)
    }

    //Returns [Vector3, Vector3]
    _get_next_rk4_state(pos, vel, other, dt){
        const op = other.position, om = other.mass, or = other.radius
        
        var v1 = vel
        var a1 = this.acceleration(pos, v1, op, om, or)
        // k2
        var v2 = vel.clone().addScaledVector(a1, (dt * 0.5))
        var a2 = this.acceleration(pos.clone().addScaledVector(v1, (dt * 0.5)), v2, op, om, or)
        // k3
        var v3 = vel.clone().addScaledVector(a2, (dt * 0.5))
        var a3 = this.acceleration(pos.clone().addScaledVector(v2, (dt * 0.5)), v3, op, om, or)
        // k4
        var v4 = vel.clone().addScaledVector(a3, dt)
        var a4 = this.acceleration(pos.clone().addScaledVector(v3, dt), v4, op, om, or)

        //vel += (a1 + 2*a2 + 2*a3 + a4) / 6.0 * dt
        //vel = vel.normalized() * min(vel.length(), Limits.MAX_VEL)
        const _vel = new Vector3().addVectors(vel, new Vector3()
                        .addScaledVector(a1, 1)
                        .addScaledVector(a2, 2)
                        .addScaledVector(a3, 2)
                        .addScaledVector(a4, 1)
                        .multiplyScalar(1/6.0 * dt))
                        .clampLength(0, CelestialBody.MAX_VEL)
        
        //pos += (v1 + 2*v2 + 2*v3 + v4) / 6.0 * dt
        const _pos = new Vector3().addVectors(pos, new Vector3()
                        .addScaledVector(v1, 1)
                        .addScaledVector(v2, 2)
                        .addScaledVector(v3, 2)
                        .addScaledVector(v4, 1)
                        .multiplyScalar(1/6.0 * dt))
        return [_pos, _vel]
    }
}