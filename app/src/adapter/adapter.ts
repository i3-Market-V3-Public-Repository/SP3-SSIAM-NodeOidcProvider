import { Adapter as BaseAdapter, AdapterPayload } from 'oidc-provider'

export interface Adapter extends BaseAdapter {
  findByParam: <P>(name: string, value: P) => AdapterPayload | undefined
}

export interface AdapterConstructor {
  new(name: string): Adapter
  connect?: () => Promise<void>
}
