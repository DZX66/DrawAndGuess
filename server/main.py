import asyncio
import websockets
import random
import time
import json
import os
import traceback



class Picture(list[str]):
    def get_res(self):
        return self[-1]
class Player:
    def __init__(self,connection,name:str,id:str = "") -> None:
        if id == "":
            # 生成一个不重复的随机的id，形如：a12d-3f4g-5h6j-7k8l-9m0n
            all_ids = [id for id in userdata]
            while True:
                id = "-".join(["".join(random.choices("0123456789abcdef", k=4)) for _ in range(5)])
                if id not in all_ids:
                    break
            self.admin = False
            userdata[id] = {"name": name, "used_names": [], "is_admin": False}
        else:
            if userdata[id]["name"] != name:
                userdata[id]["used_names"].append(userdata[id]["name"])
                userdata[id]["name"] = name
            self.admin = userdata[id]["is_admin"]
        self.id = id
        self.connection = connection
        self.name = name
        self.turn_when_leave = None
        self.is_ready = False

class Players(list[Player]):
    def get_by_id(self, id) -> Player:
        for player in self:
            if player.id == id:
                return player
        return None
    def get_by_name(self, name) -> Player:
        for player in self:
            if player.name == name:
                return player
        return None
    def get_by_connection(self, connection) -> Player:
        for player in self:
            if player.connection == connection:
                return player
        return None
    def get_all_names(self):
        return [player.name for player in self]
    def get_all_ids(self):
        return [player.id for player in self]
    def get_next_player(self, player:Player) -> Player:
        index = self.index(player)
        if index == len(self) - 1:
            if self[0].connection:
                return self[0]
            else:
                return self.get_next_player(self[0])
        else:
            if self[index + 1].connection:
                return self[index + 1]
            else:
                return self.get_next_player(self[index + 1])
    def to_list(self):
        return [{"name": player.name, "id": player.id, "is_admin": player.admin} for player in self]
    def get_names_and_ready(self):
        return [[player.name, player.is_ready] for player in self]

class Chain:
    '''一个传递链'''
    def __init__(self) -> None:
        self.first_word_options:list[str,str,str] = ["","",""]   # 三选一
        self.first_word:str = ""
        self.pictures: list[Picture] = []
        self.players: list[Player] = []
        self.words: list[str] = []
        self.favourite = None
        self.checked = 0
        self.active = True  # 是否存活
    def to_json(self):
        return json.dumps({
            "first_word": self.first_word,
            "pictures": self.pictures,
            "players": [player.name for player in self.players],
            "words": self.words
        })
    def to_dict(self):
        return {
            "first_word": self.first_word,
            "pictures": self.pictures,
            "players": [player.name for player in self.players],
            "words": self.words
        }

