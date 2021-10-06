import { google } from 'googleapis';
import googleAPIMybusiness from 'googleapis-mybusiness';

google.addAPIs({ mybusiness: googleAPIMybusiness.mybusiness });

const mybusinessaccountmanagement = google.mybusinessaccountmanagement('v1');
const mybusinessbusinessinformation =
  google.mybusinessbusinessinformation('v1');
const mybusiness = google.mybusiness('v4');

export {
  google,
  mybusinessaccountmanagement,
  mybusinessbusinessinformation,
  mybusiness
};
