// Dependencies
import * as fs from 'fs-extra'
import * as path from 'path'
import ts from 'typescript'
import { promisify } from 'util'
import { spawn, SpawnOptions } from 'child_process'

// import * as glob from "glob"
import rimraf from 'rimraf'
// import glob from 'glob'

const rootDir = path.resolve(__dirname, '..')
const configPath = path.join(rootDir, 'tsconfig.json')

const configFile = ts.readJsonConfigFile(configPath, (path) => fs.readFileSync(path, { encoding: 'utf-8'}))
const tsConfig = ts.parseJsonSourceFileConfigFileContent(configFile, ts.sys, path.dirname(configPath))

if (tsConfig.options.outDir === undefined) {
  throw new Error('Cannot load outDir')
}
const dst = tsConfig.options.outDir

interface CopyInfo {
  src: string
  dst: string
  cwd?: string
  opts?: fs.CopyOptions
}

// Global variables
// const globPromise = promisify(glob)
const rmPromise = promisify(rimraf)


const spawnPromise = async (
  command: string, args: readonly string[], options: SpawnOptions
): Promise<number | null> => await new Promise((resolve) => {
  const child = spawn(command, args, options)
  child.on('close', (code) => {
    resolve(code)
  })
})


// Methods
const clean = async (): Promise<void> => {
  await rmPromise(dst)
}

const buildTypescript = async (): Promise<void> => {
  const tsconfig = path.resolve(rootDir, 'tsconfig.json')
  await spawnPromise('npx', ['tsc', '--build', tsconfig], {
    stdio: 'inherit'
  })
}

// Add all the files that must be copied here
const fetchCopySrcs = async (): Promise<CopyInfo[]> => {

  return [
    { src: 'public', dst, cwd: 'src' },
    { src: 'views', dst, cwd: 'src' }
  ]
}

const copy = async (): Promise<void> => {
  const cpInfos = await fetchCopySrcs()
  for (const cpInfo of cpInfos) {
    let from = rootDir
    if (cpInfo.cwd) {
      from = path.join(from, cpInfo.cwd)
    }
    from = path.join(from, cpInfo.src)
    const to = path.resolve(dst, cpInfo.src)

    console.log(`Copying from '${from}' to '${to}' ...`)
    await fs.copy(from, to, cpInfo.opts)
  }
}

// Main execution
!(async function main (argv) {
  console.log('Clean destination folder')
  await clean()

  console.log('Compile typescript files')
  await buildTypescript()

  console.log('Copy files')
  await copy()
}(process.argv))
