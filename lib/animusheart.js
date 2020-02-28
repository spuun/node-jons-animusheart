const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const FunctionData = require('./functiondata')
const AnimusHeartApi = require('./animusheartapi')
const Device = require('./device')
const EventStream = require('./eventstream')

class AnimusHeart {
  constructor(ip, apikey, opts) {
    this.ip = ip
    this.apikey = apikey
    this.logger = opts.logger || console
    this._cache = opts.cache
    this._api = new AnimusHeartApi(ip, apikey, this.logger)
    if (this._cache) {
      this._api = this._cache.decorate(this._api)
    }
    this._devices = null
    this._eventStream = new EventStream(this, { logger: this.logger })
  }

  get events() {
    return this._eventStream
  }

  async getDeviceFunctions(deviceId) {
    return await this._api.getDeviceFunctions(deviceId)
  }

  get devices() {
    return new Promise(async (resolve, reject) => {
      if (this._devices !== null) {
        return resolve(this._devices)
      }
      const devices = await this._api.getDevices().catch(e => reject('Error fetching device functions: ' + e))
      for (const id in devices) {
        devices[id] = new Device(this, devices[id].properties)
      }
      resolve(this._devices = devices)
    })
  }
}

AnimusHeart.Cache = {
  FileCache: require('./cache/filecache')
}

AnimusHeart.Function = {
  Types: ['light', 'temperature', 'flow', 'pressure', 'humidity', 'gas', 'smoke', 'door', 'window',
          'liquid', 'power', 'noisiness', 'rain', 'contact', 'fire', 'occupacy', 'water', 'motion',
          'heat', 'cold', 'sound'],
}

module.exports = AnimusHeart
