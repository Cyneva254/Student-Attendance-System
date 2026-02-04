// Firebase config
const firebaseConfig = {
 apiKey: "AIzaSyBcQjfn8PtDBcSZdAkwTN54DPugcUJDHXU",
  authDomain: "student-attendance-syste-23fcd.firebaseapp.com",
  projectId: "student-attendance-syste-23fcd",
  storageBucket: "student-attendance-syste-23fcd.firebasestorage.app",
  messagingSenderId: "1018526780498",
  appId: "1:1018526780498:web:8487674392b0826a6be38b"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const status = document.getElementById('status');
const studentList = document.getElementById('studentList');
const qrCodeDiv = document.getElementById('qrCode');

let teacherLat, teacherLng;

function startAttendance() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      teacherLat = position.coords.latitude;
      teacherLng = position.coords.longitude;

      database.ref('attendance/session').set({
        teacherLat,
        teacherLng,
        timestamp: Date.now(),
        active: true
      });

      status.textContent = `Attendance open! Location recorded ✅`;
      generateQRCode();
    }, () => { status.textContent = "Allow location access! ❌"; });
  } else {
    status.textContent = "Geolocation not supported!";
  }
}

function closeAttendance() {
  database.ref('attendance/session').update({ active: false });
  status.textContent = "Attendance closed ✅";
}

function generateQRCode() {
  const url = window.location.origin + '/student.html';
  QRCode.toCanvas(url, { width: 200 }, function (error, canvas) {
    if (error) console.error(error);
    qrCodeDiv.innerHTML = '';
    qrCodeDiv.appendChild(canvas);
  });
}

// Real-time student list
database.ref('attendance/students').on('value', snapshot => {
  studentList.innerHTML = '';
  const students = snapshot.val();
  if (students) {
    Object.values(students).forEach(student => {
      const li = document.createElement('li');
      const time = new Date(student.timestamp).toLocaleTimeString();
      li.textContent = `${student.name} — Signed at ${time}`;
      studentList.appendChild(li);
    });
  }
});
const totalCount = document.getElementById('totalCount');

database.ref('attendance/students').on('value', (snapshot) => {
  studentList.innerHTML = '';
  const students = snapshot.val();

  let count = 0;

  if (students) {
    Object.values(students).forEach((student) => {
      count++;

      const li = document.createElement('li');
      li.innerHTML = `
        <img src="${student.photoURL}" width="40" height="40" style="border-radius:50%; vertical-align:middle; margin-right:10px;">
        ${student.name}
      `;
      studentList.appendChild(li);
    });
  }

  totalCount.textContent = count;
});
database.ref('attendance/students').limitToLast(1).on('child_added', (snapshot) => {
  const student = snapshot.val();
  alert(`📢 New attendance signed by ${student.name}`);
});