class Server:
    def __init__(self, host="localhost", port=12345) -> None:
        self.host = host
        self.port = port
        self.clients = set()
        self.running = False  # 运行状态标志
    async def handler(self, websocket):
        global players,state,turn_now,num_turn,is_ready,config_words,config_turns
        self.clients.add(websocket)
        try:
            async for message in websocket:
                # log(f"接收到信息: {message}")
                # 如果消息以[admin]开头，表示是管理员发送的消息
                if message.startswith("[admin]"):
                    if players.get_by_connection(websocket).admin:
                        cmd = message[7:]
                        if cmd == "close":
                            log("[admin]管理员关闭服务器")
                            # 发送关闭消息并断开所有客户端
                            close_tasks = []
                            for client in list([client for client in self.clients if client is not websocket]):  # 转换为列表避免迭代时修改集合
                                try:
                                    close_tasks.append(client.send("服务器关闭"))
                                    close_tasks.append(client.close())
                                except:
                                    pass
                            # 等待所有关闭操作完成（忽略异常）
                            await asyncio.gather(*close_tasks, return_exceptions=True)
                            
                            # 取消所有异步任务（排除当前任务）
                            current_task = asyncio.current_task()
                            tasks = [task for task in asyncio.all_tasks() if task is not current_task]
                            for task in tasks:
                                try:
                                    task.cancel()
                                except:
                                    pass

                            # 设置服务器停止标志，让主循环自然退出
                            server.running = False
                            return
                        elif cmd == "start":
                            log("[admin]管理员启动游戏")
                            if state == "waiting":
                                asyncio.create_task(game_start())
                            else:
                                log("但游戏已开始")
                    else:
                        await websocket.send("[not_admin]")
                # 如果消息以[initialization]开头，表示是玩家初始化连接
                elif message.startswith("[initialization]"):
                    log(f"有玩家尝试初始化连接: {message}")
                    if message[16:].split(",")[2] != VERSION:
                        await websocket.send("version_error")
                    if state == "playing":
                        await websocket.send("playing")
                        log("但游戏正在进行，拒绝连接")
                        return
                    name = message[16:].split(",")[0]
                    id = message[16:].split(",")[1]
                    if players.get_by_name(name):
                        await websocket.send("name_exists")
                        log("但名字已存在，拒绝连接")
                        return
                    await websocket.send("[all_players]"+json.dumps(players.get_names_and_ready()))
                    player = Player(websocket, name, id)
                    players.append(player)
                    log(f"{name}(id:{player.id}) 已连接")
                    if len(players) == 1:
                        player.admin = True
                    await websocket.send("[id]"+player.id)
                    await websocket.send("[wordbook]"+config_words[:-4])
                    await websocket.send("[turn_num]"+str(config_turns))
                    await server.send_message(f"[new_player]{name}")
                # 如果消息以[reconnect]开头，表示是玩家重新连接
                elif message.startswith("[reconnect]"):
                    log(f"有玩家尝试重新连接: {message}")
                    if state != "playing":
                        await websocket.send("preparing")
                        log("但游戏已结束")
                        return
                    id = message[11:]
                    player = players.get_by_id(id)
                    if player:
                        player.connection = websocket
                        # 同步目前进程
                        if game_state == "appreciation":
                            await websocket.send(f"[refuse]")
                            return
                        else:
                            if turn_now == player.turn_when_leave:
                                await websocket.send(f"[reconnect_success]{turn_now}")
                            else:
                                await websocket.send("[refuse]")
                                return
                        player.turn_when_leave = None
                        await server.send_message(f"[reconnected]{player.name}")
                        log(f"玩家{player.name}(id:{player.id}) 已重新连接")
                    else:
                        await websocket.send("not_found")
                        log("但玩家不存在")
                        return
                # 如果消息以[get]开头，表示是获取信息
                elif message.startswith("[get]"):
                    if message == "[get]players":
                        await websocket.send(json.dumps(players.get_all_names()))
                    elif message == "[get]turn_now":
                        if game_state == "waiting":
                            await websocket.send("turn_now在准备阶段不可用")
                        else:
                            await websocket.send(str(turn_now))
                    elif message == "[get]num_turn":
                        if config_turns == 0:
                            await websocket.send("num_turn等于玩家数")
                        else:
                            await websocket.send(str(config_turns))
                    elif message == "[get]chains":
                        if game_state == "waiting": 
                            await websocket.send("chains在准备阶段不可用")
                        else:
                            await websocket.send(json.dumps([chain.to_json() for chain in chains]))
                # 如果消息以[guess]开头，表示是玩家猜词
                elif message.startswith("[guess]"):
                    # 如果为空
                    if message == "[guess]":
                        guess = ""
                        new = random.choice(words)
                        words.remove(new)
                    else:
                        guess = message[7:]
                    player = players.get_by_connection(websocket)
                    log(f"{player.name}(id:{player.id}) 猜词: {guess if guess else f'什么也没猜到，新词汇：{new}！'}")
                    if not guess:
                        guess = new+"(新词)"
                    for chain in chains:
                        if player == chain.players[-1]:
                            chain.words.append(guess)
                            break
                    await server.send_message(f"[done]{player.name}")
                    is_ready[players.index(player)] = True
                # 如果消息以[draw]开头，表示是玩家画图
                elif message.startswith("[draw]"):
                    picture = Picture(json.loads(message[6:]))
                    player = players.get_by_connection(websocket)
                    log(f"{player.name}(id:{player.id}) 提交了图片")
                    for chain in chains:
                        if player == chain.players[-1]:
                            chain.pictures.append(picture)
                            break
                    await server.send_message(f"[done]{player.name}")
                    is_ready[players.index(player)] = True
                # 如果消息以[appreciation]开头，表示是玩家评价
                elif message.startswith("[appreciation]"):
                    appreciation = message[14:]
                    player = players.get_by_connection(websocket)
                    log(f"{player.name}(id:{player.id}) 评价: {"匹配" if appreciation=="1" else "不匹配"}")
                    chain = chains[turn_now]
                    if appreciation == "1":
                        chain.checked += 1
                    await server.send_message(f"[checked]{player.name},{"right" if appreciation=="1" else "wrong"}")
                    is_ready[players.index(player)] = True
                # 如果消息以[favourite]开头，表示是玩家选择最喜欢的画作
                elif message.startswith("[favourite]"):
                    favourite = message[11:]
                    log(f"玩家选择了最喜欢的画作: {favourite}")
                    await server.send_message(f"[favourite_choosed]{favourite}")
                    chain = chains[turn_now]
                    chain.favourite = int(favourite)
                    is_ready = True
                # 如果消息以[chat]开头，表示是玩家聊天
                elif message.startswith("[chat]"):
                    chat = message[6:]
                    player = players.get_by_connection(websocket)
                    log(f"{player.name}(id:{player.id}) 聊天: {chat}")
                    await server.send_message(f"[chat]{player.name}:{chat}")
                # 如果消息是p，表示玩家尝试ping
                elif message == "p":
                    await websocket.send("p")
                # 如果消息是[ready]，表示玩家准备
                elif message == "[ready]":
                    player = players.get_by_connection(websocket)
                    log(f"{player.name}(id:{player.id}) 准备")
                    is_ready[players.index(player)] = True
                # 如果消息以[set_wordbook]开头，表示是玩家设置词库
                elif message.startswith("[set_wordbook]"):
                    if players.get_by_connection(websocket).admin:
                        words = message[14:]
                        if os.path.exists("words/"+words+".txt"):
                            config_words = words+".txt"
                            log(f"玩家{players.get_by_connection(websocket).name}(id:{players.get_by_connection(websocket).id})设置了词库: {words}")
                            await server.send_message(f"[wordbook]{words}")
                        else:
                            log(f"玩家{players.get_by_connection(websocket).name}(id:{players.get_by_connection(websocket).id})设置的词库不存在: {words}")
                            await websocket.send("[set_wordbook_error]")
                    else:
                        await websocket.send("[not_admin]")
                # 如果消息以[set_turn_num]开头，表示是玩家设置轮数
                elif message.startswith("[set_turn_num]"):
                    if not players.get_by_connection(websocket).admin:
                        await websocket.send("[not_admin]")
                    else:
                        config_turns = int(message[14:])
                        log(f"玩家{players.get_by_connection(websocket).name}(id:{players.get_by_connection(websocket).id})设置了轮数: {config_turns}")
                        await server.send_message(f"[turn_num]{config_turns}")
                # 如果消息以[first_word_choosed]开头，表示是玩家选择第一个词
                elif message.startswith("[first_word_choosed]"):
                    for chain in chains:
                        if chain.players[0] == players.get_by_connection(websocket):
                            chain.first_word = message[20:]
                            break
                # 准备相关
                elif message == "[pready]":
                    player = players.get_by_connection(websocket)
                    log(f"{player.name}(id:{player.id}) 准备完毕")
                    player.is_ready = True
                    await server.send_message(f"[pready]{player.name}")
                elif message == "[unpready]":
                    player = players.get_by_connection(websocket)
                    log(f"{player.name}(id:{player.id}) 取消准备")
                    player.is_ready = False
                    await server.send_message(f"[unpready]{player.name}")
                # 踢出玩家
                elif message.startswith("[kick]"):
                    if players.get_by_connection(websocket).admin:
                        name = message[6:]
                        player = players.get_by_name(name)
                        if player:
                            log(f"玩家{player.name}(id:{player.id})被管理员踢出")
                            await server.send_message(f"[kick]{player.name}")
                            await player.connection.send("[kicked]")
                            await player.connection.close()
                        else:
                            log(f"玩家{name}不存在")
                    else:
                        await websocket.send("[not_admin]")
                # 其他消息
                else:
                    log(f"收到未知消息: {message}")
                await asyncio.sleep(0)
        finally:
            # 处理玩家断开连接逻辑
            player = players.get_by_connection(websocket)
            if player:
                log(f"玩家 {player.name}(id:{player.id}) 的连接关闭")
                await server.send_message(f"[leave]{player.name}")
                if state == "waiting":
                    players.remove(player)
                else:
                    player.turn_when_leave = turn_now
                    player.connection = None

            # 安全移除 WebSocket 连接
            try:
                self.clients.remove(websocket)
            except KeyError:
                pass  # 如果连接已不在集合中，无需处理
    async def send_message(self, message):
        if not self.clients:
            return
        disconnected_clients = set()
        for client in self.clients:
            try:
                await client.send(message)
            except websockets.ConnectionClosed:
                disconnected_clients.add(client)
        self.clients -= disconnected_clients
    async def start(self):
        self.running = True
        async with websockets.serve(self.handler, self.host, self.port):
            log(f"服务器开始运行： {self.host}:{self.port}")
            asyncio.create_task(check_ready())
            while self.running:  # 通过标志控制循环
                await asyncio.sleep(1)

