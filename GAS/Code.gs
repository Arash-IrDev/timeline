function getUserProperty(key) {
  return PropertiesService.getUserProperties().getProperty(key);
}

function setUserProperty(key, value) {
  PropertiesService.getUserProperties().setProperty(key, value);
}

function setTimelineModeSidebar() {
  setUserProperty(TIMELINE_OPEN_MODE_KEY, TIMELINE_OPEN_MODES.SIDEBAR);
  SpreadsheetApp.getUi().alert('Timeline will now open in the sidebar.');
}

function setTimelineModePopup() {
  setUserProperty(TIMELINE_OPEN_MODE_KEY, TIMELINE_OPEN_MODES.POPUP);
  SpreadsheetApp.getUi().alert('Timeline will now open as a popup dialog.');
}

function setTimelineModeWindow() {
  setUserProperty(TIMELINE_OPEN_MODE_KEY, TIMELINE_OPEN_MODES.WINDOW);
  SpreadsheetApp.getUi().alert('Timeline will now open in a separate window (non-modal).');
}

function setTimelineModeWebApp() {
  setUserProperty(TIMELINE_OPEN_MODE_KEY, TIMELINE_OPEN_MODES.WEB_APP);
  SpreadsheetApp.getUi().alert('Timeline will now open as a separate tab (Web App).');
}

/**
 * Google Apps Script for Markwhen Timeline
 * Main functions for timeline display and data management
 */

/** Include a child HTML file (returns its string content) */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

const TAG_COLORS = Object.freeze({
  '#Core': '#4d79ff',
  '#UI': '#4db8ff',
  '#Data': '#ff944d',
  '#Analysis': '#ff4d4d',
  '#Infrastructure': '#4dff88',
  '#Documentation': '#ffa500',
  '#ML': '#ff80ff',
  '#High': '#ff4d4d',
  '#Medium': '#ffa64d',
  '#Low': '#ffee80',
  '#Completed': '#bababa'
});

const TIMELINE_OPEN_MODES = Object.freeze({
  SIDEBAR: 'SIDEBAR',
  POPUP: 'POPUP',
  WINDOW: 'WINDOW',
  WEB_APP: 'WEB_APP'
});

const TIMELINE_OPEN_MODE_KEY = 'timelineOpenMode';

