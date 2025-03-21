var version = "0.4";
var socket;  // 服务器连接
var nickname;
var player_id = "";
var players;
var phase = "end";  // prepare, draw, guess, appreciation, checktime, favourite, end
var the_one;  // 选择最喜欢的画作阶段中，那个选择的人(name)
var is_black = false;  // 除了聊天框，是否有其他功能需求遮罩层
var appreciation;
var ready_num;
var ping_start_time = 0;
var is_touch = false;  // 是否为触摸设备
var colorpicker;
var isReady = false;
var excepted_disconnect = true;  // 如果为fasle，表示连接正常断开
var matched_count = 0;  // 匹配计数
var unmatched_count = 0;  // 不匹配计数

var scenes = ["server", "prepare", "drawing_phase", "guess_phase", "appreciation_phase", "game_over"]
var items = ["players", "turn_now", "num_turn", "chains"]

var EV_game_start = new CustomEvent("game_start");

// 检查是否保存了用户名，服务器地址，id
if (localStorage.getItem('dg_nickname')) {
    nickname = localStorage.getItem('dg_nickname');
    document.getElementById('nickname').value = nickname;
}
if (localStorage.getItem('dg_server_url')) {
    serverUrl = localStorage.getItem('dg_server_url');
    document.getElementById('server_url').value = serverUrl;
}

if (localStorage.getItem('dg_id')) {
    player_id = localStorage.getItem('dg_id');
}


chat("<span style='color: gray'>" + i18n.getTranslation('welcome') + "</span>");
document.getElementById("version").innerHTML = "v" + version;


// ===设置相关===
var default_setting = {
    game_progress: true,
    chat_sound: true,
    shape_tool: false,
    girl_when_waiting: false,
    font_size: 16,
    allowed_delay: 10,
    language: "zh_cn",
    imageSmoothingQuality: "high",
    boardSize: "860x450",
};
var settings = {};
function init_setting(key) {
    if (!localStorage.getItem(key)) {
        var setting = default_setting[key];
        localStorage.setItem(key, JSON.stringify(setting));
        console.log("default", key, setting);
    } else {
        var setting = JSON.parse(localStorage.getItem(key));
        console.log("local", key, setting);
    }
    if (document.getElementById(key).type == "checkbox") {
        document.getElementById(key).checked = setting;
    } else if (document.getElementById(key).type == "range") {
        // 处理数值型设置
        document.getElementById(key).value = setting;
        document.getElementById(key + "_value").textContent = setting;
    } else if (document.getElementById(key).type == "select-one") {
        document.getElementById(key).value = setting;
    }
    settings[key] = setting;
}

for (var key in default_setting) {
    init_setting(key);
}


document.documentElement.style.fontSize = settings.font_size + 'px';

function change_settings() {
    localStorage.setItem("game_progress", JSON.stringify(document.getElementById("game_progress").checked));
    localStorage.setItem("chat_sound", JSON.stringify(document.getElementById("chat_sound").checked));
    localStorage.setItem("shape_tool", JSON.stringify(document.getElementById("shape_tool").checked));
    localStorage.setItem("girl_when_waiting", JSON.stringify(document.getElementById("girl_when_waiting").checked));
    const fontSize = parseInt(document.getElementById("font_size").value);
    localStorage.setItem("font_size", fontSize);
    localStorage.setItem("allowed_delay", parseInt(document.getElementById("allowed_delay").value));
    localStorage.setItem("language", JSON.stringify(document.getElementById("language").value));
    localStorage.setItem("imageSmoothingQuality", JSON.stringify(document.getElementById("imageSmoothingQuality").value));
    localStorage.setItem("boardSize", JSON.stringify(document.getElementById("boardSize").value));
    location.reload();
}
if (!settings.shape_tool) {
    document.getElementById("painter_mode_btns").style.display = "none";
}

document.getElementById("font_size").addEventListener("change", function () {
    const fontSize = parseInt(document.getElementById("font_size").value);
    document.documentElement.style.fontSize = fontSize + 'px';
    document.getElementById("font_size_value").textContent = fontSize;
});
document.getElementById("allowed_delay").addEventListener("change", function () {
    const allowed_delay = parseInt(document.getElementById("allowed_delay").value);
    document.getElementById("allowed_delay_value").textContent = allowed_delay;
});
document.getElementById("language").addEventListener("change", function () {
    i18n.setLanguage(document.getElementById("language").value);
});

// ===设置相关end===



// ===显示相关===

// 显示/隐藏聊天栏
function chatbox() {
    if (document.getElementById('chat').style.display == '') {
        document.getElementById('chat').style.display = 'none';
        if (!is_black) { document.getElementById('black').style.display = 'none'; }
    } else {
        document.getElementById('chat').style.display = '';
        document.getElementById('black').style.display = '';
        var chat_display = document.getElementById('messages');
        chat_display.scrollTop = chat_display.scrollHeight;
        if (!is_touch) { document.getElementById('chat_input').focus(); }
    }
}

// 显示/隐藏工具栏
function toolbar() {
    if (document.getElementById('toolbar').classList.contains('display')) {
        document.getElementById('toolbar').classList.remove('display');
    } else {
        document.getElementById('toolbar').classList.add('display');
    }
}

function clear_window() {
    if (phase != "appreiation") {
        document.getElementById('black').style.display = 'none';
        is_black = false;
        document.getElementById('chat').style.display = 'none';
        document.getElementById('waiting').style.display = 'none';
    }
}

function showSettings() {
    document.getElementById("settings").style.display = "";
}

function closeSettings() {
    document.getElementById("settings").style.display = "none";
}

// ===显示相关end===


// ===用户交互相关===

