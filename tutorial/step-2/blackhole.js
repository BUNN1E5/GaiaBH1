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

    //New code here!!
    black_hole_center = vec3(0,0,0);
    schwarzschild_radius = 1;
    //End new code

    sdSphere = Fn(({p, r}) => { return length(p).sub(r.mul(.5)); });
    raymarch = Fn(({ ro, rd }) => {
        const rayPosition = ro.toVar();
        const color = vec3(0).toVar();
        
        //New code here!!

        //h2 is conserved so we only need to calculate it once
        const h = (rayPosition.sub(this.black_hole_center)).cross(rd);
        const h2 = h.dot(h); // dot product with itself gets square magnitude
        
        //End new code
        
        Loop(this.MAX_STEPS, ({ i }) => {
            const step = this.sdSphere({p : rayPosition, r : 1});
            If(step.lessThan(this.EPSILON), () => {
                color.assign(vec3(1));
                Break();
            });

            //New code here!!

            //ray relative position
            const rrp = rayPosition - this.black_hole_center;
            const r2 = rrp.dot(rrp);
            const r5 = r2.mul(r2).mul(rrp.length);
            const f = float(-1.5).mul(h2).mul(this.schwarzschild_radius).mul(normalize(rrp)).div(r5);

            //end new code

            rayPosition.addAssign(rd.mul(step));
        });
        return color;
    });

    main = Fn(() => {
        const ndc = vec4(screenUV.x.mul(2).sub(1), screenUV.y.mul(-2).add(1), 0, 1);
        const view = cameraProjectionMatrixInverse.mul(ndc);
        const rd = transformDirection(view.xyz.div(view.w), cameraWorldMatrix);
        return vec3(this.raymarch({ro: cameraPosition, rd: rd}));
    });
}