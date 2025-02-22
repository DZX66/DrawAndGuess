function init(config) {
	if (!config.position) {
		let div = document.createElement("div");
		div.style.position = "absolute";
		div.style.bottom = "0";
		div.style.left = "0";
		config.position = div;
	}
	let container = document.createElement("div");
	container.id = "girl_container";
	container.style.marginBottom = "0";
	let canvas = document.createElement("canvas");
	canvas.id = "girl_canvas";
	canvas.width = 200;
	canvas.height = 200;
	canvas.style.marginBottom = "0";
	document.getElementById("prepare").appendChild(container);
	container.appendChild(config.position);
	config.position.style.marginBottom = "0";
	config.position.appendChild(canvas);
	loadModel(canvas, config.model);

}

function loadModel(canvas, model) {
	let dir = model.dir;
	canvas.style.backgroundImage = `url(${dir}/${model.normal})`;
	canvas.style.backgroundPositionY = "180px";
	let y = 180;
	let shocked_time = 0;
	let timer = setInterval(() => {
		canvas.style.backgroundPositionY = `${y}px`;
		if (y > -60) {
			y -= (y + 100) / 2;
		} else {
			y = -60;
		}
		if (shocked_time > 0) {
			shocked_time -= 30;
			if (shocked_time <= 0) {
				canvas.style.backgroundImage = `url(${dir}/${model.normal})`;
			}
		}

	}, 30);

	canvas.addEventListener("mouseenter", () => {
		if (shocked_time <= 0) {
			canvas.style.backgroundImage = `url(${dir}/${model.happy})`;
		}
		canvas.style.backgroundImage = `url(${dir}/${model.happy})`;
	});
	canvas.addEventListener("mouseleave", () => {
		if (shocked_time <= 0) {
			canvas.style.backgroundImage = `url(${dir}/${model.normal})`;
		}
	});
	function mousedown() {
		canvas.style.backgroundImage = `url(${dir}/${model.shocked})`;
		y += 200;
		shocked_time = 1000;
	}
	canvas.addEventListener("mousedown", mousedown);
	canvas.addEventListener("touchstart", () => {
		canvas.removeEventListener("mousedown", mousedown);
		mousedown();
	});

}



// 封装异步加载资源的方法
function loadExternalResource(url, type) {
	return new Promise((resolve, reject) => {
		let tag;

		if (type === "css") {
			tag = document.createElement("link");
			tag.rel = "stylesheet";
			tag.href = url;
		}
		else if (type === "js") {
			tag = document.createElement("script");
			tag.src = url;
		}
		if (tag) {
			tag.onload = () => resolve(url);
			tag.onerror = () => reject(url);
			document.head.appendChild(tag);
		}
	});
}

if (settings.girl_when_waiting) {
	Promise.all([
		loadExternalResource("girl/style.css", "css")
	]).then(() => {
		init({
			"model": {
				"dir": "girl/model/noir",
				"normal": "noir_02face.png",
				"happy": "noir_06face.png",
				"angry": "noir_07face.png",
				"sad": "noir_09face.png",
				"shocked": "noir_12face.png",
				"unwilling": "noir_13face.png"
			},

		});
	});
}