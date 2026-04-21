const fs = require("fs");
const path = require("path");
const readline = require("readline/promises");
const readlineCore = require("readline");
const qrcode = require("qrcode-terminal");
const { stdin, stdout } = require("process");
const { buildLottieSticker } = require("./src/index");
const { hasSavedAuth, ensureWhatsAppSession, sendWasSticker } = require("./src/send");
const { listValidatedTemplates } = require("./src/templates");
const { readState, updateState, uniqueRecent, STATE_PATH } = require("./src/state");
const { DEFAULT_LANGUAGE, normalizeLanguage, setLanguage, t } = require("./src/i18n");

const CWD = process.cwd();
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_SCAN_DEPTH = 3;
const SCAN_SKIP_DIRS = new Set([".git", "node_modules"]);

function getMenuOptions() {
  return [
    { key: "build", label: t("cli.menu.build.label"), hint: t("cli.menu.build.hint") },
    { key: "send", label: t("cli.menu.send.label"), hint: t("cli.menu.send.hint") },
    { key: "build-send", label: t("cli.menu.buildSend.label"), hint: t("cli.menu.buildSend.hint") },
    { key: "templates", label: t("cli.menu.templates.label"), hint: t("cli.menu.templates.hint") },
    { key: "exit", label: t("cli.menu.exit.label"), hint: t("cli.menu.exit.hint") }
  ];
}

function clearScreen() {
  stdout.write("\x1b[2J\x1b[0f");
}

function renderList(title, items, selectedIndex) {
  clearScreen();
  console.log(`${title}\n`);
  console.log(`${t("cli.navigation")}\n`);

  items.forEach((item, index) => {
    const isSelected = index === selectedIndex;
    const line = `${isSelected ? ">" : " "} ${item.label}`;

    if (isSelected) {
      console.log(`\x1b[1;37;44m${line}\x1b[0m`);
    } else {
      console.log(line);
    }

    if (item.hint) {
      console.log(`\x1b[2m  ${item.hint}\x1b[0m`);
    }
  });
}

function selectFromList(title, items, options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(t("cli.emptyList", { title }));
  }

  const { allowEscape = false, initialIndex = 0 } = options;

  return new Promise(resolve => {
    readlineCore.emitKeypressEvents(stdin);
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    let selectedIndex = Math.max(0, Math.min(initialIndex, items.length - 1));
    renderList(title, items, selectedIndex);

    const cleanup = () => {
      stdin.off("keypress", onKeypress);
      if (stdin.isTTY) {
        stdin.setRawMode(false);
      }
    };

    const onKeypress = (_, key) => {
      if (key.name === "up") {
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        renderList(title, items, selectedIndex);
        return;
      }

      if (key.name === "down") {
        selectedIndex = (selectedIndex + 1) % items.length;
        renderList(title, items, selectedIndex);
        return;
      }

      if (key.name === "return") {
        const selectedItem = items[selectedIndex];
        cleanup();
        clearScreen();
        resolve(selectedItem.key);
        return;
      }

      if (allowEscape && key.name === "escape") {
        cleanup();
        clearScreen();
        resolve("__back__");
        return;
      }

      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(0);
      }
    };

    stdin.on("keypress", onKeypress);
  });
}

async function ask(rl, label, fallback = "") {
  const suffix = fallback ? ` (${fallback})` : "";
  const value = await rl.question(`${label}${suffix}: `);
  return value.trim() || fallback;
}

function pickDefault(state, key, fallback = "") {
  return state.defaults[key] || fallback;
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function ensureArray(values) {
  return Array.isArray(values) ? values : [];
}

function formatPath(filePath) {
  const relativePath = path.relative(CWD, filePath);
  return relativePath && !relativePath.startsWith("..") ? `./${relativePath}` : filePath;
}

function walkFiles(dirPath, depth, collector) {
  if (depth > MAX_SCAN_DEPTH || !fileExists(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (SCAN_SKIP_DIRS.has(entry.name)) {
        continue;
      }

      walkFiles(absolutePath, depth + 1, collector);
      continue;
    }

    collector(absolutePath, entry);
  }
}

function discoverFiles(predicate) {
  const matches = [];

  walkFiles(CWD, 0, absolutePath => {
    if (predicate(absolutePath)) {
      matches.push(absolutePath);
    }
  });

  return matches.sort((left, right) => left.localeCompare(right));
}

function discoverImageFiles() {
  return discoverFiles(filePath => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()));
}

