export async function getPerimeter81(env) {
  try {
    const perimeter81Ranges = env.PERIMETER81_LOCATIONS
    const response = await fetch(perimeter81Ranges)
    const text = await response.text()

    // Use a regular expression to find the "<g " tags within the desired "<g id" tag
    const regex = /<g id="(.*?)">(.|\n)*?<\/g>/g
    const matches = text.match(regex)

    const gTags = matches.map((match) => match.match(/<g .*?>/g)).join('\n')

    // Use a regular expression to find the "<g " tags within the desired "<g id" tag
    const new_regex = /<g id="([^"]*)"/g
    const new_matches = gTags.match(new_regex)
    const pre_result = new_matches.map((match) => match.replace('<g id="', '').replace(/"/g, ''))

    const final_result = pre_result
      .filter(
        (gTag) =>
          !(
            gTag.includes('animateMapCityNameContainer') ||
            gTag.includes('Data_Center_Map_-_Desktop') ||
            gTag.includes('map') ||
            gTag.includes('no_hover') ||
            gTag.includes('hover') ||
            gTag.includes('icon_text_card')
          ),
      )
      .filter((gTag) => !/hover-\d+/g.test(gTag))
      .filter((gTag) => !/Hover-\d+/g.test(gTag))
      .filter((gTag) => !/icon_text_card-\d+/g.test(gTag))
    // .join('\n');

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
      console.log('KV update of Perimeter81 locations failed.')
      return new Response('KV update FAILED! Something went wrong with Perimeter81.')
    }
    // Writing KV data
    await env.geodata.put('perimeter81', JSON.stringify(geoJson))
    return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
  } catch (error) {
    // Catch ERRORS
    console.error(error)
    return new Response('Error: ' + error.message)
  }
}
