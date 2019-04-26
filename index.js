const path = require('path')
const fs = require('fs-extra')
const konan = require('konan')
const resolve = require('resolve')
const builtins = require('builtins')()
const ProgressBar = require('progress')

const blackList = builtins
const exts = ['.js', '.ts']
const cwd = process.cwd()

const depsPath = []
let topLevelFolder = ''

function resolveExists(path) {
    if(fs.existsSync(path)) {
        const stat = fs.statSync(path)

        if(!stat.isFile()) {
            path += '/index.js'
        }

        return path
    }

    return null
}

function resolvePkg(dep) {
    try {
        return resolve.sync(dep, {
            basedir: cwd
        })
    }
    catch(err) {
        return null
    }
}

function resolveExt(path) {
    for(let ext of exts) {
        if(fs.existsSync(path + ext)) {
            return path + ext
        }
    }

    return null
}

function findDeps(entry, dir) {
    let fullPath = path.resolve(dir, entry)
    let currentPath = null

    const resolveFns = [
        resolveExists.bind(null, fullPath),
        resolvePkg.bind(null, entry),
        resolveExt.bind(null, fullPath),
    ]
    for(let resolveFn of resolveFns)  {
        let resolvedPath = resolveFn()
        if(resolvedPath) {
            currentPath = resolvedPath
            break
        }
    }

    if(currentPath && !blackList.includes(currentPath)) {
        const currentDir = path.dirname(currentPath)
        const entryFile = fs.readFileSync(currentPath, 'utf8')
        const deps = konan(entryFile).strings

        if (!depsPath.includes(currentPath)) {
            if(!topLevelFolder) {
                topLevelFolder = currentPath
            }
            if(!new RegExp(topLevelFolder).test(currentPath)) {
                topLevelFolder = path.resolve(topLevelFolder, '../')
            }

            depsPath.push(currentPath)

            if (deps.length) {
                deps.forEach(depend => {
                    findDeps(depend, currentDir)
                })
            }
        }
    }
}

async function copyDeps(outputDir) {
    const bar = new ProgressBar('copying [:bar] :percent', {
        total: depsPath.length,
        width: 50
    })

    await Promise.all(
        depsPath.map(async depPath => {
            const outputPath = getPathInOutputDir(depPath, outputDir)

            fs.mkdirpSync(path.dirname(outputPath))
            await fs.copyFile(depPath, outputPath)

            bar.tick()
        })
    )
}

function getPathInOutputDir(depPath, outputDir) {
    const basename = path.basename(depPath)
    return outputDir + path.dirname(depPath).replace(topLevelFolder, '') + '/' + basename
}

async function extractDeps(entry, outputDir = '__output__') {
    if(entry) {
        console.log('analyzing...')

        outputDir = path.resolve(cwd, outputDir)
        findDeps(entry, cwd)

        if (outputDir) {
            await copyDeps(outputDir)
        }

        console.log(`Done! Check ${getPathInOutputDir(path.resolve(cwd, entry), outputDir)}`)
    }

    return Promise.resolve(depsPath)
}

module.exports = extractDeps
