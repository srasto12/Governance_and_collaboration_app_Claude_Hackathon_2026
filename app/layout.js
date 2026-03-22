import "./globals.css";

export const metadata = {
  title: "CommonGround Cards",
  description: "Persistent civic discussion cards with TinyFish-backed evidence and group insights."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
