import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoadingThreeScene from "../../components/LoadingThreeScene.jsx";

const TITLE = "JB CROWNSTONE";
const CHUNK_OFFSETS = [
  [-6, -5],
  [6, -1],
  [-3, 5],
];

function ChunkedTitle({ show }) {
  return (
    <motion.h1
      className="loading-title text-3xl font-semibold tracking-[0.16em] sm:text-5xl md:text-6xl"
      style={{ fontFamily: "'Playfair Display', serif" }}
      initial={{ opacity: 0 }}
      animate={show ? { opacity: 1 } : {}}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {TITLE.split("").map((char, index) => {
        if (char === " ") {
          return <span key={`space-${index}`} className="loading-title__space" />;
        }

        const direction = index % 2 === 0 ? -1 : 1;
        return (
          <span key={`${char}-${index}`} className="loading-title__cell">
            {CHUNK_OFFSETS.map(([x, y], pieceIndex) => (
              <motion.span
                key={pieceIndex}
                className="loading-title__chunk"
                initial={{
                  x: direction * (150 + pieceIndex * 30),
                  y: (pieceIndex - 1) * 48,
                  rotate: direction * (8 + pieceIndex * 4),
                  opacity: 0,
                  scale: 0.62,
                }}
                animate={show ? {
                  x: [direction * (150 + pieceIndex * 30), x, x],
                  y: [(pieceIndex - 1) * 48, y, y],
                  rotate: [direction * (8 + pieceIndex * 4), 0, 0],
                  opacity: [0, 0.9, 0],
                  scale: [0.62, 1, 0.52],
                } : {}}
                transition={{
                  duration: 1.05,
                  delay: 0.05 + index * 0.03 + pieceIndex * 0.045,
                  ease: [0.16, 1, 0.3, 1],
                  times: [0, 0.76, 1],
                }}
              />
            ))}
            <motion.span
              className="loading-title__letter"
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={show ? { opacity: 1, filter: "blur(0px)" } : {}}
              transition={{
                duration: 0.36,
                delay: 0.48 + index * 0.028,
                ease: "easeOut",
              }}
            >
              {char}
            </motion.span>
          </span>
        );
      })}
    </motion.h1>
  );
}

export default function Loading({ onFinish }) {
  const [showText, setShowText] = useState(false);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowText(true), 700);
    const t2 = setTimeout(() => setExit(true), 2750);
    const t3 = setTimeout(() => onFinish(), 2950);

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
          className="loading-screen fixed inset-0 overflow-hidden bg-[#030303]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.012 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          <LoadingThreeScene mode="loading" />

          <div className="loading-screen__vignette" />
          <div className="loading-screen__center-glow" />

          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={showText ? { opacity: 1 } : {}}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <div className="text-center">
              <motion.p
                className="mb-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-yellow-400/60"
                initial={{ opacity: 0 }}
                animate={showText ? { opacity: 1 } : {}}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              >
                Private Wealth And Investment Management
              </motion.p>
              <ChunkedTitle show={showText} />
              <motion.div
                className="mx-auto mt-6 h-px w-56 overflow-hidden bg-yellow-400/15"
                initial={{ opacity: 0, scaleX: 0.4 }}
                animate={showText ? { opacity: 1, scaleX: 1 } : {}}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              >
                <div className="loading-screen__scanline h-full w-1/3" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