function discoverWasFiles() {
  return discoverFiles(filePath => path.extname(filePath).toLowerCase() === ".was");
}

function discoverAuthFolders() {
  const folders = [];

  walkFiles(CWD, 0, (absolutePath, entry) => {
    if (entry.isFile() && entry.name === "creds.json") {
      folders.push(path.dirname(absolutePath));
    }
  });

  return [...new Set(folders)].sort((left, right) => left.localeCompare(right));
}

function toChoiceItem(filePath, hintPrefix = "") {
  return {
    key: filePath,
    label: path.basename(filePath),
    hint: `${hintPrefix}${formatPath(filePath)}`
  };
}

function createUniquePathItems(paths, hintPrefix = "") {
  return [...new Set(paths.filter(Boolean))]
    .filter(fileExists)
    .map(filePath => toChoiceItem(path.resolve(filePath), hintPrefix));
}

function ensureWasExtension(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (path.extname(resolvedPath).toLowerCase() === ".was") {
    return resolvedPath;
  }

  return `${resolvedPath}.was`;
}

async function selectOrTypePath(rl, title, options, config = {}) {
  const {
    manualLabel = t("cli.manualPathLabel"),
    manualHint = t("cli.manualPathHint")
  } = config;

  const items = [...options, { key: "__manual__", label: manualLabel, hint: manualHint }];
  const selected = await selectFromList(title, items, { allowEscape: true });

  if (selected === "__back__") {
    return "__back__";
  }

  if (selected === "__manual__") {
    return path.resolve(await ask(rl, t("cli.pathPrompt")));
  }

  return path.resolve(selected);
}

async function selectImagePath(rl, state) {
  const recentItems = createUniquePathItems(ensureArray(state.recent.images), t("cli.recentPrefix"));
  const discoveredItems = createUniquePathItems(discoverImageFiles(), t("cli.foundPrefix"));
  const items = [...recentItems];

  for (const item of discoveredItems) {
    if (!items.some(existing => existing.key === item.key)) {
      items.push(item);
    }
  }

  if (items.length === 0) {
    return path.resolve(await ask(rl, t("cli.imagePathPrompt"), "./img.png"));
  }

  return selectOrTypePath(rl, t("cli.chooseImage"), items);
}

function suggestOutputPath(imagePath, state) {
  const defaultOutput = pickDefault(state, "output", "");
  if (defaultOutput) {
    return path.resolve(defaultOutput);
  }

  const imageName = path.basename(imagePath, path.extname(imagePath));
  return path.resolve(CWD, `${imageName || "output"}.was`);
}

async function selectOutputPath(rl, state, imagePath) {
  const suggestedOutput = suggestOutputPath(imagePath, state);
  const recentOutputs = [...new Set(ensureArray(state.recent.outputs).map(item => path.resolve(item)))];
  const items = [
    {
      key: suggestedOutput,
      label: path.basename(suggestedOutput),
      hint: `${t("cli.outputSuggestion")}${formatPath(suggestedOutput)}`
    }
  ];

  for (const filePath of recentOutputs) {
    if (filePath === suggestedOutput) {
      continue;
    }

    items.push({
      key: filePath,
      label: path.basename(filePath),
      hint: `${t("cli.outputRecent")}${formatPath(filePath)}`
    });
  }

  const selected = await selectOrTypePath(rl, t("cli.chooseOutput"), items, {
    manualLabel: t("cli.outputManualLabel"),
    manualHint: t("cli.outputManualHint")
  });

  if (selected === "__back__") {
    return "__back__";
  }

  if (!fileExists(selected)) {
    const normalized = ensureWasExtension(selected);
    if (normalized !== selected) {
      console.log(`${t("cli.outputAdjusted", { path: formatPath(normalized) })}\n`);
    }
    return normalized;
  }

  return selected;
}

