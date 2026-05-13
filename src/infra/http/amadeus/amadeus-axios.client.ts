import axios from 'axios';

export const amadeusAxios = axios.create({
  baseURL: 'https://test.api.amadeus.com',
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
