'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

type LoaderProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  showText?: boolean;
};

const DEFAULT_TITLE = 'Loading UniPrep';
const DEFAULT_SUBTITLE = 'Setting up your next step with a little sunshine.';

export default function Loader({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  className,
  compact = false,
  showText = true,
}: LoaderProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!shellRef.current) return;

    gsap.fromTo(
      shellRef.current,
      {
        opacity: 0,
        scale: 0.92,
        y: 16,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
      }
    );
  }, []);

  return (
    <div
      className={[
        'inline-flex items-center justify-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <motion.div
        ref={shellRef}
        className={[
          'flex flex-col items-center text-center rounded-[2.4rem]',
          compact
            ? 'w-auto p-0 shadow-none'
            : 'w-full max-w-[19rem] gap-4 px-7 py-6 shadow-[0_18px_45px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]',
          'bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,237,0.98)),radial-gradient(circle_at_top,rgba(254,243,199,0.7),transparent_60%)]',
        ].join(' ')}
        role="status"
        aria-live="polite"
        aria-busy="true"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div
          className={[
            'inline-flex items-center rounded-full',
            compact
              ? 'gap-2 p-0 shadow-none'
              : 'gap-3 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_28px_rgba(251,146,60,0.16)]',
            'bg-[linear-gradient(180deg,rgba(255,247,237,0.96),rgba(255,237,213,0.92))]',
          ].join(' ')}
          aria-hidden="true"
        >
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className={[
                'rounded-full bg-[linear-gradient(180deg,#fbbf24,#fb923c)]',
                compact
                  ? 'h-2 w-2 shadow-none'
                  : 'h-4 w-4 shadow-[0_0_0_0.2rem_rgba(255,237,213,0.85)]',
              ].join(' ')}
              animate={{
                y: [0, -8, 0],
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: dot * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {showText ? (
          <div className="flex flex-col gap-1.5">
            <p className="m-0 text-base font-bold tracking-[0.01em] text-[#7c2d12]">
              {title}
            </p>
            <p className="m-0 text-[0.92rem] leading-6 text-[#9a3412]">
              {subtitle}
            </p>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
