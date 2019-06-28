import pbkdf2 from 'pbkdf2';
import createHmac from 'create-hmac';
import createHash from 'create-hash';
import randomBytes from 'randombytes';
import timingSafeEqual from 'timing-safe-equal';
import { Buffer } from 'buffer';

import Base from './base';
import Event from '../event';
import Message from '../message';
import Client from '../client';

enum State {
  Uninitialized,
  Initializing,
  Challenge,
  Verify,
  Verified,
};

/**
 * fix sasl
 */
class Sasl extends Base {
  private username: string = null;
  private password: string = null;

  private state: State = State.Uninitialized;

  private attemptedSaslMechanisms: Set<string> = new Set();
  private negotiatingSaslMechanism: boolean = false;
  private preferedMechanisms: Set<string> = null;
  private mechanism: string = null;

  private scramAlgorithms: object = {
    'SCRAM-SHA-1': {
      method: 'sha1',
      length: 20,
    },
    'SCRAM-SHA-256': {
      method: 'sha256',
      length: 32,
    },
    'SCRAM-SHA-512': {
      method: 'sha512',
      length: 64,
    },
  };

  private nonce: string = null;
  private header: string = null;
  private saltedPassword: string = null;
  private authMessage: string = null;
  private serverSignature: string = null;

  constructor(client: Client) {
    super(client);

    this.preferedMechanisms = this.config.saslPreferedMechanisms;

    this.username = this.config.saslUsername;
    this.password = this.config.saslPassword;

    if (
      this.preferedMechanisms.has('EXTERNAL') ||
      (!this.username && !this.password)
    ) {
      return;
    }

    this.store.addDesiredCapability('sasl');

    this.addCommandListener('RPL_LOGGEDIN', this.loggedIn.bind(this));
    this.addCommandListener('RPL_LOGGEDOUT', this.loggedOut.bind(this));
    this.addCommandListener('RPL_SASLSUCCESS', this.saslSuccess.bind(this));
    this.addCommandListener('RPL_SASLMECHS', this.saslMechs.bind(this));

    this.addCommandListener('ERR_NICKLOCKED', this.errNickLocked.bind(this));
    this.addCommandListener('ERR_SASLFAIL', this.errSaslFail.bind(this));
    this.addCommandListener('ERR_SASLTOOLONG', this.errSaslTooLong.bind(this));
    this.addCommandListener('ERR_SASLABORTED', this.errSaslAborted.bind(this));
    this.addCommandListener('ERR_SASLALREADY', this.errSaslAlready.bind(this));
    this.addCommandListener('AUTHENTICATE', this.authenticate.bind(this));

    this.state = State.Initializing;
  }

  loggedIn(data: Message) {
    const {
      params: [, , account],
    } = data;
    this.emit(
      'sasl::account',
      new Event(
        {
          account,
        },
        data,
      ),
    );
  }

  loggedOut(data: Message) {
    this.emit(
      'sasl::account',
      new Event(
        {
          account: null,
        },
        data,
      ),
    );
  }

  saslSuccess() {
    this.send(new Message('CAP', 'END'));
  }

  saslMechs(data: Message) {
    const [, mechanisms] = data.params;
    const v = mechanisms.split(',');

    // apperantly we requested an unsupported mechanism
    const availableSaslMechanisms = v.filter(m =>
      Array.from(this.preferedMechanisms).includes(m),
    );

    if (availableSaslMechanisms.length > 0) {
      while (availableSaslMechanisms.length > 0) {
        const attemptSaslMechanism = availableSaslMechanisms.shift();
        if (!this.attemptedSaslMechanisms.has(attemptSaslMechanism)) {
          this.store.set('saslMechanism', attemptSaslMechanism);

          // indicates that we are still trying to negotiate a common sasl
          // platform.
          this.negotiatingSaslMechanism = true;

          return this.send(new Message('AUTHENTICATE', attemptSaslMechanism));
        }
      }
    } else {
      this.emit(
        'sasl::error',
        new Event(
          {
            message: `No supported SASL mechanisms, server only lists ${mechanisms}`,
          },
          data,
        ),
      );
      return this.send(new Message('CAP', 'END'));
    }
    return null;
  }

  errNickLocked(data: Message) {
    this.emit(
      'sasl::account',
      new Event(
        {
          account: null,
          error:
            'SASL authentication failed because the account is currently disabled',
        },
        data,
      ),
    );

    if (this.config.saslDisconnectOnFailure) {
      this.client.close();
    } else {
      this.send(new Message('CAP', 'END'));
    }
  }

  errSaslFail() {
    if (this.negotiatingSaslMechanism) {
      return;
    }

    if (this.config.saslDisconnectOnFailure) {
      this.client.close();
    } else {
      this.send(new Message('CAP', 'END'));
    }
  }

  errSaslTooLong(data: Message) {
    this.emit(
      'sasl::error',
      new Event(
        {
          message: 'SASL too long!',
        },
        data,
      ),
    );

    if (this.config.saslDisconnectOnFailure) {
      this.client.close();
    } else {
      this.send(new Message('CAP', 'END'));
    }
  }

  errSaslAborted() {
    if (this.config.saslDisconnectOnFailure) {
      this.client.close();
    } else {
      this.send(new Message('CAP', 'END'));
    }
  }

