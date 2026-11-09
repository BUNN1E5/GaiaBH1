import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MathUtils, Timer } from 'three';

export class BlackHoleCamera extends OrbitControls {
    constructor(camera, domElement) {
        super(camera, domElement);
        this.enablePan = false;
        this.enableDamping = true;

        
        this.shwarzschildRadius = 1.0;
        this.autoRotateSpeed = .005;


        this.isInactive = true;
        this.inactiveTime = 20; //Seconds
        this.timer = new Timer();
        this.autoRotate = true;
        this.autoRotateSpeed = 2;
        this.inactiveTimeRef = 0;
        this.zoomTimeRef = 10;


        this.runOnce = () => {
            this.autoRotate = false;
            this.removeEventListener('start', this.runOnce);
            this.inactiveTimeRef = this.timer.getElapsed();
        }
        this.addEventListener('start', this.runOnce);

        this.addEventListener('end', () => {
            this.inactiveTimeRef = this.timer.getElapsed();
            this.autoRotate = false;
        })
    }

    sdSphere(p, r){
        return p.length() - r;
    }

    update(timestep) {
        super.update(timestep);

        if(!this.timer){
            return;
        }

        if(!this.autoRotate){
            if(this.timer.getElapsed() - this.inactiveTimeRef > this.inactiveTime){
                this.addEventListener('start', this.runOnce);
                this.autoRotate = true;
            }
        }
        this.timer.update(timestep)


        const surfaceDistance = this.sdSphere(this.object.position, this.shwarzschildRadius);
        const turnDistance = 2 * this.shwarzschildRadius;
        const dist = MathUtils.clamp(surfaceDistance / turnDistance, 0, 1);
        this.object.rotateY(Math.PI - Math.PI * dist);
    }
    
}