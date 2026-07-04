const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'backend', 'routes');
const filesToProcess = ['auth.js', 'startups.js', 'ai.js', 'messages.js', 'posts.js'];

filesToProcess.forEach(file => {
  const filePath = path.join(routesDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Pattern 1: `/uploads/.../${req.file.filename}` -> req.file.path
  // Using a regex that matches backticks around /uploads/.../${...filename}
  content = content.replace(/`\/uploads\/[a-zA-Z0-9_-]+\/\$\{req\.file\.filename\}`/g, 'req.file.path');

  // Pattern 2: `/uploads/.../${f.filename}` -> f.path
  content = content.replace(/`\/uploads\/[a-zA-Z0-9_-]+\/\$\{f\.filename\}`/g, 'f.path');

  // Pattern 3: `/uploads/.../${req.files['fieldName'][0].filename}` -> req.files['fieldName'][0].path
  // e.g. `/uploads/images/${req.files['logo'][0].filename}`
  content = content.replace(/`\/uploads\/[a-zA-Z0-9_-]+\/\$\{req\.files\['([a-zA-Z0-9_-]+)'\]\[0\]\.filename\}`/g, "req.files['$1'][0].path");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated paths in ${file}`);
  } else {
    console.log(`No paths updated in ${file}`);
  }
});
