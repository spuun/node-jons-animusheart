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

  wrap(api) {
    this.api = api
    return this
  }

  makeFilename(value) {
    const hash = crypto.createHash('sha256')
    hash.update(value)
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

  isStillValid(mtime) {
    if (this.options.ttl < 1) {
      return true
    }
    const diff = Date.now() - mtime
    return (diff / 1000) < this.options.ttl
  }

  async httpGet(url) {
    return new Promise(async (resolve, reject) => {
      const cacheFile = this.makeFilename(url)
      if (await fs.stat(cacheFile).then(stat => this.isStillValid(stat.mtimeMs)).catch(_ => false)) {
        this.logger.debug(`Cache hit for ${url}`)
        return resolve(JSON.parse(await fs.readFile(cacheFile).catch(_ => reject('Failed to read cache: ' + e))))
      }
      const data = await this.api.httpGet(url)
      this.logger.debug(`Writing cache for ${url}`)
      await fs.writeFile(cacheFile, JSON.stringify(data))
      resolve(data)
    })
  }
}

module.exports = FileCache