async def game_start():
    global state,server,chains,num_turn,turn_now,words
    state = "playing"
    await server.send_message("start")
    timer = time.time()
    with open("words/"+config_words, "r", encoding="utf-8") as f:
        words = f.readlines()
    
    for player in players:
        chain = Chain()
        chain.players.append(player)
        # 随机选择三个词，不重复
        for i in range(3):
            word = random.choice(words)
            words.remove(word)
            chain.first_word_options[i] = word.strip()
        chains.append(chain)
    if config_turns == 0:
        num_turn = len(players)
    else:
        num_turn = config_turns
    log(f"[game]游戏开始，玩家个数: {len(players)}，设置回合数: {num_turn}")
    turn_now = 0
    ntimer = time.time()
    if ntimer - timer < 1:
        await asyncio.sleep(1 - (ntimer - timer))
    while turn_now < num_turn:
        log(f"[game]turn_now:{turn_now}，画图阶段开始")
        await draw_phase()
        log("[game]画图阶段结束")
        await check_active()
        log(f"[game]turn_now:{turn_now}，猜词阶段开始")
        await guess_phase()
        log("[game]猜词阶段结束")
        await check_active()
    log("[game]游戏结束")
    await appreciation_phase()
    log("[game]评价阶段结束")
    await ending()
    log("[game]所有游戏结束，等待新游戏")

