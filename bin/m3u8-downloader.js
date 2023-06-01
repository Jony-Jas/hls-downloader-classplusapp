const download = require('../lib')
const args = require('args')

const main = async (value) => {

  // const url = 'https://videoscdn.classplusapp.com/20A5D0497A57E6CAD1DAB0DD94B1C7994EA25E93E18125F6F11AF02C6477C97C/3111053/videos/3111053-pr-clearias-classes-intro--10000-1625034884779-1080p.m3u8?key=1685512829-32-0-75773bffebd4fd0abb2c0007aada9c1c';
  // const output = 'new.ts';

  const url = value.url;
  const output = value.output;
  
  if(!url || !output){
    return args.showHelp()
  }
  await download({url, output})

  return new Promise((resolve,reject) => {
    resolve(`${output} done`);
  })
};

module.exports = main;