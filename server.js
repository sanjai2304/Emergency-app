const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const PriorityQueue = require('./algorithms/PriorityQueue');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup
const db = new sqlite3.Database('./hospital.db', (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to SQLite database.');
});

// Initialize Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        age INTEGER,
        severity TEXT,
        severityScore INTEGER,
        arrivalTime INTEGER,
        status TEXT DEFAULT 'waiting', -- waiting, treating, discharged
        treatedBy TEXT DEFAULT NULL,
        treatedAt INTEGER DEFAULT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        status TEXT DEFAULT 'available' -- available, busy
    )`);

    // Seed data checks could go here
});

// Priority Queue Instance
const waitingQueue = new PriorityQueue();

// Severity Mapping
const severityMap = {
    'Critical': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1
};

// Load existing waiting patients into Queue on Server Start
// This ensures persistence across restarts
function recoverQueue() {
    db.all("SELECT * FROM patients WHERE status = 'waiting'", [], (err, rows) => {
        if (err) return;
        rows.forEach(patient => {
            waitingQueue.enqueue(patient);
        });
        console.log(`Recovered ${rows.length} patients into Priority Queue.`);
    });
}
recoverQueue();

// --- API Routes ---

// 1. Patient Admission (Enqueue)
app.post('/api/admit', (req, res) => {
    const { name, age, severity } = req.body;
    const severityScore = severityMap[severity] || 1;
    const arrivalTime = Date.now();

    const stmt = db.prepare("INSERT INTO patients (name, age, severity, severityScore, arrivalTime) VALUES (?, ?, ?, ?, ?)");
    stmt.run([name, age, severity, severityScore, arrivalTime], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const newPatient = {
            id: this.lastID,
            name,
            age,
            severity,
            severityScore,
            arrivalTime,
            status: 'waiting'
        };

        // Add to Algorithm
        waitingQueue.enqueue(newPatient);

        res.json({ message: 'Patient admitted successfully', patient: newPatient });
    });
});

// 2. Get Waiting Queue (Sorted by Priority)
app.get('/api/queue', (req, res) => {
    // We return the queue from the Algorithm, not just DB, to show the order
    const sortedQueue = waitingQueue.toArray();
    res.json(sortedQueue);
});

// 3. Process Next Patient (Doctor assigns self)
app.post('/api/process', (req, res) => {
    const { doctorName } = req.body;

    if (waitingQueue.isEmpty()) {
        return res.status(404).json({ message: 'No patients in waiting queue.' });
    }

    // ALGORITHM: Extract Max Priority
    const nextPatient = waitingQueue.dequeue();
    const treatedAt = Date.now();

    // Update DB
    db.run("UPDATE patients SET status = 'treating', treatedBy = ?, treatedAt = ? WHERE id = ?",
        [doctorName, treatedAt, nextPatient.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Patient assigned to doctor', patient: nextPatient });
        }
    );
});

// 4. Analytics & Dashboard Data
app.get('/api/stats', (req, res) => {
    // Simple analytics
    db.all("SELECT * FROM patients", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const totalPatients = rows.length;
        const criticalCount = rows.filter(p => p.severity === 'Critical').length;
        const waitingCount = rows.filter(p => p.status === 'waiting').length;

        // Avg Waiting Time (for treated patients)
        let totalWait = 0;
        let treatedCount = 0;
        rows.forEach(p => {
            if (p.treatedAt) {
                totalWait += (p.treatedAt - p.arrivalTime);
                treatedCount++;
            }
        });
        const avgWaitTime = treatedCount > 0 ? Math.round((totalWait / treatedCount) / 1000 / 60) : 0; // minutes

        res.json({
            totalPatients,
            criticalCount,
            waitingCount,
            avgWaitTime
        });
    });
});

// 5. Login (Mock)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Simple mock auth
    if (username === 'admin' && password === 'admin') {
        res.json({ role: 'admin', success: true });
    } else if (username.startsWith('dr') && password === 'doctor') {
        res.json({ role: 'doctor', name: username, success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
