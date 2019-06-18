const EventEmitter = require('events');

const Parser = require('./parser');

class Connection extends EventEmitter {
  constructor(config) {
    super();

    this.config = config;
    this.tls = this.config.tls;

    this.connectionOptions = {
      host: this.config.host,
      port: this.config.port,
    };

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

    const { host, port } = this.connectionOptions;

    // eslint-disable-next-line no-undef
    this.socket = new WebSocket(
      `${this.tls ? 'wss' : 'ws'}://${host}:${port}/`,
    );
    this.socket.onopen = () => {
      this.emit('connection::connected');
    };

    this.socket.onerror = err => this.emit('connection::error', err);
    this.socket.onclose = () => {
      this.emit('connection::disconnected');
    };
    this.socket.onmessage = ({ data }) =>
      this.emit('connection::data', Parser.parse(data));
  }

  send(data) {
    if ([0, 2, 3].includes(this.socket.readyState)) {
      return null;
    }

    if (data instanceof Object) {
      return this.socket.send(`${data.toString()}\r\n`);
    }
    return this.socket.send(`${data}\r\n`);
  }

  close() {
    this.socket.close();
  }
}

module.exports = Connection;
