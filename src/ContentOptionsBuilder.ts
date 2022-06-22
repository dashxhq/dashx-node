import { parseFilterObject } from './utils'

export type ContentOptions = {
  returnType?: 'all' | 'one',
  language?: string,
  include?: Array<string>,
  exclude?: Array<string>,
  fields?: Array<string>,
  preview?: boolean,
  filter?: Record<string, any>,
  order?: Record<string, 'ASC' | 'DESC'>,
  limit?: number,
  page?: number
}

export type FetchContentOptions = Pick<ContentOptions, 'exclude' | 'include' | 'fields' | 'language' | 'preview'>

class ContentOptionsBuilder {
  private options: ContentOptions

  private callback: (options: ContentOptions) => Promise<any>

  constructor(
    callback: (options: ContentOptions) => Promise<any>
  ) {
    this.options = {}
    this.callback = callback
  }

  limit(by: ContentOptions['limit']) {
    this.options.limit = by
    return this
  }

  filter(by: ContentOptions['filter']) {
    this.options.filter = parseFilterObject(by)
    return this
  }

  order(by: ContentOptions['order']) {
    this.options.order = by
    return this
  }

  language(to: ContentOptions['language']) {
    this.options.language = to
    return this
  }

  fields(identifiers: ContentOptions['fields']) {
    this.options.fields = identifiers
    return this
  }

  include(identifiers: ContentOptions['include']) {
    this.options.include = identifiers
    return this
  }

  exclude(identifiers: ContentOptions['exclude']) {
    this.options.exclude = identifiers
    return this
  }

  preview(value = true) {
    this.options.preview = value
    return this
  }

  all(withOptions: ContentOptions) {
    this.options = { ...this.options, ...withOptions, returnType: 'all' }
    return this.callback(this.options)
  }

  async one(withOptions: ContentOptions) {
    this.options = { ...this.options, ...withOptions, returnType: 'one' }
    const data = await this.callback(this.options)

    return Array.isArray(data) ? data[0] : null
  }
}

export default ContentOptionsBuilder
