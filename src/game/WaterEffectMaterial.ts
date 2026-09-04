import * as THREE from 'three';

const waterTime = { value: 0 };
let animationStarted = false;

function startAnimation(): void {
  if (animationStarted || typeof window === 'undefined') return;
  animationStarted = true;

  const tick = () => {
    waterTime.value = performance.now() * 0.001;
    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

/** Animated transparent water material with moving ripples and highlights. */
export function createWaterEffectMaterial(): THREE.ShaderMaterial {
  startAnimation();

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: waterTime },
    vertexShader: `
      precision highp float;
      uniform float uTime;
      attribute mat4 instanceMatrix;
      attribute vec3 normal;
      varying vec3 vWorldPos;

      void main() {
        vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;

        if (normal.y > 0.5) {
          worldPosition.y +=
            sin(worldPosition.x * 1.8 + uTime * 1.7) * 0.035 +
            cos(worldPosition.z * 1.45 - uTime * 1.35) * 0.025;
        }

        gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      varying vec3 vWorldPos;

      void main() {
        float waveA = sin(vWorldPos.x * 2.8 + uTime * 1.6);
        float waveB = cos(vWorldPos.z * 3.2 - uTime * 1.25);
        float waveC = sin((vWorldPos.x + vWorldPos.z) * 1.7 - uTime * 0.9);
        float ripple = waveA * 0.35 + waveB * 0.35 + waveC * 0.30;
        float glint = smoothstep(0.62, 0.92, ripple);

        vec3 deep = vec3(0.015, 0.20, 0.48);
        vec3 surface = vec3(0.04, 0.42, 0.72);
        vec3 color = mix(deep, surface, 0.48 + ripple * 0.14);
        color += vec3(0.22, 0.40, 0.55) * glint;

        gl_FragColor = vec4(color, 0.76);
      }
    `,
  });
}
