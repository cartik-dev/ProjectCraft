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

/** Animated water material with a clean top surface and air-facing spill edges. */
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
      attribute vec3 instanceColor;
      varying vec3 vWorldPos;
      varying vec3 vLocalNormal;
      varying vec3 vMask;

      void main() {
        vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vLocalNormal = normal;
        vMask = instanceColor;

        // Gentle surface motion. Side faces remain vertical so the shoreline keeps its block shape.
        if (normal.y > 0.5) {
          worldPosition.y +=
            sin(worldPosition.x * 1.8 + uTime * 1.7) * 0.045 +
            cos(worldPosition.z * 1.45 - uTime * 1.35) * 0.032 +
            sin((worldPosition.x + worldPosition.z) * 0.8 + uTime * 0.8) * 0.018;
        }

        gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec3 vLocalNormal;
      varying vec3 vMask;

      float getBit(float packed, float bit) {
        float value = floor(packed * 4.0 + 0.5);
        return step(0.5, mod(floor(value / pow(2.0, bit)), 2.0));
      }

      void main() {
        // Packed face visibility: X = +/-X, Y = +/-Z, Z = top/bottom.
        float plusX = getBit(vMask.x, 0.0);
        float minusX = getBit(vMask.x, 1.0);
        float plusZ = getBit(vMask.y, 0.0);
        float minusZ = getBit(vMask.y, 1.0);
        float top = getBit(vMask.z, 0.0);
        float bottom = getBit(vMask.z, 1.0);

        if (vLocalNormal.y > 0.5 && top < 0.5) discard;
        if (vLocalNormal.y < -0.5 || bottom > 0.5) discard;
        if (vLocalNormal.x > 0.5 && plusX < 0.5) discard;
        if (vLocalNormal.x < -0.5 && minusX < 0.5) discard;
        if (vLocalNormal.z > 0.5 && plusZ < 0.5) discard;
        if (vLocalNormal.z < -0.5 && minusZ < 0.5) discard;

        float waveA = sin(vWorldPos.x * 2.8 + uTime * 1.6);
        float waveB = cos(vWorldPos.z * 3.2 - uTime * 1.25);
        float waveC = sin((vWorldPos.x + vWorldPos.z) * 1.7 - uTime * 0.9);
        float ripple = waveA * 0.35 + waveB * 0.35 + waveC * 0.30;
        float glint = smoothstep(0.62, 0.92, ripple);

        vec3 deep = vec3(0.015, 0.20, 0.48);
        vec3 surface = vec3(0.04, 0.42, 0.72);
        vec3 color = mix(deep, surface, 0.48 + ripple * 0.14);
        color += vec3(0.22, 0.40, 0.55) * glint;

        float alpha = 0.76;
        if (vLocalNormal.y < 0.5) {
          // Air-facing sides fade slightly toward the bottom, giving a soft spill/shoreline impression.
          float verticalFade = smoothstep(-0.50, 0.50, vWorldPos.y - floor(vWorldPos.y));
          alpha *= 0.64 + verticalFade * 0.20;
        }

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}
