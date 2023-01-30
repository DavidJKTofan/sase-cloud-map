// Import external scripts
import { getCloudflare } from './cloudflare.js'
import { getZscaler } from './zscaler.js'
import { getCisco } from './cisco.js'
import { getPerimeter81 } from './perimeter81.js'
import { getNordLayer } from './nordlayer.js'

// Import HTML templates
import html from './templates/index.html'
import allHtml from './templates/all.html'
import homepageHTML from './templates/homepage.html'

// Return geoJSON data as JSON file
// Example: https://map.cf-testing.com/cloudflare.json
const handleJsonRequest = async (pathname, env) => {
  const regex = /^\/([^.]*)\./
  const dataset = regex.exec(pathname)
  const req = await env.geodata.get(dataset[1], { cacheTtl: 3600, type: 'json' })
  return new Response(JSON.stringify(req), { headers: { 'content-type': 'application/json' } })
}

// Return geoJSON map of a specific provider
// Example: https://map.cf-testing.com/cloudflare
const handleHTMLRequest = async (pathname, env) => {
  const dataset = pathname.split('/')[1]
  const req = await env.geodata.get(dataset, { cacheTtl: 3600, type: 'json' })
  if (req === null) {
    return new Response('Value not found', { status: 404 })
  }
  return new Response(html.replace('{{ DATASET }}', JSON.stringify(req)).replaceAll('{{ SOURCE }}', dataset), {
    headers: { 'content-type': 'text/html' },
  })
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
      return new Response('Generated all datasets. Success!', { status: 200 })
    } else if (pathname.endsWith('.json')) {
      return handleJsonRequest(pathname, env)
    } else if (
      pathname.startsWith('/cloudflare') ||
      pathname.startsWith('/cisco') ||
      pathname.startsWith('/perimeter81') ||
      pathname.startsWith('/nordlayer') ||
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
    // URL: https://map.cf-testing.com/all
    else if (pathname.startsWith('/all')) {
      // Read KVs
      const cloudflare = await env.geodata.get('cloudflare', { cacheTtl: 3600, type: 'json' })
      const zscaler = await env.geodata.get('zscaler', { cacheTtl: 3600, type: 'json' })
      const cisco = await env.geodata.get('cisco', { cacheTtl: 3600, type: 'json' })
      const perimeter81 = await env.geodata.get('perimeter81', { cacheTtl: 3600, type: 'json' })
      const nordlayer = await env.geodata.get('nordlayer', { cacheTtl: 3600, type: 'json' })
      // Conditional check
      if (cloudflare === null || zscaler === null || cisco === null || perimeter81 === null || nordlayer === null) {
        return new Response('KV values not found', { status: 404 })
      }
      // Insert geoJSON data into the HTML which includes filters
      return new Response(
        allHtml
          .replace('{{ DATASET }}', JSON.stringify(cloudflare))
          .replace('{{ DATASET_ZSCALER }}', JSON.stringify(zscaler))
          .replace('{{ DATASET_CISCO }}', JSON.stringify(cisco))
          .replace('{{ DATASET_PERIMETER81 }}', JSON.stringify(perimeter81))
          .replace('{{ DATASET_NORDLAYER }}', JSON.stringify(nordlayer)),
        { headers: { 'content-type': 'text/html' } },
      )
    }
    // Return homepage
    else if (pathname === '/') {
      // return new Response('Welcome!', { status: 200 })
      return new Response(homepageHTML, { headers: { 'content-type': 'text/html' }, status: 200 })
    }
    // Any other pathname returns a 404 not found
    else {
      return new Response('Path not found! Are you lost? Try going to the homepage.', { status: 404 })
    }
  },
}