export const trackEventRequest = `
  mutation TrackEvent($input: TrackEventInput!) {
    trackEvent(input: $input) {
        success
    }
  }
`

export const identifyAccountRequest = `
  mutation IdentifyAccount($input: IdentifyAccountInput!) {
    identifyAccount(input: $input) {
        id
    }
  }
`

export const addContentRequest = `
  mutation AddContent($input: AddContentInput!) {
    addContent(input: $input) {
        id
        identifier
        position
        data
    }
  }
`

export const editContentRequest = `
  mutation EditContent($input: EditContentInput!) {
    editContent(input: $input) {
        id
        identifier
        position
        data
    }
  }
`

export const searchContentRequest = `
  query SearchContent($input: SearchContentInput!) {
    searchContent(input: $input)
  }
`

export const fetchContentRequest = `
  query FetchContentRequest($input: FetchContentInput!) {
    fetchContent(input: $input)
  }
`

export const searchRecordsRequest = `
  query SearchRecords($input: SearchRecordsInput!) {
    searchRecords(input: $input)
  }
`

export const createDeliveryRequest = `
  mutation CreateDelivery($input: CreateDeliveryInput!) {
    createDelivery(input: $input) {
        id
    }
  }
`

const item = `
  id
  name
  identifier
  description
  createdAt
  updatedAt

  pricings {
    id
    kind
    amount
    originalAmount
    isRecurring
    recurringInterval
    recurringIntervalUnit
    appleProductIdentifier
    googleProductIdentifier
    currencyCode
    createdAt
    updatedAt
  }
`

export const fetchContactsRequest = `
  query FetchContacts($input: FetchContactsInput!) {
    fetchContacts(input: $input) {
      contacts {
        id
        accountId
        name
        kind
        value
        unverifiedValue
        verifiedAt
        status
        tag
        createdAt
        updatedAt
      }
    }
  }
`

export const fetchItemRequest = `
  query FetchItem($input: FetchItemInput) {
    fetchItem(input: $input) {
      ${item}
    }
  }
`

const cart = `
  id
  status
  subtotal
  discount
  tax
  total
  gatewayMeta
  currencyCode

  orderItems {
    id
    quantity
    unitPrice
    subtotal
    discount
    tax
    total
    custom
    currencyCode

    item {
      ${item}
    }
  }

  couponRedemptions {
    coupon {
      name
      identifier
      discountType
      discountAmount
      currencyCode
      expiresAt
    }
  }
`

export const fetchCartRequest = `
  query FetchCart($input: FetchCartInput!) {
    fetchCart(input: $input) {
      ${cart}
    }
  }
`

export const checkoutCartRequest = `
  mutation CheckoutCart($input: CheckoutCartInput!) {
    checkoutCart(input: $input) {
      ${cart}
    }
  }
`

export const capturePaymentRequest = `
  mutation CapturePayment($input: CapturePaymentInput!) {
    capturePayment(input: $input) {
      ${cart}
    }
  }
`

const asset = `
  id
  name
  size
  mimeType
  url
  uploadStatus
  processingStatus
  createdAt
  updatedAt
`

export const assetRequest = `
  query Asset($id: UUID!) {
    asset(id: $id) {
      ${asset}
    }
  }
`

export const assetsListRequest = `
  query AssetsList($filter: JSON, $limit: Int, $order: JSON, $page: Int) {
    assetsList(filter: $filter, limit: $limit, order: $order, page: $page) {
      ${asset}
    }
  }
`

export const fetchStoredPreferencesRequest = `
  query FetchStoredPreferences($input: FetchStoredPreferencesInput) {
    fetchStoredPreferences(input: $input) {
      preferenceData
    }
  }
`

export const prepareAssetRequest = `
  mutation PrepareAsset($input: PrepareAssetInput!) {
    prepareAsset(input: $input) {
      ${asset}
    }
  }
`

export const saveStoredPreferencesRequest = `
  mutation SaveStoredPreferences($input: SaveStoredPreferencesInput) {
    saveStoredPreferences(input: $input) {
      success
    }
  }
`
