const path = require("path");
const { buildLottieSticker } = require("./src/index");

function printUsage() {
  console.log(`Uso:
  node build-was.js --image ./img.png [--output ./sticker.was] [--scale 1.2]
                     [--base-folder ./src/exemple]
                     [--json animation/animation_secondary.json]
                     [--no-fit]`);
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (!arg.startsWith("--")) {
      throw new Error(`Argumento invalido: ${arg}`);
    }

    const key = arg.slice(2);

    if (key === "no-fit") {
      args.fitToAsset = false;
      continue;
    }

    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Valor ausente para --${key}`);
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const imagePath = args.image ? path.resolve(args.image) : "";

  if (!imagePath) {
    printUsage();
    process.exit(1);
  }

  const output = path.resolve(args.output || "./output.was");
  const baseFolder = path.resolve(args["base-folder"] || "./src/exemple");
  const jsonRelativePath = args.json || "animation/animation_secondary.json";
  const imageScale = args.scale ? Number(args.scale) : 1;

  if (!Number.isFinite(imageScale) || imageScale <= 0) {
    throw new Error("Scale invalido. Use um numero maior que 0.");
  }

  const result = await buildLottieSticker({
    baseFolder,
    imagePath,
    output,
    jsonRelativePath,
    fitToAsset: args.fitToAsset !== false,
    imageScale
  });

  console.log(result);
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
