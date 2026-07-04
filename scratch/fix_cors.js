const fs = require('fs');
const path = require('path');

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const replaceRegexInFile = (filePath, regex, replaceValue) => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (regex.test(content)) {
    const newContent = content.replace(regex, replaceValue);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
};

const main = () => {
  const rootDir = 'c:\\Users\\lenovo\\OneDrive\\Desktop\\8th\\pie-platform';
  
  walk(path.join(rootDir, 'frontend', 'src'), (err, files) => {
    if (err) throw err;
    files.forEach(file => {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        // Replace http://localhost:1110 with empty string to use relative URLs
        replaceRegexInFile(file, /http:\/\/localhost:1110/g, '');
      }
    });
  });
  
  // Specific fix for api.js since it had 'http://localhost:1110/api'
  // Actually, the regex above will make it '/api', which is PERFECT!
  
  // Also fix socket.js (it had 'http://localhost:1110' which becomes '')
  // Socket.io defaults to window.location when url is empty or undefined, which is also PERFECT!
  
  console.log('All frontend hardcoded hosts removed successfully.');
};

main();
