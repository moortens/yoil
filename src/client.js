const EventEmitter = require('events');
const Parser = require('./parser');
const NativeTransport = require('./transports/native');
const initiateProtocolHandlers = require('./protocol');
const Store = require('./store');
const Config = require('./config');

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
}

module.exports = IRCClient;
