export type SearchRecordsInput = {
  resource: string,
  filter?: Record<string, any>,
  order?: Record<string, 'ASC' | 'DESC'>,
  limit?: number,
  page?: number,
  preview?: boolean,
  language?: string,
  fields?: string[],
  include?: string[],
  exclude?: string[],
}

export type SearchRecordsOptions = Omit<SearchRecordsInput, 'resource'>

export type FetchRecordOptions = Pick<SearchRecordsOptions, 'exclude' | 'include' | 'fields' | 'language' | 'preview'>

class SearchRecordsInputBuilder {
  private options: SearchRecordsOptions

  private callback: (options: SearchRecordsOptions) => Promise<any>

  constructor(
    resource: string,
    callback: (options: SearchRecordsOptions) => Promise<any>,
  ) {
    this.options = { resource } as SearchRecordsOptions
    this.callback = callback
  }

  limit(by: SearchRecordsOptions['limit']) {
    this.options.limit = by
    return this
  }

  filter(by: SearchRecordsOptions['filter']) {
    this.options.filter = by || {}
    return this
  }

  order(by: SearchRecordsOptions['order']) {
    this.options.order = by
    return this
  }

  language(to: SearchRecordsOptions['language']) {
    this.options.language = to
    return this
  }

  fields(identifiers: SearchRecordsOptions['fields']) {
    this.options.fields = identifiers
    return this
  }

  include(identifiers: SearchRecordsOptions['include']) {
    this.options.include = identifiers
    return this
  }

  exclude(identifiers: SearchRecordsOptions['exclude']) {
    this.options.exclude = identifiers
    return this
  }

  preview(value = true) {
    this.options.preview = value
    return this
  }

  async all(withOptions?: SearchRecordsOptions) {
    this.options = { ...this.options, ...withOptions }
    const data = await this.callback(this.options)
    return data
  }

  async one(withOptions?: SearchRecordsOptions) {
    this.options = { ...this.options, ...withOptions }
    const data = await this.callback(this.options)

    if (Array.isArray(data) && data.length) {
      return data[0]
    }

    return null
  }
}

export default SearchRecordsInputBuilder
