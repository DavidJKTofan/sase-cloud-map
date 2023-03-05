function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getPaloAlto(env) {
  const paloaltoRanges = env.PALOALTO_LOCATIONS
  // Fetch data
  const response = await fetch(paloaltoRanges, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    },
  })
  const htmlContent = await response.text()
  // Regex for the table
  const tableRegex = /<table\s+ class="table colsep rowsep " >\s*([\s\S]*?)\s*<\/table>/i
  const tableMatch = htmlContent.match(tableRegex)
  const tableHTML = tableMatch[0]
  // Search the countries
  const regex = /<td\s+class="entry relcol"\s*><div\s+style="display: inline;">([^<]+)<\/div><\/td>/g
  let match
  let countries = []
  while ((match = regex.exec(tableHTML)) !== null) {
    countries.push(match[1])
  }
  // Replace wrongly-attributed by OpenStreetMap API (temporary fix)
  countries = countries.map((item) => (item === 'Australia Southeast' ? 'Australia Tamworth' : item))
  countries = countries.map((item) => (item === 'India South' ? 'India Jadavpur' : item))
  countries = countries.map((item) => (item === 'France North' ? 'France Abbeville' : item))
  countries = countries.map((item) => (item === 'France South' ? 'France Nice' : item))
  countries = countries.map((item) => (item === 'Russia Central' ? 'Russia Moscow' : item))
  countries = countries.map((item) => (item === 'Russia Northwest' ? 'Russia St. Petersburg' : item))
  countries = countries.map((item) => (item === 'Spain East' ? 'Spain Barcelona' : item))
  countries = countries.map((item) => (item === 'Japan Central' ? 'Japan Nagano' : item))
  countries = countries.map((item) => (item === 'Canada West' ? 'Canada Vancouver' : item))
  countries = countries.map((item) => (item === 'Mexico Central' ? 'Mexico Queretaro' : item))
  countries = countries.map((item) => (item === 'Mexico West' ? 'Mexico City' : item))
  countries = countries.map((item) => (item === 'US Northwest' ? 'US Seattle' : item))
  countries = countries.map((item) => (item === 'Brazil East' ? 'Brazil Rio de Janeiro' : item))
  // GeoJSON skeleton
  let geoJson = {
    type: 'FeatureCollection',
    features: [],
  }
  // Loop through countries and take an approximate location
  for (let element of countries) {
    await sleep(1.5)
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
    console.log('KV update of Palo Alto Networks locations failed.')
    return new Response('KV update FAILED! Something went wrong with Palo Alto Networks.')
  }
  await env.geodata.put('paloalto', JSON.stringify(geoJson)) // Key, Value
  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } })
}
