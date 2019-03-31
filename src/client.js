const initiateProtocolHandlers = require('./protocol');
const Store = require('./store');
const Config = require('./config');
const Message = require('./message');
const Connection = require('./connection');
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
    this.store = new Store();

    this.handlers = new Set();

    initiateProtocolHandlers(this);
  }

  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('use() extensions only accepts functions');
    }

    this.handlers.add(Reflect.construct(fn, [this]));

    return this;
  }

  join(channel, key = undefined) {
    if (channel instanceof Array) {
      this.send(new Message('JOIN', channel.join(','), key));
    }
    this.send(new Message('JOIN', channel, key));
  }

  part(channel, reason = undefined) {
    this.send(new Message('PART', channel, reason));
  }

  list() {
    this.send(new Message('LIST'));
  }

  topic(channel, topic = undefined) {
    this.send(new Message('TOPIC', topic));
  }

  motd(target = undefined) {
    this.send(new Message('MOTD', target));
  }

  stats(query, target = undefined) {
    this.send(new Message('STATS', query, target));
  }

  privmsg(target, message) {
    this.send(new Message('PRIVMSG', target, message));
  }
}

module.exports = Client;