// 提交图片
function submit_pic() {
    if (!undoStack.length) {
        alert(i18n.getTranslation('draw_nothing'));
        return;
    }
    if (undoStack.length > 10) {
        // 限制上传步数
        var last = undoStack[undoStack.length - 1];
        undoStack = undoStack.slice(0, undoStack.length - 1);
        var k = Math.floor(undoStack.length / 9);
        var res = [];
        for (var i = 0; i < 9; i++) {
            res.push(undoStack[k * i + 1]);
        }
        undoStack = res.concat(last);
    }
    socket.send("[draw]" + JSON.stringify(undoStack));
    document.getElementById('black').style.display = '';
    is_black = true;
    document.getElementById('waiting').style.display = '';
}

// 提交答案
function submitGuess() {
    var guess = document.getElementById('guess').value;
    if (guess == "") {
        alert(i18n.getTranslation('guess_nothing'));
        return;
    }
    document.activeElement.blur(); // 关闭键盘
    socket.send("[guess]" + guess);
    document.getElementById('black').style.display = '';
    is_black = true;
    document.getElementById('waiting').style.display = '';
}

// 提交猜词
function match(is_matched) {
    socket.send("[appreciation]" + is_matched);
    document.getElementById('waiting').style.display = '';
    document.getElementById('match_window').style.display = 'none';
}

function restart() {
    socket.send("[initialization]" + nickname + "," + player_id + "," + version);
    phase = "prepare";
    document.getElementById('prepare').style.display = '';
    document.getElementById('game_over').style.display = 'none';
    document.getElementById('rank').innerHTML = '';
}

function chat_send() {
    /**
      *@type {string} content
    */
    var content = document.getElementById('chat_input').value;
    if (!content) { return; }
    document.getElementById('chat_input').value = '';
    if (content.startsWith("/")) {
        // 指令解析
        content = content.substring(1);
        var flag = false
        var res = content.split('');
        const SPLIT_SYMBOL = "|";
        for (var i = 0; i < content.length; i++) {
            if (content[i] == ' ' && !flag) { res[i] = SPLIT_SYMBOL; }
            if (content[i] == '"') {
                if (flag) {
                    if (i != content.length - 1) {
                        if (content[i + 1] != ' ') { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('syntax_error') + i18n.getTranslation('unexpected_quote') + "</div>"); return; }
                    }
                } else {
                    if (i == 0) { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('syntax_error') + i18n.getTranslation('unexpected_quote_at_beginning') + "</div>"); return; }
                    if (content[i - 1] != ' ') { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('syntax_error') + i18n.getTranslation('unexpected_quote') + "</div>"); return; }
                    flag_index = i;
                }
                flag = !flag;

            }

        }
        if (flag) { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('syntax_error') + i18n.getTranslation('unfinished_quote') + "</div>"); return; }

        content = res.join("").replace(/"/g, "");
        var cmd_blocks = content.split(SPLIT_SYMBOL);
        if (cmd_blocks[0] == "help") {
            if (!check_arguements_num(cmd_blocks.length, [0, 1])) { return; }
            if (cmd_blocks.length == 1) {
                chat(i18n.getTranslation('help.help'));
            } else {
                if (cmd_blocks[1] == "ping") {
                    chat("<div style='color: gray'>" + i18n.getTranslation('help.ping') + "</div>");
                } else if (cmd_blocks[1] == "debug") {
                    //to do
                } else if (cmd_blocks[1] == "get") {
                    chat("<div style='color: gray'>" + i18n.getTranslation('help.get') + "</div>");
                } else if (cmd_blocks[1] == "start") {
                    chat("<div style='color: gray'>" + i18n.getTranslation('help.start') + "</div>");
                } else if (cmd_blocks[1] == "close") {
                    chat("<div style='color: gray'>" + i18n.getTranslation('help.close') + "</div>");
                } else if (cmd_blocks[1] == "send") {
                    chat("<div style='color: gray'>" + i18n.getTranslation('help.send') + "</div>");
                } else {
                    chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('help.unknown', { "arg": cmd_blocks[1] }) + "</div>");
                }
            }
        } else if (cmd_blocks[0] == "ping") {
            if (!check_arguements_num(cmd_blocks.length, 0)) { return; }
            if (!ping_start_time == 0) { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('pinging') + "</div>"); return; }
            if (check_server_connected()) {
                ping_start_time = new Date().getTime();
                socket.send("p");
            } else { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('server_not_connected') + "</div>"); return; }
        } else if (cmd_blocks[0] == "start") {
            if (!check_arguements_num(cmd_blocks.length, 0)) { return; }
            if (check_server_connected()) {
                socket.send("[admin]start");
            } else { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('server_not_connected') + "</div>"); return; }

        } else if (cmd_blocks[0] == "close") {
            if (!check_arguements_num(cmd_blocks.length, 0)) { return; }
            if (check_server_connected()) {
                socket.send("[admin]close");
            } else { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('server_not_connected') + "</div>"); return; }

        } else if (cmd_blocks[0] == "send") {
            if (!check_arguements_num(cmd_blocks.length, 1)) { return; }
            if (check_server_connected()) {
                socket.send(cmd_blocks[1]);
            } else { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('server_not_connected') + "</div>"); return; }

        } else if (cmd_blocks[0] == "debug") {
            if (cmd_blocks[1] == "scene") {
                if (!check_arguements_num(cmd_blocks.length, 2)) { return; }

                if (!scenes.includes(cmd_blocks[2])) {
                    chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('invalid_argument', { "args": scenes }) + "</div>");
                    return;
                }
                Array.prototype.forEach.call(document.getElementsByClassName('scene'), function (element) {
                    element.style.display = "none";
                });
                document.getElementById(cmd_blocks[2]).style.display = "";
            } else if (cmd_blocks[1] == "account") {
                if (!check_arguements_num(cmd_blocks.length, [2, 3])) { return; }
                if (cmd_blocks[2] == "get") {
                    var account = localStorage.getItem("dg_id");
                    if (account) { chat("<div style='color: gray'>ID：" + account + "</div>"); }
                    else { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('no_id') + "</div>"); }
                } else if (cmd_blocks[2] == "set") {
                    if (!check_arguements_num(cmd_blocks.length, 3)) { return; }
                    if (confirm(i18n.getTranslation('id_change_confirm', { "id": cmd_blocks[3] }))) {
                        localStorage.setItem("dg_id", cmd_blocks[3]);
                        chat("<div style='color: gray'>" + i18n.getTranslation('id_changed', { "id": cmd_blocks[3] }) + "</div>");
                    }
                } else { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('unknown_argument', { "arg": cmd_blocks[2] }) + "</div>"); }

            } else if (cmd_blocks[1] == "cmd") {
                if (!check_arguements_num(cmd_blocks.length, 2)) { return; }
                try {
                    var a = eval(cmd_blocks[2]);
                } catch (e) { chat("<div style='color: red'>" + e + "</div>"); }
                chat("<div style='color: gray'>" + a + "</div>");
            } else if (cmd_blocks[1] == "test") {
                if (!check_arguements_num(cmd_blocks.length, 2)) { return; }
                if (cmd_blocks[2] == "audio") {
                    chat("<div style='color: gray'>" + i18n.getTranslation('test.audio') + "</div>");
                    new Audio("assets/win.mp3").play();
                } else if (cmd_blocks[2] == "animation") {
                    chat("<div style='color: gray'>" + i18n.getTranslation('test.animation') + "</div>");
                    anim_start();
                }
            }

            else {
                chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('unknown_argument', { "arg": cmd_blocks[1] }) + "</div>");
            }
        } else if (cmd_blocks[0] == "get") {
            if (!check_arguements_num(cmd_blocks.length, 1)) { return; }

            if (!items.includes(cmd_blocks[1])) {
                chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('invalid_argument', { "arg": items }) + "</div>");
                return;
            }
            if (check_server_connected()) {
                socket.send("[get]" + cmd_blocks[1]);
            } else { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('server_not_connected') + "</div>"); return; }

        } else if (cmd_blocks[0] == "set") {
            if (!check_arguements_num(cmd_blocks.length, 2)) { return; }
            if (!check_server_connected()) { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('server_not_connected') + "</div>"); return; }
            if (cmd_blocks[1] == "wordbook") {
                socket.send("[set_wordbook]" + cmd_blocks[2]);
            }
            else if (cmd_blocks[1] == "turn_num") {
                if (/^-?\d+$/.test(cmd_blocks[2])) {
                    socket.send("[set_turn_num]" + cmd_blocks[2]);
                } else { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('number_argument_required') + "</div>"); return; }
            }
        } else if (cmd_blocks[0] == "kick") {
            if (!check_arguements_num(cmd_blocks.length, 1)) { return; }
            if (check_server_connected()) {
                if (players.includes(cmd_blocks[1])) {
                    socket.send("[kick]" + cmd_blocks[1]);
                } else {
                    chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('player_not_found', { "name": cmd_blocks[1] }) + "</div>"); return;
                }
            } else { chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('server_not_connected') + "</div>"); return; }
        }


        else {
            chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('unknown_command', { "cmd": cmd_blocks[0] }) + "</div>");
        }
    } else {
        // 普通聊天
        if (!check_server_connected()) {
            chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('server_not_connected') + "</div>");
            return;
        }
        socket.send("[chat]" + content);
    }

}


