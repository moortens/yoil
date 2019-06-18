const irc = require('../');

describe('client', () => {
  it('expect client to require a config object', () => {
    expect(() => {
      const client = new irc.Client({});
    }).toThrow();
  });
});
