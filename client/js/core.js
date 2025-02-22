var version = "0.31";
var socket;
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


function connectServer() {
    var serverUrl = document.getElementById('server_url').value;
    nickname = document.getElementById('nickname').value;
    // 检查输入是否合法
    if (!serverUrl) {
        alert('请输入服务器地址');
        return;
    }
    if (!nickname) {
        alert('请输入昵称');
        return;
    }
    // 检查昵称是否合法
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(nickname)) {
        alert('昵称只能包含汉字、字母、数字、下划线');
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
            alert('房间内已有同名玩家，请更换昵称');
            return_to_main();
            return;
        }
        // 如果是"playing"，表示游戏已经开始
        else if (event.data == 'playing') {
            alert('游戏已经开始，请等待下一局');
            return_to_main();
            return;
        }
        // 如果是"start"，表示游戏开始
        else if (event.data == 'start') {
            if (settings.game_progress) {
                chat('<span style="color: gold">游戏开始</span>');
            }
            localStorage.setItem('unfinished_game', true);
        }
        else if (event.data.startsWith('[new_player]')) {
            var player = event.data.substring(12);
            var li = document.createElement('li');
            li.innerHTML = "<span>" + player + "</span>";
            document.getElementById('players').appendChild(li);
            updatePlayerReadyStatus(player, false);
            document.getElementById('num_of_players').textContent = document.getElementById('players').getElementsByTagName('li').length;

            chat('<span style="color: gold">' + player + '加入了游戏' + '</span>');
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
document.getElementById('readyBtn').textContent = "准备游戏";
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
                chat('<span style="color: gold">' + id + '完成了' + '</span>');
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
                function a() {
                    document.getElementById("appr_pic").style.backgroundImage = "url(" + picture[index] + ")";
                    index++;
                    if (index > picture.length - 1) {
                        new Audio("assets/announce.mp3").play();
                        setTimeout(function () {
                            if (guesser_text.endsWith("(新词)")) {
                                guesser.textContent += " 什么也没猜到！新词：" + guesser_text.substring(0, guesser_text.length - 3);
                            } else {
                                guesser.textContent += " 猜了：" + guesser_text;
                            }
                        }, 690);

                        setTimeout(function () {
                            pic_index++;

                            if (pic_index < appreciation.pictures.length) {
                                cyclic_bar();
                            } else {
                                document.getElementById('waiting').style.display = '';
                                document.getElementById('black').style.display = '';
                                is_black = true;
                                socket.send("[ready]");
                            }
                        }, 5000);
                        clearInterval(timer);
                    }


                }
                var timer = setInterval(a, 500);
                a();


            }




            document.getElementById('appreciation_result').textContent = appreciation.first_word + " -> " + appreciation.words[appreciation.words.length - 1];
            if (appreciation.first_word == appreciation.words[appreciation.words.length - 1]) {
                document.getElementById('is_match').innerHTML = "完全匹配！";
                document.getElementById('unmatch').style.display = 'none';
            } else { document.getElementById('unmatch').style.display = ''; document.getElementById('is_match').innerHTML = "这个匹配吗？"; }

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
                chat('<span style="color: gold">' + "第" + (Number(event.data.substring(19)) + 1) + "张画作被选为最喜欢的画作" + "</span>");
            }
        }
        // 如果以[checked]开头，表示有人已经评价了画作
        else if (event.data.startsWith('[checked]')) {
            var data = event.data.substring(9).split(',');
            if (settings.game_progress) {
                chat('<span style="color: gold">' + data[0] + "评价：" + data[1] + "</span>");
            }
            var rd_players = document.getElementById('ready_players');
            rd_players.appendChild(document.createElement('li')).innerHTML = data[0] + "<img height='20px' width='20px' src='assets/" + data[1] + ".png'>";
            ready_num++;
            document.getElementById('ready_players_num').innerHTML = ready_num + "/" + players.length;
            new Audio("assets/check.mp3").play();
if(data[1]=="right"){
matched_count++;
}else{
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
            chat('<span style="color: gold">' + data + "离开了房间" + "</span>");
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
            chat('<span style="color: red">你没有运行此命令的权限。</span>');
        }
        // 如果以[wordbook]开头，表示返回了词库
        else if (event.data.startsWith('[wordbook]')) {
            var data = event.data.substring(10);
            document.getElementById('wordbook_name').innerHTML = data;
            chat('<span style="color: gray">词库被修改：' + data + '</span>');
        }
        // 如果是[set_wordbook_error]，表示设置词库失败
        else if (event.data == '[set_wordbook_error]') {
            chat('<span style="color: red">词库不存在。</span>');
        }
        // 重连相关
        else if (event.data.startsWith('preparing')) {
            alert("游戏已经结束");
            localStorage.setItem('unfinished_game', '');
            return_to_main();
        }
        else if (event.data.startsWith('[refuse]')) {
            alert("错过了时机，无法加入游戏");
            localStorage.setItem('unfinished_game', '');
            return_to_main();
        }
        else if (event.data.startsWith('[reconnect_success]')) {
            chat('<span style="color: gray">重新连接成功！注意：重连还在开发中，有一堆bug！</span>');
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
            chat('<span style="color: gold">' + event.data.substring(13) + "重新加入了房间" + "</span>");
        }
        else if (event.data.startsWith('not_found')) {
            alert("找不到游戏");
            localStorage.setItem('unfinished_game', '');
            return_to_main();
        }
        // 如果是version_error，表示版本错误
        else if (event.data.startsWith('version_error')) {
            alert("版本错误，请更新客户端");
            localStorage.setItem('unfinished_game', '');
            return_to_main();
        }
        // 如果以[turn_num]开头，表示返回了轮数
        else if (event.data.startsWith('[turn_num]')) {
            var turn_num = parseInt(event.data.substring(10));
            if (turn_num == 0) { turn_num = "=玩家数"; }
            document.getElementById('turn_num').innerHTML = turn_num;
            chat('<span style="color: gray">回合数被修改：' + turn_num + '</span>');
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
            alert("你被管理员踢出了房间");
            excepted_disconnect = false;
            localStorage.setItem('unfinished_game', '');
        }
        else if (event.data.startsWith('[kick]')) {
            const name = event.data.substring(6);
            chat('<span style="color: gold">' + name + "被管理员踢出了房间" + "</span>");
        }
        //如果都不是，表示服务器直接发送的信息
        else {
            chat('<span style="color: gray">' + event.data + '</div>');
        }

    };
    socket.onclose = function () {
        console.log('WebSocket连接关闭');
        if (excepted_disconnect) {
            alert("与服务器断开连接");
            if (phase == "draw" || phase == "guess") {
                connectServer();
                return;
            }
        }
        return_to_main();
    };
    socket.onerror = function () {
        console.log('WebSocket连接出错');
        alert("连接服务器失败，请检查网络连接");
        return_to_main();
    };
    document.getElementById('server').style.display = 'none';
    document.getElementById('prepare').style.display = '';
    document.getElementById('readyBtn').textContent = "准备游戏";
    document.getElementById('waitingText').style.display = 'none';
    phase = "prepare";
}

