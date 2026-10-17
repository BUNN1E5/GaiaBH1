import {
    Loop,
    Fn,
    If,
    Break,
    length,
    // New code !!
    bool,
    not,
    uniformCubeTexture,
    // End new code
    vec3,
    vec4,
    cameraPosition,
    cameraWorldMatrix,
    screenUV,
    cameraProjectionMatrixInverse,
    transformDirection
} from 'three/tsl';

export class BlackHole{
    MAX_STEPS = 100;
    EPSILON = 0.1;

    //New Code!

    constructor(cubemap){
        this.cubemap = uniformCubeTexture(cubemap);
    }
    
    //End New Code

    sdSphere = Fn(({p, r}) => { return length(p).sub(r.mul(.5)); });
    raymarch = Fn(({ ro, rd }) => {
        const rayPosition = ro.toVar();
        const color = vec3(0).toVar();
        const hit = bool(false).toVar(); //New Code!!
        Loop(this.MAX_STEPS, ({ i }) => {
            const step = this.sdSphere({p : rayPosition, r : 1});
            If(step.lessThan(this.EPSILON), () => {
                color.assign(vec3(1));
                hit.assign(true);
                Break();
            });
            rayPosition.addAssign(rd.mul(step));
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

    main = Fn(() => {
        const ndc = vec4(screenUV.x.mul(2).sub(1), screenUV.y.mul(-2).add(1), -1, 1);
        const view = cameraProjectionMatrixInverse.mul(ndc);
        const rd = transformDirection(view.xyz.div(view.w), cameraWorldMatrix);
        return vec3(this.raymarch({ro: cameraPosition, rd: rd}));
    });
}