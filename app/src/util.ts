import { readFile, readFileSync } from 'fs'

/**
 * Loads a JSON file and converts into an object
 *
 * @param file Path of the file
 */
export async function loadJSON (file: string): Promise<any> {
  return await new Promise((resolve, reject) => {
    readFile(file, 'utf-8', (err, data) => {
      if (err != null) { reject(err) }
      resolve(JSON.parse(data))
    })
  })
}

/**
 * Loads a JSON file and converts into an object. Sync version
 *
 * @param file Path of the file
 */
export function loadJSONSync (file: string): any {
  const data = readFileSync(file, 'utf-8')
  return JSON.parse(data)
}
