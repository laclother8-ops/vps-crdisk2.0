'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MatrixRainBackgroundProps {
  opacity?: number;
  interactive?: boolean;
  className?: string;
  enable3dParallax?: boolean;
}

interface DropStream {
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
  opacity = 0.85,
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
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = 1;

    // Matrix characters: Katakana, Numbers, Latin and Tech Symbols
    const matrixChars =
      'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ1234567890ABCDEF01010101XYZ<>/[]{}#*+=_~|:;!?';

    const getRandomChar = () => matrixChars[Math.floor(Math.random() * matrixChars.length)];

    let streams: DropStream[] = [];

    const initStreams = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      streams = [];

      const colSpacing = 20;
      const totalColumns = Math.ceil(width / colSpacing);

      for (let i = 0; i < totalColumns; i++) {
        const rand = Math.random();
        let layer: 'foreground' | 'midground' | 'background' = 'midground';
        let fontSize = 16;
        let speed = 2.2;

        if (rand < 0.25) {
          // Foreground: Closer, bigger, high brightness and speed
          layer = 'foreground';
          fontSize = 19 + Math.random() * 4;
          speed = 3.5 + Math.random() * 2.5;
        } else if (rand > 0.68) {
          // Background: Distant depth, smaller, darker green
          layer = 'background';
          fontSize = 12 + Math.random() * 2;
          speed = 1.2 + Math.random() * 0.8;
        } else {
          // Midground: Core vibrant green
          layer = 'midground';
          fontSize = 15 + Math.random() * 2;
          speed = 2.0 + Math.random() * 1.4;
        }

        const length = Math.floor(15 + Math.random() * 28);
        const chars: string[] = [];
        for (let j = 0; j < length; j++) {
          chars.push(getRandomChar());
        }

        streams.push({
          x: i * colSpacing + (Math.random() * 6 - 3),
          y: Math.random() * -height * 1.5,
          speed,
          layer,
          fontSize,
          chars,
          lastMutation: 0,
          mutationSpeed: 40 + Math.random() * 80,
          length
        });
      }
    };

    initStreams();

    const handleResize = () => {
      initStreams();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const { innerWidth, innerHeight } = window;
      mousePos.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mousePos.current.targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactive || !e.touches[0]) return;
      const touch = e.touches[0];
      const { innerWidth, innerHeight } = window;
      mousePos.current.targetX = (touch.clientX / innerWidth - 0.5) * 2;
      mousePos.current.targetY = (touch.clientY / innerHeight - 0.5) * 2;
    };

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Parallax mouse damping
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.06;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.06;

      // Clear with soft alpha fade to create smooth trailing motion
      ctx.fillStyle = 'rgba(7, 9, 8, 0.14)';
      ctx.fillRect(0, 0, width, height);

      // Render Matrix Streams with 3D Depth
      for (let i = 0; i < streams.length; i++) {
        const stream = streams[i];

        let parallaxShift = 0;
        let glowSize = 0;
        let headColor = '#FFFFFF';
        let bodyColor = '#57EF40';
        let tailColor = '#185820';

        if (stream.layer === 'foreground') {
          parallaxShift = mousePos.current.x * 28;
          glowSize = 10;
          headColor = '#FFFFFF';
          bodyColor = '#65FF4D';
          tailColor = '#248A30';
        } else if (stream.layer === 'midground') {
          parallaxShift = mousePos.current.x * 14;
          glowSize = 5;
          headColor = '#E2FFDF';
          bodyColor = '#57EF40';
          tailColor = '#166023';
        } else {
          parallaxShift = mousePos.current.x * 6;
          glowSize = 1;
          headColor = '#B0FFAB';
          bodyColor = '#3FAF32';
          tailColor = '#0F3815';
        }

        ctx.font = `bold ${Math.round(stream.fontSize)}px "JetBrains Mono", Consolas, "Courier New", monospace`;

        // Character mutation
        if (time - stream.lastMutation > stream.mutationSpeed) {
          const randIdx = Math.floor(Math.random() * stream.chars.length);
          stream.chars[randIdx] = getRandomChar();
          stream.lastMutation = time;
        }

        // Render each character in stream
        for (let j = 0; j < stream.chars.length; j++) {
          const charY = stream.y - j * (stream.fontSize * 1.15);
          const charX = stream.x + parallaxShift;

          if (charY < -stream.fontSize || charY > height + stream.fontSize) continue;

          // Head of the stream (Ultra bright white/cyan glow)
          if (j === 0) {
            ctx.shadowColor = '#57EF40';
            ctx.shadowBlur = glowSize + 8;
            ctx.fillStyle = headColor;
            ctx.globalAlpha = 1.0;
          } else if (j < 3) {
            // High luminescence body
            ctx.shadowColor = '#57EF40';
            ctx.shadowBlur = glowSize;
            ctx.fillStyle = bodyColor;
            ctx.globalAlpha = 0.95;
          } else {
            // Smooth gradient tail
            ctx.shadowBlur = 0;
            const progress = 1 - j / stream.chars.length;
            ctx.fillStyle = j % 2 === 0 ? bodyColor : tailColor;
            ctx.globalAlpha = Math.max(progress * 0.9, 0.18);
          }

          ctx.fillText(stream.chars[j], charX, charY);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
        }

        // Advance stream downwards
        stream.y += stream.speed * 60 * delta;

        // Reset stream when fully past bottom of screen
        if (stream.y - stream.length * (stream.fontSize * 1.15) > height) {
          stream.y = -Math.random() * 100 - 20;
          stream.speed =
            stream.layer === 'foreground'
              ? 3.5 + Math.random() * 2.5
              : stream.layer === 'background'
              ? 1.2 + Math.random() * 0.8
              : 2.0 + Math.random() * 1.4;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700 ${
        mounted ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {/* 3D Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{
          opacity,
          transform: enable3dParallax ? 'scale(1.04)' : 'none',
          willChange: 'transform, opacity'
        }}
      />

      {/* Atmospheric Top Green Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[350px] bg-radial-gradient from-[#57EF40]/15 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Soft Vignette Mask to maintain executive readability */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#070908]/30 to-[#070908]/85 pointer-events-none" />
    </div>
  );
}
