export async function getfortiSASE(env) {
  try {
    const fortisaseRanges = env.FORTISASE_LOCATIONS
    const response = await fetch(fortisaseRanges, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      },
    })
    const htmlText = await response.text()
    // Div regex
    const regex = /<div\s+role="main"\s+id="mc-main-content">.*?<table.*?>.*?<\/thead>\s*<tbody>(.*?)<\/tbody>.*?<\/table>.*?<\/div>/s
    const match = regex.exec(htmlText)
    // Table regex
    const tableData = []
    const rowRegex = /<tr.*?>\s*<td.*?>(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<\/tr>/gs
    let rowMatch
    while ((rowMatch = rowRegex.exec(match[1])) !== null) {
      tableData.push({
        Location: rowMatch[1].trim(),
        Facility: rowMatch[2].trim(),
        'Peering Fabric': rowMatch[3].trim(),
        IPv4: rowMatch[4].trim(),
      })
    }
    // Loop through the tableData and split the Location value
    const results = []
    for (const row of tableData) {
      const location = row.Location.split(' - ')
      const city = location[0]
      const state = location.length > 2 ? location[1] : null
      const country = location[location.length - 1]
        .replace(/\r\n/g, '')
        .replace(/\(\w+-\w+\)/g, '')
        .trim() //.replace(/\s*\([A-Z]{3}-F1\)/, '')
      const provider = row.Provider
      const peeringFabric = row['Peering Fabric']
        .replace(/<p>/g, ' ')
        .replace(/<\/p>/g, '')
        .replace(/\r?\n|\r/g, '')
        .replace(/,/g, ', ')
      const ipv4 = row.IPv4.replace(/<\/p>/g, '').replace(/<\/?p>/g, ',')
      const facility = row.Facility
      const result = {
        city,
        state,
        country,
        provider,
        peeringFabric,
        facility,
        ipv4,
      }
      results.push(result)
    }
    // GeoJSON skeleton
    let geoJson = {
      type: 'FeatureCollection',
      features: [],
    }
    // Loop
    for (const result of results) {
      let city = result.city
      let state = result.state
      let country = result.country
      let facility = result.facility
      let osmURL = `https://nominatim.openstreetmap.org/search?country=${country}&format=geojson&polygon=1&addressdetails=1&limit=1&q=${city}`
      if (state) {
        osmURL += `,${state}`
      }
      //   if (facility.includes('Tokyo')) {
      //     osmURL += `,` + encodeURIComponent(facility)
      //   }
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

    // Conditional check to prevent updating nonesense
    if (
      geoJson.hasOwnProperty('features') &&
      geoJson.features[0].geometry.hasOwnProperty('coordinates') &&
      JSON.stringify(geoJson).length < 1000
    ) {
      console.log('KV update of Fortinet (FortiSASE) locations failed.')
      return new Response('KV update FAILED! Something went wrong with Fortinet (FortiSASE).')
    }
    // Writing KV data
    await env.geodata.put('fortisase', JSON.stringify(geoJson))
    return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
  } catch (error) {
    // Catch ERRORS
    console.error(error)
    return new Response('Error: ' + error.message)
  }
}
