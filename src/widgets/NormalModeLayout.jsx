import React, { useEffect, useState } from 'react';
import content from '../data/content.json';
import '../styles/normal-mode.css';

const FloatingCard = ({ children, className = '', delay = '0s' }) => {
  return (
    <div 
      className={`flat-floating-card ${className}`} 
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
};

const NormalModeLayout = ({ onResetMode }) => {
  const { common } = content;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`flat-normal-mode ${mounted ? 'visible' : ''}`}>
      <button className="flat-return-button" onClick={onResetMode}>
        ← Back to Start
      </button>

      <div className="flat-scroll-container">
        
        {/* HEADER BAR (Like top piece in the image) */}
        <FloatingCard className="flat-header-bar" delay="0s">
          <div className="flat-header-inner">
             <div className="flat-circle"></div>
             <div className="flat-search-bar">
               <span style={{fontWeight: 800, color: '#4b5563', letterSpacing: '2px'}}>{common.personal.name.toUpperCase()}</span>
             </div>
             <div className="flat-orange-pill">{common.personal.tagline}</div>
          </div>
        </FloatingCard>

        {/* MAIN BODY (Like the bottom large piece in the image) */}
        <FloatingCard className="flat-main-body" delay="0.2s">
          <div className="flat-grid-layout">
            
            {/* LEFT SIDEBAR (Skills & Contact) */}
            <div className="flat-sidebar">
              <div className="flat-sidebar-top-box">
                 {/* Decorative elements from image */}
                 <div className="flat-dots">
                   <span></span><span></span><span></span><span></span>
                 </div>
                 <div className="flat-image-placeholder">
                    <h2>ABOUT</h2>
                 </div>
              </div>

              <div className="flat-sidebar-btm-box">
                 <p style={{fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.6'}}>{common.personal.summary}</p>
                 <div className="flat-sliders">
                   <div className="flat-slider-track"><div className="flat-slider-thumb"></div></div>
                   <div className="flat-slider-track"><div className="flat-slider-thumb" style={{left: '70%'}}></div></div>
                 </div>
              </div>

              {/* Skills Tags structured like UI blocks */}
              <div className="flat-sidebar-btm-box" style={{marginTop: '12px'}}>
                 <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                    {common.personal.areasOfExpertise.slice(0,6).map(skill => (
                      <div key={skill} className="flat-skill-pill">{skill}</div>
                    ))}
                 </div>
              </div>
            </div>

            {/* RIGHT MAIN AREA (Experience & Projects) */}
            <div className="flat-content">
              
              {/* EXPERIENCE BLOCK */}
              <div className="flat-content-box">
                 <div className="flat-box-header">
                   <div className="flat-toggle"><div className="flat-toggle-knob"></div></div>
                   <div className="flat-big-dots"><span></span><span></span><span></span></div>
                   <div className="flat-small-dots"><span></span><span></span><span></span></div>
                 </div>
                 <h2 className="flat-section-title">EXPERIENCE</h2>
                 
                 {common.experience.map((exp, i) => (
                   <div key={i} className="flat-list-item">
                     <div className="flat-orange-block">{exp.role}</div>
                     <div className="flat-lines-container">
                       <div className="flat-thick-line">{exp.company}</div>
                       <div className="flat-thin-line">{exp.period}</div>
                     </div>
                   </div>
                 ))}
              </div>

              {/* PROJECTS BLOCK */}
              <div className="flat-content-box">
                 <div className="flat-box-header">
                   <div className="flat-toggle"><div className="flat-toggle-knob"></div></div>
                   <div className="flat-big-dots"><span></span><span></span><span></span></div>
                   <div className="flat-small-dots"><span></span><span></span><span></span></div>
                 </div>
                 <h2 className="flat-section-title">PROJECTS</h2>

                 {common.projects.map((proj, i) => (
                   <div key={i} className="flat-list-item">
                     <div className="flat-orange-block">{proj.title}</div>
                     <div className="flat-lines-container">
                       <div className="flat-thick-line">{proj.category}</div>
                       <div className="flat-thin-line">{proj.description}</div>
                     </div>
                   </div>
                 ))}
              </div>

            </div>

          </div>
        </FloatingCard>

      </div>
    </div>
  );
};

export default NormalModeLayout;
