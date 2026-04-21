const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const sharp = require("sharp");
const yazl = require("yazl");
const { getTemplateById, getTemplateMap } = require("./templates");

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const DEFAULT_BASE_FOLDER = path.resolve(__dirname, "exemple");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, item.name);
    const to = path.join(dest, item.name);

    if (item.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function getMime(filePath, mime) {
  if (mime) return mime;
  return MIME[path.extname(filePath || "").toLowerCase()] || null;
}

function toDataUri(buffer, mime) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Buffer inválido.");
  }

  if (!mime) {
    throw new Error("Mime não detectado. Informe imagePath ou mime.");
  }

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function readLottieJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function writeLottieJson(jsonPath, json) {
  fs.writeFileSync(jsonPath, JSON.stringify(json));
}

function readJsonIfExists(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function getEmbeddedAssetFromJson(json) {
  if (!Array.isArray(json.assets)) {
    throw new Error("JSON sem assets.");
  }

  const asset = json.assets.find(a => typeof a?.p === "string" && a.p.startsWith("data:image/"));
  if (!asset) {
    throw new Error("Nenhuma imagem base64 encontrada no Lottie.");
  }

  return asset;
}

function getEmbeddedAsset(jsonPath) {
  return getEmbeddedAssetFromJson(readLottieJson(jsonPath));
}

function getImageLayers(json) {
  if (!Array.isArray(json.layers)) {
    return [];
  }

  return json.layers.filter(layer => layer?.ty === 2 && typeof layer?.refId === "string");
}

function setAnimatedScalar(property, keyframes) {
  if (!property) {
    return;
  }

  property.a = 1;
  property.k = keyframes;
}

function setAnimatedScale(property, keyframes) {
  if (!property) {
    return;
  }

  property.a = 1;
  property.k = keyframes;
}

function applySpinPreset(json) {
  return json;
}

function applyExpandPreset(json) {
  const layers = getImageLayers(json);

  for (const layer of layers) {
    setAnimatedScalar(layer.ks?.r, [
      {
        t: 0,
        s: [0],
        e: [0]
      },
      {
        t: 240
      }
    ]);

    setAnimatedScalar(layer.ks?.o, [
      {
        t: 0,
        s: [0],
        e: [100]
      },
      {
        t: 16,
        s: [100],
        e: [100]
      },
      {
        t: 240
      }
    ]);

    setAnimatedScale(layer.ks?.s, [
      {
        t: 0,
        s: [30, 30, 100],
        e: [125, 125, 100]
      },
      {
        t: 36,
        s: [125, 125, 100],
        e: [100, 100, 100]
      },
      {
        t: 72,
        s: [100, 100, 100],
        e: [104, 104, 100]
      },
      {
        t: 132,
        s: [104, 104, 100],
        e: [100, 100, 100]
      },
      {
        t: 192,
        s: [100, 100, 100],
        e: [102, 102, 100]
      },
      {
        t: 240,
        s: [102, 102, 100]
      }
    ]);
  }

  return json;
}

function applyTemplatePreset(json, templateName) {
  if (!templateName || templateName === "spin" || templateName === "none") {
    return applySpinPreset(json);
  }

  if (templateName === "expand") {
    return applyExpandPreset(json);
  }

  throw new Error(`Template desconhecido: ${templateName}`);
}

function resolveTemplateConfig({ baseFolder, jsonRelativePath, template }) {
  if (template) {
    const preset = getTemplateById(template);

    if (!preset && !baseFolder) {
      throw new Error(`Template desconhecido: ${template}`);
    }

    return {
      baseFolder: baseFolder || preset.baseFolder,
      jsonRelativePath: jsonRelativePath || preset.jsonRelativePath,
      template: preset?.preset || template
    };
  }

  return {
    baseFolder: baseFolder || DEFAULT_BASE_FOLDER,
    jsonRelativePath: jsonRelativePath || "animation/animation_secondary.json",
    template: "spin"
  };
}

function setStaticPoint(property, point) {
  if (!property || property.a !== 0 || !Array.isArray(property.k)) {
    return;
  }

  property.k = [point[0], point[1], property.k[2] ?? 0];
}

function resizeReferencedLayers(layers, refId, width, height) {
  if (!Array.isArray(layers)) {
    return;
  }

  for (const layer of layers) {
    if (layer?.refId === refId) {
      setStaticPoint(layer.ks?.a, [width / 2, height / 2]);
    }
  }
}

function updateAssetSize(json, asset, width, height) {
  asset.w = width;
  asset.h = height;

  resizeReferencedLayers(json.layers, asset.id, width, height);

  for (const nestedAsset of json.assets) {
    resizeReferencedLayers(nestedAsset?.layers, asset.id, width, height);
  }
}

function replaceBase64Image(jsonPath, dataUri, width, height, template) {
  const json = applyTemplatePreset(cloneJson(readLottieJson(jsonPath)), template);
  const asset = getEmbeddedAssetFromJson(json);

  asset.p = dataUri;
  if (width && height) {
    updateAssetSize(json, asset, width, height);
  }

  writeLottieJson(jsonPath, json);
}

function applyMetadataOverrides(baseFolder, metadata = {}) {
  const hasValues = Object.values(metadata).some(value => value !== undefined && value !== null && value !== "");
  if (!hasValues) {
    return;
  }

  const metadataPath = path.join(baseFolder, "animation", "animation.json.overridden_metadata");
  const current = readJsonIfExists(metadataPath) || {};

  if (metadata.packId) {
    current["sticker-pack-id"] = metadata.packId;
  }

  if (metadata.packName) {
    current["sticker-pack-name"] = metadata.packName;
  }

  if (metadata.publisher !== undefined) {
    current["sticker-pack-publisher"] = metadata.publisher;
  }

  if (metadata.accessibilityText) {
    current["accessibility-text"] = metadata.accessibilityText;
  }

  if (Array.isArray(metadata.emojis)) {
    current.emojis = metadata.emojis;
  }

  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  fs.writeFileSync(metadataPath, JSON.stringify(current));
}

async function prepareImageBuffer(buffer, fit, width, height) {
  if (!fit || !width || !height) {
    return buffer;
  }

  return sharp(buffer)
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
}

function listFilesRecursive(dirPath, basePath = dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(absolutePath, basePath));
      continue;
    }

    files.push({
      absolutePath,
      relativePath: path.relative(basePath, absolutePath).split(path.sep).join("/")
    });
  }

  return files;
}

