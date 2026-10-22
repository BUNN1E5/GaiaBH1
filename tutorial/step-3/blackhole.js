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
    /* playground-fold */
    MAX_STEPS = 100;
    EPSILON = 0.1;

    constructor(cubemap){
        this.cubemap = uniformCubeTexture(cubemap);
    }

    sdSphere = Fn(({p, r}) => { return length(p).sub(r.mul(.5)); });
    /* playground-fold-end */

    star_pos = vec3(0,0,0);
    star_color = color(1,1,1);
    star_radius = 1;

    raymarch = Fn(({ ro, rd }) => {
        /* playground-fold */
        const rayPos = ro.toVar();
        const color = vec3(0).toVar();
        const hit = bool(false).toVar();
        /* playground-fold-end */

        Loop(this.MAX_STEPS, ({ i }) => {
            const step = this.sdSphere({p : rayPos.sub(this.star_pos), r : this.star_radius});
            If(step.lessThan(this.EPSILON), () => {
                color.assign(this.star_color);
                hit.assign(true);
                Break();
            });
            /* playground-fold */

            rayPos.addAssign(rd.mul(step));
        });

        If(not(hit), ()=>{
            color.assign(this.cubemap.sample(rd).rgb);
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