async def draw_phase():
    global turn_now,is_ready,game_state
    game_state = "drawing"
    is_ready = [False for _ in range(len(players))]
    time_start = time.time()

    # 将图片发送给对应的玩家
    i = 0
    while i < len(chains):
        if chains[i].active:
            if turn_now > 0:
                next_player = players.get_next_player(chains[i].players[-1])
            else:
                next_player = chains[i].players[0]
            if turn_now == 0:
                await next_player.connection.send(f"[draw_with_options]{json.dumps(chains[i].first_word_options)}")
            else:
                await next_player.connection.send(f"[draw]{chains[i].words[-1]}")
                chains[i].players.append(next_player)
        i += 1
    while not (all(is_ready) or time.time() - time_start > 120 + CONFIG_TIMEOUT):
        await asyncio.sleep(1)
    turn_now += 1

async def guess_phase():
    global turn_now,is_ready,game_state
    game_state = "guessing"
    is_ready = [False for _ in range(len(players))]
    time_start = time.time()

    # 将每个链的最后一张图片发送给对应的玩家
    i = 0
    while i < len(chains):
        if chains[i].active:
            next_player = players.get_next_player(chains[i].players[-1])
            await next_player.connection.send(f"[guess]{chains[i].pictures[-1].get_res()}")
            if turn_now > 0:
                chains[i].players.append(next_player)
        i += 1
    while not (all(is_ready) or time.time() - time_start > 60 + CONFIG_TIMEOUT):
        await asyncio.sleep(1)
    turn_now += 1
    
