const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Academic Structure ---
const faculties = {
  "Computing": {
    depts: ["Software Engineering", "Computer Science", "Cyber Security", "Information Technology"],
    maxLevel: 400
  },
  "Science": {
    depts: ["Biochemistry", "Microbiology", "Plant Biology", "Zoology"],
    maxLevel: 400
  },
  "Physical Sciences": {
    depts: ["Physics", "Chemistry", "Mathematics", "Geology", "Statistics"],
    maxLevel: 400
  },
  "Engineering": {
    depts: ["Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Computer Engineering"],
    maxLevel: 500
  },
  "Humanities": {
    depts: ["English", "History & International Studies", "Arabic", "Hausa", "Islamic Studies"],
    maxLevel: 400
  },
  "Social & Mgt Sciences": {
    depts: ["Accounting", "Business Administration", "Economics", "Mass Communication", "Political Science"],
    maxLevel: 400
  },
  "Basic Medical Sciences": {
    depts: ["Anatomy", "Physiology", "Medical Laboratory Science", "Nursing Science"],
    maxLevel: 500
  },
  "Clinical Sciences": {
    depts: ["Medicine & Surgery", "Dentistry", "Public Health", "Radiography"],
    maxLevel: 600
  },
  "Education": {
    depts: ["Educational Management", "Guidance & Counseling", "Science Education", "Library & Information Science"],
    maxLevel: 400
  },
  "Law": {
    depts: ["Public Law", "Private & Commercial Law", "Islamic Law", "International Law"],
    maxLevel: 500
  }
};

let repCodes = {
  "Software Engineering": "SEN2026",
  "Computer Science": "CSC2026"
};
const DEFAULT_REP_CODE = "REP1234";

let broadcasts = [
  { id: 1, faculty: "Computing", dept: "Software Engineering", level: "200L", notice: "CSC 201 venue relocated to Twin LT.", time: "Today" },
  { id: 2, faculty: "Computing", dept: "ALL", level: "ALL", notice: "Continuous Assessment tests commence next Monday across Twin LT.", time: "Today" }
];

let lectures = [
  { id: 1, faculty: "Computing", dept: "Software Engineering", level: "200L", day: "Mon", startTime: "08:00", endTime: "10:00", course: "SEN 201", venue: "Lab 3" },
  { id: 2, faculty: "Computing", dept: "Software Engineering", level: "200L", day: "Mon", startTime: "10:00", endTime: "12:00", course: "CSC 201", venue: "SLT" },
  { id: 3, faculty: "Computing", dept: "Software Engineering", level: "200L", day: "Tue", startTime: "08:00", endTime: "10:00", course: "MTH 201", venue: "Hall C" },
  { id: 4, faculty: "Engineering", dept: "Electrical Engineering", level: "300L", day: "Mon", startTime: "08:00", endTime: "11:00", course: "EEE 301", venue: "Eng Hall 1" }
];

function getLevelsForDept(deptName) {
  let max = 400;
  for (const f in faculties) {
    if (faculties[f].depts.includes(deptName)) {
      max = faculties[f].maxLevel;
      break;
    }
  }
  const lvls = ["100L", "200L", "300L", "400L"];
  if (max >= 500) lvls.push("500L");
  if (max >= 600) lvls.push("600L");
  return lvls;
}

// Function to resolve back navigation dynamically
function resolveNavigationHistory(rawText) {
  if (!rawText) return [];
  const rawArray = rawText.split('*');
  const stack = [];
  for (const step of rawArray) {
    if (step === '0') {
      stack.pop(); // Pop back to previous screen
    } else if (step !== '') {
      stack.push(step);
    }
  }
  return stack;
}