function getValidatedTemplates() {
  return listValidatedTemplates()
    .filter(template => template.valid)
    .sort((left, right) => String(left.label || left.id).localeCompare(String(right.label || right.id)));
}

async function selectTemplate(state) {
  const templates = getValidatedTemplates();
  if (templates.length === 0) {
    throw new Error(t("cli.noValidTemplates"));
  }

  const preferredTemplate = pickDefault(state, "template", "");
  const sortedTemplates = [...templates].sort((left, right) => {
    if (left.id === preferredTemplate) return -1;
    if (right.id === preferredTemplate) return 1;
    return 0;
  });

  const items = sortedTemplates.map(template => ({
    key: template.id,
    label: `${template.label || template.id} (${template.id})`,
    hint: template.description || formatPath(template.jsonPath)
  }));

  return selectFromList(t("cli.chooseTemplate"), items, { allowEscape: true });
}

function parseScale(value, fallback = 1) {
  const scale = Number(String(value || fallback).trim());
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(t("cli.invalidScale"));
  }

  return scale;
}

function normalizeTargetNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) {
    throw new Error(t("cli.invalidTarget"));
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
}

async function selectMetadataMode(state) {
  const hasSavedMetadata = Boolean(
    pickDefault(state, "packName", "") ||
      pickDefault(state, "publisher", "") ||
      pickDefault(state, "packId", "") ||
      pickDefault(state, "accessibilityText", "") ||
      pickDefault(state, "emojis", "")
  );

  const items = [
    {
      key: "skip",
      label: t("cli.metadataSkip.label"),
      hint: t("cli.metadataSkip.hint")
    },
    {
      key: "edit",
      label: t("cli.metadataEdit.label"),
      hint: t("cli.metadataEdit.hint")
    }
  ];

  if (hasSavedMetadata) {
    items.unshift({
      key: "reuse",
      label: t("cli.metadataReuse.label"),
      hint: t("cli.metadataReuse.hint")
    });
  }

  return selectFromList(t("cli.metadataTitle"), items, { allowEscape: true });
}

async function askMetadata(rl, state) {
  const mode = await selectMetadataMode(state);
  if (mode === "__back__") {
    return "__back__";
  }

  if (mode === "skip") {
    return undefined;
  }

  return {
    packName: (await ask(rl, t("cli.packName"), pickDefault(state, "packName", ""))) || undefined,
    publisher: (await ask(rl, t("cli.publisher"), pickDefault(state, "publisher", ""))) || undefined,
    packId: (await ask(rl, t("cli.packId"), pickDefault(state, "packId", ""))) || undefined,
    accessibilityText:
      (await ask(rl, t("cli.accessibilityText"), pickDefault(state, "accessibilityText", ""))) || undefined,
    emojis: (() => {
      const fallback = pickDefault(state, "emojis", "");
      return fallback;
    })()
  };
}

async function finalizeMetadata(rl, state, metadata) {
  if (metadata === "__back__" || metadata === undefined) {
    return metadata;
  }

  const emojiValue = await ask(rl, t("cli.emojis"), pickDefault(state, "emojis", ""));

  return {
    ...metadata,
    emojis: emojiValue ? emojiValue.split(",").map(value => value.trim()).filter(Boolean) : undefined
  };
}

async function askBuildConfig(rl, state) {
  console.log(`${t("cli.buildTitle")}\n`);

  const imagePath = await selectImagePath(rl, state);
  if (imagePath === "__back__") {
    return "__back__";
  }

  const output = await selectOutputPath(rl, state, imagePath);
  if (output === "__back__") {
    return "__back__";
  }

  const template = await selectTemplate(state);
  if (template === "__back__") {
    return "__back__";
  }

  const scaleInput = await ask(rl, "Scale", String(pickDefault(state, "imageScale", 1)));
  const metadataMode = await askMetadata(rl, state);
  const metadata = await finalizeMetadata(rl, state, metadataMode);
  if (metadata === "__back__") {
    return "__back__";
  }

  return {
    imagePath,
    output,
    template,
    imageScale: parseScale(scaleInput, 1),
    metadata
  };
}

