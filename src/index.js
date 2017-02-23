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
  const raw = fs.readFileSync(file, 'utf8').split('\n').slice(0, -1)
  const [videosNb, endpointsNb, requestDesc, cachesNb, cacheSize] = raw[0].parse()
  const parsedData = {
    meta: [],
    actions: [],
    videosNb, endpointsNb, requestDesc, cachesNb, cacheSize,
    videosListSizes: raw[1].parse()
  }

  let data = raw.slice(2)

  _.times(endpointsNb, parentIndex => {
    const [dataCenterLatency, cachesNb] = data[0].parse()
    data = data.slice(1)

    _.times(cachesNb, childIndex => {
      const [cacheIndex, endpointLatency] = data[0].parse()

      if (_.isUndefined(parsedData.meta[parentIndex])) {
        parsedData.meta[parentIndex] = []
      }

      parsedData.meta[parentIndex].push({
        endpointID: parentIndex,
        dataCenterLatency,
        cacheID: cacheIndex,
        endpointLatency,
      })
      data = data.slice(1)
    })
  })

  data.forEach((line, index) => {
    const [videoID, endpointID, requests] = line.parse()

    parsedData.actions.push({ requests, videoID, endpointID })
  })

  return parsedData
}

const sortByVideos = (actions, sizes) => {
  const results = []

  actions
    .sort((a, b) => a.videoID - b.videoID)
    .forEach(({ requests, videoID, endpointID }, index) => {
      if (_.isUndefined(results[videoID])) {
        results[videoID] = {
          size: sizes[videoID],
          totalRequests: 0,
          logs: [],
        }
      }
      results[videoID].logs.push({ endpointID, requests })
      results[videoID].totalRequests += requests
    })

  return results.sort((c, d) => c.totalRequests - d.totalRequests)
}

const sortByCache = ({ meta, actions }) => {
  const results = []

  _.flatten(meta)
    .sort((a, b) => a.cacheID - b.cacheID)
    .forEach(({ endpointID, dataCenterLatency, cacheID, endpointLatency }) => {
      if (_.isUndefined(results[cacheID])) {
        results[cacheID] = []
      }
      results[cacheID].push({ endpointID, endpointLatency })
    })

  results.forEach((byCache, index) => {
    results[index] = byCache.sort((c, d) => c.endpointLatency - d.endpointLatency)
  })

  return results
}

// const outputResults = (meta, sorted) => {
//   for (const { size, logs } of sorted) {
//     if (size)
//   }
// }

(() => {
  try {
    const script = __filename.split('/').slice(-1)[0]
    const file = process.argv[2]

    if (!file) throw new Error(`Usage: node ${script} file`)

    const parsedData = parsing(file)

    const sorted = sortByVideos(parsedData.actions, parsedData.videosListSizes)

    // outputResults(parsedData.meta, sorted)

    console.log(util.inspect(parsedData.meta, false, null))
    console.log(util.inspect(sorted, false, null))

  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
