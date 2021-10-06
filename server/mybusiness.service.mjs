import dayjs from 'dayjs';
import {
  mybusinessaccountmanagement,
  mybusinessbusinessinformation,
  mybusiness
} from './google-api.mjs';

export default class MyBusinessService {
  // ref: https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts/list
  async getAccounts() {
    const {
      data: { accounts }
    } = await mybusinessaccountmanagement.accounts.list();
    return accounts;
  }

  // ref: https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list
  async getLocationsByAccount(accountName, { readMasks }) {
    const {
      data: { locations }
    } = await mybusinessbusinessinformation.accounts.locations.list({
      parent: accountName,
      readMask: readMasks.join()
    });
    return locations;
  }

  // ref: https://developers.google.com/my-business/reference/rest/v4/accounts.locations/reportInsights
  async fetchReportInsightsByAccountLocations(accountName, locations, options) {
    // 若時間範圍設為 2021-09-01 至 2021-09-07，實際代表以下範圍：
    // const timeRange = {
    //   startTime: '2021-08-31T16:00:00Z',
    //   endTime: '2021-09-07T16:00:00Z'
    // };
    const {
      timeRange: { startTime, endTime },
      metrics
    } = options;

    const {
      data: { locationMetrics }
    } = await mybusiness.accounts.locations.reportInsights({
      name: accountName,
      requestBody: {
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
      }
    });
    return locationMetrics;
  }
}
