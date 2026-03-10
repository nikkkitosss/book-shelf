import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const responseTime = new Trend("parallel_response_time", true);
const errorRate = new Rate("parallel_error_rate");
const requestCount = new Counter("parallel_request_count");

export const options = {
  stages: [
    { duration: "30s", target: 5  },
    { duration: "1m",  target: 5  },
    { duration: "30s", target: 10 },
    { duration: "1m",  target: 10 },
    { duration: "30s", target: 20 },
    { duration: "1m",  target: 20 },
    { duration: "30s", target: 50 },
    { duration: "1m",  target: 50 },
    { duration: "30s", target: 0  },
  ],
  thresholds: {
    parallel_response_time: ["p(95)<3000"],
    parallel_error_rate: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
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
  "architecture",
  "security",
  "web development",
  "data structures",
  "concurrency",
];

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const mode = Math.random() > 0.5 ? "content" : "meta";
  const url = `http://localhost:3000/search/books?q=${encodeURIComponent(q)}&mode=${mode}`;

  const res = http.get(url, {
    headers: { "Content-Type": "application/json" },
    tags: { mode },
  });

  const ok = check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 3s": (r) => r.timings.duration < 3000,
    "no server error": (r) => r.status < 500,
  });

  responseTime.add(res.timings.duration);
  errorRate.add(!ok);
  requestCount.add(1);

  sleep(Math.random() * 2 + 0.5);
}