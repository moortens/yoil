const EventEmitter = require('events');
const readline = require('readline');
const net = require('net');
const tls = require('tls');

class NativeTransport extends EventEmitter {
  constructor(encoding = 'utf-8') {
    super();

    this.reader = null;
    this.socket = null;

    this.options = {};

    this.encoding = encoding;
    this.tls = false;
    this.options = {
      host: null,
      port: 6697,

      cipher: null,
      cert: null,
      key: null,
      rejectUnauthorized: false,
    };
  }

  connect(opts = {}) {
    this.options = Object.assign({}, this.options, {
      host: opts.host,
      port: opts.port,

      cipher: opts.tlsCipher,
      cert: opts.tlsCert,
      key: opts.tlsKey,
      rejectUnauthorized: opts.tlsRejectUnauthorized,
    });

    this.tls = opts.tls;

    if (this.options.host === null) {
      return;
    }

    this.socket = this.tls
      ? tls.connect(this.options)
      : net.connect(this.options);

    // sets the encoding
    this.socket.setEncoding(this.encoding);

    this.reader = readline.createInterface({
      input: this.socket,

      // according to https://nodejs.org/api/readline.html#readline_readline_createinterface_options
      // setting crlfDelay to Infinity will cause \r followed by \n to be considered a new line.
      crlfDelay: Infinity,
    });

    this.socket.on(
      this.tls ? 'secureConnect' : 'connect',
      this.onConnect.bind(this),
    );
    this.socket.on('error', this.onError.bind(this));
    this.socket.on('close', this.onClose.bind(this));
    this.reader.on('line', this.onData.bind(this));
  }

  onConnect() {
    this.emit('CONNECTED');
  }

  onError(err) {
    this.emit('ERROR', err);
  }

  onData(data) {
    // sometimes we recieve empty strings, simply disregard them
    // TODO: should investigate why and if it could lead to an infinite
    // loop.
    if (data.length > 0) {
      this.emit('DATA', data);
    }
  }

  onClose(err = false) {
    this.reader.close();
    this.socket = null;

    this.emit('DISCONNECT', err);
  }

  send(data) {
    this.socket.write(`${data}\r\n`);
  }

  close() {
    this.socket.destroy();
  }
}

module.exports = NativeTransport;
