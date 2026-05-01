import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { jwt } from "better-auth/plugins/jwt";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function twilioSendOtp(phone: string, code: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;
  const creds = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: from,
        Body: `Votre code Ganitel : ${code}`,
      }).toString(),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio error ${res.status}: ${text}`);
  }
}

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
      sendOTP: async ({ phoneNumber: phone, code }) => {
        await twilioSendOtp(phone, code);
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
