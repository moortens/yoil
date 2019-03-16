const Message = require('../src/message');

describe('tests message construction', () => {
  it('should allow string parameters', () => {
    const msg = new Message('COMMAND', 'param1', 'param2');
    const data = { command: 'COMMAND', params: ['param1', 'param2'] };
    expect(msg).toMatchObject(data);
  });

  it('should allow object parameters', () => {
    const data = { command: 'COMMAND', params: ['param1', 'param2'] };
    const msg = new Message(data);
    expect(msg).toMatchObject(data);
  });

  it('should convert messages to their irc syntax', () => {
    const messages = [
      [
        '@account=test;batch=aBcDeFGH PRIVMSG #channel :TEST',
        {
          tags: new Map([['account', 'test'], ['batch', 'aBcDeFGH']]),
          command: 'PRIVMSG',
          params: ['#channel', 'TEST'],
        },
      ],
      [
        'PRIVMSG #channel :TEST',
        {
          command: 'PRIVMSG',
          params: ['#channel', 'TEST'],
        },
      ],
      [
        'PRIVMSG #channel :TESTing longer message',
        {
          command: 'PRIVMSG',
          params: ['#channel', 'TESTing longer message'],
        },
      ],
    ];

    messages.forEach(([message, data]) => {
      const msg = new Message(data);
      expect(msg.toString()).toBe(message);
    });
  });
});
