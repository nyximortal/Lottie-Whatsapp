const path = require("path");
const { buildLottieSticker } = require("./src/index");

async function main() {
  const output = await buildLottieSticker({
    baseFolder: path.resolve(__dirname, "src", "exemple"),
    imagePath: path.resolve(__dirname, "img.png"),
    output: path.resolve(__dirname, "example-output.was"),
    imageScale: 1.2
  });

  console.log(output);
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
