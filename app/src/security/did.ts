import { Credentials } from 'uport-credentials'
import { existsSync, PathLike, writeFile } from 'fs'
import config from '../config'

export const did = async (dstFilePath: PathLike = config.identityPath): Promise<void> => {
  return await new Promise((resolve, reject) => {
    const identity = Credentials.createIdentity()
    if (existsSync(dstFilePath)) {
      return resolve()
    }
    writeFile(dstFilePath, JSON.stringify(identity), (err) => {
      if (err !== undefined) return reject(err)
      else return resolve()
    })
  })
}
