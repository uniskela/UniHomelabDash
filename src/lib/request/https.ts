import { headers } from "next/headers";

export async function isHttpsRequest() {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  return process.env.NODE_ENV === "production"
    ? headerStore.get("x-forwarded-ssl") === "on"
    : false;
}
