const Numerics = require('./numerics');
const Message = require('./message');

class Parser {
  static parseMessageTags(token) {
    return token
      .substr(1)
      .split(';')
      .map(tag => {
        const [, key, value = true] = tag.match(/^([^=|$]*)(?:=(.*))?/);

        if (typeof value === 'string') {
          const escapeMap = {
            '\\:': ';',
            '\\s': ' ',
            '\\\\': '\\',
            '\\r': '\r',
            '\\n': '\n',
          };

          return [
            key,
            value.replace(/\\:|\\s|\\\\|\\r|\\n/gi, m => escapeMap[m]),
          ];
        }

        return [key, value];
      });
  }

  static parse(message) {
    if (typeof message !== 'string') {
      return {};
    }

    const tokens = message.split(' ');

    let t = tokens.shift();

    const data = new Message();
    data.message = message;
    // is the first characther an at (@) character, indicating a message tag
    if (t.charCodeAt(0) === 64) {
      data.tags = new Map(Parser.parseMessageTags(t));
      t = tokens.shift();
    }

    if (t.charCodeAt(0) === 58) {
      const [prefix, nick, ident, hostname] = t
        .substring(1)
        .match(/([^!@]*)(?:!([^@]*))?(?:@([^$]*))?$/);

      data.prefix = prefix;
      data.nick = nick;
      data.ident = ident;
      data.hostname = hostname;

      t = tokens.shift();
    }

    data.command = Numerics[parseInt(t, 10)] || t;

    data.params = [];
    for (let i = 0; i < tokens.length; i += 1) {
      if (tokens[i].charCodeAt(0) === 58) {
        data.params.push(
          tokens
            .slice(i)
            .join(' ')
            .substring(1),
        );
        break;
      } else {
        data.params.push(tokens[i]);
      }
    }

    return data;
  }
}

module.exports = Parser;
