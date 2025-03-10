# TalkOps Extension: Jeedom
![Docker Pulls](https://img.shields.io/docker/pulls/bierdok/talkops-extension-jeedom)

A TalkOps Extension made to work with [TalkOps](https://link.talkops.app/talkops).

This Extension based on [Jeedom](https://jeedom.com/) allows you to **control your smart home by voice in realtime**.

Features:
* Lights: Check status, turn on/off
* Shutters: Check status, open, close and stop

## Installation Guide

_[TalkOps](https://link.talkops.app/install-talkops) must be installed beforehand._

* Open Jeedom from a web browser with admin permissions.
* Navigate to `Settings → System → Configuration`.
* Select the `APIs` tab and `Enabled` the API access related to API key.
* Copy the API key to setup the environment variable `API_KEY`.
* Install and enable the plugin [Virtual](https://market.jeedom.com/index.php?v=d&amp;p=market_display&amp;id=21) from the Jeedom Market.
* Create the virtual equipments with the basic templates `Lumière` and `Volet`.
* Map the virtual equipments states on real equipments.

## Integration Guide

Add the service and setup the environment variables if needed:

_compose.yml_
``` yml
name: talkops

services:
...
  talkops-extension-jeedom:
    image: bierdok/talkops-extension-jeedom
    environment:
      BASE_URL: [your-value]
      API_KEY: [your-value]
    restart: unless-stopped


```

## Environment Variables

#### BASE_URL

The base URL of your Jeedom server.
* Possible values: `http://jeedom` `https://jeedom.mydomain.net`

#### API_KEY

The copied API key.

#### AGENT_URLS

A comma-separated list of WebSocket server URLs for real-time communication with specified agents.
* Default value: `ws://talkops`
* Possible values: `ws://talkops1` `ws://talkops2`
