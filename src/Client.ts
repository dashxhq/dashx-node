import crypto from 'crypto'
import http from 'got'
import uuid from 'uuid-random'
import type { Response } from 'got'

import ContentOptionsBuilder from './ContentOptionsBuilder'
import { createDeliveryRequest, identifyAccountRequest, trackEventRequest, addContentRequest, editContentRequest, fetchContentRequest, searchContentRequest, fetchItemRequest, checkoutCartRequest, capturePaymentRequest, fetchCartRequest } from './graphql'
import { parseFilterObject } from './utils'
import type { ContentOptions, FetchContentOptions } from './ContentOptionsBuilder'

type IdentifyParams = Record<string, any>

type GenerateIdentityTokenOptions = {
  kind?: string
}

type FetchCartParams = {
  uid?: string,
  anonymousUid?: string,
  orderId?: string
}

type CheckoutCartParams = {
  uid: string,
  anonymousUid?: string,
  gateway?: string,
  gatewayOptions?: Record<string, any>,
  orderId?: string
}

type CapturePaymentParams = {
  uid: string,
  anonymousUid?: string,
  gatewayResponse: Record<string, any>,
  orderId?: string
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
        variables: { input: params }
      }),
      method: 'POST',
      headers: {
        'User-Agent': 'dashx-node',
        'X-Public-Key': this.publicKey,
        'X-Private-Key': this.privateKey,
        'X-Target-Installation': this.targetInstallation,
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
    const [ contentTypeIdentifier, contentIdentifier ] = urn.split('/')
    const { content = {}, to, cc, bcc, ...rest } = options || {}

    const params = {
      contentTypeIdentifier,
      contentIdentifier,
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

    const response = await this.makeHttpRequest(createDeliveryRequest, params)

    return response?.createDelivery
  }

  identify(uid: string, options?: IdentifyParams): Promise<Response>
  identify(options?: IdentifyParams): Promise<Response>
  identify(
    uid: string | IdentifyParams = {}, options: IdentifyParams = {} as IdentifyParams
  ): Promise<Response> {
    let params

    if (typeof uid === 'string') {
      params = { uid, ...options }
    } else {
      const identifyOptions = uid

      params = {
        anonymousUid: uuid(),
        ...identifyOptions
      }
    }

    return this.makeHttpRequest(identifyAccountRequest, params)
  }

  generateIdentityToken(uid: string, options?: GenerateIdentityTokenOptions): string {
    if (!this.privateKey) {
      throw new Error('Private key not set')
    }

    const kind = options?.kind || 'regular'
    const nonce = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.privateKey), nonce, {
      authTagLength: 16
    })

    const encrypted = Buffer.concat([ cipher.update(`v1;${kind};${uid}`), cipher.final() ])
    const encryptedToken = Buffer.concat([ nonce, encrypted, cipher.getAuthTag() ])

    // Base64.urlsafe_encode64
    return encryptedToken.toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
  }

  track(event: string, accountUid: string, data: Record<string, any>): Promise<Response> {
    return this.makeHttpRequest(trackEventRequest, { event, accountUid, data })
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

    return this.makeHttpRequest(addContentRequest, params)
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

    return this.makeHttpRequest(editContentRequest, params)
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
      { ...options, contentType, filter }
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

    const response = await this.makeHttpRequest(fetchContentRequest, params)
    return response?.fetchContent
  }

  async fetchItem(identifier: string): Promise<any> {
    const params = { identifier }

    const response = await this.makeHttpRequest(fetchItemRequest, params)
    return response?.fetchItem
  }

  async fetchCart({ uid, anonymousUid, orderId }: FetchCartParams): Promise<any> {
    const params = {
      accountUid: uid,
      accountAnonymousUid: anonymousUid,
      orderId
    }

    const response = await this.makeHttpRequest(fetchCartRequest, params)
    return response?.fetchCart
  }

  async checkoutCart({
    uid, anonymousUid, gateway, gatewayOptions, orderId
  }: CheckoutCartParams): Promise<any> {
    const params = {
      accountUid: uid,
      accountAnonymousUid: anonymousUid,
      gatewayIdentifier: gateway,
      gatewayOptions,
      orderId
    }

    const response = await this.makeHttpRequest(checkoutCartRequest, params)
    return response?.checkoutCart
  }

  async capturePayment({
    uid, anonymousUid, gatewayResponse, orderId
  }: CapturePaymentParams): Promise<any> {
    const params = {
      accountUid: uid,
      accountAnonymousUid: anonymousUid,
      gatewayResponse,
      orderId
    }

    const response = await this.makeHttpRequest(capturePaymentRequest, params)
    return response?.capturePayment
  }
}

export default Client
