let allData = [];
let filteredData = [];
let currentIndex = 0;

// 1. Load dữ liệu từ file JSON
fetch('data.json')
    .then(res => res.json())
    .then(data => {
        allData = data;
        init();
    })
    .catch(err => console.error("Lỗi tải file data.json. Hãy kiểm tra dấu ngoặc vuông [ ]", err));

// 2. Khởi tạo ứng dụng
function init() {
    const levelSelect = document.getElementById('level-select');
    
    // Tự động tìm tất cả các Level có trong dữ liệu (N3, N2...)
    const levels = [...new Set(allData.map(item => item.level))].sort((a, b) => b - a);
    
    // Tạo các <option> cho level-select
    levelSelect.innerHTML = levels.map(lv => `<option value="${lv}">N${lv}</option>`).join('');

    // Gán sự kiện thay đổi
    levelSelect.onchange = updateLessons;
    document.getElementById('lesson-select').onchange = filterData;

    // Chạy lần đầu
    updateLessons();
}

// 3. Cập nhật danh sách bài học dựa trên Level đã chọn
function updateLessons() {
    const lv = parseInt(document.getElementById('level-select').value);
    const lessons = [...new Set(allData.filter(i => i.level === lv).map(i => i.lesson))].sort((a, b) => a - b);
    
    const lessonSelect = document.getElementById('lesson-select');
    lessonSelect.innerHTML = lessons.map(l => `<option value="${l}">Bài ${l}</option>`).join('');
    
    filterData();
}

// 4. Lọc dữ liệu theo Level và Bài học
function filterData() {
    const lv = parseInt(document.getElementById('level-select').value);
    const ls = parseInt(document.getElementById('lesson-select').value);
    
    filteredData = allData.filter(i => i.level === lv && i.lesson === ls);
    currentIndex = 0;
    
    renderSidebar(); 
    render();        
}

// 5. Hiển thị danh sách bên trái
function renderSidebar() {
    const sidebar = document.getElementById('sidebar-list');
    sidebar.innerHTML = filteredData.map((item, index) => `
        <div class="sidebar-item ${index === currentIndex ? 'active' : ''}" onclick="jumpTo(${index})">
            <span class="side-kanji">${item.kanji}</span>
            
        </div>
    `).join('');
}
//<span class="side-hv">${item.amhanviet}</span>
function jumpTo(index) {
    currentIndex = index;
    render();
    renderSidebar();
}

// 6. Hiển thị chi tiết nội dung Kanji
function render() {
    if (filteredData.length === 0) return;
    const item = filteredData[currentIndex];

    document.getElementById('kanji-display').innerText = item.kanji;
    document.getElementById('hanviet-display').innerText = item.amhanviet;
    document.getElementById('am-kun').innerText = item.amkun;
    document.getElementById('am-on').innerText = item.amon;

    // Xử lý từ vựng
    document.getElementById('tu-vung-display').innerHTML = item.tuvung.split(';').map(v => {
        return `<div class="vocab-item">${formatRuby(v.trim())}</div>`;
    }).join('');

    // Xử lý ví dụ
    document.getElementById('vi-du-display').innerHTML = item.vidu.map(ex => {
        let parts = ex.split(':');
        return `<div class="example-item">
            <div class="ex-jp">${formatRuby(parts[0])}</div>
            <div class="ex-vn">${parts[1] || ''}</div>
        </div>`;
    }).join('');

    document.getElementById('note-display').innerText = item.note || "";
    document.getElementById('counter').innerText = `${currentIndex + 1} / ${filteredData.length}`;
}

// Helper format Furigana và Nghĩa
function formatRuby(text) {
    if (!text) return "";
    
    // 1. Xử lý Furigana: chuyển Kanji(furigana) thành thẻ <ruby>
    let processed = text.replace(/([^\x00-\x7F]+)\(([^)]+)\)/g, '<ruby>$1<rt>$2</rt></ruby>');
    
    // 2. Xử lý bôi đỏ phần nghĩa tiếng Việt sau dấu hai chấm (:)
    if (processed.includes(':')) {
        let parts = processed.split(':');
        // parts[0] là từ vựng tiếng Nhật, parts[1] là nghĩa tiếng Việt
        return `<span class="vocab-kanji">${parts[0]}</span>: <span style="color: #e74c3c; font-weight: bold;">${parts[1]}</span>`;
    }
    
    return processed;
}

// Điều hướng
document.getElementById('next-btn').onclick = () => {
    if (currentIndex < filteredData.length - 1) {
        currentIndex++;
        render();
        renderSidebar();
        document.querySelectorAll('.sidebar-item')[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

document.getElementById('prev-btn').onclick = () => {
    if (currentIndex > 0) {
        currentIndex--;
        render();
        renderSidebar();
        document.querySelectorAll('.sidebar-item')[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};



// 
// Tập viết kanji
// 
const canvas = document.getElementById('kanjiCanvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');

let isDrawing = false;

// Thiết lập nét vẽ
ctx.strokeStyle = "#000";
ctx.lineWidth = 5;
ctx.lineCap = "round";
ctx.lineJoin = "round";

function drawGrid() {
    ctx.save(); // Lưu trạng thái hiện tại
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(150, 300); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(300, 150); ctx.stroke();
    ctx.restore(); // Khôi phục trạng thái để không ảnh hưởng nét vẽ Kanji
}

drawGrid();

// Lấy tọa độ chính xác của chuột/tay trong canvas
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// Bắt đầu vẽ
function startDrawing(e) {
    isDrawing = true;
    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();      // Bắt đầu đường dẫn mới
    ctx.moveTo(x, y);     // CHỐT LỖI: Di chuyển bút đến điểm click đầu tiên mà không vẽ
}

// Hàm vẽ
function draw(e) {
    if (!isDrawing) return;
    
    const { x, y } = getCoordinates(e);
    
    ctx.lineTo(x, y);     // Vẽ đến vị trí mới
    ctx.stroke();
}

// Kết thúc vẽ
function stopDrawing() {
    isDrawing = false;
}

// Event Listeners cho Chuột
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', stopDrawing); // Dùng window để tránh kẹt nét khi nhả chuột ngoài canvas

// Event Listeners cho Cảm ứng
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); });
canvas.addEventListener('touchend', stopDrawing);

// Nút Xóa
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
});