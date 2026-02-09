import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - ZewailCalendar",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 9, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>
            By using ZewailCalendar, you agree to these Terms of Service. If you do not agree,
            please do not use the application.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
          <p>
            ZewailCalendar is a free, open-source tool that converts Zewail City university
            schedule HTML pages into ICS calendar files and optionally imports events into
            Google Calendar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Use of the Service</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You must provide your own schedule HTML file from the university registration system.</li>
            <li>Google Calendar integration requires you to authorize access via your Google account.</li>
            <li>You are responsible for the accuracy of the data you upload.</li>
            <li>You agree not to misuse the service or use it for any unlawful purpose.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. No Warranty</h2>
          <p>
            ZewailCalendar is provided &quot;as is&quot; without warranty of any kind, express or implied.
            We do not guarantee that the service will be error-free, uninterrupted, or that
            the generated calendar data will be perfectly accurate.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
          <p>
            In no event shall ZewailCalendar or its contributors be liable for any damages
            arising from the use or inability to use the service, including but not limited to
            missed classes, incorrect schedule data, or loss of data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Google API Usage</h2>
          <p>
            Use of the Google Calendar integration is subject to Google&apos;s Terms of Service.
            ZewailCalendar accesses your Google Calendar only to create events on your behalf
            and does not store or share your Google account information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Open Source</h2>
          <p>
            ZewailCalendar is open-source software. The source code is available on{" "}
            <a
              href="https://github.com/MrFr0g-X/ZewailCalendar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms of Service at any time. Continued use of
            the service after changes constitutes acceptance of the new terms.
          </p>
        </section>
      </div>
    </div>
  );
}
