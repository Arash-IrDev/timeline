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

/** Returns the JS bundle (stored inside bundle_text.html) as Base64 */
function getBundleBase64() {
  // Read the HTML file that stores the bundle as JSON (script-tagged)
  var html = HtmlService.createHtmlOutputFromFile('bundle_text').getContent();

  // Extract the content inside <script id="bundle-text" type="application/json"> ... </script>
  var m = html.match(/<script[^>]*id=["']bundle-text["'][^>]*>([\s\S]*?)<\/script>/i);
  var js = m ? m[1] : '';

  // Strip sourceMappingURL lines (they can be gigantic and useless in GAS)
  js = js.replace(/\/\/# sourceMappingURL=.*?(\r?\n|$)/, '');

  return Utilities.base64Encode(js);
}

function getMarkwhenRawText() {
    return `
      # Sample Timeline

      ## 2024
      - January 15: Project Kickoff
      - February 10: First Milestone
      - March 5: Design Review
      - April 20: Development Phase
      - May 15: Testing Phase
      - June 30: Project Completion

      ## 2025
      - January 1: New Year Planning
      - February 14: Valentine's Day
      - March 20: Spring Equinox
      - June 21: Summer Solstice
      - September 22: Autumn Equinox
      - December 21: Winter Solstice
      `;
  }

/** Show the sidebar */
function showSidebar() {
  // Build the Base64 payload for timeline raw text
  var uri = getMarkwhenRawText();              // encodeURIComponent(rawText)
  var b64 = Utilities.base64Encode(uri);       // Base64 of the URI-encoded string

  var t = HtmlService.createTemplateFromFile('index');
  t.base64Data = b64;

  var out = t.evaluate()
    .setTitle('Project Timeline')
    .setWidth(650);

  SpreadsheetApp.getUi().showSidebar(out);
}

/** Add a custom menu */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Timeline Tool')
    .addItem('Show Timeline', 'showSidebar')
    .addToUi();
}