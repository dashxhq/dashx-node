import http from 'got'
import uuid from 'uuid-random'
import type { Response } from 'got'

import SearchRecordsInputBuilder, { FetchRecordOptions, SearchRecordsOptions } from './SearchRecordsInputBuilder'
import { createDeliveryRequest, identifyAccountRequest, trackEventRequest, fetchContactsRequest, fetchItemRequest, checkoutCartRequest, capturePaymentRequest, fetchCartRequest, assetRequest, prepareAssetRequest, fetchStoredPreferencesRequest, saveStoredPreferencesRequest, assetsListRequest, searchRecordsRequest, fetchRecordRequest } from './graphql'
import { parseFilterObject } from './utils'

type IdentifyParams = Record<string, any>

type FetchCartParams = {
  uid?: string | number,
  anonymousUid?: string,
  orderId?: string,
}

type FetchContactsParams = {
  uid?: string | number,
}

type CheckoutCartParams = {
  uid: string | number,
  anonymousUid?: string,
  gateway?: string,
  gatewayOptions?: Record<string, any>,
  orderId?: string,
}

type CapturePaymentParams = {
  uid: string | number,
  anonymousUid?: string,
  gatewayResponse: Record<string, any>,
  orderId?: string,
}

type PrepareAssetParams = {
  resource: string,
  attribute: string,
  name: string,
  size: number,
  mimeType: string,
}

type AssetsListParams = {
  filter?: JSON,
  limit?: number,
  order?: JSON[],
  page?: number,
}

type FetchStoredPreferencesParams = {
  uid: string | number,
}

type SaveStoredPreferencesParams = {
  uid: string | number,
  preferenceData: any,
}

class Client {
  publicKey?: string

  privateKey?: string

  targetEnvironment?: string

  baseUri: string

  constructor({
    baseUri = process.env.DASHX_BASE_URI || 'https://api.dashx.com/graphql',
    publicKey = process.env.DASHX_PUBLIC_KEY,
    privateKey = process.env.DASHX_PRIVATE_KEY,
    targetEnvironment = process.env.DASHX_TARGET_ENVIRONMENT
  } = {}) {
    if (!publicKey) {
      throw new Error('Public key is required. Please set \'DASHX_PUBLIC_KEY\' environment variable or pass it in options.')
    }

    if (!privateKey) {
      throw new Error('Private key is required. Please set \'DASHX_PRIVATE_KEY\' environment variable or pass it in options.')
    }

    if (!targetEnvironment) {
      throw new Error('Target environment is required. Please set \'DASHX_TARGET_ENVIRONMENT\' environment variable or pass it in options.')
    }

    this.baseUri = baseUri
    this.publicKey = publicKey
    this.privateKey = privateKey
    this.targetEnvironment = targetEnvironment
  }

  private async makeHttpRequest(request: string, params: any): Promise<any> {
    const response: any = await http(this.baseUri, {
      body: JSON.stringify({
        query: request,
        variables: params
      }),
      method: 'POST',
      headers: {
        'User-Agent': 'dashx-node',
        'X-Public-Key': this.publicKey,
        'X-Private-Key': this.privateKey,
        'X-Target-Environment': this.targetEnvironment,
        'Content-Type': 'application/json'
      },
      responseType: 'json'
    })
      .json()

    if (response.data) {
      return Promise.resolve(response.data)
    }

    return Promise.reject(response.errors)
  }

  async deliver(urn: string, options?: Record<string, any>): Promise<any> {
    const [ templateSubkind, templateIdentifier ] = urn.split('/')
    const { content = {}, to, cc, bcc, ...rest } = options || {}

    const params = {
      templateSubkind: templateSubkind.toUpperCase(),
      templateIdentifier,
      content,
      ...rest
    }

    if (content.to || to) {
      params.content.to = content.to ? [ content.to ].flat() : [ to ].flat()
    }

    if (content.cc || cc) {
      params.content.cc = content.cc ? [ content.cc ].flat() : [ cc ].flat()
    }

    if (content.bcc || bcc) {
      params.content.bcc = content.bcc ? [ content.bcc ].flat() : [ bcc ].flat()
    }

    const response = await this.makeHttpRequest(createDeliveryRequest, { input: params })

    return response?.createDelivery
  }

  identify(uid: string | number, options?: IdentifyParams): Promise<Response>
  identify(options?: IdentifyParams): Promise<Response>
  identify(
    uid: string | number | IdentifyParams = {}, options: IdentifyParams = {} as IdentifyParams
  ): Promise<Response> {
    let params

    if (typeof uid === 'string' || typeof uid === 'number') {
      params = { uid: String(uid), ...options }
    } else {
      const identifyOptions = uid

      params = {
        anonymousUid: uuid(),
        ...identifyOptions
      }
    }

    return this.makeHttpRequest(identifyAccountRequest, { input: params })
  }

