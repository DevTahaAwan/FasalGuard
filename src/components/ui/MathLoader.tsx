'use client';

import React, { useEffect, useRef } from 'react';

export const MathLoader: React.FC = () => {
  const groupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const config = {
      name: "Heart Wave",
      tag: "f(x) Heart Wave",
      rotate: false,
      particleCount: 57,
      trailSpan: 0.12,
      durationMs: 12000,
      rotationDurationMs: 22000,
      pulseDurationMs: 6400,
      strokeWidth: 3.6,
      heartWaveB: 6.4,
      heartWaveRoot: 3.3,
      heartWaveAmp: 0.9,
      heartWaveScaleX: 23.2,
      heartWaveScaleY: 24.5,
      point(progress: number, detailScale: number, config: any) {
        const xLimit = Math.sqrt(config.heartWaveRoot);
        const x = -xLimit + progress * xLimit * 2;
        const safeRoot = Math.max(0, config.heartWaveRoot - x * x);
        const b = config.heartWaveB;
        const wave = config.heartWaveAmp * Math.sqrt(safeRoot) * Math.sin(b * Math.PI * x);
        const curve = Math.pow(Math.abs(x), 2 / 3);
        const y = curve + wave;
        const scaleX = config.heartWaveScaleX;
        const scaleY = config.heartWaveScaleY + detailScale * 1.5;

        return {
          x: 50 + x * scaleX,
          y: 18 + (1.75 - y) * scaleY,
        };
      },
    };

    const group = groupRef.current;
    const path = pathRef.current;
    if (!group || !path) return;

    path.setAttribute('stroke-width', String(config.strokeWidth));

    const particles: SVGCircleElement[] = [];
    const SVG_NS = 'http://www.w3.org/2000/svg';
    
    // Create particles
    for (let i = 0; i < config.particleCount; i++) {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('fill', 'currentColor');
      group.appendChild(circle);
      particles.push(circle);
    }

    function normalizeProgress(progress: number) {
      return ((progress % 1) + 1) % 1;
    }

    function getDetailScale(time: number) {
      const pulseProgress = (time % config.pulseDurationMs) / config.pulseDurationMs;
      const pulseAngle = pulseProgress * Math.PI * 2;
      return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
    }

    function getRotation(time: number) {
      if (!config.rotate) return 0;
      return -((time % config.rotationDurationMs) / config.rotationDurationMs) * 360;
    }

    function buildPath(detailScale: number, steps = 480) {
      return Array.from({ length: steps + 1 }, (_, index) => {
        const point = config.point(index / steps, detailScale, config);
        return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      }).join(' ');
    }

    function getParticle(index: number, progress: number, detailScale: number) {
      const tailOffset = index / (config.particleCount - 1);
      const point = config.point(normalizeProgress(progress - tailOffset * config.trailSpan), detailScale, config);
      const fade = Math.pow(1 - tailOffset, 0.56);
      return {
        x: point.x,
        y: point.y,
        radius: 0.9 + fade * 2.7,
        opacity: 0.04 + fade * 0.96,
      };
    }

    let animationFrameId: number;
    const startedAt = performance.now();

    function render(now: number) {
      const time = now - startedAt;
      const progress = (time % config.durationMs) / config.durationMs;
      const detailScale = getDetailScale(time);
      
      group!.setAttribute('transform', `rotate(${getRotation(time)} 50 50)`);
      path!.setAttribute('d', buildPath(detailScale));
      
      particles.forEach((node, index) => {
        const particle = getParticle(index, progress, detailScale);
        node.setAttribute('cx', particle.x.toFixed(2));
        node.setAttribute('cy', particle.y.toFixed(2));
        node.setAttribute('r', particle.radius.toFixed(2));
        node.setAttribute('opacity', particle.opacity.toFixed(3));
      });
      
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      particles.forEach(p => group.removeChild(p));
    };
  }, []);

  return (
    <div className="w-full max-w-[320px] aspect-square flex items-center justify-center text-white">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        className="w-full h-full overflow-visible"
      >
        <g ref={groupRef} id="group">
          <path
            ref={pathRef}
            id="path"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.1"
          />
        </g>
      </svg>
    </div>
  );
};
