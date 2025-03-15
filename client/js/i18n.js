/**
 * @description 此常量应该由脚本自动生成，请勿手动修改
 */
const translations = {
  "zh_cn": {
  "connectServer": "连接服务器",
  "clearUserData": "清除用户数据",
  "settings": "设置",
  "preparePhase": "准备阶段",
  "num_of_players": "人数：",
  "room_settings": "房间设置",
  "wordbook": "词库",
  "turn_num": "回合数",
  "ready": "准备游戏",
  "wait_for_start": "等待开始游戏...",
  "countdown": "倒计时",
  "topic": "题目：",
  "choose_word": "请选择一个词语，然后画它！",
  "wait_for_others": "等待其他玩家...",
  "what_is_it": "这是什么？",
  "submit": "提交",
  "draw": "画的是：",
  "guess": "猜的是：",
  "is_it_match": "这个匹配吗？",
  "match": "匹配",
  "unmatch": "不匹配",
  "first_word": "第一个词是...",
  "choosing_favourite": "正在选择ta最喜欢的画作...",
  "which_is_favourite": "你最喜欢哪幅图？",
  "chose_favourite": "选择了ta最喜欢的画作：",
  "game_over": "游戏结束",
  "restart": "再来一局",
  "save_game_data": "保存游戏数据（没做）",
  "chat": "聊天(T / Enter)",
  "messages": "消息",
  "send": "发送",
  "close": "关闭(Esc)",
  "full_screen": "PC全屏",
  "press_f11": "按F11",
  "game_progress_notify": "游戏进度通知",
  "chat_sound": "聊天提示音",
  "shape_tool": "更多画图工具",
  "girl_when_waiting": "准备阶段的二次元小人",
  "font_size": "字体大小",
  "allowed_delay": "允许的服务器响应时间",
  "save_and_restart": "保存并重启",
  "cancel": "取消",
  "language": "语言/Language",
  "empty_url": "请输入服务器地址",
  "empty_name": "请输入昵称",
  "invalid_name": "昵称只能包含汉字、字母、数字、下划线",
  "repeated_name": "房间内已有同名玩家，请更换昵称",
  "gaming": "游戏已经开始，请等待下一局",
  "game_start": "游戏开始",
  "joined": "加入了游戏",
  "finished": "完成了",
  "new_word": "(新词)",
  "guess_nothing": "啥也不猜？",
  "match_complete": "完全匹配！",
  "favourite_chosed": "第{index}张画作被选为最喜欢的画作",
  "check": "评价：",
  "leave": "离开了房间",
  "not_admin": "你没有运行此命令的权限。",
  "wordbook_changed": "词库被修改：",
  "set_wordbook_error": "词库不存在。",
  "end": "游戏已经结束",
  "refuse": "错过了时机，无法加入游戏",
  "connected": "重新连接成功！注意：重连还在开发中，有一堆bug！",
  "rejoined": "重新加入了房间",
  "no_game": "找不到游戏",
  "version_error": "版本错误，请更新客户端",
  "equal_players_num": "=玩家数",
  "turn_num_changed": "回合数被修改：",
  "kicked": "你被管理员踢出了房间",
  "be_kicked": "被管理员踢出了房间",
  "disconnected": "与服务器断开连接",
  "connect_error": "连接服务器失败，请检查网络连接",
  "draw_nothing": "啥也不画？",
  "error": "错误：",
  "syntax_error": "语法错误：",
  "unexpected_quote": "意料之外的\"",
  "unexpected_quote_at_beginning": "在指令开头出现意料之外的\"",
  "unfinished_quote": "未结束的\"",
  "help.help": "<div style='color: gray'>/help [command] - 获取帮助<br>/ping - 获取延迟<br>/debug &lt;type&gt; [arguements] - debug模式<br>/get <item> - 获取服务器数据<br>/send &lt;message&gt; - 向服务器发送信息<br>以下需要管理员权限：<br>/start - 开始游戏<br>/close - 关闭服务器<br>/set - 房间设置<br>/kick <player> - 踢出玩家</div>",
  "pinging": "正在ping...",
  "server_not_connected": "未连接服务器",
  "invalid_argument": "参数必须是{args}中的一个",
  "no_id": "未存储ID",
  "id_change_confirm": "账号切换：是否将ID设置为{id}？请确保格式正确。",
  "id_changed": "ID已设置为{id}",
  "unknown_argument": "未知参数：{arg}",
  "number_argument_required": "参数必须是数字",
  "player_not_found": "玩家{name}不存在",
  "unknown_command": "未知命令：{cmd}",
  "arg_nums_not_match": "指令要求{num}个参数，但实际提供了{actual}个参数。",
  "or": "或",
  "welcome": "欢迎来到Draw&Guess！您可以输入/help获取帮助。",
  "clear_storage_confirm": "确定要清空本地存储吗？这会删除所有游戏数据，包括您的游戏进度和设置。",
  "clear_storage_confirm_2": "二次确认：您真的要清空本地存储吗？如果遇到问题，请多尝试几次。",
  "clear_storage_success": "本地存储已清空。",
  "press_again_to_exit": "再按一次退出游戏",
  "no_response": "服务器超过{delay}秒没有响应",
  "cancel_ready": "取消准备",
  "readied": "已准备",
  "unreadied": "未准备",
  "unfinished_game": "还有未完成的游戏，即将尝试重连。",
  "help.ping": "/ping - 获取延迟<br>延迟的计算以本地时间为准，结果显示在聊天栏。",
  "help.get": "/get &lt;item&gt; - 获取服务器数据<br>获取的数据会显示在聊天栏。<br>可获取的数据有：<br>players - 获取玩家列表<br>chains - 获取所有传递链<br>turn_now - <br>num_turn - 游戏回合数",
  "help.start": "/start - 开始游戏<br>开始游戏后，玩家将无法加入游戏。",
  "help.close": "/close - 关闭服务器<br>这将踢出所有玩家。",
  "help.send": "/send &lt;message&gt; - 向服务器发送消息",
  "help.unknown": "没有{arg}的相关帮助。",
  "test.audio": "播放了音效。",
  "test.animation": "播放了动画。",
  "graphics": "图像",
  "audio": "声音",
  "game": "游戏",
  "about": "关于",
  "imageSmoothingQuality": "图像平滑",
  "off": "关闭",
  "low": "低",
  "medium": "中",
  "high": "高",
  "about_content": "<p>玩法来源：steam上的Draw&Guess</p>\n<p>一个小尝试，有很多不足还请见谅。</p>\n<p>部分素材来源于网络。</p>",
  "boardSize": "画板分辨率"
},
  "zh_kawaii": {
  "connectServer": "启动！",
  "clearUserData": "重新做人",
  "settings": "设置",
  "preparePhase": "准备阶段",
  "num_of_players": "人数：",
  "room_settings": "play设置",
  "wordbook": "词库",
  "turn_num": "回合数",
  "ready": "我已经好了！",
  "wait_for_start": "等待开始游戏...",
  "countdown": "倒计时",
  "topic": "题目：",
  "choose_word": "是时候展现真正的技术了！",
  "wait_for_others": "等待其他玩家...",
  "what_is_it": "这TM是什么？",
  "submit": "就决定是你了",
  "draw": "画的是：",
  "guess": "猜的是：",
  "is_it_match": "对...对吗？",
  "match": "哦对的",
  "unmatch": "嘛玩意",
  "first_word": "第一个词是...",
  "choosing_favourite": "正在品鉴画作...",
  "which_is_favourite": "到底要选哪个呢...",
  "chose_favourite": "选择了ta最喜欢的画作：",
  "game_over": "你醒啦！游戏结束了！",
  "restart": "不要让战斗停下来！",
  "save_game_data": "保存游戏数据（没做）",
  "chat": "聊天(T / Enter)",
  "messages": "消息",
  "send": "发送",
  "close": "关闭(Esc)",
  "full_screen": "PC全屏",
  "press_f11": "按F11谢谢喵",
  "game_progress_notify": "游戏进度通知",
  "chat_sound": "聊天提示音",
  "shape_tool": "没什么用的画图工具",
  "girl_when_waiting": "准备阶段的诺瓦",
  "font_size": "老龄化",
  "allowed_delay": "允许的服务器响应时间",
  "save_and_restart": "就这样",
  "cancel": "不要了",
  "language": "你忍心改吗？！",
  "empty_url": "杂鱼~♥忘了输服务器地址喵~",
  "empty_name": "杂鱼~♥忘了输昵称喵~",
  "invalid_name": "杂鱼的昵称太怪了喵~♥",
  "repeated_name": "杂鱼~♥是想和别人重名吗~♥",
  "gaming": "杂鱼~♥游戏已经开始了喵~",
  "game_start": "游戏开始咯~",
  "joined": "加入了party",
  "finished": "好了",
  "new_word": "(新词)",
  "guess_nothing": "？杂鱼手滑了喵~♥",
  "match_complete": "你是怎么做到的？！",
  "favourite_chosed": "第{index}张画作被选为最喜欢的画作",
  "check": "觉得：",
  "leave": "离开了party",
  "not_admin": "杂鱼~♥只有管理才能运行此命令喵~",
  "wordbook_changed": "词库被修改了喵：",
  "set_wordbook_error": "杂鱼~♥根本没有这个词库啦~",
  "end": "杂鱼~♥游戏已经结束了喵~",
  "refuse": "杂鱼~♥错过了时机，无法加入游戏了喵~",
  "connected": "重新连接成功！注意：重连还在开发中，有一堆bug！",
  "rejoined": "重新加入了party",
  "no_game": "杂鱼~♥找不到游戏喵~",
  "version_error": "杂鱼的游戏版本太低了喵~♥真是个杂鱼~♥",
  "equal_players_num": "就是玩家数！",
  "turn_num_changed": "回合数被修改：",
  "kicked": "被管理员踢出了party~♥杂鱼是不是被针对了了喵~♥",
  "be_kicked": "被管理员踢出了party",
  "disconnected": "杂鱼~♥与服务器断开连接了喵~",
  "connect_error": "杂鱼~♥连接服务器失败，肯定是杂鱼的网络太烂了喵~♥",
  "draw_nothing": "？杂鱼的画还真抽象呢~♥",
  "error": "杂鱼~♥",
  "syntax_error": "语法错误：",
  "unexpected_quote": "意料之外的\"喵~",
  "unexpected_quote_at_beginning": "杂鱼是想逗本喵吗？！",
  "unfinished_quote": "杂鱼忘记结束\"了喵~",
  "help.help": "<div style='color: gray'>/help [command] - 获取帮助<br>/ping - 获取延迟<br>/debug &lt;type&gt; [arguements] - debug模式<br>/get <item> - 获取服务器数据<br>/send &lt;message&gt; - 向服务器发送信息<br>以下需要管理员权限：<br>/start - 开始游戏<br>/close - 关闭服务器<br>/set - 房间设置<br>/kick <player> - 踢出玩家</div>",
  "pinging": "正在ping喵~",
  "server_not_connected": "你连服务器都没连喵~",
  "invalid_argument": "参数必须是{args}中的一个喵~",
  "no_id": "未存储ID喵~",
  "id_change_confirm": "账号切换：是要把ID设置为{id}喵~",
  "id_changed": "ID已设置为{id}喵~",
  "unknown_argument": "{arg}是什么喵？本喵不知道喵~",
  "number_argument_required": "这个参数只能是数字...为什么杂鱼会用其他类型呢，变态！",
  "player_not_found": "玩家{name}不存在喵~是不是打错了喵~♥",
  "unknown_command": "杂鱼尝试访问的{cmd}不存在喵~",
  "arg_nums_not_match": "指令要求{num}个参数，但实际提供了{actual}个参数喵~",
  "or": "或",
  "welcome": "狗修金！欢迎来到Draw&Guess喵~您可以输入/help获取帮助喵~",
  "clear_storage_confirm": "确定要清空本地存储吗？这会删除所有游戏数据，包括主人的游戏进度和设置喵~",
  "clear_storage_confirm_2": "再说一遍：主人真的要清空本地存储吗？",
  "clear_storage_success": "本地存储已清空了喵~别忘了在设置里把本喵召唤出来喵~",
  "press_again_to_exit": "真的要退出游戏吗~",
  "no_response": "服务器超过{delay}秒没有响应喵~\\n简单说就是杂鱼掉线了喵~♥",
  "cancel_ready": "先等等",
  "readied": "已准备",
  "unreadied": "未准备",
  "unfinished_game": "还有未完成的游戏，即将尝试重连喵~",
  "help.ping": "/ping - 获取延迟<br>延迟的计算以本地时间为准，结果显示在聊天栏",
  "help.get": "/get &lt;item&gt; - 获取服务器数据<br>获取的数据会显示在聊天栏。<br>可获取的数据有：<br>players - 获取玩家列表<br>chains - 获取所有传递链<br>turn_now - <br>num_turn - 游戏回合数",
  "help.start": "/start - 开始游戏<br>开始游戏后，玩家将无法加入游戏。",
  "help.close": "/close - 关闭服务器<br>这将踢出所有玩家。",
  "help.send": "/send &lt;message&gt; - 向服务器发送消息",
  "help.unknown": "没有{arg}的相关帮助喵，需要自己体会喵~♥",
  "test.audio": "播放了音效。",
  "test.animation": "播放了动画。",
  "graphics": "图像",
  "audio": "声音",
  "game": "游戏",
  "about": "关于",
  "imageSmoothingQuality": "图像平滑",
  "off": "关闭",
  "low": "低",
  "medium": "中",
  "high": "高",
  "about_content": "<p>玩法来源：steam上的Draw&Guess</p>\n<p>一个小尝试，有很多不足还请见谅。</p>\n<p>部分素材来源于网络。</p>",
  "boardSize": "画板分辨率"
},
  "en": {
  "connectServer": "Connect Server",
  "clearUserData": "Clear User Data",
  "settings": "Settings",
  "preparePhase": "Preparation Phase",
  "num_of_players": "Players:",
  "room_settings": "Room Settings",
  "wordbook": "Word Bank",
  "turn_num": "Rounds:",
  "ready": "Ready",
  "wait_for_start": "Waiting to start...",
  "countdown": "Countdown",
  "topic": "Topic:",
  "choose_word": "Choose a word to draw!",
  "wait_for_others": "Waiting for others...",
  "what_is_it": "What is this?",
  "submit": "Submit",
  "draw": "drew:",
  "guess": "guessed:",
  "is_it_match": "Does this match?",
  "match": "Match",
  "unmatch": "Mismatch",
  "first_word": "First word is...",
  "choosing_favourite": "Choosing favorite drawing...",
  "which_is_favourite": "Which is your favorite?",
  "chose_favourite": "Favorite chosen:",
  "game_over": "Game Over",
  "restart": "Play Again",
  "save_game_data": "Save Game Data (unimplemented)",
  "chat": "Chat (T / Enter)",
  "messages": "Messages",
  "send": "Send",
  "close": "Close (Esc)",
  "full_screen": "Full Screen",
  "press_f11": "Press F11",
  "game_progress_notify": "Game Progress Notifications",
  "chat_sound": "Chat Sound Alert",
  "shape_tool": "Additional Drawing Tools",
  "girl_when_waiting": "Anime Girl During Preparation",
  "font_size": "Font Size",
  "allowed_delay": "Allowed Server Delay",
  "save_and_restart": "Save & Restart",
  "cancel": "Cancel",
  "language": "Language",
  "empty_url": "Please enter server address",
  "empty_name": "Please enter nickname",
  "invalid_name": "Nickname can only contain Chinese characters, letters, numbers, underscores",
  "repeated_name": "Duplicate nickname in room",
  "gaming": "Game already started",
  "game_start": "Game Started",
  "joined": "has joined",
  "finished": "completed",
  "new_word": "(New Word)",
  "guess_nothing": "Guess nothing?",
  "match_complete": "Perfect match!",
  "favourite_chosed": "Drawing {index} chosen as favorite",
  "check": "Review:",
  "leave": "left the room",
  "not_admin": "No permission for this command",
  "wordbook_changed": "Word bank modified:",
  "set_wordbook_error": "Word bank does not exist",
  "end": "Game ended",
  "refuse": "Missed join timing",
  "connected": "Reconnected! Note: Reconnection is under development",
  "rejoined": "Rejoined room",
  "no_game": "Game not found",
  "version_error": "Version mismatch, please update client",
  "equal_players_num": "=Player COUNT",
  "turn_num_changed": "Rounds modified:",
  "kicked": "You were kicked",
  "be_kicked": "was kicked",
  "disconnected": "Disconnected from server",
  "connect_error": "Connection failed, check network",
  "draw_nothing": "Draw nothing?",
  "error": "Error:",
  "syntax_error": "Syntax error:",
  "unexpected_quote": "Unexpected \"",
  "unexpected_quote_at_beginning": "Unexpected \" at start",
  "unfinished_quote": "Unclosed \"",
  "help.help": "<div style='color: gray'>/help [command] - Get help<br>/ping - Check latency<br>/debug &lt;type&gt; [arguments] - Debug mode<br>/get &lt;item&gt; - Get server data<br>/send &lt;message&gt; - Send message to server<br>Admin commands:<br>/start - Start game<br>/close - Shutdown server<br>/set - Room settings<br>/kick &lt;player&gt; - Kick player</div>",
  "pinging": "Pinging...",
  "server_not_connected": "Not connected",
  "invalid_argument": "Argument must be {args}",
  "no_id": "No stored ID",
  "id_change_confirm": "Confirm ID change to {id}?",
  "id_changed": "ID set to {id}",
  "unknown_argument": "Unknown argument: {arg}",
  "number_argument_required": "Numeric argument required",
  "player_not_found": "Player {name} not found",
  "unknown_command": "Unknown command: {cmd}",
  "arg_nums_not_match": "Requires {num} arguments, got {actual}",
  "or": "or",
  "welcome": "Welcome to Draw&Guess! Type /help for commands.",
  "clear_storage_confirm": "Clear ALL local storage? This will erase game progress/settings.",
  "clear_storage_confirm_2": "FINAL CONFIRMATION: Clear local storage?",
  "clear_storage_success": "Local storage cleared.",
  "press_again_to_exit": "Press again to exit",
  "no_response": "Server unresponsive for {delay}s",
  "cancel_ready": "Unready",
  "readied": "Ready",
  "unreadied": "Not Ready",
  "unfinished_game": "Unfinished game detected, reconnecting...",
  "help.ping": "/ping - Check latency<br>Latency calculated based on local time.",
  "help.get": "/get &lt;item&gt; - Get server data<br>Available items:<br>players - Player list<br>chains - All chains<br>turn_now - Current round<br>num_turn - Total rounds",
  "help.start": "/start - Start game<br>Players cannot join after starting.",
  "help.close": "/close - Shutdown server<br>Kicks all players.",
  "help.send": "/send &lt;message&gt; - Send message to server",
  "help.unknown": "No help for {arg}",
  "test.audio": "Audio played.",
  "test.animation": "Animation played.",
  "graphics": "Graphics",
  "audio": "Audio",
  "game": "Game",
  "about": "About",
  "imageSmoothingQuality": "Image Smoothing Quality",
  "off": "OFF",
  "low": "Low",
  "medium": "Medium",
  "high": "High",
  "about_content": "<p>origin: Draw&Guess on steam</p>\n<p>Some images and audio come from the web.</p>",
  "boardSize": "Board resolution"
}
};


