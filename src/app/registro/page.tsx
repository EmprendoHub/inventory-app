import GoogleCaptchaWrapper from "@/components/GoogleCaptchaWrapper";
import RegisterFormComponent from "@/components/RegisterComponent";
import { getCookiesName } from "@/lib/utils";
import { cookies } from "next/headers";

const RegisterPage = () => {
  //set cookies
  const nextCookies = cookies();
  const cookieName = getCookiesName();
  const nextAuthSessionToken = nextCookies.get(cookieName);
  const cookie = `${cookieName}=${nextAuthSessionToken?.value}`;
  return (
    <GoogleCaptchaWrapper>
      <RegisterFormComponent cookie={cookie} />
    </GoogleCaptchaWrapper>
  );
};
export default RegisterPage;
