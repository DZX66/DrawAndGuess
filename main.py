import asyncio
import websockets
import sys
import random
import time
import json
import os


os.chdir(os.path.dirname(__file__))

# 打开日志文件
log_file = open(f'logs/output {str(time.strftime("%Y-%m-%d %H：%M：%S", time.localtime()))}.log', 'w', encoding='utf-8')
 
# 保存原stdout
original_stdout = sys.stdout
 
# 重定向stdout
sys.stdout = log_file

class Picture(list[str]):
    def get_res(self):
        return self[-1]
class Player:
    def __init__(self,connection,name:str) -> None:
        # 生成一个不重复的随机的id，形如：a12d-3f4g-5h6j-7k8l-9m0n
        all_ids = players.get_all_ids()
        while True:
            id = "-".join(["".join(random.choices("0123456789abcdef", k=4)) for _ in range(5)])
            if id not in all_ids:
                break
        self.id = id
        self.connection = connection
        self.name = name
        self.admin = False

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
            return self[0]
        else:
            return self[index + 1]

class Chain:
    '''一个传递链'''
    def __init__(self) -> None:
        self.first_word = ""
        self.pictures: list[Picture] = []
        self.players: list[Player] = []
        self.words: list[str] = []
        self.favourite = None
        self.checked = 0
    def to_json(self):
        return json.dumps({
            "first_word": self.first_word,
            "pictures": self.pictures,
            "players": [player.name for player in self.players],
            "words": self.words
        })

class Server:
    def __init__(self, host="localhost", port=12345) -> None:
        self.host = host
        self.port = port
        self.clients = set()
    async def handler(self, websocket):
        global players,state,turn_now,num_turn,is_ready
        self.clients.add(websocket)
        try:
            async for message in websocket:
                # print(f"接收到信息: {message}")
                # 如果消息以[admin]开头，表示是管理员发送的消息
                if message.startswith("[admin]"):
                    if players.get_by_connection(websocket).admin:
                        cmd = message[7:]
                        if cmd == "close":
                            print("[admin]管理员关闭服务器")
                            for client in self.clients:
                                await client.send("服务器关闭")
                                await client.close()
                            sys.exit()
                        elif cmd == "start":
                            print("[admin]管理员启动游戏")
                            asyncio.create_task(game_start())
                    else:
                        await websocket.send("[not_admin]")
                # 如果消息以[initialization]开头，表示是玩家初始化连接
                elif message.startswith("[initialization]"):
                    print(f"有玩家尝试初始化连接: {message}")
                    if state == "playing":
                        await websocket.send("playing")
                        print("但游戏正在进行，拒绝连接")
                        return
                    name = message[16:]
                    if players.get_by_name(name):
                        await websocket.send("name_exists")
                        print("但名字已存在，拒绝连接")
                        return
                    await websocket.send("[all_players]"+json.dumps(players.get_all_names()))
                    player = Player(websocket, name)
                    players.append(player)
                    print(f"{name}(id:{player.id}) 已连接")
                    if len(players) == 1:
                        player.admin = True
                    await websocket.send("[id]"+player.id)
                    await server.send_message(f"[new_player]{name}")
                # 如果消息以[reconnect]开头，表示是玩家重新连接
                elif message.startswith("[reconnect]"):
                    print(f"有玩家尝试重新连接: {message}")
                    if state != "playing":
                        await websocket.send("preparing")
                        print("但游戏已结束")
                        return
                    id = message[12:]
                    player = players.get_by_id(id)
                    if player:
                        player.connection = websocket
                        # 同步目前进程
                        await websocket.send(f"[turn_now]{str(turn_now)}")
                        if game_state == "appreciation":
                            await websocket.send(f"[]")
                        elif game_state == "guessing":
                            await websocket.send(f"[guess]")
                        elif game_state == "drawing":
                            await websocket.send(f"[draw]")
                        #  to do
                        await server.send_message(f"[reconnected]{player.name}")
                        print(f"玩家{player.name}(id:{player.id}) 已重新连接")
                    else:
                        await websocket.send("not_found")
                        print("但玩家不存在")
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
                        if CONFIG_TURNS == 0:
                            await websocket.send("num_turn等于玩家数")
                        else:
                            await websocket.send(str(CONFIG_TURNS))
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
                    print(f"{player.name}(id:{player.id}) 猜词: {guess if guess else f'什么也没猜到，新词汇：{new}！'}")
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
                    print(f"{player.name}(id:{player.id}) 提交了图片")
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
                    print(f"{player.name}(id:{player.id}) 评价: {"匹配" if appreciation=="1" else "不匹配"}")
                    chain = chains[turn_now]
                    if appreciation == "1":
                        chain.checked += 1
                    await server.send_message(f"[checked]{player.name},{"right" if appreciation=="1" else "wrong"}")
                    is_ready[players.index(player)] = True
                # 如果消息以[favourite]开头，表示是玩家选择最喜欢的画作
                elif message.startswith("[favourite]"):
                    favourite = message[11:]
                    print(f"玩家选择了最喜欢的画作: {favourite}")
                    await server.send_message(f"[favourite_choosed]{favourite}")
                    chain = chains[turn_now]
                    chain.favourite = int(favourite)
                    is_ready = True
                # 如果消息以[chat]开头，表示是玩家聊天
                elif message.startswith("[chat]"):
                    chat = message[6:]
                    player = players.get_by_connection(websocket)
                    print(f"{player.name}(id:{player.id}) 聊天: {chat}")
                    await server.send_message(f"[chat]{player.name}:{chat}")
                # 如果消息是[ping]，表示玩家尝试ping
                elif message == "[ping]":
                    await websocket.send("[ping]")
                # 如果消息是[ready]，表示玩家准备
                elif message == "[ready]":
                    player = players.get_by_connection(websocket)
                    print(f"{player.name}(id:{player.id}) 准备")
                    is_ready[players.index(player)] = True
                await asyncio.sleep(0)
        finally:
            if players.get_by_connection(websocket):
                print(f"玩家{players.get_by_connection(websocket).name}(id:{players.get_by_connection(websocket).id})的连接关闭")
                await server.send_message(f"[leave]{players.get_by_connection(websocket).name}")
                if state == "waiting":
                    players.remove(players.get_by_connection(websocket))
                else:
                    players.get_by_connection(websocket).connection = None
            self.clients.remove(websocket)
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
        async with websockets.serve(self.handler, self.host, self.port):
            print(f"服务器开始运行： {self.host}:{self.port}")
            await asyncio.Future()

