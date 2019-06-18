const initiateProtocolHandlers = require('./protocol');
const Config = require('./config');
const Message = require('./message');
const Connection = require('./websocket');

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

    this.store.set('connected', false);
    this.store.set('registered', false);

    this.on('connected', () => {
      this.store.set('connected', true);
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

  send(message) {
    super.send(message);

    return message.label;
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

  close() {
    if (this.store.get('registered')) {
      this.end();
    } else {
      this.destroy();
    }
  }
}

module.exports = Client;
