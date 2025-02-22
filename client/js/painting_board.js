// 当前画笔模式：1 空心矩形 2 实心矩形 3 空心圆形 4 实心圆形 5 直线 6 箭头 7 自由画笔 8 橡皮
let brush = 7;

// 获取画布和绘画工具
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');


// 跟踪绘画状态
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
let isDrawing = false; //标记是否要绘制
let isMouseDown = false; //标记鼠标是否按下
let lineColor; // 线条颜色
let lineWidth; // 线条粗细
let points = []; //存储坐标点
let undoStack = []; // 存储画布状态，用于撤销上一步操作
let step = 0; // 记录当前步数
let brushSize = 3.323396301269531; // 画笔大小
let canvas_width = 1340;
let canvas_height = 700;

// 根据窗口设置画布大小
if (window.innerWidth / window.innerHeight > canvas_width / canvas_height) {
    canvas_width = canvas_height * (window.innerWidth / window.innerHeight);
}
else {
    canvas_height = canvas_width * (window.innerHeight / window.innerWidth);
}

canvas.width = canvas_width;
canvas.height = canvas_height;





// 鼠标按下
canvas.onpointerdown = function (e) {
    points = [];
    isDrawing = true;
    isMouseDown = true;
    points.push({ x: e.offsetX * (canvas_width / window.innerWidth), y: e.offsetY * (canvas_height / window.innerHeight) });
    if (e.ctrlKey || brush === 8) { // 如果是橡皮擦，则设置为destination-out
        ctx.globalCompositeOperation = 'destination-out';
    } else { // 否则设置为默认值source-over
        ctx.globalCompositeOperation = 'source-over';
    }
    ctx.beginPath(); // 新增：开始一个绘画路径
    pointermove(e);
};


// 鼠标抬起
canvas.onpointerup = function (e) {
    isMouseDown = false;
    points = [];
    isDrawing = false;
    ctx.closePath(); // 新增：结束绘画路径
    // 绘画结束后，将值重新设置为默认值，否则当前值为destination-out时，使用撤销功能后会把整个画布的内容都给擦掉
    ctx.globalCompositeOperation = 'source-over';
    addUndoStack(canvas.toDataURL("image/webp", 0.5)); // 将当前画布状态保存起来
};
// 鼠标离开画布
canvas.onpointerout = function (e) {
    if (isMouseDown) {
        points = [];
        isDrawing = false;
        isMouseDown = false;
        ctx.closePath(); // 新增：结束绘画路径
        ctx.globalCompositeOperation = 'source-over';
        // 绘画结束后，将值重新设置为默认值，否则当前值为destination-out时，使用撤销功能后会把整个画布的内容都给擦掉
        addUndoStack(canvas.toDataURL("image/webp", 0.5)); // 将当前画布状态保存起来
    }
};
function pointermove(e) {
    if (!isDrawing) return;
    lineColor = document.getElementById('brushColor').value;
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = lineColor;
    draw(e.offsetX * (canvas_width / window.innerWidth), e.offsetY * (canvas_height / window.innerHeight), e.ctrlKey);
}
// 鼠标移动
canvas.onpointermove = pointermove;

window.addEventListener('touchstart', function check_touch() {
    console.log('检测到触摸屏');
    is_touch = true;
    canvas.onpointermove = function (e) {
    }
    canvas.onpointerup = function (e) {
    }
    canvas.onpointerdown = function (e) {
    }
    canvas.onpointerout = function (e) {
    }
    window.removeEventListener('touchstart', check_touch);
    colorpicker = new Colorpicker({
        el: "brushColor",
        color: "#000000",
        change: function (elem, hex) {
            document.getElementById('brushColor').value = hex;
        }
    });
});
function touchmove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    lineColor = document.getElementById('brushColor').value;
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = lineColor;
    draw(e.touches[0].clientX * (canvas_width / window.innerWidth), e.touches[0].clientY * (canvas_height / window.innerHeight), e.ctrlKey);

}
// 触摸
canvas.addEventListener('touchmove', touchmove, { passive: false });

canvas.addEventListener('touchstart', (e) => {
    points = [];
    isDrawing = true;
    isMouseDown = true;
    points.push({ x: e.touches[0].clientX * (canvas_width / window.innerWidth), y: e.touches[0].clientY * (canvas_height / window.innerHeight) });
    if (e.ctrlKey || brush === 8) { // 如果是橡皮擦，则设置为destination-out
        ctx.globalCompositeOperation = 'destination-out';
    } else { // 否则设置为默认值source-over
        ctx.globalCompositeOperation = 'source-over';
    }
    ctx.beginPath(); // 新增：开始一个绘画路径
    touchmove(e);
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
    isMouseDown = false;
    points = [];
    isDrawing = false;
    ctx.closePath(); // 新增：结束绘画路径
    // 绘画结束后，将值重新设置为默认值，否则当前值为destination-out时，使用撤销功能后会把整个画布的内容都给擦掉
    ctx.globalCompositeOperation = 'source-over';
    addUndoStack(canvas.toDataURL("image/webp", 0.5)); // 将当前画布状态保存起来
}, { passive: false });

