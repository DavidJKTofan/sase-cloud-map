export async function getZscaler(env) {
  try {
    const zscalerRanges = env.ZSCALER_LOCATIONS
    const ztData = await (await fetch(zscalerRanges)).json()
    const ztData_keys = Object.keys(ztData)
    const continents = Object.keys(ztData[ztData_keys]) // "continent : EMEA"
    let cities = []

    for (let index = 0; index < continents.length; index++) {
      const element = continents[index] // continent : Americas
      const city = ztData[ztData_keys][element] // "city : Abu Dhabi I"
      cities.push(city)
    }

    const cities_newarray = cities.flat()
    const json = cities_newarray.flat()

    // GeoJSON skeleton
    let geoJson = {
      type: 'FeatureCollection',
      features: [],
    }

    for (var key in json) {
      if (json.hasOwnProperty(key)) {
        var obj = json[key]
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            // GeoJSON
            const properties = {
              type: 'Feature',
              properties: { name: Math.random(0, 1000) },
              bbox: [
                parseFloat(obj[prop][0].longitude),
                parseFloat(obj[prop][0].latitude),
                parseFloat(obj[prop][0].longitude),
                parseFloat(obj[prop][0].latitude),
              ],
              geometry: {
                type: 'Point',
                coordinates: [parseFloat(obj[prop][0].longitude), parseFloat(obj[prop][0].latitude)],
              },
            }
            // console.log(properties)
            geoJson.features.push(properties)
          }
        }
      }
    }

    // Conditional check to prevent updating nonesense
    if (
      geoJson.hasOwnProperty('features') &&
      geoJson.features[0].geometry.hasOwnProperty('coordinates') &&
      JSON.stringify(geoJson).length < 1000
    ) {
      console.log('KV update of Zscaler locations failed.')
      return new Response('KV update FAILED! Something went wrong with Zscaler.')
    }
    // Writing KV data
    await env.geodata.put('zscaler', JSON.stringify(geoJson))
    return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
  } catch (error) {
    // Catch ERRORS
    console.error(error)
    return new Response('Error: ' + error.message)
  }
}
