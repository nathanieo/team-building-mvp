import { useLayoutEffect, useRef } from "react";
import type { ReactElement } from "react";

interface Dot {
  /** Position as a fraction of the screen, so resizing keeps the layout. */
  x: number;
  y: number;
  /** Drift speed in pixels per second. */
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

/** Dots closer than this (in pixels) get a line between them, fading with distance. */
const LINK_DISTANCE = 120;
const LINE_ALPHA = 0.2;
/** One dot per this many square pixels, kept between the two limits below. */
const AREA_PER_DOT = 18_000;
const MIN_DOTS = 26;
const MAX_DOTS = 90;

/**
 * Kept outside the component so the dots stay where they are when the page
 * changes; with the canvas's shared view-transition-name the background then
 * looks continuous across pages.
 */
let sharedDots: Dot[] = [];

function makeDot(): Dot {
  const angle = Math.random() * Math.PI * 2;
  const speed = 4 + Math.random() * 9;
  const roll = Math.random();
  return {
    x: Math.random(),
    y: Math.random(),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 1.2 + Math.random() * 1.6,
    color:
      roll < 0.08
        ? "rgba(242, 196, 120, 0.7)" // a few warm amber dots
        : roll < 0.3
          ? "rgba(190, 236, 220, 0.75)" // some mint
          : "rgba(255, 255, 255, 0.55)",
  };
}

/**
 * Faint, slowly drifting dots that link up into little clusters when they pass
 * close together, like people forming teams. Purely decorative; it sits behind
 * the page content and stays still for people who prefer reduced motion.
 */
export function TeamDots(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // A layout effect draws the first frame before the browser paints, so the
  // page transition's snapshot already has the dots in place.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let last = performance.now();

    function resize(): void {
      if (!canvas || !context) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const target = Math.round(Math.min(MAX_DOTS, Math.max(MIN_DOTS, (width * height) / AREA_PER_DOT)));
      while (sharedDots.length < target) sharedDots.push(makeDot());
      if (sharedDots.length > target) sharedDots = sharedDots.slice(0, target);
    }

    function draw(): void {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      const points = sharedDots.map((dot) => ({ x: dot.x * width, y: dot.y * height }));

      context.lineWidth = 1;
      for (let first = 0; first < points.length; first += 1) {
        for (let second = first + 1; second < points.length; second += 1) {
          const a = points[first];
          const b = points[second];
          if (!a || !b) continue;
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance >= LINK_DISTANCE) continue;
          context.strokeStyle = `rgba(255, 255, 255, ${(1 - distance / LINK_DISTANCE) * LINE_ALPHA})`;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }

      sharedDots.forEach((dot, index) => {
        const point = points[index];
        if (!point) return;
        context.fillStyle = dot.color;
        context.beginPath();
        context.arc(point.x, point.y, dot.radius, 0, Math.PI * 2);
        context.fill();
      });
    }

    function tick(now: number): void {
      // Cap the step so a background tab coming back doesn't make dots jump.
      const seconds = Math.min(now - last, 50) / 1000;
      last = now;
      for (const dot of sharedDots) {
        dot.x += (dot.vx * seconds) / width;
        dot.y += (dot.vy * seconds) / height;
        // Wrap around just off-screen so dots drift back in from the other side.
        if (dot.x < -0.05) dot.x = 1.05;
        if (dot.x > 1.05) dot.x = -0.05;
        if (dot.y < -0.05) dot.y = 1.05;
        if (dot.y > 1.05) dot.y = -0.05;
      }
      draw();
      frame = window.requestAnimationFrame(tick);
    }

    function handleResize(): void {
      resize();
      draw();
    }

    resize();
    draw();
    window.addEventListener("resize", handleResize);
    if (!reduceMotion) frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="team-dots" aria-hidden="true" />;
}
