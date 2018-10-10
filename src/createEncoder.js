const GifEncoder = require('gif-encoder');
const dragDrop = require('drag-drop');
const mapLimit = require('map-limit');
const loadImg = require('load-img');
const sort = require('javascript-natural-sort');
const { WritableStreamBuffer } = require('stream-buffers');
const noop = () => {};

module.exports = (opt = {}) => {
	const tempCanvas = document.createElement('canvas');
	const tempContext = tempCanvas.getContext('2d');

	return {
		canvas: tempCanvas,
		context: tempContext,
		encode
	};

	function encode (files, finished, onProgress) {
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

		const width = opt.dimensions.value[0];
		const height = opt.dimensions.value[1];

		const gif = new GifEncoder(width, height);
		gif.setFrameRate(opt.time.value);
		gif.setRepeat(0);
		gif.setQuality(opt.quality);

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
			onProgress({
				frame,
				totalFrames,
				name: file.name
			});
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
			gif.finish();
			if (images.length > 0) {
				const contents = outStream.getContents();
				const type = 'image/gif';
				const blob = new window.Blob([ contents ], { type });
				save('image.gif', blob, () => {
					finished(null);
				});
			} else {
				finished(null);
			}
		});
	}
};