async def game_start():
    global state,server,chains,num_turn,turn_now,words
    state = "playing"
    await server.send_message("start")
    with open("words.txt", "r") as f:
        words = f.readlines()
    
    for player in players:
        chain = Chain()
        chain.players.append(player)
        # 随机选择一个词作为第一个词，不重复
        word = random.choice(words)
        words.remove(word)
        chain.first_word = word.strip()
        chains.append(chain)
    if CONFIG_TURNS == 0:
        num_turn = len(players)
    else:
        num_turn = CONFIG_TURNS
    print(f"[game]游戏开始，玩家个数: {len(players)}，设置回合数: {num_turn}")
    turn_now = 0
    while turn_now < num_turn:
        print(f"[game]turn_now:{turn_now}，画图阶段开始")
        await draw_phase()
        print("[game]画图阶段结束")
        print(f"[game]turn_now:{turn_now}，猜词阶段开始")
        await guess_phase()
        print("[game]猜词阶段结束")
    print("[game]游戏结束")
    await appreciation_phase()
    print("[game]评价阶段结束")
    await ending()
    print("[game]所有游戏结束，等待新游戏")
    chains.clear()

async def draw_phase():
    global turn_now,is_ready,game_state
    game_state = "drawing"
    is_ready = [False for _ in range(len(players))]
    time_start = time.time()

    # 将图片发送给对应的玩家
    i = 0
    while i < len(chains):
        if turn_now > 0:
            next_player = players.get_next_player(chains[i].players[-1])
        else:
            next_player = chains[i].players[0]
        if turn_now == 0:
            await next_player.connection.send(f"[draw]{chains[i].first_word}")
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
    players.clear()
    chains.clear()
    state = "waiting"
    game_state = "waiting"

def main():
    global server
    server = Server()
    asyncio.run(server.start())

if __name__ == "__main__":
    try:
        players = Players()
        state = "waiting" # 取值为waiting,playing
        game_state = "waiting" # 取值为waiting,drawing,guessing,appreciation
        CONFIG_TURNS = 0 # 游戏回合数，为0表示为玩家个数
        CONFIG_TIMEOUT = 5 # 等待客户端超时发送数据的时间(s)
        chains:list[Chain] = []
        main()
    except KeyboardInterrupt:
        print("服务器已手动关闭")
    finally:
        log_file.close()