function toTag(value) {
  if (value === null || value === undefined) return '';
  var tag = String(value).trim();
  if (!tag) return '';
  if (tag.charAt(0) !== '#') {
    tag = '#' + tag.replace(/^#+/, '');
  }
  return tag;
}

function parseSheetDate(value) {
  if (!value && value !== 0) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'number') {
    var dateFromNumber = new Date(value);
    return isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
  }
  if (typeof value === 'string') {
    var trimmed = value.trim();
    if (!trimmed) return null;
    var parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    var parts = trimmed.split('-');
    if (parts.length === 3) {
      var year = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10);
      var day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month - 1, day);
      }
    }
  }
  return null;
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
    if (!sheet) {
      throw new Error('Active sheet not found.');
    }

    var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    var headers = headerRange.getValues()[0];
    var expectedHeaders = [
      'Section',
      'Category Tag',
      'Section Color',
      'Start Date',
      'End Date',
      'Task Title',
      'Completed',
      'Priority Tag',
      'Priority Color',
      'Status Tag',
      'Status Color',
      'Emoji'
    ];

    if (!headers || headers.length < expectedHeaders.length || expectedHeaders.some(function (h, idx) { return headers[idx] !== h; })) {
      return '# Project Timeline\n\nPlease run "Setup Sample Data" to populate the sheet with the required headers and data.';
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return '# Project Timeline\n\nNo events yet. Use the "Setup Sample Data" menu to get started.';
    }

    var dataRange = sheet.getRange(2, 1, lastRow - 1, expectedHeaders.length);
    var rows = dataRange.getValues();
    var tz = Session.getScriptTimeZone();

    var sectionsMap = {};

    rows.forEach(function (row) {
      var sectionName = row[0];
      var categoryTag = toTag(row[1]);
      var startDate = parseSheetDate(row[3]);
      var endDate = parseSheetDate(row[4]);
      var title = row[5];
      var completed = String(row[6] || '').toLowerCase() === 'true';
      var priorityTag = toTag(row[7]);
      var statusTag = toTag(row[9]);
      var emoji = row[11];

      if (!sectionName || !startDate || !title) {
        return;
      }

      var startStr = Utilities.formatDate(startDate, tz, 'yyyy-MM-dd');
      var hasEnd = endDate && !isNaN(endDate.getTime());
      var endStr = hasEnd ? Utilities.formatDate(endDate, tz, 'yyyy-MM-dd') : '';
      var dateSegment = hasEnd ? startStr + '/' + endStr : startStr;

      var statusPrefix = completed ? '[x] ' : '[ ] ';
      var tags = [];
      if (categoryTag) tags.push(categoryTag);
      if (priorityTag) tags.push(priorityTag);
      if (statusTag) tags.push(statusTag);

      var emojiPart = emoji ? ' ' + emoji : '';

      var line = dateSegment + ': ' + statusPrefix + title + emojiPart;
      if (tags.length) {
        line += ' ' + tags.join(' ');
      }

      var sectionKey = sectionName;
      if (!sectionsMap[sectionKey]) {
        sectionsMap[sectionKey] = {
          name: sectionName,
          categoryTag: categoryTag,
          color: String(row[2] || '').trim(),
          items: []
        };
      }
      sectionsMap[sectionKey].items.push(line);
    });

    var sectionNames = Object.keys(sectionsMap);
    if (!sectionNames.length) {
      return '# Project Timeline\n\nNo valid rows found. Please ensure start dates and titles are provided.';
    }

    sectionNames.sort(function (a, b) {
      var firstA = sectionsMap[a].items[0];
      var firstB = sectionsMap[b].items[0];
      var dateA = firstA ? firstA.substring(0, 10) : '9999-12-31';
      var dateB = firstB ? firstB.substring(0, 10) : '9999-12-31';
      return dateA.localeCompare(dateB);
    });

    var output = ['# Project Timeline', ''];

    sectionNames.forEach(function (name) {
      var section = sectionsMap[name];
      var headerTokens = ['section ' + section.name];
      if (section.categoryTag) {
        headerTokens.push(section.categoryTag);
      }
      if (section.color) {
        headerTokens.push('color:' + section.color);
      }
      output.push(headerTokens.join(' '));
      section.items.forEach(function (item) {
        output.push(item);
      });
      output.push('endSection', '');
    });

    return output.join('\n');
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
function openTimeline() {
  var ui = SpreadsheetApp.getUi();
  var mode = (getUserProperty(TIMELINE_OPEN_MODE_KEY) || TIMELINE_OPEN_MODES.SIDEBAR);
  
  if (mode === TIMELINE_OPEN_MODES.WEB_APP) {
    // Open Web App in new tab
    var webAppUrl = getWebAppUrl();
    if (webAppUrl) {
      // Try to open in new tab using HTML dialog
      var htmlContent = '<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">' +
        '<h3>📊 Project Timeline - Web App</h3>' +
        '<p>Click the button below to open the timeline in a new tab:</p>' +
        '<button onclick="window.open(\'' + webAppUrl + '\', \'_blank\')" ' +
        'style="background: #4285f4; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; margin: 10px;">' +
        '🚀 Open Timeline in New Tab</button>' +
        '<p style="margin-top: 20px; font-size: 12px; color: #666;">Or copy this URL: <br><code style="background: #f5f5f5; padding: 4px 8px; border-radius: 3px;">' + webAppUrl + '</code></p>' +
        '</div>';
      
      var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
        .setWidth(500)
        .setHeight(300);
      
      ui.showModalDialog(htmlOutput, 'Open Timeline Web App');
    } else {
      ui.alert('Web App not deployed yet. Please use "Deploy Web App" from the menu first.', ui.ButtonSet.OK);
    }
    return;
  }
  
  var template = HtmlService.createTemplateFromFile('index');
  template.base64Data = '';
  var html = template.evaluate()
    .setTitle('Project Timeline')
    .setWidth(1600)
    .setHeight(800)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);

  if (mode === TIMELINE_OPEN_MODES.POPUP) {
    ui.showModalDialog(html, 'Project Timeline');
  } else if (mode === TIMELINE_OPEN_MODES.WINDOW) {
    ui.showModelessDialog(html, 'Project Timeline');
  } else {
    ui.showSidebar(html);
  }
}

