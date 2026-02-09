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

![Web App Screenshot](https://i.imgur.com/MZyAr5P.png)

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

## How to Use

### Step 1: View Schedule as List
Navigate to your schedule page and switch to list view.

![Schedule List View](https://i.imgur.com/CFNe5Bb.png)

### Step 2: Save the Schedule HTML
Right-click on the schedule page and choose **Save As**. Save the file as an HTML document.

![Save HTML](https://i.imgur.com/EdYPZ2Z.png)

### Step 3: Upload to ZewailCalendar
- **Web App:** Go to [zewailcalendar.vercel.app](https://zewailcalendar.vercel.app) and upload the HTML file
- **Desktop App:** Open `schedule_converter.py` and load the HTML file

### Step 4: Import to Google Calendar

**Using Web App (Recommended):**
1. Click **"Send to Google Calendar"**
2. Sign in with your Google account
3. Events are automatically imported

**Manual ICS Import:**
1. Generate and download the ICS file
2. Open [Google Calendar](https://calendar.google.com)
3. Click the **gear icon** → **Settings**
4. Go to **Import & Export**
5. Click **Select file from your computer**, choose the ICS file, and click **Import**

---

## Screenshots

### Web App
![Web App Screenshot](https://i.imgur.com/MZyAr5P.png)

### Desktop App
![Desktop Main Window](https://i.imgur.com/ICIxsQs.png)

---

## License

[MIT License](LICENSE)
