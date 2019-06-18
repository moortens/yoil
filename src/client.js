const initiateProtocolHandlers = require('./protocol');
const Config = require('./config');
const Message = require('./message');
const Connection = require('./connection');

const store = require('./store');

/**
 *
 * todo:
 * * default port if invalid port specified
 *
 */
class Client extends Connection {
  constructor(config = new Config()) {
    if (!(config instanceof Config)) {
      throw new Error('You need to pass a Config object');
    }

    super(config);

    this.config = config;
    this.store = store;

    this.reconnectTimer = null;

    this.store.set('connected', false);
    this.store.set('registered', false);
    this.store.set('reconnect', true);
    this.store.set('reconnectAttempts', 0);

    this.on('connection::connected', () => {
      this.store.set('reconnectAttempts', 0);
      this.store.set('connected', true);
    });

    this.on('connection::disconnected', () => {
      this.store.set('connected', false);
      this.reconnect();
    });

    initiateProtocolHandlers(this);
  }

  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('use() extensions only accepts functions');
    }

    Reflect.construct(fn, [this]);

    return this;
  }

  close() {
    super.close();

    this.store.set('reconnect', false);
  }

  send(message) {
    super.send(message);

    return message.label;
  }

  /**
   * Reconnect tries to reconnect to the server if there are more reconnect
   * attempts left. Configured with in the config passed to client:
   *
   * autoReconnect: false,
   * autoReconnectDelay: 60,
   * autoReconnectMaxRetries: 3,
   *
   * @param {Boolean} reset if true, resets attempt count and instantly
   *   attempts to connect.
   */
  reconnect(reset = false) {
    if (reset) {
      this.store.set('reconnectAttempts', 0);

      this.cancel();
      this.connect();

      return;
    }

    if (this.store.get('reconnect')) {
      if (this.config.autoReconnect) {
        const reconnectAttempts = this.store.get('reconnectAttempts') + 1;

        if (reconnectAttempts < this.config.autoReconnectMaxRetries) {
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, this.config.autoReconnectDelay * reconnectAttempts * 1000);

          this.store.set('reconnectAttempts', reconnectAttempts);

          this.emit('connection::reconnect', {
            retry: reconnectAttempts,
            max: this.config.autoReconnectMaxRetries,
          });
        }
      }
    }
  }

  cancel() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }

  join(channel, key = undefined) {
    if (channel instanceof Array) {
      return this.send(new Message('JOIN', channel.join(','), key));
    }
    return this.send(new Message('JOIN', channel, key));
  }

  part(channel, reason = undefined) {
    return this.send(new Message('PART', channel, reason));
  }

  list() {
    return this.send(new Message('LIST'));
  }

  topic(channel, topic = undefined) {
    return this.send(new Message('TOPIC', topic));
  }

  motd(target = undefined) {
    return this.send(new Message('MOTD', target));
  }

  stats(query, target = undefined) {
    return this.send(new Message('STATS', query, target));
  }

  privmsg(target, message) {
    return this.send(new Message('PRIVMSG', target, message));
  }

  quit(message) {
    this.send(new Message('QUIT', message));
    this.close();
  }
}

module.exports = Client;
