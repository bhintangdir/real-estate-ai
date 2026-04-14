import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { ThemeProvider } from '@/context/ThemeContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Brain CRM | Real Estate Intel & Command Center",
  description: "Next-generation property management and CRM powered by autonomous AI intelligence, omnichannel communication, and advanced lead discovery.",
  keywords: ["CRM", "AI Brain", "Real Estate", "Omnichannel", "Lead Management"],
};

import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
