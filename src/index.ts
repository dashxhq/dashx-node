import Client from './Client'

export default {
  createClient: (params: ConstructorParameters<typeof Client>[0]): Client => new Client(params)
}
