import {
    Loop,
    Fn,
    If,
    Break,
    length,
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

    sdSphere = Fn(({p, r}) => { return length(p).sub(r.mul(.5)); });
    raymarch = Fn(({ ro, rd }) => {
        const rayPosition = ro.toVar();
        const color = vec3(0).toVar();
        Loop(this.MAX_STEPS, ({ i }) => {
            const step = this.sdSphere({p : rayPosition, r : 1});
            If(step.lessThan(this.EPSILON), () => {
                color.assign(vec3(1));
                Break();
            });
            rayPosition.addAssign(rd.mul(step));
        });
        return color;
    });

    main = Fn(() => {
        const clip = vec4(screenUV.x.mul(2).sub(1), screenUV.y.mul(-2).add(1), -1, 1);
        const hview = cameraProjectionMatrixInverse.mul(clip) 
        const view = hview.xyz.div(hview.w);
        const rd = transformDirection(view, cameraWorldMatrix);
        return rd;
    });
}