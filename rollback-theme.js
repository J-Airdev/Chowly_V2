import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cssBak = path.join(__dirname, 'public', 'css', 'styles.css.bak');
const cssActive = path.join(__dirname, 'public', 'css', 'styles.css');
const jsBak = path.join(__dirname, 'public', 'js', 'app.js.bak');
const jsActive = path.join(__dirname, 'public', 'js', 'app.js');

if (fs.existsSync(cssBak) && fs.existsSync(jsBak)) {
  fs.copyFileSync(cssBak, cssActive);
  fs.copyFileSync(jsBak, jsActive);
  console.log('✅ Successfully rolled back to previous styling!');
} else {
  console.error('❌ Backup files not found.');
}
