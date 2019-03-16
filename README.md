[![Build Status](https://travis-ci.com/moortens/yoil.svg?branch=master)]
# yoil - yet another irc lib...  

yoil is a simple IRC library written using the latest available ES6 features in node.js 
and attempts to use as few packages as possible. 


IRCv3 support:

- CAP
- CAP 302
- cap-notify
- account-notify
- account-tag
- away-notify
- batch
- chghost
- echo-message
- extended-join
- invite-notify
- message-tags 

uses semver 

TODO before 0.1.0 release:
* WRITE tests
* CAP list
* Monitor 
* TAGMSG
* STS
* auto reconnect
* WebIRC
* chghost
* chgname(?)
* draft/labeled-response + echo-message
* channel stuff: 
  * Mode parse
  * PART
  * TOPIC
  * MODE
  * NAMES
  * QUIT
* LIST
* AWAY
* Command shorthands
  * join,part,topic,reply,...