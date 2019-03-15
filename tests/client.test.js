const IRCClient = require('../src/client');

describe('client', () => {
  it('sets port to 6697', () => {
    const client = new IRCClient();
    expect(client.config.get('port')).toBe(6697);
  });

  it('defaults to null if no host is given', () => {
    const client = new IRCClient();

    expect(client.config.get('host')).toBe(null);
  });
})