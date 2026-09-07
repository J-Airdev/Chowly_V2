import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join(__dirname, 'CHOWLY_ASSIGNMENT_DOCUMENTATION.md');
const markdown = fs.readFileSync(mdPath, 'utf8');

// -------------------------------------------------------------
// 1. GENERATE MSO WORD .DOC (HTML-based Word Document)
// -------------------------------------------------------------
function generateDocFile() {
  // Convert markdown to clean HTML for Word
  let bodyHtml = markdown
    // Headings
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    // Bold & Italics
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<b><i>$1</i></b>')
    .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
    .replace(/\*(.*?)\*/gim, '<i>$1</i>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gm, '<pre style="background:#f4f6f8; padding:10px; border:1px solid #d1d5db; font-family:Consolas, monospace; font-size:9.5pt; margin:10px 0;">$1</pre>')
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6; color:#991b1b; padding:1px 4px; font-family:Consolas, monospace; font-size:10pt;">$1</code>')
    // Horizontal rules
    .replace(/^---$/gim, '<hr style="border:0; border-top:1.5pt solid #092517; margin:18px 0;" />')
    // Lists
    .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');

  // Wrap lists
  bodyHtml = bodyHtml.replace(/(<li>[\s\S]*?<\/li>)/gm, '<ul style="margin-top:4px; margin-bottom:8px;">$1</ul>');

  // Parse markdown tables to HTML tables
  bodyHtml = bodyHtml.replace(/(\|.+\|\r?\n\|[-:| ]+\|\r?\n(?:\|.+\|\r?\n?)+)/gm, (match) => {
    const lines = match.trim().split(/\r?\n/);
    if (lines.length < 3) return match;
    const headerCols = lines[0].split('|').slice(1, -1).map(c => c.trim());
    const rowLines = lines.slice(2);
    
    let tableHtml = '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse; width:100%; margin:14px 0; border:1px solid #cbd5e1; font-size:10pt;">';
    tableHtml += '<tr style="background:#092517; color:#ffffff; font-weight:bold;">';
    headerCols.forEach(col => {
      tableHtml += `<th style="padding:8px 10px; text-align:left; border:1px solid #475569;">${col}</th>`;
    });
    tableHtml += '</tr>';

    rowLines.forEach((r, idx) => {
      const cols = r.split('|').slice(1, -1).map(c => c.trim());
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      tableHtml += `<tr style="background:${bg};">`;
      cols.forEach(col => {
        tableHtml += `<td style="padding:6px 10px; border:1px solid #e2e8f0;">${col}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</table>';
    return tableHtml;
  });

  // Paragraphs
  const paragraphs = bodyHtml.split(/\r?\n\r?\n/).map(chunk => {
    chunk = chunk.trim();
    if (!chunk) return '';
    if (chunk.startsWith('<h') || chunk.startsWith('<table') || chunk.startsWith('<ul') || chunk.startsWith('<pre') || chunk.startsWith('<hr')) {
      return chunk;
    }
    return `<p style="margin:6px 0 10px; line-height:1.5;">${chunk.replace(/\r?\n/g, '<br/>')}</p>`;
  }).join('\n');

  const wordHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Chowly - Assignment Documentation</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page {
  size: 8.5in 11in;
  margin: 1.0in 1.0in 1.0in 1.0in;
  mso-header-margin: .5in;
  mso-footer-margin: .5in;
  mso-paper-source: 0;
}
body {
  font-family: 'Segoe UI', Calibri, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #1e293b;
}
h1 {
  font-size: 22pt;
  color: #092517;
  font-family: Georgia, serif;
  border-bottom: 2pt solid #eeb42a;
  padding-bottom: 6px;
  margin-top: 18pt;
  margin-bottom: 12pt;
}
h2 {
  font-size: 16pt;
  color: #092517;
  font-family: Georgia, serif;
  margin-top: 16pt;
  margin-bottom: 8pt;
  border-bottom: 1pt solid #cbd5e1;
  padding-bottom: 4px;
}
h3 {
  font-size: 13pt;
  color: #854d0e;
  margin-top: 12pt;
  margin-bottom: 6pt;
}
h4 {
  font-size: 11pt;
  color: #0f172a;
  margin-top: 8pt;
  margin-bottom: 4pt;
}
p {
  margin: 0 0 8pt 0;
}
ul, ol {
  margin-top: 4pt;
  margin-bottom: 8pt;
  padding-left: 20pt;
}
li {
  margin-bottom: 3pt;
}
</style>
</head>
<body>
${paragraphs}
</body>
</html>
`;

  const docDestPath = path.join(__dirname, 'CHOWLY_ASSIGNMENT_DOCUMENTATION.doc');
  fs.writeFileSync(docDestPath, wordHtml, 'utf8');
  console.log(`Created Word .doc at: ${docDestPath}`);
}

// -------------------------------------------------------------
// 2. GENERATE MODERN WORD .DOCX (Office Open XML)
// -------------------------------------------------------------
async function generateDocxFile() {
  const lines = markdown.split(/\r?\n/);
  const children = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.replace('# ', ''),
          heading: HeadingLevel.TITLE,
          spacing: { before: 240, after: 120 }
        })
      );
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 100 }
        })
      );
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.replace('### ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 80 }
        })
      );
    } else if (line.startsWith('#### ')) {
      children.push(
        new Paragraph({
          text: line.replace('#### ', ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 140, after: 60 }
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^[-*]\s+/, ''),
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 }
        })
      );
    } else if (/^\d+\.\s+/.test(line)) {
      children.push(
        new Paragraph({
          text: line.replace(/^\d+\.\s+/, ''),
          numbering: { reference: 'default-numbering', level: 0 },
          spacing: { before: 40, after: 40 }
        })
      );
    } else if (line.startsWith('|') && line.endsWith('|')) {
      // Table header
      const tableRows = [];
      const headerCols = line.split('|').slice(1, -1).map(c => c.trim());
      
      tableRows.push(
        new TableRow({
          tableHeader: true,
          children: headerCols.map(col => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: col, bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '092517', type: ShadingType.CLEAR }
          }))
        })
      );

      // Skip separator
      i++;
      
      // Parse table rows
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        i++;
        const rowLine = lines[i].trim();
        const cols = rowLine.split('|').slice(1, -1).map(c => c.trim());
        tableRows.push(
          new TableRow({
            children: cols.map(col => new TableCell({
              children: [new Paragraph({ text: col })]
            }))
          })
        );
      }

      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      );
    } else if (line === '---') {
      children.push(
        new Paragraph({
          text: '____________________________________________________________________',
          spacing: { before: 120, after: 120 }
        })
      );
    } else {
      children.push(
        new Paragraph({
          text: line,
          spacing: { before: 60, after: 80 }
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  const docxDestPath = path.join(__dirname, 'CHOWLY_ASSIGNMENT_DOCUMENTATION.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxDestPath, buffer);
  console.log(`Created Word .docx at: ${docxDestPath}`);
}

async function main() {
  generateDocFile();
  await generateDocxFile();
}

main().catch(console.error);
