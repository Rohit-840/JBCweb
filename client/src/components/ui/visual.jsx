import { createElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { pageTransition, pageVariants } from "./motion.js";

export function AnimatedPage({ children, className = "", ...props }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reducedMotion ? undefined : pageVariants}
      initial={reducedMotion ? false : "initial"}
      animate="animate"
      exit={reducedMotion ? undefined : "exit"}
      transition={pageTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function GlassPanel({ children, className = "", interactive = false, as = motion.div, ...props }) {
  const reducedMotion = useReducedMotion();
  const panelProps = {
    className: `ui-glass-panel ${interactive ? "ui-glass-panel--interactive" : ""} ${className}`,
    ...props,
  };
  const motionProps = interactive && !reducedMotion
    ? {
        whileHover: { y: -2, scale: 1.006 },
        whileTap: { scale: 0.992 },
        transition: { type: "spring", stiffness: 380, damping: 28 },
      }
    : {};

  return createElement(as, { ...motionProps, ...panelProps }, children);
}

export function MotionButton({ children, className = "", variant = "gold", ...props }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      className={`ui-motion-button ui-motion-button--${variant} ${className}`}
      whileHover={reducedMotion ? undefined : { y: -1 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function LiveBadge({ active, label, sublabel = "", className = "" }) {
  return (
    <div className={`ui-live-badge ${active ? "ui-live-badge--active" : "ui-live-badge--offline"} ${className}`}>
      <span className="ui-live-badge__dot" />
      <span className="ui-live-badge__text">{label || (active ? "LIVE" : "OFFLINE")}</span>
      {sublabel && <span className="ui-live-badge__subtext">{sublabel}</span>}
    </div>
  );
}

export function MetricValue({ value, tone = "neutral", className = "" }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.span
      key={String(value)}
      className={`ui-metric-value ui-metric-value--${tone} ${className}`}
      initial={reducedMotion ? false : { opacity: 0.55, y: 5, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {value}
    </motion.span>
  );
}
