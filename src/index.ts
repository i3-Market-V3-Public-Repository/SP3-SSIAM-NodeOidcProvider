// Before any code is executed, add root path!
import { addAlias } from "module-alias"
addAlias("@i3-market", __dirname)

import { main, onError } from "./server"

// Execute the main function
main().catch(onError)
