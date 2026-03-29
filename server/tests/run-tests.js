const fs = require("fs");
const path = require("path");

const testDirectory = __dirname;

fs.readdirSync(testDirectory)
  .filter((fileName) => fileName.endsWith(".test.js"))
  .sort()
  .forEach((fileName) => {
    require(path.join(testDirectory, fileName));
  });
