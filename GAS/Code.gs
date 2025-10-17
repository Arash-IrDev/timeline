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

/** Return the raw Markwhen text from spreadsheet data */
function getMarkwhenRawText() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    // If no data, return empty string with header
    if (lastRow < 2) {
      return '# Project Timeline\n\nNo events yet. Add data to the spreadsheet to see your timeline.';
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
    
    // Group by year
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
    
    // Build the markwhen format text
    let result = '# Project Timeline\n\n';
    Object.keys(sections).sort((a, b) => parseInt(a) - parseInt(b)).forEach(year => {
      result += `## ${year}\n\n`;
      sections[year].forEach(line => {
        result += `${line}\n`;
      });
      result += '\n';
    });
    
    return result;
    
  } catch (error) {
    logClient('getMarkwhenRawText', 'Error: ' + error.message);
    return '# Project Timeline\n\nError loading timeline data. Please check your spreadsheet format.';
  }
}

/** Returns the JS bundle (stored inside bundle_text.html) as Base64 */
function getBundleBase64() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('bundle_text').getContent();
    var m = html.match(/<script[^>]*id=["']bundle-text["'][^>]*>([\s\S]*?)<\/script>/i);
    var js = m ? m[1] : '';
    
    // Clean up the JavaScript content
    js = js.trim();
    
    // If no content found, return a simple fallback
    if (!js || js.length < 100) {
      logClient('getBundleBase64', 'No JavaScript content found in bundle_text.html');
      return Utilities.base64Encode(`
        console.log("No bundle content available");
        window.__markwhen_initial_state = window.__markwhen_initial_state || {};
        window.__markwhen_initial_state.initialized = false;
      `);
    }
    
    logClient('getBundleBase64', 'Bundle content length: ' + js.length);
    return Utilities.base64Encode(js);
  } catch (error) {
    logClient('getBundleBase64', 'Error: ' + error.message);
    return Utilities.base64Encode(`
      console.log("Bundle loading error: ${error.message}");
      window.__markwhen_initial_state = window.__markwhen_initial_state || {};
      window.__markwhen_initial_state.initialized = false;
    `);
  }
}

/** Opens the sidebar with index.html */
function openSidebar() {
  var template = HtmlService.createTemplateFromFile('index');
  // Provided for template compatibility; index ignores it but templating requires a defined var
  template.base64Data = '';
  var html = template.evaluate()
    .setTitle('Project Timeline')
    .setWidth(1600)
    .setHeight(800)
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
    logClient('testTimeline', 'Raw text length: ' + rawText.length);
    logClient('testTimeline', 'Raw text preview: ' + rawText.substring(0, 200));
    
    SpreadsheetApp.getUi().alert('Test completed!\n\nTimeline data length: ' + rawText.length + ' characters\n\nCheck the Apps Script logs for details.');
    
    logClient('testTimeline', 'Test completed successfully');
    return 'Test passed';
  } catch (error) {
    logClient('testTimeline', 'Test failed: ' + error.message);
    SpreadsheetApp.getUi().alert('Test failed: ' + error.message);
    return 'Test failed: ' + error.message;
  }
}
