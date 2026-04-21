const fs = require("fs");
const path = require("path");
const readline = require("readline/promises");
const readlineCore = require("readline");
const { stdin, stdout } = require("process");
const { buildLottieSticker } = require("./src/index");
const { hasSavedAuth, ensureWhatsAppSession, sendWasSticker } = require("./src/send");
const { listValidatedTemplates } = require("./src/templates");
const { readState, updateState, uniqueRecent, STATE_PATH } = require("./src/state");

const CWD = process.cwd();
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_SCAN_DEPTH = 3;
const SCAN_SKIP_DIRS = new Set([".git", "node_modules"]);

const MENU_OPTIONS = [
  { key: "build", label: "Gerar .was", hint: "Escolha imagem, template e saida com ajuda da CLI" },
  { key: "send", label: "Enviar .was", hint: "Selecione um arquivo existente e envie" },
  { key: "build-send", label: "Gerar e enviar", hint: "Fluxo completo com menos passos" },
  { key: "templates", label: "Listar templates", hint: "Ver templates validados no registro" },
  { key: "exit", label: "Sair", hint: "Encerrar a CLI" }
];

function clearScreen() {
  stdout.write("\x1b[2J\x1b[0f");
}

function renderList(title, items, selectedIndex) {
  clearScreen();
  console.log(`${title}\n`);
  console.log("Use seta para cima/baixo e Enter.\n");

  items.forEach((item, index) => {
    const isSelected = index === selectedIndex;
    const line = `${isSelected ? "›" : " "} ${item.label}`;

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
    throw new Error(`Lista vazia para: ${title}`);
  }

  const { allowEscape = false } = options;

  return new Promise(resolve => {
    readlineCore.emitKeypressEvents(stdin);
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    let selectedIndex = 0;
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
  const { manualLabel = "Digitar caminho", manualHint = "Informar um caminho manualmente" } = config;
  const items = [...options];
  items.push({ key: "__manual__", label: manualLabel, hint: manualHint });

  const selected = await selectFromList(title, items, { allowEscape: true });
  if (selected === "__back__") {
    return "__back__";
  }

  if (selected === "__manual__") {
    return path.resolve(await ask(rl, "Caminho"));
  }

  return path.resolve(selected);
}

async function selectImagePath(rl, state) {
  const recentItems = createUniquePathItems(ensureArray(state.recent.images), "Recente: ");
  const discoveredItems = createUniquePathItems(discoverImageFiles(), "Encontrado: ");
  const items = [...recentItems];

  for (const item of discoveredItems) {
    if (!items.some(existing => existing.key === item.key)) {
      items.push(item);
    }
  }

  if (items.length === 0) {
    return path.resolve(await ask(rl, "Caminho da imagem", "./img.png"));
  }

  return selectOrTypePath(rl, "Escolha a imagem", items);
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
      hint: `Sugestao: ${formatPath(suggestedOutput)}`
    }
  ];

  for (const filePath of recentOutputs) {
    if (filePath === suggestedOutput) {
      continue;
    }

    items.push({
      key: filePath,
      label: path.basename(filePath),
      hint: `Recente: ${formatPath(filePath)}`
    });
  }

  const selected = await selectOrTypePath(rl, "Escolha o arquivo de saida (.was)", items, {
    manualLabel: "Digitar nome/caminho",
    manualHint: "Se faltar extensao, a CLI adiciona .was automaticamente"
  });
  if (selected === "__back__") {
    return "__back__";
  }

  if (!fileExists(selected)) {
    const normalized = ensureWasExtension(selected);
    if (normalized !== selected) {
      console.log(`Saida ajustada para ${formatPath(normalized)}\n`);
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
    throw new Error("Nenhum template valido encontrado em templates/registry.json.");
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

  return selectFromList("Escolha o template", items, { allowEscape: true });
}

function parseScale(value, fallback = 1) {
  const scale = Number(String(value || fallback).trim());
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error("Scale invalido. Use um numero maior que 0.");
  }

  return scale;
}

function normalizeTargetNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) {
    throw new Error("Informe o numero de destino.");
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
      label: "Sem metadados extras",
      hint: "Gerar rapido sem pack name, publisher e afins"
    },
    {
      key: "edit",
      label: "Preencher agora",
      hint: "Editar pack name, publisher, emojis e mais"
    }
  ];

  if (hasSavedMetadata) {
    items.unshift({
      key: "reuse",
      label: "Reusar metadados salvos",
      hint: "Usa os ultimos valores preenchidos"
    });
  }

  return selectFromList("Metadados do pack", items, { allowEscape: true });
}

