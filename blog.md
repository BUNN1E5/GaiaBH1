# Building the Gaia BH1 black hole in a Raymarching Shader

I had originally built this black hole shader for the [Unlikely Collaborators™ Game Jam](https://itch.io/jam/ucgamejam2026). Its theme was "consciousness and identity through awe and wonder - make awe playable." I decided to center the game's setting around one of the most extreme things in our Universe: a black hole. Specifically, it would feature [GaiaBH1](https://en.wikipedia.org/wiki/Gaia_BH1), the nearest known black hole to us!

I had originally written the shader in the Godot shader language, but the live web demo and the example we will build today were created in Three.js Shading Language, or TSL.

## Check Out the live demo
<iframe src="https://goldenneedham.com/demos/GaiaBH1/" width="100%" height="400" style="padding: 5px" class="demo"></iframe>

You might notice that the signature accretion disks are missing. That is because the black hole we are modeling does not have them, so our shader does not need to render them either.
This post goes over writing the black hole shader and the orbit controller. If you want to skip the setup and jump straight to the interesting parts, you can jump to [Step 4: Gravitational Lensing](#step-4-gravitational-lensing).

## Step 0: Setting Up Three.js

Before we do anything with the black hole, we need to set up our project. We will start with a modified version of Three.js' [Creating a Scene](https://threejs.org/manual/#creating-a-scene) tutorial.

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-0/project.json"></code-playground>

You should see a green box that you can look around with your mouse. I kept the standard mesh box in place so we can verify that something is rendering properly. We will remove it in the next part.

## Step 1: Basic Raymarching

Now that we have our scene set up, we can start with our raymarcher boilerplate. We will begin with an uncolored sphere to make sure that everything is working.

Our basic raymarcher is composed of 2 different parts: our main and raymarch functions.

### The Main Function

Our main function is our entry point into the shader. Here we convert the screen position of every pixel on the screen into a world direction by going through the following transformations: screen -> clip -> view -> world.

This gives us our ray direction. The ray origin is just our camera's position or the 4th column of the camera's world matrix. If we now return the ray direction, we should be able to look around a few quadrants of color.

<details>
    <summary>GLSL</summary>

```glsl
vec4 clip = vec4(screen_uv * 2. - 1., -1, 1);
vec4 hview = inverseProjectionMatrix * clip;
vec3 view = hview.xyz / hview.w;
vec4 world = cameraWorldMatrix * vec4(view, 0);
vec3 rayDirection = normalize(world.xyz);
vec3 rayOrigin = cameraWorldMatrix[3].xyz;
```
</details>

Of course, we want our shader to render to the screen, and the easiest way is to have our scene's background node point to our shader. Anything else in the scene will render in front of our shader, but that isn't an issue for us.
```js
const blackHole = new BlackHole()
scene.backgroundNode = blackHole.main()
```

In our TSL code we use the `transformDirection()` instead of multiplying the cameraWorldMatrix and normalizing because it does those for us.

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-1-main/project.json" selected="blackhole.js"></code-playground>

### The Raymarch Function

Our raymarch function is the main part of our shader. For every pixel, we step a ray in a direction and distance based on an SDF function, and it stops when close enough. If we never get close enough, then the ray runs out of steps and returns black.

We will use a standard raymarch loop and a single [SDF for a sphere](https://iquilezles.org/articles/distfunctions/). This will be the base that we add the gravitational lensing to.

<details>
    <summary>GLSL</summary>

```glsl
const int MAX_STEPS = 100;
const float EPSILON = 0.1;

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

vec3 raymarch(vec3 ro, vec3 rd) {
    vec3 p = ro;

    for (int i = 0; i < MAX_STEPS; i++) {
        float step = sdSphere(p, 0.5);

        if (step < EPSILON) {
            return vec3(1.0); // Hit: white.
        }

        p += rd * step;
    }

    return vec3(0.0);
}
```
</details>

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-1-raymarch/project.json" selected="blackhole.js"></code-playground>

## Step 2: Skybox

Before we add the black hole with it's lensing, let's add a skybox. Three.js' [CubeTexture](https://threejs.org/docs/?q=CubeTex#CubeTexture) requires us to define a path for each face. For testing and demonstration, we are going to be using these faces:

<p align="center">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_0.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_1.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_2.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_3.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_4.jpg' width="15%">
    <img src='https://bunn1e5.github.io/GaiaBH1/textures/face_5.jpg' width="15%">
</p>

<!-- WE NEED TO REWRITE THIS -->
We just need to add a uniform to our cubemap, and sample it at the end of our raymarch loop. Of course, we need to also add a variable to let us know if we hit something so we don't render the cubemap, and while we are at it let's also add a constructor so we can define default values.

<details>
    <summary>GLSL</summary>

```glsl
const int MAX_STEPS = 100;
const float EPSILON = 0.1;

uniform samplerCube cubemap;

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

vec3 raymarch(vec3 ro, vec3 rd) {
    vec3 p = ro;

    for (int i = 0; i < MAX_STEPS; i++) {
        float step = sdSphere(p, 0.5);

        if (step < EPSILON) {
            return vec3(1.0);
        }

        p += rd * step;
    }

    return texture(cubemap, rd).rgb;
}
```
</details>

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-2/project.json" selected="blackhole.js"></code-playground>

## Step 3: Adding the Star

Adding the star is quite straightforward; in fact, it is already in the scene. The sphere we were using for testing is perfect for this purpose. We just need to define some uniforms for the star's size and position. We will also default the position to `vec3(5,0,0)` so that the black hole and star do not overlap.
<details>
    <summary>GLSL</summary>

```glsl
const int MAX_STEPS = 100;
const float EPSILON = 0.1;

uniform samplerCube cubemap;
uniform vec3 starPosition = vec3(5.0, 0.0, 0.0);
uniform vec3 starColor = vec3(1.0, 1.0, 1.0);
uniform float starRadius = 1.0;

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

vec3 raymarch(vec3 ro, vec3 rd) {
    vec3 p = ro;

    for (int i = 0; i < MAX_STEPS; i++) {
        float step = sdSphere(p - starPosition, starRadius);

        if (step < EPSILON) {
            return starColor;
        }

        p += rd * step;
    }

    return texture(cubemap, rd).rgb;
}
```
</details>

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-3/project.json" selected="blackhole.js"></code-playground>

## Step 4: Gravitational Lensing

If you want a more in-depth derivation, [check out this article](https://rantonels.github.io/starless/). We will skip to the end and use our [geodesic](https://en.wikipedia.org/wiki/Geodesic) function. We add an extra term, $r_s$, for the Schwarzschild radius, and $\vec{r}$ is our ray position relative to the black hole. Both $r_s$ and $h$ are constant terms and do not change in the geodesic function.

$$
\vec{f}(\vec{r}) = -1.5h^2\frac{r_s \vec{r}}{||\vec{r}||^5}
$$

$$
h^2 = ||\vec{r} \times \vec{r}_{dir}||^2
$$

In our case, we might not always want the black hole in the center of our scene. The rays defined in our shader are in world space and not relative to the black hole, so we need to calculate our ray's relative position, $\vec{r}$.

$$
\vec{r} = r_{pos} - bh_{pos}
$$

Now we just have to plug the equations into an integrator of our choice to calculate the light bending. You can use any integrator you prefer, but we will use an Euler integrator to get started. For Euler, our position and direction are defined as follows, with $\Delta s$ as the step size:

$$
\vec{r}_{pos,n+1} = \vec{r}_{pos,n} + \vec{r}_{vel,n} \Delta s \\
\vec{r}_{vel,n+1} = \vec{r}_{vel,n} + \vec{f}(\vec{r}_n) \Delta s
$$

The geodesic derivation assumes a speed of light of 1. Because of this, we normalize the velocity to a unit length of 1 to get our ray direction:

$$
\vec{r}_{dir} =\frac{\vec{r}_{vel}}{||\vec{r}_{vel}||}
$$

And finally, we want to add a termination condition for rays that reach the inside of the black hole. For this, we need to check if our ray's direction is pointing in the direction of the black hole. The reasoning behind doing this as opposed to a solid sphere at the Schwarzschild radius is in the case of an observer (our camera) being inside the black hole

$$
\text{terminate if} \quad ||\vec{r}|| < r_s \quad \text{and} \quad \vec{r} \cdot \vec{r}_{dir} < 0
$$

Now we need to put all that into code.

<details>
    <summary>GLSL</summary>

```glsl
const int MAX_STEPS = 200;
const float EPSILON = 0.1;

uniform samplerCube cubemap;
uniform vec3 starPosition = vec3(5.0, 0.0, 0.0);
uniform vec3 starColor = vec3(1.0, 1.0, 1.0);
uniform float starRadius = 1.0;
uniform vec3 blackHolePosition = vec3(0.0, 0.0, 0.0);
uniform float schwarzschildRadius = 1.0;

float sdSphere(vec3 p, float r) {
    return length(p) - r * 0.5;
}

vec3 raymarch(vec3 ro, vec3 rd) {
    vec3 p = ro;
    vec3 rdir = rd;

    vec3 h = cross(p - blackHolePosition, rdir);
    float h2 = dot(h, h);

    for (int i = 0; i < MAX_STEPS; i++) {
        float step = sdSphere(p - starPosition, starRadius);

        if (step < EPSILON) {
            return starColor;
        }

        vec3 rrp = p - blackHolePosition;
        float r2 = dot(rrp, rrp);
        float rlen = length(rrp);
        float r5 = r2 * r2 * rlen;

        vec3 f = (-1.5 * h2 * schwarzschildRadius * rrp) / r5;

        if (rlen <= schwarzschildRadius) {
            if (dot(rrp, rdir) < 0.0) {
                return vec3(0.0);
            }
        }

        float stepSize = min(step, rlen * 0.2);
        rdir = normalize(rdir + f * stepSize);
        p += rdir * stepSize;
    }

    return texture(cubemap, rdir).rgb;
}
```
</details>

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-4/project.json" selected="blackhole.js"></code-playground>

At this point, the shader could technically be called done; if you're fine with what we have now, feel free to skip to [Step 8](#step-8-simulating-the-orbit). But we can still make the shader better and, as an extra treat, more performant.


## Step 5: Runge-Kutta (RK4)

One of the main benefits of Runge-Kutta or RK4 is that it is substantially more accurate than Euler. While each RK4 step is more costly than a single Euler step, each step is substantially more accurate, letting us significantly reduce the step count and increase performance overall. I *borrowed* a lot of the math from [here](http://spiff.rit.edu/richmond/nbody/OrbitRungeKutta4.pdf)

RK4 is defined for any differential equation in the following form

$$
\frac{dy}{dt} = g(t,y)\\
y_0 =  y(t_0)
$$

The RK4 solver's definition is as follows

$$
y_{n+1} = y_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)
$$

And the terms are as follows, with $\Delta s$ being the step size, the same as our Euler implementation

$$
\begin{aligned}
k_1 &= g(t_n, y_n) \\
k_2 &= g(t_n + \frac{\Delta s}{2},\ y_n + k_1\frac{\Delta s}{2}) \\
k_3 &= g(t_n + \frac{\Delta s}{2},\ y_n + k_2\frac{\Delta s}{2}) \\
k_4 &= g(t_n + \Delta s,\ y_n + k_3\Delta s)
\end{aligned}
$$

For our case because we will be integrating over both the position and velocity our $y$ needs be a vector of our first derivative of each

$$
y = \begin{bmatrix}
\vec{r}_{pos}\\
\vec{r}_{vel}
\end{bmatrix},
\qquad
y' = \begin{bmatrix}
\vec{r}_{vel}\\
\vec{f}(\vec{r}_{pos})
\end{bmatrix}
$$

In our specific case, our chosen $y$ is an [autonomous differential equation](https://math.libretexts.org/Bookshelves/Analysis/Supplemental_Modules_(Analysis)/Ordinary_Differential_Equations/2%3A_First_Order_Differential_Equations/2.5%3A_Autonomous_Differential_Equations) and doesn't depend on $t$, so we can rewrite our $g$ function and initial condition as

$$
\frac{dy}{dt} = \vec{g}(\vec{y})\\
$$

We then need to solve for the $k$ terms for all values of our $y$ vector

$$
\begin{alignedat}{2}
k_{1,pos} &= \vec{r}_{vel,n}
&\qquad
k_{1,vel} &= \vec{f}(\vec{r}_n) \\

k_{2,pos} &= \vec{r}_{vel,n} + k_{1,vel}\frac{\Delta s}{2}
&\qquad
k_{2,vel} &= \vec{f}(\vec{r}_n + k_{1,pos}\frac{\Delta s}{2}) \\

k_{3,pos} &= \vec{r}_{vel,n} + k_{2,vel}\frac{\Delta s}{2}
&\qquad
k_{3,vel} &= \vec{f}(\vec{r}_n + k_{2,pos}\frac{\Delta s}{2}) \\

k_{4,pos} &= \vec{r}_{vel,n} + k_{3,vel}\Delta s
&\qquad
k_{4,vel} &= \vec{f}(\vec{r}_n + k_{3,pos}\Delta s)
\end{alignedat}
$$

and then solve the RK4 for each value in the vector. Do note that $\vec{r}_{pos,n}$ is the relative position at iteration $n$

$$
\begin{aligned}
\vec{r}_{pos,n+1} &= \vec{r}_{pos,n} + \frac{\Delta s}{6}(k_{1,pos} + 2k_{2,pos} + 2k_{3,pos} + k_{4,pos}) \\
\vec{r}_{vel,n+1} &= \vec{r}_{vel,n} + \frac{\Delta s}{6}(k_{1,vel} + 2k_{2,vel} + 2k_{3,vel} + k_{4,vel})
\end{aligned}
$$

And all that is left is to actually plug this into our code. However, we also need to move our geodesic calculation into it's own function so we can call it in our RK4 calculation.


<details>
    <summary>GLSL</summary>

```glsl
const int MAX_STEPS = 50;
const float EPSILON = 0.1;

uniform samplerCube cubemap;
uniform vec3 starPosition = vec3(5.0, 0.0, 0.0);
uniform vec3 starColor = vec3(1.0, 1.0, 1.0);
uniform float starRadius = 1.0;
uniform vec3 blackHolePosition = vec3(0.0, 0.0, 0.0);
uniform float schwarzschildRadius = 1.0;

float sdSphere(vec3 p, float r) {
    return length(p) - r * 0.5;
}

vec3 geodesic(vec3 rpos, float h2) {
    vec3 rrp = rpos - blackHolePosition;
    float r2 = dot(rrp, rrp);
    float rlen = length(rrp);
    float r5 = r2 * r2 * rlen;

    return (-1.5 * h2 * schwarzschildRadius * rrp) / r5;
}

void rk4(inout vec3 rpos, inout vec3 rvel, float h2, float s) {
    vec3 k1pos = rvel;
    vec3 k1vel = geodesic(rpos, h2);

    vec3 k2vel = geodesic(rpos + k1pos * s * 0.5, h2);
    vec3 k2pos = rvel + k1vel * s * 0.5;

    vec3 k3vel = geodesic(rpos + k2pos * s * 0.5, h2);
    vec3 k3pos = rvel + k2vel * s * 0.5;

    vec3 k4vel = geodesic(rpos + k3pos * s, h2);
    vec3 k4pos = rvel + k3vel * s;

    //c = 1
    rvel = normalize(rvel + s / 6.0 * (k1vel + 2.0 * k2vel + 2.0 * k3vel + k4vel));
    rpos += s / 6.0 * (k1pos + 2.0 * k2pos + 2.0 * k3pos + k4pos);
}

vec3 raymarch(vec3 ro, vec3 rd) {
    vec3 rpos = ro;
    vec3 rdir = rd;

    vec3 h = cross(rpos - blackHolePosition, rdir);
    float h2 = dot(h, h);

    for (int i = 0; i < MAX_STEPS; i++) {
        float step = sdSphere(rpos - starPosition, starRadius);

        if (step < EPSILON) {
            return starColor;
        }

        vec3 rrp = rpos - blackHolePosition;
        float rlen = length(rrp);

        if (rlen <= schwarzschildRadius) {
            if (dot(rrp, rdir) < 0.0) {
                return vec3(0.0);
            }
        }

        float stepSize = min(step, rlen * 0.8);
        rk4(rpos, rdir, h2, stepSize);
    }

    return texture(cubemap, rdir).rgb;
}
```
</details>

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-5/project.json" selected="blackhole.js"></code-playground>

And now our shader is officially done!

## Step 6: Adding Bloom

This part is optional, but adding a small amount of bloom really elevates the look. Three.js makes this fairly easy. Add the following, and any color value greater than 1 will be emissive.

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-6/project.json" selected="main.js"></code-playground>

## Step 7: Calculating our Orbits

Before we do anything else, let's grab the key terms we need from the Wikipedia page for [Gaia BH1](https://en.wikipedia.org/wiki/Gaia_BH1).

$$
\begin{array}{ll}
\text{Black hole Mass } (m_{bh}) &9.27 \pm 0.10\,M_\odot \\
\text{Star Mass } (m_{s}) &0.93 \pm 0.05\,M_\odot \\
\text{Eccentricity } (e) &0.43230±0.00002 \\
\text{Semi-major axis } (a) & 1.40±0.01\,AU \\
\text{Gravitational Constant } (G) & 39.478 \,AU^3yr^{-2}M_\odot^{-1}\\

\end{array}
$$

### Calculating our initial positions

To calculate the initial positions of our stellar bodies, the black hole and star, we need to calculate the distance $(d)$ between the two bodies and their [barycenter](https://en.wikipedia.org/wiki/Barycenter). Luckily, we already know our orbit's semi-major axis and eccentricity, which makes solving for both easy.

First, let's find our distance at apoapsis:

$$
d = a(1+e) = 1.40(1 + .4323) =  2.00522 \, AU
$$

Then we find each body's distance from the barycenter. Let's solve for the black hole first:

$$
r_{bh} = \frac{d}{1 + \frac{m_{bh}}{m_{s}}} = \frac{2.00522}{1 + \frac{9.27}{.93}} = 0.18283 \, AU\\
$$

Solving for the star is easy. Its position is the distance between the two bodies minus the black hole's position:

$$
r_{s} = d - r_{bh} = 2.00522 - 0.18283 = 1.82239 \, AU
$$
And of course these are just distances from the barycenter, we want to define their positions in a vector. We will assume `(0,0,0)` as the barycenter, and have the orbit be along the $X$ axis. So our initial positions will be as follows:

$$
\begin{array}{ll}
\vec{p}_{bh} &= {-}(0.18283, 0, 0) \, AU\\
\vec{p}_s &= \mkern14mu (1.82239, 0, 0) \, AU
\end{array}
$$

### Calculating our initial velocities

Now we want to find our initial velocities. These can be found using the [Vis-Viva Equation](https://en.wikipedia.org/wiki/Vis-viva_equation).

$$
\mu = G(m_{bh} + m_s) = 39.478(9.27 + .93) = 402.676 \,AU^3y^{-2} \\ 
$$
$$
v^2 = \mu(\frac{2}{d} - \frac{1}{a}) = 402.676(\frac{2}{2.00522} - \frac{1}{1.40}) = 114.00175 \, AU^2y^-2 \\
$$
$$
v = \sqrt{114.00175} = 10.67716 \, AU/y
$$

Since we are at apoapsis, the velocities for both bodies are defined as:

$$
v_{bh} = v\frac{m_s}{m_bh + m_s} = 10.67716 \frac{.93}{9.27 + .93} = 0.97351 \, AU/y \\
$$
$$
v_s = v - v_{bh} = 10.67716 - .97351 = 9.70365 \, AU/y
$$

And again we need to define these as a vector, the direction is perpendicular to the direction of our inital positions. We will choose the $Z$ axis as our direction

$$
\begin{array}{ll}
\vec{v}_{bh} &= {-}(0, 0, 0.97351) \, AU/y \\
\vec{v}_{s} &= \mkern14mu (0, 0, 9.70365) \, AU/y
\end{array}
$$

## Step 8: Simulating the orbit
 
There are a couple of ways to do this, but we are going to use [Cowell's method](https://en.wikipedia.org/w/index.php?title=Orbit_modeling&oldid=1345085470#Cowell's_method). This basically sums the acceleration due to gravity for every other object to get the total acceleration.

$$
\vec{a}_i = \sum_{j=1}^{n}Gm_j\frac{\vec{r}_j-\vec{r}_i}{r^3_{ij}}
$$


$$
\begin{align*}
\text{where}\\
& \vec{a}_i \text{ is the acceleration vector of body } i \\
& G \text{ is the gravitational constant} \\
& m_j \text{ is the mass of the other body} \\
& r_i \text{ and } r_j \text{ are the position vectors of the objects } i \text{ and } j \\
& r_{ij} \text{ is the distance from object } i \text{ to object } j
\end{align*}
$$

From here, it is essentially equivalent to our Euler or RK4 implementation above. In Three.js and TSL, accessing the shader uniforms is trivial. You can just treat them like variables in a standard object.

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/tutorial/step-7/project.json" selected="main.js"></code-playground>

And that's everything! We now have our completed black hole scene!

### Full Demo Code

<code-playground project-src="https://goldenneedham.com/demos/GaiaBH1/project.json" selected="demo/main.js" preview-aspect-ratio="1" editor-height="600px"></code-playground>

<br/>
<br/>
<br/>
