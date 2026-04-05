 'use client';
import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';

interface ImageCarouselProps {
  images: string[]; // Array of image URLs
  speed?: number; // Pixels per second
  direction?: 'left' | 'right'; // Direction of movement
}

export default function ImageCarousel({
  images,
  speed = 120,
  direction = 'left',
}: ImageCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const baseVelocity = direction === 'left' ? -speed : speed;
  const baseX = useMotionValue(0);
  const smoothVelocity = useSpring(0, { damping: 50, stiffness: 400 });
  
  // Duplicate images 4 times for seamless looping (2x before, 2x after)
  const duplicatedImages = [...images, ...images, ...images, ...images];
  
  const CARD_WIDTH = 240; // w-60 = 240px
  const GAP = 8; // gap-2 = 8px
  const ITEM_WIDTH = CARD_WIDTH + GAP;
  const totalWidth = images.length * ITEM_WIDTH;

  // Measure container
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation loop
  useAnimationFrame((t, delta) => {
    if (isHovered) {
      smoothVelocity.set(0);
      return;
    }
    
    const moveBy = (baseVelocity * delta) / 1000;
    let newX = baseX.get() + moveBy;
    
    // Seamless wrap around
    if (direction === 'left' && newX <= -totalWidth) {
      newX += totalWidth;
    } else if (direction === 'right' && newX >= 0) {
      newX -= totalWidth;
    }
    
    baseX.set(newX);
    smoothVelocity.set(baseVelocity);
  });

  // Transform for infinite scroll effect
  const x = useTransform(baseX, (v) => {
    // Keep values in a reasonable range to prevent floating point issues
    return v % (totalWidth * 2);
  });

  return (
    <div 
      ref={containerRef}
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling Container */}
      <motion.div
        className="flex gap-2"
        style={{ x }}
      >
        {duplicatedImages.map((src, index) => (
          <motion.div 
            key={`${src}-${index}`}
            className="relative h-28 w-60 shrink-0 overflow-hidden"
            animate={{
              scale: isHovered ? 0.95 : 1,
              filter: isHovered ? 'brightness(0.9)' : 'brightness(1)',
            }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{
              scale: 1.05,
              zIndex: 20,
              filter: 'brightness(1.1)',
              transition: { duration: 0.3 }
            }}
          > 
            {/* Image container with crop effect */}
            <motion.div
              className="relative w-full h-full"
              animate={{
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <Image
                src={src}
                alt={`Logo ${index % images.length}`}
                fill
                className="object-contain p-4"
                sizes="240px"
                priority={index < images.length * 2}
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
