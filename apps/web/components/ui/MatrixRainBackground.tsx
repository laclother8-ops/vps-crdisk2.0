'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MatrixRainBackgroundProps {
  opacity?: number;
  interactive?: boolean;
  className?: string;
  enable3dParallax?: boolean;
}

interface DropColumn {
  x: number;
  y: number;
  speed: number;
  layer: 'foreground' | 'midground' | 'background';
  fontSize: number;
  chars: string[];
  lastMutation: number;
  mutationSpeed: number;
  length: number;
}

export default function MatrixRainBackground({
  opacity = 0.45,
  interactive = true,
  className = '',
  enable3dParallax = true
}: MatrixRainBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  });

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Authentic Matrix glyph set (Katakana, Latin, Numbers, Symbols)
    const matrixChars =
      'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ1234567890ABCDEFXYZ@#$%&*+-=<>{}[]|^~';

    const getChar = () => matrixChars[Math.floor(Math.random() * matrixChars.length)];

    // Initialize 3D Depth Columns (Multi-layer field)
    let columns: DropColumn[] = [];

    const initColumns = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = [];

      // Density calculation
      const baseSpacing = 16;
      const colCount = Math.floor(width / baseSpacing);

      for (let i = 0; i < colCount; i++) {
        // Distribute layers: 15% Foreground, 50% Midground, 35% Background
        const rand = Math.random();
        let layer: 'foreground' | 'midground' | 'background' = 'midground';
        let fontSize = 14;
        let speed = 1.4;

        if (rand < 0.18) {
          layer = 'foreground';
          fontSize = 17 + Math.random() * 3;
          speed = 2.4 + Math.random() * 1.6;
        } else if (rand > 0.65) {
          layer = 'background';
          fontSize = 10 + Math.random() * 2;
          speed = 0.7 + Math.random() * 0.6;
        } else {
          layer = 'midground';
          fontSize = 13 + Math.random() * 2;
          speed = 1.2 + Math.random() * 0.9;
        }

        const length = Math.floor(12 + Math.random() * 24);
        const chars: string[] = [];
        for (let j = 0; j < length; j++) {
          chars.push(getChar());
        }

        columns.push({
          x: i * baseSpacing + (Math.random() * 4 - 2),
          y: Math.random() * -height * 1.5,
          speed,
          layer,
          fontSize,
          chars,
          lastMutation: 0,
          mutationSpeed: 50 + Math.random() * 100,
          length
        });
      }
    };

    initColumns();

    const handleResize = () => {
      initColumns();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const { innerWidth, innerHeight } = window;
      mousePos.current.targetX = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      mousePos.current.targetY = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1
    };

    window.addEventListener('resize', handleResize);
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth mouse interpolation for 3D depth parallax
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      // Trail fade with deep dark hue matching theme (#070908)
      ctx.fillStyle = 'rgba(7, 9, 8, 0.18)';
      ctx.fillRect(0, 0, width, height);

      // Render columns sorted by layer for true 3D visual hierarchy (Background -> Midground -> Foreground)
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];

        // Parallax horizontal & vertical displacement based on depth layer
        let parallaxOffset = 0;
        let layerGlow = 0;
        let headColor = '#E2FFDF';
        let bodyColor = '#57EF40';
        let tailColor = '#185820';

        if (col.layer === 'foreground') {
          parallaxOffset = mousePos.current.x * 24;
          layerGlow = 8;
          headColor = '#FFFFFF';
          bodyColor = '#65FF4D';
          tailColor = '#248A30';
        } else if (col.layer === 'midground') {
          parallaxOffset = mousePos.current.x * 12;
          layerGlow = 3;
          headColor = '#E2FFDF';
          bodyColor = '#57EF40';
          tailColor = '#12481B';
        } else {
          // Background depth
          parallaxOffset = mousePos.current.x * 4;
          layerGlow = 0;
          headColor = '#9EEA92';
          bodyColor = '#2B7A33';
          tailColor = '#0B2610';
        }

        ctx.font = `bold ${col.fontSize}px "JetBrains Mono", "Courier New", monospace`;

        // Periodic glyph mutation for authentic Matrix flicker
        if (time - col.lastMutation > col.mutationSpeed) {
          const randomIndex = Math.floor(Math.random() * col.chars.length);
          col.chars[randomIndex] = getChar();
          col.lastMutation = time;
        }

        // Draw character column stream
        for (let j = 0; j < col.chars.length; j++) {
          const charY = col.y - j * col.fontSize * 1.15;
          const charX = col.x + parallaxOffset;

          if (charY < -col.fontSize || charY > height + col.fontSize) continue;

          // Head character (brightest / white glow)
          if (j === 0) {
            ctx.shadowColor = '#57EF40';
            ctx.shadowBlur = layerGlow + 4;
            ctx.fillStyle = headColor;
          } else if (j < 3) {
            // High intensity body
            ctx.shadowColor = '#57EF40';
            ctx.shadowBlur = layerGlow;
            ctx.fillStyle = bodyColor;
          } else {
            // Fading tail
            ctx.shadowBlur = 0;
            const fade = 1 - j / col.chars.length;
            ctx.fillStyle = j % 2 === 0 ? bodyColor : tailColor;
            ctx.globalAlpha = Math.max(fade * 0.85, 0.15);
          }

          ctx.fillText(col.chars[j], charX, charY);
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
        }

        // Move drop down
        col.y += col.speed * 60 * delta;

        // Reset drop to top with randomized delay once off-screen
        if (col.y - col.length * col.fontSize * 1.15 > height) {
          col.y = -Math.random() * 120 - 20;
          col.speed =
            col.layer === 'foreground'
              ? 2.4 + Math.random() * 1.6
              : col.layer === 'background'
              ? 0.7 + Math.random() * 0.6
              : 1.2 + Math.random() * 0.9;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-1000 ${
        mounted ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        perspective: enable3dParallax ? '1200px' : 'none'
      }}
    >
      {/* 3D Canvas Layer with Subtle Spatial Tilt */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{
          opacity,
          transform: enable3dParallax ? 'scale(1.05) translateZ(0)' : 'none',
          willChange: 'transform, opacity'
        }}
      />

      {/* Layered Optical Vignette & Gradients for Crystal-Clear Text Readability (Visual Hierarchy) */}
      {/* 1. Deep radial center vignette to soft-focus hero and main interactive cards */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#070908]/60 to-[#070908] pointer-events-none" />

      {/* 2. Top-to-bottom atmospheric linear gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070908]/90 via-transparent to-[#070908] pointer-events-none" />

      {/* 3. Subtle Matrix Neo-Green Top Horizon Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[400px] bg-radial-gradient from-[#57EF40]/15 via-[#57EF40]/5 to-transparent blur-3xl pointer-events-none" />
    </div>
  );
}
