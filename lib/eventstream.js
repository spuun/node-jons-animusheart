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
    socket.on('open', _ => {
      this.logger.info('[WS] Connected! Authorizing…')
      socket.send(`Authorization: Bearer ${this._heart.apikey}`)
      pinger = setInterval(s => s.ping(_ => this.logger.debug('[WS] Ping!')), 25*1000, socket)
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
