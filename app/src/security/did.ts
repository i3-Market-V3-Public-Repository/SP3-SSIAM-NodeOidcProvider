import { Credentials } from 'uport-credentials'
import { existsSync, PathLike, writeFile } from 'fs'
import config from '../config'
import logger from '@i3-market/logger'

export const did = async (dstFilePath: PathLike = config.identityPath): Promise<void> => {
  return await new Promise((resolve, reject) => {
    const identity = Credentials.createIdentity()
    if (existsSync(dstFilePath)) {
      logger.debug('Identity already generated')
      return resolve()
    }
    logger.debug('Identity not present... generating a new one')
    writeFile(dstFilePath, JSON.stringify(identity), (err) => {      
      if (err) {
        console.log('Error generating a new identity: ' + err)
        return reject(err)
      } else {
        logger.debug('Identity successfully generated')
        return resolve()
      }
    })
  })
}
