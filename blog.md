# Building the GaiaBH1 black hole in a Raymarch Shader

I had originally built this blackhole shader for the [Unlikely Collaborators™ Game Jam](https://itch.io/jam/ucgamejam2026). Theme "consciousness and identity through awe and wonder - make awe playable" I had decided to have the setting of the game be centered around one of the most extreme things in our Universe, a black hole, and not just any black hole, [GaiaBH1](https://en.wikipedia.org/wiki/Gaia_BH1) the nearest black hole to us! 

## Check Out the live demo
[![Play Demo](DemoImage.gif)](https://goldenneedham.com/demos/GaiaBH1/)

You might notice that the signature accretion disks are missing, well that is because the black hole we are modelling actually does not have them. So subsequently our shader doesn't need it either. Our shader was originally written in the godot shader language but the live web demo and what we will be working on here today was build in Three.JS using TSL. I will still provide equivalent godot versions to the code. 

## Step 1: Basic Raymarching

We need to start with our basic raymarching foundation

## Step 1 : Gravitational Lensing
