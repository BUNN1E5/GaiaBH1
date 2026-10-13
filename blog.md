# Building the GaiaBH1 black hole in a Raymarch Shader

I had originally built this blackhole shader for the [Unlikely Collaborators™ Game Jam](https://itch.io/jam/ucgamejam2026). Theme "consciousness and identity through awe and wonder - make awe playable" I had decided to have the setting of the game be centered around one of the most extreme things in our Universe, a black hole, and not just any black hole, [GaiaBH1](https://en.wikipedia.org/wiki/Gaia_BH1) the nearest black hole to us! 

## Check Out the live demo
[Play Demo](https://goldenneedham.com/demos/GaiaBH1/)

You might notice that the signature accretion disks are missing. Well that is because the black hole we are modelling actually does not have them. So our shader doesn't need it either. ~~Although it shouldn't be *too* hard to add them after if you want.~~

I had originally written the shader in the Godot shader language but the live web demo and what we will be working on here today was built in Three.js Shading Language or TSL.


If you are confortable with raymarching skip to [step 2 gravitational lensing](#step-2-gravitational-lensing)

## Step 0: Setting Up Three.js

Before we do anything with the blackhole, we need to setup our project. For this we are going to start with a modified version of three's [creating a scene](https://threejs.org/manual/#creating-a-scene) tutorial.

:::livecode[step-0]

You should see a green box that you can look around with your mouse. I kept the standard mesh box in there so we can make sure that something is properly rendering, we will remove it in the next part.

## Step 1: Basic Raymarching

Now that we have our scene setup we can start with our raymarcher boilerplate. We are gonna start with an uncolored sphere just to make sure that everything is working.

Our basic raymarcher is composed of 2 different parts. Our main and raymarch functions.

### The Main Function

Our main function is our entrypoint into the shader. Here we convert the screen position of every pixel on the screen into a world direction by going thru the following transformations, screen -> clip -> view -> world. 

First we need to convert our screen space UVs into clip space. Screen space UVs are usually from 0 to 1 so we must convert them to -1 to 1, we then can set our z to -1 for the near clipping plane, and w to 1 **for reasons**. TODO :: ADD REASONS

We then project our clip space into view space by multiplying it by the inverse of our projection matrix, and then dividing the xyz terms by our w term. 

Finally we need to transform the direction from view space into world space. To do this we multiply the camera's world matrix by the viewspace. Set the w component to 0 so that we can ignore the camera's position. Since these are direction vectors we also normalize the vector so they are unit length.

This gives us our ray direction, the ray origin is just our camera's position or the 4th column of the camera's world matrix. If we now return the ray direction we should be able to look around and see a couple of quadrents of colors.

We also need to add to our main.js file and remove the cube that is in the way.
```js
const blackHole = new BlackHole()
scene.backgroundNode = blackHole.main()
```

In our TSL code we use a couple of handy functions provided to us to make the code a bit easier, but the math is equivalent. Our code so far should look like this:

:::livecode[step-1-main]

```glsl
vec4 clip = vec4(screen_uv * 2. - 1., 0, 1);
vec4 hview = inverseProjectionMatrix * clip
vec3 view = hview.xyz/hview.w;
vec4 world = cameraWorldMatrix * vec4(view, 0);
vec3 rayDirection = normalize(world.xyz);
vec3 rayOrigin = cameraWorldMatrix[3].xyz;
```

### The Raymarch Function

Our raymarch function is the main part of our shader. We will use a standard raymarch loop and a singular SDF for a sphere.

:::livecode[step-1-raymarch]

```glsl
int MAX_STEPS = 100;
float EPSILON = .01;

float sdSphere(p, r){ return length(p) - r; }

float raymarch(vec3 ro, vec3 rd){
    vec3 p = ro;
    for(int i = 0; i < MAX_STEPS; i++){
        var step = map(p);

        if(step < EPSILON){
            return vec3(1);
        }
        p += rd * step
    }
    return vec3(0);
}
```


## Step 2: Gravitational Lensing
