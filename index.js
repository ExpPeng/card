const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ตั้งค่าเก็บไฟล์ avatar ลง public/img
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public', 'img'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });


const app = express();
app.use(express.json());
const port = 1010;

// Serve ไฟล์ static จากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

// โหลดข้อมูลพนักงาน
const dataPath = path.join(__dirname, 'employees.json');
let employees = JSON.parse(fs.readFileSync(dataPath, 'utf8')).employees;

// GET /api/employees – ดึงข้อมูลพนักงานทั้งหมด
app.get('/api/employees', (req, res) => {
  res.json(employees);
});

// POST /api/employees – เพิ่มพนักงานใหม่ พร้อมรับไฟล์ avatar
app.post('/api/employees', upload.single('avatar'), (req, res) => {
  const { id, fullname, position, phone, lineId, email } = req.body;
  const newEmp = {
    id: parseInt(id, 10),
    fullname,
    position,
    phone,
    lineId,
    email,
    avatar: req.file ? req.file.filename : null
  };
  employees.push(newEmp);
  fs.writeFileSync(
    dataPath,
    JSON.stringify({ employees }, null, 2),
    'utf8'
  );
  res.status(201).json(newEmp);
});


// PUT /api/employees/:id – แก้ไขข้อมูลพนักงาน พร้อมรับไฟล์ avatar
app.put('/api/employees/:id', upload.single('avatar'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบพนักงาน' });

  // ถ้ามีไฟล์ avatar ใหม่ ให้อัปเดตรูป
  if (req.file) {
    employees[idx].avatar = req.file.filename;
  }

  // อัปเดตฟิลด์อื่น ๆ (ไม่แตะ id)
  const { fullname, position, phone, lineId, email } = req.body;
  employees[idx] = {
    ...employees[idx],
    fullname,
    position,
    phone,
    lineId,
    email,
    id
  };

  // เขียนไฟล์ JSON ใหม่
  fs.writeFileSync(
    dataPath,
    JSON.stringify({ employees }, null, 2),
    'utf8'
  );
  res.json(employees[idx]);
});

// DELETE /api/employees/:id – ลบพนักงาน
app.delete('/api/employees/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบพนักงาน' });

  const removed = employees.splice(idx, 1)[0];
  fs.writeFileSync(
    dataPath,
    JSON.stringify({ employees }, null, 2),
    'utf8'
  );
  res.json(removed);
});

// Route: /card/:id – หน้าแสดงนามบัตรพร้อมรูปประจำตัว
app.get('/card/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).send('ไม่พบพนักงาน');

  const html = `
  <!DOCTYPE html>
  <html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/style.css" />
    <title>นามบัตร ${emp.fullname}</title>
  </head>
  <body>
    <div class="card">
      <div class="avatar">
        <img src="/img/${emp.avatar}" alt="รูป ${emp.fullname}" />
      </div>
      <h1>${emp.fullname}</h1>
      <p>ตำแหน่ง: ${emp.position}</p>
      <p>เบอร์: ${emp.phone}</p>
      <p>Line ID: ${emp.lineId}</p>
      <p>Email: ${emp.email}</p>
    </div>
  </body>
  </html>`;

  res.send(html);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
