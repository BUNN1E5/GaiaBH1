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

    //New Code!

    constructor(cubemap){
        this.cubemap = uniformCubeTexture(cubemap);
    }
    
    //End New Code

    /* playground-fold */
    sdSphere = Fn(({p, r}) => { return length(p).sub(r.mul(.5)); });
    /* playground-fold-end */
    raymarch = Fn(({ ro, rd }) => {
        const rayPos = ro.toVar();
        const color = vec3(0).toVar();
        const hit = bool(false).toVar(); //New Code!!
        Loop(this.MAX_STEPS, ({ i }) => {
            const step = this.sdSphere({p : rayPos, r : 1});
            If(step.lessThan(this.EPSILON), () => {
                color.assign(vec3(1));
                hit.assign(true);
                Break();
            });
            rayPos.addAssign(rd.mul(step));
        });

        //New Code !!

        If(not(hit), ()=>{
            color.assign(this.cubemap.sample(rd).rgb);
            
            // This also would work just fine
            // color.assign(cubeTexture(this.cubemap, rd).rgb);
        });

        //End new code
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