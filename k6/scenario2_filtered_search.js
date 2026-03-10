import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const responseTime = new Trend("filtered_search_response_time", true);
const errorRate = new Rate("filtered_search_error_rate");

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m",  target: 10 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    filtered_search_response_time: ["p(95)<2500"],
    filtered_search_error_rate: ["rate<0.01"],
    http_req_duration: ["p(95)<2500"],
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

const MODES = ["meta", "content"];
const AVAILABLE_FILTERS = ["true", "false", undefined];

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const mode = MODES[Math.floor(Math.random() * MODES.length)];
  const available = AVAILABLE_FILTERS[Math.floor(Math.random() * AVAILABLE_FILTERS.length)];

  let url = `http://localhost:3000/search/books?q=${encodeURIComponent(q)}&mode=${mode}`;
  if (available !== undefined) {
    url += `&available=${available}`;
  }

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
    "response time < 2.5s": (r) => r.timings.duration < 2500,
  });

  if (available === "true" && res.status === 200) {
    check(res, {
      "all results are available": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.results.every((hit) => hit.book?.available !== false);
        } catch {
          return false;
        }
      },
    });
  }

  responseTime.add(res.timings.duration);
  errorRate.add(!ok);

  sleep(1);
}