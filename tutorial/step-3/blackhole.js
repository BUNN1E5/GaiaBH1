/* playground-fold */
import {
    Loop,
    Fn,
    If,
    Break,
    length,
    vec3,
    vec4,
    bool,
    not,
    uniformCubeTexture,
    cameraPosition,
    cameraWorldMatrix,
    screenUV,
    cameraProjectionMatrixInverse,
    transformDirection
} from 'three/tsl';
/* playground-fold-end */

export class BlackHole{
    MAX_STEPS = 100;
    EPSILON = 0.1;

    constructor(cubemap){
        this.cubemap = uniformCubeTexture(cubemap);
    }    

    black_hole_center = vec3(0,0,0);
    schwarzschild_radius = 1;

    /* playground-fold */
    sdSphere = Fn(({p, r}) => { return length(p).sub(r.mul(.5)); });
    /* playground-fold-end */
    raymarch = Fn(({ ro, rd }) => {
        const rayPosition = ro.toVar();
        const rdir = rd.toVar();
        const color = vec3(0).toVar();
        
        //h2 is conserved so we only need to calculate it once
        const h = (rayPosition.sub(this.black_hole_center)).cross(rdir);
        const h2 = h.dot(h); // dot product with itself gets square magnitude
        
        Loop(this.MAX_STEPS, ({ i }) => {
            const step = this.sdSphere({p : rayPosition, r : 1});
            If(step.lessThan(this.EPSILON), () => {
                color.assign(vec3(1));
                Break();
            });

            const rrp = rayPosition - this.black_hole_center; //ray relative position
            const r2 = rrp.dot(rrp); 
            const rlen = rrp.length();
            const r5 = r2.mul(r2).mul(rlen);

            //This is our geodesic function
            const f = float(-1.5).mul(h2).mul(this.schwarzschild_radius).mul(rrp).div(r5);

            // rdir.

            rayPosition.addAssign(rd.mul(step));
        });

        If(not(hit), ()=>{
            color.assign(this.cubemap.sample(rd).rgb);
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