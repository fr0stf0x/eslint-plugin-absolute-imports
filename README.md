# eslint-plugin-absolute-imports-only

## Forked from [eslint-plugin-absolute-imports](https://github.com/jchen1/eslint-plugin-absolute-imports)

A (zero-dependency!) eslint plugin that enforces absolute imports on your codebase.

## Prerequisites

You must have a `baseUrl` defined in either `tsconfig.json` or `jsconfig.json`. **This plugin does not currently work with `paths`!**

If you are working with a full-stack project, e.g. your Frontend project is at `/front-end` then you need to provide the path to `tsconfig.json` or `jsconfig.json` in `eslint` configuration file

Example:

```
...
settings: {
  "absolute-imports-only": {
    project: path.resolve(__dirname, 'tsconfig.json'),
  },
},
```

## Setup

### npm

`npm i --save-dev eslint-plugin-absolute-imports-only`

### yarn

`yarn add -D eslint-plugin-absolute-imports-only`

### .eslintrc

- Add `eslint-plugin-absolute-imports-only` to your eslint `plugins` section
- Add `absolute-imports-only/only-absolute-imports` to your eslint `rules` section

## Options

### jsOnly (boolean - default `true`)

Enabling this option will make the plugin only fix the imports for `.(ts|tsx|js|jsx|json)` files

### minLevel (number - default `1`)

Minimum level for the plugin to start fixing

Example:

- If `minLevel` is set to `0` then all imports will be fixed

Eg: This below import statement

```ts
// src/components/componentB.tsx
import ComponentA from './componentA'
```

will be fixed to

```ts
// src/components/componentB.tsx
import ComponentA from 'src/components/componentA`
```

- If `minLevel` is set to `1` then only files that are not in the same directory with current files are fixed

=> This below import statement won't be fixed

```ts
// src/components/componentB.tsx
import ComponentA from './componentA'
```

- and so on :D 



## License

MIT
