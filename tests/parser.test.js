const Parser = require('../src/parser');

describe('parser', () => {
  it('should parse and extract message tags', () => {
    const messages = [
      [
        '@aaa=bbb;ccc;example.com/ddd=eee :nick!ident@host.com PRIVMSG me :Hello',
        [['aaa', 'bbb'], ['ccc', true], ['example.com/ddd', 'eee']],
      ],
      [
        '@example-tag=example-value PRIVMSG #channel :Message',
        [['example-tag', 'example-value']],
      ],
      [
        '@+icon=https://example.com/favicon.png :url_bot!bot@example.com PRIVMSG #channel :Example.com: A News Story',
        [['+icon', 'https://example.com/favicon.png']],
      ],
      [
        '@+example.com/foo=bar :irc.example.com NOTICE #channel :A vendor-prefixed client-only tagged message',
        [['+example.com/foo', 'bar']],
      ],
      [
        '@foo=;bar :irc.example.com NOTICE #channel :A vendor-prefixed client-only tagged message',
        [['foo', ''], ['bar', true]],
      ],
      [
        '@unknown-tag TAGMSG #channel',
        [['unknown-tag', true]],
      ],
      [
        '@label=123;msgid=abc;+example-client-tag=example-value :nick!user@example.com TAGMSG #channel',
        [['label', '123'], ['msgid', 'abc'], ['+example-client-tag', 'example-value']],
      ],
      [
        '@+example=raw===;testing=multiple=signs :irc.example.com NOTICE #channel :Message',
        [['+example', 'raw==='], ['testing', 'multiple=signs']],
      ]
    ]

    messages.forEach(([message, tokens]) => {
      expect(Parser.parse(message)).toHaveProperty('tags', new Map(tokens))
    });
  });

  it('should parse escape characters in message tags', () => {
    expect(
      Parser.parse('@+example=raw+:=,escaped\\:\\s\\\\ :irc.example.com NOTICE #channel :Message')
    ).toHaveProperty('tags', new Map([['+example', 'raw+:=,escaped; \\']]))
  });

  it('should parse prefix as nick, ident and hostname', () => {
    const messages = [
      [
        ':user!ident@host.com PRIVMSG #channel :TEST',
        {
          prefix: 'user!ident@host.com',
          nick: 'user',
          ident: 'ident',
          hostname: 'host.com',
        },
      ],
      [
        ':!user@host.com PRIVMSG #channel :TEST',
        {
          prefix: '!user@host.com',
          nick: '',
          ident: 'user',
          hostname: 'host.com',
        },
      ],
      [
        ':nick@host.com PRIVMSG #channel :TEST',
        {
          prefix: 'nick@host.com',
          nick: 'nick',
          ident: undefined,
          hostname: 'host.com',
        },
      ],
      [
        ':user!@host.com PRIVMSG #channel :TEST',
        {
          prefix: 'user!@host.com',
          nick: 'user',
          ident: '',
          hostname: 'host.com',
        },
      ],
      [
        ':user!@ PRIVMSG #channel :TEST',
        {
          prefix: 'user!@',
          nick: 'user',
          ident: '',
          hostname: '',
        },
      ],
      [
        ':server.example.com PRIVMSG #channel :TEST',
        {
          prefix: 'server.example.com',
          nick: 'server.example.com',
          ident: undefined,
          hostname: undefined,
        },
      ],
    ];

    messages.forEach(([message, tokens]) => {
      expect(Parser.parse(message)).toMatchObject(tokens);
    });
  });

  it('should parse command', () => {
    expect(Parser.parse(':prefix PRIVMSG target :hello')).toMatchObject({ command: 'PRIVMSG' });
  });

  it('should parse tokenized parameters', () => {
    expect(Parser.parse(':prefix PRIVMSG target :hello')).toMatchObject({ params: ['target', 'hello'] });
    expect(Parser.parse(':prefix CAP * LS :multi-prefix sasl')).toMatchObject({ params: ['*', 'LS', 'multi-prefix sasl'] });
  });

  it('should parse trailing parameter', () => {
    expect(Parser.parse('PRIVMSG target :hello')).toMatchObject({ params: ['target', 'hello'] });
    expect(Parser.parse(':prefix PRIVMSG target :hello you')).toMatchObject({ params: ['target', 'hello you'] });
  });
});