// 聊天框快捷键
window.addEventListener('keydown', function (e) {
    if (document.getElementById("settings").style.display != "none") { return; }
    if (document.getElementById("chat").style.display == "none" && document.activeElement.tagName != "INPUT") {
        if (e.key == "Enter" || e.key == "/" || e.key == "t") {
            e.preventDefault();
            if (e.key == "/" && document.getElementById("chat_input").value == "") { document.getElementById("chat_input").value = "/" }
            chatbox();
        }
    } else if (e.key == "Escape" && document.getElementById("chat").style.display != "none") {
        chatbox();
    }
});

// 回到主界面
function return_to_main() {
    document.getElementById("server").style.display = "";
    document.getElementById("prepare").style.display = "none";
    document.getElementById("drawing_phase").style.display = "none";
    document.getElementById("chat").style.display = "none";
    document.getElementById("waiting").style.display = "none";
    document.getElementById("guess_phase").style.display = "none";
    document.getElementById("appreciation_phase").style.display = "none";
    document.getElementById("favourite").style.display = "none";
    document.getElementById("favourite_choosed").style.display = "none";
    document.getElementById("game_over").style.display = "none";
    document.getElementById("black").style.display = "none";
    is_black = false;
}


window.addEventListener('beforeunload', function (event) {
    if (phase == "prepare" || phase == "end") { return; }
    event.preventDefault();
});

document.getElementById("black").addEventListener("click", function () {
    if (document.getElementById("chat").style.display != "none" && is_black == false) {
        chatbox();
    }
});

// 闭包
function choosePicture(outerVariable) {
    // 选择最喜欢的画作
    return function () {
        socket.send("[favourite]" + outerVariable);
        document.getElementById('favourite').style.display = 'none';
        document.getElementById('waiting').style.display = '';
    }
}

// 退出二次确认
document.addEventListener('plusready', function () {
    var first = null;
    var webview = plus.webview.currentWebview();
    console.log("ready");
    plus.key.addEventListener('backbutton', function () {
        webview.canBack(function (e) {
            if (e.canBack) {
                webview.back();
            } else {
                //首次按键，提示‘再按一次退出应用’
                if (!first) {
                    first = new Date().getTime(); //获取第一次点击的时间戳
                    plus.nativeUI.toast(i18n.getTranslation('press_again_to_exit'), {
                        duration: 'short'
                    }); //通过H5+ API 调用Android 上的toast 提示框
                    setTimeout(function () {
                        first = null;
                    }, 2000);
                } else {
                    if (new Date().getTime() - first < 2000) { //获取第二次点击的时间戳, 两次之差 小于 2000ms 说明2s点击了两次,
                        plus.runtime.quit(); //退出应用
                    }
                }
            }
        });
    });
});

