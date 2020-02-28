const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const WebSocket = require('ws')
const FunctionData = require('./functiondata')

const AnimusHeartApi = require('./animusheartapi')
const Device = require('./device')


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
    this._eventStream = null
    this._eventSubscribers = []
    this._devices = null
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

  _connectEventStream() {
    if (this._eventStream !== null) {
      return
    }
    this.logger.info('[WS] Connecting…')
    const socket = new WebSocket(`ws://${this.ip}/heart/events`, 'AHauth')
    let pinger = null
    socket.on('open', _ => {
      this.logger.info('[WS] Connected! Authorizing…')
      socket.send(`Authorization: Bearer ${this.apikey}`)
      pinger = setInterval(s => s.ping(_ => this.logger.debug('[WS] Ping!')), 30*1000, socket)
    })
    socket.on('pong', _ => this.logger.debug('[WS] Pong!'))
    socket.on('close', evt => {
      this.logger.debug("[WS] Disconnected.", evt)
      clearInterval(pinger)
      this._eventStream = null
      setTimeout(_ => this._connectEventStream(), 3000)
    })
    socket.on('error', error => {
      this.logger.error("[WS] Error:", error)
    })
    socket.on('message', async data => {
      if (data == 'authenticated') {
        return this.logger.debug('[WS] Authorized!')
      }
      this.logger.debug('[WS] Recieved message:', data)
      const event = JSON.parse(data)
      const [ deviceId, funcId ] = event.functionUID.split(':', 2)
      const device = (await this.devices)[deviceId]
      const cls = (await device.functions)[`${deviceId}:${funcId}`].functionProperties.data.metadata.clazz.split('.').pop()
      this.logger.debug("[CLS]", cls)
      this._eventSubscribers.forEach(callback => {
        callback.call(this, {
          device: device,
          data: event
        })
      })
    })
    this._eventStream = socket
  }

  subscribe(callback) {
    this._connectEventStream()
    this._eventSubscribers.push(callback)
  }
}

AnimusHeart.Device = Device
AnimusHeart.Cache = {
  FileCache: require('./cache/filecache')
}

AnimusHeart.Function = {
  Types: ['light', 'temperature', 'flow', 'pressure', 'humidity', 'gas', 'smoke', 'door', 'window',
          'liquid', 'power', 'noisiness', 'rain', 'contact', 'fire', 'occupacy', 'water', 'motion',
          'heat', 'cold', 'sound'],
}

module.exports = AnimusHeart
