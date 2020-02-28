const crypto = require('crypto')
const path = require('path')
const fs = require('fs').promises

const defaultOptions = {
  ttl: 0
}

class FileCache {
  constructor(path, opts) {
    this.path = path
    this.options = Object.assign({}, defaultOptions, opts || {})
    this.logger = opts.logger || console
  }

  decorate(api) {
    let funcs = Object.getOwnPropertyNames(Object.getPrototypeOf(api))
    funcs = funcs.filter(f => f[0] != '_' && f != 'constructor')
    funcs.forEach(func => {
      this.logger.debug('[FILECACHE] Decorating', func)
      this[func] = function() {
        const funcProfile = `${func}(${[...arguments].join(', ')})`
        return new Promise(async (resolve, reject) => {
          const cacheFile = this._makeFilename(funcProfile)
          if (await fs.stat(cacheFile).then(stat => this._isStillValid(stat.mtimeMs)).catch(_ => false)) {
            this.logger.debug(`[FILECACHE] Cache hit for ${funcProfile}`)
            fs.readFile(cacheFile)
              .then(data => resolve(JSON.parse(data)))
              .catch(_ => reject('Failed to read cache: ' + e))
          } else {
            api[func].apply(api, arguments)
              .then(async data => {
                this.logger.debug(`[FILECACHE] Writing cache for ${funcProfile}`)
                await fs.writeFile(cacheFile, JSON.stringify(data))
                resolve(data)
              })
              .catch(reject)
          }
        })
      }
    })

    this.api = api
    return this
  }

  _makeFilename(key) {
    const hash = crypto.createHash('sha256')
    hash.update(key)
    return path.join(this.path, hash.digest('hex'))
  }

  async invalidate() {
    const dir = await fs.opendir(this.path);
    for await (const dirent of dir) {
      if (dirent.isFile() && dirent.name.length == 64) {
        await fs.unlink(path.join(this.path, dirent.name))
      }
    }
  }

  _isStillValid(mtime) {
    if (this.options.ttl < 1) {
      return true
    }
    const diff = Date.now() - mtime
    return (diff / 1000) < this.options.ttl
  }
}

module.exports = FileCache
