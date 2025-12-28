// Khai báo biến toàn cục
let allData = [];
let filteredData = [];
let currentIndex = 0;
let canvas, ctx;
let isDrawing = false;

// 1. Khởi tạo ứng dụng khi DOM sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('kanjiCanvas');
    ctx = canvas.getContext('2d');
    
    // Khởi tạo kích thước Canvas và các sự kiện
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initDrawEvents();
    
    // Nạp dữ liệu từ file JSON
    fetchData();
});

// 2. Xử lý Bảng viết (Canvas)
function initDrawEvents() {
    const start = (e) => {
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        // Ngăn chặn cuộn trang khi đang vẽ trên mobile
        if (e.type.includes('touch')) e.preventDefault();
    };

    const move = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        if (e.type.includes('touch')) e.preventDefault();
    };

    const stop = () => { isDrawing = false; };

    // Sự kiện Cảm ứng (Mobile)
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', stop);

    // Sự kiện Chuột (PC)
    canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);

    // Nút Xóa bảng
    document.getElementById('clearBtn').onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
    };
}

function resizeCanvas() {
    const container = canvas.parentElement;
    // Lấy kích thước thực tế của vùng chứa trắng (Canvas Wrapper)
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Cấu hình nét vẽ
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#2c3e50';
        
        drawGrid();
    }
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Tính toán tọa độ chính xác tuyệt đối kể cả khi cuộn trang
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function drawGrid() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.strokeStyle = '#f1f2f6';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    ctx.restore();
}

// 3. Xử lý Dữ liệu JSON & Bộ lọc
function fetchData() {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            allData = data;
            const levels = [...new Set(data.map(d => d.level))].sort((a,b) => b-a);
            
            const lvSelect = document.getElementById('level-select');
            lvSelect.innerHTML = levels.map(l => `<option value="${l}">N${l}</option>`).join('');
            
            lvSelect.onchange = updateLessons;
            document.getElementById('lesson-select').onchange = filterData;
            
            // Gán sự kiện cho các nút điều hướng
            document.getElementById('next-btn').onclick = () => navigate(1);
            document.getElementById('prev-btn').onclick = () => navigate(-1);

            updateLessons();
        })
        .catch(err => console.error("Lỗi nạp dữ liệu:", err));
}

function updateLessons() {
    const lv = parseInt(document.getElementById('level-select').value);
    const lessons = [...new Set(allData.filter(d => d.level === lv).map(d => d.lesson))].sort((a,b) => a-b);
    
    const lsSelect = document.getElementById('lesson-select');
    lsSelect.innerHTML = lessons.map(l => `<option value="${l}">Bài ${l}</option>`).join('');
    
    filterData();
}

function filterData() {
    const lv = parseInt(document.getElementById('level-select').value);
    const ls = parseInt(document.getElementById('lesson-select').value);
    filteredData = allData.filter(d => d.level === lv && d.lesson === ls);
    currentIndex = 0;
    render();
}

// 4. Hiển thị nội dung
function render() {
    if (filteredData.length === 0) return;
    const item = filteredData[currentIndex];

    // Cập nhật text cơ bản
    document.getElementById('kanji-display').innerText = item.kanji;
    document.getElementById('hanviet-display').innerText = item.amhanviet;
    
    // Hiển thị Tách biệt Âm Kun và Âm On
    document.getElementById('am-kun').innerText = item.amkun || "---";
    document.getElementById('am-on').innerText = item.amon || "---";
    
    document.getElementById('note-display').innerText = item.note || "Không có ghi chú.";
    document.getElementById('counter').innerText = `${currentIndex + 1} / ${filteredData.length}`;

    // Render Từ vựng & Ví dụ (Xử lý Furigana)
    document.getElementById('tu-vung-display').innerHTML = (item.tuvung || "").split(';').map(v => `<div>${formatRuby(v.trim())}</div>`).join('');
    
    document.getElementById('vi-du-display').innerHTML = (item.vidu || []).map(ex => {
        const parts = ex.split(':');
        return `<div class="example-item">
                    <div>${formatRuby(parts[0])}</div>
                    <div style="color:var(--green); font-weight:bold;">${parts[1] || ''}</div>
                </div>`;
    }).join('');

    // Tự động cuộn lên đầu trang (Hữu ích khi ở mobile, phần viết nằm ở dưới)
    if (window.innerWidth <= 450) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        const contentCol = document.querySelector('.content-column');
        if (contentCol) contentCol.scrollTop = 0;
    }

    // Reset bảng viết mỗi khi đổi từ mới
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
}

// 5. Hàm định dạng Furigana (Chữ Hán + Hiragana trong ngoặc)
function formatRuby(text) {
    if (!text) return "";
    // Regex tìm Kanji đứng trước dấu ngoặc đơn: ví dụ 便利(べんり)
    return text.replace(/([一-龠]+)\(([^)]+)\)/g, '<ruby>$1<rt>$2</rt></ruby>');
}

function navigate(dir) {
    currentIndex += dir;
    if (currentIndex < 0) currentIndex = filteredData.length - 1;
    if (currentIndex >= filteredData.length) currentIndex = 0;
    render();
}