async function buildSticker(config) {
  const result = await buildLottieSticker(config);
  updateState(state => ({
    ...state,
    defaults: {
      ...state.defaults,
      imagePath: config.imagePath,
      output: result,
      template: config.template,
      imageScale: config.imageScale,
      packName: config.metadata?.packName || "",
      publisher: config.metadata?.publisher || "",
      packId: config.metadata?.packId || "",
      accessibilityText: config.metadata?.accessibilityText || "",
      emojis: Array.isArray(config.metadata?.emojis) ? config.metadata.emojis.join(",") : "",
      language: state.defaults.language || DEFAULT_LANGUAGE
    },
    recent: {
      ...state.recent,
      images: uniqueRecent(ensureArray(state.recent.images), config.imagePath),
      outputs: uniqueRecent(ensureArray(state.recent.outputs), result)
    }
  }));

  console.log(`\n${t("cli.built", { path: result })}\n`);
  return result;
}

async function selectStickerPath(rl, state, defaults = {}) {
  const explicitStickerPath = defaults.stickerPath ? path.resolve(defaults.stickerPath) : "";
  const items = [];

  if (explicitStickerPath && fileExists(explicitStickerPath)) {
    items.push({
      key: explicitStickerPath,
      label: path.basename(explicitStickerPath),
      hint: `${t("cli.justBuiltPrefix")}${formatPath(explicitStickerPath)}`
    });
  }

  const recentItems = createUniquePathItems(ensureArray(state.recent.outputs), t("cli.recentPrefix"));
  const detectedItems = createUniquePathItems(discoverWasFiles(), t("cli.foundPrefix"));

  for (const item of [...recentItems, ...detectedItems]) {
    if (!items.some(existing => existing.key === item.key)) {
      items.push(item);
    }
  }

  if (items.length === 0) {
    return path.resolve(await ask(rl, t("cli.wasPrompt"), "./output.was"));
  }

  return selectOrTypePath(rl, t("cli.chooseWas"), items, {
    manualLabel: t("cli.wasManualLabel"),
    manualHint: t("cli.wasManualHint")
  });
}

async function selectTargetNumber(rl, state, defaults = {}) {
  const preferredTarget = String(defaults.targetNumber || pickDefault(state, "targetNumber", "")).trim();
  const recentTargets = [...new Set([preferredTarget, ...ensureArray(state.recent.targets)].filter(Boolean))];

  if (recentTargets.length === 0) {
    const typedNumber = await ask(rl, t("cli.destinationPrompt"));
    const rawDigits = String(typedNumber || "").replace(/\D/g, "");
    const normalized = normalizeTargetNumber(typedNumber);
    if (normalized !== rawDigits) {
      console.log(`${t("cli.numberAdjusted", { number: normalized })}\n`);
    }
    return normalized;
  }

  const items = recentTargets.map(number => ({
    key: number,
    label: number,
    hint: number === preferredTarget ? t("cli.lastUsed") : t("cli.recentShort")
  }));
  items.push({
    key: "__manual__",
    label: t("cli.manualNumberLabel"),
    hint: t("cli.manualNumberHint")
  });

  const selected = await selectFromList(t("cli.chooseDestination"), items, { allowEscape: true });
  if (selected === "__back__") {
    return "__back__";
  }

  if (selected === "__manual__") {
    const typedNumber = await ask(rl, t("cli.destinationPrompt"), preferredTarget);
    const rawDigits = String(typedNumber || "").replace(/\D/g, "");
    const normalized = normalizeTargetNumber(typedNumber);
    if (normalized !== rawDigits) {
      console.log(`${t("cli.numberAdjusted", { number: normalized })}\n`);
    }
    return normalized;
  }

  return normalizeTargetNumber(selected);
}

