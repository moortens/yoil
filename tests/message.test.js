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

  it('should allow setting command', () => {
    const msg = new Message();

    msg.command = 'PRIVMSG';

    expect(msg).toMatchObject({ command: 'PRIVMSG' });
  });

  it('should allow setting parameter', () => {
    const msg = new Message();

    msg.command = 'PRIVMSG';
    msg.params = '#channel';

    expect(msg).toMatchObject({ command: 'PRIVMSG', params: ['#channel'] });
  });

  it('should allow setting tags via objects', () => {
    const msg = new Message();

    msg.command = 'PRIVMSG';
    msg.tags = {
      account: 'user',
      batch: 'aBcDeFGH',
    };

    expect(msg).toMatchObject({
      command: 'PRIVMSG',
      tags: new Map([['account', 'user'], ['batch', 'aBcDeFGH']]),
    });
  });

  it('should allow setting tags via arrays', () => {
    const msg = new Message();

    msg.command = 'PRIVMSG';
    msg.tags = [['account', 'user'], ['batch', 'aBcDeFGH']];

    expect(msg).toMatchObject({
      command: 'PRIVMSG',
      tags: new Map([['account', 'user'], ['batch', 'aBcDeFGH']]),
    });
  });

  it('should allow removing all tags', () => {
    const msg = new Message();

    msg.command = 'PRIVMSG';
    msg.tags = [['account', 'user'], ['batch', 'aBcDeFGH']];
    msg.tags = null;

    expect(msg).toMatchObject({ command: 'PRIVMSG', tags: new Map() });
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
