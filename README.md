# Where the Cloud Lives: an Interactive Map of Data Center Locations of Top SASE Providers

This [application](https://sasecloudmap.com/) allows users to easily find and explore the approximate locations of data centers or Point of Presence (PoP) of major [SASE](https://www.cloudflare.com/learning/access-management/what-is-sase/) or [Zero Trust](https://www.cloudflare.com/learning/security/glossary/what-is-zero-trust/) providers, offering the entire suite or part of those solutions. It provides a visual representation of their service locations and geographic distribution.

Depending on the provider, some locations might offer different solutions, performance metrics, and/or are only available with a surcharge.

> **_Learn more about_** [Zero Trust, SASE and SSE: foundational concepts for your next-generation network](https://blog.cloudflare.com/zero-trust-sase-and-sse-foundational-concepts-for-your-next-generation-network/)

Below the current providers available:

| Vendor                                          | Endpoint                                                                                  | Reference                                                                                      | Auto-Updated |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| Cloudflare                                      | `/cloudflare`                                                                             | https://www.cloudflare.com/network/                                                            | ✅           |
| Zscaler                                         | `/zscaler`                                                                                | https://trust.zscaler.com/zscaler.net/data-center-map                                          | ✅           |
| Perimeter81                                     | `/perimeter81`                                                                            | https://www.perimeter81.com/global-datacenter-backbone                                         | ✅           |
| NordLayer                                       | `/nordlayer`                                                                              | https://nordlayer.com/cloud-vpn/                                                               | ✅           |
| Cisco Umbrella                                  | `/cisco`                                                                                  | https://umbrella.cisco.com/why-umbrella/global-network-and-traffic                             | ✅           |
| Cisco Duo (_not displayed_)                     | The infrastructure for the Duo services runs on Amazon Web Services (AWS) in 9 countries. | https://duo.com/support/security-and-reliability                                               | n/a          |
| Cato Networks                                   | `/catonetworks`                                                                           | https://www.catonetworks.com/                                                                  | ✅           |
| Netskope                                        | `/netskope`                                                                               | https://www.netskope.com/resources/data-sheets/netskope-newedge-data-sheet                     | ❌           |
| Fortinet (FortiSASE)                            | `/fortisase`                                                                              | https://docs.fortinet.com/document/fortisase/23.1.8/reference-guide/663044/global-data-centers | ✅           |
| Palo Alto Networks                              | `/paloalto`                                                                               | https://www.paloaltonetworks.com/products/regional-cloud-locations                             | 🚧           |
| Forcepoint (_locations for traffic processing_) | `/forcepoint`                                                                             | https://support.forcepoint.com/s/article/Cloud-service-data-center-IP-addresses-port-numbers   | ✅           |
| Twingate                                        | Twingate uses GCP data centers.                                                           | https://www.twingate.com/docs/twingate-security/                                               | n/a          |

---

# Contributions Welcomed

You are welcome to contribute to this GitHub Repository: open Issues or Pull Requests and help us make this an amazing, useful and fun project.

It would also be super helpful if you could share any publicly available information you might have on data center locations for these or other providers.

More Cloud Providers will be added soon (faster with your contributions)...

# Credits

Special thanks to all supporting entities/tools/softwares/packages/platforms/contributors... 🤓

- Application deployed via [Cloudflare Workers](https://workers.cloudflare.com/) for FREE (Backup Link: [sase-cloud-map.cf-testing.workers.dev](https://sase-cloud-map.cf-testing.workers.dev/))
- Some code/scripts inspired by [Stack Overflow](https://stackoverflow.com/)
- Parts of the code – specifically the regex parts – inspired by [ChatGPT](https://openai.com/blog/chatgpt/)

Curious about how we built this? Check out this [blog post](https://davidtofan.com/articles/interactive-map-cloud-data-center-locations/).

Built with 🧡.

# Disclaimer

Educational purposes only.

All trademarks, logos and brand names are the property of their respective owners. All company, product and service names used in this website are for identification and/or educational purposes only. Use of these names, trademarks and brands does not imply endorsement.

This repo does not reflect the opinions of, and is not affiliated with any of the institutions mentioned here.

---

# Some Inspirations

- https://github.com/jsdelivr/globalping
- https://github.com/bitdotioinc/cloud-latency-map
