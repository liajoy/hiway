# hiway

Extract and copy all dependents.

## Install

``` sh
$ npm install hiway
```

## Usage

```javascript
const hiway = require('hiway')

hiway(entryPath, outputDir)
```

Or use cli:

``` javascript
$ hiway entryPath --out outputDir
```

When the command runs, hiway will find all dependents of entryFile, then it will copy them to the outputDir. It's useful when you just want to extract some part of a huge library. 

For example, extract `THREE.Geometry` from Three.js:

```
$ hiway Geometry.js --out __output__
```

When hiway've done it's job, you can check __output__ path.
