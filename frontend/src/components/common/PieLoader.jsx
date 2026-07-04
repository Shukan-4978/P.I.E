import React from 'react';
import { motion } from 'framer-motion';

const PieLoader = () => {
  const containerVariants = {
    start: {
      transition: { staggerChildren: 0.15 },
    },
    end: {
      transition: { staggerChildren: 0.15 },
    },
  };

  const letterVariants = {
    start: {
      y: '0%',
      opacity: 0.4,
      scale: 0.9,
    },
    end: {
      y: '-20%',
      opacity: 1,
      scale: 1.1,
    },
  };

  const letters = ['P', '.', 'I', '.', 'E'];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh', width: '100%' }}>
      <motion.div
        variants={containerVariants}
        initial="start"
        animate="end"
        style={{ display: 'flex', gap: '0.25rem', alignItems: 'baseline' }}
      >
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            variants={letterVariants}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
            style={{
              fontSize: letter === '.' ? '2rem' : '3.5rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              letterSpacing: '-0.05em',
            }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

export default PieLoader;
