import { Vector3 } from 'three';
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
    uniform,
    uniformCubeTexture,
    cameraPosition,
    cameraWorldMatrix,
    screenUV,
    cameraProjectionMatrixInverse,
    transformDirection
} from 'three/tsl';

export class BlackHole{
    
    main = Fn(() => {
        const clip = vec4(screenUV.x.mul(2).sub(1), screenUV.y.mul(-2).add(1), -1, 1);
        const hview = cameraProjectionMatrixInverse.mul(clip);
        const view = hview.xyz.div(hview.w);
        const rd = transformDirection(view, cameraWorldMatrix);
        return rd;
    });
}