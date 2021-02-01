import { CipherGCMTypes, CipherKey, createCipheriv, createDecipheriv } from 'crypto'
import { random } from './random'

/**
 * Helper to encrpyt and decrypt using Node.js libraries
 */
export class Cipher {
  constructor (protected algorithm: CipherGCMTypes, protected secret: CipherKey) {}

  /**
   * Encrypt a string message and return a base64-encoded ecnrypted string
   *
   * @param message Message to encrypt
   * @returns A string containing the ciphertext, the iv and the auth tag. Both are separated by a dot and base64-encoded
   */
  async encryptString (message: string): Promise<string> {
    const iv = await random(16)
    const cipher = createCipheriv(this.algorithm, this.secret, iv)

    // Encrypt
    let ciphertext = cipher.update(message, 'utf8', 'base64')
    ciphertext += cipher.final('base64')
    const authTag = cipher.getAuthTag()

    return `${ciphertext}.${iv.toString('base64')}.${authTag.toString('base64')}`
  }

  /**
   * Take a base64-encoded encrypted string and decrypt it
   * @param ciphertext A string containing the ciphertext and the iv. Both are separated by a dot and base64-encoded
   * @returns The decrypted message
   */
  async decryptString (ciphertext: string): Promise<string> {
    const splitCiphertext = ciphertext.split('.')
    if (splitCiphertext.length !== 3) {
      throw new Error('Cannot decrypt. Wrong ciphertext format')
    }

    // Initialize decipher
    const iv = Buffer.from(splitCiphertext[1], 'base64')
    const authTag = Buffer.from(splitCiphertext[2], 'base64')
    const decipher = createDecipheriv(this.algorithm, this.secret, iv)

    // Decrypt
    decipher.setAuthTag(authTag)
    let message = decipher.update(splitCiphertext[0], 'base64', 'utf8')
    message += decipher.final('utf8')

    return message
  }
}
