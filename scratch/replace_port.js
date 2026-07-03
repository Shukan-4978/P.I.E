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

const replaceInFile = (filePath, searchValue, replaceValue) => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(searchValue)) {
    // Basic replaceAll is available in Node 20
    const newContent = content.replaceAll(searchValue, replaceValue);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
};

const replaceRegexInFile = (filePath, regex, replaceValue) => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (regex.test(content)) {
    const newContent = content.replace(regex, replaceValue);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath} using regex`);
  }
};

const main = () => {
  const rootDir = 'c:\\Users\\lenovo\\OneDrive\\Desktop\\8th\\pie-platform';
  
  // 1. Replace http://localhost:5000 with http://localhost:1110 in frontend src
  walk(path.join(rootDir, 'frontend', 'src'), (err, files) => {
    if (err) throw err;
    files.forEach(file => {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        replaceInFile(file, 'http://localhost:5000', 'http://localhost:1110');
      }
    });
  });

  // 2. Replace 5000 with 1110 in docker-compose.yml
  const composePath = path.join(rootDir, 'docker-compose.yml');
  replaceRegexInFile(composePath, /\b5000\b/g, '1110');

  // 3. Replace 5000 with 1110 in frontend/nginx.conf
  const nginxPath = path.join(rootDir, 'frontend', 'nginx.conf');
  replaceRegexInFile(nginxPath, /\b5000\b/g, '1110');

  // 4. Replace 5000 with 1110 in backend/Dockerfile
  const dockerfilePath = path.join(rootDir, 'backend', 'Dockerfile');
  replaceRegexInFile(dockerfilePath, /\b5000\b/g, '1110');

  // 5. Replace 5000 with 1110 in backend/server.js
  const serverJsPath = path.join(rootDir, 'backend', 'server.js');
  replaceRegexInFile(serverJsPath, /\b5000\b/g, '1110');
  
  console.log('All replacements completed successfully.');
};

main();
