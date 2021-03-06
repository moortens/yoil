const EventEmitter = require('events');
const Parser = require('../parser');

/*
 * Keep a local cache of event names that are being listened for.
 */
const eventNames = new Set();

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
    const { socket, config, store } = client;

    this.client = client;

    this.socket = socket;
    this.config = config;
    this.store = store;

    this.events = new EventEmitter();

    this.client.on('socket::data', data => {
      this.events.emit(data.command, data);
    });
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
    return this.client.prependListener(...args);
  }

  /**
   *
   * @param  {...any} args
   */
  addConnectionListener(...args) {
    return this.client.addListener(...args);
  }

  prependCommandListener(...args) {
    const [eventName] = args;

    eventNames.add(eventName);

    return this.events.prependListener(...args);
  }

  /**
   *
   * @param  {...any} args
   */
  addCommandListener(...args) {
    const [eventName] = args;

    eventNames.add(eventName);

    return this.events.addListener(...args);
  }

  static getCommandListenerEvents() {
    return Array.from(eventNames);
  }

  /**
   *
   * @param  {...any} args
   */
  emit(event, data) {
    if (data.context.tags) {
      if (data.context.tags.get('batch')) {
        return this.store.enqueueBatchedResponse(
          data.context.tags.get('batch'),
          {
            event,
            ...data,
          },
        );
      }
    }

    return this.client.emit(event, {
      event,
      ...data,
    });
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

  isChannel(target) {
    return (this.store.getAdvertisedFeature('chantypes') || '#')
      .split('')
      .includes(target.substring(0, 1));
  }
}

module.exports = Base;
