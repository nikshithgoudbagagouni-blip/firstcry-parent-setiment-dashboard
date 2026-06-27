const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\x1b[36m%s\x1b[0m', '🔍 Starting Render Pre-Flight Checks...');

let hasErrors = false;

function assertCheck(name, condition, errorMessage) {
  if (condition) {
    console.log(`\x1b[32m%s\x1b[0m`, `✅ [PASS] ${name}`);
  } else {
    console.log(`\x1b[31m%s\x1b[0m`, `❌ [FAIL] ${name}: ${errorMessage}`);
    hasErrors = true;
  }
}

// 1. File Existence Checks
assertCheck('Root package.json exists', fs.existsSync('package.json'), 'Root package.json is missing!');
assertCheck('Backend package.json exists', fs.existsSync(path.join('backend', 'package.json')), 'Backend package.json is missing!');
assertCheck('Frontend package.json exists', fs.existsSync(path.join('frontend', 'package.json')), 'Frontend package.json is missing!');
assertCheck('Render Blueprint render.yaml exists', fs.existsSync('render.yaml'), 'render.yaml Blueprint is missing!');

// 2. Script Validations
if (fs.existsSync(path.join('backend', 'package.json'))) {
  try {
    const backendPkg = JSON.parse(fs.readFileSync(path.join('backend', 'package.json'), 'utf8'));
    const hasStart = backendPkg.scripts && backendPkg.scripts.start;
    assertCheck("Backend package.json has 'start' script", !!hasStart, "Backend start script is missing in package.json!");
  } catch (err) {
    assertCheck("Backend package.json is valid JSON", false, `Failed to parse backend package.json: ${err.message}`);
  }
}

if (fs.existsSync(path.join('frontend', 'package.json'))) {
  try {
    const frontendPkg = JSON.parse(fs.readFileSync(path.join('frontend', 'package.json'), 'utf8'));
    const hasBuild = frontendPkg.scripts && frontendPkg.scripts.build;
    assertCheck("Frontend package.json has 'build' script", !!hasBuild, "Frontend build script is missing in package.json!");
  } catch (err) {
    assertCheck("Frontend package.json is valid JSON", false, `Failed to parse frontend package.json: ${err.message}`);
  }
}

// 3. Port & Host Binding Checks
const serverJsPath = path.join('backend', 'server.js');
if (fs.existsSync(serverJsPath)) {
  const serverContent = fs.readFileSync(serverJsPath, 'utf8');

  // Check process.env.PORT
  const usesEnvPort = serverContent.includes('process.env.PORT');
  assertCheck(
    'Server binds to process.env.PORT',
    usesEnvPort,
    'backend/server.js must bind to process.env.PORT to allow Render to dynamically assign routing ports.'
  );

  // Check if server forces localhost binding
  const bindsToLocalhost = /listen\([^)]*(localhost|127\.0\.0\.1)/i.test(serverContent);
  assertCheck(
    'Server does not restrict to localhost/127.0.0.1',
    !bindsToLocalhost,
    'backend/server.js appears to bind specifically to localhost or 127.0.0.1, which will block Render port scans. Remove local IP arguments from app.listen().'
  );
}

// 4. Compilation Verification
if (!hasErrors) {
  console.log('\x1b[33m%s\x1b[0m', '🏗️  Running local build verification...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    assertCheck('Project compiles successfully', true, '');
  } catch (error) {
    assertCheck('Project compiles successfully', false, 'The compilation command "npm run build" failed.');
  }
} else {
  console.log('\x1b[33m%s\x1b[0m', '⚠️ Skipping build checks because static configuration errors were found.');
}

console.log('\x1b[36m%s\x1b[0m', '-------------------------------------------');
if (hasErrors) {
  console.log('\x1b[31m%s\x1b[0m', '🚨 Pre-flight validation failed! Fix the errors above before pushing.');
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', '🎉 Pre-flight checks passed! Your codebase is ready for Render.com deployment.');
  process.exit(0);
}
