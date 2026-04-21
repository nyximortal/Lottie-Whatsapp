const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execSync } = require("child_process");
const sharp = require("sharp");

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

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

function replaceBase64Image(jsonPath, dataUri, width, height) {
  const json = readLottieJson(jsonPath);
  const asset = getEmbeddedAssetFromJson(json);

  asset.p = dataUri;
  if (width && height) {
    updateAssetSize(json, asset, width, height);
  }

  writeLottieJson(jsonPath, json);
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

function zipToWas(folder, output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });

  const zipPath = output.replace(/\.was$/i, ".zip");
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  if (fs.existsSync(output)) fs.unlinkSync(output);

  execSync(`zip -r "${zipPath}" .`, { cwd: folder, stdio: "ignore" });
  fs.renameSync(zipPath, output);
}

async function buildLottieSticker({
  baseFolder,
  output = path.resolve("./jurubeba.was"),
  imagePath,
  buffer,
  mime,
  jsonRelativePath = "animation/animation_secondary.json",
  fitToAsset = true,
  imageScale = 1
}) {
  if (!fs.existsSync(baseFolder)) throw new Error("baseFolder não encontrado.");

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
    copyDir(baseFolder, temp);
    const jsonPath = path.join(temp, jsonRelativePath);
    const asset = getEmbeddedAsset(jsonPath);
    const targetWidth = Math.max(1, Math.round(asset.w * imageScale));
    const targetHeight = Math.max(1, Math.round(asset.h * imageScale));
    buffer = await prepareImageBuffer(buffer, fitToAsset, targetWidth, targetHeight);
    mime = "image/png";
    replaceBase64Image(jsonPath, toDataUri(buffer, mime), targetWidth, targetHeight);
    zipToWas(temp, output);
    return output;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

module.exports = { buildLottieSticker };
