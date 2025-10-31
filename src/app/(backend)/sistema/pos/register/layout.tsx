import { headers } from "next/headers";

export default async function PosRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force no-cache headers for this route
  const headersList = headers();
  
  return (
    <>
      {children}
    </>
  );
}

// Ensure this layout and all children are dynamically rendered
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
