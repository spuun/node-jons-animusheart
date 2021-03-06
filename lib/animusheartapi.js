const http = require('http')
class AnimusHeartApi {
  constructor(ip, apikey, logger) {
    this.ip = ip
    this.apikey = apikey
    this.baseUrl = `http://${ip}/rest`
    this.logger = logger
  }

  async getDevices() {
    return this._httpGet('devices')
  }

  async getDevice(id) {
    return this._httpGet(`devices/${id}`)
  }

  async getDeviceFunctions(id) {
    return this._httpGet(`devices/${id}/functions`)
  }

  async _httpGet(url) {
    const headers = {
      'Authorization':  `Bearer ${this.apikey}`,
      'Content-Type': 'application/json'
    }
    const options = {
      headers
    }
    url = this.baseUrl + '/' + url.replace(/^\//,'')
    return new Promise((resolve, reject) => {
      console.debug(`http.get ${url}`)
      http.get(`${url}`, options, res => {
        res.setEncoding('utf-8')
        let data = ''
        res.on('error', err => reject(err))
        res.on('data', d => data += d)
        res.on('end', _ => {
          if (res.headers['content-type'] == 'application/json') {
            resolve(JSON.parse(data))
          } else {
            reject('api response has wrong content-type')
          }
        })
      })
    })
  }

  toJSON() {
    return `[AnimusHearthApi ${this.ip}]`
  }
}

module.exports = AnimusHeartApi
