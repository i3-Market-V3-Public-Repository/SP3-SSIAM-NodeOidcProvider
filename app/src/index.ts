// Before any code is executed, add root path!
import 'module-alias/register'
import { main, onError } from './server'

// Execute the main function
main().catch(onError)
