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
  `
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return encodeURIComponent('');

  const rng = sheet.getRange(2, 1, lastRow - 1, 3);
  const vals = rng.getValues();
  const tz = Session.getScriptTimeZone();

  const lines = vals.map(r => {
    const task = (r[0] || '').toString().trim();
    const s = new Date(r[1]);
    const e = new Date(r[2]);
    if (!task || isNaN(s.getTime())) return null;
    const sStr = Utilities.formatDate(s, tz, 'yyyy-MM-dd');
    if (!isNaN(e.getTime())) {
      const eStr = Utilities.formatDate(e, tz, 'yyyy-MM-dd');
      return `${sStr} - ${eStr}: ${task}`;
    }
    return `${sStr}: ${task}`;
  }).filter(Boolean);

  return encodeURIComponent(lines.join('\n'));
}