/** Add a custom menu */
function onOpen() {
  var ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : DocumentApp.getUi();
  ui.createMenu('Timeline Tool')
    .addItem('Show Timeline', 'openTimeline')
    .addSubMenu(ui.createMenu('Timeline Display Mode')
      .addItem('Sidebar (default)', 'setTimelineModeSidebar')
      .addItem('Popup dialog', 'setTimelineModePopup')
      .addItem('Separate window (non-modal)', 'setTimelineModeWindow')
      .addItem('Web App (separate tab)', 'setTimelineModeWebApp'))
    .addItem('Setup Sample Data', 'setupSampleData')
    .addItem('Test Timeline', 'testTimeline')
    .addItem('Deploy Web App', 'deployWebApp')
    .addToUi();
}


/** Sets up the sheet with sample data */
function setupSampleData() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    
    sheet.clear();

    var headers = [
      ['Section', 'Category Tag', 'Section Color', 'Start Date', 'End Date', 'Task Title', 'Completed', 'Priority Tag', 'Priority Color', 'Status Tag', 'Status Color', 'Emoji']
    ];
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

    var sampleRows = [
      ['UI & Login', '#UI', TAG_COLORS['#UI'], '2025-10-10', '2025-10-11', 'Add logo to login screen', true, '#Low', TAG_COLORS['#Low'], '#Completed', TAG_COLORS['#Completed'], '🖼'],
      ['UI & Login', '#UI', TAG_COLORS['#UI'], '2025-10-12', '2025-10-13', 'Redesign login flow and messages', true, '#Medium', TAG_COLORS['#Medium'], '#Completed', TAG_COLORS['#Completed'], '💻'],
      ['UI & Login', '#UI', TAG_COLORS['#UI'], '2025-10-14', '2025-10-15', 'Add favicon and Open Graph tags', false, '#High', TAG_COLORS['#High'], '', '', '🌐'],

      ['Data Handling', '#Data', TAG_COLORS['#Data'], '2025-10-10', '2025-10-11', 'Optimize CSV loading and date parsing', true, '#High', TAG_COLORS['#High'], '#Completed', TAG_COLORS['#Completed'], '📊'],
      ['Data Handling', '#Data', TAG_COLORS['#Data'], '2025-10-12', '2025-10-13', 'Add progress bar for file uploads', true, '#Low', TAG_COLORS['#Low'], '#Completed', TAG_COLORS['#Completed'], '📈'],
      ['Data Handling', '#Data', TAG_COLORS['#Data'], '2025-10-14', '2025-10-15', 'Add delete option for files and datasets', false, '#Medium', TAG_COLORS['#Medium'], '', '', '🗑'],

      ['Preprocess Module', '#Core', TAG_COLORS['#Core'], '2025-10-11', '2025-10-12', 'Add chart title via JSON', true, '#Medium', TAG_COLORS['#Medium'], '#Completed', TAG_COLORS['#Completed'], '📝'],
      ['Preprocess Module', '#Core', TAG_COLORS['#Core'], '2025-10-13', '2025-10-14', 'Responsive chart fixes', true, '#Medium', TAG_COLORS['#Medium'], '#Completed', TAG_COLORS['#Completed'], '📱'],
      ['Preprocess Module', '#Core', TAG_COLORS['#Core'], '2025-10-15', '2025-10-16', 'Add undo/save-to-database feature', false, '#High', TAG_COLORS['#High'], '', '', '💾'],
      ['Preprocess Module', '#Core', TAG_COLORS['#Core'], '2025-10-17', '2025-10-18', 'Show preprocessing history', false, '#High', TAG_COLORS['#High'], '', '', '🔄'],

      ['Analysis', '#Analysis', TAG_COLORS['#Analysis'], '2025-10-10', '2025-10-12', 'Add date range filters for charts', true, '#Medium', TAG_COLORS['#Medium'], '#Completed', TAG_COLORS['#Completed'], '⏰'],
      ['Analysis', '#Analysis', TAG_COLORS['#Analysis'], '2025-10-13', '2025-10-14', 'Add correlation and trend charts', true, '#High', TAG_COLORS['#High'], '#Completed', TAG_COLORS['#Completed'], '📊'],
      ['Analysis', '#Analysis', TAG_COLORS['#Analysis'], '2025-10-15', '2025-10-16', 'Sync parameters (MD, C, S) across views', false, '#High', TAG_COLORS['#High'], '', '', '🔄'],
      ['Analysis', '#Analysis', TAG_COLORS['#Analysis'], '2025-10-17', '2025-10-18', 'Implement new correlation matrix', false, '#Medium', TAG_COLORS['#Medium'], '', '', '🔢'],

      ['Infrastructure', '#Infrastructure', TAG_COLORS['#Infrastructure'], '2025-10-11', '2025-10-12', 'Add indexed JSON query system', true, '#High', TAG_COLORS['#High'], '#Completed', TAG_COLORS['#Completed'], '🔍'],
      ['Infrastructure', '#Infrastructure', TAG_COLORS['#Infrastructure'], '2025-10-13', '2025-10-14', 'Optimize DB indexing and caching', true, '#High', TAG_COLORS['#High'], '#Completed', TAG_COLORS['#Completed'], '💾'],
      ['Infrastructure', '#Infrastructure', TAG_COLORS['#Infrastructure'], '2025-10-15', '2025-10-16', 'Enable GPU for data analytics', false, '#Medium', TAG_COLORS['#Medium'], '', '', '⚡️'],
      ['Infrastructure', '#Infrastructure', TAG_COLORS['#Infrastructure'], '2025-10-17', '2025-10-18', 'Add environment-specific logging', false, '#Medium', TAG_COLORS['#Medium'], '', '', '📝'],

      ['ML Modeling', '#ML', TAG_COLORS['#ML'], '2025-10-12', '2025-10-13', 'Build parameter selection UI', false, '#High', TAG_COLORS['#High'], '', '', '🎯'],
      ['ML Modeling', '#ML', TAG_COLORS['#ML'], '2025-10-14', '2025-10-15', 'Split data into train/test sets', false, '#High', TAG_COLORS['#High'], '', '', '📊'],
      ['ML Modeling', '#ML', TAG_COLORS['#ML'], '2025-10-16', '2025-10-17', 'Display model performance metrics', false, '#Medium', TAG_COLORS['#Medium'], '', '', '📈'],
      ['ML Modeling', '#ML', TAG_COLORS['#ML'], '2025-10-18', '2025-10-19', 'Save trained models (.pkl & JSON)', false, '#High', TAG_COLORS['#High'], '', '', '💾'],

      ['Dashboard', '#UI', TAG_COLORS['#UI'], '2025-10-14', '2025-10-15', 'Create configuration & upload section', false, '#High', TAG_COLORS['#High'], '', '', '⚙️'],
      ['Dashboard', '#UI', TAG_COLORS['#UI'], '2025-10-16', '2025-10-17', 'Filter data by target MD & C', false, '#High', TAG_COLORS['#High'], '', '', '🔍'],
      ['Dashboard', '#UI', TAG_COLORS['#UI'], '2025-10-18', '2025-10-19', 'Show recommended parameter values', false, '#Medium', TAG_COLORS['#Medium'], '', '', '📊'],
      ['Dashboard', '#UI', TAG_COLORS['#UI'], '2025-10-20', '2025-10-21', 'Final optimization & bug fixes', false, '#High', TAG_COLORS['#High'], '', '', '🐛'],

      ['Documentation', '#Documentation', TAG_COLORS['#Documentation'], '2025-10-22', '2025-10-23', 'Write feature tree documentation', false, '#High', TAG_COLORS['#High'], '', '', '📑'],
      ['Documentation', '#Documentation', TAG_COLORS['#Documentation'], '2025-10-24', '2025-10-25', 'Prepare presentation & deployment notes', false, '#High', TAG_COLORS['#High'], '', '', '📋']
    ];

    sheet.getRange(2, 1, sampleRows.length, headers[0].length).setValues(sampleRows);

    sheet.getRange(1, 1, 1, headers[0].length)
      .setFontWeight('bold')
      .setBackground('#1f1f1f')
      .setFontColor('#ffffff');

    sheet.autoResizeColumns(1, headers[0].length);
    sheet.setFrozenRows(1);

    var descriptionRange = sheet.getRange(1, headers[0].length + 2, 1, 2);
    descriptionRange.setValues([['Legend Tag', 'Color Hex']]);
    descriptionRange.setFontWeight('bold');

    var legendEntries = Object.keys(TAG_COLORS).map(function (tag) {
      return [tag, TAG_COLORS[tag]];
    });

    sheet.getRange(2, headers[0].length + 2, legendEntries.length, 2).setValues(legendEntries);

    legendEntries.forEach(function (entry, index) {
      var rowIndex = index + 2;
      var colorCell = sheet.getRange(rowIndex, headers[0].length + 3);
      colorCell.setBackground(entry[1]);
    });

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

