import { EventEmitter } from 'events';
import Parser from '../parser';

import Client from '../client';
import Config from '../config';
import Event from '../event';
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
abstract class Base {
  client: Client;
  socket: WebSocket;
  config: Config;
  store: any;
  events: EventEmitter;

  listeners: [];
  /**
   * Initializes the client object on the class, allowing for shortcut
   * functions to work.
   *
   * @param {Object} Client
   */
  constructor(client: Client) {
    const { socket, config, store } = client;

    this.client = client;

    this.socket = socket;
    this.config = config;
    this.store = store;

    this.events = new EventEmitter();

    if (this.client === null) return;

    this.client.on('socket::data', data => {
      this.events.emit(data.command, data);
    });
  }

  /**
   * Send raw data to the server.
   *
   * @param {*} data
   */
  send(data: any) {
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
  prependConnectionListener(eventName: string, args: any) {
    return this.client.prependListener(eventName, args);
  }

  /**
   *
   * @param  {...any} args
   */
  addConnectionListener(eventName: string, args: any) {
    return this.client.addListener(eventName, args);
  }

  prependCommandListener(eventName: string, args: any) {
    eventNames.add(eventName);

    return this.events.prependListener(eventName, args);
  }

  /**
   *
   * @param  {...any} args
   */
  addCommandListener(eventName: string, args: any) {
    eventNames.add(eventName);

    return this.events.addListener(eventName, args);
  }

  static getCommandListenerEvents() {
    return Array.from(eventNames);
  }

  /**
   *
   * @param  {...any} args
   */
  emit(event: string, data: Event) {
    if (data.tag('batch')) {
      return this.store.enqueueBatchedResponse(
        data.tag('batch'),
        {
          event,
          ...data,
        },
      );
    }

    return this.client.emit(event, {
      event,
      ...data,
    });
  }

  static parseModeInUserhost(str: string): [string, Array<string>] {
    const modes = ['~', '&', '@', '%', '+'];

    let i = 0;
    const m = [];
    while (i < str.length && modes.includes(str[i])) {
      m.push(str[i]);
      i += 1;
    }
    return [str.substring(i), m];
  }

  static parseUserHost(userhost: string) {
    return Parser.parseUserHost(userhost);
  }

  isChannel(target: string) {
    return (this.store.getAdvertisedFeature('chantypes') || '#')
      .split('')
      .includes(target.substring(0, 1));
  }
}

export default Base;
