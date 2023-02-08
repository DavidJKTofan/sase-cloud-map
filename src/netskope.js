function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getNetskope(env) {
  try {
    // Fetch the page
    const netskopeRanges = env.NETSKOPE_LOCATIONS
    const response = await fetch(netskopeRanges)
    const data = await response.json()
    // Continents
    const regions = Object.keys(data)
    const locations = []
    // Filter by Live datacenters only
    for (const continent of regions) {
      const dataForContinent = data[continent]
      dataForContinent.filter((item) => item['Deployment Status'] === 'Live').forEach((item) => locations.push(item['Location']))
    }

    // GeoJSON skeleton
    let geoJson = {
      type: 'FeatureCollection',
      features: [],
    }

    for (let element of locations) {
      await sleep(1.5)
      // console.log(element)
      const resp = await (
        await fetch(`https://nominatim.openstreetmap.org/search?q=${element}&format=geojson&polygon=1&addressdetails=1&limit=1`, {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36', // Chrome
          },
        })
      ).json()

      // GeoJSON
      for (let index = 0; index < resp.features.length; index++) {
        const newelement = resp.features[index]
        geoJson.features.push(newelement)
      }
    }

    // Conditional check to prevent updating nonesense
    if (
      geoJson.hasOwnProperty('features') &&
      geoJson.features[0].geometry.hasOwnProperty('coordinates') &&
      JSON.stringify(geoJson).length < 1000
    ) {
      console.log(JSON.stringify(geoJson).length)
      console.log('KV update of Netskope locations failed.')
      return new Response('KV update FAILED! Something went wrong with Netskope.')
    }
    // Writing KV data
    await env.geodata.put('netskope', JSON.stringify(geoJson))
    return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
  } catch (error) {
    // Catch ERRORS
    console.error(error)
    return new Response('Error: ' + error.message)
  }
}
