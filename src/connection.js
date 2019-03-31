const EventEmitter = require('events');
const readline = require('readline');
const net = require('net');
const tls = require('tls');

const Parser = require('./parser');

class Connection extends EventEmitter {
  constructor(config) {
    super();

    this.config = config;
    this.tls = this.config.tls;

    this.connectionOptions = {
      host: this.config.host,
      port: this.config.port,

      cipher: this.config.tlsCipher,
      cert: this.config.tlsCert,
      key: this.config.tlsKey,
      rejectUnauthorized: this.config.tlsRejectUnauthorized,
    };

    this.reader = null;
    this.socket = null;
  }

  connect() {
    if (this.connectionOptions.host === null) {
      return;
    }

    if (
      this.connectionOptions.port < 0 ||
      this.connectionOptions.port > 65536
    ) {
      this.connectionOptions.port = this.config.tls ? 6697 : 6667;
    }

    this.socket = this.tls
      ? tls.connect(this.connectionOptions)
      : net.connect(this.connectionOptions);
    // sets the encoding
    this.socket.setEncoding(this.encoding);

    this.reader = readline.createInterface({
      input: this.socket,

      // according to https://nodejs.org/api/readline.html#readline_readline_createinterface_options
      // setting crlfDelay to Infinity will cause \r followed by \n to be considered a new line.
      crlfDelay: Infinity,
    });
    this.socket.on(this.tls ? 'secureConnect' : 'connect', () => {
      this.emit('connected');
    });

    this.socket.on('error', err => this.emit('error', err));
    this.socket.on('close', (err = false) => {
      this.reader.close();
      this.socket = null;

      this.emit('disconnect', err);
    });
    this.reader.on('line', data => this.emit('data', Parser.parse(data)));
  }

  send(data) {
    if (data instanceof Object) {
      return this.socket.write(`${data.toString()}\r\n`);
    }
    return this.socket.write(`${data}\r\n`);
  }

  close() {
    this.socket.destroy();
  }
}

module.exports = Connection;