  errSaslAlready(data: Message) {
    this.emit(
      'sasl::error',
      new Event(
        {
          message: 'SASL already authenticated',
        },
        data,
      ),
    );
  }

  static createNonce() {
    return randomBytes(32).toString('hex');
  }

  createHmac(key: string, data: string) {
    return createHmac(this.scramAlgorithms[this.mechanism].method, key)
      .update(data)
      .digest();
  }

  createHash(data: string) {
    return createHash(this.scramAlgorithms[this.mechanism].method)
      .update(data)
      .digest();
  }

  createPbkdf2(salt: Buffer, iterations: number) {
    return pbkdf2.pbkdf2Sync(
      this.password,
      salt,
      iterations,
      this.scramAlgorithms[this.mechanism].length,
      this.scramAlgorithms[this.mechanism].method,
    );
  }

  static xor(a: any, b: any) {
    let left: any = a;
    let right: any = b;

    if (!Buffer.isBuffer(left)) left = Buffer.from(left);
    if (!Buffer.isBuffer(right)) right = Buffer.from(right);
    const length = Math.max(left.length, right.length);
    const res = [];

    for (let i = 0; i < length; i += 1) {
      /* eslint no-bitwise: [2, { allow: ["^"] }] */
      res.push(left[i] ^ right[i]);
    }

    return Buffer.from(res).toString('base64');
  }

  scramInitialChallenge() {
    this.state = State.Challenge;
    this.nonce = Sasl.createNonce();
    this.header = Buffer.from(`n,,n=${this.username},r=${this.nonce}`).toString(
      'base64',
    );
    return this.header;
  }

  static scramTokenizePayload(data) {
    return new Map<string, string>(
      data.split(',').map(p => {
        const [, y, z] = p.match(/^([^=]*)=(.*)$/);
        return [y, z];
      }),
    );
  }

  scramBuildChallenge(data: Message) {
    const payload = Sasl.scramTokenizePayload(
      Buffer.from(data.params[0], 'base64').toString(),
    );

    if (payload.has('e')) {
      const error = payload.get('e');

      this.emit('sasl::error', {
        error,
        mechanism: this.mechanism,
      });

      return '*';
    }

    const iterations = parseInt(payload.get('i'), 10);
    const salt = payload.get('s');
    const nonce = payload.get('r');

    const withoutProof = `c=biws,r=${nonce}`;

    this.saltedPassword = this.createPbkdf2(
      Buffer.from(salt, 'base64'),
      iterations,
    );
    const clientKey = this.createHmac(this.saltedPassword, 'Client Key');
    const serverKey = this.createHmac(this.saltedPassword, 'Server Key');
    const storedKey = this.createHash(clientKey);

    this.authMessage = [
      `n=${this.username},r=${this.nonce}`,
      Buffer.from(data.params[0], 'base64').toString(),
      withoutProof,
    ].join(',');

    const clientSignature = this.createHmac(storedKey, this.authMessage);
    const serverSignature = this.createHmac(serverKey, this.authMessage);
    const clientXor = Sasl.xor(clientKey, clientSignature);
    const clientProof = `p=${clientXor}`;

    const clientFinal = [withoutProof, clientProof].join(',');

    this.serverSignature = serverSignature;
    this.state = State.Verify;

    return Buffer.from(clientFinal).toString('base64');
  }

  scramVerifySignature(data: Message) {
    const payload = Sasl.scramTokenizePayload(
      Buffer.from(data.params[0], 'base64').toString(),
    );

    if (payload.has('e')) {
      const error = payload.get('e');

      this.emit('sasl::error', {
        error,
        mechanism: this.mechanism,
      });

      return '*';
    }

    const verify = Buffer.from(payload.get('v'), 'base64');

    if (timingSafeEqual(Buffer.from(this.serverSignature), verify)) {
      return true;
    }
    return false;
  }

  authenticate(data: Message) {
    const [value] = data.params;
    this.mechanism = this.store.get('saslMechanism');

    if (!this.attemptedSaslMechanisms.has(this.mechanism)) {
      this.attemptedSaslMechanisms.add(this.mechanism);
    }

    if (value.charCodeAt(0) === 43 && value.length === 1) {
      this.negotiatingSaslMechanism = false;

      if (this.mechanism === 'PLAIN') {
        const challenge = Buffer.from(
          `${this.username}\0${this.username}\0${this.password}`,
          'utf8',
        ).toString('base64');
        this.send(new Message('AUTHENTICATE', challenge));
      } else if (this.mechanism === 'EXTERNAL') {
        this.send('AUTHENTICATE +');
      } else if (this.mechanism.startsWith('SCRAM-SHA')) {
        if (this.state === State.Initializing) {
          const initialChallenge = this.scramInitialChallenge();
          this.send(new Message('AUTHENTICATE', initialChallenge));
        }
      }
    } else if (this.mechanism.startsWith('SCRAM-SHA')) {
      if (this.state === State.Challenge) {
        const challengeResponse = this.scramBuildChallenge(data);
        this.send(new Message('AUTHENTICATE', challengeResponse));
      } else if (this.state === State.Verify) {
        if (this.scramVerifySignature(data)) {
          this.send(new Message('AUTHENTICATE', '+'));
        } else {
          this.send(new Message('AUTHENTICATE', '*'));
        }
      }
    } else {
      // unknown mechanism
      this.send(new Message('AUTHENTICATE', '*'));
    }
  }
}

export default Sasl;
