'use strict'

const async = require('async')
const Base = require('bfx-facs-base')

class Senatus extends Base {
  constructor (caller, opts, ctx) {
    super(caller, opts, ctx)

    this.name = 'senatus'

    this.init()
  }

  _start (cb) {
    const cal = this.caller

    async.series([
      next => { super._start(next) },
      next => {
        cal.interval_0.add('process-cleanup', this.cleanup.bind(this), 180000)
        next()
      }
    ], cb)
  }

  getSenatusConf () {
    return this.caller.conf.senatus
  }

  getType () {
    return this.getSenatusConf().type
  }

  cleanup () {
    if (this._processCleanup) return
    this._processCleanup = true

    const cal = this.caller

    async.series([
      next => {
        if (!cal._cleanupHook0) return next()
        cal._cleanupHook0(next)
      }
    ], (err) => {
      if (err) console.error(err)
      this._processCleanup = false
    })
  }
}

module.exports = Senatus