// 确认按钮
const submit_btn = document.getElementById('confirmButton');
let timer = null;
let longPressThreshold = 1000; // 长按阈值，单位为毫秒

submit_btn.addEventListener('mousedown', function (event) {
    submit_btn.classList.add('pressed'); // 添加一个CSS类来改变按钮的样式
    timer = setTimeout(() => {
        // 长按效果
        submit_pic();
    }, longPressThreshold);
});

submit_btn.addEventListener('mouseup', function () {
    clearTimeout(timer); // 清除定时器，防止触发长按效果
    submit_btn.classList.remove('pressed'); // 移除长按样式
});

submit_btn.addEventListener('mouseleave', function () {
    clearTimeout(timer); // 如果鼠标离开按钮，也清除定时器
    submit_btn.classList.remove('pressed'); // 移除长按样式
});

// 添加触摸事件监听器
submit_btn.addEventListener('touchstart', function (event) {
    event.preventDefault(); // 阻止默认行为，防止点击事件被触发
    submit_btn.classList.add('pressed'); // 添加一个CSS类来改变按钮的样式
    timer = setTimeout(() => {
        // 长按效果
        submit_pic();
        submit_btn.classList.remove('pressed');
    }, longPressThreshold);
});

submit_btn.addEventListener('touchend', function () {
    clearTimeout(timer); // 清除定时器，防止触发长按效果
    submit_btn.classList.remove('pressed'); // 移除长按样式
});

// 确认按钮 end

// 阻止右键菜单
document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
});

function connectButton() {
    if (localStorage.getItem('unfinished_game')) {
        alert(i18n.getTranslation('unfinished_game'));
    }
    connectServer();
}

// 设置选项卡切换
var currentTab = "graphics_settings";
function change_tab(tab) {
    document.getElementById(currentTab).classList.remove("active");
    document.getElementById(tab).classList.add("active");
    document.getElementById(currentTab + "_btn").classList.remove("active");
    document.getElementById(tab + "_btn").classList.add("active");
    currentTab = tab;
}

// ===用户交互相关end===


// ===动画相关start===

// 入场动画
function anim_start() {
    const mask = document.createElement('div');
    mask.className = 'circle';
    document.body.appendChild(mask);
    mask.addEventListener('animationend', () => {
        if (phase != "prepare") {
            if (mask.classList.contains('smallen')) {
                mask.remove();
            } else {
                mask.classList.add('smallen');
            }
        } else {
            document.addEventListener('game_start', function () {
                mask.classList.add('smallen');
            });
        };
    });
}

// ===动画相关end===

/**
 * @description 聊天栏显示消息的一级函数
 */
function chat(message) {
    var chat_display = document.getElementById('messages');
    var chat_pre = document.getElementById("chat_preview_list");
    var chat_item = document.createElement('li');
    chat_item.innerHTML = message;
    chat_display.appendChild(chat_item.cloneNode(true));
    chat_display.scrollTop = chat_display.scrollHeight;
    chat_pre.appendChild(chat_item);
    chat_pre.scrollTop = chat_pre.scrollHeight;
    chat_pre.classList.remove("empty");
    setTimeout(function () {
        chat_item.classList.add("fade");
    }, 3500);
    setTimeout(function () {
        chat_pre.removeChild(chat_item);
        if (chat_pre.children.length == 0) {
            chat_pre.classList.add("empty");
        }
    }, 4000);
}

function check_arguements_num(blocks_length, num) {
    if (typeof num == "number") { num = [num]; }
    if (!num.includes(blocks_length - 1)) {
        var num_str = "";
        for (var i = 0; i < num.length; i++) {
            if (i != 0) { num_str += i18n.getTranslation('or'); }
            num_str += num[i];
        }
        chat("<div style='color: red'>" + i18n.getTranslation('error') + i18n.getTranslation('arg_nums_not_match', { "num": num_str, "actual": (blocks_length - 1) }) + "</div>");
        return false;
    } else {
        return true;
    }
}

