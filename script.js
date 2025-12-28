let allData = [];
let filteredData = [];
let currentIndex = 0;

let canvas, ctx;
let isDrawing = false;

// 1. Khởi tạo ứng dụng sau khi DOM đã sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('kanjiCanvas');
    ctx = canvas.getContext('2d');
    
    // Khởi tạo Canvas và nạp dữ liệu
    initCanvas();
    fetchData();
});

function initCanvas() {
    // Đảm bảo canvas có kích thước thực tế
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientWidth; // Hình vuông

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    drawGrid();

    // Sự kiện Cảm ứng (Mobile)
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    // Sự kiện Chuột (PC/Debug)
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
}

function drawGrid() {
    const s = canvas.width;
    ctx.save();
    ctx.strokeStyle = "#eee";
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(s/2, 0); ctx.lineTo(s/2, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, s/2); ctx.lineTo(s, s/2); ctx.stroke();
    ctx.restore();
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function startDrawing(e) {
    if (e.type === 'touchstart') e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    if (!isDrawing) return;
    if (e.type === 'touchmove') e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

// 2. Logic dữ liệu
function fetchData() {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            allData = data;
            initControls();
        })
        .catch(err => console.error("Lỗi tải dữ liệu:", err));
}

function initControls() {
    const lvSelect = document.getElementById('level-select');
    const levels = [...new Set(allData.map(i => i.level))].sort((a,b) => b-a);
    lvSelect.innerHTML = levels.map(l => `<option value="${l}">N${l}</option>`).join('');

    lvSelect.onchange = updateLessons;
    document.getElementById('lesson-select').onchange = filterData;
    
    document.getElementById('next-btn').onclick = () => navigate(1);
    document.getElementById('prev-btn').onclick = () => navigate(-1);
    document.getElementById('clearBtn').onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
    };

    updateLessons();
}

function updateLessons() {
    const lv = parseInt(document.getElementById('level-select').value);
    const lessons = [...new Set(allData.filter(i => i.level === lv).map(i => i.lesson))].sort((a,b) => a-b);
    document.getElementById('lesson-select').innerHTML = lessons.map(l => `<option value="${l}">Bài ${l}</option>`).join('');
    filterData();
}

function filterData() {
    const lv = parseInt(document.getElementById('level-select').value);
    const ls = parseInt(document.getElementById('lesson-select').value);
    filteredData = allData.filter(i => i.level === lv && i.lesson === ls);
    currentIndex = 0;
    render();
}

function render() {
    if (!filteredData[currentIndex]) return;
    const item = filteredData[currentIndex];

    document.getElementById('kanji-display').innerText = item.kanji;
    document.getElementById('hanviet-display').innerText = item.amhanviet || "-";
    document.getElementById('am-kun').innerText = item.amkun || "-";
    document.getElementById('am-on').innerText = item.amon || "-";
    document.getElementById('note-display').innerText = item.note || "";
    document.getElementById('counter').innerText = `${currentIndex + 1} / ${filteredData.length}`;

    // Từ vựng & Ví dụ
    document.getElementById('tu-vung-display').innerHTML = (item.tuvung || "").split(';').map(v => `<div>${formatRuby(v.trim())}</div>`).join('');
    document.getElementById('vi-du-display').innerHTML = (item.vidu || []).map(ex => {
        const p = ex.split(':');
        return `<div style="margin-bottom:8px"><div>${formatRuby(p[0])}</div><div class="meaning-text">${p[1]||''}</div></div>`;
    }).join('');

    // Xóa bảng khi đổi chữ
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
}

function formatRuby(text) {
    if (!text) return "";
    let processed = text.replace(/([^\x00-\x7F]+)\(([^)]+)\)/g, '<ruby>$1<rt>$2</rt></ruby>');
    if (processed.includes(':')) {
        let parts = processed.split(':');
        return `${parts[0]}: <span class="meaning-text">${parts[1]}</span>`;
    }
    return processed;
}

function navigate(dir) {
    currentIndex += dir;
    if (currentIndex < 0) currentIndex = filteredData.length - 1;
    if (currentIndex >= filteredData.length) currentIndex = 0;
    render();
}
