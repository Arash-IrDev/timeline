#!/usr/bin/env node

/**
 * Script to copy built files to GAS folder
 * This script copies the built JavaScript and CSS files to the GAS folder
 * for easy integration with Google Apps Script
 */

const fs = require('fs');
const path = require('path');

const GAS_FOLDER = './GAS';
const DIST_FOLDER = './dist';

// Files to copy
const filesToCopy = [
  {
    source: 'markwhen-timeline.iife.js',
    destination: 'bundle_text.html',
    wrapper: (content) => `<!-- File: bundle_text.html -->
<script type="application/json" id="bundle-text">
  /* paste the FULL JS bundle here, exactly as built (IIFE, ES2017) */
  /* no HTML comments outside this tag */
  ${content}
</script>`
  },
  {
    source: 'style.css',
    destination: 'styles.html',
    wrapper: (content) => `<!-- File: styles.html -->
<style>
/* whole css bundle will be placed here */
${content}
</style>`
  }
];

function copyFile(sourceFile, destFile, wrapper) {
  const sourcePath = path.join(DIST_FOLDER, sourceFile);
  const destPath = path.join(GAS_FOLDER, destFile);
  
  try {
    if (!fs.existsSync(sourcePath)) {
      console.error(`Source file not found: ${sourcePath}`);
      return false;
    }
    
    const content = fs.readFileSync(sourcePath, 'utf8');
    const wrappedContent = wrapper(content);
    
    fs.writeFileSync(destPath, wrappedContent, 'utf8');
    console.log(`✅ Copied ${sourceFile} to ${destFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Error copying ${sourceFile}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Copying files to GAS folder...\n');
  
  // Check if dist folder exists
  if (!fs.existsSync(DIST_FOLDER)) {
    console.error('❌ Dist folder not found. Please run "npm run build:gas" first.');
    process.exit(1);
  }
  
  // Check if GAS folder exists
  if (!fs.existsSync(GAS_FOLDER)) {
    console.error('❌ GAS folder not found.');
    process.exit(1);
  }
  
  let successCount = 0;
  
  filesToCopy.forEach(({ source, destination, wrapper }) => {
    if (copyFile(source, destination, wrapper)) {
      successCount++;
    }
  });
  
  console.log(`\n📊 Summary: ${successCount}/${filesToCopy.length} files copied successfully`);
  
  if (successCount === filesToCopy.length) {
    console.log('🎉 All files copied successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Copy the contents of GAS/Code.gs to your Google Apps Script project');
    console.log('2. Copy the contents of GAS/SheetData.gs to your Google Apps Script project');
    console.log('3. Copy the contents of GAS/index.html to your Google Apps Script project');
    console.log('4. Copy the contents of GAS/bundle_text.html to your Google Apps Script project');
    console.log('5. Copy the contents of GAS/styles.html to your Google Apps Script project');
    console.log('6. Run the showTimeline() function in your Google Apps Script project');
  } else {
    console.log('⚠️  Some files failed to copy. Please check the errors above.');
    process.exit(1);
  }
}

main();
