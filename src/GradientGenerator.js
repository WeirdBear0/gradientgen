import React, { useState } from 'react';
import GradientBanner from './gradientbanner';
import './banner.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function interpolateColor(c1, c2, t) {
  return rgbToHex([
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ]);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex([Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]);
}

function generatePalette(userColors, total) {
  if (userColors.length === 0) return Array(total).fill('#ffffff');
  if (userColors.length === 1) {
    // Generate analogous colors for variety
    const base = hexToRgb(userColors[0]);
    return Array.from({ length: total }, (_, i) => {
      const angle = (i * 40) % 360;
      // Simple HSL rotation for variety
      const hsl = rgbToHsl(...base);
      hsl[0] = (hsl[0] + angle / 360) % 1;
      return hslToHex(...hsl);
    });
  }
  // Interpolate between user colors
  const stops = userColors.map(hexToRgb);
  const palette = [];
  for (let i = 0; i < total; i++) {
    const t = i / (total - 1);
    const seg = t * (stops.length - 1);
    const idx = Math.floor(seg);
    const localT = seg - idx;
    if (idx === stops.length - 1) {
      palette.push(rgbToHex(stops[stops.length - 1]));
    } else {
      palette.push(interpolateColor(stops[idx], stops[idx + 1], localT));
    }
  }
  return palette;
}

const defaultColors = ['#9bce7b', '#f0ead1', '#a98367', '#f0ead1', '#eac01a', '#fa0000'];

