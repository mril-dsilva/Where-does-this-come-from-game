import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME ?? "Suggestions";

export async function POST(request: Request) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json(
      { error: "Server misconfiguration: Airtable credentials missing." },
      { status: 500 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("item_name" in body) ||
    !("category" in body) ||
    !("country" in body)
  ) {
    return NextResponse.json(
      { error: "Missing required fields: item_name, category, country." },
      { status: 400 },
    );
  }

  const { item_name, category, country, fun_fact, confidence } = body as Record<
    string,
    string
  >;

  const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  let response: Response;

  try {
    response = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          item_name: String(item_name).trim(),
          category: String(category).trim(),
          country: String(country).trim(),
          fun_fact: String(fun_fact ?? "").trim() || "(none provided)",
          confidence: String(confidence ?? "").trim() || "(not specified)",
          source: "user",
          submitted_at: new Date().toISOString(),
          status: "Pending",
        },
      }),
    });
  } catch (err) {
    console.error("Airtable fetch failed:", err);
    return NextResponse.json(
      { error: "Could not reach Airtable." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Airtable rejected request:", response.status, errorText);
    return NextResponse.json(
      { error: "Airtable rejected the submission.", detail: errorText },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
