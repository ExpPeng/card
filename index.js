const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const basicAuth = require('express-basic-auth');

const app = express();
app.use(express.json());
const port = 1010;

// --- Multer setup for avatar uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, 'public', 'img')),
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- Load employee data ---
const dataPath = path.join(__dirname, 'employees.json');
let employees = JSON.parse(fs.readFileSync(dataPath, 'utf8')).employees;

// --- Serve public assets without auth ---
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'style.css'));
});
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));

// --- Public route for business cards ---
app.get('/card/:id', (req, res) => {
  const empList = JSON.parse(
    fs.readFileSync(dataPath, 'utf8')
  ).employees;
  const id = parseInt(req.params.id, 10);
  const emp = empList.find(e => e.id === id);
  if (!emp) return res.status(404).send('ไม่พบพนักงาน');

  res.send(`
    <!DOCTYPE html><html lang="th"><head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <link rel="stylesheet" href="/style.css"/>
      <title>นามบัตร ${emp.fullname}</title>
    </head><body>
      <div class="card">
        <p>นามบัตร</p>
        <div class="avatar">
          <img src="/img/${emp.avatar}" alt="รูป ${emp.fullname}"/>
        </div>
        <h1>${emp.fullname}</h1>
        <p>ตำแหน่ง: ${emp.position}</p>
        <p>เบอร์: ${emp.phone}</p>
        <p>Line ID: ${emp.lineId}</p>
        <p>Email: ${emp.email}</p>
      </div>
    </body></html>
  `);
});

// --- Basic Auth for Admin (everything else) ---
const adminAuth = basicAuth({
  users: { admin: 'Iilwts0y' },  // เปลี่ยนรหัสผ่านตามต้องการ
  challenge: true,
  realm: 'Admin Area'
});
function authUnless(req, res, next) {
  // Public paths that skip auth:
  if (
    req.path.startsWith('/card/') ||
    req.path === '/style.css' ||
    req.path.startsWith('/img/')
  ) {
    return next();
  }
  return adminAuth(req, res, next);
}
app.use(authUnless);

// --- Admin UI (protected) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Admin API (protected) ---
app.get('/api/employees', (req, res) => {
  res.json(employees);
});

app.post('/api/employees', upload.single('avatar'), (req, res) => {
  const { id, fullname, position, phone, lineId, email } = req.body;
  const newEmp = {
    id: parseInt(id, 10),
    fullname, position, phone, lineId, email,
    avatar: req.file?.filename || null
  };
  employees.push(newEmp);
  fs.writeFileSync(dataPath, JSON.stringify({ employees }, null, 2), 'utf8');
  res.status(201).json(newEmp);
});

app.put('/api/employees/:id', upload.single('avatar'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).send('ไม่พบพนักงาน');

  if (req.file) employees[idx].avatar = req.file.filename;
  ['fullname','position','phone','lineId','email'].forEach(f => {
    if (req.body[f]) employees[idx][f] = req.body[f];
  });

  fs.writeFileSync(dataPath, JSON.stringify({ employees }, null, 2), 'utf8');
  res.json(employees[idx]);
});

app.delete('/api/employees/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).send('ไม่พบพนักงาน');
  const removed = employees.splice(idx, 1)[0];
  fs.writeFileSync(dataPath, JSON.stringify({ employees }, null, 2), 'utf8');
  res.json(removed);
});

// --- Start server ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
