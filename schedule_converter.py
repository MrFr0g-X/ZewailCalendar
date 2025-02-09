import sys
import uuid
import datetime
import os.path
from typing import List, Optional, Dict
from dataclasses import dataclass
from bs4 import BeautifulSoup

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QTextEdit, QLabel, QFileDialog, QMessageBox, QDateEdit
)
from PyQt5.QtCore import QDate, Qt
from PyQt5.QtGui import QIcon

@dataclass
class ScheduleEvent:
    """Data class representing a scheduled event with all necessary details."""
    title: str
    category: str
    day: str
    start_time: str
    end_time: str
    location: str
    date: datetime.date

# ---------------------------------------------------
# Helper: Scan elements following a schedule button
# ---------------------------------------------------
def get_schedule_item_info(button):
    """
    Starting from the given button element (a BeautifulSoup tag), iterate over subsequent
    elements (using .next_elements) until an <hr> is encountered. This collects:
      - The <p> text that starts with "Subtype:" (contains subtype and section info)
      - The <p> text that starts with "Duration:" (gives term start and end dates)
      - The meeting container div (whose class contains "WithWidth-ScheduleItem--meeting")
        which should include three <p> tags: meeting time, meeting day, and location.
    Returns a dictionary with these values.
    """
    info = {
        "subtype_section": None,
        "duration": None,
        "meeting_time": None,
        "meeting_day": None,
        "location": None,
    }
    for element in button.next_elements:
        if hasattr(element, "name") and element.name == "hr":
            break
        if hasattr(element, "get_text"):
            text = element.get_text(strip=True)
            if text.startswith("Subtype:"):
                info["subtype_section"] = text
            elif text.startswith("Duration:"):
                info["duration"] = text
            # Look for the meeting container by checking for a class substring.
            if (hasattr(element, "name") and element.name == "div" and
                element.has_attr("class") and
                any("WithWidth-ScheduleItem--meeting" in cls for cls in element["class"])):
                p_list = element.find_all("p")
                if len(p_list) >= 3:
                    info["meeting_time"] = p_list[0].get_text(strip=True)
                    info["meeting_day"] = p_list[1].get_text(strip=True)
                    info["location"] = p_list[2].get_text(strip=True)
    return info

# ---------------------------------------------------
# Parse the HTML schedule to extract event information
# ---------------------------------------------------
def parse_schedule(html_content):
    """
    Parses the saved HTML content to extract schedule events.
    It finds <button> elements whose id starts with "btnItemTitle_section_".
    For each such button it extracts:
      - Course title (from the button text)
      - Subtype/section info (to decide if it’s a Lab or Lecture)
      - Term duration (e.g., "Duration: 1/26/2025 - 6/6/2025")
      - Meeting details (time, day, and location)
    The first occurrence date is computed by advancing from the term start date
    until the weekday matches the meeting day.
    """
    events = []
    soup = BeautifulSoup(html_content, 'html.parser')
    buttons = soup.find_all("button", id=lambda x: x and x.startswith("btnItemTitle_section_"))
    
    for button in buttons:
        title = button.get_text(strip=True)
        info = get_schedule_item_info(button)
        subtype_section = info.get("subtype_section", "")
        duration_text = info.get("duration", "")
        meeting_time_text = info.get("meeting_time", "")
        meeting_day = info.get("meeting_day", "")
        location = info.get("location", "")
        
        # Parse the duration string (e.g., "Duration: 1/26/2025 - 6/6/2025")
        term_start = term_end = None
        if duration_text:
            duration = duration_text.replace("Duration:", "").strip()
            dates = duration.split("-")
            if len(dates) == 2:
                try:
                    term_start = datetime.datetime.strptime(dates[0].strip(), "%m/%d/%Y").date()
                    term_end = datetime.datetime.strptime(dates[1].strip(), "%m/%d/%Y").date()
                except ValueError as e:
                    print("Error parsing duration:", e)
        
        # Parse the meeting time (e.g., "1:10 PM - 4:00 PM")
        start_time_str = ""
        end_time_str = ""
        if meeting_time_text:
            times = meeting_time_text.split("-")
            if len(times) == 2:
                try:
                    start_time_dt = datetime.datetime.strptime(times[0].strip(), "%I:%M %p")
                    end_time_dt = datetime.datetime.strptime(times[1].strip(), "%I:%M %p")
                    start_time_str = start_time_dt.strftime("%H:%M")
                    end_time_str = end_time_dt.strftime("%H:%M")
                except ValueError as e:
                    print("Error parsing meeting time:", e)
        
        # Determine event category based on the subtype text.
        category = ""
        if subtype_section:
            if "Laboratory" in subtype_section:
                category = "Lab"
            elif "Lecture" in subtype_section:
                category = "Lecture"
        
        # Compute the first occurrence date from term_start and meeting day.
        first_occurrence = None
        if term_start and meeting_day:
            day_map = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, 
                       "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}
            meeting_day_num = day_map.get(meeting_day, None)
            if meeting_day_num is not None:
                first_occurrence = term_start
                while first_occurrence.weekday() != meeting_day_num:
                    first_occurrence += datetime.timedelta(days=1)
        
        if first_occurrence:
            event = ScheduleEvent(
                title=title,
                category=category,
                day=meeting_day,
                start_time=start_time_str,
                end_time=end_time_str,
                location=location,
                date=first_occurrence
            )
            events.append(event)
    return events

