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

  toJSON() {
    return {
      'id': this.id,
      'name': this.name
    }
  }

  toLog() {
    return this.toString()
  }

  toString() {
    return `[Device ${this.id} '${this.name}']`
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

module.exports = Device
