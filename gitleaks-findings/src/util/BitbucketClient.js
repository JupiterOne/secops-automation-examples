const request = require('request-promise-native');

const BASE_API_URL = 'https://bitbucket.org/api/2.0/';

async function forEachPage (client, firstUri, eachFn) {
  let nextPageUrl = firstUri;

  while (nextPageUrl) {
    const page = await client.get({
      uri: nextPageUrl
    });

    eachFn(page);

    if (page.next) {
      if (!page.next.startsWith(BASE_API_URL)) {
        throw new Error(`The next page URL, ${page.next}, does not start with the expected base API URL ${BASE_API_URL}`);
      } else {
        nextPageUrl = page.next.substring(BASE_API_URL.length);
      }
    } else {
      nextPageUrl = null;
    }
  }
}

class BitbucketClient {
  static async getAccessToken (oauthKey, oauthSecret) {
    return JSON.parse(await request({
      url: 'https://bitbucket.org/site/oauth2/access_token',
      method: 'POST',
      auth: {
        user: oauthKey,
        pass: oauthSecret
      },
      form: {
        grant_type: 'client_credentials'
      }
    })).access_token;
  }

  constructor (options) {
    this._client = request.defaults({
      baseUrl: BASE_API_URL,
      auth: {
        bearer: options.accessToken
      },
      json: true
    });
  }

  async getRepos (userName) {
    return this.fetchAllPages(`repositories/${userName}`);
  }

  async getProjects (teamName) {
    return this.fetchAllPages(`teams/${teamName}/projects/`);
  }

  async getTeamMembers (teamName) {
    return this.fetchAllPages(`teams/${teamName}/members`);
  }

  async fetchAllPages (firstUri) {
    const results = [];

    await forEachPage(this._client, firstUri, (page) => {
      Array.prototype.push.apply(results, page.values);
    });

    return results;
  }

  async get (options) {
    return this._client.get(options);
  }

  async post (options) {
    return this._client.post(options);
  }

  async put (options) {
    return this._client.put(options);
  }

  async delete (options) {
    return this._client.delete(options);
  }
}

module.exports = BitbucketClient;
