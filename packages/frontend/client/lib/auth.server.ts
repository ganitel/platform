import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { jwt } from "better-auth/plugins/jwt";
import pg from "pg";
import Prelude from "@prelude.so/sdk";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const prelude = new Prelude({ apiToken: process.env.PRELUDE_API_KEY! });

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
      // Prelude generates and owns the OTP — no custom code needed.
      sendOTP: async ({ phoneNumber: phone }) => {
        await prelude.verification.create({
          target: { type: "phone_number", value: phone },
        });
      },
      // Delegate validation to Prelude instead of the verification table.
      verifyOTP: async ({ phoneNumber: phone, code }) => {
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
