# Building the GaiaBH1 black hole in a Raymarching Shader

I had originally built this blackhole shader for the [Unlikely Collaborators™ Game Jam](https://itch.io/jam/ucgamejam2026). Theme "consciousness and identity through awe and wonder - make awe playable" I had decided to have the setting of the game be centered around one of the most extreme things in our Universe, a black hole, and not just any black hole, [GaiaBH1](https://en.wikipedia.org/wiki/Gaia_BH1) the nearest black hole to us! 

## Check Out the live demo
<iframe src="https://goldenneedham.com/demos/GaiaBH1/" width="100%" height="400" style="padding: 5px" class="demo"></iframe>

You might notice that the signature accretion disks are missing. Well that is because the black hole we are modelling actually does not have them. So our shader doesn't need it either.

<!-- This is really stilted so lets try and rewrite this later -->
This post is going to go over writing the black hole shader and the orbit controller 

I had originally written the shader in the Godot shader language but the live web demo and what we will be working on here today was built in Three.js Shading Language or TSL.

If you want to skip the setup and just get to the juice you can skip to [step 4 gravitational lensing](#step-4-gravitational-lensing)

## Step 0: Setting Up Three.js

Before we do anything with the blackhole, we need to setup our project. For this we are going to start with a modified version of three's [creating a scene](https://threejs.org/manual/#creating-a-scene) tutorial.

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-0/project.json"></code-playground>

You should see a green box that you can look around with your mouse. I kept the standard mesh box in there so we can make sure that something is properly rendering, we will remove it in the next part.

## Step 1: Basic Raymarching

Now that we have our scene setup we can start with our raymarcher boilerplate. We are gonna start with an uncolored sphere just to make sure that everything is working.

Our basic raymarcher is composed of 2 different parts. Our main and raymarch functions.

### The Main Function

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
const float EPSILON = .1;

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

<!-- WE NEED TO REWRITE THIS -->
We just need to add a uniform to our cubemap, and sample it at the end of our raymarch loop. Of course we need to also add a variable to let us know if we hit something so we don't render the cubemap and while we are at it lets also add a constructor so we can define default values.

<details>
    <summary>GLSL</summary>

```glsl
const int MAX_STEPS = 100;
const float EPSILON = .1;

float sdSphere(vec3 p, float r){ return length(p) - r; }

vec3 raymarch(vec3 ro, vec3 rd){
    vec3 p = ro;
    bool hit = false;
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

## Step 3: Adding the Star

Adding the star is super straightforward, in fact its already in the scene. The sphere we were using to test is perfect for us to use. We just need to define some uniforms for the size and position of the star. We are also going to default the value to `vec3(5,0,0)` just so we dont have the blackhole and star overlap.
<!-- TODO :: Add GLSL code -->

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-3/project.json" selected="blackhole.js"></code-playground>

## Step 4: Gravitational Lensing

If you want to get more in depth about the derivation [check out this article](https://rantonels.github.io/starless/). We are gonna just skip to the end and have our geodesic function. Note we add an extra term $r_s$ for the Schwarzschild radius, and $\vec{r}$ is our ray position relative to the bh. Both $r_s$ and $h$ are constant terms and do not change in the geodesic function

$$
\vec{f}(\vec{r}) = -1.5h^2\frac{r_s \vec{r}}{||\vec{r}||^5}
$$

$$
h^2 = ||\vec{r} \times \vec{r}_{dir}||^2
$$

In our case we might not always want the blackhole to be in the center of our scene. So we need to convert our ray position into coordinates relative to the black hole

$$
\vec{r} = r_{pos} - bh_{pos}
$$

and now we just have to plug the equations into our integrator of choice to get the light bending. And you can use your integrator of choice, just to get things running we are gonna use a Euler integrator for now. For Euler our position and direction are defined as follows and $\Delta s$ being the step size

$$
\vec{r}_{pos,n+1} = \vec{r}_{pos,n} + \vec{r}_{vel,n} \Delta s \\
\vec{r}_{vel,n+1} = \vec{r}_{vel,n} + \vec{F}(\vec{r}_n) \Delta s
$$

In the geodesic derivation an assumption of 1 as the speed of light, because of this we then want to normalize our velocity to have a unit length of 1 to get our ray direction
$$
\vec{r}_{dir} =\frac{\vec{r}_{vel}}{||\vec{r}_{vel}||}
$$

And finally we want to add an escape condition for rays that reach the inside of the black hole. For this we need to check if our ray's direction is pointing in the direction of the black hole. The reasoning behing doing it this was as opposed to a solid sphere at the schwarschild radius is in the case of a an observer (our camera) being inside the black hole.

$$
\theta_{approach} = \vec{r} \cdot \vec{r}_{dir} < 0
$$


Now we need to put all that into code

<!-- TODO :: ADD STEP SKIP LINK -->
At this point the shader could technically be called done, if you're fine with what we have now feel free to skip to [step-n]. But we can still make the shader better and as a extra treat more performant.

<!-- TODO :: Add GLSL code -->

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-4/project.json" selected="blackhole.js"></code-playground>

## Step 5: Runge-Kutta (RK4)

One of the main benefits of Runge-Kutta or RK4 is that it is leagues more accurate than Euler. While each RK4 step is more costly than a single Euler step, each step is substansually more accurate, letting us significantly reduce the step count and increasing performance overall. I *borrowed* the math from [here](http://spiff.rit.edu/richmond/nbody/OrbitRungeKutta4.pdf)

RK4 is defined for any differential equation in the following form

$$
\frac{dy}{dt} = g(t,y)\\
y_0 =  y(t_0)
$$

The RK4 solver's definition is as follows

$$
y_{n+1} = y_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)
$$

And the terms are defined with $h$ being our step size (same as the $\Delta s$ in the Euler implementation)

$$
\begin{aligned}
k_1 &= g(t_n, y_n) \\
k_2 &= g(t_n + \frac{h}{2},\ y_n + k_1\frac{h}{2}) \\
k_3 &= g(t_n + \frac{h}{2},\ y_n + k_2\frac{h}{2}) \\
k_4 &= g(t_n + h,\ y_n + k_3h)
\end{aligned}
$$

For our case because we will be integrating over both the position and velocity our Y needs be a matrix of our first derivitive of each

$$
y= \begin{bmatrix}
\vec{r}_{vel}\\
\vec{f}(\vec{r})\end{bmatrix}
$$

In our specific case our chosen y is an [autonomous differential equation](https://math.libretexts.org/Bookshelves/Analysis/Supplemental_Modules_(Analysis)/Ordinary_Differential_Equations/2%3A_First_Order_Differential_Equations/2.5%3A_Autonomous_Differential_Equations) and doesn't depend on $t$, so we can rewrite our $g$ function and inital condition as 

$$
\frac{dy}{dt} = g(y)\\
y_0 = y(0)
$$

We then need solve for the $k$ terms for all values of our matrix

$$
\begin{alignedat}{2}
k_{1,vel} &= g(r_{vel,n})
&\qquad 
k_{1,f} &= g(\vec{f}(\vec{r}_n)) \\

k_{2,vel} &= g(r_{vel,n} + k_1\frac{h}{2})
&\qquad 
k_{2,f} &= g(\vec{f}(\vec{r}_n) + k_1\frac{h}{2}) \\

k_{3,vel} &= g(r_{vel,n} + k_2\frac{h}{2})
&\qquad
k_{3,f} &= g(\vec{f}(\vec{r}_n) + k_2\frac{h}{2}) \\

k_{4,vel} &= g(r_{vel,n} + k_3h)
&\qquad
k_{4,f} &= g(\vec{f}(\vec{r}_n) + k_3h)
\end{alignedat}
$$

and then solve the RK4 for each value in the matrix. Do note that $\vec{r}_{pos,n}$ is the relative position at iteration $n$

$$
\begin{aligned}
\vec{r}_{pos,n+1} &= \vec{r}_{pos,n} + \frac{h}{6}(k_{1,vel} + 2k_{2,vel} + 2k_{3,vel} + k_{4,vel}) \\
\vec{r}_{vel,n+1} &= \vec{r}_{vel,n} + \frac{h}{6}(k_{1,f} + 2k_{2,f} + 2k_{3,f} + k_{4,f})
\end{aligned}
$$

And all that is left is to actually plug this into our code

<!-- TODO :: Add GLSL code  -->

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-5/project.json" selected="blackhole.js"></code-playground>

And now our shader is officially done! Now we need to write a controller for it.

## Step 6 : Orbit Controller

