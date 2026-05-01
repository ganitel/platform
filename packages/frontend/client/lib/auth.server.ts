import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { jwt } from "better-auth/plugins/jwt";
import pg from "pg";
import Prelude from "@prelude.so/sdk";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const prelude = new Prelude({ apiToken: process.env.PRELUDE_API_KEY! });

// Demo bypass: set DEMO_PHONE_NUMBER in .env to skip OTP for that number.
// Accepts any code. Never set this in production.
const DEMO_PHONE = process.env.DEMO_PHONE_NUMBER ?? null;

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone }) => {
        if (DEMO_PHONE && phone === DEMO_PHONE) return;
        await prelude.verification.create({
          target: { type: "phone_number", value: phone },
        });
      },
      verifyOTP: async ({ phoneNumber: phone, code }) => {
        if (DEMO_PHONE && phone === DEMO_PHONE) return true;
        const result = await prelude.verification.check({
          target: { type: "phone_number", value: phone },
          code,
        });
        return result.status === "success";
      },
      phoneNumberValidator: (phone) => /^\+\d{7,15}$/.test(phone),
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace("+", "")}@phone.ganitel.local`,
        getTempName: (phone) => phone,
      },
    }),
    jwt({
      jwks: {
        keyPairConfig: { alg: "RS256" },
      },
      jwt: {
        issuer: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
        expirationTime: "1h",
        definePayload: ({ user }) => ({
          email: user.email,
          phoneNumber: (user as Record<string, unknown>).phoneNumber as
            | string
            | null
            | undefined,
          name: user.name,
        }),
      },
    }),
  ],
});

export type Auth = typeof auth;