  track(event: string, accountUid: string | number, data: Record<string, any>): Promise<Response> {
    return this.makeHttpRequest(trackEventRequest, { input: { event, accountUid: String(accountUid), data } })
  }

  searchRecords(resource: string): SearchRecordsInputBuilder
  searchRecords(resource: string, options: SearchRecordsOptions): Promise<any>
  searchRecords(
    resource: string,
    options?: SearchRecordsOptions,
  ): SearchRecordsInputBuilder | Promise<any> {
    if (!options) {
      return new SearchRecordsInputBuilder(
        resource,
        async (wrappedOptions) => this.makeHttpRequest(
          searchRecordsRequest,
          { input: { ...wrappedOptions, resource } }
        ).then((response) => response?.searchRecords),
      )
    }

    const filter = parseFilterObject(options.filter)

    const result = this.makeHttpRequest(
      searchRecordsRequest,
      { input: { ...options, resource, filter } }
    ).then((response) => response?.searchRecords)

    return result
  }

  async fetchRecord(urn: string, options: FetchRecordOptions): Promise<any> {
    if (!urn.includes('/')) {
      throw new Error('URN must be of form: {resource}/{record_id}')
    }

    const [ resource, recordId ] = urn.split('/')
    const params = { resource, recordId, ...options }

    const response = await this.makeHttpRequest(fetchRecordRequest, { input: params })
    return response?.fetchRecord
  }

  async fetchItem(identifier: string): Promise<any> {
    const params = { identifier }

    const response = await this.makeHttpRequest(fetchItemRequest, { input: params })
    return response?.fetchItem
  }

  async fetchCart({ uid, anonymousUid, orderId }: FetchCartParams): Promise<any> {
    const params = {
      accountUid: String(uid),
      accountAnonymousUid: anonymousUid,
      orderId
    }

    const response = await this.makeHttpRequest(fetchCartRequest, { input: params })
    return response?.fetchCart
  }

  async fetchContacts({ uid }: FetchContactsParams): Promise<any> {
    const params = { uid: String(uid) }

    const response = await this.makeHttpRequest(fetchContactsRequest, { input: params })
    return response?.fetchContacts.contacts
  }

  async checkoutCart({
    uid, anonymousUid, gateway, gatewayOptions, orderId
  }: CheckoutCartParams): Promise<any> {
    const params = {
      accountUid: String(uid),
      accountAnonymousUid: anonymousUid,
      gatewayIdentifier: gateway,
      gatewayOptions,
      orderId
    }

    const response = await this.makeHttpRequest(checkoutCartRequest, { input: params })
    return response?.checkoutCart
  }

  async capturePayment({
    uid, anonymousUid, gatewayResponse, orderId
  }: CapturePaymentParams): Promise<any> {
    const params = {
      accountUid: String(uid),
      accountAnonymousUid: anonymousUid,
      gatewayResponse,
      orderId
    }

    const response = await this.makeHttpRequest(capturePaymentRequest, { input: params })
    return response?.capturePayment
  }

  async getAsset(id: string): Promise<any> {
    const params = {
      id
    }

    const response = await this.makeHttpRequest(assetRequest, params)
    return response?.asset
  }

  async prepareAsset(input: PrepareAssetParams): Promise<any> {
    let params

    if (this.targetEnvironment) {
      params = {
        ...input,
        targetEnvironment: this.targetEnvironment
      }
    } else {
      params = input
    }

    const response = await this.makeHttpRequest(prepareAssetRequest, { input: params })
    return response?.prepareAsset
  }

  async listAssets(input?: AssetsListParams): Promise<any> {
    const response = await this.makeHttpRequest(assetsListRequest, input ?? {})
    return response?.assetsList
  }

  async fetchStoredPreferences({ uid }: FetchStoredPreferencesParams): Promise<any> {
    const params = { accountUid: String(uid) }

    const response = await this.makeHttpRequest(fetchStoredPreferencesRequest, { input: params })
    return response?.preferenceData
  }

  async saveStoredPreferences({ uid, preferenceData }: SaveStoredPreferencesParams): Promise<any> {
    const params = { accountUid: String(uid), preferenceData }

    const response = await this.makeHttpRequest(saveStoredPreferencesRequest, { input: params })
    return response?.preferenceData
  }
}

export default Client
