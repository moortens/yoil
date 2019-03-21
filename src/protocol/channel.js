const Base = require('./base');
const Event = require('../event');

class Channel extends Base {
  constructor(client) {
    super(client);

    this.store.addDesiredCapability('userhost-in-names');
    this.store.addDesiredCapability('extended-join');
    this.store.addDesiredCapability('multi-prefix');

    this.addCommandListener('JOIN', this.join.bind(this));
    this.addCommandListener('PART', this.part.bind(this));
    this.addCommandListener('QUIT', this.quit.bind(this));
    this.addCommandListener('KICK', this.kick.bind(this));
    this.addCommandListener('TOPIC', this.topic.bind(this));
    this.addCommandListener('INVITE', this.invite.bind(this));
    this.addCommandListener('MODE', this.mode.bind(this));

    this.addCommandListener('RPL_TOPIC', this.topic.bind(this));
    this.addCommandListener('RPL_TOPICWHOTIME', this.topicWhoTime.bind(this));
    this.addCommandListener('RPL_NAMREPLY', this.names.bind(this));
    this.addCommandListener('RPL_ENDOFNAMES', this.userlist.bind(this));

    this.addCommandListener('ERR_NEEDMOREPARAMS', this.error.bind(this));
    this.addCommandListener('ERR_NOSUCHCHANNEL', this.error.bind(this));
    this.addCommandListener('ERR_TOOMANYCHANNELS', this.error.bind(this));
    this.addCommandListener('ERR_BADCHANNELKEY', this.error.bind(this));
    this.addCommandListener('ERR_BANNEDFROMCHAN', this.error.bind(this));
    this.addCommandListener('ERR_CHANNELISFULL', this.error.bind(this));
    this.addCommandListener('ERR_INVITEONLYCHAN', this.error.bind(this));
    this.addCommandListener('ERR_CANNOTSENDTOCHAN', this.error.bind(this));
    this.addCommandListener('ERR_NOTONCHANNEL', this.error.bind(this));
    this.addCommandListener('ERR_USERONCHANNEL', this.error.bind(this));
    this.addCommandListener('ERR_CHANOPRIVSNEEDED', this.error.bind(this));

    this.channelMembersCache = new Map();
    this.channelTopicCache = new Map();
  }

  addChannelMember(channel, user) {
    const members = this.channelMembersCache.get(channel) || new Set();

    members.add(user);

    this.channelMembersCache.set(channel, members);
  }

  getChannelMembers(channel) {
    return this.channelMembersCache.get(channel) || new Set();
  }

  join(data) {
    const { nick, ident, hostname, params } = data;
    const [channel, account = null, realname = null] = params;

    this.emit(
      'join',
      new Event(
        {
          nick,
          ident,
          hostname,
          channel,
          account,
          realname,
        },
        data,
      ),
    );
  }

  topicWhoTime(data) {
    const {
      params: [, channel, userhost, time],
    } = data;
    const topic = this.channelTopicCache.get(channel);

    const { nick, ident, hostname } = Base.parseUserHost(userhost);

    this.emit(
      'topic',
      new Event(
        {
          topic,
          channel,
          nick,
          ident,
          hostname,
          time,
        },
        data,
      ),
    );
  }

  topic(data) {
    const { nick, ident, hostname, command, params } = data;
    if (command === 'RPL_TOPIC') {
      const [, channel, topic] = params;

      this.channelTopicCache.set(channel, topic);
      return;
    }

    const [channel, topic] = params;

    this.emit(
      'topic',
      new Event(
        {
          nick,
          ident,
          hostname,
          channel,
          topic,
        },
        data,
      ),
    );
  }

  // todo: make it pretty
  names(data) {
    const members = data.params[data.params.length - 1].split(' ');
    members.forEach(u => {
      const [user, modes] = Base.parseModeInUserhost(u);
      this.addChannelMember(data.params[2], {
        ...Base.parseUserHost(user),
        modes,
      });
    });
  }

  userlist(data) {
    const [, channel] = data.params;
    this.emit(
      'members',
      new Event(
        {
          channel,
          members: this.getChannelMembers(data.params[1]),
        },
        data,
      ),
    );
  }

  quit(data) {
    const {
      nick,
      ident,
      hostname,
      params: [reason],
    } = data;
    this.emit(
      'quit',
      new Event(
        {
          nick,
          ident,
          hostname,
          reason,
        },
        data,
      ),
    );
  }

  invite(data) {
    const {
      nick,
      ident,
      hostname,
      params: [target, channel],
    } = data;
    this.emit(
      'invite',
      new Event(
        {
          nick,
          ident,
          hostname,
          target,
          channel,
        },
        data,
      ),
    );
  }

  part(data) {
    const {
      nick,
      ident,
      hostname,
      params: [channel, reason],
    } = data;
    this.emit(
      'part',
      new Event(
        {
          nick,
          ident,
          hostname,
          channel,
          reason,
        },
        data,
      ),
    );
  }

  kick(data) {
    const { nick, ident, hostname, params } = data;
    const [channel, target, reason] = params;

    this.emit(
      'kick',
      new Event(
        {
          nick,
          ident,
          hostname,
          channel,
          target,
          reason,
        },
        data,
      ),
    );
  }

  /*
  {
    "added": [
      {mode: 'k', param: 'cow'},
      {mode: 'o', param: 'moocow'}
    ],
    "removed": [
      {mode: 'i'},
      {mode: 'b', param: '*!*@example.org'},
    ]
  }
  */
  mode(data) {
    const [target, modes, ...params] = data.params;

    if (!this.isChannel(target)) {
      return;
    }

    const types = this.store
      .getAdvertisedFeature('chanmodes')
      .map(m => m.split(''));
    const typeHasParameter = [].concat(...types.slice(0, 3));

    const res = new Event(
      {
        target,
      },
      data,
    );

    let direction = null;
    modes.split('').forEach(mode => {
      if (mode.charCodeAt(0) === 43) {
        direction = 'add';
      } else if (mode.charCodeAt(0) === 45) {
        direction = 'remove';
      } else {
        if (direction === null) {
          return;
        }

        if (typeHasParameter.includes(mode)) {
          res[direction] = [].concat(res[direction] || [], [
            {
              mode,
              param: params.shift(),
            },
          ]);
          return;
        }

        res[direction] = [].concat(res[direction] || [], [{ mode }]);
      }
    });

    this.emit('mode', res);
  }

  error(data) {
    const {
      params: [, channel, message],
    } = data;

    this.emit(
      'error',
      new Event(
        {
          channel,
          message,
        },
        data,
      ),
    );
  }
}

module.exports = Channel;
