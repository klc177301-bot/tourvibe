let currentScenic = "黄山";
let map = null;
let contentList = [];
const scenicBaseData = {
    "黄山": { 
        center: [118.186372, 30.143807], 
        landform: { 
            type: "花岗岩峰林地貌", 
            altitude: "主峰莲花峰1864.8米", 
            features: "奇松、怪石、云海、温泉、冬雪" 
        }, 
        cityCode: "341000" 
    },
    "香山": { 
        center: [116.193342, 39.997181], 
        landform: { 
            type: "山地丘陵地貌", 
            altitude: "主峰香炉峰557米", 
            features: "红叶、寺庙、清泉、奇石" 
        }, 
        cityCode: "110000" 
    }
};

// 实时时间更新
function updateTime() {
    const now = new Date();
    document.getElementById("currentTime").textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);

// 天气查询（已替换你的高德API Key）
async function getWeather(cityCode) {
    try {
        const res = await axios.get(`https://restapi.amap.com/v3/weather/weatherInfo?key=389e289d3e4bebdddeda7afad265dd0c&city=${cityCode}`);
        const weather = res.data.lives[0];
        document.getElementById("weatherInfo").textContent = `${weather.weather} ${weather.temperature}℃`;
    } catch (e) { 
        document.getElementById("weatherInfo").textContent = "天气加载中"; 
    }
}

// 页面加载完成初始化
window.onload = function() {
    initMap();
    loadContentFromLocalStorage();
    renderContentList();
    loadScenicData(currentScenic);
    updateTime();
    getWeather(scenicBaseData[currentScenic].cityCode);
};

// 初始化地图
function initMap() {
    map = new AMap.Map("mapContainer", { 
        zoom: 14, 
        center: scenicBaseData[currentScenic].center 
    });
    map.addControl(new AMap.Geolocation({ enableHighAccuracy: true }));
}

// 切换景区
function switchScenic(scenicName) {
    currentScenic = scenicName;
    map.setCenter(scenicBaseData[currentScenic].center);
    loadScenicData(scenicName);
    getWeather(scenicBaseData[scenicName].cityCode);
    renderContentList();
}

// 加载景区数据
function loadScenicData(scenicName) {
    const landformInfo = document.getElementById("landformInfo");
    landformInfo.innerHTML = `
        <h3 class="mdui-typo-title">${scenicName}景区信息</h3>
        <div class="mdui-m-t-2">地貌类型：${scenicBaseData[scenicName].landform.type}</div>
        <div class="mdui-m-t-1">主峰海拔：${scenicBaseData[scenicName].landform.altitude}</div>
        <div class="mdui-m-t-1">景区特色：${scenicBaseData[scenicName].landform.features}</div>
    `;
    // 获取景区POI景点
    const poi = new AMap.POI();
    poi.searchNearBy({ 
        keyword: `${scenicName} 景点`, 
        location: scenicBaseData[scenicName].center, 
        radius: 5000 
    }, (status, result) => {
        if (status === "complete") {
            const poiList = document.getElementById("poiList");
            poiList.innerHTML = "";
            result.poiList.forEach(item => {
                const li = document.createElement("li");
                li.className = "mdui-list-item";
                li.innerHTML = `<div class="mdui-list-item-content">${item.name}</div>`;
                poiList.appendChild(li);
            });
        }
    });
}

// 显示发布弹窗
function showPublishModal() { 
    mdui.dialog("#publishModal").open(); 
}

// 关闭发布弹窗
function closePublishModal() { 
    mdui.dialog("#publishModal").close(); 
    // 清空表单
    document.getElementById("publishContent").value = "";
    document.getElementById("publishLocation").value = "";
    document.getElementById("photoPreview").style.display = "none";
}

