import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const responseTime = new Trend("search_response_time", true);
const errorRate = new Rate("search_error_rate");

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m",  target: 10 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    search_response_time: ["p(95)<2000"],
    search_error_rate: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

const QUERIES = [
  "javascript",
  "clean code",
  "design patterns",
  "python",
  "algorithms",
  "database",
  "linux",
  "network",
  "machine learning",
  "operating systems",
];

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const url = `http://localhost:3000/search/books?q=${encodeURIComponent(q)}&mode=meta`;

  const res = http.get(url, {
    headers: { "Content-Type": "application/json" },
  });

  const ok = check(res, {
    "status is 200": (r) => r.status === 200,
    "response has results field": (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.total === "number" && Array.isArray(body.results);
      } catch {
        return false;
      }
    },
    "response time < 2s": (r) => r.timings.duration < 2000,
  });

  responseTime.add(res.timings.duration);
  errorRate.add(!ok);

  sleep(1);
}