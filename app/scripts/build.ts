// Dependencies
import * as fs from 'fs'
import * as path from 'path'
import ts from 'typescript'
import { promisify } from 'util'
import { spawn, SpawnOptions } from 'child_process'

// import * as glob from "glob"
import rimraf from 'rimraf'

const rootDir = path.resolve(__dirname, '..')
const configPath = path.join(rootDir, 'tsconfig.json')

const configFile = ts.readJsonConfigFile(configPath, (path) => fs.readFileSync(path, { encoding: 'utf-8'}))
const tsConfig = ts.parseJsonSourceFileConfigFileContent(configFile, ts.sys, path.dirname(configPath))

if (tsConfig.options.outDir === undefined) {
  throw new Error('Cannot load outDir')
}
const dst = tsConfig.options.outDir

// Global variables
const cpPromise = promisify(fs.copyFile)
// const globPromise = promisify(glob)
const rmPromise = promisify(rimraf)

async function cpFile (src: fs.PathLike, dst: fs.PathLike, flags?: number): Promise<void> {
  const dstDir = path.dirname(dst.toString())
  try {
    fs.accessSync(dstDir, fs.constants.F_OK | fs.constants.W_OK)
  } catch (error) {
    fs.mkdirSync(dstDir)
  }
  return await cpPromise(src, dst, flags)
}

const spawnPromise = async (
  command: string, args: readonly string[], options: SpawnOptions
): Promise<number | null> => await new Promise((resolve) => {
  const child = spawn(command, args, options)
  child.on('close', (code) => {
    resolve(code)
  })
})

// const src = path.resolve(rootDir, "src")

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
const fetchCopyFiles = async (): Promise<string[]> => {
  const files: string[] = []

  return files.concat(
    ['package.json', 'package-lock.json']
    // await globPromise("src/**/*.{json,yaml,yml}") // Copy all yaml files within src
  )
}

const copy = async (): Promise<void> => {
  const copyFiles = await fetchCopyFiles()
  for (const copyFile of copyFiles) {
    console.log(`Copying ${copyFile}...`)
    await cpFile(
      path.resolve(rootDir, copyFile),
      path.resolve(dst, copyFile)
    )
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
