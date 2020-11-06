import logger from "../logger"
import { Adapter } from "./adapter"
import AdapterInUse from "./adapter-in-use"


class AdapterFactory {
    adapters = new Map<string, Adapter>()

    addAdapter(name: string, adapter: Adapter) {
        if(this.adapters.has(name)) {
            logger.error(`Adapter factory already contains the adapter '${name}'`)
            return
        }

        logger.debug(`Creating adapter for the collection '${name}'`)
        this.adapters.set(name, adapter)
    }

    createIfNotExists(name: string): Adapter {
        let adapter = this.adapters.get(name)
        if(adapter) return adapter

        adapter = new AdapterInUse(name)
        if(!this.adapters.has(name)) {
            logger.error(`Adapter should be added into the adapter factory once created`)
            this.addAdapter(name, adapter)
        }

        return adapter
    }
}

export default new AdapterFactory()
