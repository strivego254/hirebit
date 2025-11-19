'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * Animated Shader Background Component
 * 
 * A high-performance animated shader background using Three.js WebGL.
 * Features:
 * - Optimized rendering with proper cleanup
 * - Responsive to window resize
 * - Reduced motion support for accessibility
 * - Performance monitoring
 * 
 * @component
 */
const AnimatedShaderBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef<boolean>(false)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleReducedMotionChange)

    const container = containerRef.current
    if (!container) return

    // Initialize Three.js scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    cameraRef.current = camera

    // Get container dimensions
    const getContainerSize = () => {
      const rect = container.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }

    const initialSize = getContainerSize()

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      // Optimize for continuous rendering
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio for performance
    renderer.setSize(initialSize.width, initialSize.height)
    // Ensure continuous rendering
    renderer.setAnimationLoop(null) // Use manual animation loop for better control
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.pointerEvents = 'none'
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(initialSize.width, initialSize.height) }
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float iTime;
        uniform vec2 iResolution;

        #define NUM_OCTAVES 3

        float rand(vec2 n) {
          return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 u = fract(p);
          u = u*u*(3.0-2.0*u);

          float res = mix(
            mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
            mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
          return res * res;
        }

        float fbm(vec2 x) {
          float v = 0.0;
          float a = 0.3;
          vec2 shift = vec2(100);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < NUM_OCTAVES; ++i) {
            v += a * noise(x);
            x = rot * x * 2.0 + shift;
            a *= 0.4;
          }
          return v;
        }

        void main() {
          vec2 shake = vec2(sin(iTime * 1.2) * 0.005, cos(iTime * 2.1) * 0.005);
          vec2 p = ((gl_FragCoord.xy + shake * iResolution.xy) - iResolution.xy * 0.5) / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
          vec2 v;
          vec4 o = vec4(0.0);

          float f = 2.0 + fbm(p + vec2(iTime * 5.0, 0.0)) * 0.5;

          for (float i = 0.0; i < 35.0; i++) {
            v = p + cos(i * i + (iTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0)) * 3.5 + vec2(sin(iTime * 3.0 + i) * 0.003, cos(iTime * 3.5 - i) * 0.003);
            float tailNoise = fbm(v + vec2(iTime * 0.5, i)) * 0.3 * (1.0 - (i / 35.0));
            vec4 auroraColors = vec4(
              0.1 + 0.3 * sin(i * 0.2 + iTime * 0.4),
              0.3 + 0.5 * cos(i * 0.3 + iTime * 0.5),
              0.7 + 0.3 * sin(i * 0.4 + iTime * 0.3),
              1.0
            );
            vec4 currentContribution = auroraColors * exp(sin(i * i + iTime * 0.8)) / length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)));
            float thinnessFactor = smoothstep(0.0, 1.0, i / 35.0) * 0.6;
            o += currentContribution * (1.0 + tailNoise * 0.8) * thinnessFactor;
          }

          o = tanh(pow(o / 100.0, vec4(1.6)));
          gl_FragColor = o * 1.5;
        }
      `
    })

    materialRef.current = material

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Animation loop - optimized for smooth continuous animation
    let lastTime = performance.now()
    let accumulatedTime = 0
    const targetFPS = 60
    const frameTime = 1 / targetFPS
    
    const animate = () => {
      const currentTime = performance.now()
      const deltaTime = (currentTime - lastTime) / 1000 // Convert to seconds
      lastTime = currentTime

      // Respect reduced motion preference
      if (!isReducedMotion) {
        // Use fixed timestep for smooth animation
        accumulatedTime += Math.min(deltaTime, 0.033) // Cap at 30fps minimum
        
        // Update time uniformly for smooth continuous animation
        while (accumulatedTime >= frameTime) {
          material.uniforms.iTime.value += frameTime
          accumulatedTime -= frameTime
        }
      }
      
      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    // Start animation immediately
    isAnimatingRef.current = true
    animationFrameRef.current = requestAnimationFrame(animate)

    // Handle container resize
    const handleResize = () => {
      const size = getContainerSize()
      
      renderer.setSize(size.width, size.height)
      material.uniforms.iResolution.value.set(size.width, size.height)
    }

    // Throttled resize handler
    let resizeTimeout: NodeJS.Timeout
    const throttledResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(handleResize, 100)
    }

    // Use ResizeObserver for better performance on container resize
    const resizeObserver = new ResizeObserver(() => {
      throttledResize()
    })
    
    resizeObserver.observe(container)
    window.addEventListener('resize', throttledResize, { passive: true })

    // Cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleReducedMotionChange)
      
      isAnimatingRef.current = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      
      resizeObserver.disconnect()
      window.removeEventListener('resize', throttledResize)
      
      if (container && renderer.domElement) {
        try {
          container.removeChild(renderer.domElement)
        } catch (e) {
          // Element may already be removed
        }
      }
      
      // Dispose of Three.js resources
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [isReducedMotion])

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[520px] md:h-[560px] lg:h-[640px] overflow-hidden bg-black"
      aria-hidden="true"
    >
      <div className="relative z-10 divider" />
    </div>
  )
}

export default AnimatedShaderBackground

