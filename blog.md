# Building the GaiaBH1 black hole in a Raymarch Shader

I had originally built this blackhole shader for the [Unlikely Collaborators™ Game Jam](https://itch.io/jam/ucgamejam2026). Theme "consciousness and identity through awe and wonder - make awe playable" I had decided to have the setting of the game be centered around one of the most extreme things in our Universe, a black hole, and not just any black hole, [GaiaBH1](https://en.wikipedia.org/wiki/Gaia_BH1) the nearest black hole to us! 

## Check Out the live demo
<iframe src="https://goldenneedham.com/demos/GaiaBH1/" width="100%" height="400" style="padding: 5px" class="demo"></iframe>

You might notice that the signature accretion disks are missing. Well that is because the black hole we are modelling actually does not have them. So our shader doesn't need it either.

I had originally written the shader in the Godot shader language but the live web demo and what we will be working on here today was built in Three.js Shading Language or TSL. However I will provide equivalent GLSL because TSL can get a bit wordy and hard to parse.

If you are comfortable with raymarching skip to [step 3 gravitational lensing](#step-3-gravitational-lensing)

## Step 0: Setting Up Three.js

Before we do anything with the blackhole, we need to setup our project. For this we are going to start with a modified version of three's [creating a scene](https://threejs.org/manual/#creating-a-scene) tutorial.

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-0/project.json"></code-playground>

You should see a green box that you can look around with your mouse. I kept the standard mesh box in there so we can make sure that something is properly rendering, we will remove it in the next part.

## Step 1: Basic Raymarching

Now that we have our scene setup we can start with our raymarcher boilerplate. We are gonna start with an uncolored sphere just to make sure that everything is working.

Our basic raymarcher is composed of 2 different parts. Our main and raymarch functions.

### The Main Function
TODO :: CUT THIS SHORTER

Our main function is our entrypoint into the shader. Here we convert the screen position of every pixel on the screen into a world direction by going thru the following transformations, screen -> clip -> view -> world. 

This gives us our ray direction, the ray origin is just our camera's position or the 4th column of the camera's world matrix. If we now return the ray direction we should be able to look around a couple quadrents of colors.

```glsl
vec4 clip = vec4(screen_uv * 2. - 1., -1, 1);
vec4 hview = inverseProjectionMatrix * clip
vec3 view = hview.xyz/hview.w;
vec4 world = cameraWorldMatrix * vec4(view, 0);
vec3 rayDirection = normalize(world.xyz);
vec3 rayOrigin = cameraWorldMatrix[3].xyz;
```

We also need to add to our main.js file and remove the cube that is in the way.
```js
const blackHole = new BlackHole()
scene.backgroundNode = blackHole.main()
```

In our TSL code we use the `transformDirection()` instead of multiplying the cameraWorldMatrix and noramalizing becuase it does those for us. 

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-1-main/project.json" selected="blackhole.js"></code-playground>

### The Raymarch Function

Our raymarch function is the main part of our shader. For every pixel we step a ray in a direction and distance based on an SDF function, and stops when close enough. If we never get close enough then the ray runs out of steps and returns black

We will use a standard raymarch loop and a single [SDF for a sphere](https://iquilezles.org/articles/distfunctions/). This will be the base that we add the gravitational lensing to.

<details>
    <summary>GLSL</summary>

```glsl
const int MAX_STEPS = 100;
const float EPSILON = .01;

float sdSphere(vec3 p, float r){ return length(p) - r; }

vec3 raymarch(vec3 ro, vec3 rd){
    vec3 p = ro;
    for(int i = 0; i < MAX_STEPS; i++){
        float step = sdSphere(p, .5);

        if(step < EPSILON){
            return vec3(1); //hit: white
        }
        p += rd * step;
    }
    return vec3(0);
}
```
</details>

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-1-raymarch/project.json" selected="blackhole.js"></code-playground>

## Step 2: Skybox

Before we add the black hole with its lensing lets add a skybox. Three.js' [CubeTexture](https://threejs.org/docs/?q=CubeTex#CubeTexture) requires us to define a path for each face. For testing and demonstration we are going to be using these faces:

<p align="center">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_0.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_1.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_2.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_3.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_4.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_5.jpg' width="15%">
</p>

We just need to add a uniform to our cubemap, and sample it at the end of our raymarch loop. While we are at it lets also add a constructor so we can define default values.

```glsl
const int MAX_STEPS = 100;
const float EPSILON = .01;

float sdSphere(vec3 p, float r){ return length(p) - r; }

vec3 raymarch(vec3 ro, vec3 rd){
    vec3 p = ro;
    for(int i = 0; i < MAX_STEPS; i++){
        float step = sdSphere(p, .5);

        if(step < EPSILON){
            return vec3(1); //hit: white
        }
        p += rd * step;
    }

    if(!hit){
        return cubeTexture(cubemap, rd).rgb;
    }

    return vec3(0);
}
```
</details>

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-2/project.json" selected="blackhole.js"></code-playground>

## Step 3: Gravitational Lensing

If you want to get more in depth about the derivation [check out this article](https://rantonels.github.io/starless/). We are gonna just skip to the end and have our geodesic equation. Note we add an extra term $r_s$ for the Schwarzschild radius, and $r$ is our ray position relative to the bh. 

$$
\vec{F}(r) = -1.5h^2\frac{r_s \vec{r}}{||\vec{r}||^5}
$$

$$
h = ||\vec{r} \times \vec{r}_{dir}||^2
$$

In our case we might not always want the blackhole to be in the center of our scene. So we need to convert our ray position into coordinates relative to the black hole

$$
\vec{r} = r_{pos} - bh_{pos}
$$

and now we just have to plug the equations into our integrator of choice to get the light bending. We are gonna use a standard Runge Kutta (RK4) implementation

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-3/project.json" selected="blackhole.js"></code-playground>