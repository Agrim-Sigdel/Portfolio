import { MotionConfig } from 'framer-motion';

/*
 * Wraps the animated mode pages in framer-motion's global config.
 *
 * This lives in its own module so it can be lazy-loaded: the landing page (mode
 * selector) uses no framer-motion, so pulling MotionConfig in here — rather than
 * importing it in main.jsx — keeps the ~136 kB `motion` chunk off the initial
 * critical path. It's only fetched once a visitor actually opens a mode.
 *
 * reducedMotion="user": framer-motion skips transform/layout animations for
 * visitors with prefers-reduced-motion, site-wide.
 */
export default function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
