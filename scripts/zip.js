/**
 * ShadowQuant Dynamics – ITMS ZIP Packager Script
 * Natively bundles the production codebase into a ZIP file on Windows
 */
const { exec } = require('child_process');
const path = require('path');

console.log('📦 Packaging production codebase into shadowquant-itms-production.zip...');

const cmd = `powershell -Command "Get-ChildItem -Exclude 'node_modules', 'shadowquant-itms-production.zip', '.git', 'logs' | Compress-Archive -DestinationPath shadowquant-itms-production.zip -Force"`;

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error('❌ ZIP packaging failed:', err.message || stderr);
    process.exit(1);
  }
  console.log('✅ shadowquant-itms-production.zip created successfully in the project root folder! 🎁');
  console.log('🚀 Ready to be deployed as a premium enterprise SaaS!');
});
