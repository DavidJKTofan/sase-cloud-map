function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getCatoNetworks(env) {
  try {
    // Fetch the page
    const catonetworksRanges = env.CATONETWORKS_LOCATIONS
    const data = JSON.parse(await (await fetch(catonetworksRanges)).text())
    let locations = []
    // Loop through the JSON file and extract locations
    data.assets.forEach((asset) => {
      asset.layers.forEach((layer) => {
        if (layer.t && layer.t.d && layer.t.d.k[0].s.t) {
          const location = layer.t.d.k[0].s.t.split(', ')
          locations.push(location)
        }
      })
    })
    // Ensure that all elements are String
    locations = locations.map((location) => location.map((str) => str.toString()))
    // Ensure that whitespace is ready to use in URL
    locations = locations.map((location) => location.map((str) => str.replace(/\s+/g, '%20')))
    // Fix for Santiago being Costa Rica
    locations = locations.map((location) => {
      if (location[0] === 'Santiago') {
        return ['Santiago de Chile', location[1]]
      }
      return location
    })

    // GeoJSON skeleton
    let geoJson = {
      type: 'FeatureCollection',
      features: [],
    }

    for (let element of locations) {
      await sleep(1.5)
      //   console.log(element[0], element[1])
      const resp = await (
        await fetch(
          `https://nominatim.openstreetmap.org/search?q=${element[0]}&country=${element[1]}&format=geojson&polygon=1&addressdetails=1&limit=1`,
          {
            headers: {
              'user-agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36', // Chrome
            },
          },
        )
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
      console.log('KV update of CatoNetworks locations failed.')
      return new Response('KV update FAILED! Something went wrong with CatoNetworks.')
    }
    // Writing KV data
    await env.geodata.put('catonetworks', JSON.stringify(geoJson))
    return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
  } catch (error) {
    // Catch ERRORS
    console.error(error)
    return new Response('Error: ' + error.message)
  }
}
