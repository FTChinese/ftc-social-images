const promisify = require('promisify-node');
const fs = promisify('fs');
const path = require('path');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const svg2png = require('svg2png');
const helper = require('./helper');

const minimist = require('minimist');
const options = {
	string: ['input', 'background', 'foreground', 'rx', 'ry'],
	alias: {
		i: 'input',
		b: 'background',
		f: 'foreground',
		x: 'rx',
		y: 'ry'
	}
}
const argv = minimist(process.argv.slice(2), options);

console.log(argv);

const svgSrc = path.resolve(process.cwd(), 'svg');
const dest = path.resolve(process.cwd(), '.tmp');

if (!isThere(dest)) {
  mkdirp(dest, (err) => {
    if (err) console.log(err);
  });
}

if (argv.i) {
	co(function *() {
		const iconName = argv.i;
		const iconFile = `svg/${iconName}.svg`;
		const outputName = argv.o ? argv.o : iconName;

		const svgFile = `${dest}/${outputName}.svg`;
		const pngFile = `${dest}/${outputName}.png`;

		var svgString = '';
		var resultSvg = ''

		try {
			svgString = yield fs.readFile(iconFile, 'utf8');
		} catch (e) {
			console.error(e);
		}

		try {
			outputSvg = helper.transformSvg(svgString, argv);
		} catch(e) {
			console.error(e);
		}

		const ws = fs.createWriteStream(svgFile);
		ws.on('finish', () => {
			console.log(`Generated: ${svgFile}`);
		});
		str(outputSvg).pipe(ws);

		svg2png(Buffer.from(outputSvg))
			.then((buffer) => {
				return fs.writeFile(pngFile, buffer);
			}, e => {
				console.error(e.stack)
			})
			.then(() => {
				console.log(`Generated: ${pngFile}`);
			}, e => {
				consle.error(e.stack);
			});
	})
	.then(() => {
		console.log('done');
	}, (e) => {
		console.error(err.stack);
	});
} else {
	console.log('You should provide an icon name. (No extension).')
}
