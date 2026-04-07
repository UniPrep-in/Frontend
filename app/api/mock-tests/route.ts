import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMockTestsBootstrapData,
  type MockTestsBootstrapResponse,
} from "@/lib/mock-tests-data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const response: MockTestsBootstrapResponse = await getMockTestsBootstrapData({
      searchParams: {
        stream: searchParams.get("stream"),
        category: searchParams.get("category"),
        subject: searchParams.get("subject"),
        page: searchParams.get("page"),
      },
      userId: user?.id ?? null,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Mock tests route failed", error);

    try {
      const fallbackResponse: MockTestsBootstrapResponse =
        await getMockTestsBootstrapData({
          searchParams: {
            stream: searchParams.get("stream"),
            category: searchParams.get("category"),
            subject: searchParams.get("subject"),
            page: searchParams.get("page"),
          },
          userId: null,
        });

      return NextResponse.json(fallbackResponse, {
        headers: {
          "x-mock-tests-fallback": "browse",
        },
      });
    } catch (fallbackError) {
      console.error("Mock tests fallback route failed", fallbackError);
      return NextResponse.json(
        { error: "Unable to load mock tests right now." },
        { status: 500 },
      );
    }
  }
}
