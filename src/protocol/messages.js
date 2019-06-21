const Base = require('./base');
const Event = require('../event');

class Messages extends Base {
  constructor(client) {
    super(client);

    this.store.addDesiredCapability('server-time');
    this.store.addDesiredCapability(['draft/message-tags-0.2', 'message-tags']);
    this.store.addDesiredCapability('echo-message', [
      ['draft/message-tags-0.2', 'message-tags'],
      ['draft/labeled-response', 'labeled-response'],
    ]);

    this.addCommandListener('NOTICE', this.message.bind(this));
    this.addCommandListener('PRIVMSG', this.message.bind(this));
  }

  static isCtcpMessage({ params }) {
    const message = params[params.length - 1];
    return (
      message.charCodeAt(0) === 1 &&
      message.charCodeAt(message.length - 1) === 1
    );
  }

  static getCtcpCommandAndValue({ params }) {
    const [, command, value = null] = params[params.length - 1].match(
      /\1([^\s|$|\1]+)(?:\s([^$|\1]+))?\1?/,
    );

    return [command, value];
  }

  static isServerMessage({ prefix }, server) {
    return prefix === server || server === undefined;
  }

  message(data) {
    const {
      prefix,
      nick,
      ident,
      hostname,
      params: [target, message],
    } = data;

    if (Messages.isServerMessage(data, this.store.get('server'))) {
      this.emit(
        `server::${data.command.toLowerCase()}`,
        new Event(
          {
            prefix,
            target,
            message,
          },
          data,
        ),
      );
    } else {
      const event = new Event(
        {
          prefix,
          nick,
          ident,
          hostname,
          target,
          message,
        },
        data,
      );

      if (Messages.isCtcpMessage(data)) {
        const [command, value = null] = Messages.getCtcpCommandAndValue(data);

        this.emit(
          `ctcp::${data.command === 'NOTICE' ? 'response' : 'request'}`,
          new Event(
            {
              prefix,
              nick,
              ident,
              hostname,
              command,
              value,
            },
            data,
          ),
        );
      } else if (this.isChannel(target)) {
        this.emit(`channel::${data.command.toLowerCase()}`, event);
      } else {
        this.emit(`user::${data.command.toLowerCase()}`, event);
      }
    }
  }
}

module.exports = Messages;
