/**
 * Google Apps Script for Markwhen Timeline
 * Main functions for timeline display and data management
 */

/** Include a child HTML file (returns its string content) */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Receive client logs and write to Apps Script Logger */
function logClient(stage, message) {
  try {
    Logger.log('[CLIENT][' + stage + '] ' + message);
  } catch (e) {
    Logger.log('[CLIENT][logClient error] ' + e);
  }
}

/** Return the raw Markwhen text you want to render */
function getMarkwhenRawText() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    // If no data, return sample data
    if (lastRow < 2) {
      return getSampleMarkwhenText();
    }
    
    // Read data from sheet
    const rng = sheet.getRange(2, 1, lastRow - 1, 3);
    const vals = rng.getValues();
    const tz = Session.getScriptTimeZone();
    
    // Convert sheet data to markwhen format
    const lines = vals.map(r => {
      const task = (r[0] || '').toString().trim();
      const startDate = r[1];
      const endDate = r[2];
      
      if (!task || !startDate) return null;
      
      const s = new Date(startDate);
      if (isNaN(s.getTime())) return null;
      
      const sStr = Utilities.formatDate(s, tz, 'yyyy-MM-dd');
      
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        const e = new Date(endDate);
        const eStr = Utilities.formatDate(e, tz, 'yyyy-MM-dd');
        return `${sStr} ~ ${eStr}: ${task}`;
      }
      
      return `${sStr}: ${task}`;
    }).filter(Boolean);
    
    // Add section headers
    const currentYear = new Date().getFullYear();
    const sections = {};
    
    lines.forEach(line => {
      const dateMatch = line.match(/(\d{4})-\d{2}-\d{2}/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1]);
        if (!sections[year]) {
          sections[year] = [];
        }
        sections[year].push(line);
      }
    });
    
    // Build the final text
    let result = '# Project Timeline\n\n';
    
    Object.keys(sections).sort((a, b) => parseInt(a) - parseInt(b)).forEach(year => {
      result += `## ${year}\n`;
      sections[year].forEach(line => {
        result += `- ${line}\n`;
      });
      result += '\n';
    });
    
    return result;
    
  } catch (error) {
    console.error('Error getting markwhen text:', error);
    return getSampleMarkwhenText();
  }
}

