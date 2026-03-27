import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ThreeDCard({ children, className = '', onClick }: ThreeDCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only apply 3D effect on devices with a fine pointer (mouse)
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const isMobile = typeof window !== 'undefined' && !window.matchMedia("(pointer: fine)").matches;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateY: isMobile ? 0 : rotateY,
        rotateX: isMobile ? 0 : rotateX,
        transformStyle: isMobile ? "flat" : "preserve-3d",
      }}
      whileHover={!isMobile ? { scale: 1.02 } : {}}
      whileTap={!isMobile ? { scale: 0.98 } : {}}
      className={`relative h-full w-full transition-shadow duration-300 ${className}`}
    >
      <div
        style={{
          transform: !isMobile ? "translateZ(75px)" : "none",
          transformStyle: isMobile ? "flat" : "preserve-3d",
        }}
        className="h-full w-full"
      >
        {children}
      </div>
    </motion.div>
  );
}
