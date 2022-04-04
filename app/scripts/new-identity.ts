// tslint:disable: no-console
import { Credentials } from "uport-credentials"
import * as readline from "readline"
import * as fs from "fs"

(async function main() {
    console.log("Generating new identity...")
    const identity = Credentials.createIdentity()
    for (const key in identity) {
        if(identity[key]) {
            console.log(` - ${key}: "${identity[key]}"`)
        }
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    rl.question("\nStore this new identity? [y/N] ", (awnser) => {
        if (awnser.toLocaleLowerCase() === "y") {
            console.log("Storing the new DID...")
            fs.writeFileSync("./misc/identity.json", JSON.stringify(identity))
            console.log("DID successfully stored")
        }
        rl.close()
    })
})()
