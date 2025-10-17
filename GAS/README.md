# Markwhen Timeline - Google Apps Script Integration

This folder contains all the necessary files to integrate the Markwhen Timeline with Google Apps Script.

## Files Overview

### Core Files
- **`Code.gs`** - Main Google Apps Script functions (includes all functionality)
- **`index.html`** - Web interface for testing and managing the timeline

### Generated Files (Auto-updated)
- **`bundle_text.html`** - Contains the compiled JavaScript bundle (IIFE format)
- **`styles.html`** - Contains the compiled CSS styles

## Setup Instructions

### 1. Create a New Google Apps Script Project
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Delete the default `Code.gs` content

### 2. Copy Files to Your Project
Copy the contents of each file to your Google Apps Script project:

1. **Code.gs** - Copy the entire content (this includes all functions)
2. **index.html** - Copy the entire content
3. **bundle_text.html** - Copy the entire content (this contains the JavaScript bundle)
4. **styles.html** - Copy the entire content (this contains the CSS)

### 3. Set Up Your Google Sheet
1. Create a new Google Sheet
2. Add the following columns in row 1:
   - Column A: "Task"
   - Column B: "Start Date" 
   - Column C: "End Date" (optional)
3. Add your timeline data in the following format:
   - Task names in Column A
   - Start dates in Column B (YYYY-MM-DD format)
   - End dates in Column C (optional, for date ranges)

### 4. Test the Integration
1. **Refresh your Google Sheet** - The "Timeline Tool" menu should appear
2. **Use the menu** - Click "Timeline Tool" > "Setup Sample Data" to add sample data
3. **Show timeline** - Click "Timeline Tool" > "Show Timeline" to display the timeline
4. **Test functionality** - Click "Timeline Tool" > "Test Timeline" to verify everything works

## Available Functions

### Menu Functions (Available in Google Sheet)
- **"Show Timeline"** - Displays the timeline in a sidebar
- **"Setup Sample Data"** - Adds sample timeline data to your sheet
- **"Test Timeline"** - Tests the timeline setup and returns status

### Core Functions (in Code.gs)
- **`getMarkwhenRawText()`** - Reads data from the sheet and converts to Markwhen format
- **`parseMarkwhenText(rawText)`** - Parses Markwhen text into timeline data structure
- **`createTimelineHTML(parsedData)`** - Creates the HTML output for the timeline
- **`openSidebar()`** - Opens the sidebar with the timeline
- **`onOpen()`** - Creates the custom menu when the sheet opens

## Data Format

The timeline expects data in this format:

```
# Project Timeline

## 2024
- 2024-01-15: Project Kickoff
- 2024-02-10: First Milestone
- 2024-04-20 ~ 2024-05-14: Development Phase

## 2025
- 2025-01-01: New Year Planning
- 2025-06-21: Summer Solstice
```

## Features

- ✅ **Custom Menu** - "Timeline Tool" menu appears in your Google Sheet
- ✅ **Automatic Data Parsing** - Reads data from your sheet and converts to timeline format
- ✅ **Interactive Timeline** - Full Markwhen timeline functionality
- ✅ **Date Range Support** - Supports both single dates and date ranges
- ✅ **Section Grouping** - Automatically groups events by year
- ✅ **Sample Data** - Easy setup with sample data
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Status Reporting** - Visual feedback for all operations

## Troubleshooting

### Common Issues

1. **Menu doesn't appear**
   - Refresh your Google Sheet
   - Make sure `onOpen()` function is in your Code.gs
   - Check the execution logs for errors

2. **Timeline doesn't load**
   - Check the browser console for errors
   - Ensure all files are copied correctly
   - Verify the data format in your sheet

3. **Data not showing**
   - Run "Test Timeline" from the menu
   - Verify date formats are correct (YYYY-MM-DD)
   - Check that your sheet has data in the correct columns

4. **JavaScript errors**
   - The bundle is built for ES2017 compatibility
   - All Node.js globals are replaced with browser-compatible versions
   - RegExp patterns are transpiled for compatibility

### Debugging

1. **Use the menu** - "Test Timeline" provides detailed status information
2. **Check logs** - Use `logClient()` function for detailed logging
3. **Browser console** - Check for JavaScript errors in the sidebar
4. **Execution logs** - Check Google Apps Script execution logs

## Updating the Bundle

When you make changes to the timeline code:

1. Run `npm run build:gas:copy` in the project root
2. Copy the updated content from `bundle_text.html` and `styles.html`
3. Paste the new content into your Google Apps Script project

## Technical Details

- **Target**: ES2017 (compatible with Google Apps Script)
- **Format**: IIFE (Immediately Invoked Function Expression)
- **Bundle Size**: ~864KB (gzipped: ~221KB)
- **Dependencies**: All bundled, no external dependencies required
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Menu Integration**: Custom menu appears automatically when sheet opens
- **Data Source**: Reads directly from Google Sheets
- **Logging**: Client-side logging integrated with Apps Script Logger

## Support

For issues related to:
- **Timeline functionality**: Check the main project documentation
- **Google Apps Script integration**: Check this README and the code comments
- **Data parsing**: Use the "Test Timeline" menu option for debugging
- **Menu issues**: Check the `onOpen()` function and execution logs