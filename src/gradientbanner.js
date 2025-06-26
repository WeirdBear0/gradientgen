import React, { useRef, useEffect } from 'react';
import { Gradient } from './gradient';
import './banner.css';

const GradientBanner = ({
  children,
  height = '400px',
  density = [0.06, 0.16],
  colors = ['#9bce7b', '#f0ead1', '#a98367', '#f0ead1'],
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const gradient = new Gradient();
    gradient.el = canvasRef.current;
    gradient.connect().then(() => {
      gradient.conf.density = density;
    });

    return () => {
      gradient.disconnect();
    };
  }, [density, colors]);

  // Dynamically set CSS variables for all colors
  const cssVars = colors.reduce((vars, color, i) => {
    vars[`--gradient-color-${i + 1}`] = color;
    return vars;
  }, {});

  return (
    <div
      className="gradient-banner-container"
      style={{ ...cssVars }}
    >
      <canvas
        ref={canvasRef}
        className="gradient-canvas"
      />
      <div className="gradient-content" style={{width:'100%', height:'100%'}}>
        {children}
      </div>
    </div>
  );
};

export default GradientBanner;