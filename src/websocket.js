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
      this.emit('connected');
    };

    this.socket.onerror = err => this.emit('error', err);
    this.socket.onclose = (err = false) => {
      this.socket = null;

      this.emit('disconnect', err);
    };
    this.socket.onmessage = ({ data }) => this.emit('data', Parser.parse(data));
  }

  send(data) {
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
