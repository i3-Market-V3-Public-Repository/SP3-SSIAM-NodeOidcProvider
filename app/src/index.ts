// Before any code is executed, add root path!
import { addAlias } from 'module-alias'
addAlias('@i3-market', __dirname)

import { main, onError } from './server' // eslint-disable-line

// Execute the main function
main().catch(onError)
