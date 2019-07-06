import uuid from 'uuid/v4';

import store from './store';

class Message {
  tags: Map<any, any> = new Map();
  prefix: string = null;
  nick: string = null;
  ident: string = null;
  hostname: string = null;
  command: string = null;
  message: string = null;
  params: string[] = [];
  timestamp: Date = new Date();

  constructor(data?: object | string, ...params: string[]) {
    if (data instanceof Object) {
      Object.assign(this, data, {});
    } else if (typeof data === 'string') {
      this.command = data;
      this.params = params;
    }

    if (!(this.tags instanceof Map)) {
      throw new Error('tags need to be an instance of Map');
    }
  }

  set(key: any, value: any): Message {
    this.tags.set(key, value);
    return this;
  }

  get time(): Date {
    if (this.tags.has('time')) {
      return new Date(this.tags.get('time'));
    }

    return this.timestamp;
  }

  get account(): string {
    if (this.tags.has('account')) {
      return this.tags.get('account');
    }
    return null;
  }

  get msgid(): string {
    if (this.tags.has('msgid')) {
      return this.tags.get('msgid');
    }

    if (this.tags.has('draft/msgid')) {
      return this.tags.get('draft/msgid');
    }

    return null;
  }

  get label(): string {
    if (this.tags.has('label')) {
      return this.tags.get('label');
    }

    if (this.tags.has('draft/label')) {
      return this.tags.get('draft/label');
    }

    return null;
  }

  toString(): string {
    let message = [];

    if (
      store.isEnabledCapability([
        'draft/labeled-response',
        'draft/labeled-response-0.2',
        'labeled-response',
      ]) &&
      store.isEnabledCapability('batch') &&
      store.isEnabledCapability(['draft/message-tags-0.2', 'message-tags'])
    ) {
      if (!this.tags.has('draft/label')) {
        this.tags.set('draft/label', uuid());
      }
    }

    if (this.tags.size > 0) {
      const escapeMap = {
        ';': '\\:',
        ' ': '\\s',
        '\\': '\\\\',
        '\r': '\\r',
        '\n': '\\n',
      };

      const tags = [];
      this.tags.forEach((value, key) => {
        tags.push(
          `${key}=${value.replace(/;|\s|\\|\r|\n/gi, m => escapeMap[m])}`,
        );
      });

      message.push(`@${tags.join(';')}`);
    }

    if (!this.command) {
      return null;
    }

    message.push(this.command);

    const specialTrailingCommands = ['PRIVMSG', 'NOTICE'];
    if (
      specialTrailingCommands.includes(this.command) &&
      this.params.length === 2
    ) {
      const [target, trailing] = this.params;
      message.push(`${target} :${trailing}`);
    } else {
      message = message.concat(
        this.params
          .filter(p => {
            return p !== null && p !== undefined;
          })
          .map(p => {
            if (p.includes(' ')) {
              return `:${p}`;
            }
            return p;
          }),
      );
    }

    return message.join(' ');
  }
}

export default Message;