# ---------------------------------------------------
# Generate an ICS file from the list of events.
# ---------------------------------------------------
def generate_ics(events, term_end_date):
    """
    Given a list of ScheduleEvent objects and the overall term end date,
    generate an ICS (iCalendar) file string where each event recurs weekly until term_end_date.
    """
    lines = []
    lines.append("BEGIN:VCALENDAR")
    lines.append("VERSION:2.0")
    lines.append("PRODID:-//University Schedule Converter//EN")
    
    for event in events:
        uid = str(uuid.uuid4())
        dtstamp = datetime.datetime.now().strftime("%Y%m%dT%H%M%SZ")
        
        try:
            start_dt = datetime.datetime.combine(
                event.date,
                datetime.datetime.strptime(event.start_time, "%H:%M").time()
            )
            end_dt = datetime.datetime.combine(
                event.date,
                datetime.datetime.strptime(event.end_time, "%H:%M").time()
            )
        except ValueError:
            QMessageBox.critical(None, "Time Format Error", "Time format should be HH:MM (24-hour format).")
            return None
        
        dtstart = start_dt.strftime("%Y%m%dT%H%M%S")
        dtend = end_dt.strftime("%Y%m%dT%H%M%S")
        
        until_dt = datetime.datetime.combine(term_end_date, datetime.time(23, 59, 59))
        rrule_until = until_dt.strftime("%Y%m%dT%H%M%SZ")
        rrule = f"RRULE:FREQ=WEEKLY;UNTIL={rrule_until}"
        
        lines.append("BEGIN:VEVENT")
        lines.append(f"UID:{uid}")
        lines.append(f"DTSTAMP:{dtstamp}")
        lines.append(f"DTSTART:{dtstart}")
        lines.append(f"DTEND:{dtend}")
        lines.append(f"SUMMARY:{event.title} ({event.category})")
        lines.append(f"LOCATION:{event.location}")
        lines.append(rrule)
        lines.append("END:VEVENT")
    
    lines.append("END:VCALENDAR")
    return "\njoin(lines)"

