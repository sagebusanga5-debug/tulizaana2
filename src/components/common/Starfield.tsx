import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
}

interface StarfieldProps {
  className?: string;
  numStars?: number;
  speed?: number;
  mouseInfluence?: number;
}

export const Starfield: React.FC<StarfieldProps> = ({
  className = '',
  numStars = 200,
  speed = 0.0005,
  mouseInfluence = 0.05,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars
    starsRef.current = [];
    for (let i = 0; i < numStars; i++) {
      starsRef.current.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        z: Math.random() * 1000,
        px: 0,
        py: 0,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = {
        x: (e.clientX - window.innerWidth / 2) * mouseInfluence,
        y: (e.clientY - window.innerHeight / 2) * mouseInfluence,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      if (!canvas || !ctx) return;

      // Smooth mouse movement
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.05;

      ctx.fillStyle = 'rgba(8, 13, 20, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      starsRef.current.forEach((star) => {
        // Move star towards viewer
        star.z -= speed * 1000;

        // If star passes the screen, reset it
        if (star.z <= 0) {
          star.z = 1000;
          star.x = Math.random() * 2000 - 1000;
          star.y = Math.random() * 2000 - 1000;
        }

        // Apply mouse parallax
        const mouseOffsetX = mouseRef.current.x * (1000 - star.z) * 0.0001;
        const mouseOffsetY = mouseRef.current.y * (1000 - star.z) * 0.0001;

        // Project 3D coordinates to 2D
        const scale = 300 / star.z;
        star.px = (star.x + mouseOffsetX) * scale + centerX;
        star.py = (star.y + mouseOffsetY) * scale + centerY;

        // Calculate size based on distance
        const size = (1 - star.z / 1000) * 2;

        // Calculate opacity
        const opacity = (1 - star.z / 1000);

        if (star.px >= 0 && star.px <= canvas.width && star.py >= 0 && star.py <= canvas.height) {
          ctx.beginPath();
          ctx.arc(star.px, star.py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(165, 243, 252, ${opacity * 0.8})`;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [numStars, speed, mouseInfluence]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
};

export default Starfield;
