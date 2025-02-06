import GoogleCaptchaWrapper from "@/components/GoogleCaptchaWrapper";
import LoginComponent from "@/components/LoginComponent";
import { getCookiesName } from "@/lib/utils";
import { cookies } from "next/headers";

const LoginPage = () => {
  //set cookies
  const nextCookies = cookies();
  const cookieName = getCookiesName();
  const nextAuthSessionToken = nextCookies.get(cookieName);
  const cookie = `${cookieName}=${nextAuthSessionToken?.value}`;
  return (
    <GoogleCaptchaWrapper>
      <LoginComponent cookie={cookie} />
    </GoogleCaptchaWrapper>
  );
};

export default LoginPage;
