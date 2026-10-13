# Building the GaiaBH1 black hole in a Raymarch Shader

I had originally built this blackhole shader for the [Unlikely Collaborators™ Game Jam](https://itch.io/jam/ucgamejam2026). Theme "consciousness and identity through awe and wonder - make awe playable" I had decided to have the setting of the game be centered around one of the most extreme things in our Universe, a black hole, and not just any black hole, [GaiaBH1](https://en.wikipedia.org/wiki/Gaia_BH1) the nearest black hole to us! 

## Check Out the live demo
[Play Demo](DemoImage.gif)

You might notice that the signature accretion disks are missing, well that is because the black hole we are modelling actually does not have them. So subsequently our shader doesn't need it either. Although it shouldnt be *too* hard to add them after if you want.

I had originally written the shader in the godot shader language but the live web demo and what we will be working on here today was built in three.js shading language or TSL.

## Step 0: Setting Up Three.js

Before we do anything with the blackhole, we need to setup our project. For this we are going to start with a modified version of three's [creating a scene](https://threejs.org/manual/#creating-a-scene) tutorial.

:::livecode[step-0]

I kept the standard mesh box in there so we can make sure that something is properly rendering, we will remove it in the next part.

## Step 1: Basic Raymarching

Now that we have our scene setup we can start with our raymarcher boilerplate. We are gonna start with with an uncolored sphere just to make sure that everything is working.

Our basic raymarcher is composed of 3 different parts. Our main, raymarch, and map functions.

Our main function is our entrypoint into the shader, here we convert the screen position of every pixel on the screen to a world position. To do this, we first convert our screen space UVs into clip space. Our screen space UVs are usually from 0 to 1 so we must convert them to -1 to 1 and for our clip space, we then can set our z to 0 for the near clipping plane, and w to 1 for uniform scaling.

We then project our clip space into view space by multiplying it by the inverse of our projection matrix, and then dividing the xyz terms by our w term. 

Last but not least we then need to translate our 

```glsl
vec4 clipspace = vec4(screen_uv*2, 0, 1);
vec4 ndc = clipspace * inverseProjectionMatrix;
vec3 viewspace = ndc.xyz/ndc.w;
```

:::livecode[step-1]


## Step 2 : Gravitational Lensing