class Localization {
    constructor() {
        if (this.getSavedLanguage()) {
            this.currentLang = this.getSavedLanguage();
        } else {
            this.currentLang = 'zh_cn';
        };
        this.init();
    }

    init() {
        console.log('i18n init', this.currentLang);
        this.translatePage();
    }

    translateContent() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const vars = el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : {};

            el.innerHTML = this.getTranslation(key, vars);

        });
    }

    setLanguage(lang) {
        if (translations[lang]) {
            this.currentLang = lang;
            this.translatePage();
            this.onLanguageChanged();
        }
    }

    getSavedLanguage() {
        return JSON.parse(localStorage.getItem('language'));
    }


    onLanguageChanged() {
        // 触发游戏内动态内容更新
        if (window.gameInstance) {
            gameInstance.updateTexts();
        }
    }
    getTranslation(key, variables = {}) {
        let currentLang = translations[this.currentLang];
        if (currentLang && currentLang.hasOwnProperty(key)) {
            var text = currentLang[key];
        } else {
            console.warn(`[i18n] ${this.currentLang} 翻译缺失：${key}`);
            return key;
        }
        

        // 处理变量替换
        Object.entries(variables).forEach(([name, value]) => {
            text = text.replace(new RegExp(`{${name}}`, 'g'), value);
        });

        return text;
    }

    translateAttributes() {
        document.querySelectorAll('[data-i18n-attribute]').forEach(el => {
            const attrConfig = JSON.parse(el.dataset.i18nAttribute);
            const vars = el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : {};

            Object.entries(attrConfig).forEach(([attr, key]) => {
                const translation = this.getTranslation(key, vars);
                el.setAttribute(attr, translation);
            });
        });
    }

    replaceVariables(text, variables) {
        return Object.entries(variables).reduce((str, [name, value]) => {
            return str.replace(new RegExp(`{${name}}`, 'g'), value);
        }, text);
    }

    translatePage() {
        this.translateContent();  // 原有内容翻译
        this.translateAttributes(); // 新增属性翻译
    }
}

// 初始化
window.i18n = new Localization();
