const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const WebSocket = require('ws')
const functions = require('./functions')

const AnimusHeartApi = require('./animusheartapi')

class Device {
  constructor(heart, data) {
    this._heart = heart
    for (const prop in data) {
      this[prop] = data[prop]
    }
  }

  get id() {
    return this['UID']
  }

  get functions() {
    return new Promise(async (resolve, reject) => {
      if (this._funcs) {
        return resolve(this._funcs)
      }
      this._heart.getDeviceFunctions(this.id)
        .then(funcs => resolve(this._funcs = funcs))
        .catch(e => reject('Error fetching device functions: ' + e))
    })
  }
}

Device.Status = {
  removed: 1,
  offline: 2,
  online: 3,
  processing: 4,
  notInitialized: 5,
  notConfigured: 6
}

class AnimusHeart {
  constructor(ip, apikey, opts) {
    this.ip = ip
    this.apikey = apikey
    this.logger = opts.logger || console
    this._cache = opts.cache
    this._api = new AnimusHeartApi(ip, apikey, this.logger)
    if (this._cache) {
      this._api = this._cache.wrap(this._api)
    }
    this._eventStream = null
    this._eventSubscribers = []
  }

  async getDeviceFunctions(deviceId) {
    return await this._api.httpGet(`devices/${deviceId}/functions`)
 }

  get devices() {
    return new Promise(async (resolve, reject) => {
        const devices = await this._api.httpGet('devices').catch(e => reject('Error fetching device functions: ' + e))
      for (const id in devices) {
        devices[id] = new Device(this, devices[id].properties)
      }
      resolve(devices)
    })
  }

  _connectEventStream() {
    if (this._eventStream !== null) {
      return
    }
    const socket = new WebSocket(`ws://${this.ip}/heart/events`, 'AHauth')
    let pinger = null
    socket.onopen = _ => {
      this.logger.debug('ws open')
      socket.send(`Authorization: Bearer ${this.apikey}`)
      pinger = setInterval(s => s.ping(), 50*1000, socket)
    }
    socket.onclose = _ => {
      this.logger.debug("ws close")
      clearInterval(pinger)
    }
    socket.onerror = evt => {
      this.logger.error("ws error", evt.message)
    }
    socket.onmessage = async evt => {
      if (evt.data == 'authenticated') {
        this.logger.debug('ws authenticated')
        return;
      }
      const event = JSON.parse(evt.data)
      const [ deviceId, funcId ] = event.functionUID.split(':', 2)
      this.logger.debug('ws message from', event)
      this.logger.debug('ws deviceId', deviceId, 'funcId', funcId)
      const device = (await this.devices)[deviceId]
      this._eventSubscribers.forEach(callback => {
        callback.call(this, {
          device: device,
          data: event
        })
      })
    }
    this._eventStream = socket
  }

  subscribe(callback) {
    this._connectEventStream()
    this._eventSubscribers.push(callback)
  }
}

AnimusHeart.cache = {
  FileCache: require('./cache/filecache')
}

AnimusHeart.Function = {
  Types: ['light', 'temperature', 'flow', 'pressure', 'humidity', 'gas', 'smoke', 'door', 'window',
          'liquid', 'power', 'noisiness', 'rain', 'contact', 'fire', 'occupacy', 'water', 'motion',
          'heat', 'cold', 'sound'],
}

module.exports = AnimusHeart
