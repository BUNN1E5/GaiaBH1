import { TempNode, Vector3, Color } from 'three';

import {
    uniform,
    Loop,
    Fn,
    If,
    Break,
    struct,
    length,
    min,
    max,
    mix,
    clamp,
    distance,
    pow2,
    pow3,
    cubeTexture,
    oneMinus,
    sqrt,
    reciprocal,
    normalize,
    vec3,
    vec4,
    float,
    int,
    bool,
    cameraPosition,
    cameraWorldMatrix,
    screenUV,
    cameraProjectionMatrixInverse,
    transformDirection
} from 'three/tsl';

class BlackHoleNode extends TempNode{

    static get type(){
        return 'BlackHoleNode';
    }

    Ray = struct({
    origin: 'vec3',
    dir: 'vec3',
    pos: 'vec3',
    dist: 'float',
    hit: 'bool',
    insideBH: 'bool',
    iterations: 'int'
    }, 'Ray')

    constructor(//pass,
                cubeTextureNode, 
                iterations = 200,
                max_dist = 100000,
                sky_brightness = 1,
                schwarzschild_radius = 1,
                black_hole_center = new Vector3(),
                star_radius = 1.,
                star_center = new Vector3(),
                star_color = new Color(1)
    ){
        super('vec4')
        // this.pass = pass;
        this.skybox = cubeTextureNode;

        this.schwarzschild_radius = uniform(float(schwarzschild_radius));
        this.epsilon = uniform(float(.0001));
        this.iterations = uniform(int(iterations));
        this.max_dist = uniform(float(max_dist));
        this.sky_brightness = uniform(float(sky_brightness));
        this.near_bh_step_mult = uniform(float(.02));
        this.use_redshift = uniform(bool(false));
        
        this.black_hole_center = uniform(black_hole_center);
        this.star_center = uniform(star_center);
        this.star_radius = uniform(float(star_radius));
        this.star_color = uniform(star_color);
    }


    sdSphere = Fn(({ p, s }) => { return length(p).sub(s); });
    map = Fn(({ p }) => {
        return this.sdSphere({p: p.sub(this.star_center), s: this.star_radius});
    });


    raymarch = Fn(({ ro, rd }) => {
        const r = this.Ray({
            origin: ro,
            dir: rd,
            pos: ro,
            dist: float(0),
            hit: bool(false),
            insideBH: bool(false),
            iterations: int(0)
        }).toVar();

        Loop(this.iterations, ({ i }) => {
            r.get('iterations').assign(i);
            const d = this.map({p: r.get('pos')});
            If(d.lessThan(this.epsilon), () => {
                r.get('hit').assign(true);
                Break();
            });

            const rel_p = r.get('pos').sub(this.black_hole_center);
            const r2 = rel_p.dot(rel_p);
            const r_len = r2.sqrt();

            If(r_len.lessThan(this.schwarzschild_radius), () => {
                r.get('insideBH').assign(true);
                Break();
            });
            
            const L = rel_p.cross(r.get('dir'));
            const h2 = L.dot(L);
            const divisor = r2.mul(r2).mul(r_len);
            const accel = this.schwarzschild_radius.mul(-1.5).mul(h2).mul(rel_p).div(divisor);
            const step_size = min(d, r_len.mul(this.near_bh_step_mult));

            r.get('dist').addAssign(step_size);
            r.get('pos').addAssign(r.get('dir').mul(step_size));
            r.get('dir').assign(normalize(r.get('dir').add(accel.mul(step_size))));

            If(r.get('dist').greaterThan(this.max_dist), () => {
                Break();
            });
        });
        return r;
    });

    solveRayColor = Fn(({ r }) =>{
        const color = vec3(0,0,0).toVar();
        If(r.get('insideBH').equal(true), ()=>{}) //We default to black
        .ElseIf(r.get('hit').equal(true), ()=>{
            color.assign(this.star_color.rgb);
        }).Else(()=>{
        
            const dist_from_bh = distance(r.get('origin'), this.black_hole_center);
            const safe_dist = max(dist_from_bh, this.schwarzschild_radius.add(this.epsilon));
            const g_shift = reciprocal(sqrt(oneMinus(this.schwarzschild_radius.div(safe_dist))));
            const sky_color = cubeTexture(this.skybox, r.get('dir')).rgb.toVar();
            const brightness = clamp(reciprocal(g_shift), 0, 1);

            If(this.use_redshift, ()=>{
                const _sky_color = vec3(
                    sky_color.r.mul(brightness),
                    sky_color.g.mul(pow2(brightness)),
                    sky_color.b.mul(pow3(brightness)));
                sky_color.assign(_sky_color);
            });
            //color is already black in this case
            const _color = mix(color, sky_color.mul(this.sky_brightness), 1);
            color.assign(_color);
        });
        return color;
    });

    blackhole = Fn(({ro, rd}) => {
            return vec4(this.solveRayColor(this.raymarch(ro, rd)), 1);
        });

    

    setup(builder){

        const ndc = vec4(screenUV.mul(2).sub(1), 1, 1);
        const view = cameraProjectionMatrixInverse.mul(ndc);
        const rd = transformDirection(view.xyz.div(view.w), cameraWorldMatrix);

        return this.blackhole({ro: cameraPosition, rd: rd});
    }
}

export default BlackHoleNode;

// export const blackhole = ({node, cubeTexture}) => new BlackHoleNode(node, cubeTexture);