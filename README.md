# README.md

# ZewailCalendar 🚀

**ZewailCalendar** is a Python-based application that converts university schedule HTML files into a Google Calendar–compatible ICS file. Built with PyQt5 for a modern GUI and BeautifulSoup for HTML parsing, this tool allows users to quickly import their class schedules into their digital calendars.

## ✨ Features

- **HTML Parsing:** Extracts course title, category (Lecture/Lab), meeting times, locations, and term dates.
- **Calendar Generation:** Produces a standards-compliant ICS file with weekly recurring events until the term end date.
- **Modern UI:** A sleek, professional interface built using PyQt5.
- **Cross-Platform:** Runs on Windows, macOS, and Linux (build separately for each platform).

## 📋 Requirements

- Python 3.11+
- [PyQt5](https://pypi.org/project/PyQt5/)
- [BeautifulSoup4](https://pypi.org/project/beautifulsoup4/)
- Other standard libraries (uuid, datetime, etc.)

## 🛠️ Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/MrFr0g-X/ZewailCalendar.git
   cd ZewailCalendar
   ```

2. **Create and activate a virtual environment (optional but recommended):**

   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

## 🚀 Usage

1. **Run the Application:**

   ```bash
   python schedule_converter.py
   ```

2. **Load your saved schedule HTML file**, set the term end date, and click **Generate Calendar**.

3. **Import the generated ICS file into Google Calendar.**

## 📸 Screenshots

![ZewailCalendar Main Window](![image](https://github.com/user-attachments/assets/e56cbc31-2d6e-423b-8983-d6366694a216)
)

## 🔧 Building an Executable

To build a standalone executable using PyInstaller:

```bash
pyinstaller --onefile --windowed --icon=icon.ico schedule_converter.py
```

The executable will be in the `dist/` folder.

Alternatively, **Download the Prebuilt Executable:**

You can simply download the prebuilt `.exe` file from the [Releases Page](https://github.com/MrFr0g-X/ZewailCalendar/releases) and run it directly without needing to set up a development environment.

> **Note:** If Windows Defender flags the executable, you may need to select "Run Anyway" to bypass the warning.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 📧 Contact

For any questions or support, please contact [s-hothifa.mohamed@zewailcity.edu.eg](mailto:s-hothifa.mohamed@zewailcity.edu.eg).
