const Mitm = require('mitm');
const NativeTransport = require('../../src/transports/native');

let mitm;

beforeEach(() => {
  mitm = Mitm();
  mitm.on('connection', (socket) => {
    socket.write(':mock.example.org 001 user :Welcome to the Mock Network, user\r\n');
  });
});

afterEach(() => {
  mitm.disable();
})

describe('native transport', () => {
  it('should create a non-tls connection', (done) => {
    const connection = new NativeTransport();
    connection.connect({ host: '127.0.0.1', port: 9999, secure: false });
    connection.on('CONNECTED', () => {
      connection.close();
      done();
    });
  });

  it('should create a tls connection', (done) => {
    const connection = new NativeTransport();
    connection.connect({ host: '127.0.0.1', port: 9999, secure: true });
    connection.on('CONNECTED', () => {
      connection.close();
      done();
    });
  });

  it('should emit "data" event', (done) => {
    expect.assertions(1);
    const connection = new NativeTransport();
    connection.connect({ host: '127.0.0.1', port: 9999, secure: false });
    connection.on('CONNECTED', () => {
      connection.send('NICK nickname');
    });
    connection.on('DATA', (data) => {
      expect(data).toBeDefined();
      done();
    });
  });

  it('should close connection', (done) => {
    const connection = new NativeTransport();
    connection.connect({ host: '127.0.0.1', port: 9999, secure: false });
    const cb = jest.fn(() => {
      connection.close();
    });
    connection.on('CONNECTED', cb);
    connection.on('DISCONNECT', () => {
      expect(cb).toHaveBeenCalled();
      done();
    });
  });

  it('should emit error', (done) => {
    mitm.disable();
    const connection = new NativeTransport();
    connection.connect({ host: '127.0.0.1', port: 9999, secure: false });
    connection.on('ERROR', (err) => {
      connection.close();
      done();
    });
  });

  it('should return empty object if no host is given', () => {
    const connection = new NativeTransport();
    expect(connection.connect()).toBeUndefined();
  });
});