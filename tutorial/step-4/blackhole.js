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
    /* playground-fold */
    MAX_STEPS = 200;
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

    raymarch = Fn(({ ro, rd }) => {
        const rayPos = ro.toVar();
        const rdir = rd.toVar();
        const color = vec3(0).toVar();
        const hit = bool(false).toVar();
        
        //h2 is conserved so we only need to calculate it once
        const h = (rayPos.sub(this.black_hole_center)).cross(rdir);
        const h2 = h.dot(h); // dot product with itself gets square magnitude
        
        Loop(this.MAX_STEPS, ({ i }) => {
            const step = this.sdSphere({p : rayPos.sub(this.star_pos), r : this.star_radius});
            If(step.lessThan(this.EPSILON), () => {
                color.assign(this.star_color);
                hit.assign(true);
                Break();
            });

            //ray relative position
            const rrp = rayPos.sub(this.black_hole_center); 
            const r2 = rrp.dot(rrp);
            const rlen = rrp.length();
            const r5 = r2.mul(r2).mul(rlen);

            //This is our geodesic function
            const f = float(-1.5).mul(h2).mul(this.schwarzschild_radius).mul(rrp).div(r5);
            

            //This checks if we are inside the black hole
            If(rlen.lessThanEqual(this.schwarzschild_radius), () => {
                //For this remember that we are calcualting our lightrays backwards from their actual source
                //If we are inside the bh and our rays are pointing towards the black hole, then there is no escape
                //If rays are pointing away from the black hole we are likely inside the black hole and can escape
                If(rrp.dot(rdir).lessThan(0),()=>{
                    color.assign(vec3(0));
                    hit.assign(true);
                    Break();
                })
            });

            //We need to make sure that we are smaller steps near the black hole
            const step_size = min(step, rlen.mul(.2));
            
            rayPos.addAssign(rdir.mul(step_size));
            //We need to normalize it because it is a direction (this is like a speedcap)
            rdir.assign(rdir.add(f.mul(step_size)).normalize());

        });

        If(not(hit), ()=>{
            color.assign(this.cubemap.sample(rdir).rgb);
        });

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