import {MathUtil, Vector3} from '@orillusion/core';

export class CelestialBody{
    //Physical Constant used in Gravity Equation
    // G = 4* PI^2 * AU^3 / (SOLAR_MASS * 
    // G = (4 * PI^2) / (SOLAR_MASS * DAYS_IN_YEAR^2)
    static G = 4 * Math.PI ** 2 / (1. * 365.256 ** 2)
    static c = 173.145;
    static MAX_ACCEL = 35. // AU/Day
    static MAX_VEL = 10. // AU/DAY

    position = Vector3.ZERO.clone()
    last_position = Vector3.ZERO.clone()
    radius = 1.0
    mass = 1.0
    drag = 0.0
    velocity = Vector3.ZERO.clone()

    get velocity_mag(){
        return this.velocity.length;
    } 

    accleration(_position, _velocity, _other_position, _other_mass, _other_radius){
        let dist = Vector3.sub(_other_position, _position)
        let r = dist.length
        if(r < _other_radius){
            return Vector3.ZERO.clone()
        }
        let mag = Math.min((CelestialBody.G * _other_mass / (dist.lengthSquared * (1.0 - (_other_radius/r)))), CelestialBody.MAX_ACCEL)
        let accel = Vector3.multiplyScalar(dist.normalize(), mag)
            
        accel = Vector3.sub(accel, Vector3.multiplyScalar(this.velocity, this.drag))
        return accel
    }

    integrate_adaptive(delta, other){
        let step_sensitivity = 1
        let r = Vector3.sub(this.position,other.position).lengthSquared;
        if(r < other.radius ** 2){
            //we are inside something else
            this.velocity = Vector3.ZERO.clone()
            return
        }
        let sub_steps = MathUtil.clampf(1./r * step_sensitivity, 1, 400)
        let sub_delta = delta / sub_steps
        for(let i = 0; i < sub_steps; i++){
            this._rk4_step(other, sub_delta)
        }
    }

    _rk4_step(other, dt){
        let rk4_state = this._get_next_rk4_state(this.position, this.velocity, other.position, other, dt)
        this.position = rk4_state[0]
        this.velocity = rk4_state[1]
    }

    //Returns [Vector3, Vector3]
    _get_next_rk4_state(pos, vel, _other_position, other, dt){
        // k1
        let v1 = vel
        let a1 = this.accleration(pos, v1, _other_position, other.mass, other.radius)
        // k2
        let v2 = Vector3.add(vel, Vector3.multiplyScalar(a1, dt * 0.5))
        let a2 = this.accleration(Vector3.add(pos, Vector3.multiplyScalar(v1, dt * 0.5)), v2, _other_position, other.mass, other.radius)
        // k3
        let v3 = Vector3.add(vel, Vector3.multiplyScalar(a2, dt * 0.5))
        let a3 = this.accleration(Vector3.add(pos, Vector3.multiplyScalar(v2, dt * 0.5)), v3, _other_position, other.mass, other.radius)
        // k4
        let v4 = Vector3.add(vel, Vector3.multiplyScalar(a3, dt))
        let a4 = this.accleration(Vector3.add(pos, Vector3.multiplyScalar(v3, dt)), v4, _other_position, other.mass, other.radius)
        //OMG this is why function overloading is goated, this is horrible.
        vel = Vector3.add(vel, Vector3.multiplyScalar(Vector3.add(Vector3.add(a1, Vector3.multiplyScalar(a2, 2)), Vector3.add(Vector3.multiplyScalar(a3, 2), a4)), dt / 6.0))
        pos = Vector3.add(pos, Vector3.multiplyScalar(Vector3.add(Vector3.add(v1, Vector3.multiplyScalar(v2, 2)), Vector3.add(Vector3.multiplyScalar(v3, 2), v4)), dt / 6.0))
        vel = Vector3.multiplyScalar(vel.normalize(), Math.min(vel.length, CelestialBody.MAX_VEL))
        return [pos, vel]
    }
}