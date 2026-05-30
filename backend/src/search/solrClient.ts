import "dotenv/config";

export const SOLR_CORE = process.env.SOLR_CORE ?? "books";
const RAW_SOLR_URL = process.env.SOLR_URL ?? "http://localhost:8983/solr";
const SOLR_URL = RAW_SOLR_URL.replace(/\/+$/, "");
export const SOLR_CORE_URL = `${SOLR_URL}/${SOLR_CORE}`;

type SolrParam = string | number | boolean;
type SolrParams = Record<string, SolrParam | SolrParam[] | undefined>;

class SolrError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function buildParams(params: SolrParams = {}): URLSearchParams {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }
    searchParams.set(key, String(value));
  });
  return searchParams;
}

async function solrRequest<T>(
  baseUrl: string,
  path: string,
  params: SolrParams | undefined,
  init?: RequestInit,
): Promise<T> {
  const url = new URL(baseUrl + path);
  const searchParams = buildParams(params);
  if ([...searchParams].length > 0) url.search = searchParams.toString();

  const response = await fetch(url.toString(), init);
  if (!response.ok) {
    const body = await response.text();
    throw new SolrError(
      `Solr request failed (${response.status}) ${url.pathname}`,
      response.status,
      body,
    );
  }
  return (await response.json()) as T;
}

async function solrAdminRequest<T>(
  params: SolrParams,
  init?: RequestInit,
): Promise<T> {
  return solrRequest<T>(
    SOLR_URL,
    "/admin/cores",
    { wt: "json", ...params },
    init,
  );
}

function isIgnorableSchemaError(message: string): boolean {
  return (
    message.includes("already exists") ||
    message.includes("already defined") ||
    message.includes("Duplicate field")
  );
}

function isIgnorableConfigError(message: string): boolean {
  return (
    message.includes("already exists") ||
    message.includes("already defined") ||
    message.includes("RequestHandler")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

async function schemaFieldExists(name: string): Promise<boolean> {
  try {
    await solrRequest(
      SOLR_CORE_URL,
      `/schema/fields/${encodeURIComponent(name)}`,
      {
        wt: "json",
      },
    );
    return true;
  } catch (err) {
    if (err instanceof SolrError && err.status === 404) return false;
    throw err;
  }
}

async function schemaCopyFieldExists(
  source: string,
  dest: string,
): Promise<boolean> {
  try {
    const response = await solrRequest<{
      copyFields?: Array<{ source: string; dest: string }>;
    }>(SOLR_CORE_URL, "/schema/copyfields", { wt: "json" });
    return (response.copyFields ?? []).some(
      (copyField) => copyField.source === source && copyField.dest === dest,
    );
  } catch (err) {
    if (err instanceof SolrError && err.status === 404) return false;
    throw err;
  }
}

async function safeSchemaUpdate(payload: unknown): Promise<void> {
  if (isRecord(payload)) {
    const addField = payload["add-field"];
    if (isRecord(addField) && typeof addField.name === "string") {
      if (await schemaFieldExists(addField.name)) return;
    }

    const addCopyField = payload["add-copy-field"];
    if (
      isRecord(addCopyField) &&
      typeof addCopyField.source === "string" &&
      typeof addCopyField.dest === "string"
    ) {
      if (await schemaCopyFieldExists(addCopyField.source, addCopyField.dest)) {
        return;
      }
    }
  }

  try {
    await solrRequest(
      SOLR_CORE_URL,
      "/schema",
      { wt: "json" },
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  } catch (err) {
    if (err instanceof SolrError && isIgnorableSchemaError(err.body)) return;
    const message = err instanceof Error ? err.message : String(err);
    if (isIgnorableSchemaError(message)) return;
    throw err;
  }
}

async function safeConfigUpdate(payload: unknown): Promise<void> {
  try {
    await solrRequest(
      SOLR_CORE_URL,
      "/config",
      { wt: "json" },
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  } catch (err) {
    if (err instanceof SolrError && isIgnorableConfigError(err.body)) return;
    const message = err instanceof Error ? err.message : String(err);
    if (isIgnorableConfigError(message)) return;
    throw err;
  }
}

async function ensureCore(): Promise<void> {
  const status = await solrAdminRequest<{ status?: Record<string, unknown> }>({
    action: "STATUS",
    core: SOLR_CORE,
  });

  if (status.status && status.status[SOLR_CORE]) return;

  await solrAdminRequest({
    action: "CREATE",
    name: SOLR_CORE,
    configSet: "_default",
  });
}

async function ensureSchema(): Promise<void> {
  const fields = [
    { name: "title", type: "text_general", stored: true },
    { name: "author", type: "text_general", stored: true },
    { name: "isbn", type: "string", stored: true },
    { name: "genre", type: "string", stored: true },
    { name: "year", type: "pint", stored: true, docValues: true },
    { name: "available", type: "boolean", stored: true },
    { name: "description", type: "text_general", stored: true },
    { name: "content", type: "text_general", stored: true },
    {
      name: "meta_text",
      type: "text_general",
      stored: false,
      multiValued: true,
    },
  ];

  for (const field of fields) {
    await safeSchemaUpdate({ "add-field": field });
  }

  const copyFields = [
    { source: "title", dest: "meta_text" },
    { source: "author", dest: "meta_text" },
    { source: "description", dest: "meta_text" },
    { source: "isbn", dest: "meta_text" },
  ];

  for (const copyField of copyFields) {
    await safeSchemaUpdate({ "add-copy-field": copyField });
  }
}

async function ensureSearchHandler(): Promise<void> {
  await safeConfigUpdate({
    "add-searchcomponent": {
      name: "spellcheck",
      class: "solr.SpellCheckComponent",
      spellchecker: [
        {
          name: "meta",
          classname: "solr.DirectSolrSpellChecker",
          field: "meta_text",
          minQueryLength: 3,
          maxEdits: 2,
        },
        {
          name: "content",
          classname: "solr.DirectSolrSpellChecker",
          field: "content",
          minQueryLength: 3,
          maxEdits: 2,
        },
      ],
    },
  });

  await safeConfigUpdate({
    "add-requesthandler": {
      name: "/search",
      class: "solr.SearchHandler",
      components: ["query", "spellcheck"],
    },
  });
}

export async function ensureBooksIndex(): Promise<void> {
  await ensureCore();
  await ensureSchema();
  try {
    await ensureSearchHandler();
  } catch (err) {
    console.warn("[Solr] Spellcheck setup skipped:", err);
  }
}

export async function solrSelect<T>(params: SolrParams): Promise<T> {
  try {
    return await solrRequest<T>(SOLR_CORE_URL, "/search", params);
  } catch (err) {
    if (err instanceof SolrError && err.status === 404) {
      return solrRequest<T>(SOLR_CORE_URL, "/select", params);
    }
    throw err;
  }
}

export async function solrUpdate<T>(
  body: unknown,
  params?: SolrParams,
): Promise<T> {
  return solrRequest<T>(SOLR_CORE_URL, "/update", params, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
