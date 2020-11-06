import { Adapter, AdapterPayload } from "oidc-provider"


export class DummyAdapter implements Adapter {
    constructor(protected name: string) {}

    upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void> {
        throw new Error("Method not implemented.")
    }
    find(id: string): Promise<void | AdapterPayload> {
        throw new Error("Method not implemented.")
    }
    findByUserCode(userCode: string): Promise<void | AdapterPayload> {
        throw new Error("Method not implemented.")
    }
    findByUid(uid: string): Promise<void | AdapterPayload> {
        throw new Error("Method not implemented.")
    }
    consume(id: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    destroy(id: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    revokeByGrantId(grantId: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
}