// 绘制
function draw(mousex, mousey, ctrlKey) {
    points.push({ x: mousex, y: mousey });
    if (ctrlKey || brush === 7 || brush === 8) { // 如果是橡皮擦模式，则和画笔模式一样，用draw画笔方法。
        draw画笔();
    } else {
        if (brush === 1) draw矩形(false);
        else if (brush === 2) draw矩形(true);
        else if (brush === 3) draw圆形(false);
        else if (brush === 4) draw圆形(true);
        else if (brush === 5) draw直线();
        else if (brush === 6) draw箭头();
    }
    ctx.stroke();
    points.slice(0, 1);
}

// 绘制自由线条
function draw画笔() {
    ctx.beginPath();
    let x = (points[points.length - 2].x + points[points.length - 1].x) / 2,
        y = (points[points.length - 2].y + points[points.length - 1].y) / 2;
    if (points.length == 2) {
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(x, y);
    } else {
        let lastX = (points[points.length - 3].x + points[points.length - 2].x) / 2,
            lastY = (points[points.length - 3].y + points[points.length - 2].y) / 2;
        ctx.moveTo(lastX, lastY);
        ctx.quadraticCurveTo(points[points.length - 2].x, points[points.length - 2].y, x, y);
    }
}

// 绘制矩形
function draw矩形(isSolid) {
    const startX = points[0].x;
    const startY = points[0].y;
    const endX = points[points.length - 1].x;
    const endY = points[points.length - 1].y;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
    ctx.beginPath();
    if (isSolid) { // 是否实心，true绘制实心矩形，false绘制空心矩形
        ctx.fillStyle = lineColor;
        ctx.fillRect(startX, startY, endX - startX, endY - startY);
    } else {
        ctx.rect(startX, startY, endX - startX, endY - startY);
    }
    loadImage(); // 清空画布后，显示画布之前的状态，不然画布上同时只能存在一个图形
}

// 绘制圆形
function draw圆形(isSolid) {
    const startX = points[0].x;
    const startY = points[0].y;
    const endX = points[points.length - 1].x;
    const endY = points[points.length - 1].y;
    const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
    ctx.beginPath();
    ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
    if (isSolid) { // 绘制实心圆
        ctx.fillStyle = lineColor;
        ctx.fill();
    }
    loadImage(); // 清空画布后，显示画布之前的状态，不然画布上同时只能存在一个图形
}

// 绘制直线
function draw直线() {
    const startX = points[0].x;
    const startY = points[0].y;
    const endX = points[points.length - 1].x;
    const endY = points[points.length - 1].y;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    loadImage(); // 清空画布后，显示画布之前的状态，不然画布上同时只能存在一个图形
}

// 绘制箭头
function draw箭头() {
    const startX = points[0].x;
    const startY = points[0].y;
    const endX = points[points.length - 1].x;
    const endY = points[points.length - 1].y;
    const arrowSize = lineWidth * 4; // 箭头大小（根据线条粗细来调整箭头大小）
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    // 计算箭头角度
    const angle = Math.atan2(endY - startY, endX - startX);
    // 绘制箭头部分
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    loadImage(); // 清空画布后，显示画布之前的状态，不然画布上同时只能存在一个图形
}


// 加载图片
function loadImage() {
    if (step > 0) {
        var img = new Image();
        img.src = undoStack[step - 1];
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
}

// 清空画布
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    step = 0;
    points = [];
    undoStack = []; // 清空撤销栈
}

// 添加操作
function addUndoStack(url) {
    if (step < undoStack.length) {
        undoStack.length = step; // 清除撤销后的操作
    }
    undoStack.push(url);
    step++;
}

// 撤销操作
function undo() {
    if (step > 1) {
        step--;
        const image = new Image();
        image.src = undoStack[step - 1]; // 获取上一个画布状态
        image.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0); // 绘制上一个画布状态
        }
    } else {
        step = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// 恢复操作
function restore() {
    if (step < undoStack.length) {
        step++;
        const image = new Image();
        image.src = undoStack[step - 1]; // 获取下一个画布状态
        image.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0); // 绘制下一个画布状态
        }
    }
}

// 保存图片
function save_pic() {
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'drawing.png';
    link.click();
}

function change_mode(id, val) {
    brush = val;
    update_tool_now(val);
}

