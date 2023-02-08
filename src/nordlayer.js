function extractCities(string) {
  // Use regex to match the cities inside the parentheses
  const regex = /\(([^)]+)\)/g
  const matches = string.match(regex)

  // Remove the parentheses from the matches
  const cities = matches.map((match) => match.replace(/[()]/g, ''))

  // Split the string of multiple cities by ","
  const result = []
  cities.forEach((city) => {
    const cleanedCities = city.split(', ').map((c) => c.trim())
    result.push(...cleanedCities)
  })
  return result
}

export async function getNordLayer(env) {
  try {
    // Fetch the page
    const nordlayerRanges = env.NORDLAYER_LOCATIONS
    const response = await fetch(nordlayerRanges)
    const text = await response.text()

    // Use regex to extract the <li> tags inside of the "<div class="content_block_text" dir="auto">" tag
    const regex = /<div class="content_block_text" dir="auto">([\s\S]*?)<\/div>/g
    const matches = text.match(regex)

    let liTags = matches[0].match(/<li>([\s\S]*?)<\/li>/g)
    liTags = liTags.map((tag) => tag.replace(/<\/?li>/g, ''))

    const final_result = extractCities(liTags.join('\n'))

    // GeoJSON skeleton
    let geoJson = {
      type: 'FeatureCollection',
      features: [],
    }

    for (let element of final_result) {
      const resp = await (
        await fetch(`https://nominatim.openstreetmap.org/search?q=${element}&format=geojson&polygon=1&addressdetails=1&limit=1`, {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36', // Chrome
          },
        })
      ).json()

      // GeoJSON
      for (let index = 0; index < resp.features.length; index++) {
        const element = resp.features[index]
        geoJson.features.push(element)
      }
    }

    // Conditional check to prevent updating nonesense
    if (
      geoJson.hasOwnProperty('features') &&
      geoJson.features[0].geometry.hasOwnProperty('coordinates') &&
      JSON.stringify(geoJson).length < 1000
    ) {
      console.log(JSON.stringify(geoJson).length)
      console.log('KV update of NordLayer locations failed.')
      return new Response('KV update FAILED! Something went wrong with NordLayer.')
    }
    // Writing KV data
    await env.geodata.put('nordlayer', JSON.stringify(geoJson))
    return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
  } catch (error) {
    // Catch ERRORS
    console.error(error)
    return new Response('Error: ' + error.message)
  }
}