async function selectAuthFolder(rl, state, defaults = {}) {
  const preferredAuth = path.resolve(defaults.authFolder || pickDefault(state, "authFolder", "./auth_info"));
  const items = [
    {
      key: preferredAuth,
      label: path.basename(preferredAuth),
      hint: `${t("cli.defaultAuth")}${formatPath(preferredAuth)}`
    }
  ];

  const recentAuthFolders = ensureArray(state.recent.authFolders).map(item => path.resolve(item));
  const detectedFolders = [
    ...new Set([preferredAuth, ...recentAuthFolders, ...discoverAuthFolders().map(item => path.resolve(item))])
  ];

  for (const folderPath of detectedFolders) {
    if (folderPath === preferredAuth) {
      continue;
    }

    items.push({
      key: folderPath,
      label: path.basename(folderPath),
      hint: `${t("cli.foundSession")}${formatPath(folderPath)}`
    });
  }

  return selectOrTypePath(rl, t("cli.chooseAuthFolder"), items);
}

async function askLogoutMode() {
  const selected = await selectFromList(
    t("cli.whatsAppSession"),
    [
      {
        key: false,
        label: t("cli.keepSession.label"),
        hint: t("cli.keepSession.hint")
      },
      {
        key: true,
        label: t("cli.logout.label"),
        hint: t("cli.logout.hint")
      }
    ],
    { allowEscape: true }
  );

  if (selected === "__back__") {
    return "__back__";
  }

  return selected === true || selected === "true";
}

async function ensureAuthBeforeSend(rl, state, defaults = {}) {
  console.log(`${t("cli.authTitle")}\n`);

  const authFolder = await selectAuthFolder(rl, state, defaults);
  if (authFolder === "__back__") {
    return "__back__";
  }

  const alreadyLoggedIn = hasSavedAuth(authFolder);
  console.log(
    `${alreadyLoggedIn ? t("cli.sessionFound", { path: formatPath(authFolder) }) : t("cli.sessionMissing", { path: formatPath(authFolder) })}\n`
  );

  await ensureWhatsAppSession({
    authFolder,
    onStatus: message => console.log(message),
    onQr: qr => {
      console.log("");
      qrcode.generate(qr, { small: true });
      console.log("");
    }
  });

  updateState(stateValue => ({
    ...stateValue,
    defaults: {
      ...stateValue.defaults,
      authFolder,
      language: stateValue.defaults.language || DEFAULT_LANGUAGE
    },
    recent: {
      ...stateValue.recent,
      authFolders: uniqueRecent(ensureArray(stateValue.recent.authFolders), authFolder)
    }
  }));

  await pause(rl);
  return authFolder;
}

async function askSendConfig(rl, state, defaults = {}) {
  console.log(`${t("cli.sendTitle")}\n`);

  const stickerPath = await selectStickerPath(rl, state, defaults);
  if (stickerPath === "__back__") {
    return "__back__";
  }

  const targetNumber = await selectTargetNumber(rl, state, defaults);
  if (targetNumber === "__back__") {
    return "__back__";
  }

  const authFolder = defaults.authFolder
    ? path.resolve(defaults.authFolder)
    : await selectAuthFolder(rl, state, defaults);
  if (authFolder === "__back__") {
    return "__back__";
  }

  const logoutOnSuccess = await askLogoutMode();
  if (logoutOnSuccess === "__back__") {
    return "__back__";
  }

  return {
    stickerPath,
    targetNumber,
    authFolder,
    logoutOnSuccess
  };
}

async function sendSticker(config) {
  await sendWasSticker({
    ...config,
    onStatus: message => console.log(message)
  });

  updateState(state => ({
    ...state,
    defaults: {
      ...state.defaults,
      output: config.stickerPath,
      targetNumber: config.targetNumber,
      authFolder: config.authFolder,
      language: state.defaults.language || DEFAULT_LANGUAGE
    },
    recent: {
      ...state.recent,
      outputs: uniqueRecent(ensureArray(state.recent.outputs), config.stickerPath),
      targets: uniqueRecent(ensureArray(state.recent.targets), config.targetNumber),
      authFolders: uniqueRecent(ensureArray(state.recent.authFolders), config.authFolder)
    }
  }));

  console.log("");
}

