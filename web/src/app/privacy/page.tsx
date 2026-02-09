import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - ZewailCalendar",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 9, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Overview</h2>
          <p>
            ZewailCalendar is a schedule conversion tool that helps Zewail City university students
            convert their class schedules into calendar files. Your privacy is important to us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Data We Collect</h2>
          <p>
            <strong>Schedule Data:</strong> When you upload your schedule HTML file, all parsing
            happens entirely in your browser. No schedule data is sent to or stored on our servers.
          </p>
          <p className="mt-2">
            <strong>Google Account Data:</strong> If you choose to use the Google Calendar integration,
            we request access to your Google account via OAuth 2.0. We only request the
            &quot;calendar.events&quot; scope to create events on your primary calendar. We access your
            email and profile name solely for authentication purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Schedule HTML files are processed locally in your browser and never uploaded.</li>
            <li>Google OAuth tokens are used only to create calendar events on your behalf.</li>
            <li>We do not store, share, or sell any personal data.</li>
            <li>We do not use cookies for tracking or analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Google API Services</h2>
          <p>
            ZewailCalendar&apos;s use and transfer of information received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Retention</h2>
          <p>
            We do not retain any user data. OAuth session tokens are stored temporarily in your browser
            and are cleared when you sign out or when the session expires.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Third-Party Services</h2>
          <p>
            We use Google OAuth for authentication and Google Calendar API for event creation.
            Please refer to{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google&apos;s Privacy Policy
            </a>{" "}
            for information on how Google handles your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please open an issue on our{" "}
            <a
              href="https://github.com/MrFr0g-X/ZewailCalendar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              GitHub repository
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
