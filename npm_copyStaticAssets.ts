
import * as shelljs from "shelljs";
import * as fs from "fs";
import * as _ from "lodash";

var sourceDir = "src";
var destDir = "dist";

var goodFiles = [
	"js", "css", "xml", "resx", "jpg", "png"
];

function createDirPath(path: string) {
	var allParts = path.split("/");
	var p: string = "";
	for (let index = 0; index < allParts.length - 1; index++) {
		var dirElm = allParts[index];
		p = p == "" ? dirElm : p + "/" + dirElm;
		//console.log(p);
		if (!fs.existsSync(p)) {
			//console.log("created " + p);
			fs.mkdirSync(p);
		}
	}
}

shelljs.find(sourceDir)
	.filter(function (file: any) {
		let fileExt = file.split('.').pop();
		return _.indexOf(goodFiles, fileExt) >= 0;
	})
	.forEach(function (file: any) {
		var path = (file.split(sourceDir + '/'))[1];
		var newPath = destDir + '/' + path;
		//console.log(file);
		console.log("copied " + newPath);
		createDirPath(newPath);
		shelljs.cp("-f", file, newPath);
	});


