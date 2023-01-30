export async function getCisco(env) {
  try {
    const ciscoRanges = env.CISCO_LOCATIONS
    const response = await fetch(ciscoRanges)
    const html = await response.text()

    // Use the match() method to find the table with id="networks" in the HTML
    const regex = /<table id="networks" cellpadding="0" cellspacing="0">([\s\S]*?)<\/table>/g
    const matches = html.match(regex)

    // GeoJSON skeleton
    let geoJson = {
      type: 'FeatureCollection',
      features: [],
    }

    // Return an array of values from the first column of the table
    if (matches && matches.length > 0) {
      const table = matches[0]

      // Use the match() method to find the td elements in the first column of the table
      // and capture the values in a capturing group
      const valueRegex = /<tr>([\s\S]*?)<td>([\s\S]*?)<\/td>/g
      const valueMatches = table.match(valueRegex)

      // Clean up the values in the array
      const cleanedValues = valueMatches.map((value) => {
        // Remove the tr and td tags and any excess white space
        return value.replace(/<\/?[^>]+(>|$)/g, '').trim()
      })

      // Clean up the values in the array
      const superCleanedValues = cleanedValues.map((value) => {
        // Remove the text between the words "Location" and "IPv6"
        return value.replace(/Location[\s\S]*?IPv6/g, '').trim()
      })

      // Loop through the array of values
      for (const value of superCleanedValues) {
        const resp = await (
          await fetch(`https://nominatim.openstreetmap.org/search?q=${value}&format=geojson&polygon=1&addressdetails=1&limit=1`, {
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
        console.log('KV update of Cisco locations failed.')
        return new Response('KV update FAILED! Something went wrong with Cisco.')
      }

      // Writing KV data
      await env.geodata.put('cisco', JSON.stringify(geoJson))
      return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
    } else {
      return new Response('Table not found', {
        headers: {
          'content-type': 'text/html',
        },
      })
    }
  } catch (error) {
    // Catch ERRORS
    console.error(error)
    return new Response('Error: ' + error.message)
  }
}