async def appreciation_phase():
    global is_ready,turn_now,game_state
    turn_now = 0
    game_state = "appreciation"
    for chain in chains:
        is_ready = [False for _ in range(len(players))]
        
    
        await server.send_message(f"[appreciation]{chain.to_json()}")
        while True:
            await asyncio.sleep(1)
            flag = True
            for player in players:
                if player.connection != None and not is_ready[players.index(player)]:  #排除掉线玩家
                    flag = False
                    break
            if flag:
                break
        is_ready = [False for _ in range(len(players))]
        await server.send_message(f"[checktime]")
        time_start = time.time()
        while True:
            await asyncio.sleep(1)
            if time.time() - time_start > 20 + CONFIG_TIMEOUT:
                break
            flag = True
            for player in players:
                if player.connection != None and not is_ready[players.index(player)]:  #排除掉线玩家
                    flag = False
                    break
            if flag:
                break
        
        if chain.players[-1].connection != None:
            time_start = time.time()
            is_ready = False

            await server.send_message(f"[favourite]{chain.players[-1].name}")
            while not (is_ready or time.time() - time_start > 20 + CONFIG_TIMEOUT):
                await asyncio.sleep(1)
            await asyncio.sleep(4)
        turn_now += 1

async def ending():
    global state,game_state
    grades = {}
    for i in players:
        grades[i.name] = 0
    for chain in chains:
        if chain.checked > len(players) // 2:
            for player in chain.players:
                grades[player.name] += 1
        if chain.favourite != None:
            grades[chain.players[chain.favourite*2].name] += 1
    # 根据值，对grades进行排序，并将dict转为list
    grades = sorted(grades.items(), key=lambda x: x[1], reverse=True)
    await server.send_message(f"[end]{json.dumps(grades)}")
    # 保存游戏记录
    file = f"gamedata/{time.strftime('%Y-%m-%d %H-%M-%S', time.localtime())}.json"
    with open(file, "w", encoding="utf-8") as f:
        json.dump({"players": players.to_list(), "chains": [chain.to_dict() for chain in chains], "grades": grades}, f, ensure_ascii=False, indent=4)
    log(f"游戏记录已保存到{file}")
    players.clear()
    chains.clear()
    state = "waiting"
    game_state = "waiting"
    asyncio.create_task(check_ready())

async def check_active():
    i = 0
    remove_chains = []
    while i < len(chains):
        if chains[i].players[-1].connection == None and chains[i].active:
            chains[i].active = False
            if turn_now <= 1:
                # 第一棒就掉线了？
                remove_chains.append(chains[i])
            else:
                if turn_now %2 == 1:
                    # 是guess阶段
                    del chains[i].pictures[-1]
        i += 1
    for chain in remove_chains:
        chains.remove(chain)

def log(message,type="info"):
    log_file.write(f"[{type}] {str(time.strftime('%Y-%m-%d %H:%M:%S', time.localtime()))} {message}\n")
    print(message)

async def check_ready():
    global players
    while True:
        await asyncio.sleep(1)
        for player in players:
            if (not player.is_ready) and player.connection != None:
                break
        else:
            if len(players) >= 2:
                log("所有玩家准备完毕，游戏开始")
                asyncio.create_task(game_start())
                break
if __name__ == "__main__":
    try:
        VERSION = "0.4"
        os.chdir(os.path.dirname(__file__))

        # 打开日志文件
        log_file = open(f'logs/{str(time.strftime("%Y-%m-%d %H：%M：%S", time.localtime()))}.log', 'w', encoding='utf-8')

        
        with open("database.json", "r", encoding="utf-8") as f:
            userdata = json.load(f)
        players = Players()
        state = "waiting" # 取值为waiting,playing
        game_state = "waiting" # 取值为waiting,drawing,guessing,appreciation
        config_turns = 0 # 游戏回合数，为0表示为玩家个数
        CONFIG_TIMEOUT = 5 # 等待客户端超时发送数据的时间(s)
        config_words = "[简体中文] 就是多.txt"  # 词库文件
        chains:list[Chain] = []
        server = Server()
        asyncio.run(server.start())
    except asyncio.CancelledError:
        pass
    except KeyboardInterrupt:
        log("服务器已手动关闭")
    except Exception as e:
        log(f"\n{traceback.format_exc()}","error")
    finally:
        log_file.close()
        with open("database.json", "w", encoding="utf-8") as f:
            json.dump(userdata, f, ensure_ascii=False, indent=4)