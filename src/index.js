const fs = require('fs')
const _ = require('lodash')
const util = require('util')

String.prototype.parse = function () {
  return this.split(' ').map(Number)
}

/*
5 2 4 3 100       5 videos, 2 endpoints, 4 request descriptions, 3 caches 100MB each.
50 50 80 30 110   Videos 0, 1, 2, 3, 4 have sizes 50MB, 50MB, 80MB, 30MB, 110MB.

1000 3            Endpoint 0 has 1000ms datacenter latency and is connected to 3 caches:
0 100             The latency (of endpoint 0) to cache 0 is 100ms.
2 200             The latency (of endpoint 0) to cache 2 is 200ms.
1 300             The latency (of endpoint 0) to cache 1 is 200ms.

500 0             Endpoint 1 has 500ms datacenter latency and is not connected to a cache.

3 0 1500          1500 requests for video 3 coming from endpoint 0.
0 1 1000          1000 requests for video 0 coming from endpoint 1.
4 0 500           500 requests for video 4 coming from endpoint 0.
1 0 1000          1000 requests for video 1 coming from endpoint 0.
*/

const parsing = file => {
  const raw = fs.readFileSync(file, 'utf8').split('\n')
  const [videosNb, endpointsNb, requestDesc, cachesNb, cacheSize] = raw[0].parse()
  const videosMB = raw[1].parse()
  const parsedData = {
    meta: [],
    actions: [],
  }

  let data = raw.slice(2)

  _.times(endpointsNb, parentIndex => {
    const [dataCenterLatency, cachesNb] = data[0].parse()

    parsedData.meta.push({
      id: parentIndex,
      dataCenterLatency,
      caches: [],
    })
    data = data.slice(1)

    _.times(cachesNb, childIndex => {
      const [cacheIndex, endpointLatency] = data[0].parse()

      parsedData.meta[parentIndex].caches.push({
        to: cacheIndex,
        endpointLatency,
      })
      data = data.slice(1)
    })
  })

  data.forEach(line => {
    const [requests, forVideo, fromEnpoint] = line.parse()
    parsedData.actions.push({ requests, forVideo, fromEnpoint })
  })

  console.log(util.inspect(parsedData, false, null))
}

(() => {
  try {
    const script = __filename.split('/').slice(-1)[0]
    const file = process.argv[2]

    if (!file) throw new Error(`Usage: node ${script} file`)

    parsing(file)

  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
