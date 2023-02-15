// Import external scripts
import { getCloudflare } from './cloudflare.js'
import { getZscaler } from './zscaler.js'
import { getCisco } from './cisco.js'
import { getPerimeter81 } from './perimeter81.js'
import { getNordLayer } from './nordlayer.js'
import { getCatoNetworks } from './catonetworks.js'
import { getNetskope } from './netskope.js'

// Import HTML templates
import html from './templates/index.html'
import allHtml from './templates/all.html'
import homepageHTML from './templates/homepage.html'

// Return geoJSON data as JSON file
// Example: https://sasecloudmap.com/cloudflare.json
const handleJsonRequest = async (pathname, env) => {
  const regex = /^\/([^.]*)\./
  const dataset = regex.exec(pathname)
  const req = await env.geodata.get(dataset[1], { cacheTtl: 3600, type: 'json' })
  return new Response(JSON.stringify(req), { headers: { 'content-type': 'application/json' } })
}

// Return geoJSON map of a specific provider
// Example: https://sasecloudmap.com/cloudflare
const handleHTMLRequest = async (pathname, env) => {
  const dataset = pathname.split('/')[1]
  const req = await env.geodata.get(dataset, { cacheTtl: 3600, type: 'json' })
  // For comparison with Cloudflare
  if (dataset !== 'cloudflare') {
    const cf_kv = await env.geodata.get('cloudflare', { cacheTtl: 3600, type: 'json' })
    if (req === null || cf_kv === null) {
      return new Response('KV values not found', { status: 404 })
    }
    return new Response(
      html
        .replaceAll('{{ DATASET }}', JSON.stringify(req))
        .replaceAll('{{ CLOUDFLARE_DATASET }}', JSON.stringify(cf_kv))
        .replaceAll('{{ SOURCE }}', dataset),
      {
        headers: { 'content-type': 'text/html' },
      },
    )
  } else {
    if (req === null) {
      return new Response('KV values not found', { status: 404 })
    }
    return new Response(
      html
        .replaceAll('{{ DATASET }}', JSON.stringify(req))
        .replaceAll('{{ CLOUDFLARE_DATASET }}', 'not_cf')
        .replaceAll('{{ SOURCE }}', dataset),
      {
        headers: { 'content-type': 'text/html' },
      },
    )
  }
}

export default {
  async fetch(request, env, ctx) {
    // Initialize URL object with request's URL
    const url = new URL(request.url)
    // Fetch auth header value from request headers
    const secret = request.headers.get('v-secret')
    // Extract pathname from the URL object
    const pathname = url.pathname
    // Output pathname value to debug console
    console.debug('path:', pathname)

    // Generate all datasets manually and with a custom Auth Header
    if (pathname === '/generate' && secret === env.generator) {
      console.debug('generating cloudflare dataset')
      await getCloudflare(env)
      console.debug('generating zscaler dataset')
      await getZscaler(env)
      console.debug('generating cisco dataset')
      await getCisco(env)
      console.debug('generating perimeter81 dataset')
      await getPerimeter81(env)
      console.debug('generating nordlayer dataset')
      await getNordLayer(env)
      console.debug('generating catonetworks dataset')
      await getCatoNetworks(env)
      console.debug('generating netskope dataset')
      await getNetskope(env)
      return new Response('Generated all datasets. Success!', { status: 200 })
    } else if (pathname.endsWith('.json')) {
      return handleJsonRequest(pathname, env)
    } else if (
      pathname.startsWith('/cloudflare') ||
      pathname.startsWith('/cisco') ||
      pathname.startsWith('/perimeter81') ||
      pathname.startsWith('/nordlayer') ||
      pathname.startsWith('/catonetworks') ||
      pathname.startsWith('/netskope') ||
      pathname.startsWith('/zscaler')
    ) {
      return handleHTMLRequest(pathname, env)
    }
    // Testing new providers here...
    // else if (pathname.startsWith('/newprovider')) {
    //   return await getNEW_PROVIDER(env)
    //   // don't forget to also import external JS
    // }

    // Illustrate all providers
    // URL: https://sasecloudmap.com/all
    else if (pathname.startsWith('/all')) {
      // Read KVs
      const cloudflare = await env.geodata.get('cloudflare', { cacheTtl: 3600, type: 'json' })
      const zscaler = await env.geodata.get('zscaler', { cacheTtl: 3600, type: 'json' })
      const cisco = await env.geodata.get('cisco', { cacheTtl: 3600, type: 'json' })
      const perimeter81 = await env.geodata.get('perimeter81', { cacheTtl: 3600, type: 'json' })
      const nordlayer = await env.geodata.get('nordlayer', { cacheTtl: 3600, type: 'json' })
      const catonetworks = await env.geodata.get('catonetworks', { cacheTtl: 3600, type: 'json' })
      const netskope = await env.geodata.get('netskope', { cacheTtl: 3600, type: 'json' })
      // Conditional check
      if (
        cloudflare === null ||
        zscaler === null ||
        cisco === null ||
        perimeter81 === null ||
        nordlayer === null ||
        netskope === null ||
        catonetworks === null
      ) {
        return new Response('KV values not found', { status: 404 })
      }
      // Insert geoJSON data into the HTML which includes filters
      return new Response(
        allHtml
          .replaceAll('{{ DATASET }}', JSON.stringify(cloudflare))
          .replace('{{ DATASET_ZSCALER }}', JSON.stringify(zscaler))
          .replace('{{ DATASET_CISCO }}', JSON.stringify(cisco))
          .replace('{{ DATASET_PERIMETER81 }}', JSON.stringify(perimeter81))
          .replace('{{ DATASET_NORDLAYER }}', JSON.stringify(nordlayer))
          .replace('{{ DATASET_CATONETWORKS }}', JSON.stringify(catonetworks))
          .replace('{{ DATASET_NETSKOPE }}', JSON.stringify(netskope)),
        { headers: { 'content-type': 'text/html' } },
      )
    }
    // Return homepage
    else if (pathname === '/') {
      return new Response(homepageHTML, { headers: { 'content-type': 'text/html' }, status: 200 })
    }
    // Any other pathname returns a 404 not found
    else {
      return new Response('Path not found! Are you lost? Try going to the homepage.', { status: 404 })
    }
  },
}
