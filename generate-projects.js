/* ------------------------------------------------------------------
   Scans this folder for subfolders containing an index.html,
   then writes projects.json.

   Run it after adding a new project:
       node generate-projects.js
------------------------------------------------------------------ */

const fs = require('fs');
const path = require('path');

const root = __dirname;
const IGNORE = ['node_modules', '.git', '.github', 'assets', 'images', 'img'];

function titleCase(folderName) {
  return folderName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const projects = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => !entry.name.startsWith('.'))
  .filter((entry) => !IGNORE.includes(entry.name))
  .filter((entry) => fs.existsSync(path.join(root, entry.name, 'index.html')))
  .map((entry) => {
    const files = fs
      .readdirSync(path.join(root, entry.name))
      .filter((file) => /\.(html|css|js|json|md)$/i.test(file))
      .sort((a, b) => {
        // index.html first, then the rest alphabetically
        if (a === 'index.html') return -1;
        if (b === 'index.html') return 1;
        return a.localeCompare(b);
      });

    return {
      name: titleCase(entry.name),
      path: entry.name,
      files
    };
  });

fs.writeFileSync(
  path.join(root, 'projects.json'),
  JSON.stringify(projects, null, 2) + '\n'
);

console.log(`Wrote projects.json with ${projects.length} project(s):`);
projects.forEach((p) => console.log(`  ${p.path} (${p.files.length} files)`));