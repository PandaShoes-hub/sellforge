type OpenAITextInput = {
  system: string;
  user: string;
  model?: string;
  maxOutputTokens?: number;
};

type OpenAIStructuredInput<T> = OpenAITextInput & {
  schemaName: string;
  schema: Record<string, unknown>;
  validate: (value: unknown) => T;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

export class OpenAIServiceError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "OpenAIServiceError";
    this.status = status;
  }
}

function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new OpenAIServiceError(
      "OPENAI_API_KEY is not configured",
    );
  }

  return apiKey;
}

function getModel(override?: string) {
  return (
    override?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4.1-mini"
  );
}

function extractOutputText(data: OpenAIResponse) {
  if (data.output_text?.trim()) {
    return data.output_text.trim();
  }

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (
        content.type === "output_text" &&
        content.text?.trim()
      ) {
        return content.text.trim();
      }

      if (
        content.type === "refusal" &&
        content.refusal?.trim()
      ) {
        throw new OpenAIServiceError(content.refusal.trim());
      }
    }
  }

  throw new OpenAIServiceError(
    "OpenAI returned no usable output",
  );
}

async function createResponse(
  body: Record<string, unknown>,
) {
  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    },
  );

  let data: OpenAIResponse;

  try {
    data = (await response.json()) as OpenAIResponse;
  } catch {
    throw new OpenAIServiceError(
      `OpenAI returned an invalid response (${response.status})`,
      response.status,
    );
  }

  if (!response.ok) {
    throw new OpenAIServiceError(
      data.error?.message ||
        `OpenAI request failed (${response.status})`,
      response.status,
    );
  }

  return data;
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function generateOpenAIText({
  system,
  user,
  model,
  maxOutputTokens = 800,
}: OpenAITextInput) {
  const data = await createResponse({
    model: getModel(model),
    store: false,
    max_output_tokens: maxOutputTokens,
    input: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: user,
      },
    ],
  });

  return extractOutputText(data);
}

export async function generateOpenAIStructured<T>({
  system,
  user,
  model,
  maxOutputTokens = 1000,
  schemaName,
  schema,
  validate,
}: OpenAIStructuredInput<T>) {
  const data = await createResponse({
    model: getModel(model),
    store: false,
    max_output_tokens: maxOutputTokens,
    input: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: user,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });

  const raw = extractOutputText(data);

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new OpenAIServiceError(
      "OpenAI returned invalid JSON",
    );
  }

  return validate(parsed);
}
