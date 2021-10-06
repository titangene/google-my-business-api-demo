import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { transformReportInsights } from './utils.js';
import MyBusinessService from './mybusiness.service';

main();

async function main() {
  dayjs.extend(utc);

  gapi.load('client:auth2', initGoogleAPIClient);

  const authorizeButton = document.querySelector('.authorize-btn');
  authorizeButton.addEventListener('click', () => {
    gapi.auth2.getAuthInstance().signIn();
    console.log('sign in');
  });

  const signoutButton = document.querySelector('.signout-btn');
  signoutButton.addEventListener('click', () => {
    gapi.auth2.getAuthInstance().signOut();
    console.log('sign out');
  });

  const fetchButton = document.querySelector('.fetch-btn');
  fetchButton.addEventListener('click', fetchReportInsights);
}

async function initGoogleAPIClient() {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  await gapi.client.init({
    apiKey,
    clientId,
    scope: 'https://www.googleapis.com/auth/business.manage'
  });

  const GoogleAuth = gapi.auth2.getAuthInstance();
  GoogleAuth.isSignedIn.listen(updateSigninStatus);
  updateSigninStatus(GoogleAuth.isSignedIn.get());
}

function updateSigninStatus(isSignedIn) {
  const authorizeButton = document.querySelector('.authorize-btn');
  const signoutButton = document.querySelector('.signout-btn');

  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

async function fetchReportInsights() {
  const myBusinessService = new MyBusinessService();

  const accounts = await myBusinessService.getAccounts();
  console.log(accounts);

  const myBusinessAccountName = import.meta.env.VITE_MY_BUSINESS_ACCOUNT_NAME;
  const targetAccount = accounts.find(
    account => account.accountName === myBusinessAccountName
  );
  const targetAccountName = targetAccount.name;
  const locations = await myBusinessService.getLocationsByAccount(
    targetAccountName,
    { readMasks: ['name', 'title', 'storefrontAddress'] }
  );
  console.log(locations);

  const locationMetrics =
    await myBusinessService.getReportInsightsByAccountLocations(
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
  console.log(locationMetrics);

  const result = transformReportInsights(locationMetrics, locations);
  console.log(result);
}
