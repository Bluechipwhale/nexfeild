// DirectAdmin and Passenger commonly require a CommonJS startup file.
const path = require('node:path')

require('dotenv').config({ path: path.join(__dirname, '.env') })
process.env.NODE_ENV ||= 'production'

import('./server.js').catch((error) => {
  console.error('NexFieldForce could not start. Check the private application log.')
  console.error(error?.message || error)
  process.exitCode = 1
})
