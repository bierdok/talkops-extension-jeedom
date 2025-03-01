# TalkOps Extension: Boilerplate NodeJS

A TalkOps Extension made to work with [TalkOps](https://link.talkops.app/talkops).

This Extension serves as a boilerplate designed to assist Node.js developers in effortlessly creating and integrating their own extensions.

## Installation Guide

_[TalkOps](https://link.talkops.app/install-talkops) must be installed beforehand._


## Integration Guide

Add the service and setup the environment variables if needed:

_compose.yml_
``` yml
name: talkops

services:
...
  talkops-extension-boilerplate-nodejs:
    image: ghcr.io/talkops/talkops-boilerplate-nodejs
    restart: unless-stopped
```

## Environment Variables

#### AGENT_URLS

A comma-separated list of WebSocket server URLs for real-time communication with specified agents.
* Default value: `ws://talkops`
* Possible values: `ws://talkops1` `ws://talkops2`
