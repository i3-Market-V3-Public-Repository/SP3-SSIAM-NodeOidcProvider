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

interface RetryOptions {
  tries?: number
  interval?: number // Time in milliseconds
}
type RetryFunction<T> = () => T | undefined

/**
 * Retry an operation several time
 *
 * @param cb Retry function. Return true if function finished
 * @param options Retry configuration options
 *
 * @return
 */
export async function retry<T> (
  cb: RetryFunction<T>, options: RetryOptions = { tries: 10, interval: 1000 }
): Promise<T> {
  const interval = options.interval !== undefined ? options.interval : 1000
  let tries = options.tries !== undefined ? options.tries : 10

  return await new Promise((resolve, reject) => {
    const executeCallback = (): void => {
      const res = cb()
      if (res !== undefined) {
        return resolve(res)
      }

      tries--
      if (tries > 1) {
        setTimeout(executeCallback, interval)
      } else {
        reject(new Error('Exeded the maximum tries'))
      }
    }

    executeCallback()
  })
}
