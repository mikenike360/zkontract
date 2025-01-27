"use strict";
exports.__esModule = true;
var fs = require("fs-extra");
var path = require("path");
var dotenv = require("dotenv");
dotenv.config();
// define paths relative to this script's directory
var mainAleoPath = path.join(__dirname, '../program/build/main.aleo');
var outputFilePath = path.join(__dirname, '../src/aleo/nft-program.ts');
// get values from .env
var PROGRAM_NAME = process.env.PROGRAM_NAME;
var ADDRESS = process.env.ADDRESS;
// read the main.aleo file
fs.readFile(mainAleoPath, 'utf8')
    .then(function (mainAleoContents) {
    // wrap the contents in backticks and export as NFTProgram
    var program = mainAleoContents
        .replace(/4\.aleo/g, PROGRAM_NAME)
        .replace(/aleo1xh0ncflwkfzga983lwujsha729c8nwu7phfn8aw7h3gahhj0ms8qytrxec/g, ADDRESS);
    var outputContents = "export const NFTProgramId = '".concat(PROGRAM_NAME, "';\n\nexport const NFTProgram = `").concat(program, "`;\n");
    // write the updated data to a new file
    return fs.writeFile(outputFilePath, outputContents);
})
    .then(function () {
    console.log('Successfully created and updated the file');
})["catch"](function (err) {
    console.error('An error occurred:', err);
});
