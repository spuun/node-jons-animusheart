const WebSocket = require('ws')

class EventStream {
  constructor(heart, opts) {
    opts = opts || {}
    this.logger = opts.logger || console
    this._heart = heart
    this._eventStream = null
    this._eventSubscribers = []
  }

  _connectEventStream() {
    if (this._eventStream !== null) {
      return
    }
    let pinger = null
    let isAlive = false

    this.logger.info('[WS] Connecting…')
    const socket = new WebSocket(`ws://${this._heart.ip}/heart/events`, 'AHauth')

    const pingTimeout = s => {
      this.logger.warn("[WS] Ping timeout!")
      s.terminate()
    } 
    const ping = _ => {
      if (!isAlive) {
        return pingTimeout(s)
      }
      socket.ping(_ => this.logger.debug('[WS] Ping!'))
      isAlive = false
      pinger = setTimeout(ping, 25*1000)
    }

    socket.on('open', _ => {
      this.logger.info('[WS] Connected!')
      this.logger.info('[WS] Authorizing…')
      socket.send(`Authorization: Bearer ${this._heart.apikey}`)
    })
    socket.on('pong', _ => {
      this.logger.debug('[WS] Pong!')
      isAlive = true
    })
    socket.on('close', evt => {
      this.logger.info("[WS] Disconnected.", evt)
      clearTimeout(pingTimeout)
      clearTimeout(pinger)
      this._eventStream = null
      setTimeout(_ => this._connectEventStream(), 3000)
    })
    socket.on('error', error => {
      this.logger.error("[WS] Error:", error)
    })
    socket.on('message', async data => {
      if (data == 'authenticated') {
        this.logger.info('[WS] Authorized!')
        isAlive = true
        ping()
        return
      }
      this.logger.debug('[WS] Recieved message:', data)
      const event = JSON.parse(data)
      const [ deviceId, funcId ] = event.functionUID.split(':', 2)
      const device = (await this._heart.devices)[deviceId]
      if (!device) {
        this.logger.warn("[WS] No matching device for message", event)
        return
      }
      const functions = await device.functions
      const cls = functions[`${deviceId}:${funcId}`].functionProperties.data.metadata.clazz.split('.').pop()
      //this.logger.debug("[CLS]", cls)
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
  toJSON() {
    return `[AnimusHeart.EventStream ${this._heart.ip}`
  }
}

module.exports = EventStream
