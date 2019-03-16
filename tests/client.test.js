const IRCClient = require('../src/client');

describe('client', () => {
  it('defaults to port 6697 if tls is enabled', () => {
    const client = new IRCClient({ port: 0, tls: true });
    expect(client.config.get('port')).toBe(6697);
  });

  it('defaults to port 6667 if tls is disabled', () => {
    const client = new IRCClient({ port: 0, tls: false });
    expect(client.config.get('port')).toBe(6667);
  });

  it('sets port to 6697', () => {
    const client = new IRCClient();
    expect(client.config.get('port')).toBe(6697);
  });

  it('defaults to null if no host is given', () => {
    const client = new IRCClient();

    expect(client.config.get('host')).toBe(null);
  });
});
