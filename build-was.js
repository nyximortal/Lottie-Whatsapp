const path = require("path");
const { buildLottieSticker, TEMPLATE_PRESETS } = require("./src/index");

const TEMPLATE_NAMES = Object.keys(TEMPLATE_PRESETS);

function printUsage() {
  console.log(`Uso:
  node build-was.js --image ./img.png [--output ./sticker.was] [--scale 1.2]
                     [--template ${TEMPLATE_NAMES.join("|")}]
                     [--pack-name "Meu Pack"] [--publisher "Meu Nome"]
                     [--pack-id "uuid-ou-id"] [--accessibility-text "Descricao"]
                     [--emojis "😀,🔥"]
                     [--base-folder ./src/exemple]
                     [--json animation/animation_secondary.json]
                     [--no-fit]
  node build-was.js --list-templates`);
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

    if (key === "list-templates") {
      args.listTemplates = true;
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

  if (args.listTemplates) {
    console.log(TEMPLATE_NAMES.join("\n"));
    return;
  }

  const imagePath = args.image ? path.resolve(args.image) : "";

  if (!imagePath) {
    printUsage();
    process.exit(1);
  }

  const output = path.resolve(args.output || "./output.was");
  const baseFolder = path.resolve(args["base-folder"] || "./src/exemple");
  const jsonRelativePath = args.json || "animation/animation_secondary.json";
  const imageScale = args.scale ? Number(args.scale) : 1;
  const template = args.template || "spin";
  const metadata = {
    packId: args["pack-id"],
    packName: args["pack-name"],
    publisher: args.publisher,
    accessibilityText: args["accessibility-text"],
    emojis: args.emojis ? args.emojis.split(",").map(value => value.trim()).filter(Boolean) : undefined
  };

  if (!Number.isFinite(imageScale) || imageScale <= 0) {
    throw new Error("Scale invalido. Use um numero maior que 0.");
  }

  if (!TEMPLATE_PRESETS[template]) {
    throw new Error(`Template invalido. Use um destes: ${TEMPLATE_NAMES.join(", ")}`);
  }

  const result = await buildLottieSticker({
    baseFolder,
    imagePath,
    output,
    template,
    jsonRelativePath,
    fitToAsset: args.fitToAsset !== false,
    imageScale,
    metadata
  });

  console.log(result);
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