/** Web App functions for separate tab functionality */
function doGet() {
  var template = HtmlService.createTemplateFromFile('webapp');
  template.base64Data = '';
  return template.evaluate()
    .setTitle('Project Timeline - Web App')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function getWebAppUrl() {
  try {
    var scriptId = ScriptApp.getScriptId();
    var deployments = ScriptApp.getScript(scriptId).getDeployments();
    
    for (var i = 0; i < deployments.length; i++) {
      var deployment = deployments[i];
      if (deployment.getEntryPoint() === 'doGet') {
        return deployment.getWebAppUrl();
      }
    }
    return null;
  } catch (error) {
    logClient('getWebAppUrl', 'Error: ' + error.message);
    return null;
  }
}

function deployWebApp() {
  try {
    var scriptId = ScriptApp.getScriptId();
    var script = ScriptApp.getScript(scriptId);
    
    // Check if deployment already exists
    var deployments = script.getDeployments();
    var existingDeployment = null;
    
    for (var i = 0; i < deployments.length; i++) {
      var deployment = deployments[i];
      if (deployment.getEntryPoint() === 'doGet') {
        existingDeployment = deployment;
        break;
      }
    }
    
    if (existingDeployment) {
      // Update existing deployment
      existingDeployment.update();
      var url = existingDeployment.getWebAppUrl();
      SpreadsheetApp.getUi().alert('Web App updated successfully!\n\nURL: ' + url + '\n\nYou can now use "Web App (separate tab)" mode.');
    } else {
      // Create new deployment
      var deployment = script.deployAsWebApp()
        .setDescription('Timeline Web App')
        .setExecuteAs(ScriptApp.ExecutionType.USER_DEPLOYING)
        .setAccess(ScriptApp.Access.ANYONE);
      
      var url = deployment.getWebAppUrl();
      SpreadsheetApp.getUi().alert('Web App deployed successfully!\n\nURL: ' + url + '\n\nYou can now use "Web App (separate tab)" mode.');
    }
    
    logClient('deployWebApp', 'Web App deployed successfully');
    return true;
  } catch (error) {
    logClient('deployWebApp', 'Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Deployment failed: ' + error.message);
    return false;
  }
}
