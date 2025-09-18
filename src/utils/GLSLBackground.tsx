import React, { useRef, useEffect } from 'react';

const FRAGMENT_SHADER = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2  u_resolution;

#define TAU 6.2832

// Replace the WebGL2-only hash with a float-based hash function (compatible w/WebGL1)
float hash(vec2 p) {
  // Simple 2D hash that does not use uint or floatBitsToUint
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 rotate(vec2 p, float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c) * p;
}

float stepLinear(float s, float e, float t) {
  return clamp((t - s) / (e - s), 0.0, 1.0);
}

float stepReverse(float t) {
  return stepLinear(0.0, 0.5, t) - stepLinear(0.5, 1.0, t);
}

float easeInOutExpo(float t, float e) {
    if (t == 0.0 || t == 1.0) {
        return t;
    }
    if ((t *= 2.0) < 1.0) {
        return 0.5 * pow(e, 10.0 * (t - 1.0));
    } else {
        return 0.5 * (-pow(e, -10.0 * (t - 1.0)) + 2.0);
    }
}

float sdTabbedDisc(vec2 p, float r) {
  float sf = 1.0 / min(u_resolution.x, u_resolution.y);
  float a = (atan(p.y, p.x) + TAU * 0.5) / TAU;
  a *= 3.0;
  float b = 3.0 * fract(a);
  float rOuter = 0.15 * r;
  float blend = 0.13;
  float transition =
      smoothstep(1.0 - blend, 1.0 + blend, b) *
      smoothstep(2.0 + blend, 2.0 - blend, b);
  r += rOuter * transition;

  float d = length(p) - r;
  d = abs(d);
  float r2 = 0.0075 / 0.3 * r;
  d = smoothstep(r2 + sf, r2 - sf, d);

  return d;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  float sf = 1.0 / min(u_resolution.x, u_resolution.y);
  vec2 uv = sf * (fragCoord - 0.5 * u_resolution);

  vec3 color = vec3(0.0);
  float t = u_time * 0.1;
  vec3 blue = vec3(0.2, 0.3, 0.9);

  float r = 0.4;
  for (float i = 1.0; i < 5.0; i++) {
    // Using our new float-based hash
    float dir = 2.0 * step(0.5, hash(vec2(i, floor(fract(t) * 6.0)))) - 1.0;
    float spinH = hash(vec2(i, floor(t)));
    float spinStep = hash(vec2(i, spinH)) * 0.75;
    float spinT = fract(t);
    spinT = stepLinear(spinStep, spinStep + 0.25, spinT);
    float spin = TAU * (2.0/3.0) * easeInOutExpo(spinT, 1.0 + 4.0 * spinH);

    vec2 p = rotate(uv, i * TAU/18.0 + TAU * t * dir + spin);
    float d = sdTabbedDisc(p, r);
    color = mix(color, blue, d);

    float zoomT = fract(u_time * 0.25);
    zoomT = stepReverse(zoomT);
    zoomT = stepLinear(0.25, 0.9, zoomT);
    zoomT = easeInOutExpo(zoomT, 2.0);

    r *= 0.45 + 0.3 * zoomT;
    blue = mix(blue, vec3(0.3, 0.7, 0.8), 0.4 * ((1.0 - zoomT) * 0.7 + 0.3));
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function GLSLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try to dynamically import glslCanvas
    const setupGLSL = async () => {
      try {
        const GlslCanvas = await import('glslCanvas');
        const sandbox = new (GlslCanvas.default || GlslCanvas)(canvas);
        sandbox.load(FRAGMENT_SHADER);
      } catch (error) {
        console.log('glslCanvas not available, using fallback');
        // Use a basic WebGL fallback or simple animation
        setupBasicWebGL();
      }
    };

    const setupBasicWebGL = () => {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.log('WebGL not available');
        return;
      }
      
      // Set canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Simple blue background that changes over time
      let time = 0;
      const animate = () => {
        time += 0.01;
        const blue = 0.2 + 0.3 * Math.sin(time);
        gl.clearColor(0.1, 0.2, blue, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        requestAnimationFrame(animate);
      };
      animate();
    };

    setupGLSL();

    return () => {
      // cleanup if needed
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      className="fixed top-0 left-0 w-full h-full"
      style={{ zIndex: -1, pointerEvents: 'none' }}
    />
  );
}
