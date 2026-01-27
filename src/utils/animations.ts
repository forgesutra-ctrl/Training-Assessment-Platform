/**
 * Animation Utilities
 * Provides reusable animation functions and constants
 */

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
}

export const EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}

/**
 * Button press animation
 */
export const buttonPress = {
  scale: 0.95,
  transition: {
    duration: ANIMATION_DURATION.fast / 1000,
    ease: EASING.easeOut,
  },
}

/**
 * Card hover animation
 */
export const cardHover = {
  scale: 1.02,
  y: -4,
  transition: {
    duration: ANIMATION_DURATION.normal / 1000,
    ease: EASING.easeOut,
  },
}

/**
 * Shake animation for errors
 */
export const shake = {
  x: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: ANIMATION_DURATION.normal / 1000,
    ease: EASING.easeInOut,
  },
}

/**
 * Fade in animation
 */
export const fadeIn = {
  opacity: [0, 1],
  transition: {
    duration: ANIMATION_DURATION.normal / 1000,
    ease: EASING.easeOut,
  },
}

/**
 * Slide up animation
 */
export const slideUp = {
  y: [20, 0],
  opacity: [0, 1],
  transition: {
    duration: ANIMATION_DURATION.normal / 1000,
    ease: EASING.easeOut,
  },
}

/**
 * Scale in animation
 */
export const scaleIn = {
  scale: [0.8, 1],
  opacity: [0, 1],
  transition: {
    duration: ANIMATION_DURATION.normal / 1000,
    ease: EASING.spring,
  },
}

/**
 * Pulse animation
 */
export const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: EASING.easeInOut,
  },
}

/**
 * Bounce animation
 */
export const bounce = {
  y: [0, -10, 0],
  transition: {
    duration: 0.5,
    ease: EASING.spring,
  },
}

/**
 * Rotate animation
 */
export const rotate = {
  rotate: [0, 360],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
}

/**
 * Glow animation
 */
export const glow = {
  boxShadow: [
    '0 0 0px rgba(99, 102, 241, 0)',
    '0 0 20px rgba(99, 102, 241, 0.5)',
    '0 0 0px rgba(99, 102, 241, 0)',
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: EASING.easeInOut,
  },
}
