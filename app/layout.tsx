import "./globals.css";

export const metadata = {
  title: "Dare Devil",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
