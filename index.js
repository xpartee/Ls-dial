const express = require('express');
const app = express();

// Middleware to parse form data sent by Africa's Talking webhooks
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sample Timetable Data for Northwest University
const schedule = {
  L100: {
    Mon: "08:00 AM - MTH 101 (Hall A)\n10:00 AM - PHY 101 (Lab 1)",
    Tue: "09:00 AM - CHM 101 (Hall B)\n02:00 PM - GST 101 (Auditorium)",
    Wed: "10:00 AM - CSC 101 (LT 1)",
    Thu: "08:00 AM - MTH 101 (Hall A)\n11:00 AM - PHY 103 (Lab 2)",
    Fri: "09:00 AM - CSC 101 (LT 1)\n02:00 PM - GST 103 (Auditorium)"
  },
  L200: {
    Mon: "09:00 AM - SEN 201 (Lab 3)\n11:00 AM - CSC 201 (SLT)",
    Tue: "08:00 AM - MTH 201 (Hall C)\n01:00 PM - SEN 203 (Lab 2)",
    Wed: "10:00 AM - CSC 203 (LT 2)\n02:00 PM - GST 211 (Auditorium)",
    Thu: "09:00 AM - SEN 201 (Lab 3)\n12:00 PM - CSC 205 (SLT)",
    Fri: "10:00 AM - MTH 201 (Hall C)"
  },
  L300: {
    Mon: "08:00 AM - SEN 301 (SLT)\n10:00 AM - CSC 301 (Lab 4)",
    Tue: "11:00 AM - SEN 303 (LT 1)",
    Wed: "09:00 AM - CSC 305 (SLT)\n01:00 PM - SEN 307 (Lab 4)",
    Thu: "10:00 AM - SEN 301 (SLT)",
    Fri: "08:00 AM - CSC 307 (LT 1)"
  }
};

// Root check endpoint to verify Render deployment is alive
app.get('/', (req, res) => {
  res.send('LS Dial API is running successfully.');
});

// USSD Webhook Handler
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

  // LEVEL 2: Select Schedule View (Today vs Summary)
  else if (textArray[0] === '1' && textArray.length === 2) {
    const levelMap = { '1': '100L', '2': '200L', '3': '300L' };
    const level = levelMap[textArray[1]];

    if (!level) {
      response = `END Invalid Level selected. Please dial again.`;
    } else {
      response = `CON ${level} Timetable:
1. Today's Lectures
2. Week Summary`;
    }
  }

  // LEVEL 3: View Selected Schedule
  else if (textArray[0] === '1' && textArray.length === 3) {
    const levelKey = textArray[1] === '1' ? 'L100' : textArray[1] === '2' ? 'L200' : 'L300';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = days[new Date().getDay()];

    if (textArray[2] === '1') {
      const todayClasses = schedule[levelKey][currentDay] || "No lectures scheduled for today.";
      response = `END [${currentDay} - ${levelKey}]\n${todayClasses}`;
    } else if (textArray[2] === '2') {
      response = `END [${levelKey} Overview]
Mon: ${schedule[levelKey].Mon.split('\n')[0]}
Tue: ${schedule[levelKey].Tue.split('\n')[0]}
Wed: ${schedule[levelKey].Wed.split('\n')[0]}
Check board for rest.`;
    } else {
      response = `END Invalid choice.`;
    }
  }

  // LEVEL 1: Urgent Campus Notices
  else if (text === '2') {
    response = `END [Campus Notice]
- Continuous Assessment tests start next Monday.
- CSC 201 venue relocated to Twin LT.`;
  }

  // LEVEL 1: Class Rep Directory
  else if (text === '3') {
    response = `END [Rep Contacts]
L100: 08012345678
L200: 09077427128
L300: 08123456789`;
  }

  // LEVEL 1: Facility Fault Reporting Menu
  else if (text === '4') {
    response = `CON Report Facility Issue:
1. Broken Sockets/Fans
2. Hall Locked / No Key
3. Projector Fault`;
  }

  // LEVEL 2: Confirmation
  else if (textArray[0] === '4' && textArray.length === 2) {
    response = `END Fault reported. Department works committee has been alerted.`;
  }

  // Catch-all
  else {
    response = `END Invalid selection. Please dial again.`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LS Dial server active on port ${PORT}`);
});
