const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.resolve(process.cwd(), "templates", "registry.json");

function readTemplateRegistry() {
  const parsed = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const entries = Array.isArray(parsed.templates) ? parsed.templates : [];

  return entries.map(entry => ({
    ...entry,
    baseFolder: path.resolve(process.cwd(), entry.baseFolder)
  }));
}

function getTemplateMap() {
  return Object.fromEntries(readTemplateRegistry().map(template => [template.id, template]));
}

function getTemplateById(id) {
  return getTemplateMap()[id] || null;
}

function validateTemplateEntry(entry) {
  const errors = [];

  if (!entry.id) {
    errors.push("Template sem id.");
  }

  if (!entry.baseFolder || !fs.existsSync(entry.baseFolder)) {
    errors.push(`baseFolder nao encontrado: ${entry.baseFolder}`);
  }

  const jsonPath = entry.baseFolder ? path.join(entry.baseFolder, entry.jsonRelativePath || "") : "";
  if (!entry.jsonRelativePath || !fs.existsSync(jsonPath)) {
    errors.push(`jsonRelativePath nao encontrado: ${entry.jsonRelativePath}`);
  }

  return {
    ...entry,
    jsonPath,
    valid: errors.length === 0,
    errors
  };
}

function listValidatedTemplates() {
  return readTemplateRegistry().map(validateTemplateEntry);
}

module.exports = {
  REGISTRY_PATH,
  readTemplateRegistry,
  getTemplateMap,
  getTemplateById,
  validateTemplateEntry,
  listValidatedTemplates
};
