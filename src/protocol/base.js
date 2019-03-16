const Parser = require('../parser');

/**
 * The **Base** class provides synthetic sugar to commonly used functions
 * in the client class.
 *
 * @author moortens
 */

class Base {
  /**
   * Initializes the client object on the class, allowing for shortcut
   * functions to work.
   *
   * @param {Object} Client
   */
  constructor(client) {
    const { connection, config, handlers, store } = client;

    this.client = client;

    this.connection = connection;
    this.config = config;
    this.store = store;
    this.handlers = handlers;
  }

  /**
   * Send raw data to the server.
   *
   * @param {String} data
   */
  send(data) {
    return this.client.send(data);
  }

  /**
   * Adds a before handler to connections. Useful if you need to
   * do something _before_ other handlers proceed. For instance
   * used in order to send the initial CAP LS command prior to
   * registering.
   *
   * @param  {...any} args
   * @see {@link https://nodejs.org/api/events.html#events_emitter_prependlistener_eventname_listener|prependListener}
   */
  prependConnectionListener(...args) {
    return this.connection.prependListener(...args);
  }

  /**
   *
   * @param  {...any} args
   */
  addConnectionListener(...args) {
    return this.connection.addListener(...args);
  }

  prependCommandListener(...args) {
    return this.handlers.prependListener(...args);
  }

  /**
   *
   * @param  {...any} args
   */
  addCommandListener(...args) {
    return this.handlers.addListener(...args);
  }

  /**
   *
   * @param  {...any} args
   */
  emit(event, data) {
    if (data.tags) {
      if (data.tags.get('batch')) {
        return this.store.enqueueBatchedResponse(data.tags.get('batch'), data);
      }
    }

    return this.client.emit(event, data);
  }

  static parseModeInUserhost(str) {
    const modes = ['~', '&', '@', '%', '+'];

    let i = 0;
    const m = [];
    while (i < str.length && modes.includes(str[i])) {
      m.push(str[i]);
      i += 1;
    }
    return [str.substring(i), m];
  }

  static parseUserHost(userhost) {
    return Parser.parseUserHost(userhost);
  }
}

module.exports = Base;
