// Framer Motion variants library

export const pageVariants = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0,  transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.25, ease: [0.4, 0.0, 1.0, 1.0] } }
};

export const listVariants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } }
};

export const listItemVariants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] } }
};

export const bottomSheetVariants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'spring', damping: 28, stiffness: 260 } },
  exit:    { y: '100%', transition: { duration: 0.25, ease: [0.4, 0.0, 1.0, 1.0] } }
};

export const drawerVariants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 280 } },
  exit:    { x: '100%', transition: { duration: 0.25, ease: [0.4, 0.0, 1.0, 1.0] } }
};

export const modalVariants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1,   transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: [0.4, 0.0, 1.0, 1.0] } }
};

export const wiggleVariants = {
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
};

export const toastVariants = {
  initial: { opacity: 0, y: 24, scale: 0.92 },
  animate: { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring', damping: 22, stiffness: 300 } },
  exit:    { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.2 } }
};
