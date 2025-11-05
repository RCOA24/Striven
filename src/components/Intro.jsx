import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Footprints, Zap } from 'lucide-react';

const Intro = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 600),
      setTimeout(() => setStage(2), 1600),
      setTimeout(() => setStage(3), 2400),
      setTimeout(() => setStage(4), 3200),
      setTimeout(() => setStage(5), 4000),
      setTimeout(() => onComplete?.(), 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden min-h-screen bg-black flex flex-col">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-[#39ff14]/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-[#ff2e63]/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-conic from-[#39ff14]/10 via-[#ff2e63]/5 to-[#39ff14]/10 rounded-full blur-3xl"
        />
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@700&family=Satoshi:wght@500;700&display=swap');

        .font-display { font-family: 'Clash Display', sans-serif; }
        .font-body { font-family: 'Satoshi', sans-serif; }

        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
        .bg-gradient-conic {
          background: conic-gradient(from 0deg, var(--tw-gradient-stops));
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .float { animation: float 6s ease-in-out infinite; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center">

          {/* === STAGE 0–1: 3D REALISTIC LOGO === */}
          <AnimatePresence>
            {stage >= 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-10"
              >
                {/* Outer soft glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-radial from-[#39ff14]/30 via-transparent to-transparent blur-3xl animate-pulse-slow" />

                {/* Logo Card */}
                <div className="relative p-1">
                  {/* Back-light halo */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#39ff14]/40 to-[#ff2e63]/40 blur-2xl opacity-60" />

                  {/* Glass Card */}
                  <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl overflow-hidden">
                    {/* Grain texture */}
                    <div
                      className="absolute inset-0 opacity-5 pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                      }}
                    />

                    {/* Top-left highlight */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                    {/* Icon with heartbeat */}
                    <motion.div
                      animate={stage >= 1 ? { scale: [1, 1.07, 1] } : {}}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10 flex justify-center items-center"
                    >
                      <Activity className="w-24 h-24 text-white drop-shadow-lg" strokeWidth={2.8} />
                    </motion.div>

                    {/* Inner shadow ring */}
                    <div className="absolute inset-2 rounded-2xl shadow-inner shadow-black/30 pointer-events-none" />
                  </div>
                </div>

                {/* Floating Micro-Icons */}
                <AnimatePresence>
                  {stage >= 2 && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 30, rotate: -30 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="absolute -top-6 -left-8"
                      >
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-lg">
                          <Footprints className="w-6 h-6 text-[#39ff14] drop-shadow" />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: -30, rotate: 30 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="absolute -bottom-8 -right-10"
                      >
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-lg">
                          <Zap className="w-6 h-6 text-[#ff2e63] drop-shadow" />
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === STAGE 2: APP NAME === */}
          <AnimatePresence>
            {stage >= 2 && (
              <motion.h1
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="text-7xl md:text-8xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#39ff14] via-white to-[#ff2e63] leading-tight"
                style={{
                  backgroundSize: '200%',
                  animation: 'gradient 4s ease infinite',
                }}
              >
                Striven
              </motion.h1>
            )}
          </AnimatePresence>

          {/* === STAGE 3: TAGLINE === */}
          <AnimatePresence>
            {stage >= 3 && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mt-4 text-xl md:text-2xl text-white/60 font-body tracking-wider"
              >
                Train. Track. Transcend.
              </motion.p>
            )}
          </AnimatePresence>

          {/* === STAGE 4: FINAL PULSE + LOADER === */}
          <AnimatePresence>
            {stage >= 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-16 flex space-x-4"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: i === 1 ? '#ff2e63' : '#39ff14',
                    }}
                    animate={{
                      y: [0, -12, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default Intro;