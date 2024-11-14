/* eslint-disable no-undef */
const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  // externals: "lodash", // library包中有引入lodash，打包时不将lodash打进去，用户在引入该library时，需自己再引入lodash，避免用户重复引入lodash，导致文件过大。
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "library.js",
    library: "library", // 全局挂载包的引用名
    libraryTarget: "umd", //通用模式：支持用户通过es、common.js、AMD的方式引入npm包
  },
};
