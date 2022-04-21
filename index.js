"use strict";

const fs = require("fs");
const path = require("path");

const HAS_EXT_REGEX = /\.[a-z]+$/;
const JS_EXT_REGEX = /\.(ts|tsx|js|jsx|json)$/;
const PLUGIN_NAME = "absolute-imports-only";

function has(map, path) {
  let inner = map;
  for (const step of path.split(".")) {
    inner = inner[step];
    if (inner === undefined) {
      return false;
    }
  }

  return true;
}

function getBaseUrlFromConfig(baseDir, configFilePath) {
  let url = "";

  const config = JSON.parse(
    fs.readFileSync(configFilePath)
  );

  if (has(config, "compilerOptions.baseUrl")) {
    url = config.compilerOptions.baseUrl;
  }

  return path.join(baseDir, url);
}

function findDirWithFile(filename) {
  let dir = path.resolve(filename);

  do {
    dir = path.dirname(dir);
  } while (!fs.existsSync(path.join(dir, filename)) && dir !== "/" && dir !== process.cwd());

  if (!fs.existsSync(path.join(dir, filename))) {
    return;
  }

  return dir;
}

function getBaseUrl(baseDir) {
  let url = "";

  if (fs.existsSync(path.join(baseDir, "tsconfig.json"))) {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(baseDir, "tsconfig.json"))
    );
    if (has(tsconfig, "compilerOptions.baseUrl")) {
      url = tsconfig.compilerOptions.baseUrl;
    }
  } else if (fs.existsSync(path.join(baseDir, "jsconfig.json"))) {
    const jsconfig = JSON.parse(
      fs.readFileSync(path.join(baseDir, "jsconfig.json"))
    );
    if (has(jsconfig, "compilerOptions.baseUrl")) {
      url = jsconfig.compilerOptions.baseUrl;
    }
  }

  return path.join(baseDir, url);
}

const defaultOptions = {
  jsOnly: true, // fix all files
  minLevel: 1, // files in the same directory are ignored
};

const defaultSettings = {
  project: '',
};

module.exports.rules = {
  "only-absolute-imports": {
    meta: {
      fixable: true,
    },
    create: function (context) {
      const { options, settings } = context;

      // Merge settings
      let mergedSettings = defaultSettings;

      if (settings[PLUGIN_NAME]) {
        mergedSettings = {
          ...defaultSettings,
          ...settings[PLUGIN_NAME],
        }
      }

      let baseUrl;

      if (mergedSettings.project) {
        const baseDir = path.dirname(mergedSettings.project);

        if (!baseDir) {
          throw new Error(`Can not detect "baseUrl". Please check your configuration.`);
        }

        baseUrl = getBaseUrlFromConfig(baseDir, mergedSettings.project);
      } else {
        const baseDir = findDirWithFile("package.json");

        if (!baseDir) {
          throw new Error(`Can not detect "baseUrl". Please provide "project" in "settings" section.`);
        }

        baseUrl = getBaseUrl(baseDir);
      }

      if (!baseUrl) {
        throw new Error(`Can not detect "baseUrl". Please check your configuration.`);
      }

      // Merge options
      let userOptions = defaultOptions;

      if (Array.isArray(options)) {
        userOptions = options[0];
      }

      const mergedOptions = {
        ...defaultOptions,
        ...userOptions,
      };

      return {
        ImportDeclaration(node) {
          const source = node.source.value;

          if (mergedOptions && typeof mergedOptions === 'object') {
            if (typeof mergedOptions.minLevel === 'number') {
              if (mergedOptions.minLevel < 0) {
                throw new Error(`"minLevel" must be greater than equal to 0`)
              }

              const levelMatches = source.match(/\.\.\//g);
              const levelCount = levelMatches ? levelMatches.length : 0;

              if (levelCount < mergedOptions.minLevel) return;
            }

            if (mergedOptions.jsOnly) {
              if (HAS_EXT_REGEX.test(source) && !JS_EXT_REGEX.test(source)) return;
            }
          }

          if (source.startsWith(".")) {
            const filename = context.getFilename();

            const absolutePath = path.normalize(
              path.join(path.dirname(filename), source)
            );
            const expectedPath = path.relative(baseUrl, absolutePath);

            if (source !== expectedPath) {
              context.report({
                node,
                message: `Relative imports are not allowed. Use \`${expectedPath}\` instead of \`${source}\`.`,
                fix: function (fixer) {
                  return fixer.replaceText(node.source, `'${expectedPath}'`);
                },
              });
            }
          }
        },
      };
    },
  },
};
