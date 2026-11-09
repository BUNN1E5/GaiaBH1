import { Vector3 } from 'three';
import {
    Loop,
    Fn,
    If,
    Break,
    length,
    vec3,
    vec4,
    float,
    bool,
    min,
    not,
    array,
    normalize,
    uniform,
    uniformCubeTexture,
    cameraPosition,
    cameraWorldMatrix,
    screenUV,
    cameraProjectionMatrixInverse,
    transformDirection
} from 'three/tsl';

export class BlackHole{
    
    MAX_STEPS = uniform(50);

    EPSILON = uniform(0.1);

    bh_step_mult = uniform(0.8);
    background_brightness = uniform(1.0);

    constructor(cubemap){
        this.cubemap = uniformCubeTexture(cubemap);
    }

    sdSphere = Fn(({p, r}) => { return length(p).sub(r.mul(.5)); });

    star_pos = uniform(new Vector3(5,0,0));

    star_color = uniform(new Vector3(1.01, 1.01, 1.01));

    star_radius = uniform(1);

    use_rk4 = uniform(true);

    black_hole_center = uniform(new Vector3());
    schwarzschild_radius = uniform(1);
    
    geodesic = Fn(([rpos, h2])=>{
        const rrp = rpos.sub(this.black_hole_center);
        const r2 = rrp.dot(rrp);
        const rlen = rrp.length();
        const r5 = r2.mul(r2).mul(rlen);

        return float(-1.5).mul(h2).mul(this.schwarzschild_radius).mul(rrp).div(r5);
    })

    rk4 = Fn(([rpos, rvel, h2, s]) =>{

        const k1pos = rvel.toVar();
        const k1vel = this.geodesic(rpos, h2);

        const k2vel = this.geodesic(rpos.add(k1pos.mul(s.mul(.5))), h2);
        const k2pos = rvel.add(k1vel.mul(s.mul(.5)));

        const k3vel = this.geodesic(rpos.add(k2pos.mul(s.mul(.5))), h2);
        const k3pos = rvel.add(k2vel.mul(s.mul(.5)));

        const k4vel = this.geodesic(rpos.add(k3pos.mul(s)), h2);
        const k4pos = rvel.add(k3vel.mul(s));

        const _rvel = rvel.add(s.div(6).mul(k1vel.add(k2vel.mul(2).add(k3vel.mul(2).add(k4vel)))));
        const _rpos = rpos.add(s.div(6).mul(k1pos.add(k2pos.mul(2).add(k3pos.mul(2).add(k4pos)))));

        return array([
            _rpos, 
            _rvel
        ]);
    });

    raymarch = Fn(({ ro, rd }) => {
        
        const rpos = ro.toVar();
        const rdir = rd.toVar();
        const color = vec3(0).toVar();
        const hit = bool(false).toVar();
        
        //h2 is conserved so we only need to calculate it once
        const h = (rpos.sub(this.black_hole_center)).cross(rdir);
        const h2 = h.dot(h); // dot product with itself gets square magnitude

        Loop(this.MAX_STEPS, ({ i }) => {
            const step = this.sdSphere({p : rpos.sub(this.star_pos), r : this.star_radius});
            If(step.lessThan(this.EPSILON), () => {
                color.assign(this.star_color);
                hit.assign(true);
                Break();
            });


            //ray relative position
            const rrp = rpos.sub(this.black_hole_center); 
            const rlen = rrp.length();
            
            If(rlen.lessThanEqual(this.schwarzschild_radius), () => {
               If(rrp.dot(rdir).lessThan(0),()=>{
                    color.assign(vec3(0));
                    hit.assign(true);
                    Break();
                })
            });

            const step_size = min(step, rlen.mul(this.bh_step_mult)).toVar();
            
            If(this.use_rk4, ()=>{
                const nstate = this.rk4(rpos, rdir, h2, step_size);
                rpos.assign(nstate[0]);
                rdir.assign(nstate[1].normalize()); //Light still has a max speed of c=1
            }).Else(()=>{
                rpos.addAssign(rdir.mul(step_size));
                rdir.assign(rdir.add(this.geodesic(rpos, h2).mul(step_size)).normalize());
            })
        });

        If(not(hit), ()=>{
            // TODO :: ADD REDSHIFT CALC
            color.assign(this.cubemap.sample(rdir).mul(this.background_brightness).rgb);
        });


        return color;
    });

    main = Fn(() => {
        const clip = vec4(screenUV.x.mul(2).sub(1), screenUV.y.mul(-2).add(1), -1, 1);
        const hview = cameraProjectionMatrixInverse.mul(clip);
        const view = hview.xyz.div(hview.w);
        const rd = transformDirection(view, cameraWorldMatrix);
        return vec3(this.raymarch({ro: cameraPosition, rd: rd}));
    });
}