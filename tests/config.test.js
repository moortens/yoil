const Config = require('../src/config');

describe('config', () => {
  it('should throw when not defined', () => {
    expect(() => {
      new Config()
    }).toThrow();
  });

  it('should be an instance of Config if given correct parameters', () => {
    expect(new Config({ 
      host: '127.0.0.1',
      port: 6667,
      nickname: 'nickname',
      username: 'hostname',
      realname: 'realname',
    })).toBeInstanceOf(Config);
  })
});
