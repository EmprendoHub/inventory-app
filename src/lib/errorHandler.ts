import { NextResponse } from "next/server";

// eslint-disable-next-line
export function errorHandler(error: Error, request: any) {
  console.error(`Error occurred: ${error.message}`);
  return NextResponse.json({ error: error.message }, { status: 500 });
}
