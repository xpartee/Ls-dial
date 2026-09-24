const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- In-Memory Dynamic Store ---
let urgentNotice = "Continuous Assessment tests start next Monday. CSC 201 venue relocated to Twin LT.";

let reps = {
  L100: "08012345678 (Ibrahim)",
  L200: "09077427128 (Xparte)",
  L300: "08123456789 (Fatima)"
};

// Structured array of lectures for flexible additions and deletions
let lectures = [
  { id: 1, level: "L100", day: "Mon", time: "08:00 AM", course: "MTH 101", venue: "Hall A" },
  { id: 2, level: "L100", day: "Mon", time: "10:00 AM", course: "PHY 101", venue: "Lab 1" },
  { id: 3, level: "L200", day: "Mon", time: "09:00 AM", course: "SEN 201", venue: "Lab 3" },
  { id: 4, level: "L200", day: "Mon", time: "11:00 AM", course: "CSC 201", venue: "SLT" },
  { id: 5, level: "L200", day: "Tue", time: "08:00 AM", course: "MTH 201", venue: "Hall C" },
  { id: 6, level: "L200", day: "Wed", time: "10:00 AM", course: "CSC 203", venue: "LT 2" },
  { id: 7, level: "L300", day: "Mon", time: "08:00 AM", course: "SEN 301", venue: "SLT" }
];

let reportedIssues = [];

// Helper: Format lectures into plain text for USSD display
function getUSSDSchedule(level, day) {
  const filtered = lectures.filter(l => l.level === level && l.day === day);
  if (filtered.length === 0) return "No lectures scheduled.";
  return filtered.map(l => `${l.time} - ${l.course} (${l.venue})`).join('\n');
}

// --- Admin Mobile Dashboard HTML ---
app.get('/admin', (req, res) => {
  // Generate lecture items with Delete buttons
  const lectureRows = lectures.map(l => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 4px;"><b>${l.level}</b> | ${l.day}</td>
      <td style="padding: 8px 4px;">${l.course}<br><small style="color:#666;">${l.time} @ ${l.venue}</small></td>
      <td style="padding: 8px 4px; text-align:right;">
        <form method="POST" action="/admin/lectures/delete" style="margin:0; display:inline;">
          <input type="hidden" name="id" value="${l.id}">
          <button type="submit" style="background:#dc3545; color:white; border:none; padding:5px 9px; border-radius:4px; font-size:12px; cursor:pointer;">Del</button>
        </form>
      </td>
    </tr>
  `).join('');

  // Generate issues list
  const issuesList = reportedIssues.length === 0 
    ? "<p style='color:#777; font-size:13px;'>No unresolved facility issues.</p>" 
    : reportedIssues.map((issue, idx) => `
        <li style="margin-bottom:6px; font-size:13px;">${issue}</li>
      `).join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LS Dial Campus Hub</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f2f5; margin: 0; padding: 16px; color: #1c1e21; }
        .card { background: #fff; border-radius: 10px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; margin: 0 0 12px 0; color: #0052cc; display: flex; justify-content: space-between; align-items: center; }
        h2 { font-size: 15px; margin-top: 0; color: #333; border-bottom: 2px solid #e4e6eb; padding-bottom: 6px; }
        label { display: block; font-weight: 600; font-size: 12px; margin-bottom: 4px; color: #555; }
        input, select, textarea { width: 100%; box-sizing: border-box; padding: 9px; border: 1px solid #ccd0d5; border-radius: 6px; font-size: 13px; margin-bottom: 10px; font-family: inherit; }
        .row { display: flex; gap: 8px; }
        .row > div { flex: 1; }
        button.btn-primary { width: 100%; background: #0052cc; color: white; border: none; padding: 10px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
        button.btn-primary:active { background: #003d99; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
        .badge { background: #e3fcef; color: #006644; padding: 3px 7px; border-radius: 4px; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>LS Dial Hub <span class="badge">Live</span></h1>

      <!-- Urgent Broadcast Notice -->
      <div class="card">
        <h2>Urgent Campus Broadcast</h2>
        <form method="POST" action="/admin/notice">
          <label>Broadcast Text (dialed via option 2):</label>
          <textarea name="notice" rows="2" required>${urgentNotice}</textarea>
          <button type="submit" class="btn-primary">Push Update</button>
        </form>
      </div>

      <!-- Add New Lecture -->
      <div class="card">
        <h2>Add Lecture to Timetable</h2>
        <form method="POST" action="/admin/lectures/add">
          <div class="row">
            <div>
              <label>Level:</label>
              <select name="level">
                <option value="L100">100L</option>
                <option value="L200" selected>200L</option>
                <option value="L300">300L</option>
              </select>
            </div>
            <div>
              <label>Day:</label>
              <select name="day">
                <option value="Mon">Mon</option>
                <option value="Tue">Tue</option>
                <option value="Wed">Wed</option>
                <option value="Thu">Thu</option>
                <option value="Fri">Fri</option>
              </select>
            </div>
          </div>
          <div class="row">
            <div>
              <label>Course Code:</label>
              <input type="text" name="course" placeholder="e.g. SEN 201" required />
            </div>
            <div>
              <label>Time:</label>
              <input type="text" name="time" placeholder="e.g. 09:00 AM" required />
            </div>
          </div>
          <label>Venue:</label>
          <input type="text" name="venue" placeholder="e.g. Lab 3 / Twin LT" required />
          <button type="submit" class="btn-primary">+ Add Course</button>
        </form>
      </div>

      <!-- Current Timetable List with Delete -->
      <div class="card">
        <h2>Manage Existing Timetables</h2>
        <table>
          <thead>
            <tr style="text-align:left; color:#666; font-size:12px; border-bottom:2px solid #ddd;">
              <th>Target</th>
              <th>Details</th>
              <th style="text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${lectureRows}
          </tbody>
        </table>
      </div>

      <!-- Class Rep Contacts -->
      <div class="card">
        <h2>Update Rep Directory</h2>
        <form method="POST" action="/admin/reps">
          <label>Level 100 Rep:</label>
          <input type="text" name="l100" value="${reps.L100}" required />
          <label>Level 200 Rep:</label>
          <input type="text" name="l200" value="${reps.L200}" required />
          <label>Level 300 Rep:</label>
          <input type="text" name="l300" value="${reps.L300}" required />
          <button type="submit" class="btn-primary">Update Directory</button>
        </form>
      </div>

      <!-- Incident Reports -->
      <div class="card">
        <h2>Facility Fault Reports</h2>
        <ul>${issuesList}</ul>
        ${reportedIssues.length > 0 ? `
          <form method="POST" action="/admin/issues/clear" style="margin-top:10px;">
            <button type="submit" style="background:#6c757d; color:white; border:none; padding:8px; width:100%; border-radius:6px; font-size:13px; cursor:pointer;">Clear All Reports</button>
          </form>
        ` : ''}
      </div>
    </body>
    </html>
  `);
});

