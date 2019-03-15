class Store {
  constructor() {
    this.store = new Map();

    this.desiredCapabilities = new Set();
    this.enabledCapabilities = new Set();

    this.advertisedFeatures = new Map();

    // multi-line responses, batch cache
    this.cache = new Map();
    this.batchedResponseCache = new Map();
  }

  /**
   * Adds a desired capability which the client will try to negotiate. If an array of
   * values is given, it defines additional data for that specific capability.
   * The capability specification defines how this is used.
   *
   * For instance, the sasl capability MAY announce supported authentication
   * mechanisms during capability negotiation. In such an event, the provided
   * additional data can be used to check if the sasl capability supports a
   * sasl authentication mechanism the client supports.
   *
   * @param {String} cap - name of capability
   * @param {Array} [value=null] - array of accepted values for capability
   */
  addDesiredCapability(cap) {
    if (cap === undefined) {
      return;
    }

    this.desiredCapabilities.add(cap);
  }

  /**
   * Returns a Map of the desired capabilities.
   *
   * @returns {Map} The desired capabilities
   */
  getDesiredCapabilities() {
    return Array.from(this.desiredCapabilities);
  }

  /**
   * Deletes a specific capability from the list.
   *
   * @param {String} [cap=null] - the capability to delete
   */
  removeDesiredCapability(cap) {
    this.desiredCapabilities.delete(cap);
  }

  /**
   * Adds a negotiated capability to the enabled capability
   * list.
   *
   * @param {String} cap
   */
  addEnabledCapability(cap) {
    return this.enabledCapabilities.add(cap);
  }

  /**
   * Removes an enabled capability
   *
   * @param {String} cap
   */
  removeEnabledCapability(cap) {
    return this.enabledCapabilities.delete(cap);
  }

  /**
   * Get all enabled capabilities.
   */
  getEnabledCapabilities() {
    return Array.from(this.enabledCapabilities);
  }

  hasEnabledCapability(capability) {
    return this.enabledCapabilities.has(capability);
  }

  /**
   * Returns true if the capability is enabled and active.
   *
   * @param {String} cap
   */
  isEnabledCapability(cap) {
    return this.enabledCapabilities.has(cap);
  }

  /**
   * Set an advertised feature.
   *
   * @param {String} param
   * @param {*} value
   */
  setAdvertisedFeature(param, value = true) {
    return this.advertisedFeatures.set(param, value);
  }

  getAdvertisedFeature(param) {
    return this.advertisedFeatures.get(param);
  }

  enqueueBatchedResponse(batch, data) {
    const batchCache = this.batchedResponseCache.get(batch) || new Set();

    batchCache.add(data);

    this.batchedResponseCache.set(batch, batchCache);
  }

  /**
   * Stores additional data in the store.
   *
   * @param {String} key - name of the data (key)
   * @param {String} value - what to store
   */
  set(key, value) {
    return this.store.set(key, value);
  }

  /**
   * Gets a specific key from the store.
   *
   * @param {String} key
   */
  get(key) {
    return this.store.get(key);
  }
}

module.exports = Store;
