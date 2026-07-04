const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(adminDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const addImport = () => {
    if (!content.includes('import PieLoader')) {
      content = `import PieLoader from '../../components/common/PieLoader';\n` + content;
    }
  };

  // 1. Grid skeleton loaders (AdminStartups, AdminInvestments)
  const regexGrid = /\{loading \?\s*\(\s*<div[^>]*>[\s\S]*?className="skeleton"[\s\S]*?<\/div>\s*\)\s*:\s*(?:startups|investments|reports|payments)\.length/g;
  if (regexGrid.test(content)) {
    addImport();
    content = content.replace(regexGrid, (match) => {
      const arrayName = match.split(': ')[1].split('.')[0];
      return `{loading ? (<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><PieLoader /></div>) : ${arrayName}.length`;
    });
    modified = true;
  }

  // 2. Any remaining table skeleton loaders (array map to <tr>)
  const regexTable = /\{loading \?\s*\(\s*\[1,2,3,4,5\]\.map\(i => \([\s\S]*?<\/tr>[\s\S]*?\)\)\s*\)\s*:/g;
  if (regexTable.test(content)) {
    addImport();
    content = content.replace(regexTable, `{loading ? (<tr><td colSpan="8" style={{ padding: '4rem 0' }}><PieLoader /></td></tr>) : `);
    modified = true;
  }
  
  // 3. AdminReports and AdminPayments which use skeleton tables maybe? Let's catch any `{loading ? ( ... <div className="skeleton" ... ) : `
  const regexAnySkeleton = /\{loading \?\s*\([\s\S]*?className="skeleton"[\s\S]*?\)\s*:\s*(?:reports|payments)\.length/g;
  if (regexAnySkeleton.test(content)) {
      addImport();
      content = content.replace(regexAnySkeleton, (match) => {
          const arrayName = match.split(': ')[1].split('.')[0];
          return `{loading ? (<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><PieLoader /></div>) : ${arrayName}.length`;
      });
      modified = true;
  }

  // 4. Any `loader-spin` blocks
  const regexDivLoading = /\{loading \?\s*\([\s\S]*?className="loader-spin"[\s\S]*?\)\s*:\s*/g;
  if (regexDivLoading.test(content)) {
    addImport();
    content = content.replace(regexDivLoading, `{loading ? (<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><PieLoader /></div>) : `);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated loaders in ${file}`);
  }
});
