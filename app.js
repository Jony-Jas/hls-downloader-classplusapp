const main = require("./bin/m3u8-downloader");
const decrypt = require("./bin/de-encrypter");

const fs = require('fs');

const fileData = fs.readFileSync('data.txt', 'utf-8');
const lines = fileData.split('\n');

const urls = [];
for (let i = 0; i < lines.length - 1; i += 2) {
  const url = lines[i].trim();
  const output = lines[i + 1].trim();
  urls.push({ url, output });
}

let i = 0;
const run = async () => {
  while (i < urls.length) {
    console.log("Downloading: ", i + 1);
    await main(urls[i])
      .then((res) => {
        decrypt(urls[i].url, urls[i].output.split(".")[0]);
      })
      .catch((err) => {
        console.log(err);
      });
    i++;
  }
};
run();
