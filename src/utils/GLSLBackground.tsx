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
        console.log('GLSL Canvas loaded successfully');
        
        // Return cleanup function for GLSL
        return () => {
          // glslCanvas cleanup if needed
        };
      } catch (error) {
        console.log('glslCanvas not available, using WebGL fallback');
        // Use a basic WebGL fallback or simple animation
        return setupBasicWebGL();
      }
    };

    const setupBasicWebGL = () => {
      // Try to get WebGL context with specific options to handle software fallback
      const contextOptions = {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'default', // Accept software rendering
        failIfMajorPerformanceCaveat: false // Don't fail on software rendering
      };
      
      let gl = canvas.getContext('webgl2', contextOptions);
      if (!gl) {
        gl = canvas.getContext('webgl', contextOptions);
      }
      if (!gl) {
        gl = canvas.getContext('experimental-webgl', contextOptions);
      }
      
      if (!gl) {
        console.log('WebGL not available, trying canvas fallback');
        setupCanvasFallback();
        return;
      }
      
      console.log('WebGL context obtained:', gl.getParameter(gl.VERSION));
      console.log('WebGL renderer:', gl.getParameter(gl.RENDERER));
      
      // Set up canvas sizing
      const updateSize = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      updateSize();
      
      // Listen for resize events
      const resizeHandler = () => updateSize();
      window.addEventListener('resize', resizeHandler);
      
      // Enhanced animated background with more complex colors
      let time = 0;
      let animationFrame: number;
      
      const animate = () => {
        time += 0.016; // ~60fps timing
        
        // Create flowing color pattern
        const r = 0.1 + 0.4 * Math.sin(time * 0.8) * Math.cos(time * 0.3);
        const g = 0.2 + 0.4 * Math.sin(time * 1.2 + 1.5) * Math.cos(time * 0.7);
        const b = 0.3 + 0.5 * Math.sin(time * 0.9 + 3.0) * Math.cos(time * 0.5);
        
        gl.clearColor(r, g, b, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        animationFrame = requestAnimationFrame(animate);
      };
      
      animate();
      
      // Return cleanup function
      return () => {
        window.removeEventListener('resize', resizeHandler);
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    };

    const setupCanvasFallback = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('Canvas 2D not available either');
        return;
      }
      
      console.log('Using Canvas 2D fallback');
      
      // Set up canvas sizing
      const updateSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      updateSize();
      
      const resizeHandler = () => updateSize();
      window.addEventListener('resize', resizeHandler);
      
      // Animated gradient background
      let time = 0;
      let animationFrame: number;
      
      const animate = () => {
        time += 0.016;
        
        // Create animated radial gradient similar to your original CSS
        const centerX = canvas.width * (0.5 + 0.1 * Math.sin(time * 0.3));
        const centerY = canvas.height * (0.5 + 0.1 * Math.cos(time * 0.4));
        const radius = Math.min(canvas.width, canvas.height) * (0.8 + 0.2 * Math.sin(time * 0.5));
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        
        // Dynamic colors similar to your GLSL shader
        const r1 = Math.floor(60 + 60 * Math.sin(time * 0.7));
        const g1 = Math.floor(100 + 100 * Math.sin(time * 0.9 + 1));
        const b1 = Math.floor(180 + 75 * Math.sin(time * 1.1 + 2));
        
        const r2 = Math.floor(20 + 40 * Math.sin(time * 0.5 + 1));
        const g2 = Math.floor(40 + 60 * Math.sin(time * 0.8 + 2));
        const b2 = Math.floor(80 + 80 * Math.sin(time * 1.2 + 3));
        
        gradient.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, 0.8)`);
        gradient.addColorStop(0.5, `rgba(${Math.floor((r1+r2)/2)}, ${Math.floor((g1+g2)/2)}, ${Math.floor((b1+b2)/2)}, 0.6)`);
        gradient.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, 0.4)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        animationFrame = requestAnimationFrame(animate);
      };
      
      animate();
      
      // Return cleanup function
      return () => {
        window.removeEventListener('resize', resizeHandler);
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    };

    let cleanupFunction: (() => void) | undefined;

    const initializeBackground = async () => {
      cleanupFunction = await setupGLSL();
    };

    initializeBackground();

    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
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
