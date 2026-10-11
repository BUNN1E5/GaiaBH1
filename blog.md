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

Now that we are setup we can start with just a basic raymarcher.

:::livecode[step-1]

## Step 2 : Gravitational Lensing
