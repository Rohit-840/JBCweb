import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThreeScene from "../../components/ThreeScene.jsx"; // Adjust path if needed

export default function Loading({ onFinish }) {
  const [showText, setShowText] = useState(false);
  const [exit, setExit] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // mouse tracking
  useEffect(() => {
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // ⏱ Animation timing
  useEffect(() => {
    const t1 = setTimeout(() => setShowText(true), 1000);
    const t2 = setTimeout(() => setExit(true), 4000);
    const t3 = setTimeout(() => onFinish(), 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          className="fixed inset-0 bg-black overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1 }}
        >
          {/* 🌌 3D BACKGROUND */}
          <div
            className="absolute inset-0 z-0"
            style={{
              transform: `translate(${mouse.x * 5}px, ${mouse.y * 5}px)`
            }}
          >
            <ThreeScene mouse={mouse} />
          </div>

          {/* 🔥 PERFECT EDGE FADE */}
          <div className="pointer-events-none absolute inset-0 z-50">
            <div
              className="w-full h-full"
              style={{
                background: `
                  radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.9) 85%),
                  linear-gradient(to top, rgba(0,0,0,0.8), transparent 40%),
                  linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 40%)
                `
              }}
            />
          </div>

          {/* 🧊 GLASS OVERLAY */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-10" />

          {/* 🌫 DEPTH OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 z-20" />

          {/* 💡 GLOW PULSE BEHIND LOGO */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          </div>

          {/* 🖱️ CURSOR TRAIL */}
          <div
            className="pointer-events-none fixed w-10 h-10 rounded-full bg-cyan-400 blur-2xl z-30"
            style={{
              left: `${mouse.x * 200 + window.innerWidth / 2}px`,
              top: `${mouse.y * 200 + window.innerHeight / 2}px`,
              transform: "translate(-50%, -50%)"
            }}
          />

          {/* 📝 TEXT CONTAINER */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20 px-2 sm:px-16 md:px-24 lg:px-32"
            initial={{ opacity: 0 }}
            animate={showText ? { opacity: 1 } : {}}
          >
            <div className="w-full max-w-[90vw] flex justify-center">
              <motion.h1
                // Added py-2 and px-4 here for vertical/horizontal breathing room
                className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl 
                           font-semibold text-transparent bg-clip-text 
                           tracking-[0.12em] text-center px-4 py-2"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  backgroundImage:
                    "linear-gradient(90deg, #d4af37, #f5e6a5, #c9a227, #f5e6a5, #d4af37)",
                  textShadow: "0 0 20px rgba(212,175,55,0.4)"
                }}
                initial={{ opacity: 0, scale: 0.9, letterSpacing: "0.2em" }}
                animate={{ opacity: 1, scale: 1, letterSpacing: "0.12em" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                {/* The non-breaking spaces on both sides fix the clipping while keeping it perfectly centered */}
                &nbsp;JB CROWNSTONE&nbsp;
              </motion.h1>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}