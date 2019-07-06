import { EventEmitter } from 'events';

import Config from "./config";
import Parser from './parser';

interface ConnectionOptions {
  host: string,
  port: number,
};

class Connection extends EventEmitter {
  config: Config = null;
  tls: boolean = false;

  connectionOptions: ConnectionOptions = null;

  socket: WebSocket = null;

  constructor(config: Config) {
    super();

    this.config = config;
    this.tls = this.config.tls;

    this.connectionOptions = {
      host: this.config.host,
      port: this.config.port,
    };
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
      this.emit('socket::connected');
    };

    this.socket.onerror = err => this.emit('socket::error', err);
    this.socket.onclose = () => {
      this.emit('socket::disconnected');
    };
    this.socket.onmessage = ({ data }) =>
      this.emit('socket::data', Parser.parse(data));
  }

  send(data: string | object) {
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

export default Connection;
