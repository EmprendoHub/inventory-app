import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import crypto from "crypto";
import axios from "axios";
import prisma from "@/lib/db";

type userType = {
  id: string;
  active: boolean;
  name: string;
  email: string;
  verificationToken: string | null;
  phone: string | null;
  stripeId: string | null;
  password: string | null;
  avatar: string | null;
  loginAttempts: number;
  points: number | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export const options = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      type: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "Enter your user name",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
        recaptcha: { type: "text" },
        honeypot: { type: "text" },
        cookie: { type: "text" },
      },

      async authorize(
        credentials: Record<string, string> | undefined
      ): Promise<userType | null> {
        if (!credentials?.email || !credentials?.password) {
          console.error("Email or password not provided");
          return null;
        }

        const { email, password, recaptcha, honeypot, cookie } = credentials;

        if (honeypot) {
          console.error("Honeypot field is filled, possible bot");
          throw new Error("no bots thank you");
        }
        if (!cookie) {
          console.error("Cookie not provided");
          throw new Error("You are not authorized no no no");
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!secretKey) {
          console.error("reCAPTCHA secret key not set");
          return null;
        }

        const formData = `secret=${secretKey}&response=${recaptcha}`;

        try {
          const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            formData,
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          if (!response.data?.success || response.data?.score <= 0.5) {
            console.error("reCAPTCHA verification failed", response.data);
            return null;
          }

          const user = await prisma.user.findFirst({
            where: { email: email },
          });

          if (!user || !user.password) {
            console.error("User not found or password not set");
            throw new Error("hubo un error al iniciar session");
          }

          const comparePass = await bcrypt.compare(password, user.password);

          if (!comparePass) {
            console.error("Password does not match");
            user.loginAttempts += 1;
            await prisma.user.update({
              where: { id: user.id },
              data: { loginAttempts: user.loginAttempts },
            });

            if (user.loginAttempts >= 3) {
              throw new Error("excediste el limite de intentos");
            }
            throw new Error("hubo un error al iniciar session");
          }

          if (!user.active) {
            console.error("User account is not active");
            throw new Error("verify your email");
          }

          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0 },
          });

          return updatedUser;
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      if (account?.provider == "credentials") {
        return true;
      }
      if (account?.provider == "google") {
        try {
          const existinguser = await prisma.user.findUnique({
            where: {
              email: user.email,
            },
            select: {
              id: true,
              email: true,
              role: true,
              stripeId: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (!existinguser) {
            // Generate a random 64-byte token
            const verificationToken = crypto.randomBytes(64).toString("hex");

            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                verificationToken: verificationToken,
                active: true,
              },
            });

            return true;
          }
          return true;
        } catch (error) {
          console.log("error saving google user", error);
          return false;
        }
      }
    },
    async jwt({
      token,
      user,
      account,
    }: {
      token: any;
      user: any;
      account: any;
    }) {
      if (account?.provider == "google") {
        if (user) {
          const existinguser = await prisma.user.findUnique({
            where: {
              email: user.email,
            },
          });

          if (!existinguser) {
            throw new Error("User not found");
          }

          const currentUser = {
            avatar: { url: user.image },
            id: existinguser.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: existinguser.role,
            createdAt: existinguser.createdAt,
            updatedAt: existinguser.updatedAt,
            accessToken: account.access_token,
          };

          token.accessToken = account.access_token;
          token.id = currentUser.id;
          token.user = currentUser;
        }
      } else {
        if (user) {
          token.accessToken = user.accessToken;
          token.id = user.id;
          token.user = user;

          const updatedUser = await prisma.user.findUnique({
            where: {
              id: token.user.id,
            },
          });

          token.user = updatedUser;
        }
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id;
        session.user.accessToken = token.accessToken;
        session.user.createdAt = token.user.createdAt;
        session.user.role = token.user.role;
        session.user.phone = token.user.phone;
        session.user.stripeId = token.user.stripe_id || token.user.stripeId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/iniciar",
    error: "/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
