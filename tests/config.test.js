const Config = require('../src/config');

describe('config', () => {
  it('expect config be defined', () => {
    expect(new Config()).toBeInstanceOf(Config);
  });
});