function zipToWas(folder, output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (fs.existsSync(output)) fs.unlinkSync(output);

  return new Promise((resolve, reject) => {
    const zipFile = new yazl.ZipFile();
    const outputStream = fs.createWriteStream(output);

    outputStream.on("close", resolve);
    outputStream.on("error", reject);
    zipFile.outputStream.on("error", reject);

    for (const file of listFilesRecursive(folder)) {
      zipFile.addFile(file.absolutePath, file.relativePath);
    }

    zipFile.end();
    zipFile.outputStream.pipe(outputStream);
  });
}

async function buildLottieSticker({
  baseFolder,
  output = path.resolve("./jurubeba.was"),
  imagePath,
  buffer,
  mime,
  template = "spin",
  jsonRelativePath = "animation/animation_secondary.json",
  fitToAsset = true,
  imageScale = 1,
  metadata = {}
}) {
  const resolved = resolveTemplateConfig({ baseFolder, jsonRelativePath, template });

  if (!fs.existsSync(resolved.baseFolder)) throw new Error("baseFolder não encontrado.");

  if (!buffer && !imagePath) {
    throw new Error("Envie imagePath ou buffer.");
  }

  if (!buffer && imagePath) {
    if (!fs.existsSync(imagePath)) throw new Error("Imagem não encontrada.");
    buffer = fs.readFileSync(imagePath);
  }

  mime = getMime(imagePath, mime);
  if (!mime) throw new Error("Formato não suportado. Use PNG, JPG, JPEG ou WEBP.");

  const temp = path.join(os.tmpdir(), `lottie-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`);

  try {
    copyDir(resolved.baseFolder, temp);
    applyMetadataOverrides(temp, metadata);
    const jsonPath = path.join(temp, resolved.jsonRelativePath);
    const asset = getEmbeddedAsset(jsonPath);
    const targetWidth = Math.max(1, Math.round(asset.w * imageScale));
    const targetHeight = Math.max(1, Math.round(asset.h * imageScale));
    buffer = await prepareImageBuffer(buffer, fitToAsset, targetWidth, targetHeight);
    mime = "image/png";
    replaceBase64Image(jsonPath, toDataUri(buffer, mime), targetWidth, targetHeight, resolved.template);
    await zipToWas(temp, output);
    return output;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

module.exports = {
  buildLottieSticker,
  TEMPLATE_PRESETS: getTemplateMap()
};
