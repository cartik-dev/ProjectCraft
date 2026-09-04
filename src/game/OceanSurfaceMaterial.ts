import * as THREE from 'three';

const oceanTime = { value: 0 };
let animationStarted = false;

function startAnimation(): void {
  if (animationStarted || typeof window === 'undefined') return;
  animationStarted = true;

  const tick = () => {
    oceanTime.value = performance.now() * 0.001;
    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

/** Continuous non-blocky ocean surface used on top of stored water blocks. */
export function createOceanSurfaceMaterial(): THREE.ShaderMaterial {
  startAnimation();

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: oceanTime },
    vertexShader: `
      precision highp float;
      uniform float uTime;
      attribute mat4 instanceMatrix;
      varying vec3 vWorldPos;

      void main() {
        float worldX = instanceMatrix[3].x + position.x;
        float worldZ = instanceMatrix[3].z + position.y;

        float wave =
          sin(worldX * 0.55 + uTime * 0.9) * 0.035 +
          cos(worldZ * 0.72 - uTime * 0.75) * 0.028 +
          sin((worldX + worldZ) * 0.28 + uTime * 0.55) * 0.018;

        vec3 local = vec3(position.x, wave, position.y);
        vec4 worldPosition = instanceMatrix * vec4(local, 1.0);
        vWorldPos = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      varying vec3 vWorldPos;

      void main() {
        float ripple1 = sin(vWorldPos.x * 2.4 + uTime * 0.9);
        float ripple2 = cos(vWorldPos.z * 2.1 - uTime * 0.8);
        float ripple = ripple1 * 0.5 + ripple2 * 0.5;

        vec3 deep = vec3(0.025, 0.22, 0.52);
        vec3 light = vec3(0.10, 0.48, 0.78);
        vec3 color = mix(deep, light, 0.42 + ripple * 0.16);

        float glint = smoothstep(0.72, 0.96, ripple);
        color += vec3(0.16, 0.26, 0.30) * glint;

        gl_FragColor = vec4(color, 0.72);
      }
    `,
  });
}
