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
    this.logger.info('[WS] Connecting…')
    const socket = new WebSocket(`ws://${this._heart.ip}/heart/events`, 'AHauth')
    let pinger = null
    let isAlive = false

    const pingTimeout = s => {
      this.logger.warn("[WS] Ping timeout")
      let forceClose = setTimeout(s => s.terminate(), 3000, s)
      s.close()
      clearTimeout(forceClose)
    } 
    const ping = s => {
      if (!isAlive) {
        return pingTimeout(s)
      }
      pinger = setTimeout(ping, 25*1000, s)
      this.logger.debug("[WS] Ping!")
      s.ping()
      isAlive = false
    }

    socket.on('open', _ => {
      this.logger.info('[WS] Connected! Authorizing…')
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
        isAlive = true
        this.logger.info('[WS] Authorized!')
        ping(socket)
        return
      }
      this.logger.debug('[WS] Recieved message:', data)
      const event = JSON.parse(data)
      const [ deviceId, funcId ] = event.functionUID.split(':', 2)
      const device = (await this._heart.devices)[deviceId]
      const cls = (await device.functions)[`${deviceId}:${funcId}`].functionProperties.data.metadata.clazz.split('.').pop()
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
}

module.exports = EventStream
