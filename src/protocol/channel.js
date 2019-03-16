const Base = require('./base');

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
    this.addCommandListener('ERR_NEEDMOREPARAMS', this.topic.bind(this));
    this.addCommandListener('ERR_NOSUCHCHANNEL', this.topic.bind(this));
    this.addCommandListener('ERR_TOOMANYCHANNELS', this.topic.bind(this));
    this.addCommandListener('ERR_BADCHANNELKEY', this.topic.bind(this));
    this.addCommandListener('ERR_BANNEDFROMCHAN', this.topic.bind(this));
    this.addCommandListener('ERR_CHANNELISFULL', this.topic.bind(this));
    this.addCommandListener('ERR_INVITEONLYCHAN', this.topic.bind(this));
    this.addCommandListener('RPL_TOPIC', this.topic.bind(this));
    this.addCommandListener('RPL_TOPICWHOTIME', this.topicWhoTime.bind(this));
    this.addCommandListener('RPL_NAMREPLY', this.names.bind(this));
    this.addCommandListener('RPL_ENDOFNAMES', this.userlist.bind(this));

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

  join({ nick, ident, hostname, params }) {
    const [channel, account = null, realname = null] = params;

    this.emit('join', {
      nick,
      ident,
      hostname,
      channel,
      account,
      realname,
    });
  }

  topicWhoTime({ params: [, channel, userhost, time] }) {
    const topic = this.channelTopicCache.get(channel);

    const { nick, ident, hostname } = Base.parseUserHost(userhost);

    this.emit('topic', {
      topic,
      channel,
      nick,
      ident,
      hostname,
      time,
    });
  }

  topic({ nick, ident, hostname, command, params }) {
    if (command === 'RPL_TOPIC') {
      const [, channel, topic] = params;

      this.channelTopicCache.set(channel, topic);
      return;
    }

    const [channel, topic] = params;

    this.emit('topic', {
      nick,
      ident,
      hostname,
      channel,
      topic,
    });
  }

  // todo: make it pretty
  names(data) {
    console.log(data);
    const members = data.params[data.params.length - 1].split(' ');
    members.forEach(u => {
      const [user, modes] = Base.parseModeInUserhost(u);
      const usr = {};
      usr.user = user;
      usr.modes = modes;
      this.addChannelMember(data.params[2], usr);
    });
  }

  userlist(data) {
    this.emit('members', {
      channel: data.params[1],
      members: this.getChannelMembers(data.params[1]),
    });
  }

  quit({ nick, ident, hostname, params: [reason] }) {
    this.emit('quit', {
      nick,
      ident,
      hostname,
      reason,
    });
  }

  invite({ nick, ident, hostname, params: [target, channel] }) {
    this.emit('invite', {
      nick,
      ident,
      hostname,
      target,
      channel,
    });
  }

  part({ nick, ident, hostname, params: [channel, reason] }) {
    this.emit('part', {
      nick,
      ident,
      hostname,
      channel,
      reason,
    });
  }

  kick({ nick, ident, hostname, params }) {
    const [channel, target, reason] = params;

    this.emit('kick', {
      nick,
      ident,
      hostname,
      channel,
      target,
      reason,
    });
  }
}

module.exports = Channel;
