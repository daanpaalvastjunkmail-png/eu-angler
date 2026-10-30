import {AccountHub} from './accounts.js';
import {errorResponse, protectRequest} from './security.js';
export {AccountHub};

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api' || path.startsWith('/api/')) {
      try {
        protectRequest(request);
        return await env.ACCOUNTS.get(env.ACCOUNTS.idFromName('europa-angler-accounts-v1')).fetch(request);
      } catch (error) { return errorResponse(error); }
    }
    return env.ASSETS.fetch(request);
  },
};
