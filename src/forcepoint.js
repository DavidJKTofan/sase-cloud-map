export async function getForcepoint(env) {
  // Custom Headers
  let headers = new Headers({
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Cookie:
      'renderCtx=%7B%22pageId%22%3A%225a55e74f-8399-43aa-9215-cee67b51eb8f%22%2C%22schema%22%3A%22Published%22%2C%22viewType%22%3A%22Published%22%2C%22brandingSetId%22%3A%22c4d762d7-c9cb-4a0c-8f63-6fc56ffcd40a%22%2C%22audienceIds%22%3A%226Au1G0000008OoW%2C6Au1G0000008OoR%22%7D; CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1; AceAccess=PYjoeWCD2nfPXmeKwd+DQqPjQ6ReUN6zZJswxkF6erei+a3XzGu/R3+zstpLd51dMRKu4BuYb4Y/NlxeghfKJ+5s4GWILxf8TGT14FW5+tT60yFeqVoDJn+zqA7OgCJmknm4z0Le0ysKbQDBOnwlZMACPoQARXZpQmjDOW2t/I4/cgogbD5KlyclZvX5I/X6vvQuOnRlwtRKFBbC4cqryPk0c0Z/qO2azeLK1ckdYwdoeEwB8gdyHJvglUnW3/e/i6r5uGhs/lJWb/W+tcSP4rFyyAHitNV9QGfERuLAS8HYdbaFney+8ZxrOfO7U38r/hNhS7B5ufM=; isCustomer=true; pctrk=a3d6961f-1c77-45f0-b2fd-41f13c8a4c1c; sfdc-stream=!cQuO0XzqiOq5Q8l69JoNPqSZAlCRpXk5a46tdRqlIUC7hqkZvfwHQ4NLqGpwjt8UEm4CXMoS177yQ3o=',
    Host: 'support.forcepoint.com',
    Origin: 'https://support.forcepoint.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'sec-ch-ua-platform': 'macOS',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
    Referer: 'https://support.forcepoint.com/s/article/Cloud-service-data-center-IP-addresses-port-numbers',
    DNT: '1',
    Accept: '*/*',
  })
  const payload = env.FORCEPOINT_PAYLOAD
  // Fetch the page
  const forcepointRanges = env.FORCEPOINT_LOCATIONS
  const response = await fetch(forcepointRanges, {
    headers: headers,
    method: 'POST', // request the data
    body: payload,
  })
  const json = await response.json()
  // Filter JSON
  const text = String(
    json.context.globalValueProviders[1].values.records.ka21G000000g0FzQAI.Knowledge__kav.record.fields.Knowledge_Article_Resolution__c
      .value,
  )

  // Regex
  const regex = /<table[^>]*>\s*(<thead>.*?<\/thead>)?\s*<tbody>(.*?)<\/tbody>\s*<\/table>/g
  const itmatches = text.match(regex)[1]

  const regexTable = /<table[^>]*>(.*?)<\/table>/s
  const tableMatch = itmatches.match(regexTable)

  const regexRow = /<tr[^>]*>(.*?)<\/tr>/gs
  const rowsMatch = tableMatch[1].match(regexRow)

  const data = []
  const regexColumns = /<t[dh][^>]*>(.*?)<\/t[dh]>/gs

  for (const row of rowsMatch) {
    const columnsMatch = row.match(regexColumns)
    const country = columnsMatch[0].match(/<[^>]*>(.*?)<\/[^>]*>/)[1]
    const city = columnsMatch[1].match(/<[^>]*>(.*?)<\/[^>]*>/)[1]
    const dataCenter = columnsMatch[2].match(/<[^>]*>(.*?)<\/[^>]*>/)[1]
    const ipSpace = columnsMatch[3].match(/<[^>]*>(.*?)<\/[^>]*>/)[1]
    data.push({ country, city, dataCenter, ipSpace })
  }
  // Delete columns
  data.shift()
  // GeoJSON skeleton
  let geoJson = {
    type: 'FeatureCollection',
    features: [],
  }
  // Loop through the OpenStreetMap API
  for (const result of data) {
    let city = result.city
    let country = result.country
    let osmURL = `https://nominatim.openstreetmap.org/search?country=${country}&format=geojson&polygon=1&addressdetails=1&limit=1&q=${city}`
    const osmResponse = await fetch(osmURL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36', // Chrome
      },
    })
    const osmJson = await osmResponse.json()
    // GeoJSON
    for (let index = 0; index < osmJson.features.length; index++) {
      const newelement = osmJson.features[index]
      geoJson.features.push(newelement)
    }
  }

  // Virtual PoPs
  // // Filter the "Local point of presence (local PoP) locations and IP addresses" table about virtual PoPs
  // const table_regex =
  //   /<table\b[^>]*?\bborder\s*=\s*["']?1["']?\b[^>]*?\bstyle\s*=\s*["']?\s*width\s*:\s*500px\s*;?\s*["']?[^>]*?>([\s\S]*?)<\/table>/i
  // const match = text.match(table_regex)[1]
  // // Filter table content
  // const regex = /<td[^>]*>(.*?)<\/td>/g
  // const new_match = match.match(regex)
  // const data = []
  // let row = {}
  // // Filter table values
  // for (let i = 0; i < new_match.length; i++) {
  //   const value = new_match[i].replace(/<\/?td[^>]*>/g, '')
  //   switch (i % 5) {
  //     case 0:
  //       row.country = value
  //       break
  //     case 1:
  //       row.city = value
  //       break
  //     case 2:
  //       row.localPOPid = value
  //       break
  //     case 3:
  //       row.IPspace = value
  //       break
  //     case 4:
  //       row.locationForTrafficProcessing = value
  //       data.push(row)
  //       row = {}
  //       break
  //   }
  // }
  // // console.log('JSON Length: ', JSON.stringify(data).length)
  // // console.log('JSON Number of Items: ', Object.keys(data).length)
  // const total_length = Object.keys(data).length
  // // GeoJSON skeleton
  // let geoJson = {
  //   type: 'FeatureCollection',
  //   features: [],
  // }
  // // Loop through the OpenStreetMap API
  // for (let i = 0; i < total_length; i++) {
  //   const country = data[i].country
  //   const city = data[i].city
  //   let osm_url = `https://nominatim.openstreetmap.org/search?country=${country}&format=geojson&polygon=1&addressdetails=1&limit=1&q=${city}`
  //   const resp = await (
  //     await fetch(osm_url, {
  //       headers: {
  //         'user-agent':
  //           'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36', // Chrome
  //       },
  //     })
  //   ).json()
  //   // GeoJSON
  //   for (let index = 0; index < resp.features.length; index++) {
  //     const newelement = resp.features[index]
  //     geoJson.features.push(newelement)
  //   }
  // }

  // Conditional check to prevent updating nonesense
  if (
    geoJson.hasOwnProperty('features') &&
    geoJson.features[0].geometry.hasOwnProperty('coordinates') &&
    JSON.stringify(geoJson).length < 1000
  ) {
    console.log('KV update of Forcepoint locations failed.')
    return new Response('KV update FAILED! Something went wrong with Forcepoint.')
  }

  await env.geodata.put('forcepoint', JSON.stringify(geoJson))
  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
}
