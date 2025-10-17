#!/usr/bin/env node

/**
 * Copy built files to GAS folder
 * Copies JavaScript and CSS bundles from dist/ to GAS/ folder
 */

const fs = require('fs');
const path = require('path');

const GAS_FOLDER = './GAS';
const DIST_FOLDER = './dist';

function copyBundleFiles() {
  console.log('🚀 Copying bundle files from dist/ to GAS/...\n');
  
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
  
  // Copy JavaScript bundle
  try {
    const jsSource = path.join(DIST_FOLDER, 'markwhen-timeline.iife.js');
    const jsDest = path.join(GAS_FOLDER, 'bundle_text.html');
    
    if (!fs.existsSync(jsSource)) {
      console.error('❌ JavaScript bundle not found:', jsSource);
      return false;
    }
    
    const jsContent = fs.readFileSync(jsSource, 'utf8');
    const jsWrapped = `<!-- File: bundle_text.html -->
<script type="application/json" id="bundle-text">
  /* paste the FULL JS bundle here, exactly as built (IIFE, ES2017) */
  /* no HTML comments outside this tag */
  ${jsContent}
</script>`;
    
    fs.writeFileSync(jsDest, jsWrapped, 'utf8');
    console.log('✅ Copied markwhen-timeline.iife.js to bundle_text.html');
    successCount++;
  } catch (error) {
    console.error('❌ Error copying JavaScript bundle:', error.message);
  }
  
  // Copy CSS bundle
  try {
    const cssSource = path.join(DIST_FOLDER, 'style.css');
    const cssDest = path.join(GAS_FOLDER, 'styles.html');
    
    if (!fs.existsSync(cssSource)) {
      console.error('❌ CSS bundle not found:', cssSource);
      return false;
    }
    
    const cssContent = fs.readFileSync(cssSource, 'utf8');
    const cssWrapped = `<!-- File: styles.html -->
<style>
/* whole css bundle will be placed here */
${cssContent}
</style>`;
    
    fs.writeFileSync(cssDest, cssWrapped, 'utf8');
    console.log('✅ Copied style.css to styles.html');
    successCount++;
  } catch (error) {
    console.error('❌ Error copying CSS bundle:', error.message);
  }
  
  return successCount === 2;
}

function main() {
  if (copyBundleFiles()) {
    console.log('\n🎉 Bundle files updated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Copy the contents of GAS/bundle_text.html to your Google Apps Script project');
    console.log('2. Copy the contents of GAS/styles.html to your Google Apps Script project');
    console.log('3. Test your timeline in Google Apps Script');
  } else {
    console.log('❌ Failed to copy bundle files.');
    process.exit(1);
  }
}

main();