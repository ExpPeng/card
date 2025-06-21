const apiUrl = '/api/employees';
const tableBody = document.getElementById('employeeTable');
const addForm = document.getElementById('addForm');

// โหลดรายการพนักงานมาแสดง
function loadEmployees() {
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      tableBody.innerHTML = '';
      data.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${emp.id}</td>
          <td>${emp.fullname}</td>
          <td>${emp.position}</td>
          <td>
            <button onclick="goEdit(${emp.id})">แก้ไข</button>
            <button onclick="deleteEmployee(${emp.id})">ลบ</button>
          </td>`;
        tableBody.appendChild(tr);
      });
    });
}

// ฟังก์ชันเพิ่มพนักงาน
addForm.addEventListener('submit', e => {
  e.preventDefault();
  // สร้าง FormData เพื่อรวมทุก field และไฟล์ avatar
  const formData = new FormData(addForm);

  fetch(apiUrl, {
    method: 'POST',
    body: formData   // เบราว์เซอร์จะตั้ง multipart/form-data ให้เอง
  })
  .then(() => {
    addForm.reset();
    loadEmployees();
  })
  .catch(err => console.error(err));
});


// ฟังก์ชันลบพนักงาน
function deleteEmployee(id) {
  if (!confirm('ต้องการลบพนักงาน ID ' + id + ' ใช่หรือไม่?')) return;
  fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
    .then(() => loadEmployees());
}

// ไปหน้าแก้ไข
function goEdit(id) {
  window.location.href = `/edit.html?id=${id}`;
}

// เรียกโหลดตอนหน้าเปิด
loadEmployees();
