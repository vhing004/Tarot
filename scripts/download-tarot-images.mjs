import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.resolve(__dirname, '../public/textures/tarot');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const fileList = [
  'ar00.jpg', 'ar01.jpg', 'ar02.jpg', 'ar03.jpg', 'ar04.jpg', 'ar05.jpg',
  'ar06.jpg', 'ar07.jpg', 'ar08.jpg', 'ar09.jpg', 'ar10.jpg', 'ar11.jpg',
  'ar12.jpg', 'ar13.jpg', 'ar14.jpg', 'ar15.jpg', 'ar16.jpg', 'ar17.jpg',
  'ar18.jpg', 'ar19.jpg', 'ar20.jpg', 'ar21.jpg',
  'waac.jpg', 'wa02.jpg', 'wa03.jpg', 'wa04.jpg', 'wa05.jpg', 'wa06.jpg',
  'wa07.jpg', 'wa08.jpg', 'wa09.jpg', 'wa10.jpg', 'wapa.jpg', 'wakn.jpg',
  'waqu.jpg', 'waki.jpg',
  'cuac.jpg', 'cu02.jpg', 'cu03.jpg', 'cu04.jpg', 'cu05.jpg', 'cu06.jpg',
  'cu07.jpg', 'cu08.jpg', 'cu09.jpg', 'cu10.jpg', 'cupa.jpg', 'cukn.jpg',
  'cuqu.jpg', 'cuki.jpg',
  'swac.jpg', 'sw02.jpg', 'sw03.jpg', 'sw04.jpg', 'sw05.jpg', 'sw06.jpg',
  'sw07.jpg', 'sw08.jpg', 'sw09.jpg', 'sw10.jpg', 'swpa.jpg', 'swkn.jpg',
  'swqu.jpg', 'swki.jpg',
  'peac.jpg', 'pe02.jpg', 'pe03.jpg', 'pe04.jpg', 'pe05.jpg', 'pe06.jpg',
  'pe07.jpg', 'pe08.jpg', 'pe09.jpg', 'pe10.jpg', 'pepa.jpg', 'pekn.jpg',
  'pequ.jpg', 'peki.jpg',
];

const baseUrl = 'https://raw.githubusercontent.com/seven102161/elaine-tarot-cards/main/cards/';

console.log(`Bắt đầu tải ${fileList.length} ảnh lá bài Tarot...`);

let successCount = 0;
for (const file of fileList) {
  const destPath = path.join(targetDir, file);
  try {
    const url = baseUrl + file;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Lỗi tải ${file}: status ${res.status}`);
      continue;
    }
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
    successCount++;
    process.stdout.write(`✓ ${file} `);
  } catch (err) {
    console.error(`Lỗi ngoại lệ khi tải ${file}:`, err.message);
  }
}

console.log(`\nHoàn thành! Đã tải thành công ${successCount}/${fileList.length} ảnh.`);
