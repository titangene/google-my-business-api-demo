import axios from 'axios';
import dayjs from 'dayjs';

const httpClient = axios.create();

httpClient.interceptors.request.use(async function (config) {
  const { access_token } = gapi.client.getToken();
  if (access_token) config.headers.Authorization = `Bearer ${access_token}`;
  return config;
});

httpClient.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
);

export default class MyBusinessService {
  // ref: https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts/list
  async getAccounts() {
    const url =
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
    const { accounts } = await httpClient.get(url);
    return accounts;
  }

  // ref: https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list
  async getLocationsByAccount(accountName, { readMasks }) {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`;
    const { locations } = await httpClient.get(url, {
      params: { readMask: readMasks.join() }
    });
    return locations;
  }

  // ref: https://developers.google.com/my-business/reference/rest/v4/accounts.locations/reportInsights
  async getReportInsightsByAccountLocations(accountName, locations, options) {
    const url = `https://mybusiness.googleapis.com/v4/${accountName}/locations:reportInsights`;

    // 若時間範圍設為 2021-09-01 至 2021-09-07，實際代表以下範圍：
    // const timeRange = {
    //   startTime: '2021-08-31T16:00:00Z',
    //   endTime: '2021-09-07T16:00:00Z'
    // };
    const {
      timeRange: { startTime, endTime },
      metrics
    } = options;

    const payload = {
      locationNames: locations.map(
        location => `${accountName}/${location.name}`
      ),
      basicRequest: {
        timeRange: {
          startTime: dayjs(startTime).utc().format(),
          endTime: dayjs(endTime).add(1, 'day').utc().format()
        },
        metricRequests: metrics.map(metric => ({ metric }))
      }
    };
    const { locationMetrics } = await httpClient.post(url, payload);
    return locationMetrics;
  }
}
