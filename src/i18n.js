const SUPPORTED_LANGUAGES = ["en", "pt-BR"];
const DEFAULT_LANGUAGE = "en";

let currentLanguage = DEFAULT_LANGUAGE;

function normalizeLanguage(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "pt" || normalized === "pt-br" || normalized === "pt_br") {
    return "pt-BR";
  }

  if (normalized === "en" || normalized === "en-us" || normalized === "en_us") {
    return "en";
  }

  return DEFAULT_LANGUAGE;
}

function setLanguage(value) {
  currentLanguage = normalizeLanguage(value);
  return currentLanguage;
}

function getLanguage() {
  return currentLanguage;
}

function selectLocalizedField(entry, baseName) {
  const ptbrKey = `${baseName}Ptbr`;
  const enKey = `${baseName}En`;

  if (currentLanguage === "pt-BR") {
    return entry[ptbrKey] || entry[baseName] || entry[enKey] || "";
  }

  return entry[enKey] || entry[baseName] || entry[ptbrKey] || "";
}

const messages = {
  en: {
    "cli.languageTitle": "Choose language",
    "cli.languageHintEn": "Use English across the CLI, docs, and runtime messages",
    "cli.languageHintPtbr": "Usar portugues do Brasil em toda a CLI e mensagens",
    "cli.appTitle": "Lottie WhatsApp CLI",
    "cli.navigation": "Use up/down arrows and Enter.",
    "cli.emptyList": ({ title }) => `Empty list for: ${title}`,
    "cli.menu.build.label": "Build .was",
    "cli.menu.build.hint": "Choose image, template, and output with guided prompts",
    "cli.menu.send.label": "Send .was",
    "cli.menu.send.hint": "Pick an existing file and send it",
    "cli.menu.buildSend.label": "Build and send",
    "cli.menu.buildSend.hint": "Complete flow with fewer steps",
    "cli.menu.templates.label": "List templates",
    "cli.menu.templates.hint": "Review validated templates from the registry",
    "cli.menu.exit.label": "Exit",
    "cli.menu.exit.hint": "Close the CLI",
    "cli.manualPathLabel": "Type path",
    "cli.manualPathHint": "Enter a path manually",
    "cli.pathPrompt": "Path",
    "cli.recentPrefix": "Recent: ",
    "cli.foundPrefix": "Found: ",
    "cli.imagePathPrompt": "Image path",
    "cli.chooseImage": "Choose image",
    "cli.outputSuggestion": "Suggested: ",
    "cli.outputRecent": "Recent: ",
    "cli.chooseOutput": "Choose output file (.was)",
    "cli.outputManualLabel": "Type name/path",
    "cli.outputManualHint": "If .was is missing, the CLI adds it automatically",
    "cli.outputAdjusted": ({ path }) => `Output adjusted to ${path}`,
    "cli.noValidTemplates": "No valid template found in templates/registry.json.",
    "cli.chooseTemplate": "Choose template",
    "cli.invalidScale": "Invalid scale. Use a number greater than 0.",
    "cli.invalidTarget": "Enter a destination number.",
    "cli.metadataTitle": "Pack metadata",
    "cli.metadataReuse.label": "Reuse saved metadata",
    "cli.metadataReuse.hint": "Use the latest values you already entered",
    "cli.metadataSkip.label": "No extra metadata",
    "cli.metadataSkip.hint": "Build quickly without pack name, publisher, and more",
    "cli.metadataEdit.label": "Fill now",
    "cli.metadataEdit.hint": "Edit pack name, publisher, emojis, and more",
    "cli.packName": "Pack name",
    "cli.publisher": "Publisher",
    "cli.packId": "Pack ID",
    "cli.accessibilityText": "Accessibility text",
    "cli.emojis": "Comma-separated emojis",
    "cli.buildTitle": "Build",
    "cli.built": ({ path }) => `Built: ${path}`,
    "cli.justBuiltPrefix": "Just built: ",
    "cli.wasPrompt": ".was file",
    "cli.chooseWas": "Choose .was file",
    "cli.wasManualLabel": "Type .was path",
    "cli.wasManualHint": "Provide an existing .was file to send",
    "cli.destinationPrompt": "Destination number",
    "cli.lastUsed": "Last used",
    "cli.recentShort": "Recent",
    "cli.manualNumberLabel": "Type number",
    "cli.manualNumberHint": "Enter the destination manually",
    "cli.chooseDestination": "Choose destination",
    "cli.numberAdjusted": ({ number }) => `Number adjusted to ${number}`,
    "cli.defaultAuth": "Default: ",
    "cli.foundSession": "Session found: ",
    "cli.chooseAuthFolder": "Choose auth folder",
    "cli.authTitle": "Authentication",
    "cli.sessionFound": ({ path }) => `Session found in ${path}. Validating login...`,
    "cli.sessionMissing": ({ path }) => `No session found in ${path}. Authentication is required first.`,
    "cli.sendTitle": "Send",
    "cli.keepSession.label": "Keep session connected",
    "cli.keepSession.hint": "More convenient for future sends",
    "cli.logout.label": "Disconnect when done",
    "cli.logout.hint": "Log out after sending",
    "cli.whatsAppSession": "WhatsApp session",
    "cli.pause": "Press Enter to return to the menu...",
    "cli.templatesTitle": "Registered templates",
    "cli.noTemplatesFound": "No templates found.",
    "cli.templateValid": "ok",
    "cli.templateInvalid": "invalid",
    "cli.stateSaved": ({ path }) => `Local state saved in ${path}`,
    "cli.errorPrefix": "Error",
    "buildWas.usage": ({ templates }) =>
      `Usage:\n  node build-was.js --image ./img.png [--output ./sticker.was] [--scale 1.2]\n                     [--template ${templates}]\n                     [--pack-name "My Pack"] [--publisher "My Name"]\n                     [--pack-id "uuid-or-id"] [--accessibility-text "Description"]\n                     [--emojis "😀,🔥"]\n                     [--base-folder ./src/exemple]\n                     [--json animation/animation_secondary.json]\n                     [--lang en|pt-BR]\n                     [--no-fit]\n  node build-was.js --list-templates`,
    "buildWas.invalidArg": ({ arg }) => `Invalid argument: ${arg}`,
    "buildWas.missingValue": ({ key }) => `Missing value for --${key}`,
    "buildWas.invalidTemplate": ({ templates }) => `Invalid template. Use one of: ${templates}`,
    "sendWas.usage":
      "Usage:\n  node send-was.js --to 1234567890 [--file ./output.was]\n                   [--auth-dir ./auth_info] [--lang en|pt-BR] [--logout]",
    "sendWas.invalidArg": ({ arg }) => `Invalid argument: ${arg}`,
    "sendWas.missingValue": ({ key }) => `Missing value for --${key}`,
    "sendWas.targetRequired": "Enter the destination number with --to or WHATSAPP_TARGET.",
    "runtime.invalidBuffer": "Invalid buffer.",
    "runtime.missingMime": "MIME type not detected. Provide imagePath or mime.",
    "runtime.jsonWithoutAssets": "JSON has no assets.",
    "runtime.noEmbeddedImage": "No base64 image found in the Lottie file.",
    "runtime.unknownTemplate": ({ template }) => `Unknown template: ${template}`,
    "runtime.baseFolderMissing": "baseFolder not found.",
    "runtime.imageSourceRequired": "Provide imagePath or buffer.",
    "runtime.imageNotFound": "Image not found.",
    "runtime.unsupportedFormat": "Unsupported format. Use PNG, JPG, JPEG, or WEBP.",
    "runtime.unsupportedImageEngine": ({ engine }) => `Unsupported image engine: ${engine}. Use sharp or jimp.`,
    "runtime.sharpUnavailable": ({ message }) =>
      `sharp could not be loaded in this environment. Use npm run cli:termux or npm run build:was:termux. Original error: ${message}`,
    "runtime.jimpUnavailable": ({ message }) => `jimp could not be loaded. Original error: ${message}`,
    "send.sessionExpired": "Previous session is no longer valid. Scan the new QR code.",
    "send.loginRequired": "Login required. Scan the QR code with WhatsApp.",
    "send.sessionValidated": "Session validated.",
    "send.loginCompleted": "Login completed.",
    "send.sessionDisconnected": "Session disconnected. Generate a new QR code to continue.",
    "send.connectionClosedAfterQr":
      "Connection closed after the QR code. Waiting to reconnect and finish login...",
    "send.connectionClosedValidating":
      "Connection closed while validating the session. Reconnecting...",
    "send.targetRequired": "Enter the destination number.",
    "send.fileNotFound": ({ path }) => `.was file not found: ${path}`,
    "send.connectingToSend": ({ file }) => `Connecting to WhatsApp to send ${file}...`,
    "send.connectingSession": "Connecting sending session...",
    "send.qrGenerated": "QR code generated. Scan it with WhatsApp on your phone.",
    "send.sessionConnected": ({ number }) => `Session connected. Sending sticker to ${number}...`,
    "send.stickerSent": ({ number }) => `Sticker sent to ${number}`,
    "send.sessionDisconnectedAgain":
      "WhatsApp session disconnected. Run the command again to generate another QR code.",
    "send.connectionClosedBeforeSend": "Connection closed before sending. Reconnecting...",
    "templates.missingId": "Template missing id.",
    "templates.baseFolderMissing": ({ path }) => `baseFolder not found: ${path}`,
    "templates.jsonPathMissing": ({ path }) => `jsonRelativePath not found: ${path}`
  },
  "pt-BR": {
    "cli.languageTitle": "Escolha o idioma",
    "cli.languageHintEn": "Use English em toda a CLI, docs e mensagens",
    "cli.languageHintPtbr": "Usar portugues do Brasil em toda a CLI e mensagens",
    "cli.appTitle": "Lottie WhatsApp CLI",
    "cli.navigation": "Use seta para cima/baixo e Enter.",
    "cli.emptyList": ({ title }) => `Lista vazia para: ${title}`,
    "cli.menu.build.label": "Gerar .was",
    "cli.menu.build.hint": "Escolha imagem, template e saida com ajuda da CLI",
    "cli.menu.send.label": "Enviar .was",
    "cli.menu.send.hint": "Selecione um arquivo existente e envie",
    "cli.menu.buildSend.label": "Gerar e enviar",
    "cli.menu.buildSend.hint": "Fluxo completo com menos passos",
    "cli.menu.templates.label": "Listar templates",
    "cli.menu.templates.hint": "Ver templates validados no registro",
    "cli.menu.exit.label": "Sair",
    "cli.menu.exit.hint": "Encerrar a CLI",
    "cli.manualPathLabel": "Digitar caminho",
    "cli.manualPathHint": "Informar um caminho manualmente",
    "cli.pathPrompt": "Caminho",
    "cli.recentPrefix": "Recente: ",
    "cli.foundPrefix": "Encontrado: ",
    "cli.imagePathPrompt": "Caminho da imagem",
    "cli.chooseImage": "Escolha a imagem",
    "cli.outputSuggestion": "Sugestao: ",
    "cli.outputRecent": "Recente: ",
    "cli.chooseOutput": "Escolha o arquivo de saida (.was)",
    "cli.outputManualLabel": "Digitar nome/caminho",
    "cli.outputManualHint": "Se faltar extensao, a CLI adiciona .was automaticamente",
    "cli.outputAdjusted": ({ path }) => `Saida ajustada para ${path}`,
    "cli.noValidTemplates": "Nenhum template valido encontrado em templates/registry.json.",
    "cli.chooseTemplate": "Escolha o template",
    "cli.invalidScale": "Scale invalido. Use um numero maior que 0.",
    "cli.invalidTarget": "Informe o numero de destino.",
    "cli.metadataTitle": "Metadados do pack",
    "cli.metadataReuse.label": "Reusar metadados salvos",
    "cli.metadataReuse.hint": "Usa os ultimos valores preenchidos",
    "cli.metadataSkip.label": "Sem metadados extras",
    "cli.metadataSkip.hint": "Gerar rapido sem pack name, publisher e afins",
    "cli.metadataEdit.label": "Preencher agora",
    "cli.metadataEdit.hint": "Editar pack name, publisher, emojis e mais",
    "cli.packName": "Nome do pack",
    "cli.publisher": "Publisher",
    "cli.packId": "Pack ID",
    "cli.accessibilityText": "Accessibility text",
    "cli.emojis": "Emojis separados por virgula",
    "cli.buildTitle": "Build",
    "cli.built": ({ path }) => `Gerado: ${path}`,
    "cli.justBuiltPrefix": "Recem-gerado: ",
    "cli.wasPrompt": "Arquivo .was",
    "cli.chooseWas": "Escolha o arquivo .was",
    "cli.wasManualLabel": "Digitar caminho do .was",
    "cli.wasManualHint": "Informe um arquivo .was existente para envio",
    "cli.destinationPrompt": "Numero de destino",
    "cli.lastUsed": "Ultimo usado",
    "cli.recentShort": "Recente",
    "cli.manualNumberLabel": "Digitar numero",
    "cli.manualNumberHint": "Informar manualmente o destino",
    "cli.chooseDestination": "Escolha o destino",
    "cli.numberAdjusted": ({ number }) => `Numero ajustado para ${number}`,
    "cli.defaultAuth": "Padrao: ",
    "cli.foundSession": "Sessao encontrada: ",
    "cli.chooseAuthFolder": "Escolha a pasta de auth",
    "cli.authTitle": "Autenticacao",
    "cli.sessionFound": ({ path }) => `Sessao encontrada em ${path}. Validando login...`,
    "cli.sessionMissing": ({ path }) => `Nenhuma sessao encontrada em ${path}. Vamos autenticar primeiro.`,
    "cli.sendTitle": "Enviar",
    "cli.keepSession.label": "Manter sessao conectada",
    "cli.keepSession.hint": "Mais pratico para proximos envios",
    "cli.logout.label": "Desconectar ao finalizar",
    "cli.logout.hint": "Faz logout depois do envio",
    "cli.whatsAppSession": "Sessao do WhatsApp",
    "cli.pause": "Pressione Enter para voltar ao menu...",
    "cli.templatesTitle": "Templates registrados",
    "cli.noTemplatesFound": "Nenhum template encontrado.",
    "cli.templateValid": "ok",
    "cli.templateInvalid": "invalido",
    "cli.stateSaved": ({ path }) => `Estado local salvo em ${path}`,
    "cli.errorPrefix": "Erro",
    "buildWas.usage": ({ templates }) =>
      `Uso:\n  node build-was.js --image ./img.png [--output ./sticker.was] [--scale 1.2]\n                     [--template ${templates}]\n                     [--pack-name "Meu Pack"] [--publisher "Meu Nome"]\n                     [--pack-id "uuid-ou-id"] [--accessibility-text "Descricao"]\n                     [--emojis "😀,🔥"]\n                     [--base-folder ./src/exemple]\n                     [--json animation/animation_secondary.json]\n                     [--lang en|pt-BR]\n                     [--no-fit]\n  node build-was.js --list-templates`,
    "buildWas.invalidArg": ({ arg }) => `Argumento invalido: ${arg}`,
    "buildWas.missingValue": ({ key }) => `Valor ausente para --${key}`,
    "buildWas.invalidTemplate": ({ templates }) => `Template invalido. Use um destes: ${templates}`,
    "sendWas.usage":
      "Uso:\n  node send-was.js --to 1234567890 [--file ./output.was]\n                   [--auth-dir ./auth_info] [--lang en|pt-BR] [--logout]",
    "sendWas.invalidArg": ({ arg }) => `Argumento invalido: ${arg}`,
    "sendWas.missingValue": ({ key }) => `Valor ausente para --${key}`,
    "sendWas.targetRequired": "Informe o numero de destino com --to ou WHATSAPP_TARGET.",
    "runtime.invalidBuffer": "Buffer invalido.",
    "runtime.missingMime": "Mime nao detectado. Informe imagePath ou mime.",
    "runtime.jsonWithoutAssets": "JSON sem assets.",
    "runtime.noEmbeddedImage": "Nenhuma imagem base64 encontrada no Lottie.",
    "runtime.unknownTemplate": ({ template }) => `Template desconhecido: ${template}`,
    "runtime.baseFolderMissing": "baseFolder nao encontrado.",
    "runtime.imageSourceRequired": "Envie imagePath ou buffer.",
    "runtime.imageNotFound": "Imagem nao encontrada.",
    "runtime.unsupportedFormat": "Formato nao suportado. Use PNG, JPG, JPEG ou WEBP.",
    "runtime.unsupportedImageEngine": ({ engine }) => `Engine de imagem nao suportada: ${engine}. Use sharp ou jimp.`,
    "runtime.sharpUnavailable": ({ message }) =>
      `sharp nao pode ser carregado neste ambiente. Use npm run cli:termux ou npm run build:was:termux. Erro original: ${message}`,
    "runtime.jimpUnavailable": ({ message }) => `jimp nao pode ser carregado. Erro original: ${message}`,
    "send.sessionExpired": "Sessao anterior nao vale mais. Escaneie o novo QR.",
    "send.loginRequired": "Login necessario. Escaneie o QR com o WhatsApp.",
    "send.sessionValidated": "Sessao validada.",
    "send.loginCompleted": "Login concluido.",
    "send.sessionDisconnected": "Sessao desconectada. Gere um novo QR para continuar.",
    "send.connectionClosedAfterQr":
      "Conexao fechada apos o QR. Aguardando reconexao para concluir o login...",
    "send.connectionClosedValidating":
      "Conexao fechada ao validar a sessao. Tentando reconectar...",
    "send.targetRequired": "Informe o numero de destino.",
    "send.fileNotFound": ({ path }) => `Arquivo .was nao encontrado: ${path}`,
    "send.connectingToSend": ({ file }) => `Conectando ao WhatsApp para enviar ${file}...`,
    "send.connectingSession": "Conectando sessao de envio...",
    "send.qrGenerated": "QR gerado. Escaneie com o WhatsApp no celular.",
    "send.sessionConnected": ({ number }) => `Sessao conectada. Enviando sticker para ${number}...`,
    "send.stickerSent": ({ number }) => `Sticker enviado para ${number}`,
    "send.sessionDisconnectedAgain":
      "Sessao desconectada do WhatsApp. Rode novamente para gerar outro QR.",
    "send.connectionClosedBeforeSend": "Conexao fechada antes do envio. Tentando reconectar...",
    "templates.missingId": "Template sem id.",
    "templates.baseFolderMissing": ({ path }) => `baseFolder nao encontrado: ${path}`,
    "templates.jsonPathMissing": ({ path }) => `jsonRelativePath nao encontrado: ${path}`
  }
};

function t(key, vars = {}) {
  const table = messages[currentLanguage] || messages[DEFAULT_LANGUAGE];
  const entry = table[key] || messages[DEFAULT_LANGUAGE][key] || key;
  return typeof entry === "function" ? entry(vars) : entry;
}

module.exports = {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getLanguage,
  normalizeLanguage,
  selectLocalizedField,
  setLanguage,
  t
};
