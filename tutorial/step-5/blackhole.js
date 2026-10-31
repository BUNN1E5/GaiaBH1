/* playground-fold */
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
    uniformCubeTexture,
    cameraPosition,
    cameraWorldMatrix,
    screenUV,
    cameraProjectionMatrixInverse,
    transformDirection
} from 'three/tsl';
/* playground-fold-end */

export class BlackHole{
    
    //We can get away with 1/4th the steps
    MAX_STEPS = 50;

    /* playground-fold */
    EPSILON = 0.1;

    constructor(cubemap){
        this.cubemap = uniformCubeTexture(cubemap);
    }

    sdSphere = Fn(({p, r}) => { return length(p).sub(r.mul(.5)); });

    
    star_pos = vec3(5,0,0);
    star_color = vec3(1,1,1);
    star_radius = 1;
    /* playground-fold-end */

    black_hole_center = vec3(0,0,0);
    schwarzschild_radius = float(1);
    
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
        
        /* playground-fold */
        const rpos = ro.toVar();
        const rdir = rd.toVar();
        const color = vec3(0).toVar();
        const hit = bool(false).toVar();
        
        //h2 is conserved so we only need to calculate it once
        const h = (rpos.sub(this.black_hole_center)).cross(rdir);
        const h2 = h.dot(h); // dot product with itself gets square magnitude
        /* playground-fold-end */

        Loop(this.MAX_STEPS, ({ i }) => {
            /* playground-fold */
            const step = this.sdSphere({p : rpos.sub(this.star_pos), r : this.star_radius});
            If(step.lessThan(this.EPSILON), () => {
                color.assign(this.star_color);
                hit.assign(true);
                Break();
            });

            /* playground-fold-end */

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

            //We can get away with much larger steps 
            const step_size = min(step, rlen.mul(.8)).toVar();
            const nstate = this.rk4(rpos, rdir, h2, step_size);
            rpos.assign(nstate[0]);
            rdir.assign(nstate[1].normalize()); //Light still has a max speed of c=1
        });

        /* playground-fold */

        If(not(hit), ()=>{
            color.assign(this.cubemap.sample(rdir).rgb);
        });

        /* playground-fold-end */

        return color;
    });

    /* playground-fold */
    main = Fn(() => {
        const clip = vec4(screenUV.x.mul(2).sub(1), screenUV.y.mul(-2).add(1), -1, 1);
        const hview = cameraProjectionMatrixInverse.mul(clip) 
        const view = hview.xyz.div(hview.w);
        const rd = transformDirection(view, cameraWorldMatrix);
        return vec3(this.raymarch({ro: cameraPosition, rd: rd}));
    });
    /* playground-fold-end */
}