// tslint:disable: no-console

// Dependencies
import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"
import { spawn, SpawnOptions } from "child_process"

import * as glob from "glob"
import * as rimraf from "rimraf"

// Global variables
const cpPromise = promisify(fs.copyFile)
const globPromise = promisify(glob)
const rmPromise = promisify(rimraf)

const spawnPromise = (
    command: string, args: ReadonlyArray<string>, options: SpawnOptions
) => new Promise((resolve) => {
    const child = spawn(command, args, options)
    child.on("close", (code) => {
        resolve(code)
    })
})

const rootDir = path.resolve(__dirname, '..')
const dst = path.resolve(rootDir, "build")
// const src = path.resolve(rootDir, "src")

// Methods
const clean = async () => {
    await rmPromise(dst)
}

const buildTypescript = async () => {
    const tsconfig = path.resolve(rootDir, "tsconfig.json")
    await spawnPromise(`npx`, ["tsc", "--build", tsconfig], {
        stdio: 'inherit'
    })
}

// Add all the files that must be copied here
const fetchCopyFiles = async () => {
    const files: string[] = []

    return files.concat(
        [ "package.json", "package-lock.json" ],
        await globPromise("src/**/*.{yaml,yml}") // Copy all yaml files within src
    )
}

const copy = async () => {
    const copyFiles = await fetchCopyFiles()
    for(const copyFile of copyFiles) {
        console.log(`Copying ${copyFile}...`)
        await cpPromise(
            path.resolve(rootDir, copyFile),
            path.resolve(dst, copyFile)
        )
    }
}

// Main execution
// tslint:disable-next-line: no-unused-expression
!async function main(argv) {
    console.log("Clean destination folder")
    await clean()

    console.log("Compile typescript files")
    await buildTypescript()

    console.log("Copy files")
    await copy()
}(process.argv)