// 提交图片
function submit_pic() {
    if (!undoStack.length) {
        alert("啥也不画？");
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
        alert("啥也不猜？");
        return;
    }
    document.activeElement.blur(); // 关闭键盘
    socket.send("[guess]" + guess);
    document.getElementById('black').style.display = '';
    is_black = true;
    document.getElementById('waiting').style.display = '';
}

// 是否匹配
function match(is_matched) {
    socket.send("[appreciation]" + is_matched);
    document.getElementById('waiting').style.display = '';
    document.getElementById('match_window').style.display = 'none';
}

// 闭包

function choosePicture(outerVariable) {
    // 选择最喜欢的画作
    return function () {
        socket.send("[favourite]" + outerVariable);
        document.getElementById('favourite').style.display = 'none';
        document.getElementById('waiting').style.display = '';
    }
}

// chatbox
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

// toolbar
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

function restart() {
    socket.send("[initialization]" + nickname + "," + player_id + "," + version);
    phase = "prepare";
    document.getElementById('prepare').style.display = '';
    document.getElementById('game_over').style.display = 'none';
    document.getElementById('rank').innerHTML = '';
}

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

function chat_send() {
    /**
      *@type {string} content
    */
    var content = document.getElementById('chat_input').value;
    if (!content) { return; }
    document.getElementById('chat_input').value = '';
    if (content.startsWith("/")) {
        // 指令
        content = content.substring(1);
        var flag = false
        var flag_index;
        var res = content.split('');
        const SPLIT_SYMBOL = "|";
        for (var i = 0; i < content.length; i++) {
            if (content[i] == ' ' && !flag) { res[i] = SPLIT_SYMBOL; }
            if (content[i] == '"') {
                if (flag) {
                    if (i != content.length - 1) {
                        if (content[i + 1] != ' ') { chat("<div style='color: red'>语法错误：unexpected \"</div>"); return; }
                    }
                } else {
                    if (i == 0) { chat("<div style='color: red'>语法错误：unexpected \" at begining.</div>"); return; }
                    if (content[i - 1] != ' ') { chat("<div style='color: red'>语法错误：unexpected \"</div>"); return; }
                    flag_index = i;
                }
                flag = !flag;

            }

        }
        if (flag) { chat("<div style='color: red'>语法错误：unfinished \"</div>"); return; }

        content = res.join("").replace(/"/g, "");
        var cmd_blocks = content.split(SPLIT_SYMBOL);
        if (cmd_blocks[0] == "help") {
            if (!check_arguements_num(cmd_blocks.length, [0, 1])) { return; }
            if (cmd_blocks.length == 1) {
                chat("<div style='color: gray'>/help [command] - 获取帮助<br>/ping - 获取延迟<br>/debug &lt;type&gt; [arguements] - debug模式<br>/get <item> - 获取服务器数据<br>/send &lt;message&gt; - 向服务器发送信息<br>以下需要管理员权限：<br>/start - 开始游戏<br>/close - 关闭服务器<br>/set - 房间设置<br>/kick <player> - 踢出玩家</div>");
            } else {
                if (cmd_blocks[1] == "ping") {
                    chat("<div style='color: gray'>/ping - 获取延迟<br>延迟的计算以本地时间为准，结果显示在聊天栏。</div>");
                } else if (cmd_blocks[1] == "debug") {
                    //to do
                } else if (cmd_blocks[1] == "get") {
                    chat("<div style='color: gray'>/get &lt;item&gt; - 获取服务器数据<br>获取的数据会显示在聊天栏。<br>可获取的数据有：<br>players - 获取玩家列表<br>chains - 获取所有传递链<br>turn_now - <br>num_turn - 游戏回合数</div>");
                } else if (cmd_blocks[1] == "start") {
                    chat("<div style='color: gray'>/start - 开始游戏<br>开始游戏后，玩家将无法加入游戏。</div>");
                } else if (cmd_blocks[1] == "close") {
                    chat("<div style='color: gray'>/close - 关闭服务器<br>这将踢出所有玩家。</div>");
                } else if (cmd_blocks[1] == "send") {
                    chat("<div style='color: gray'>/send &lt;message&gt; - 向服务器发送信息</div>");
                } else {
                    chat("<div style='color: red'>没有" + cmd_blocks[1] + "的相关帮助。</div>");
                }
            }
        } else if (cmd_blocks[0] == "ping") {
            if (!check_arguements_num(cmd_blocks.length, 0)) { return; }
            if (!ping_start_time == 0) { chat("<div style='color: red'>正在ping...</div>"); return; }
            if (check_server_connected()) {
                ping_start_time = new Date().getTime();
                socket.send("p");
            } else { chat("<div style='color: red'>未连接服务器</div>"); return; }
        } else if (cmd_blocks[0] == "start") {
            if (!check_arguements_num(cmd_blocks.length, 0)) { return; }
            if (check_server_connected()) {
                socket.send("[admin]start");
            } else { chat("<div style='color: red'>未连接服务器</div>"); return; }

        } else if (cmd_blocks[0] == "close") {
            if (!check_arguements_num(cmd_blocks.length, 0)) { return; }
            if (check_server_connected()) {
                socket.send("[admin]close");
            } else { chat("<div style='color: red'>未连接服务器</div>"); return; }

        } else if (cmd_blocks[0] == "send") {
            if (!check_arguements_num(cmd_blocks.length, 1)) { return; }
            if (check_server_connected()) {
                socket.send(cmd_blocks[1]);
            } else { chat("<div style='color: red'>未连接服务器</div>"); return; }

        } else if (cmd_blocks[0] == "debug") {
            if (cmd_blocks[1] == "scene") {
                if (!check_arguements_num(cmd_blocks.length, 2)) { return; }

                if (!scenes.includes(cmd_blocks[2])) {
                    chat("<div style='color: red'>参数必须是" + scenes + "中的一个</div>");
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
                    else { chat("<div style='color: red'>未存储ID</div>"); }
                } else if (cmd_blocks[2] == "set") {
                    if (!check_arguements_num(cmd_blocks.length, 3)) { return; }
                    if (confirm("账号切换：是否将ID设置为" + cmd_blocks[3] + "？请确保格式正确。")) {
                        localStorage.setItem("dg_id", cmd_blocks[3]);
                        chat("<div style='color: gray'>ID已修改</div>");
                    }
                } else { chat("<div style='color: red'>未知参数：" + cmd_blocks[2] + "</div>"); }

            } else if (cmd_blocks[1] == "cmd") {
                if (!check_arguements_num(cmd_blocks.length, 2)) { return; }
                try {
                    var a = eval(cmd_blocks[2]);
                } catch (e) { chat("<div style='color: red'>" + e + "</div>"); }
                chat("<div style='color: gray'>" + a + "</div>");
            } else if (cmd_blocks[1] == "test") {
                if (!check_arguements_num(cmd_blocks.length, 2)) { return; }
                if (cmd_blocks[2] == "audio") {
                    new Audio("assets/win.mp3").play();
                }
            }

            else {
                chat("<div style='color: red'>未知参数：" + cmd_blocks[1] + "</div>");
            }
        } else if (cmd_blocks[0] == "get") {
            if (!check_arguements_num(cmd_blocks.length, 1)) { return; }

            if (!items.includes(cmd_blocks[1])) {
                chat("<div style='color: red'>参数必须是" + items + "中的一个</div>");
                return;
            }
            if (check_server_connected()) {
                socket.send("[get]" + cmd_blocks[1]);
            } else { chat("<div style='color: red'>未连接服务器</div>"); return; }

        } else if (cmd_blocks[0] == "set") {
            if (!check_arguements_num(cmd_blocks.length, 2)) { return; }
            if (!check_server_connected()) { chat("<div style='color: red'>未连接服务器</div>"); return; }
            if (cmd_blocks[1] == "wordbook") {
                socket.send("[set_wordbook]" + cmd_blocks[2]);
            }
            else if (cmd_blocks[1] == "turn_num") {
                if (/^-?\d+$/.test(cmd_blocks[2])) {
                    socket.send("[set_turn_num]" + cmd_blocks[2]);
                } else { chat("<div style='color: red'>参数必须是数字</div>"); return; }
            }
        } else if (cmd_blocks[0] == "kick") {
            if (!check_arguements_num(cmd_blocks.length, 1)) { return; }
            if (check_server_connected()) {
                if (players.includes(cmd_blocks[1])) {
                    socket.send("[kick]" + cmd_blocks[1]);
                } else {
                    chat("<div style='color: red'>玩家" + cmd_blocks[1] + "不存在</div>"); return;
                }
            } else { chat("<div style='color: red'>未连接服务器</div>"); return; }
        }


        else {
            chat("<div style='color: red'>未知指令：" + cmd_blocks[0] + "</div>");
        }
    } else {
        if (!check_server_connected()) { chat("<div style='color: red'>未连接服务器</div>"); return; }
        socket.send("[chat]" + content);
    }

}

function check_arguements_num(blocks_length, num) {
    if (typeof num == "number") { num = [num]; }
    if (!num.includes(blocks_length - 1)) {
        var num_str = "";
        for (var i = 0; i < num.length; i++) {
            if (i != 0) { num_str += "或"; }
            num_str += num[i];
        }
        chat("<div style='color: red'>指令要求" + num_str + "个参数，但提供了" + (blocks_length - 1) + "个参数</div>");
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
// 聊天框快捷键
window.addEventListener('keydown', function (e) {
    if (document.getElementById("settings").style.display != "none") { return; }
    if (document.getElementById("chat").style.display == "none" && document.activeElement.tagName != "INPUT") {
        if (e.key == "Enter" || e.key == "/" || e.key == "t") {
            e.preventDefault();
            if (e.key == "/" && document.getElementById("chat_input").value == "") { document.getElementById("chat_input").value = "/" }
            chatbox();
        }
    } else if (e.keyCode == 27) {
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
})

chat("<span style='color: gray'>欢迎来到Draw&Guess！您可以输入/help获取帮助。</span>");

function clearStorage() {
    if (confirm("确定要清空本地存储吗？这会删除所有游戏数据，包括您的游戏进度和设置。")) {
        if (confirm("二次确认：您真的要清空本地存储吗？如果遇到问题，请多尝试几次。")) {
            localStorage.clear();
            alert("已清空本地存储");
        }
    }
}

document.getElementById("version").innerHTML = "v" + version;

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

document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
});

function openURL(url) {
    if (window.plus) {
        // 如果是在App中运行，则使用plus.runtime.openURL打开链接
        plus.runtime.openURL(url);
    } else {
        // 如果是在浏览器中运行，则使用window.open打开链接
        window.open(url);
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
                    plus.nativeUI.toast("再按一次退出游戏", {
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

setInterval(function () {
    if (check_server_connected()) {
        if (ping_start_time == 0) {
            ping_start_time = new Date().getTime();
            socket.send("p");
        } else {
            if (new Date().getTime() - ping_start_time > 5000) {
                socket.close();
            }
        }
    }
}, 3000);

// 设置相关
var default_setting = {
    game_progress: true,
    chat_sound: true,
    shape_tool: false,
    girl_when_waiting: false,
    font_size: 16,
};
var settings = {};
function init_setting(setting) {
    if (!localStorage.getItem(setting)) {
        localStorage.setItem(setting, JSON.stringify(default_setting[setting]));
        if (document.getElementById(setting).type == "checkbox") {
            document.getElementById(setting).checked = default_setting[setting];
        } else {
            // 处理数值型设置
            document.getElementById(setting).value = default_setting[setting];
            document.getElementById(setting + "_value").textContent = default_setting[setting];
        }
        settings[setting] = default_setting[setting];
    } else {
        if (document.getElementById(setting).type == "checkbox") {
            document.getElementById(setting).checked = JSON.parse(localStorage.getItem(setting));
        } else {
            // 处理数值型设置
            document.getElementById(setting).value = JSON.parse(localStorage.getItem(setting));
            document.getElementById(setting + "_value").textContent = JSON.parse(localStorage.getItem(setting));
        }
        settings[setting] = JSON.parse(localStorage.getItem(setting));
    }
}
init_setting("game_progress");
init_setting("chat_sound");
init_setting("shape_tool");
init_setting("girl_when_waiting");
init_setting("font_size");

document.documentElement.style.fontSize = settings.font_size + 'px';
function showSettings() {
    document.getElementById("settings").style.display = "";
}

function closeSettings() {
    document.getElementById("settings").style.display = "none";
}
function change_settings() {
    localStorage.setItem("game_progress", JSON.stringify(document.getElementById("game_progress").checked));
    localStorage.setItem("chat_sound", JSON.stringify(document.getElementById("chat_sound").checked));
    localStorage.setItem("shape_tool", JSON.stringify(document.getElementById("shape_tool").checked));
    localStorage.setItem("girl_when_waiting", JSON.stringify(document.getElementById("girl_when_waiting").checked));

    const fontSize = parseInt(document.getElementById("font_size").value);
    localStorage.setItem("font_size", fontSize);

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

// 准备/取消准备功能
function toggleReady() {
    isReady = !isReady;
    if (isReady) {
        socket.send("[pready]");
        document.getElementById('readyBtn').textContent = "取消准备";
        document.getElementById('waitingText').style.display = '';
    } else {
        socket.send("[unpready]");
        document.getElementById('readyBtn').textContent = "准备游戏";
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
            img.alt = isReady ? '已准备' : '未准备';
            break;
        }
    }
}