

var fs = require('fs');
var archiver = require('archiver');
var archive = archiver('zip');


var solutionArchFile = 'solution.zip';
var solutionFolder = 'dist/';



if (fs.existsSync(solutionArchFile)) {
	console.log('Deleting old ' + solutionArchFile);
	fs.unlinkSync(solutionArchFile);
}

var output = fs.createWriteStream(solutionArchFile);


output.on('close', function () {
	console.log(archive.pointer() + ' total bytes');
	console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', function (err: any) {
	throw err;
});

archive.pipe(output);
archive.directory(solutionFolder, false);
archive.finalize();