// 预览照片
function previewPhoto(input) {
    if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => { 
            document.getElementById("photoPreview").src = e.target.result; 
            document.getElementById("photoPreview").style.display = "block"; 
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 发布内容
function publishContent() {
    const content = document.getElementById("publishContent").value;
    const location = document.getElementById("publishLocation").value;
    const photo = document.getElementById("photoPreview").src;
    if (!content || !location) { 
        mdui.snackbar({ message: "内容和位置不能为空！" }); 
        return; 
    }
    // 新增内容
    const newContent = {
        id: Date.now(),
        user: { 
            name: "游客" + Math.floor(Math.random() * 1000), 
            avatar: "https://img.yzcdn.cn/vant/cat.jpeg" 
        },
        content: content,
        location: location,
        scenic: currentScenic,
        image: photo,
        likes: 0,
        time: new Date().toLocaleString()
    };
    contentList.unshift(newContent);
    saveContentToLocalStorage();
    renderContentList();
    closePublishModal();
    mdui.snackbar({ message: "发布成功！" });
}

// 从本地存储加载内容
function loadContentFromLocalStorage() {
    const saved = localStorage.getItem("scenicContent");
    if (saved) {
        contentList = JSON.parse(saved);
    } else {
        // 初始化默认内容
        contentList = [
            {
                id: 1,
                user: { name: "黄山游客", avatar: "https://img.yzcdn.cn/vant/cat.jpeg" },
                content: "今天黄山的云海太壮观了！",
                location: "黄山-光明顶",
                scenic: "黄山",
                image: "https://img0.baidu.com/it/u=1644213222,3891342396&fm=253&fmt=auto",
                likes: 28,
                time: "2025-12-12 10:00"
            },
            {
                id: 2,
                user: { name: "香山游客", avatar: "https://img.yzcdn.cn/vant/dog.jpeg" },
                content: "香山红叶已经红透了，超美！",
                location: "香山-香炉峰",
                scenic: "香山",
                image: "https://img0.baidu.com/it/u=3738715624,2058122113&fm=253&fmt=auto",
                likes: 45,
                time: "2025-12-12 14:00"
            }
        ];
        saveContentToLocalStorage();
    }
}

// 保存内容到本地存储
function saveContentToLocalStorage() {
    localStorage.setItem("scenicContent", JSON.stringify(contentList));
}

// 渲染内容列表
function renderContentList() {
    const nearList = document.getElementById("near");
    const hotList = document.getElementById("hotContentList");
    // 过滤当前景区内容
    const filtered = contentList.filter(item => item.scenic === currentScenic);
    // 热门内容按点赞排序
    const hotFiltered = [...filtered].sort((a, b) => b.likes - a.likes);

    // 渲染附近动态
    nearList.innerHTML = "";
    filtered.forEach(item => nearList.appendChild(createContentCard(item)));
    // 渲染热门内容
    hotList.innerHTML = "";
    hotFiltered.forEach(item => hotList.appendChild(createContentCard(item)));
}

// 创建内容卡片
function createContentCard(item) {
    const card = document.createElement("div");
    card.className = "mdui-card mdui-m-b-2";
    card.innerHTML = `
        <div class="mdui-card-header">
            <img class="mdui-card-header-avatar" src="${item.user.avatar}" alt="头像">
            <div class="mdui-card-header-title">${item.user.name}</div>
            <div class="mdui-card-header-subtitle">${item.time}</div>
        </div>
        <div class="mdui-card-content">
            <p>${item.content}</p>
            <p class="mdui-text-color-grey mdui-m-t-1">${item.location}</p>
            <img src="${item.image}" style="width:100%;height:220px;object-fit:cover;margin-top:10px;border-radius:4px;" alt="风景照">
        </div>
        <div class="mdui-card-actions">
            <button class="mdui-btn mdui-btn-icon" onclick="likeContent(${item.id})">
                <i class="mdui-icon material-icons">thumb_up</i> ${item.likes}
            </button>
            <button class="mdui-btn mdui-btn-icon" onclick="showComment(${item.id})">
                <i class="mdui-icon material-icons">comment</i> 评论
            </button>
            <button class="mdui-btn mdui-btn-icon" onclick="addFriend(${item.id})">
                <i class="mdui-icon material-icons">person_add</i> 加好友
            </button>
        </div>
    `;
    return card;
}

// 点赞功能
function likeContent(id) {
    const item = contentList.find(i => i.id === id);
    if (item) {
        item.likes += 1;
        saveContentToLocalStorage();
        renderContentList();
        mdui.snackbar({ message: "点赞成功！" });
    }
}

// 评论功能（模拟）
function showComment(id) {
    const comment = prompt("请输入你的评论：");
    if (comment) {
        mdui.snackbar({ message: "评论成功！" });
    }
}

// 加好友功能（模拟）
function addFriend(id) {
    const item = contentList.find(i => i.id === id);
    mdui.snackbar({ message: `已发送好友请求给${item.user.name}！` });
}
