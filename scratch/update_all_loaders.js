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

const pagesDir = path.join(__dirname, '..', 'frontend', 'src', 'pages');

walk(pagesDir, (err, files) => {
  if (err) throw err;

  files.forEach(file => {
    if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      const addImport = () => {
        if (!content.includes('import PieLoader')) {
          const relPath = path.relative(path.dirname(file), path.join(__dirname, '..', 'frontend', 'src', 'components', 'common', 'PieLoader')).replace(/\\/g, '/');
          content = `import PieLoader from '${relPath}';\n` + content;
        }
      };

      // 1. Replace block loaders in Admin pages and similar:
      // {loading ? ( <div...> ... </div> ) : (
      // We will match `{loading ? (` followed by anything up to `) : (` that contains `loader-spin`
      
      const regexAdminLoader = /\{loading \?\s*\([\s\S]*?<div[^>]*className="loader-spin"[^>]*>[\s\S]*?<\/div>[\s\S]*?\)\s*:\s*\(/g;
      if (regexAdminLoader.test(content)) {
        addImport();
        content = content.replace(regexAdminLoader, '{loading ? (<PieLoader />) : (');
        modified = true;
      }
      
      // 2. Also check for `isLoading ?`
      const regexAdminIsLoader = /\{isLoading \?\s*\([\s\S]*?<div[^>]*className="loader-spin"[^>]*>[\s\S]*?<\/div>[\s\S]*?\)\s*:\s*\(/g;
      if (regexAdminIsLoader.test(content)) {
        addImport();
        content = content.replace(regexAdminIsLoader, '{isLoading ? (<PieLoader />) : (');
        modified = true;
      }
      
      // 3. AIAnalysis loadingAnalyses
      const regexAI = /\{loadingAnalyses \?\s*\([\s\S]*?<div[^>]*className="loader-spin"[^>]*>[\s\S]*?<\/div>[\s\S]*?\)\s*:\s*\(/g;
      if (regexAI.test(content)) {
         addImport();
         content = content.replace(regexAI, '{loadingAnalyses ? (<PieLoader />) : (');
         modified = true;
      }

      // 4. Any top level `if (loading) return (` block that contains a loader-spin
      const regexIfLoading = /if\s*\(loading\)\s*return\s*\([\s\S]*?<div[^>]*className="loader-spin"[^>]*>[\s\S]*?<\/div>[\s\S]*?\);/g;
      if (regexIfLoading.test(content)) {
        addImport();
        content = content.replace(regexIfLoading, 'if (loading) return <PieLoader />;');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated loaders in ${file}`);
      }
    }
  });
  console.log('Loader replacement complete.');
});
