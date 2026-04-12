import fs from 'fs';
import path from 'path';

// Regex para coincidir con casi cualquier emoji
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F201}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F18E}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.vue')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      let foundInFile = false;
      
      lines.forEach((line, index) => {
        const matches = line.match(emojiRegex);
        if (matches) {
          if (!foundInFile) {
            console.log(`\nFILE: ${fullPath}`);
            foundInFile = true;
          }
          console.log(`Line ${index + 1}: ${line.trim()} (Emojis: ${matches.join(' ')})`);
        }
      });
    }
  }
}

scanDir('./src');