async function pause(rl) {
  await rl.question(t("cli.pause"));
}

function renderTemplatesScreen() {
  const templates = listValidatedTemplates();
  clearScreen();
  console.log(`${t("cli.templatesTitle")}\n`);

  if (templates.length === 0) {
    console.log(`${t("cli.noTemplatesFound")}\n`);
  } else {
    templates.forEach(template => {
      const status = template.valid ? t("cli.templateValid") : t("cli.templateInvalid");
      console.log(`- ${template.label || template.id} (${template.id}) [${status}]`);
      if (template.description) {
        console.log(`  ${template.description}`);
      }
      console.log(`  ${formatPath(template.baseFolder)} -> ${template.jsonRelativePath}`);
      if (!template.valid && template.errors.length) {
        console.log(`  ${template.errors.join(" | ")}`);
      }
    });
    console.log("");
  }

  console.log(`${t("cli.stateSaved", { path: STATE_PATH })}\n`);
}

async function chooseLanguage() {
  const state = readState();
  const savedLanguage = normalizeLanguage(pickDefault(state, "language", DEFAULT_LANGUAGE));
  setLanguage(savedLanguage);

  const languages = [
    {
      key: "en",
      label: "English",
      hint: t("cli.languageHintEn")
    },
    {
      key: "pt-BR",
      label: "Portugues (Brasil)",
      hint: t("cli.languageHintPtbr")
    }
  ];

  const selected = await selectFromList("Choose language / Escolha o idioma", languages, {
    initialIndex: savedLanguage === "pt-BR" ? 1 : 0
  });

  setLanguage(selected);
  updateState(current => ({
    ...current,
    defaults: {
      ...current.defaults,
      language: selected
    }
  }));
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    await chooseLanguage();

    while (true) {
      const state = readState();
      setLanguage(normalizeLanguage(pickDefault(state, "language", DEFAULT_LANGUAGE)));
      const action = await selectFromList(t("cli.appTitle"), getMenuOptions());

      if (action === "build") {
        try {
          const config = await askBuildConfig(rl, state);
          if (config === "__back__") {
            continue;
          }
          await buildSticker(config);
        } catch (error) {
          console.error(`\n${t("cli.errorPrefix")}: ${error.message}\n`);
        }
        await pause(rl);
        continue;
      }

      if (action === "send") {
        try {
          const authFolder = await ensureAuthBeforeSend(rl, state);
          if (authFolder === "__back__") {
            continue;
          }
          const config = await askSendConfig(rl, readState(), { authFolder });
          if (config === "__back__") {
            continue;
          }
          await sendSticker(config);
        } catch (error) {
          console.error(`\n${t("cli.errorPrefix")}: ${error.message}\n`);
        }
        await pause(rl);
        continue;
      }

      if (action === "build-send") {
        try {
          const authFolder = await ensureAuthBeforeSend(rl, state);
          if (authFolder === "__back__") {
            continue;
          }
          const buildConfig = await askBuildConfig(rl, state);
          if (buildConfig === "__back__") {
            continue;
          }
          const stickerPath = await buildSticker(buildConfig);
          const sendConfig = await askSendConfig(rl, readState(), { stickerPath, authFolder });
          if (sendConfig === "__back__") {
            continue;
          }
          await sendSticker(sendConfig);
        } catch (error) {
          console.error(`\n${t("cli.errorPrefix")}: ${error.message}\n`);
        }
        await pause(rl);
        continue;
      }

      if (action === "templates") {
        renderTemplatesScreen();
        await pause(rl);
        continue;
      }

      if (action === "exit") {
        return;
      }
    }
  } finally {
    rl.close();
  }
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
