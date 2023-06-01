const Promise = require("bluebird");
const request = require("request");
const _ = require("lodash");
const m3u8Parser = require("m3u8-parser");
const URL = require("url");
const fs = require("fs");
const path = require("path");

const getM3U8Manifest = async (url) => {
  return new Promise((resolve, reject) => {
    Request(url, function (error, response, body) {
      if (error) {
        reject(error);
        return;
      }
      if (response.statusCode != 200) {
        reject(new Error(`${response.statusCode}-${body}`));
        return;
      }
      const parser = new m3u8Parser.Parser();
      parser.push(body);
      parser.end();
      resolve(parser.manifest);
    });
  });
};

const getSegments = async (url) => {
  let m3u8 = await getM3U8Manifest(url);
  if (m3u8.playlists && m3u8.playlists.length > 0) {
    const uri = m3u8.playlists[0].uri;
    const myURL = new URL.URL(uri, url);
    return await getSegments(myURL.href);
  }
  return { segments: m3u8.segments, url };
};

const downloadSegments = async (m3u8Url, segments, output) => {
  const output_path = path.join(__dirname, `../bin/download/${output}.tmp`);
  try {
    fs.mkdirSync(output_path, { recursive: true });
  } catch (e) {
    console.warn(e.message);
  }

  const parallelDownload = async () => {
    const downloadings = _.filter(segments, (v) => v.downloading === true);
    if (downloadings.length >= downloadThread) return;

    const segment = _.find(segments, (v) => !v.downloading && !v.downloaded);
    if (!segment) return;

    const needDownloads = _.filter(
      segments,
      (v) => !v.downloading && !v.downloaded
    ).slice(0, downloadThread - downloadings.length);

    await Promise.all(
      _.map(needDownloads, (segment) => {
        const myURL = new URL.URL(segment.uri, m3u8Url);
        const filePath = path.join(
          output_path,
          encodeURIComponent(segment.uri)
        );
        segment.downloading = true;

        return downloadSegment(myURL.href, filePath)
          .then(() => {
            segment.downloading = false;
            segment.downloaded = true;
            segment.url = myURL.href;
            segment.filePath = filePath;
            return parallelDownload();
          })
          .catch((err) => {
            console.warn(myURL.href);
            console.warn(err.message);
            console.warn("retry");
            delete segment.downloading;
            delete segment.downloaded;
            return parallelDownload();
          });
      })
    );
  };
  await parallelDownload();
  return _.map(segments, (v) => v.filePath);
};

const downloadSegment = async (url, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {}
    const stream = fs.createWriteStream(filePath);
    Request.get(url)
      .on("response", function (response) {
        if (response.statusCode != 200) {
          reject(new Error(`${response.statusCode}-${body}`));
          return;
        }
      })
      .on("error", function (err) {
        stream.close();
        reject(err);
      })
      .on("end", function (err) {
        resolve(filePath);
      })
      .pipe(stream);
  });
};

const merge2Ts = async (files, output) => {
  await Promise.each(files, (file) => {
    const stream = fs.createReadStream(file);
    const ws = fs.createWriteStream(output, { flags: "a" });
    return new Promise((resolve, reject) => {
      stream.pipe(ws);
      stream.on("error", function (err) {
        reject(err);
      });
      stream.on("end", function () {
        resolve();
      });
    });
  });
};

const download = async (url, output) => {
  try {
    fs.unlinkSync(output);
  } catch (e) {}

  const segmentsInfo = await getSegments(url);
  const segments = segmentsInfo.segments;
  if (!segments || segments.length == 0) {
    throw new Error("Ts fragment not found");
  }
  const files = await downloadSegments(segmentsInfo.url, segments, output);
  await merge2Ts(files, output);
  return output;
};

let Request = null;
let downloadThread = 32;

module.exports = ({ url, output, proxy = null, thread = 32 }) => {
  if (!url || !output) {
    throw new Error("url, output can not be empty");
  }
  Request = request.defaults({ proxy });
  downloadThread = thread;
  return download(url, output);
};
