import { randomFill } from 'crypto'
import { promisify } from 'util'

const randomFillPromise = promisify<ArrayBufferView, Uint8Array>(randomFill)

export async function random (size: number): Promise<Buffer> {
  return Buffer.from(await randomFillPromise(new Uint8Array(size)))
}