async function askMetadata(rl, state) {
  const mode = await selectMetadataMode(state);
  if (mode === "__back__") {
    return "__back__";
  }

  if (mode === "skip") {
    return undefined;
  }

  const packName = await ask(rl, "Nome do pack", pickDefault(state, "packName", ""));
  const publisher = await ask(rl, "Publisher", pickDefault(state, "publisher", ""));
  const packId = await ask(rl, "Pack ID", pickDefault(state, "packId", ""));
  const accessibilityText = await ask(
    rl,
    "Accessibility text",
    pickDefault(state, "accessibilityText", "")
  );
  const emojis = await ask(rl, "Emojis separados por virgula", pickDefault(state, "emojis", ""));

  return {
    packName: packName || undefined,
    publisher: publisher || undefined,
    packId: packId || undefined,
    accessibilityText: accessibilityText || undefined,
    emojis: emojis ? emojis.split(",").map(value => value.trim()).filter(Boolean) : undefined
  };
}

async function askBuildConfig(rl, state) {
  console.log("Build\n");

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
  const metadata = await askMetadata(rl, state);
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
      emojis: Array.isArray(config.metadata?.emojis) ? config.metadata.emojis.join(",") : ""
    },
    recent: {
      ...state.recent,
      images: uniqueRecent(ensureArray(state.recent.images), config.imagePath),
      outputs: uniqueRecent(ensureArray(state.recent.outputs), result)
    }
  }));

  console.log(`\nGerado: ${result}\n`);
  return result;
}

async function selectStickerPath(rl, state, defaults = {}) {
  const explicitStickerPath = defaults.stickerPath ? path.resolve(defaults.stickerPath) : "";
  const items = [];

  if (explicitStickerPath && fileExists(explicitStickerPath)) {
    items.push({
      key: explicitStickerPath,
      label: path.basename(explicitStickerPath),
      hint: `Recem-gerado: ${formatPath(explicitStickerPath)}`
    });
  }

  const recentItems = createUniquePathItems(ensureArray(state.recent.outputs), "Recente: ");
  const detectedItems = createUniquePathItems(discoverWasFiles(), "Encontrado: ");

  for (const item of [...recentItems, ...detectedItems]) {
    if (!items.some(existing => existing.key === item.key)) {
      items.push(item);
    }
  }

  if (items.length === 0) {
    return path.resolve(await ask(rl, "Arquivo .was", "./output.was"));
  }

  return selectOrTypePath(rl, "Escolha o arquivo .was", items, {
    manualLabel: "Digitar caminho do .was",
    manualHint: "Informe um arquivo .was existente para envio"
  });
}

