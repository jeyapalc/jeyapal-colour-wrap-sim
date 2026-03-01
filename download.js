import https from 'https';
import fs from 'fs';

const fileId = '1xYIrzZ3Cs05aNj2vWVhomPD1MfY4gItk';
const dest = 'public/tesla/2023_tesla_model_3_performance.glb';

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 303) {
        // Handle redirect
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      } else if (res.statusCode === 200) {
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        reject(new Error(`Failed to download: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

const initialUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
downloadFile(initialUrl, dest)
  .then(() => console.log('Download complete'))
  .catch(err => console.error(err));
