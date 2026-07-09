import http from 'k6/http';
import { sleep, check } from 'k6';

// k6 Options: Simulates traffic ramping up to 30 VUs, staying constant, and ramping down.
export const options = {
  stages: [
    { duration: '10s', target: 30 }, // Ramp-up to 30 users
    { duration: '20s', target: 30 }, // Stay at 30 users
    { duration: '10s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete under 2s (will fail due to N+1)
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Hit the products endpoint (runs the N+1 query database routine)
  const res = http.get(`${BASE_URL}/api/products`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has products': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) && body.length > 0;
      } catch (e) {
        return false;
      }
    }
  });

  // Small random sleep between 1 to 2 seconds to simulate user browsing
  sleep(Math.random() * 1 + 1);
}
