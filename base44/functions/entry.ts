Deno.serve(async (req) => {
  const content = `self.options = {
    "domain": "3nbf4.com",
    "zoneId": 10791082
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});