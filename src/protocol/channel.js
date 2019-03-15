const Base = require('./base');

class Channel extends Base {
  constructor(client) {
    super(client);

    this.store.addDesiredCapability('userhost-in-names');
    this.store.addDesiredCapability('extended-join');
    this.store.addDesiredCapability('multi-prefix');
    

    this.addCommandListener('JOIN', this.join.bind(this));
    this.addCommandListener('PART', this.join.bind(this));
    this.addCommandListener('QUIT', this.join.bind(this));
    this.addCommandListener('KICK', this.join.bind(this));
    this.addCommandListener('TOPIC', this.join.bind(this));
    this.addCommandListener('INVITE', this.join.bind(this));
    this.addCommandListener('ERR_NEEDMOREPARAMS', this.topic.bind(this));
    this.addCommandListener('ERR_NOSUCHCHANNEL', this.topic.bind(this));
    this.addCommandListener('ERR_TOOMANYCHANNELS', this.topic.bind(this));
    this.addCommandListener('ERR_BADCHANNELKEY', this.topic.bind(this));
    this.addCommandListener('ERR_BANNEDFROMCHAN', this.topic.bind(this));
    this.addCommandListener('ERR_CHANNELISFULL', this.topic.bind(this));
    this.addCommandListener('ERR_INVITEONLYCHAN', this.topic.bind(this));
    this.addCommandListener('RPL_TOPIC', this.topic.bind(this));
    this.addCommandListener('RPL_NAMREPLY', this.names.bind(this));
    this.addCommandListener('RPL_ENDOFNAMES', this.userlist.bind(this));
  
    this.channel = new Map();
  }

  addChannelMember(channel, user) {
    const members = this.channel.get(channel) || new Set();

    members.add(user);

    this.channel.set(channel, members);
  }

  getChannelMembers(channel) {
    return this.channel.get(channel) || new Set();
  }

  join(data) {
    const { params } = data;
    const [channel, account = null, realname = null] = params;

    this.emit('join', {
      ...data,
      channel,
      account,
      realname,
    });
  }

  topic(data) {
    
  }

  names(data) {
    const members = data.params[data.params.length - 1].split(' ');
    members.forEach((u) => {
      const [user, modes] = Base.parseModeInUserhost(u);
      const usr = {};
      usr.user = user;
      usr.modes = modes;
      this.addChannelMember(data.params[2], usr);
    });
  }

  userlist(data) {
    //console.log(this.getChannelMembers(data.params[1]));
  }
}

module.exports = Channel;
