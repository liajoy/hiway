# hiway

Detect and extract dependents of a file.

## Install

``` sh
$ yarn add hiway
```

## Usage

hiway detects dependents of entryFile and copy them to the `outputDir`.

```javascript
const hiway = require('hiway')

// outputDir is  __output__ by default
const depsPath = await hiway(entryPath, outputDir)
```

Or use cli:

``` javascript
$ hiway entryPath --out outputDir
```

It's useful(maybe) when you do these works:

- Extract some part from a fat library. For example, extract `THREE.Geometry` from Three.js.
- Refactor directory structure, you can get related files easily.