/** Returns the JS bundle (stored inside bundle_text.html) as Base64 */
function getBundleBase64() {
  var html = HtmlService.createHtmlOutputFromFile('bundle_text').getContent();
  var m = html.match(/<script[^>]*id=["']bundle-text["'][^>]*>([\s\S]*?)<\/script>/i);
  var js = m ? m[1] : '';
  js = js.replace(/\/\/# sourceMappingURL=.*?(\r?\n|$)/, '');
  return Utilities.base64Encode(js);
}

/** Opens the sidebar with index.html */
function openSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Project Timeline')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showSidebar(html);
}

/** Add a custom menu */
function onOpen() {
  var ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : DocumentApp.getUi();
  ui.createMenu('Timeline Tool')
    .addItem('Show Timeline', 'openSidebar')
    .addItem('Setup Sample Data', 'setupSampleData')
    .addItem('Test Timeline', 'testTimeline')
    .addToUi();
}

/** Shows the timeline sidebar with parsed data */
function showTimeline() {
  try {
    const rawText = getMarkwhenRawText();
    logClient('showTimeline', 'Raw text length: ' + rawText.length);
    
    // Parse the markwhen text
    const parsedData = parseMarkwhenText(rawText);
    logClient('showTimeline', 'Parsed data: ' + JSON.stringify(parsedData).substring(0, 200) + '...');
    
    // Create the HTML output
    const htmlOutput = createTimelineHTML(parsedData);
    
    // Show the sidebar
    htmlOutput.setWidth(800);
    htmlOutput.setHeight(600);
    SpreadsheetApp.getUi().showSidebar(htmlOutput);
    
  } catch (error) {
    logClient('showTimeline', 'Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}

/** Creates the HTML output for the timeline */
function createTimelineHTML(parsedData) {
  const htmlTemplate = HtmlService.createTemplate(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Markwhen Timeline</title>
      <base target="_top">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: Arial, sans-serif; 
          background: #f5f5f5;
        }
        #app { 
          width: 100%; 
          height: 100vh; 
          background: white;
        }
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
        .error {
          background: rgba(255,0,0,0.8);
        }
        .success {
          background: rgba(0,255,0,0.8);
        }
      </style>
      <?!= include('styles.html'); ?>
    </head>
    <body>
      <div class="status" id="status">Loading Timeline...</div>
      <div id="app"></div>
      
      <script>
        // Set initial state with parsed data
        window.__markwhen_initial_state = {
          initialized: false,
          data: <?= JSON.stringify(parsedData) ?>
        };
        
        console.log('Initial state set:', window.__markwhen_initial_state);
        
        // Load and execute bundle
        try {
          <?!= include('bundle_text.html'); ?>
          
          // Check if bundle loaded successfully
          setTimeout(() => {
            const status = document.getElementById('status');
            if (window.__markwhen_initial_state && window.__markwhen_initial_state.initialized) {
              status.textContent = 'Timeline Loaded Successfully';
              status.className = 'status success';
            } else {
              status.textContent = 'Timeline Failed to Load';
              status.className = 'status error';
            }
          }, 2000);
          
        } catch (error) {
          console.error('Bundle execution error:', error);
          document.getElementById('status').textContent = 'Error: ' + error.message;
          document.getElementById('status').className = 'status error';
        }
      </script>
    </body>
    </html>
  `);
  
  return htmlTemplate.evaluate();
}

/** Parses markwhen text into the required data structure */
function parseMarkwhenText(rawText) {
  try {
    // For now, create a simple parsed structure
    // In a real implementation, you would use the actual parser
    const lines = rawText.split('\n').filter(line => line.trim());
    
    // Create a simple timeline structure
    const events = [];
    const ranges = [];
    const header = {};
    
    let currentSection = null;
    let colorIndex = 0;
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Handle section headers
      if (trimmed.startsWith('## ')) {
        currentSection = trimmed.substring(3);
        return;
      }
      
      // Handle events
      if (trimmed.startsWith('- ')) {
        const eventText = trimmed.substring(2);
        const event = {
          text: eventText,
          dateRange: createDateRange(eventText),
          color: colors[colorIndex % colors.length],
          section: currentSection || 'Default'
        };
        
        events.push(event);
        colorIndex++;
      }
    });
    
    // Create the parsed structure
    const parsed = {
      events: {
        children: events.map(event => ({
          type: 'event',
          text: event.text,
          dateRange: event.dateRange,
          color: event.color,
          section: event.section
        }))
      },
      ranges: ranges,
      header: header
    };
    
    return {
      rawText: rawText,
      parsed: parsed,
      transformed: parsed.events
    };
    
  } catch (error) {
    logClient('parseMarkwhenText', 'Error: ' + error.message);
    throw new Error('Failed to parse markwhen text: ' + error.message);
  }
}

/** Creates a date range from event text */
function createDateRange(eventText) {
  // Simple date parsing - in real implementation, use proper parser
  const now = new Date();
  const year = now.getFullYear();
  
  // Try to extract dates from the text
  const dateMatch = eventText.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    const dateStr = dateMatch[1];
    const date = new Date(dateStr);
    return {
      fromDateTime: date.toISOString(),
      toDateTime: date.toISOString()
    };
  }
  
  // Default to current date if no date found
  const defaultDate = new Date(year, 0, 1);
  return {
    fromDateTime: defaultDate.toISOString(),
    toDateTime: defaultDate.toISOString()
  };
}

/** Gets sample markwhen text for testing */
function getSampleMarkwhenText() {
  return `# Sample Timeline

## 2024
- 2024-01-15: Project Kickoff
- 2024-02-10: First Milestone
- 2024-03-05: Design Review
- 2024-04-20 ~ 2024-05-14: Development Phase
- 2024-05-15 ~ 2024-06-14: Testing Phase
- 2024-06-30: Project Completion

## 2025
- 2025-01-01: New Year Planning
- 2025-02-14: Valentine's Day
- 2025-03-20: Spring Equinox
- 2025-06-21: Summer Solstice
- 2025-09-22: Autumn Equinox
- 2025-12-21: Winter Solstice`;
}

/** Sets up the sheet with sample data */
function setupSampleData() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Clear existing data
    sheet.clear();
    
    // Add headers
    sheet.getRange(1, 1, 1, 3).setValues([['Task', 'Start Date', 'End Date']]);
    
    // Add sample data
    const sampleData = [
      ['Project Kickoff', '2024-01-15', ''],
      ['First Milestone', '2024-02-10', ''],
      ['Design Review', '2024-03-05', ''],
      ['Development Phase', '2024-04-20', '2024-05-14'],
      ['Testing Phase', '2024-05-15', '2024-06-14'],
      ['Project Completion', '2024-06-30', ''],
      ['New Year Planning', '2025-01-01', ''],
      ['Valentine\'s Day', '2025-02-14', ''],
      ['Spring Equinox', '2025-03-20', ''],
      ['Summer Solstice', '2025-06-21', ''],
      ['Autumn Equinox', '2025-09-22', ''],
      ['Winter Solstice', '2025-12-21', '']
    ];
    
    sheet.getRange(2, 1, sampleData.length, 3).setValues(sampleData);
    
    // Format the sheet
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    sheet.autoResizeColumns(1, 3);
    
    SpreadsheetApp.getUi().alert('Sample data added successfully!');
    
  } catch (error) {
    logClient('setupSampleData', 'Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}

/** Test function to verify the setup */
function testTimeline() {
  try {
    logClient('testTimeline', 'Testing timeline setup...');
    const rawText = getMarkwhenRawText();
    logClient('testTimeline', 'Raw text: ' + rawText.substring(0, 100) + '...');
    
    const parsed = parseMarkwhenText(rawText);
    logClient('testTimeline', 'Parsed data: ' + JSON.stringify(parsed).substring(0, 200) + '...');
    
    logClient('testTimeline', 'Test completed successfully');
    return 'Test passed';
  } catch (error) {
    logClient('testTimeline', 'Test failed: ' + error.message);
    return 'Test failed: ' + error.message;
  }
}