class ScheduleConverterWindow(QMainWindow):
    """Main window class for the ZewailCalendar application."""
    
    def __init__(self):
        """Initialize the main window and setup UI components."""
        super().__init__()
        self.html_content: Optional[str] = None
        self.events: List[ScheduleEvent] = []
        
        # Setup window properties
        self.setWindowTitle("ZewailCalendar")
        self.resize(800, 600)
        
        # Set window icon
        icon_path = os.path.join(os.path.dirname(__file__), 'icon.ico')
        if os.path.exists(icon_path):
            self.setWindowIcon(QIcon(icon_path))
        
        self.setup_ui()
        self.apply_styles()
    
    def setup_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Add main container with margins
        container = QWidget()
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(15)
        container.setLayout(main_layout)
        
        # Header section
        header = QLabel("Schedule Converter")
        header.setObjectName("header")
        main_layout.addWidget(header)
        
        # Load HTML File button with icon
        self.load_button = QPushButton("  Load Schedule HTML File")
        self.load_button.setObjectName("primary-button")
        main_layout.addWidget(self.load_button)
        
        # Parsed events display
        events_container = QWidget()
        events_container.setObjectName("events-container")
        events_layout = QVBoxLayout()
        events_label = QLabel("Parsed Events")
        events_label.setObjectName("section-header")
        events_layout.addWidget(events_label)
        
        self.text_area = QTextEdit()
        self.text_area.setReadOnly(True)
        events_layout.addWidget(self.text_area)
        events_container.setLayout(events_layout)
        main_layout.addWidget(events_container)
        
        # Date selection container
        date_container = QWidget()
        date_container.setObjectName("date-container")
        date_layout = QHBoxLayout()
        date_label = QLabel("Term End Date:")
        date_label.setObjectName("input-label")
        date_layout.addWidget(date_label)
        
        self.term_date_edit = QDateEdit()
        self.term_date_edit.setDisplayFormat("yyyy-MM-dd")
        self.term_date_edit.setDate(QDate(2025, 5, 17))
        self.term_date_edit.setCalendarPopup(True)
        date_layout.addWidget(self.term_date_edit)
        date_container.setLayout(date_layout)
        main_layout.addWidget(date_container)
        
        # Generate button
        self.generate_button = QPushButton("  Generate Calendar")
        self.generate_button.setObjectName("primary-button")
        main_layout.addWidget(self.generate_button)
        
        # Set up the main layout
        layout = QVBoxLayout()
        layout.addWidget(container)
        central_widget.setLayout(layout)
        
        # Connect buttons
        self.load_button.clicked.connect(self.load_file)
        self.generate_button.clicked.connect(self.generate_file)

    def apply_styles(self):
        """Apply professional styling to the application."""
        style_sheet = """
            QWidget {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 14px;
                color: #2c3e50;
            }
            
            QMainWindow {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                                          stop:0 #f5f7fa, stop:1 #e8ecf1);
            }
            
            #header {
                font-size: 28px;
                font-weight: bold;
                color: #2c3e50;
                padding: 15px 0;
                margin-bottom: 10px;
            }
            
            #primary-button {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
                                          stop:0 #2980b9, stop:1 #2472a4);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 12px 20px;
                font-weight: bold;
                min-height: 40px;
                margin: 5px 0;
            }
            
            #primary-button:hover {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
                                          stop:0 #3498db, stop:1 #2980b9);
            }
            
            #primary-button:pressed {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
                                          stop:0 #246994, stop:1 #1f5d84);
            }
            
            QTextEdit {
                background-color: white;
                border: 2px solid #e8ecf1;
                border-radius: 8px;
                padding: 12px;
                font-size: 13px;
                line-height: 1.4;
            }
            
            #events-container, #date-container {
                background-color: white;
                border-radius: 8px;
                padding: 20px;
                margin: 10px 0;
                border: 1px solid #e8ecf1;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            #section-header {
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 15px;
            }
            
            QDateEdit {
                background-color: white;
                border: 2px solid #e8ecf1;
                border-radius: 6px;
                padding: 8px;
                min-width: 150px;
            }
            
            #input-label {
                font-weight: bold;
                margin-right: 15px;
                font-size: 15px;
            }
            
            QMessageBox {
                background-color: white;
            }
            
            QMessageBox QPushButton {
                background-color: #2980b9;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                min-width: 100px;
            }
            
            QMessageBox QPushButton:hover {
                background-color: #3498db;
            }
        """
        self.setStyleSheet(style_sheet)

    def load_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Open HTML File", "", "HTML Files (*.html *.htm)")
        if file_path:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    self.html_content = f.read()
                self.events = parse_schedule(self.html_content)
                self.display_events()
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to load file:\n{e}")
    
    def display_events(self):
        """Display parsed events in a formatted way."""
        self.text_area.clear()
        if not self.events:
            self.text_area.append("No events found in the schedule.")
            return

        self.text_area.append("📅 Parsed Schedule Events:\n")
        for idx, event in enumerate(self.events, 1):
            self.text_area.append(f"Event #{idx}")
            self.text_area.append(f"━━━━━━━━━━━━━━━━━━━━━━")
            self.text_area.append(f"📚 Title: {event.title}")
            self.text_area.append(f"📋 Category: {event.category}")
            self.text_area.append(f"📅 Meeting Day: {event.day}")
            self.text_area.append(f"⏰ Time: {event.start_time} - {event.end_time}")
            self.text_area.append(f"📍 Location: {event.location}")
            self.text_area.append(f"🗓 First Occurrence: {event.date}")
            self.text_area.append("\n")
    
    def generate_file(self):
        term_end_qdate = self.term_date_edit.date()
        term_end_date = datetime.date(term_end_qdate.year(), term_end_qdate.month(), term_end_qdate.day())
        
        if not self.events:
            QMessageBox.warning(self, "No Events", "No events loaded to generate a calendar file.")
            return
        
        ics_content = generate_ics(self.events, term_end_date)
        if ics_content:
            save_path, _ = QFileDialog.getSaveFileName(self, "Save ICS File", "", "ICS Files (*.ics)")
            if save_path:
                try:
                    with open(save_path, "w", encoding="utf-8") as f:
                        f.write(ics_content)
                    QMessageBox.information(self, "Success", f"Calendar file saved to:\n{save_path}")
                except Exception as e:
                    QMessageBox.critical(self, "Error", f"Failed to save file:\n{e}")

def main():
    """Main entry point of the application."""
    app = QApplication(sys.argv)
    app.setStyle('Fusion')  # Use Fusion style for a modern look
    window = ScheduleConverterWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
