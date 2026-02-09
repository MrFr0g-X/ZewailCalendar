# ZewailCalendar

Convert your Zewail City university schedule into calendar events. Available as a desktop app or web app.

---

## Web App

**Live:** [zewailcalendar.vercel.app](https://zewailcalendar.vercel.app)

Upload your saved schedule HTML and export to ICS or directly import into Google Calendar with one click.

**Features:**
- HTML schedule parsing with auto-detection of term dates and course details
- ICS calendar export compatible with any calendar app
- **Google Calendar OAuth integration** — sign in and import events directly without manual ICS upload
- Glassmorphism UI with responsive design

**Tech stack:** Next.js 16, NextAuth.js, Google Calendar API, Tailwind CSS, Framer Motion

See [`web/README.md`](web/README.md) for local development setup.

---

## Desktop App (Python)

A PyQt5 desktop application that generates ICS files from Zewail schedule HTML.

**Download:** [Releases](https://github.com/MrFr0g-X/ZewailCalendar/releases)

### Requirements

- Python 3.11+
- PyQt5, BeautifulSoup4

### Installation

```bash
git clone https://github.com/MrFr0g-X/ZewailCalendar.git
cd ZewailCalendar
pip install -r requirements.txt
python schedule_converter.py
```

### Building Executable

```bash
pyinstaller --onefile --windowed --icon=icon.ico schedule_converter.py
```

Output in `dist/` folder.

---

## Screenshots

### Web App
![Web App](https://i.imgur.com/placeholder.png)

### Desktop App
![Desktop Main Window](https://i.imgur.com/ICIxsQs.png)

---

## License

[MIT License](LICENSE)
