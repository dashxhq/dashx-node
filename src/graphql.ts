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

export const createDeliveryRequest = `
  mutation CreateDelivery($input: CreateDeliveryInput!) {
    createDelivery(input: $input) {
        id
    }
  }
`

const item = `
  id
  installationId
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
