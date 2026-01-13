export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;

    if (proxyUrl) {
      const { setGlobalDispatcher, ProxyAgent } = await import('undici');
      const proxyAgent = new ProxyAgent(proxyUrl);
      setGlobalDispatcher(proxyAgent);
      console.log(`[Proxy] Global proxy configured: ${proxyUrl}`);
    }
  }
}
