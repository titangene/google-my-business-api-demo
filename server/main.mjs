import { createServer } from 'http';
import { URL } from 'url';
import open from 'open';
import dotenv from 'dotenv';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import { google } from './google-api.mjs';
import MyBusinessService from './mybusiness.service.mjs';
import { destroyer, transformReportInsights } from './utils.mjs';

dayjs.extend(utc);

const config = dotenv.config({ path: '.env.local' }).parsed;
const PORT = 8000;
const clientId = config.VITE_GOOGLE_CLIENT_ID;
const clientSecret = config.GOOGLE_CLIENT_SECRET;
const redirectURL = config.GOOGLE_REDIRECT_URL;

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectURL
);
google.options({ auth: oauth2Client });

main();

async function main() {
  try {
    const scopes = ['https://www.googleapis.com/auth/business.manage'];
    await authenticate(scopes);
    fetchReportInsights();
  } catch (error) {
    console.log(error);
  }
}

async function authenticate(scopes) {
  return new Promise((resolve, reject) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
      scope: scopes
    });
    const server = createServer(async (req, res) => {
      try {
        if (!req.url.includes('/oauth2callback')) return;

        res.end('Authentication successful! Please return to the console.');
        server.destroy();

        const query = new URL(req.url, `http://${req.headers.host}`)
          .searchParams;
        const { tokens } = await oauth2Client.getToken(query.get('code'));
        oauth2Client.setCredentials(tokens);
        resolve(oauth2Client);
      } catch (e) {
        reject(e);
      }
    }).listen(PORT, () => {
      open(authorizeUrl, { wait: false }).then(cp => cp.unref());
    });

    destroyer(server);
  });
}

async function fetchReportInsights() {
  const myBusinessService = new MyBusinessService();

  const accounts = await myBusinessService.getAccounts();
  console.log(accounts);

  const myBusinessAccountName = config.VITE_MY_BUSINESS_ACCOUNT_NAME;
  const targetAccount = accounts.find(
    account => account.accountName === myBusinessAccountName
  );
  const targetAccountName = targetAccount.name;
  const locations = await myBusinessService.getLocationsByAccount(
    targetAccountName,
    { readMasks: ['name', 'title', 'storefrontAddress'] }
  );
  console.log(JSON.stringify(locations, null, 2));

  const locationMetrics =
    await myBusinessService.fetchReportInsightsByAccountLocations(
      targetAccountName,
      locations,
      {
        timeRange: { startTime: '2021-09-01', endTime: '2021-09-07' },
        metrics: [
          'QUERIES_DIRECT',
          'QUERIES_INDIRECT',
          'VIEWS_SEARCH',
          'VIEWS_MAPS',
          'ACTIONS_WEBSITE',
          'ACTIONS_DRIVING_DIRECTIONS',
          'ACTIONS_PHONE'
        ]
      }
    );
  console.log(JSON.stringify(locationMetrics, null, 2));

  const result = transformReportInsights(locationMetrics, locations);
  console.log(result);
}
