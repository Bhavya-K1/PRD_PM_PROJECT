import "./globals.css";

export const metadata = {
  title: "PRD Copilot",
  description: "Generate structured PRDs from early feature ideas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
