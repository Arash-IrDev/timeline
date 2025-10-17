# Markwhen Timeline - Google Apps Script Integration

This folder contains all files needed to integrate the Markwhen Timeline with Google Apps Script.

## Quick Start

### 1. Build and Update Bundle
```bash
npm run build:gas:copy
```

### 2. Copy Files to Google Apps Script
Copy these files to your Google Apps Script project:
- `Code.gs` → Google Apps Script
- `index.html` → Google Apps Script  
- `bundle_text.html` → Google Apps Script
- `styles.html` → Google Apps Script

### 3. Test in Google Sheets
1. Refresh your Google Sheet
2. Use "Timeline Tool" menu
3. Click "Test Timeline" to verify setup
4. Click "Show Timeline" to display timeline

## Files Overview

### Core Files
- **`Code.gs`** - Main Google Apps Script functions
- **`index.html`** - Web interface for testing

### Generated Files (Auto-updated)
- **`bundle_text.html`** - JavaScript bundle (IIFE format)
- **`styles.html`** - CSS styles

## Development Workflow

### After Code Changes
1. Run `npm run build:gas:copy`
2. Copy updated `bundle_text.html` and `styles.html` to Google Apps Script
3. Test in Google Sheets

### Available Commands
- `npm run build:gas` - Build for GAS (ES2017, IIFE)
- `npm run build:gas:copy` - Build and copy to GAS folder
- `node copy-to-gas.js` - Copy bundle files only

## Data Format

Your Google Sheet should have:
- **Column A**: Task/Event name
- **Column B**: Start date (YYYY-MM-DD format)
- **Column C**: End date (optional, YYYY-MM-DD format)

## Features

- ✅ Custom "Timeline Tool" menu in Google Sheets
- ✅ Automatic data parsing from sheets
- ✅ Interactive timeline visualization
- ✅ Support for date ranges and single events
- ✅ Automatic section grouping by year
- ✅ Sample data for testing
- ✅ Error handling and status reporting

## Troubleshooting

### Timeline Not Loading
1. Check browser console (F12) for errors
2. Verify all files are copied correctly
3. Use "Test Timeline" from the menu
4. Check execution logs in Google Apps Script

### Data Not Showing
1. Verify date formats (YYYY-MM-DD)
2. Check that sheet has data in correct columns
3. Use "Setup Sample Data" to test

### Bundle Update Issues
1. Run `npm run build:gas:copy`
2. Copy updated files to Google Apps Script
3. Refresh Google Sheet

## Technical Details

- **Target**: ES2017 (Google Apps Script compatible)
- **Format**: IIFE (Immediately Invoked Function Expression)
- **Bundle Size**: ~864KB (gzipped: ~221KB)
- **Dependencies**: All bundled, no external dependencies
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Support

For issues:
- **Timeline functionality**: Check main project documentation
- **Google Apps Script integration**: Check this README
- **Data parsing**: Use "Test Timeline" menu option
- **Build issues**: Check console output and logs