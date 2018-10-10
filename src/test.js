/** @jsx h */
const { render, h } = require('preact');
const GifEncoder = require('gif-encoder');
const dragDrop = require('drag-drop');
const mapLimit = require('map-limit');
const loadImg = require('load-img');
const sort = require('javascript-natural-sort');
const { WritableStreamBuffer } = require('stream-buffers');
const noop = () => {};

const tempCanvas = document.createElement('canvas');
// document.body.appendChild(tempCanvas);
const tempContext = tempCanvas.getContext('2d');

// You can pass in a DOM node or a selector string!
dragDrop('#drop', function (files, pos, fileList, directories) {
  encode(files)

  // console.log('Dropped at coordinates', pos.x, pos.y)
  // console.log('Here is the raw FileList object if you need it:', fileList)
  // console.log('Here is the list of directories:', directories)

  // `files` is an Array!
  // files.forEach(function (file) {
    // console.log(file.name)
    // console.log(file.size)
    // console.log(file.type)
    // console.log(file.lastModifiedData)
    // console.log(file.fullPath) // not real full path due to browser security restrictions
    // console.log(file.path) // in Electron, this contains the actual full path

    // // convert the file to a Buffer that we can use!
    // var reader = new FileReader()
    // reader.addEventListener('load', function (e) {
    //   // e.target.result is an ArrayBuffer
    //   var arr = new Uint8Array(e.target.result)
    //   var buffer = new Buffer(arr)

    //   // do something with the buffer!
    // })
    // reader.addEventListener('error', function (err) {
    //   console.error('FileReader error' + err)
    // })
    // reader.readAsArrayBuffer(file)
  // })
})

function encode (files) {
  const imageList = files.filter(file => /image/i.test(file.type)).map(file => {
    const numberMatch = /(\d+)(?!.*\d)/.exec(file.name);
    const index = numberMatch ? numberMatch[1] : file.name;
    return {
      file,
      index
    };
  });

  imageList.sort((a, b) => a.index - b.index);

  const images = imageList.map(e => e.file);
  const totalFrames = files.length;
  let frame = 0;

  const width = 256;
  const height = 256;

  const gif = new GifEncoder(width, height);
  gif.setFrameRate(24);
  gif.setRepeat(0);
  gif.setQuality(1);

  tempCanvas.width = width;
  tempCanvas.height = height;

  const outStream = new WritableStreamBuffer({
    initialSize: (20 * 1024),
    incrementAmount: (10 * 1024)
  });

  // Start writing to output
  gif.pipe(outStream);
  gif.writeHeader();

  const loadFile = (file, cb) => {
    const reader = new window.FileReader();
    reader.onload = (ev) => {
      reader.onload = noop;
      loadImg(ev.target.result, cb);
    };
    reader.onerror = () => {
      reader.onload = noop;
      cb(new Error(`Could not load ${file.name}`));
    };
    reader.readAsDataURL(file);
  };

  const getPixels = (image, cb) => {
    tempContext.clearRect(0, 0, width, height);
    tempContext.drawImage(image, 0, 0, width, height);
    return tempContext.getImageData(0, 0, width, height).data;
  };

  const encodeFrame = (file, cb) => {
    console.log(`Encoding ${frame} of ${totalFrames} (${file.name})`);
    loadFile(file, (err, image) => {
      if (err) return cb(err);
      const pixels = getPixels(image);
      gif.addFrame(pixels);
      frame++;
      cb(null);
    });
  };

  const save = (filename, blob, cb) => {
    // force download
    const link = document.createElement('a');
    link.style.visibility = 'hidden';
    link.target = '_blank';
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.onclick = () => {
      link.onclick = noop;
      setTimeout(() => {
        window.URL.revokeObjectURL(blob);
        document.body.removeChild(link);
        link.removeAttribute('href');
        cb(null);
      });
    };
    link.click();
  };

  // Load each file
  mapLimit(images, 1, encodeFrame, () => {
    console.log('Done!');
    gif.finish();
    const contents = outStream.getContents();
    const type = 'image/gif';
    const blob = new window.Blob([ contents ], { type });
    save('image.gif', blob, () => {
      console.log('Exported');
    });
  });
}