async function selectTargetNumber(rl, state, defaults = {}) {
  const preferredTarget = String(defaults.targetNumber || pickDefault(state, "targetNumber", "")).trim();
  const recentTargets = [...new Set([preferredTarget, ...ensureArray(state.recent.targets)].filter(Boolean))];

  if (recentTargets.length === 0) {
    const typedNumber = await ask(rl, "Numero de destino");
    const normalized = normalizeTargetNumber(typedNumber);
    if (normalized !== String(typedNumber).replace(/\D/g, "")) {
      console.log(`Numero ajustado para ${normalized}\n`);
    }
    return normalized;
  }

  const items = recentTargets.map(number => ({
    key: number,
    label: number,
    hint: number === preferredTarget ? "Ultimo usado" : "Recente"
  }));
  items.push({
    key: "__manual__",
    label: "Digitar numero",
    hint: "Informar manualmente o destino"
  });

  const selected = await selectFromList("Escolha o destino", items, { allowEscape: true });
  if (selected === "__back__") {
    return "__back__";
  }

  if (selected === "__manual__") {
    const typedNumber = await ask(rl, "Numero de destino", preferredTarget);
    const rawDigits = String(typedNumber || "").replace(/\D/g, "");
    const normalized = normalizeTargetNumber(typedNumber);
    if (normalized !== rawDigits) {
      console.log(`Numero ajustado para ${normalized}\n`);
    }
    return normalized;
  }

  return normalizeTargetNumber(selected);
}

async function selectAuthFolder(rl, state, defaults = {}) {
  const preferredAuth = path.resolve(defaults.authFolder || pickDefault(state, "authFolder", "./auth_info"));
  const items = [];

  items.push({
    key: preferredAuth,
    label: path.basename(preferredAuth),
    hint: `Padrao: ${formatPath(preferredAuth)}`
  });

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
      hint: `Sessao encontrada: ${formatPath(folderPath)}`
    });
  }

  return selectOrTypePath(rl, "Escolha a pasta de auth", items);
}

async function askLogoutMode() {
  const selected = await selectFromList("Sessao do WhatsApp", [
    {
      key: false,
      label: "Manter sessao conectada",
      hint: "Mais pratico para proximos envios"
    },
    {
      key: true,
      label: "Desconectar ao finalizar",
      hint: "Faz logout depois do envio"
    }
  ], { allowEscape: true });

  if (selected === "__back__") {
    return "__back__";
  }

  return selected === true || selected === "true";
}

async function ensureAuthBeforeSend(rl, state, defaults = {}) {
  console.log("Autenticacao\n");

  const authFolder = await selectAuthFolder(rl, state, defaults);
  if (authFolder === "__back__") {
    return "__back__";
  }

  const alreadyLoggedIn = hasSavedAuth(authFolder);

  if (alreadyLoggedIn) {
    console.log(`Sessao encontrada em ${formatPath(authFolder)}. Validando login...\n`);
  } else {
    console.log(`Nenhuma sessao encontrada em ${formatPath(authFolder)}. Vamos autenticar primeiro.\n`);
  }

  await ensureWhatsAppSession({
    authFolder,
    onStatus: message => console.log(message),
    onQr: qr => {
      console.log("");
      require("qrcode-terminal").generate(qr, { small: true });
      console.log("");
    }
  });

  updateState(stateValue => ({
    ...stateValue,
    defaults: {
      ...stateValue.defaults,
      authFolder
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
  console.log("Enviar\n");

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
      authFolder: config.authFolder
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
  await rl.question("Pressione Enter para voltar ao menu...");
}

function renderTemplatesScreen() {
  const templates = listValidatedTemplates();
  clearScreen();
  console.log("Templates registrados\n");

  if (templates.length === 0) {
    console.log("Nenhum template encontrado.\n");
  } else {
    templates.forEach(template => {
      const status = template.valid ? "ok" : "invalido";
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

  console.log(`Estado local salvo em ${STATE_PATH}\n`);
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    while (true) {
      const state = readState();
      const action = await selectFromList("Lottie WhatsApp CLI", MENU_OPTIONS);

      if (action === "build") {
        try {
          const config = await askBuildConfig(rl, state);
          if (config === "__back__") {
            continue;
          }
          await buildSticker(config);
        } catch (error) {
          console.error(`\nErro: ${error.message}\n`);
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
          console.error(`\nErro: ${error.message}\n`);
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
          console.error(`\nErro: ${error.message}\n`);
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
