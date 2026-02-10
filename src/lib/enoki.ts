import { EnokiFlow } from "@mysten/enoki";

const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_PUBLIC_KEY || "";

export const enokiFlow = new EnokiFlow({
  apiKey: ENOKI_API_KEY,
});