// --- Admin Mobile Dashboard HTML ---
app.get('/admin', (req, res) => {
  const alertMsg = req.query.msg ? `<div style="padding:10px; background:#d4edda; color:#155724; border-radius:6px; margin-bottom:12px;">${req.query.msg}</div>` : '';
  const errorMsg = req.query.err ? `<div style="padding:10px; background:#f8d7da; color:#721c24; border-radius:6px; margin-bottom:12px;">${req.query.err}</div>` : '';

  const facultyOptions = Object.keys(faculties).map(f => `<option value="${f}">${f}</option>`).join('');

  const lectureRows = lectures.map(l => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 4px;"><b>${l.dept}</b><br><small style="color:#0052cc;">${l.level} | ${l.day}</small></td>
      <td style="padding: 8px 4px;">${l.course}<br><small style="color:#555;">${l.startTime} - ${l.endTime} @ ${l.venue}</small></td>
      <td style="padding: 8px 4px; text-align:right;">
        <form method="POST" action="/admin/lectures/delete" style="margin:0; display:inline;">
          <input type="hidden" name="id" value="${l.id}">
          <input type="password" name="repCode" placeholder="Code" style="width:65px; padding:4px; font-size:11px; margin-bottom:4px;" required><br>
          <button type="submit" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">Delete</button>
        </form>
      </td>
    </tr>
  `).join('');

  const bulletinRows = broadcasts.map(b => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 4px;"><b>${b.dept}</b> (${b.level})<br><small style="color:#555;">${b.notice}</small></td>
      <td style="padding: 8px 4px; text-align:right;">
        <form method="POST" action="/admin/broadcast/delete" style="margin:0; display:inline;">
          <input type="hidden" name="id" value="${b.id}">
          <button type="submit" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">Del</button>
        </form>
      </td>
    </tr>
  `).join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LS Dial Campus Central</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f2f5; margin: 0; padding: 14px; color: #1c1e21; }
        .card { background: #fff; border-radius: 8px; padding: 14px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { font-size: 19px; margin: 0 0 10px 0; color: #0052cc; }
        h2 { font-size: 14px; margin-top: 0; color: #333; border-bottom: 2px solid #e4e6eb; padding-bottom: 4px; }
        label { display: block; font-weight: 600; font-size: 11px; margin-bottom: 3px; color: #555; }
        input, select, textarea { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #ccd0d5; border-radius: 5px; font-size: 13px; margin-bottom: 8px; font-family: inherit; }
        .row { display: flex; gap: 6px; }
        .row > div { flex: 1; }
        button.btn-primary { width: 100%; background: #0052cc; color: white; border: none; padding: 9px; border-radius: 5px; font-size: 14px; font-weight: 600; cursor: pointer; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
        .badge { background: #e3fcef; color: #006644; padding: 3px 6px; border-radius: 4px; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>LS Dial Central <span class="badge">Back Option Active</span></h1>
      ${alertMsg}
      ${errorMsg}

      <!-- Targeted Broadcast Notice -->
      <div class="card">
        <h2>Publish Targeted Bulletin</h2>
        <form method="POST" action="/admin/broadcast">
          <label>Target Faculty:</label>
          <select id="bulletinFacultySelect" name="faculty" onchange="updateBulletinDeptsAndLevels()">
            ${facultyOptions}
          </select>

          <div class="row">
            <div>
              <label>Target Department:</label>
              <select id="bulletinDeptSelect" name="dept"></select>
            </div>
            <div>
              <label>Target Level:</label>
              <select id="bulletinLevelSelect" name="level"></select>
            </div>
          </div>

          <label>Urgent Notice:</label>
          <textarea name="notice" rows="2" placeholder="e.g. Venue shift to Twin LT, CA date..." required></textarea>

          <label>Class Rep Secret Code:</label>
          <input type="password" name="repCode" placeholder="Enter department PIN (Default: REP1234)" required />

          <button type="submit" class="btn-primary">Post Bulletin</button>
        </form>
      </div>

      <!-- Active Bulletins -->
      <div class="card">
        <h2>Active Campus Bulletins</h2>
        <table>
          <thead>
            <tr style="text-align:left; color:#666; font-size:11px; border-bottom:2px solid #ddd;">
              <th>Target & Message</th>
              <th style="text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${bulletinRows.length ? bulletinRows : '<tr><td colspan="2" style="color:#777; padding:8px 0;">No active bulletins.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Add Lecture Form -->
      <div class="card">
        <h2>Add Course Schedule</h2>
        <form method="POST" action="/admin/lectures/add">
          <label>Faculty:</label>
          <select id="facultySelect" name="faculty" onchange="updateDepartmentsAndLevels()">
            ${facultyOptions}
          </select>

          <label>Department:</label>
          <select id="deptSelect" name="dept"></select>
          
          <div class="row">
            <div>
              <label>Level:</label>
              <select id="levelSelect" name="level"></select>
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
              <label>From Time:</label>
              <input type="text" name="startTime" placeholder="08:00" required />
            </div>
            <div>
              <label>To Time:</label>
              <input type="text" name="endTime" placeholder="10:00" required />
            </div>
          </div>

          <div class="row">
            <div>
              <label>Course Code:</label>
              <input type="text" name="course" placeholder="e.g. SEN 201" required />
            </div>
            <div>
              <label>Venue:</label>
              <input type="text" name="venue" placeholder="e.g. Lab 3" required />
            </div>
          </div>

          <label>Class Rep Secret Code:</label>
          <input type="password" name="repCode" placeholder="Enter department PIN (Default: REP1234)" required />

          <button type="submit" class="btn-primary">+ Add Lecture</button>
        </form>
      </div>

      <!-- Timetables List -->
      <div class="card">
        <h2>Active Timetables</h2>
        <table>
          <thead>
            <tr style="text-align:left; color:#666; font-size:11px; border-bottom:2px solid #ddd;">
              <th>Dept & Level</th>
              <th>Course & Time</th>
              <th style="text-align:right;">Auth Delete</th>
            </tr>
          </thead>
          <tbody>
            ${lectureRows}
          </tbody>
        </table>
      </div>

      <script>
        const facultiesData = ${JSON.stringify(faculties)};

        function updateDepartmentsAndLevels() {
          const facultyKey = document.getElementById('facultySelect').value;
          const deptSelect = document.getElementById('deptSelect');
          const levelSelect = document.getElementById('levelSelect');
          const facultyObj = facultiesData[facultyKey];

          deptSelect.innerHTML = '';
          facultyObj.depts.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            deptSelect.appendChild(opt);
          });

          levelSelect.innerHTML = '';
          const levels = ["100L", "200L", "300L", "400L"];
          if (facultyObj.maxLevel >= 500) levels.push("500L");
          if (facultyObj.maxLevel >= 600) levels.push("600L");

          levels.forEach(lvl => {
            const opt = document.createElement('option');
            opt.value = lvl;
            opt.textContent = lvl;
            if (lvl === "200L") opt.selected = true;
            levelSelect.appendChild(opt);
          });
        }

        function updateBulletinDeptsAndLevels() {
          const facultyKey = document.getElementById('bulletinFacultySelect').value;
          const deptSelect = document.getElementById('bulletinDeptSelect');
          const levelSelect = document.getElementById('bulletinLevelSelect');
          const facultyObj = facultiesData[facultyKey];

          deptSelect.innerHTML = '<option value="ALL">Entire Faculty (All Depts)</option>';
          facultyObj.depts.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            deptSelect.appendChild(opt);
          });

          levelSelect.innerHTML = '<option value="ALL">All Levels</option>';
          const levels = ["100L", "200L", "300L", "400L"];
          if (facultyObj.maxLevel >= 500) levels.push("500L");
          if (facultyObj.maxLevel >= 600) levels.push("600L");

          levels.forEach(lvl => {
            const opt = document.createElement('option');
            opt.value = lvl;
            opt.textContent = lvl;
            levelSelect.appendChild(opt);
          });
        }

        updateDepartmentsAndLevels();
        updateBulletinDeptsAndLevels();
      </script>
    </body>
    </html>
  `);
});

// Admin Post Handlers
app.post('/admin/broadcast', (req, res) => {
  const { faculty, dept, level, notice, repCode } = req.body;
  if (dept !== "ALL") {
    const authorizedCode = repCodes[dept] || DEFAULT_REP_CODE;
    if (repCode !== authorizedCode) {
      return res.redirect('/admin?err=Unauthorized:+Invalid+Rep+Code+for+' + encodeURIComponent(dept));
    }
  }
  broadcasts.unshift({
    id: Date.now(),
    faculty,
    dept,
    level,
    notice,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  res.redirect('/admin?msg=Bulletin+posted+successfully');
});

app.post('/admin/broadcast/delete', (req, res) => {
  const idToDelete = parseInt(req.body.id);
  broadcasts = broadcasts.filter(b => b.id !== idToDelete);
  res.redirect('/admin?msg=Bulletin+removed');
});

app.post('/admin/lectures/add', (req, res) => {
  const { faculty, dept, level, day, startTime, endTime, course, venue, repCode } = req.body;
  const authorizedCode = repCodes[dept] || DEFAULT_REP_CODE;
  if (repCode !== authorizedCode) {
    return res.redirect('/admin?err=Unauthorized:+Invalid+Rep+Code+for+' + encodeURIComponent(dept));
  }
  lectures.push({
    id: Date.now(),
    faculty,
    dept,
    level,
    day,
    startTime,
    endTime,
    course,
    venue
  });
  res.redirect('/admin?msg=Lecture+added+successfully');
});

app.post('/admin/lectures/delete', (req, res) => {
  const { id, repCode } = req.body;
  const lecture = lectures.find(l => l.id === parseInt(id));
  if (!lecture) return res.redirect('/admin?err=Lecture+not+found');
  const authorizedCode = repCodes[lecture.dept] || DEFAULT_REP_CODE;
  if (repCode !== authorizedCode) return res.redirect('/admin?err=Unauthorized:+Incorrect+Rep+Code');
  lectures = lectures.filter(l => l.id !== parseInt(id));
  res.redirect('/admin?msg=Lecture+deleted+successfully');
});

// --- Africa's Talking USSD Webhook Engine with "0. Back" ---
app.post('/ussd', (req, res) => {
  const { text } = req.body;
  let response = '';

  // Resolve input back navigation dynamically
  const textArray = resolveNavigationHistory(text);
  const facultyNames = Object.keys(faculties);

  // LEVEL 0: Main Screen
  if (textArray.length === 0) {
    response = `CON Welcome to LS Dial
1. Select Faculty Timetable
2. Urgent Notices & Bulletins
3. Report Venue/Facility Fault`;
  }

  // --- OPTION 1: TIMETABLES ---
  else if (textArray[0] === '1') {
    // 1 -> Faculty List
    if (textArray.length === 1) {
      let facultyList = facultyNames.map((f, i) => `${i + 1}. ${f}`).join('\n');
      response = `CON Select Faculty:\n${facultyList}\n0. Back`;
    }
    // 1 -> Faculty -> Dept List
    else if (textArray.length === 2) {
      const facultyIndex = parseInt(textArray[1]) - 1;
      const selectedFaculty = facultyNames[facultyIndex];
      if (!selectedFaculty) {
        response = `END Invalid Faculty choice.`;
      } else {
        const depts = faculties[selectedFaculty].depts;
        const deptList = depts.map((d, i) => `${i + 1}. ${d}`).join('\n');
        response = `CON ${selectedFaculty} Depts:\n${deptList}\n0. Back`;
      }
    }
    // 1 -> Faculty -> Dept -> Level List
    else if (textArray.length === 3) {
      const facultyIndex = parseInt(textArray[1]) - 1;
      const selectedFaculty = facultyNames[facultyIndex];
      const deptIndex = parseInt(textArray[2]) - 1;
      const selectedDept = faculties[selectedFaculty]?.depts[deptIndex];

      if (!selectedDept) {
        response = `END Invalid Department choice.`;
      } else {
        const validLevels = getLevelsForDept(selectedDept);
        const levelMenu = validLevels.map((lvl, i) => `${i + 1}. ${lvl}`).join('\n');
        response = `CON ${selectedDept}\nSelect Level:\n${levelMenu}\n0. Back`;
      }
    }
    // 1 -> Faculty -> Dept -> Level -> Final Timetable Output
    else if (textArray.length === 4) {
      const facultyIndex = parseInt(textArray[1]) - 1;
      const selectedFaculty = facultyNames[facultyIndex];
      const deptIndex = parseInt(textArray[2]) - 1;
      const selectedDept = faculties[selectedFaculty]?.depts[deptIndex];
      const validLevels = getLevelsForDept(selectedDept);
      const levelIndex = parseInt(textArray[3]) - 1;
      const selectedLevel = validLevels[levelIndex];

      if (!selectedLevel) {
        response = `END Invalid Level choice.`;
      } else {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = days[new Date().getDay()];

        const todayLectures = lectures.filter(l => 
          l.dept === selectedDept && l.level === selectedLevel && l.day === today
        );

        if (todayLectures.length === 0) {
          response = `END [${today} - ${selectedDept} ${selectedLevel}]\nNo classes scheduled today.`;
        } else {
          const scheduleStr = todayLectures.map(l => 
            `${l.startTime}-${l.endTime}: ${l.course} (${l.venue})`
          ).join('\n');
          response = `END [${today} - ${selectedLevel}]\n${scheduleStr}`;
        }
      }
    }
  }

  // --- OPTION 2: NOTICES & BULLETINS ---
  else if (textArray[0] === '2') {
    // 2 -> Faculty List
    if (textArray.length === 1) {
      let facultyList = facultyNames.map((f, i) => `${i + 1}. ${f}`).join('\n');
      response = `CON View Notice For Faculty:\n${facultyList}\n0. Back`;
    }
    // 2 -> Faculty -> Dept List
    else if (textArray.length === 2) {
      const facultyIndex = parseInt(textArray[1]) - 1;
      const selectedFaculty = facultyNames[facultyIndex];
      if (!selectedFaculty) {
        response = `END Invalid Faculty choice.`;
      } else {
        const depts = faculties[selectedFaculty].depts;
        const deptList = depts.map((d, i) => `${i + 1}. ${d}`).join('\n');
        response = `CON ${selectedFaculty}\nSelect Dept:\n${deptList}\n0. Back`;
      }
    }
    // 2 -> Faculty -> Dept -> Level List
    else if (textArray.length === 3) {
      const facultyIndex = parseInt(textArray[1]) - 1;
      const selectedFaculty = facultyNames[facultyIndex];
      const deptIndex = parseInt(textArray[2]) - 1;
      const selectedDept = faculties[selectedFaculty]?.depts[deptIndex];

      if (!selectedDept) {
        response = `END Invalid Department choice.`;
      } else {
        const validLevels = getLevelsForDept(selectedDept);
        const levelMenu = validLevels.map((lvl, i) => `${i + 1}. ${lvl}`).join('\n');
        response = `CON ${selectedDept}\nSelect Level:\n${levelMenu}\n0. Back`;
      }
    }
    // 2 -> Faculty -> Dept -> Level -> Final Bulletin Output
    else if (textArray.length === 4) {
      const facultyIndex = parseInt(textArray[1]) - 1;
      const selectedFaculty = facultyNames[facultyIndex];
      const deptIndex = parseInt(textArray[2]) - 1;
      const selectedDept = faculties[selectedFaculty]?.depts[deptIndex];
      const validLevels = getLevelsForDept(selectedDept);
      const levelIndex = parseInt(textArray[3]) - 1;
      const selectedLevel = validLevels[levelIndex];

      if (!selectedLevel) {
        response = `END Invalid Level choice.`;
      } else {
        const matchingBulletins = broadcasts.filter(b => 
          b.faculty === selectedFaculty &&
          (b.dept === selectedDept || b.dept === "ALL") &&
          (b.level === selectedLevel || b.level === "ALL")
        );

        if (matchingBulletins.length === 0) {
          response = `END [${selectedDept} ${selectedLevel}]\nNo active urgent notices.`;
        } else {
          const bulletinText = matchingBulletins.map(b => `• ${b.notice}`).join('\n');
          response = `END [${selectedLevel} Notices]\n${bulletinText}`;
        }
      }
    }
  }

  // --- OPTION 3: FACILITY FAULT ---
  else if (textArray[0] === '3') {
    if (textArray.length === 1) {
      response = `CON Report Facility Issue:
1. Broken Sockets/Fans
2. Hall Locked / No Key
3. Projector Fault
0. Back`;
    } else if (textArray.length === 2) {
      response = `END Complaint recorded. Works committee alerted.`;
    }
  }

  else {
    response = `END Invalid selection. Please dial again.`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

// Root Healthcheck
app.get('/', (req, res) => {
  res.send('LS Dial Campus Central is running. Visit /admin for management.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LS Dial Campus Central live on port ${PORT}`);
});
