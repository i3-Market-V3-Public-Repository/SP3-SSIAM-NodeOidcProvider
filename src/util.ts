import { readFile, stat } from 'fs'
import * as path from "path"
import { promisify } from 'util'
import * as YAML from 'js-yaml'


export const readFilePromise = promisify(readFile)
export const existsPromise = (file: string) => new Promise((resolve) => {
    stat(file, (err) => resolve(err === null))
})

/**
 * Loads a YAML file and converts into an object
 *
 * @param file Path of the file
 */
export async function loadYAML(file: string) {
    const fileContent = await readFilePromise(file, 'utf8')
    return YAML.load(fileContent)
}

/**
 * Loads a JSON file and converts into an object
 *
 * @param file Path of the file
 */
export async function loadJSON(...file: string[]) {
    const filePath = path.join(...file)
    if(!await existsPromise(filePath)) {
        return undefined
    }

    const fileContent = await readFilePromise(filePath)
    return JSON.parse(fileContent.toString())
}
