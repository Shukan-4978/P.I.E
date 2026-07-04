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

      // Ensure PieLoader import exists if we're going to use it
      const addImport = () => {
        if (!content.includes('import PieLoader')) {
          // Calculate relative path to components/common/PieLoader
          const relPath = path.relative(path.dirname(file), path.join(__dirname, '..', 'frontend', 'src', 'components', 'common', 'PieLoader')).replace(/\\/g, '/');
          content = `import PieLoader from '${relPath}';\n` + content;
        }
      };

      // 1. One-line loader-spin
      const regex1 = /if\s*\(loading\)\s*return\s*<div.*?<div className="loader-spin" \/><\/div>;/g;
      if (regex1.test(content)) {
        addImport();
        content = content.replace(regex1, 'if (loading) return <PieLoader />;');
        modified = true;
      }

      // 2. Feed.jsx specific loading
      const regex2 = /if\s*\(loading\)\s*return\s*\([\s\S]*?Loading your feed...[\s\S]*?\);/g;
      if (regex2.test(content)) {
        addImport();
        content = content.replace(regex2, 'if (loading) return <PieLoader />;');
        modified = true;
      }

      // 3. StartupProfile.jsx specific loading
      const regex3 = /if\s*\(loading\)\s*return\s*\([\s\S]*?<motion\.div[\s\S]*?borderTopColor: '#6366f1' \}\}[\s\S]*?\/>[\s\S]*?<\/div>[\s\S]*?\);/g;
      if (regex3.test(content)) {
        addImport();
        content = content.replace(regex3, 'if (loading) return <PieLoader />;');
        modified = true;
      }

      // 4. AdminDashboard.jsx loading
      const regex4 = /if\s*\(loading\)\s*\{\s*return <div.*?>Loading dashboard...<\/div>;\s*\}/g;
      if (regex4.test(content)) {
        addImport();
        content = content.replace(regex4, 'if (loading) return <PieLoader />;');
        modified = true;
      }

      // 5. Explore.jsx loading (inside JSX)
      const regex5 = /\{loading \|\| matchingLoading \? \(\s*<div.*?>\s*<div className="loader-spin" \/>\s*<\/div>\s*\) : \(/g;
      if (regex5.test(content)) {
        addImport();
        content = content.replace(regex5, '{loading || matchingLoading ? <PieLoader /> : (');
        modified = true;
      }

      // 6. Investor/MyInvestments.jsx loading
      const regex6 = /if\s*\(loading\)\s*return\s*\([\s\S]*?Loading your portfolio...[\s\S]*?\);/g;
      if (regex6.test(content)) {
        addImport();
        content = content.replace(regex6, 'if (loading) return <PieLoader />;');
        modified = true;
      }

      // 7. EditStartup.jsx fetching loader
      const regex7 = /if\s*\(fetching\)\s*return\s*<div.*?<div className="loader-spin" \/><\/div>;/g;
      if (regex7.test(content)) {
        addImport();
        content = content.replace(regex7, 'if (fetching) return <PieLoader />;');
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
