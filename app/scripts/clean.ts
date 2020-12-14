// Dependencies
import * as path from 'path'
import { promisify } from 'util'

// import * as glob from "glob"
import * as rimraf from 'rimraf'

// Global variables
const rmPromise = promisify(rimraf)


const rootDir = path.resolve(__dirname, '..')
const build = path.resolve(rootDir, 'build')
const nodeModules = path.resolve(rootDir, 'node_modules')
// const src = path.resolve(rootDir, "src")

// Methods
const clean = async (): Promise<void> => {
  await rmPromise(build)
  await rmPromise(nodeModules)
}

// Main execution
(async function main (argv) {
  console.log('Remove node_modules and build folders')
  await clean()
}(process.argv))
