const EventEmitter = require('events');
const Parser = require('./parser');
const NativeTransport = require('./transports/native');
const initiateProtocolHandlers = require('./protocol');
const Store = require('./store');
const Config = require('./config');
const Message = require('./message');

/**
 *
 * todo:
 * * default port if invalid port specified
 *
 */
class IRCClient extends EventEmitter {
  constructor(opts = {}) {
    super();

    this.config = new Config(opts);
    this.store = new Store();

    if (this.config.get('port') > 65535 || this.config.get('port') < 1) {
      if (this.config.get('tls')) {
        this.config.set('port', 6697);
      } else {
        this.config.set('port', 6667);
      }
    }

    this.transport = opts.transport || 'native';
    this.handlers = new EventEmitter();

    if (this.transport === 'native') {
      this.connection = new NativeTransport();
    }

    this.connection.on('DATA', this.process.bind(this));
    this.connection.on('ERROR', console.log);

    initiateProtocolHandlers(this);
  }

  connect() {
    let connectOptions = {
      host: this.config.get('host'),
      port: this.config.get('port'),
    };

    if (this.config.get('tls')) {
      connectOptions = Object.assign({}, connectOptions, {
        tls: this.config.get('tls'),
        tlsCipher: this.config.get('tlsCipher'),
        tlsCert: this.config.get('tlsCert'),
        tlsKey: this.config.get('tlsKey'),
        tlsRejectUnauthorized: this.config.get('tlsRejectUnauthorized'),
      });
    }

    this.connection.connect(connectOptions);
  }

  process(line) {
    const data = Parser.parse(line);

    if (data.command === 'PING') {
      this.connection.send(`PONG :${data.params[data.params.length - 1]}`);
    }

    this.handlers.emit(data.command.toUpperCase(), data);
  }

  disconnect() {
    this.connection.close();
  }

  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('use() extensions only accepts functions');
    }

    Reflect.construct(fn, [this]);
    /* if (klass === undefined) {
      throw new TypeError('use() extensions must return function');
    } */

    return this;
  }

  send(data) {
    if (data instanceof Object) {
      return this.connection.send(data.toString());
    }
    return this.connection.send(data);
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

module.exports = IRCClient;
