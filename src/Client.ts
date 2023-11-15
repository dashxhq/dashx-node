import crypto from 'crypto'
import http from 'got'
import uuid from 'uuid-random'
import type { Response } from 'got'

import ContentOptionsBuilder from './ContentOptionsBuilder'
import { createDeliveryRequest, identifyAccountRequest, trackEventRequest, addContentRequest, editContentRequest, fetchContentRequest, searchContentRequest, fetchItemRequest, checkoutCartRequest, capturePaymentRequest, fetchCartRequest, assetRequest, prepareAssetRequest, fetchStoredPreferencesRequest, saveStoredPreferencesRequest, assetsListRequest } from './graphql'
import { parseFilterObject } from './utils'
import type { ContentOptions, FetchContentOptions } from './ContentOptionsBuilder'

type IdentifyParams = Record<string, any>

type FetchCartParams = {
  uid?: string | number,
  anonymousUid?: string,
  orderId?: string
}

type CheckoutCartParams = {
  uid: string | number,
  anonymousUid?: string,
  gateway?: string,
  gatewayOptions?: Record<string, any>,
  orderId?: string
}

type CapturePaymentParams = {
  uid: string | number,
  anonymousUid?: string,
  gatewayResponse: Record<string, any>,
  orderId?: string
}

type PrepareAssetParams = {
  resource: string,
  attribute: string,
  name: string,
  size: number,
  mimeType: string
}

type AssetsListParams = {
  filter?: JSON,
  limit?: number,
  order?: JSON,
  page?: number
}

type FetchStoredPreferencesParams = {
  uid: string | number
}

type SaveStoredPreferencesParams = {
  uid: string | number
  preferenceData: any
}

class Client {
  publicKey?: string

  privateKey?: string

  targetInstallation?: string

  targetEnvironment?: string

  baseUri: string

  constructor({
    baseUri = process.env.DASHX_BASE_URI || 'https://api.dashx.com/graphql',
    publicKey = process.env.DASHX_PUBLIC_KEY,
    privateKey = process.env.DASHX_PRIVATE_KEY,
    targetInstallation = process.env.DASHX_TARGET_INSTALLATION,
    targetEnvironment = process.env.DASHX_TARGET_ENVIRONMENT
  } = {}) {
    this.baseUri = baseUri
    this.publicKey = publicKey
    this.privateKey = privateKey
    this.targetEnvironment = targetEnvironment
    this.targetInstallation = targetInstallation
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
      templateSubkind,
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
    return this.makeHttpRequest(trackEventRequest, { event, accountUid: String(accountUid), data })
  }

  addContent(urn: string, data: Record<string, any>): Promise<Response> {
    let content; let
      contentType

    if (urn.includes('/')) {
      [ contentType, content ] = urn.split('/')
    } else {
      contentType = urn
    }

    const params = { content, contentType, data }

    return this.makeHttpRequest(addContentRequest, { input: params })
  }

  editContent(urn: string, data: Record<string, any>): Promise<Response> {
    let content; let
      contentType

    if (urn.includes('/')) {
      [ contentType, content ] = urn.split('/')
    } else {
      contentType = urn
    }

    const params = { content, contentType, data }

    return this.makeHttpRequest(editContentRequest, { input: params })
  }

  searchContent(contentType: string): ContentOptionsBuilder
  searchContent(contentType: string, options: ContentOptions): Promise<any>
  searchContent(
    contentType: string, options?: ContentOptions
  ): ContentOptionsBuilder | Promise<any> {
    if (!options) {
      return new ContentOptionsBuilder(
        (wrappedOptions) => this.makeHttpRequest(
          searchContentRequest,
          { ...wrappedOptions, contentType }
        ).then((response) => response?.searchContent)
      )
    }

    const filter = parseFilterObject(options.filter)

    const result = this.makeHttpRequest(
      searchContentRequest,
      { input: { ...options, contentType, filter } }
    ).then((response) => response?.searchContent)

    if (options.returnType === 'all') {
      return result
    }

    return result.then((data) => (Array.isArray(data) ? data[0] : null))
  }

  async fetchContent(urn: string, options: FetchContentOptions): Promise<any> {
    if (!urn.includes('/')) {
      throw new Error('URN must be of form: {contentType}/{content}')
    }

    const [ contentType, content ] = urn.split('/')
    const params = { content, contentType, ...options }

    const response = await this.makeHttpRequest(fetchContentRequest, {input: params})
    return response?.fetchContent
  }

  async fetchItem(identifier: string): Promise<any> {
    const params = { identifier }

    const response = await this.makeHttpRequest(fetchItemRequest, {input: params})
    return response?.fetchItem
  }

  async fetchCart({ uid, anonymousUid, orderId }: FetchCartParams): Promise<any> {
    const params = {
      accountUid: String(uid),
      accountAnonymousUid: anonymousUid,
      orderId
    }

    const response = await this.makeHttpRequest(fetchCartRequest, {input: params})
    return response?.fetchCart
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

    const response = await this.makeHttpRequest(checkoutCartRequest, {input: params})
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

    const response = await this.makeHttpRequest(capturePaymentRequest, {input: params})
    return response?.capturePayment
  }

  async asset(id: string): Promise<any> {
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

    const response = await this.makeHttpRequest(prepareAssetRequest, {input: params})
    return response?.prepareAsset
  }

  async assetsList(input?: AssetsListParams): Promise<any> {
    const response = await this.makeHttpRequest(assetsListRequest, input)
    return response?.assetsList
  }

  async fetchStoredPreferences({ uid }: FetchStoredPreferencesParams): Promise<any> {
    const params = { accountUid: String(uid) }

    const response = await this.makeHttpRequest(fetchStoredPreferencesRequest, {input: params})
    return response?.preferenceData
  }

  async saveStoredPreferences({ uid, preferenceData }: SaveStoredPreferencesParams): Promise<any> {
    const params = { accountUid: String(uid), preferenceData }

    const response = await this.makeHttpRequest(saveStoredPreferencesRequest, {input: params})
    return response?.preferenceData
  }
}

export default Client