// --- Admin Actions Handlers ---
app.post('/admin/notice', (req, res) => {
  urgentNotice = req.body.notice;
  res.redirect('/admin');
});

app.post('/admin/lectures/add', (req, res) => {
  const { level, day, course, time, venue } = req.body;
  lectures.push({
    id: Date.now(),
    level,
    day,
    course,
    time,
    venue
  });
  res.redirect('/admin');
});

app.post('/admin/lectures/delete', (req, res) => {
  const idToDelete = parseInt(req.body.id);
  lectures = lectures.filter(l => l.id !== idToDelete);
  res.redirect('/admin');
});

app.post('/admin/reps', (req, res) => {
  reps.L100 = req.body.l100;
  reps.L200 = req.body.l200;
  reps.L300 = req.body.l300;
  res.redirect('/admin');
});

app.post('/admin/issues/clear', (req, res) => {
  reportedIssues = [];
  res.redirect('/admin');
});

// --- Africa's Talking USSD Webhook Handler ---
app.post('/ussd', (req, res) => {
  const { text } = req.body;
  let response = '';

  const textArray = text ? text.split('*') : [];

  // LEVEL 0: Main Menu
  if (!text || text === '') {
    response = `CON Welcome to LS Dial
1. Lecture Timetable
2. Urgent Notices
3. Class Rep Contact
4. Report Facility Fault`;
  }

  // LEVEL 1: Select Level
  else if (text === '1') {
    response = `CON Select Your Level:
1. Level 100
2. Level 200
3. Level 300`;
  }

  // LEVEL 2: Select Schedule Option
  else if (textArray[0] === '1' && textArray.length === 2) {
    const levelMap = { '1': '100L', '2': '200L', '3': '300L' };
    const level = levelMap[textArray[1]];

    if (!level) {
      response = `END Invalid Level selected.`;
    } else {
      response = `CON ${level} Timetable:
1. Today's Lectures
2. Mon - Fri Overview`;
    }
  }

  // LEVEL 3: View Selected Schedule
  else if (textArray[0] === '1' && textArray.length === 3) {
    const levelKey = textArray[1] === '1' ? 'L100' : textArray[1] === '2' ? 'L200' : 'L300';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = days[new Date().getDay()];

    if (textArray[2] === '1') {
      const scheduleText = getUSSDSchedule(levelKey, currentDay);
      response = `END [${currentDay} - ${levelKey}]\n${scheduleText}`;
    } else if (textArray[2] === '2') {
      const monCount = lectures.filter(l => l.level === levelKey && l.day === 'Mon').length;
      const tueCount = lectures.filter(l => l.level === levelKey && l.day === 'Tue').length;
      const wedCount = lectures.filter(l => l.level === levelKey && l.day === 'Wed').length;
      response = `END [${levelKey} Week Summary]
Mon: ${monCount} Classes
Tue: ${tueCount} Classes
Wed: ${wedCount} Classes
(Check web panel for venues)`;
    } else {
      response = `END Invalid choice.`;
    }
  }

  // LEVEL 1: Urgent Campus Notices
  else if (text === '2') {
    response = `END [Campus Notice]\n${urgentNotice}`;
  }

  // LEVEL 1: Class Rep Directory
  else if (text === '3') {
    response = `END [Rep Contacts]
L100: ${reps.L100}
L200: ${reps.L200}
L300: ${reps.L300}`;
  }

  // LEVEL 1: Facility Fault Reporting Menu
  else if (text === '4') {
    response = `CON Report Facility Issue:
1. Broken Sockets/Fans
2. Hall Locked / No Key
3. Projector Fault`;
  }

  // LEVEL 2: Confirmation & Save Issue to Feed
  else if (textArray[0] === '4' && textArray.length === 2) {
    const issueMap = { '1': 'Broken Sockets/Fans', '2': 'Hall Locked / No Key', '3': 'Projector Fault' };
    const issueLabel = issueMap[textArray[1]] || 'Unspecified Fault';
    reportedIssues.unshift(`${issueLabel} (${new Date().toLocaleTimeString()})`);
    response = `END Fault reported. Department works committee has been alerted.`;
  }

  else {
    response = `END Invalid selection. Please dial again.`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

// Root Healthcheck
app.get('/', (req, res) => {
  res.send('LS Dial API running. Access Admin at /admin');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LS Dial server active on port ${PORT}`);
});
