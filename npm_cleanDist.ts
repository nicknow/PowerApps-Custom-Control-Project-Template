
import * as shelljs from "shelljs";
import * as fs from "fs";
import * as _ from "lodash";

var destDir = "dist";

var rmDir = function (dirPath: any) {
	try {
		var files = fs.readdirSync(dirPath);
	} catch (e) {
		return;
	}

	if (files.length > 0) {
		for (var i = 0; i < files.length; i++) {
			var filePath = dirPath + '/' + files[i];
			if (fs.statSync(filePath).isFile()) {
				fs.unlinkSync(filePath);
			}
			else {
				rmDir(filePath);
			}
		}
	}
	fs.rmdirSync(dirPath);
};

if (fs.existsSync(destDir)) {
	rmDir(destDir);
}

//fs.mkdirSync(destDir);

