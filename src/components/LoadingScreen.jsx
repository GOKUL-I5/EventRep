import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const LoadingScreen = () => {
  const containerRef = useRef(null);
  const ringRef1 = useRef(null);
  const ringRef2 = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    // Premium pulsing and rotating GSAP animation
    const tl = gsap.timeline({ repeat: -1 });
    
    tl.to(ringRef1.current, {
      rotate: 360,
      duration: 2,
      ease: 'linear'
    }, 0);

    tl.to(ringRef2.current, {
      rotate: -360,
      duration: 3,
      ease: 'linear'
    }, 0);

    gsap.to(logoRef.current, {
      scale: 1.1,
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut'
    });

  }, []);

  return (
    <div ref={containerRef} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--color-bg-base)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer Ring */}
        <div ref={ringRef1} style={{
          position: 'absolute', width: '100%', height: '100%',
          border: '3px solid transparent', borderTopColor: 'var(--color-accent)',
          borderRightColor: 'var(--color-accent)', borderRadius: '50%',
          opacity: 0.8
        }} />
        {/* Inner Ring */}
        <div ref={ringRef2} style={{
          position: 'absolute', width: '70%', height: '70%',
          border: '3px solid transparent', borderBottomColor: 'var(--color-secondary)',
          borderLeftColor: 'var(--color-secondary)', borderRadius: '50%',
          opacity: 0.6
        }} />
        {/* Logo Text/Icon */}
        <div ref={logoRef} style={{
          fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, var(--color-accent), var(--color-secondary))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          EP
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
