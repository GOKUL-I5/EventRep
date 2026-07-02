import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';

const Landing = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);

  // GSAP for mouse parallax effect on particles
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 40;
      const y = (clientY / window.innerHeight - 0.5) * 40;

      gsap.to('.particle', {
        x: x,
        y: y,
        duration: 1,
        ease: 'power2.out',
        stagger: 0.05
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      {/* Floating Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            position: 'absolute',
            top: `${Math.random() * 100}vh`,
            left: `${Math.random() * 100}vw`,
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '50%',
            filter: 'blur(1px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      ))}

      {/* Main Content */}
      <div className="center-container">
        <motion.div style={{ y: y1, zIndex: 1, padding: '4rem 2rem', border: '1px solid rgba(255,255,255,0.15)' }} className="glass-panel" 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        >
          <motion.h1 ref={titleRef}>
            Elevate Your Events
          </motion.h1>
          <motion.p className="subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            The premium platform to create, manage, and scale world-class experiences.
          </motion.p>

          <motion.button
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.125rem',
              fontWeight: '500',
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '9999px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
          >
            Login
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
