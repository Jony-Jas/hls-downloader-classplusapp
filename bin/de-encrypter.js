const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const URL2 =
  "https://videoscdn.classplusapp.com/20A5D0497A57E6CAD1DAB0DD94B1C7994EA25E93E18125F6F11AF02C6477C97C/3111053/videos/3111053_3111053-pr-clearias-classes-intro--10000-1625034884779_1080p.kjs";
const URL =
  "https://videoscdn.classplusapp.com/20A5D0497A57E6CAD1DAB0DD94B1C7994EA25E93E18125F6F11AF02C6477C97C/3111053/videos/3111053-pr-clearias-classes-intro--10000-1625034884779-1080p.m3u8?key=1685551179-38-0-9d4659905d1babc0a7f3af1d6d845769";

const download = async (url, filename) => {
  await axios.get(url).then((response) => {
    const downloadPath = path.join(__dirname, `/download/${filename}`);
    fs.writeFile(downloadPath, response.data, "utf-8", (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  });
};

const downloadKey = async (url, filename) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "arraybuffer", // Set the response type to arraybuffer for binary data
  });

  const downloadPath = path.join(__dirname, `/download/${filename}`);
  fs.writeFile(downloadPath, response.data, { encoding: null }, (err) => {
    if (err) throw err;
    console.log("The file has been saved!");
  });
};

const extractFileName = (URL) => {
  const url = URL.split("/");
  const fileName = url[url.length - 1].split("?")[0].split(".")[0];
  return fileName;
};

const makeKeyName = (URL) => {
  const fileName = extractFileName(URL);
  let keyName = fileName.split("-")[0] + "_" + fileName;
  const i = keyName.lastIndexOf("-");
  keyName = keyName.substring(0, i) + "_" + keyName.substring(i + 1);
  return keyName;
};

const readAndEdit = async (URL, KEY_NAME, fileName) => {
  fs.readFile(
    path.join(__dirname, `/download/${extractFileName(URL)}.m3u8`),
    "utf8",
    function (err, data) {
      if (err) {
        return console.log(err);
      }

      let result = data.split("\n").slice(0, 4).join("\n");
      result = result + `\n#EXT-X-KEY:METHOD=AES-128,URI="${KEY_NAME}.kjs"\n`;
      result += "#EXTINF:17,\n";
      result += path.join(__dirname, `../${fileName}.ts`) + "\n";
      result += "#EXT-X-ENDLIST";

      fs.writeFile(
        path.join(__dirname, `/download/${extractFileName(URL)}.m3u8`),
        result,
        "utf8",
        function (err) {
          if (err) return console.log(err);
        }
      );
    }
  );
};

const execute = async (URL, fileName) => {
  await exec(
    `cd bin/download && ffmpeg -allowed_extensions ALL -i ${extractFileName(
      URL
    )}.m3u8 -c copy ../output/${fileName}.mp4`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );
};

const decrypt = async (URL, fileName) => {
  console.log(URL, fileName);
  const KEY_URL =
    URL.split(extractFileName(URL))[0] + makeKeyName(URL) + ".kjs";
  await download(URL, `${extractFileName(URL)}.m3u8`);
  await downloadKey(KEY_URL, `${makeKeyName(URL)}.kjs`);
  await readAndEdit(URL, makeKeyName(URL), fileName);
  await execute(URL, fileName);
};

module.exports = decrypt;
