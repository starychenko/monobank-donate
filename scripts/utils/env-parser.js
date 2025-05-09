/**
 * Утиліта для розбору файлів .env
 * Цей модуль служить як аліас для fs-helpers.parseEnvFile
 */

const { parseEnvFile } = require('./fs-helpers');

module.exports = {
  parseEnvFile
}; 