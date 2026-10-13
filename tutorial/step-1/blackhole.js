import {
    Loop,
    Fn,
    If,
    Break,
    length,
    vec3,
    vec4,
    float,
    cameraPosition,
    cameraWorldMatrix,
    screenUV,
    cameraProjectionMatrixInverse,
    transformDirection
} from 'three/tsl';

export class BlackHole{
    MAX_STEPS = 100;
    MAX_DIST = 100;
    EPSILON = 0.1;

    sdSphere = Fn(({p, r}) => { return length(p).sub(r.mul(.5)); });
    
    map = Fn(({p}) => {
        return this.sdSphere({p : p, r : 1});
    });

    raymarch = Fn(({ ro, rd }) => {
        const dist = float(0).toVar();
        Loop(this.MAX_STEPS, ({ i }) => {
            const p = ro.add(rd.mul(dist))
            const step = this.map({p : p})
            dist.addAssign(step)
            If(dist.greaterThan(this.MAX_DIST), () => {
                Break();
            });
        });
        return dist.div(this.MAX_DIST);
    });

    main = Fn(() => {
        const ndc = vec4(screenUV.x.mul(2).sub(1), screenUV.y.mul(-2).add(1), 0, 1);
        const view = cameraProjectionMatrixInverse.mul(ndc);
        const rd = transformDirection(view.xyz.div(view.w), cameraWorldMatrix);
        return vec3(this.raymarch({ro: cameraPosition, rd: rd}));
    });
}