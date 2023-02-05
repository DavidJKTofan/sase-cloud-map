export async function getCloudflare(env) {
  try {
    const cloudflareRanges = env.CLOUDFLARE_LOCATIONS
    const locationData = await fetch(cloudflareRanges)
    const data = await locationData.json()

    // GeoJSON skeleton
    const geoJson = {
      type: 'FeatureCollection',
      features: data.map((location) => ({
        type: 'Feature',
        properties: { city: location.city },
        geometry: {
          type: 'Point',
          coordinates: [location.lon, location.lat],
        },
      })),
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
