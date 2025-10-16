const fs = require('fs');
const path = require('path');

// Read the bundle
const bundlePath = path.join(__dirname, 'dist', 'markwhen-timeline.iife.js');
const bundleContent = fs.readFileSync(bundlePath, 'utf8');

// Create a Google Apps Script compatible version
const gasScript = `
// Google Apps Script compatible timeline bundle
// Generated from: ${bundlePath}
// Size: ${bundleContent.length} characters

function loadTimelineBundle() {
  const bundleContent = \`${bundleContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
  
  // Set initial state
  const script = \`
    window.__markwhen_initial_state = {
      initialized: false,
      data: null
    };
    
    \${bundleContent}
  \`;
  
  return script;
}

function createTimelineSidebar() {
  const htmlOutput = HtmlService.createHtmlOutput(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Markwhen Timeline</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #app { width: 100%; height: 100vh; }
        .status { 
          position: fixed; 
          top: 10px; 
          left: 10px; 
          background: rgba(0,0,0,0.8); 
          color: white; 
          padding: 10px; 
          border-radius: 5px; 
          z-index: 1000; 
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="status">
        <div>Timeline Status: <span id="status">Loading...</span></div>
        <div>Window State: <span id="state">Checking...</span></div>
      </div>
      <div id="app"></div>
      
      <script>
        // Set initial state
        window.__markwhen_initial_state = {
          initialized: false,
          data: null
        };
        
        // Load and execute bundle
        try {
          \${loadTimelineBundle()}
          
          // Check status after a delay
          setTimeout(() => {
            const status = document.getElementById('status');
            const state = document.getElementById('state');
            
            if (window.__markwhen_initial_state && window.__markwhen_initial_state.initialized) {
              status.textContent = '✅ Success';
              status.style.color = 'lightgreen';
              state.textContent = 'Initialized';
              state.style.color = 'lightgreen';
            } else {
              status.textContent = '❌ Failed';
              status.style.color = 'red';
              state.textContent = 'Not initialized';
              state.style.color = 'red';
            }
          }, 1000);
          
        } catch (error) {
          console.error('Bundle execution error:', error);
          document.getElementById('status').textContent = '❌ Error: ' + error.message;
          document.getElementById('status').style.color = 'red';
        }
      </script>
    </body>
    </html>
  \`);
  
  htmlOutput.setWidth(800);
  htmlOutput.setHeight(600);
  
  return htmlOutput;
}

function showTimeline() {
  const htmlOutput = createTimelineSidebar();
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}
`;

// Write the GAS script
const gasScriptPath = path.join(__dirname, 'gas-timeline.js');
fs.writeFileSync(gasScriptPath, gasScript);

console.log('✅ Google Apps Script file created:', gasScriptPath);
console.log('📊 Bundle size:', bundleContent.length, 'characters');
console.log('📝 Instructions:');
console.log('1. Copy the content of gas-timeline.js');
console.log('2. Paste it into your Google Apps Script project');
console.log('3. Call showTimeline() function to display the timeline');