const GradientGenerator = () => {
  const [colorCount, setColorCount] = useState(4);
  const [customizeCount, setCustomizeCount] = useState(4);
  const [userColors, setUserColors] = useState(defaultColors.slice(0, 4));
  const [showGradientCode, setShowGradientCode] = useState(false);
  const [showBannerCode, setShowBannerCode] = useState(false);

  // Final palette: user-selected + auto-generated
  const colors = generatePalette(userColors.slice(0, customizeCount), colorCount);

  // Update color at index
  const handleColorChange = (index, value) => {
    const newColors = [...userColors];
    newColors[index] = value;
    setUserColors(newColors);
  };

  // Update color count
  const handleColorCountChange = (e) => {
    const count = parseInt(e.target.value, 10);
    setColorCount(count);
    if (customizeCount > count) setCustomizeCount(count);
  };

  // Update customize count
  const handleCustomizeCountChange = (e) => {
    const count = parseInt(e.target.value, 10);
    setCustomizeCount(count);
    setUserColors((prev) => {
      // Always keep the first N colors, fill with default if needed
      const next = prev.slice(0, count);
      while (next.length < count) next.push(defaultColors[next.length % defaultColors.length]);
      return next;
    });
  };

  // Generate JSX code for Banner
  const generatedJSX = `import GradientBanner from './gradientbanner';\n\nconst Banner = () => {\n  return (\n    <GradientBanner colors={[${colors.map(c => `'${c}'`).join(', ')}]}>\n      //insert content here\n    </GradientBanner>\n  );\n};\nexport default Banner;`;
  //const gradientJsCode = `//Converting colors to proper format\nfunction normalizeColor(hexCode) {\n    return [(hexCode >> 16 & 255) / 255, (hexCode >> 8 & 255) / 255, (255 & hexCode) / 255]\n}\n\nconst blendModes = [\"SCREEN\", \"LINEAR_LIGHT\"].reduce((hexCode, t, n) => Object.assign(hexCode, {\n    [t]: n\n}), {});\n\n//Essential functionality of WebGl\n//t = width\n//n = height\nclass MiniGl { ... }\n\n// ... (full code continues, see src/gradient.js)\n\n//Sets initial properties\nfunction e(object, propertyName, val) { ... }\n\n//Gradient object\nclass Gradient { ... }\n\nexport { Gradient }\n`;
  // gradientBannerCode = `import React, { useRef, useEffect } from 'react';\nimport { Gradient } from './gradient';\nimport './banner.css';\n\nconst GradientBanner = ({\n  children,\n  height = '400px',\n  density = [0.06, 0.16],\n  colors = ['#9bce7b', '#f0ead1', '#a98367', '#f0ead1'],\n}) => {\n  const canvasRef = useRef(null);\n\n  useEffect(() => {\n    const gradient = new Gradient();\n    gradient.el = canvasRef.current;\n    gradient.connect().then(() => {\n      gradient.conf.density = density;\n    });\n\n    return () => {\n      gradient.disconnect();\n    };\n  }, [density, colors]);\n\n  // Dynamically set CSS variables for all colors\n  const cssVars = colors.reduce((vars, color, i) => {\n    vars[`--gradient-color-${i + 1}`] = color;\n    return vars;\n  }, {});\n\n  return (\n    <div\n      className=\"gradient-banner-container\"\n      style={{ ...cssVars }}\n    >\n      <canvas\n        ref={canvasRef}\n        className=\"gradient-canvas\"\n      />\n      <div className=\"gradient-content\" style={{width:'100%', height:'100%'}}>{children}</div>\n    </div>\n  );\n};\n\nexport default GradientBanner;\n`;
  // Remove light/dark mode logic, always use dark theme
  const themeVars = {
    '--bg': '#0a0a0f',
    '--panel': 'rgba(24, 26, 34, 0.85)',
    '--text': '#f6f7fa',
    '--accent': '#00ffe7',
    '--border': '#23293a',
    '--input': '#181c24',
    '--shadow': '0 8px 32px 0 rgba(0,0,0,0.25)',
    '--glass': 'rgba(24, 26, 34, 0.65)',
    '--radius': '18px',
    '--transition': '0.3s cubic-bezier(.4,2,.6,1)',
    '--font': "'Inter', 'Space Grotesk', 'Roboto', Arial, sans-serif"
  };

  // Place code window contents here, before return
  //const gradientJsCode = `//Converting colors to proper format\nfunction normalizeColor(hexCode) {\n    return [(hexCode >> 16 & 255) / 255, (hexCode >> 8 & 255) / 255, (255 & hexCode) / 255]\n}\n\nconst blendModes = [\"SCREEN\", \"LINEAR_LIGHT\"].reduce((hexCode, t, n) => Object.assign(hexCode, {\n    [t]: n\n}), {});\n\n//Essential functionality of WebGl\n//t = width\n//n = height\nclass MiniGl { /* ... see full file for details ... */ }\n\n// ... (full code continues, see src/gradient.js)\n`;
  //const gradientBannerCode = `import React, { useRef, useEffect } from 'react';\nimport { Gradient } from './gradient';\nimport './banner.css';\n\nconst GradientBanner = ({\n  children,\n  height = '400px',\n  density = [0.06, 0.16],\n  colors = ['#9bce7b', '#f0ead1', '#a98367', '#f0ead1'],\n}) => {\n  const canvasRef = useRef(null);\n\n  useEffect(() => {\n    const gradient = new Gradient();\n    gradient.el = canvasRef.current;\n    gradient.connect().then(() => {\n      gradient.conf.density = density;\n    });\n\n    return () => {\n      gradient.disconnect();\n    };\n  }, [density, colors]);\n\n  // Dynamically set CSS variables for all colors\n  const cssVars = colors.reduce((vars, color, i) => {\n    vars[`--gradient-color-${i + 1}`] = color;\n    return vars;\n  }, {});\n\n  return (\n    <div\n      className=\"gradient-banner-container\"\n      style={{ ...cssVars }}\n    >\n      <canvas\n        ref={canvasRef}\n        className=\"gradient-canvas\"\n      />\n      <div className=\"gradient-content\" style={{width:'100%', height:'100%'}}>{children}</div>\n    </div>\n  );\n};\n\nexport default GradientBanner;\n`;

  const fetchFile = async (url) => {
    const res = await fetch(url);
    return res.text();
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    zip.file('Banner.jsx', generatedJSX);
    zip.file('gradientbanner.js', await fetchFile('/gradientbanner.js'));
    zip.file('gradient.js', await fetchFile('/gradient.js'));
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'gradient-banner-files.zip');
    });
  };

  return (
    <div className="futuristic-root" style={themeVars}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ letterSpacing: 1, fontWeight: 700, fontFamily: "Libertinus Math" }}>Chameleon Gradient Generator</h2>
      </div>
      <div className="panel" style={{ marginBottom: 24 }}>
        <label>
          Number of Colors:
          <select value={colorCount} onChange={handleColorCountChange} style={{ marginLeft: 8 }}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label style={{ marginLeft: 24 }}>
          Colors to Customize:
          <select value={customizeCount} onChange={handleCustomizeCountChange} style={{ marginLeft: 8 }}>
            {Array.from({ length: colorCount }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <div style={{ margin: '16px 0', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {/* Editable color pickers as swatches */}
          {Array.from({ length: customizeCount }).map((_, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>Color {i + 1}:</span>
              <input
                type="color"
                value={userColors[i] || '#ffffff'}
                onChange={(e) => handleColorChange(i, e.target.value)}
                className="color-picker-swatch"
              />
            </label>
          ))}
        </div>
        {/* Non-editable palette swatches row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {Array.from({ length: colorCount }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.85 }}>
              <span style={{ fontSize: 14 }}>Color {i + 1}:</span>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: colors[i] || '#fff',
                border: '2px solid var(--border)'
              }} />
            </div>
          ))}
        </div>
      </div>
      <h3 style={{ margin: '32px 0 12px 0', fontWeight: 600, fontFamily: "Libertinus Math" }}>LIVE PREVIEW</h3>
      <div style={{ border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 32, background: 'var(--panel)', boxShadow: '0 4px 32px #0001' }}>
        <GradientBanner colors={colors}>
          {/* Gradient only, no content */}
        </GradientBanner>
      </div>
      <h3 style={{ margin: '32px 0 12px 0', fontWeight: 600, fontFamily: "Libertinus Math" }}>GENERATED JSX</h3>
      <pre className="code-window" style={{ background: 'var(--panel)', color: 'var(--text)', padding: 20, borderRadius: 12, fontSize: 15, overflowX: 'auto', border: '1.5px solid var(--border)', marginBottom: 16 }}>
        {generatedJSX}
      </pre>
      {/* <div style={{ marginBottom: 24 }}>
        <button className="expand-btn" onClick={() => setShowBannerCode(v => !v)}>
          {showBannerCode ? '▼' : '▶'} gradientbanner.js
        </button>
        {showBannerCode && (
          <pre className="code-window" style={{ background: 'var(--panel)', color: 'var(--text)', padding: 20, borderRadius: 12, fontSize: 15, overflowX: 'auto', border: '1.5px solid var(--border)', marginTop: 8 }}>
            {gradientBannerCode}
          </pre>
        )}
      </div>
      <div style={{ marginBottom: 24 }}>
        <button className="expand-btn" onClick={() => setShowGradientCode(v => !v)}>
          {showGradientCode ? '▼' : '▶'} gradient.js
        </button>
        {showGradientCode && (
          <pre className="code-window" style={{ background: 'var(--panel)', color: 'var(--text)', padding: 20, borderRadius: 12, fontSize: 15, overflowX: 'auto', border: '1.5px solid var(--border)', marginTop: 8 }}>
            {gradientJsCode
          </pre>
        )}
      </div> */}
      <div style={{ marginBottom: 32, fontFamily: "Libertinus Math" }}>
        <button className="expand-btn" onClick={handleDownloadZip} style={{ marginBottom: 32, fontFamily: "Libertinus Math" }}>
          Download All as ZIP
        </button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 12, opacity: 0.8 }}>
        <b>Tip:</b> The <code>GradientBanner</code> component should be exported and wrapped around whatever needs to be behind it, like in the example above. Make sure to import <code>GradientBanner</code> and pass your chosen <code>colors</code> prop. Place your content as children inside <code>&lt;GradientBanner&gt;...&lt;/GradientBanner&gt;</code>.
      </div>
    </div>
  );
};

export default GradientGenerator; 