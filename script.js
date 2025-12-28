let allData = [], filteredData = [], currentIndex = 0;
let canvas, ctx, isDrawing = false;

window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('kanjiCanvas');
    ctx = canvas.getContext('2d');
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initDrawEvents();
    fetchData();
});

function initDrawEvents() {
    const start = (e) => {
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
        if (e.type.includes('touch')) e.preventDefault();
    };
    const move = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y); ctx.stroke();
        if (e.type.includes('touch')) e.preventDefault();
    };
    const stop = () => isDrawing = false;

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', stop);
    canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);

    document.getElementById('clearBtn').onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
    };
}

function resizeCanvas() {
    const container = canvas.parentElement;
    // Lấy kích thước thực tế của wrapper sau khi đã xóa tiêu đề
    const rect = container.getBoundingClientRect();
    
    // Thiết lập canvas lấp đầy vùng chứa
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Thiết lập lại thuộc tính cọ vẽ
    ctx.lineWidth = 6; 
    ctx.lineCap = 'round'; 
    ctx.lineJoin = 'round'; 
    ctx.strokeStyle = '#2c3e50';
    
    drawGrid();
}

// Cập nhật hàm lấy tọa độ để hỗ trợ cuộn trang (scroll) trên mobile
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Tính toán tọa độ dựa trên vị trí thực tế của canvas trong viewport
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

// Cập nhật lại hàm drawGrid để lưới luôn nằm giữa theo kích thước mới
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

function fetchData() {
    fetch('data.json').then(r => r.json()).then(data => {
        allData = data;
        const lvs = [...new Set(data.map(d => d.level))].sort((a,b)=>b-a);
        document.getElementById('level-select').innerHTML = lvs.map(l => `<option value="${l}">N${l}</option>`).join('');
        document.getElementById('level-select').onchange = loadLessons;
        loadLessons();
    });
}

function loadLessons() {
    const lv = parseInt(document.getElementById('level-select').value);
    const lss = [...new Set(allData.filter(d => d.level === lv).map(d => d.lesson))].sort((a,b)=>a-b);
    document.getElementById('lesson-select').innerHTML = lss.map(l => `<option value="${l}">Bài ${l}</option>`).join('');
    document.getElementById('lesson-select').onchange = filter;
    filter();
}

function filter() {
    const lv = parseInt(document.getElementById('level-select').value);
    const ls = parseInt(document.getElementById('lesson-select').value);
    filteredData = allData.filter(d => d.level === lv && d.lesson === ls);
    currentIndex = 0;
    document.getElementById('next-btn').onclick = () => navigate(1);
    document.getElementById('prev-btn').onclick = () => navigate(-1);
    render();
}

function render() {
    if (!filteredData[currentIndex]) return;
    const item = filteredData[currentIndex];
    document.getElementById('kanji-display').innerText = item.kanji;
    document.getElementById('hanviet-display').innerText = item.amhanviet;
    document.getElementById('am-kun').innerText = item.amkun;
    document.getElementById('am-on').innerText = item.amon;
    document.getElementById('note-display').innerText = item.note || "";
    document.getElementById('counter').innerText = `${currentIndex + 1} / ${filteredData.length}`;
    document.getElementById('tu-vung-display').innerHTML = (item.tuvung || "").split(';').map(v => `<div>${formatRuby(v.trim())}</div>`).join('');
    document.getElementById('vi-du-display').innerHTML = (item.vidu || []).map(ex => {
        const p = ex.split(':');
        return `<div style="margin-bottom:8px"><div>${formatRuby(p[0])}</div><div class="meaning-text">${p[1]||''}</div></div>`;
    }).join('');
    document.querySelector('.content-column').scrollTop = 0;
    // Cuộn lên đầu trang trên Mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset bảng vẽ
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
}

function formatRuby(text) {
    if (!text) return "";
    let processed = text.replace(/([一-龠]+)\(([^)]+)\)/g, '<ruby>$1<rt>$2</rt></ruby>');
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
