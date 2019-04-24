const path = require('path')
const fs = require('fs-extra')
const konan = require('konan')
const resolve = require('resolve')
const builtins = require('builtins')()
const ProgressBar = require('progress')

const blackList = builtins
const exts = ['.js', '.ts']
const cwd = process.cwd()

let depsPath = []

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
    outputDir = path.resolve(cwd, outputDir)

    await Promise.all(
        depsPath.map(async depPath => {
            const currentDir = outputDir + path.dirname(depPath).replace(cwd, '') + '/'
            const basename = path.basename(depPath)

            fs.mkdirpSync(currentDir)
            await fs.copyFile(depPath, currentDir + basename)

            bar.tick()
        })
    )
}

async function extractDeps(entry, outputDir) {
    if(entry) {
        console.log('analyzing...')

        findDeps(entry, cwd)

        if (outputDir) {
            await copyDeps(outputDir)
        }

        console.log('Done!')
    }

    return Promise.resolve(depsPath)
}

module.exports = extractDeps
