
const DEBUG = true

const log = (...message: Parameters<typeof console.log>) => {
  if (DEBUG) console.log(...message)
}

const logServices = { log }

export default logServices

