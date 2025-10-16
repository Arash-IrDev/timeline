// Google Apps Script test for the timeline bundle
function testTimelineBundle() {
  try {
    // Read the bundle file
    const bundleContent = getBundleContent();
    
    if (!bundleContent) {
      console.error('Failed to load bundle content');
      return;
    }
    
    console.log('Bundle size:', bundleContent.length);
    
    // Set initial state
    const script = `
      window.__markwhen_initial_state = {
        initialized: false,
        data: null
      };
      
      ${bundleContent}
    `;
    
    // Test if the script can be parsed
    try {
      new Function(script);
      console.log('✅ Bundle syntax is valid');
    } catch (error) {
      console.error('❌ Bundle syntax error:', error.message);
      return;
    }
    
    // Create HTML service
    const htmlOutput = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Timeline Test</title>
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          #app { width: 100%; height: 100vh; }
          .status { position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; z-index: 1000; }
        </style>
      </head>
      <body>
        <div class="status">
          <div>Bundle Status: <span id="status">Loading...</span></div>
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
            ${bundleContent}
            
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
    `);
    
    htmlOutput.setWidth(800);
    htmlOutput.setHeight(600);
    
    // Show the sidebar
    SpreadsheetApp.getUi().showSidebar(htmlOutput);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

function getBundleContent() {
  // This function should return the content of the bundle
  // In a real implementation, you would read this from a file or store it as a string
  // For now, we'll return null to indicate it needs to be implemented
  return null;
}