function check_server_connected() {
    if (socket) {
        if (socket.readyState != 1 || phase == "end") {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }


}

function clearStorage() {
    if (confirm(i18n.getTranslation('clear_storage_confirm'))) {
        if (confirm(i18n.getTranslation('clear_storage_confirm_2'))) {
            localStorage.clear();
            alert(i18n.getTranslation('clear_storage_success'));
        }
    }
}


function openURL(url) {
    if (window.plus) {
        // 如果是在App中运行，则使用plus.runtime.openURL打开链接
        plus.runtime.openURL(url);
    } else {
        // 如果是在浏览器中运行，则使用window.open打开链接
        window.open(url);
    }
}

// 自动ping
setInterval(function () {
    if (check_server_connected()) {
        if (ping_start_time == 0) {
            ping_start_time = new Date().getTime();
            socket.send("p");
        } else {
            if (new Date().getTime() - ping_start_time > settings["allowed_delay"] * 1000) {
                alert(i18n.getTranslation('no_response', { "delay": settings["allowed_delay"] }));
                socket.close();
            }
        }
    }
}, 3000);

// 准备/取消准备功能
function toggleReady() {
    isReady = !isReady;
    if (isReady) {
        socket.send("[pready]");
        document.getElementById('readyBtn').textContent = i18n.getTranslation('cancel_ready');
        document.getElementById('waitingText').style.display = '';
    } else {
        socket.send("[unpready]");
        document.getElementById('readyBtn').textContent = i18n.getTranslation('ready');
        document.getElementById('waitingText').style.display = 'none';
    }
}

// 更新玩家准备状态的函数
function updatePlayerReadyStatus(name, isReady) {
    const playerList = document.getElementById('players').getElementsByTagName('li');
    for (let li of playerList) {
        if (li.childNodes[0].textContent == name) {
            let img = li.querySelector('.ready-status');
            if (!img) {
                img = document.createElement('img');
                img.className = 'ready-status';
                li.appendChild(img);
            }
            img.src = isReady ? 'assets/right.png' : 'assets/wrong.png';
            img.alt = isReady ? i18n.getTranslation('readied') : i18n.getTranslation('unreadied');
            break;
        }
    }
}



function connectServer() {
    var serverUrl = document.getElementById('server_url').value;
    nickname = document.getElementById('nickname').value;
    // 检查输入是否合法
    if (!serverUrl) {
        alert(i18n.getTranslation("empty_url"));
        return;
    }
    if (!nickname) {
        alert(i18n.getTranslation("empty_name"));
        return;
    }
    // 检查昵称是否合法
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(nickname)) {
        alert(i18n.getTranslation('invalid_name'));
        return;
    }
    // 保存用户名和服务器地址
    localStorage.setItem('dg_nickname', nickname);
    localStorage.setItem('dg_server_url', serverUrl);
    serverUrl = serverUrl.replace("http://", "");
    serverUrl = serverUrl.replace("https://", "");
    socket = new WebSocket("ws://" + serverUrl);
    socket.onopen = function () {
        console.log('WebSocket连接成功');
        if (localStorage.getItem('unfinished_game')) {
            socket.send("[reconnect]" + player_id);
        } else {
            socket.send("[initialization]" + nickname + "," + player_id + "," + version);
        }
    };
    socket.onmessage = function (event) {
        console.log('服务器返回消息：', event.data);
        // 如果是"name_exists"，表示昵称已存在
        if (event.data == 'name_exists') {
            alert(i18n.getTranslation('repeated_name'));
            return_to_main();
            return;
        }
        // 如果是"playing"，表示游戏已经开始
        else if (event.data == 'playing') {
            alert(i18n.getTranslation('gaming'));
            return_to_main();
            return;
        }
        // 如果是"start"，表示游戏开始
        else if (event.data == 'start') {
            if (settings.game_progress) {
                chat('<span style="color: gold">' + i18n.getTranslation('game_start') + '</span>');
            }
            localStorage.setItem('unfinished_game', true);
            anim_start();
        }
        else if (event.data.startsWith('[new_player]')) {
            var player = event.data.substring(12);
            var li = document.createElement('li');
            li.innerHTML = "<span>" + player + "</span>";
            document.getElementById('players').appendChild(li);
            updatePlayerReadyStatus(player, false);
            document.getElementById('num_of_players').textContent = document.getElementById('players').getElementsByTagName('li').length;

            chat('<span style="color: gold">' + player + i18n.getTranslation('joined') + '</span>');
            players.push(player);
        }
        // 如果以[all_players]开头，表示返回了一个包含所有玩家的json列表
        else if (event.data.startsWith('[all_players]')) {
            players = JSON.parse(event.data.substring(13));
            players_names = [];
            document.getElementById('players').innerHTML = '';
            players.forEach(function (player) {
                var li = document.createElement('li');
                li.innerHTML = "<span>" + player[0] + "</span>";
                document.getElementById('players').appendChild(li);
                updatePlayerReadyStatus(player[0], player[1]);
                players_names.push(player[0]);
            });
            players = players_names;
            document.getElementById('num_of_players').textContent = players.length;
            isReady = false;
            document.getElementById('readyBtn').textContent = i18n.getTranslation('ready');
            document.getElementById('waitingText').style.display = 'none';
        }
        // 如果以[id]开头，表示返回了玩家的id
        else if (event.data.startsWith('[id]')) {
            player_id = event.data.substring(4);
            localStorage.setItem('dg_id', player_id);
        }
        // 如果以[draw]开头，表示进入画图阶段
        else if (event.data.startsWith('[draw]')) {
            phase = 'draw';
            document.getElementById('ready_players').innerHTML = '';
            ready_num = 0;
            clearCanvas();
            change_linewidth(2, 3.323396301269531);
            document.getElementById('prepare').style.display = 'none';
            clear_window();
            document.getElementById('toolbar').classList.remove('display');
            document.getElementById('guess_phase').style.display = 'none';
            document.getElementById('drawing_phase').style.display = '';
            document.getElementById('word').textContent = event.data.substring(6);
            var time = 120;
            document.getElementById('countdown_draw').textContent = time;
            document.getElementById('countdown_draw').style.color = 'black';
            var interval = setInterval(function () {
                time--;
                document.getElementById('countdown_draw').textContent = time;
                if (time == 3) { new Audio('assets/countdown.mp3').play(); document.getElementById('countdown_draw').style.color = 'red'; }
                if (time <= 0 || phase != 'draw') {
                    if (time <= 0) { submit_pic(); }
                    clearInterval(interval);
                }
            }, 1000);
        }
        // 如果以[guess]开头，表示返回了题目
        else if (event.data.startsWith('[guess]')) {
            phase = 'guess';
            document.getElementById('ready_players').innerHTML = '';
            ready_num = 0;
            document.getElementById('guess').value = '';
            clear_window();
            document.getElementById('drawing_phase').style.display = 'none';
            document.getElementById('guess_phase').style.display = '';
            document.getElementById('pic').style.backgroundImage = "url(" + event.data.substring(7) + ")";
            var time = 60;
            document.getElementById('countdown_guess').textContent = time;
            document.getElementById('countdown_draw').style.color = 'black';
            var interval = setInterval(function () {
                time--;
                document.getElementById('countdown_guess').textContent = time;
                if (time == 3) { new Audio('assets/countdown.mp3').play(); document.getElementById('countdown_draw').style.color = 'red'; }
                if (time <= 0 || phase != 'guess') {
                    if (time <= 0) { submitGuess(); }
                    clearInterval(interval);
                }
            }, 1000);
        }
        // 如果以[done]开头，表示有人完成
        else if (event.data.startsWith('[done]')) {
            var id = event.data.substring(6);
            if (settings.game_progress) {
                chat('<span style="color: gold">' + id + i18n.getTranslation('finished') + '</span>');
            }
            var li = document.createElement('li');
            li.innerHTML = id + "<img src='assets/right.png' width='20' height='20'>";
            document.getElementById('ready_players').appendChild(li);
            ready_num++;
            document.getElementById('ready_players_num').textContent = ready_num + '/' + players.length;
        }
        // 如果以[appreciation]开头，表示返回了json评价
        else if (event.data.startsWith('[appreciation]')) {
            phase = 'appreciation';
            document.getElementById('black').style.display = 'none';
            document.getElementById('chat').style.display = 'none';
            document.getElementById('waiting').style.display = 'none';
            document.getElementById('favourite_choosed').style.display = 'none';
            is_black = false;
            document.getElementById('guess_phase').style.display = 'none';
            document.getElementById('appreciation_phase').style.display = '';
            document.getElementById('favourite').style.display = 'none';
            appreciation = JSON.parse(event.data.substring(14));


            document.getElementById('first_word_window').style.display = '';
            document.getElementById('first_word_display').textContent = '';
            document.getElementById('guesser').textContent = '';
            document.getElementById('drawer').textContent = '';
            document.getElementById('appr_word').textContent = '';
            new Audio("assets/announce.mp3").play();

            var pic_index = 0;

            setTimeout(function () {
                document.getElementById('first_word_display').textContent = appreciation.first_word;
            }, 690);

            setTimeout(function () {
                document.getElementById('first_word_window').style.display = 'none';
                cyclic_bar();
            }, 3000);


            function cyclic_bar() {
                // 循环节
                var index = 0;
                /** @type {list<string>} */
                var picture = appreciation.pictures[pic_index];
                document.getElementById('drawer').textContent = appreciation.players[pic_index * 2];
                if (pic_index == 0) {
                    document.getElementById('appr_word').textContent = appreciation.first_word;
                } else {
                    document.getElementById('appr_word').textContent = appreciation.words[pic_index - 1];
                }
                var guesser = document.getElementById("guesser");
                var guesser_text = appreciation.words[pic_index];
                guesser.textContent = appreciation.players[pic_index * 2 + 1];
                function next_pic() {
                    // 切换到下一张过程图
                    document.getElementById("appr_pic").style.backgroundImage = "url(" + picture[index] + ")";
                    index++;
                    if (index > picture.length - 1) {
                        // 绘画过程播放完毕
                        clearInterval(timer);
                        setTimeout(function () {
                            new Audio("assets/announce.mp3").play();
                            setTimeout(function () {
                                if (guesser_text.endsWith(i18n.getTranslation('new_word'))) {
                                    guesser.textContent += i18n.getTranslation('guess_nothing') + guesser_text.substring(0, guesser_text.length - 3);
                                } else {
                                    guesser.textContent += " " + i18n.getTranslation('guess') + guesser_text;
                                }
                            }, 690);

                            setTimeout(function () {
                                pic_index++;

                                if (pic_index < appreciation.pictures.length) {
                                    // 若不是最后一小节，则播放下一小节
                                } else {
                                    // 若是最后一小节，则显示等待窗口并发送播放完毕的信号
                                    document.getElementById('waiting').style.display = '';
                                    document.getElementById('black').style.display = '';
                                    is_black = true;
                                    socket.send("[ready]");
                                }
                            }, 5000);
                        }, 1000);
                    }

                }
                var timer = setInterval(next_pic, 500);
                next_pic();


            }


            document.getElementById('appreciation_result').textContent = appreciation.first_word + " -> " + appreciation.words[appreciation.words.length - 1];
            if (appreciation.first_word == appreciation.words[appreciation.words.length - 1]) {
                document.getElementById('is_match').innerHTML = i18n.getTranslation('match_complete');
                document.getElementById('unmatch').style.display = 'none';
            } else { document.getElementById('unmatch').style.display = ''; document.getElementById('is_match').innerHTML = i18n.getTranslation('is_it_match'); }

            document.getElementById('ready_players').innerHTML = '';
            ready_num = 0;

            // 设置#choice_list的内容
            var choice_list = document.getElementById('choice_list');
            choice_list.innerHTML = '';
            for (var i = 0; i < appreciation.pictures.length; i++) {
                var option = document.createElement('button');
                option.value = i;
                option.innerHTML = "<img src='" + appreciation.pictures[i][appreciation.pictures[i].length - 1] + "' width='100px' height='100px'>";
                option.onclick = choosePicture(i);
                option.classList.add('choice_button');
                choice_list.appendChild(option);
            }

        }
        // 如果是[checktime]，则表示进入给出评价阶段
        else if (event.data.startsWith('[checktime]')) {
            phase = 'checktime';
            document.getElementById('waiting').style.display = 'none';
            document.getElementById('match_window').style.display = '';
            document.getElementById('black').style.display = '';
            is_black = true;
            var time = 20;
            document.getElementById('countdown_appreciation').textContent = time;
            document.getElementById('countdown_draw').style.color = 'black';
            document.getElementById('match_ratio').innerHTML = "<span style='color: gray;'>|</span>".repeat(players.length);
            matched_count = 0;
            unmatched_count = 0;
            var interval = setInterval(function () {
                time--;
                document.getElementById('countdown_appreciation').textContent = time;
                if (time == 3) { new Audio('assets/countdown.mp3').play(); document.getElementById('countdown_draw').style.color = 'red'; }
                if (time <= 0 || phase != 'checktime') {
                    clearInterval(interval);
                }
            }, 1000);
        }
        // 如果以[favourite]开头，则表示进入评价最喜欢的画作阶段
        else if (event.data.startsWith('[favourite]')) {
            phase = 'favourite';
            document.getElementById('match_ratio').innerHTML = "";
            document.getElementById('favourite').style.display = '';
            document.getElementById('waiting').style.display = 'none';
            document.getElementById('match_window').style.display = 'none';
            document.getElementById('black').style.display = '';
            is_black = true;
            if (nickname == event.data.substring(11)) {
                document.getElementById('if_the_one').style.display = '';
                document.getElementById('if_not_the_one').style.display = 'none';
                Array.prototype.forEach.call(document.getElementsByClassName('choice_button'), function (button) {
                    button.disabled = false;
                });
                // #choic_list的内容在appreciation阶段设置

            } else {
                document.getElementById('the_one').innerHTML = event.data.substring(11);
                document.getElementById('if_the_one').style.display = 'none';
                document.getElementById('if_not_the_one').style.display = '';
                Array.prototype.forEach.call(document.getElementsByClassName('choice_button'), function (button) {
                    button.disabled = true;
                });
            }
            var time = 20;
            document.getElementById('countdown_favourite').textContent = time;
            document.getElementById('countdown_draw').style.color = 'black';
            var interval = setInterval(function () {
                time--;
                document.getElementById('countdown_favourite').textContent = time;
                if (time == 3) { new Audio('assets/countdown.mp3').play(); document.getElementById('countdown_draw').style.color = 'red'; }
                if (time <= 0 || phase != 'favourite') {
                    clearInterval(interval);
                }
            }, 1000);
        }
        // 如果以[favourite_choosed]开头，则表示最喜欢的画作被选择了
        else if (event.data.startsWith('[favourite_choosed]')) {
            new Audio("assets/win.mp3").play();
            document.getElementById('favourite').style.display = 'none';
            document.getElementById('waiting').style.display = 'none';
            document.getElementById('favourite_choosed').style.display = '';
            document.getElementById('chooser').textContent = appreciation.players[appreciation.players.length - 1];
            document.getElementById('favourite_pic').src =
                appreciation.pictures[event.data.substring(19)][appreciation.pictures[event.data.substring(19)].length - 1];
            if (settings.game_progress) {
                chat('<span style="color: gold">' + i18n.getTranslation('favourite_chosed', { "index": (Number(event.data.substring(19)) + 1) }) + "</span>");
            }
        }
        // 如果以[checked]开头，表示有人已经评价了画作
        else if (event.data.startsWith('[checked]')) {
            var data = event.data.substring(9).split(',');
            if (settings.game_progress) {
                chat('<span style="color: gold">' + data[0] + i18n.getTranslation('check') + data[1] + "</span>");
            }
            var rd_players = document.getElementById('ready_players');
            rd_players.appendChild(document.createElement('li')).innerHTML = data[0] + "<img height='20px' width='20px' src='assets/" + data[1] + ".png'>";
            ready_num++;
            document.getElementById('ready_players_num').innerHTML = ready_num + "/" + players.length;
            new Audio("assets/check.mp3").play();
            if (data[1] == "right") {
                matched_count++;
            } else {
                unmatched_count++;
            }
            const bar = document.getElementById('match_ratio');
            bar.innerHTML = "<span style='color: green;'>|</span>".repeat(matched_count) + "<span style='color: gray;'>|</span>".repeat(players.length - matched_count - unmatched_count) + "<span style='color: red;'>|</span>".repeat(unmatched_count);
        }
        // 如果以[end]开头，则表示游戏结束
        else if (event.data.startsWith('[end]')) {
            phase = 'end';
            localStorage.setItem('unfinished_game', '');
            document.getElementById('game_over').style.display = '';
            document.getElementById('waiting').style.display = 'none';
            document.getElementById('appreciation_phase').style.display = 'none';
            document.getElementById('favourite').style.display = 'none';
            document.getElementById('favourite_choosed').style.display = 'none';
            document.getElementById('black').style.display = 'none';
            is_black = false;
            document.getElementById('chat').style.display = 'none';
            var grades = event.data.substring(5); //这是json字符串数组
            grades = JSON.parse(grades); //将json字符串数组转换为JavaScript数组
            var rank_display = document.getElementById('rank');
            rank_display.innerHTML = '';
            for (var i = 0; i < grades.length; i++) {
                var rank_item = document.createElement('li');
                rank_item.innerHTML = grades[i][0] + '：' + grades[i][1];
                rank_display.appendChild(rank_item);
            }
        }
        // 如果以[leave]开头，则表示有人离开了房间
        else if (event.data.startsWith('[leave]')) {
            var data = event.data.substring(7);
            chat('<span style="color: gold">' + data + i18n.getTranslation('leave') + "</span>");
            if (phase == "prepare") {
                if (players.indexOf(data) != -1) {
                    document.getElementById('players').children[players.indexOf(data)].remove();
                    document.getElementById('num_of_players').textContent = document.getElementById('players').getElementsByTagName('li').length;
                    players.splice(players.indexOf(data), 1);
                }
            }
        }
        // 如果以[chat]开头，表示有人发送了消息
        else if (event.data.startsWith('[chat]')) {
            var data = event.data.substring(6);
            if (settings.chat_sound) {
                new Audio("assets/notice.mp3").play();
            }
            chat(data);
        }
        // 如果是p，表示返回了响应ping
        else if (event.data == 'p') {
            let p = (new Date().getTime() - ping_start_time)
            if (p < 100) {
                var color = "green";
            } else if (p < 1000) {
                var color = "orange";
            } else {
                var color = "red";
            }
            document.getElementById('ping').innerHTML = "<span style='color:" + color + "'>ping:" + p + "ms</span>";
            ping_start_time = 0;
        }
        // 如果是[not_admin]，表示不是管理员
        else if (event.data == '[not_admin]') {
            chat('<span style="color: red">' + i18n.getTranslation('not_admin') + '</span>');
        }
        // 如果以[wordbook]开头，表示返回了词库
        else if (event.data.startsWith('[wordbook]')) {
            var data = event.data.substring(10);
            document.getElementById('wordbook_name').innerHTML = data;
            chat('<span style="color: gray">' + i18n.getTranslation('wordbook_changed') + data + '</span>');
        }
        // 如果是[set_wordbook_error]，表示设置词库失败
        else if (event.data == '[set_wordbook_error]') {
            chat('<span style="color: red">' + i18n.getTranslation('set_wordbook_error') + '</span>');
        }
        // 重连相关
        else if (event.data.startsWith('preparing')) {
            alert(i18n.getTranslation('end'));
            localStorage.setItem('unfinished_game', '');
            return_to_main();
        }
        else if (event.data.startsWith('[refuse]')) {
            alert(i18n.getTranslation('refuse'));
            localStorage.setItem('unfinished_game', '');
            return_to_main();
        }
        else if (event.data.startsWith('[reconnect_success]')) {
            chat('<span style="color: gray">' + i18n.getTranslation('connected') + '</span>');
            if (parseInt(event.data.substring(19)) % 2 == 0) {
                phase = "draw";
                document.getElementById('drawing_phase').style.display = '';
                document.getElementById('guess_phase').style.display = 'none';
                document.getElementById('prepare').style.display = 'none';
                document.getElementById('server').style.display = 'none';
            } else {
                phase = "guess";
                document.getElementById('drawing_phase').style.display = 'none';
                document.getElementById('guess_phase').style.display = '';
                document.getElementById('prepare').style.display = 'none';
                document.getElementById('server').style.display = 'none';
            }

        }
        else if (event.data.startsWith('[reconnected]')) {
            chat('<span style="color: gold">' + event.data.substring(13) + i18n.getTranslation('rejoined') + "</span>");
        }
        else if (event.data.startsWith('not_found')) {
            alert(i18n.getTranslation('no_game'));
            localStorage.setItem('unfinished_game', '');
            return_to_main();
        }
        // 如果是version_error，表示版本错误
        else if (event.data.startsWith('version_error')) {
            alert(i18n.getTranslation('version_error'));
            localStorage.setItem('unfinished_game', '');
            return_to_main();
        }
        // 如果以[turn_num]开头，表示返回了轮数
        else if (event.data.startsWith('[turn_num]')) {
            var turn_num = parseInt(event.data.substring(10));
            if (turn_num == 0) { turn_num = i18n.getTranslation('equal_players_num'); }
            document.getElementById('turn_num').innerHTML = turn_num;
            chat('<span style="color: gray">' + i18n.getTranslation('turn_num_changed') + turn_num + '</span>');
        }
        // 如果以[draw_with_options]开头，表示返回了画图选项
        else if (event.data.startsWith('[draw_with_options]')) {
            phase = 'draw';
            document.getElementById('ready_players').innerHTML = '';
            ready_num = 0;
            clearCanvas();
            change_linewidth(2, 3.323396301269531);
            document.getElementById('prepare').style.display = 'none';
            clear_window();
            document.getElementById('toolbar').classList.remove('display');
            document.getElementById('guess_phase').style.display = 'none';
            document.getElementById('drawing_phase').style.display = '';
            document.getElementById('first_word_options').style.display = '';
            var options = JSON.parse(event.data.substring(19));
            document.getElementById('first_word_options_list').innerHTML = '';
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                var button = document.createElement('button');
                button.innerHTML = option;
                button.classList.add('first_word_option');
                button.onclick = function () {
                    socket.send('[first_word_choosed]' + this.innerHTML);
                    document.getElementById('first_word_options').style.display = 'none';
                    document.getElementById('word').innerHTML = this.innerHTML;
                };
                document.getElementById('first_word_options_list').appendChild(button);
            }



            var time = 120;
            document.getElementById('countdown_draw').textContent = time;
            document.getElementById('countdown_draw').style.color = 'black';
            var interval = setInterval(function () {
                time--;
                document.getElementById('countdown_draw').textContent = time;
                if (time == 3) {
                    new Audio('assets/countdown.mp3').play();
                    document.getElementById('countdown_draw').style.color = 'red';
                }
                if (time <= 0 || phase != 'draw') {
                    if (time <= 0) {
                        if (getElementById('first_word_options').style.display == '') { socket.send('[first_word_choosed]' + options[0]); }
                        if (undoStack.length > 0) { submit_pic(); }
                    }
                    document.getElementById('first_word_options').style.display = 'none';
                    clearInterval(interval);
                }
            }, 1000);
            document.dispatchEvent(EV_game_start);
        }
        // 准备相关
        else if (event.data.startsWith('[pready]')) {
            const name = event.data.substring(8);
            updatePlayerReadyStatus(name, true);
        }
        else if (event.data.startsWith('[unpready]')) {
            const name = event.data.substring(10);
            updatePlayerReadyStatus(name, false);
        }
        // 如果是[kicked]，表示被踢出了房间
        else if (event.data == '[kicked]') {
            alert(i18n.getTranslation('kicked'));
            excepted_disconnect = false;
            localStorage.setItem('unfinished_game', '');
        }
        else if (event.data.startsWith('[kick]')) {
            const name = event.data.substring(6);
            chat('<span style="color: gold">' + name + i18n.getTranslation('be_kicked') + "</span>");
        }
        //如果都不是，表示服务器直接发送的信息
        else {
            chat('<span style="color: gray">' + event.data + '</div>');
        }

    };
    socket.onclose = function () {
        console.log('WebSocket连接关闭');
        if (excepted_disconnect) {
            alert(i18n.getTranslation('disconnected'));
            if (phase == "draw" || phase == "guess") {
                connectServer();
                return;
            }
        }
        return_to_main();
    };
    socket.onerror = function () {
        console.log('WebSocket连接出错');
        alert(i18n.getTranslation('connect_error'));
        return_to_main();
    };
    document.getElementById('server').style.display = 'none';
    document.getElementById('prepare').style.display = '';
    document.getElementById('readyBtn').textContent = i18n.getTranslation('ready');
    document.getElementById('waitingText').style.display = 'none';
    phase = "prepare";
}