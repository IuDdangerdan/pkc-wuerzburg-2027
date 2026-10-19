import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "PKC · Würzburg 2027",
  description: "Festival-Wiki, Unterkünfte und gemeinsame Anreise",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="stylesheet" href="/style.css?v=car-passengers-1" />
        <link rel="stylesheet" href="/usability.css?v=car-passengers-1" />
        <link rel="stylesheet" href="/festival.css?v=car-passengers-1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
