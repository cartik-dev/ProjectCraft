import * as THREE from 'three';

const waterTime = { value: 0 };
let animationStarted = false;

function startWaterAnimation(): void {
  if (animationStarted || typeof window === 'undefined') return;
  animationStarted = true;

  const tick = () => {
    waterTime.value = performance.now() * 0.001;
    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

/** Animated, lightweight water material for the voxel ocean. */
export function createWaterMaterial(): THREE.ShaderMaterial {
  startWaterAnimation();

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: waterTime },
    vertexShader: `
      precision highp float;
      uniform float uTime;
      attribute mat4 instanceMatrix;
      varying vec3 vWorldPos;
      varying float vSurface;
      varying float vWave;

      void main() {
        vec3 local = position;
        float isTop = step(0.49, position.y);
        vec3 instanceWorld = (instanceMatrix * vec4(position, 1.0)).xyz;

        float waveA = sin(instanceWorld.x * 1.35 + uTime * 1.35);
        float waveB = cos(instanceWorld.z * 1.10 - uTime * 1.05);
        float waveC = sin((instanceWorld.x + instanceWorld.z) * 0.55 + uTime * 0.75);
        float wave = (waveA * 0.045 + waveB * 0.035 + waveC * 0.02) * isTop;
        local.y += wave;

        vWave = wave;
        vSurface = isTop;
        vWorldPos = (instanceMatrix * vec4(local, 1.0)).xyz;

        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(local, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      varying vec3 vWorldPos;
      varying float vSurface;
      varying float vWave;

      void main() {
        float rippleA = sin(vWorldPos.x * 2.8 + uTime * 1.2);
        float rippleB = cos(vWorldPos.z * 3.1 - uTime * 1.0);
        float ripple = (rippleA + rippleB) * 0.5;

        vec3 deep = vec3(0.035, 0.29, 0.62);
        vec3 shallow = vec3(0.10, 0.48, 0.82);
        float light = 0.5 + 0.5 * ripple;
        vec3 color = mix(deep, shallow, clamp(light * 0.8 + vWave * 4.0, 0.0, 1.0));

        if (vSurface > 0.5) {
          float glint = smoothstep(0.72, 0.96, ripple);
          color += vec3(0.12, 0.22, 0.28) * glint;
        } else {
          color *= 0.78;
        }

        gl_FragColor = vec4(color, vSurface > 0.5 ? 0.72 : 0.48);
      }
    `,
  });
}
