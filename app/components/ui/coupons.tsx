"use client";
import { useEffect, useState } from "react";

export default function Coupon() {
  const couponCode = "EARLYBIRDS20";
  const str: string[] = couponCode.split("");

  const offerEndDate = new Date("2026-04-05T23:59:59").getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = offerEndDate - now;

      if (distance <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [offerEndDate]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(couponCode);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <main className="mx-auto w-full bg-black">
      <div className="flex items-center justify-between p-4 text-sm">
        <h1 className="text-[16px] text-white">
          🎉 Claim This At Checkout ! 🎉
        </h1>

        <div className="flex items-center gap-2 text-white">
          <div className="flex flex-col items-center rounded-lg bg-zinc-900 px-3 py-2 min-w-[60px]">
            <span className="text-lg font-bold leading-none">
              {String(timeLeft.days).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
              Days
            </span>
          </div>

          <span className="text-lg font-bold text-zinc-500">:</span>

          <div className="flex flex-col items-center rounded-lg bg-zinc-900 px-3 py-2 min-w-[60px]">
            <span className="text-lg font-bold leading-none">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
              Hours
            </span>
          </div>

          <span className="text-lg font-bold text-zinc-500">:</span>

          <div className="flex flex-col items-center rounded-lg bg-zinc-900 px-3 py-2 min-w-[60px]">
            <span className="text-lg font-bold leading-none">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
              Min
            </span>
          </div>

          <span className="text-lg font-bold text-zinc-500">:</span>

          <div className="flex flex-col items-center rounded-lg bg-zinc-900 px-3 py-2 min-w-[60px]">
            <span className="text-lg font-bold leading-none">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">
              Sec
            </span>
          </div>
        </div>

        <div
          onClick={handleCopy}
          className="group relative cursor-pointer overflow-hidden rounded-full bg-purple-300 px-4 py-2 text-black"
        >
          <div className="flex items-center gap-1 transition duration-200 group-hover:blur-sm">
            {str.map((item, index) => (
              <div className="text-center font-semibold" key={index}>
                {item}
              </div>
            ))}
          </div>

          <div className="absolute inset-0 hidden items-center justify-center text-sm font-semibold group-hover:flex">
            {copied ? "Copied!" : "Click to Copy"}
          </div>
        </div>
      </div>
    </main>
  );
}