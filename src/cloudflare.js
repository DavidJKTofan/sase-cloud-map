export async function getCloudflare(env) {
  try {
    const cloudflareRanges = env.CLOUDFLARE_LOCATIONS
    const locationData = await (await fetch(cloudflareRanges)).json()
    const locations = locationData.prefixes
    const uniqueLocations = [...new Set(locations.map(({ location }) => location))].filter((e) => e).filter((e) => e.length <= 3)

    // GeoJSON skeleton
    let geoJson = {
      type: 'FeatureCollection',
      features: [],
    }

    for (let index = 0; index < uniqueLocations.length; index++) {
      const element = uniqueLocations[index]
      const resp = await (
        await fetch(`https://nominatim.openstreetmap.org/search?q=${element}&format=geojson&polygon=1&addressdetails=1&limit=5`, {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36', // Chrome
          },
        })
      ).json()

      // GeoJSON
      for (let index = 0; index < resp.features.length; index++) {
        const element = resp.features[index]
        if (element.properties.type === 'aerodrome') {
          geoJson.features.push(element)
        }
      }
    }

    // Conditional check to prevent updating nonesense
    if (
      geoJson.hasOwnProperty('features') &&
      geoJson.features[0].geometry.hasOwnProperty('coordinates') &&
      JSON.stringify(geoJson).length < 1000
    ) {
      console.log('KV update of Cloudflares locations failed.')
      return new Response('KV update FAILED! Something went wrong with Cloudflare.')
    }
    // Writing KV data
    await env.geodata.put('cloudflare', JSON.stringify(geoJson))
    return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
  } catch (error) {
    // Catch ERRORS
    console.error(error)
    return new Response('Error: ' + error.message)
  }
}
