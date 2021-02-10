import { Adapter as BaseAdapter, AdapterPayload, CanBePromise } from 'oidc-provider'

export interface Adapter extends BaseAdapter {
  findByParam: <P>(name: string, value: P) => CanBePromise<AdapterPayload | undefined>
}

export interface AdapterConstructor {
  new(name: string): Adapter
  connect?: () => Promise<void>
}
