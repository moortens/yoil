const irc = require('../');

class Quotes {
  constructor(channel) {
    this.config = new irc.Config({
      host: '127.0.0.1',
      port: 6697,
      tls: true,
      nickname: 'quotes',
      username: 'quotes',
      realname: 'quotes',
    });
    this.channel = channel;

    this.client = new irc.Client(this.config);
    this.client.connect();
    this.quotes = [
      "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
      'There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is a miracle',
      "If you can't explain it to a six year old, you don't understand it yourself.",
      'Life is like riding a bicycle. To keep your balance, you must keep moving',
      'Anyone who has never made a mistake has never tried anything new.',
    ];

    this.client.on('registered', this.registered.bind(this));
    this.client.on('privmsg', this.message.bind(this));
    this.client.on('error', err => {
      console.log(err);
    });
  }

  registered() {
    this.client.join(this.channel);
  }

  random() {
    const quote = this.quotes[
      Math.floor(Math.random() * (this.quotes.length - 1))
    ];

    this.client.privmsg(this.channel, quote);
  }

  message(data) {
    const quoteRegex = /!quote/;
    if (quoteRegex.test(data.params[data.params.length - 1])) {
      this.random();
    }
  }
}

const q = new Quotes('#channel');

module.exports = q;
