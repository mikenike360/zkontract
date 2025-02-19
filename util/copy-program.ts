import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// define paths relative to this script's directory
const mainAleoPath = path.join(__dirname, '../program/build/main.aleo');
const outputFilePath = path.join(__dirname, '../src/aleo/nft-program.ts');

// get values from .env
const PROGRAM_NAME = process.env.PROGRAM_NAME;
const ADDRESS = process.env.ADDRESS;

// read the main.aleo file
fs.readFile(mainAleoPath, 'utf8')
  .then((mainAleoContents: string) => {
    // wrap the contents in backticks and export as NFTProgram
    const program = mainAleoContents
      .replace(/4\.aleo/g, PROGRAM_NAME!)
      .replace(/aleo1xh0ncflwkfzga983lwujsha729c8nwu7phfn8aw7h3gahhj0ms8qytrxec/g, ADDRESS!);
  
    const outputContents = `export const NFTProgramId = '${PROGRAM_NAME}';\n\nexport const NFTProgram = \`${program}\`;\n`;

    // write the updated data to a new file
    return fs.writeFile(outputFilePath, outputContents);
  })
  .then(() => {
    console.log('Successfully created and updated the file');
  })
  .catch(err => {
    console.error('An error occurred:', err);
  });