// Terminal view content generators
export const getWelcomeView = () => {
  return `
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║           Welcome to Agrim Sigdel's Portfolio Terminal          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

Full-Stack Developer | AI Enthusiast | Creative Problem Solver

Type 'help' to see available commands.
Type 'menu' to see all sections.

`;
};

export const getHelpView = () => {
  return `
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  menu              Show main menu with all sections
  help              Display this help message
  start             Return to mode selection screen
  
  about             View professional summary
  projects          View project portfolio
  experience        View work experience
  skills            View technical skills
  contact           View contact information
  
  <ref.number>      Navigate to section (e.g., 1, 2, 3)
  back              Return to previous view
  clear             Clear terminal screen
  
  Mode Switching:
  close             Switch to FUN mode
  minimize          Switch to NORMAL mode
  maximize          Toggle fullscreen mode
  fun               Switch to FUN mode
  normal            Switch to NORMAL mode
  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tip: Use arrow keys (↑↓) to navigate command history.

`;
};

export const getMenuView = () => {
  return `
Main Menu:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [1] About Me          Professional summary and education
  [2] Projects          Portfolio of work and achievements
  [3] Experience        Career history and roles
  [4] Skills            Technical toolkit and expertise
  [5] Contact           Get in touch

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type the number or section name to navigate.
Example: '1' or 'about'

`;
};

export const getAboutView = () => {
  return `
[1] ABOUT ME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Professional Summary:
Versatile Full-Stack Developer with a strong foundation in modern AI, 
specializing in React/TypeScript and Python. I bridge the gap between 
complex AI models and user-centric applications, delivering 
production-ready code for Computer Vision and NLP domains.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Education:
  BSc. CSIT — Prime College, Kathmandu
  Expected Graduation: April 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Experience:
  Creative Lead — Prime College Graduation Committee
  Led creative direction and brand guidelines for 625+ attendees,
  managing cross-functional teams for visual and marketing materials.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type 'menu' to return to main menu.

`;
};

export const getProjectsView = () => {
  return `
[2] PROJECTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] ANPR System
    Category: AI & Full-Stack
    
    Highly optimized YOLOv8 backend with a modern React/TypeScript 
    frontend for Nepali plate recognition.
    
    Outcome: 30 FPS live processing with custom Devanagari 
    recognition logic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[2] Parking Management System
    Category: Automation & Backend
    
    End-to-end automatic parking system utilizing custom ANPR for 
    real-time verification and access control.
    
    Outcome: Automated gate entry/exit reducing manual verification 
    significantly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3] Reddit Sentiment Analysis
    Category: NLP / Deep Learning
    
    Deep NLP pipeline using fine-tuned BERT for nuanced emotion 
    classification on large-scale Reddit data.
    
    Outcome: Practiced advanced prompt engineering and LLM-based 
    interfaces.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type 'menu' to return to main menu.

`;
};

export const getExperienceView = () => {
  return `
[3] EXPERIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creative Lead
Prime College Graduation Committee
2024 - 2026

• Led creative direction and brand guidelines for 625+ attendees
• Managed cross-functional teams for visual and marketing materials
• Coordinated event planning and execution
• Developed comprehensive branding strategy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full-Stack Developer & AI Engineer
Freelance / Personal Projects
2022 - Present

• Developed production-ready AI applications
• Built modern web applications with React/TypeScript
• Implemented Computer Vision and NLP solutions
• Delivered scalable backend systems

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type 'menu' to return to main menu.

`;
};

export const getSkillsView = () => {
  return `
[4] SKILLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend Development:
  • TypeScript      • React          • Next.js
  • TailwindCSS     • Framer Motion  • Vite

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend Development:
  • Python          • Django         • Flask
  • REST APIs       • MySQL          • PostgreSQL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AI & Machine Learning:
  • PyTorch         • YOLOv8         • RT-DETR
  • BERT            • TensorFlow     • OpenCV

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tools & Technologies:
  • Git/GitHub      • Figma          • Docker
  • VS Code         • Postman        • Linux

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type 'menu' to return to main menu.

`;
};

export const getContactView = () => {
  return `
[5] CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's connect! I'm always open to discussing new projects,
creative ideas, or opportunities to be part of your vision.

Email:
  agrim.sigdel@example.com

LinkedIn:
  linkedin.com/in/agrimsigdel

GitHub:
  github.com/agrimsigdel

Portfolio:
  agrimsigdel.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type 'menu' to return to main menu.

`;
};