// 监听键盘事件，实现撤销操作和保存绘画内容、切换画笔工具
window.addEventListener('keydown', (e) => {
    // 撤销
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    // 恢复
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        restore();
    }
    // 保存
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        save_pic();
    }
    // 橡皮快捷键
    if (e.ctrlKey) {
        update_tool_now(8);
    }
})
window.addEventListener('keyup', (e) => {
    update_tool_now(brush);
})
function update_tool_now(target) {
    var display;
    if (target == 1) { display = '空心矩形' }
    else if (target == 2) { display = '实心矩形' }
    else if (target == 3) { display = '空心圆形' }
    else if (target == 4) { display = '实心圆形' }
    else if (target == 5) { display = '直线' }
    else if (target == 6) { display = '箭头' }
    else if (target == 7) { display = '画笔' }
    else if (target == 8) { display = '橡皮' }

    Array.prototype.forEach.call(document.getElementsByClassName('painter_mode_chose_button'), function (element) {
        if (element.classList.contains('active')) {
            element.classList.remove('active');
        }
    });
    document.getElementById(display).classList.add('active');
}

function change_color(val) {
    document.getElementById('brushColor').value = val;
    if (is_touch) {
        colorpicker.current_mode = "hex";
        colorpicker.setColorByInput(val);
    }
}

function change_linewidth(id, width) {
    brushSize = width;
    document.getElementById('linewidth_1').classList.remove('active');
    document.getElementById('linewidth_2').classList.remove('active');
    document.getElementById('linewidth_3').classList.remove('active');
    document.getElementById('linewidth_4').classList.remove('active');
    document.getElementById('linewidth_' + id).classList.add('active');
    if (id == 1) {
        document.getElementById('canvas').style.cursor = "url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%204.6875%204.6875%22%20width%3D%224.6875%22%20height%3D%224.6875%22%3E%3Cellipse%20cx%3D%222.34375%22%20cy%3D%222.34375%22%20rx%3D%221.171875%22%20ry%3D%221.171875%22%20stroke-opacity%3D%221%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%223.171875%22%2F%3E%3Cellipse%20cx%3D%222.34375%22%20cy%3D%222.34375%22%20rx%3D%221.171875%22%20ry%3D%221.171875%22%20stroke-opacity%3D%221%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.171875%22%2F%3E%3C%2Fsvg%3E) 2.34375 2.34375, crosshair";
    } else if (id == 2) {
        document.getElementById('canvas').style.cursor = "url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%207.031249999999999%207.031249999999999%22%20width%3D%227.031249999999999%22%20height%3D%227.031249999999999%22%3E%3Cellipse%20cx%3D%223.5156249999999996%22%20cy%3D%223.5156249999999996%22%20rx%3D%222.34375%22%20ry%3D%222.34375%22%20stroke-opacity%3D%221%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%223.171875%22%2F%3E%3Cellipse%20cx%3D%223.5156249999999996%22%20cy%3D%223.5156249999999996%22%20rx%3D%222.34375%22%20ry%3D%222.34375%22%20stroke-opacity%3D%221%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.171875%22%2F%3E%3C%2Fsvg%3E) 3.5156249999999996 3.5156249999999996, crosshair";
    } else if (id == 3) {
        document.getElementById('canvas').style.cursor = "url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2014.062499999999998%2014.062499999999998%22%20width%3D%2214.062499999999998%22%20height%3D%2214.062499999999998%22%3E%3Cellipse%20cx%3D%227.031249999999999%22%20cy%3D%227.031249999999999%22%20rx%3D%225.859375%22%20ry%3D%225.859375%22%20stroke-opacity%3D%221%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%223.171875%22%2F%3E%3Cellipse%20cx%3D%227.031249999999999%22%20cy%3D%227.031249999999999%22%20rx%3D%225.859375%22%20ry%3D%225.859375%22%20stroke-opacity%3D%221%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.171875%22%2F%3E%3C%2Fsvg%3E) 7.031249999999999 7.031249999999999, crosshair"
    } else if (id == 4) {
        document.getElementById('canvas').style.cursor = "url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2025.78125%2025.78125%22%20width%3D%2225.78125%22%20height%3D%2225.78125%22%3E%3Cellipse%20cx%3D%2212.890625%22%20cy%3D%2212.890625%22%20rx%3D%2211.71875%22%20ry%3D%2211.71875%22%20stroke-opacity%3D%221%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%223.171875%22%2F%3E%3Cellipse%20cx%3D%2212.890625%22%20cy%3D%2212.890625%22%20rx%3D%2211.71875%22%20ry%3D%2211.71875%22%20stroke-opacity%3D%221%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.171875%22%2F%3E%3C%2Fsvg%3E) 12.890625 12.890625, crosshair"
    }

}