 import { Engine3D } from '@orillusion/core';

async function init() {
  let canvas = document.getElementById('canvas');
  const engine = await Engine3D.init({
    canvasConfig: { canvas }
  });
}

init();