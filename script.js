// 全局变量
let currentScenic = "黄山"; // 当前选中的景区
let map = null; // 高德地图实例
let contentList = []; // 存储内容数据（用localStorage持久化）

// 黄山/香山的基础地理数据
const scenicBaseData = {
    "黄山": {
        center: [118.186372, 30.143807], // 经纬度
        landform: {
            type: "花岗岩峰林地貌",
            altitude: "主峰莲花峰海拔1864.8米",
            features: "奇松、怪石、云海、温泉、冬雪五绝"
        }
    },
    "香山": {
        center: [116.193342, 39.997181], // 经纬度
        landform: {
            type: "山地丘陵地貌",
            altitude: "主峰香炉峰海拔557米",
            features: "红叶、寺庙、清泉、奇石"
        }
    }
};

// 页面加载完成后执行
window.onload = function() {
    // 初始化地图
    initMap();
    // 加载本地存储的内容
    loadContentFromLocalStorage();
    // 渲染内容列表
    renderContentList();
    // 加载景区地理数据
    loadScenicData(currentScenic);
};

// 初始化高德地图
function initMap() {
    // 创建地图实例
    map = new AMap.Map("mapContainer", {
        zoom: 14, // 缩放级别
        center: scenicBaseData[currentScenic].center // 初始中心点
    });
    // 添加定位控件
    map.addControl(new AMap.Geolocation({
        enableHighAccuracy: true // 高精度定位
    }));
    // 添加POI搜索控件（可选）
    map.addControl(new AMap.ToolBar());
}

// 切换景区
function switchScenic(scenicName) {
    currentScenic = scenicName;
    // 移动地图到对应景区
    map.setCenter(scenicBaseData[currentScenic].center);
    // 重新加载景区地理数据
    loadScenicData(currentScenic);
    // 重新渲染内容（过滤对应景区的内容）
    renderContentList();
}

// 加载景区地理数据（含POI）
function loadScenicData(scenicName) {
    // 渲染地貌数据
    const landformInfo = document.getElementById("landformInfo");
    landformInfo.innerHTML = `
        <h3 class="mdui-typo-title mdui-m-b-2">${scenicName}地理数据</h3>
        <div class="landform-item">
            <span class="landform-label">地貌类型：</span>
            <span class="landform-value">${scenicBaseData[scenicName].landform.type}</span>
        </div>
        <div class="landform-item">
            <span class="landform-label">主峰海拔：</span>
            <span class="landform-value">${scenicBaseData[scenicName].landform.altitude}</span>
        </div>
        <div class="landform-item">
            <span class="landform-label">地貌特色：</span>
            <span class="landform-value">${scenicBaseData[scenicName].landform.features}</span>
        </div>
    `;

    // 调用高德API获取POI（景点）数据
    const poi = new AMap.POI();
    poi.searchNearBy({
        keyword: `${scenicName} 景点 非遗馆`,
        location: scenicBaseData[scenicName].center,
        radius: 5000 // 搜索半径5公里
    }, function(status, result) {
        if (status === "complete") {
            const poiList = document.getElementById("poiList");
            poiList.innerHTML = "";
            // 渲染POI列表
            result.poiList.forEach(item => {
                const li = document.createElement("li");
                li.className = "mdui-list-item mdui-list-item-two-line";
                li.innerHTML = `
                    <div class="mdui-list-item-content">
                        <div class="mdui-list-item-title">${item.name}</div>
                        <div class="mdui-list-item-text">${item.address || "地址未知"}</div>
                    </div>
                `;
                poiList.appendChild(li);
            });
        }
    });
}

// 显示发布弹窗
function showPublishModal() {
    // 填充当前景区到位置输入框
    document.getElementById("publishLocation").value = currentScenic + "-";
    // 显示弹窗
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
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById("photoPreview");
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
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

    // 创建新内容对象
    const newContent = {
        id: Date.now(), // 用时间戳作为唯一ID
        user: {
            name: "游客" + Math.floor(Math.random() * 1000), // 随机用户名
            avatar: "https://img.yzcdn.cn/vant/cat.jpeg" // 默认头像
        },
        content: content,
        location: location,
        scenic: currentScenic,
        image: photo,
        likes: 0,
        comments: [],
        time: new Date().toLocaleString()
    };

    // 添加到内容列表
    contentList.unshift(newContent);
    // 保存到本地存储
    saveContentToLocalStorage();
    // 重新渲染列表
    renderContentList();
    // 关闭弹窗
    closePublishModal();
    // 提示成功
    mdui.snackbar({ message: "发布成功！" });
}

// 加载本地存储的内容
function loadContentFromLocalStorage() {
    const savedContent = localStorage.getItem("scenicContent");
    if (savedContent) {
        contentList = JSON.parse(savedContent);
    } else {
        // 初始化默认数据
        contentList = [
            {
                id: 1,
                user: { name: "黄山游客1", avatar: "https://img.yzcdn.cn/vant/cat.jpeg" },
                content: "黄山云海太壮观了！",
                location: "黄山-云海观景台",
                scenic: "黄山",
                image: "https://img0.baidu.com/it/u=1644213222,3891342396&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=500",
                likes: 28,
                comments: [],
                time: "2025-05-20 10:30:00"
            },
            {
                id: 2,
                user: { name: "香山游客1", avatar: "https://img.yzcdn.cn/vant/dog.jpeg" },
                content: "香山红叶正红！",
                location: "香山-香炉峰",
                scenic: "香山",
                image: "https://img0.baidu.com/it/u=3738715624,2058122113&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=533",
                likes: 45,
                comments: [],
                time: "2025-10-25 14:20:00"
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
    // 过滤当前景区的内容
    const filteredContent = contentList.filter(item => item.scenic === currentScenic);
    // 按热度排序（点赞数）
    const hotContent = [...filteredContent].sort((a, b) => b.likes - a.likes);

    // 渲染附近内容
    nearList.innerHTML = "";
    filteredContent.forEach(item => {
        nearList.appendChild(createContentCard(item));
    });

    // 渲染热门内容
    hotList.innerHTML = "";
    hotContent.forEach(item => {
        hotList.appendChild(createContentCard(item));
    });
}

// 创建内容卡片
function createContentCard(item) {
    const card = document.createElement("div");
    card.className = "content-card";
    card.innerHTML = `
        <div class="user-info">
            <img class="user-avatar" src="${item.user.avatar}" alt="头像">
            <span class="user-name">${item.user.name}</span>
        </div>
        <div class="content-text">${item.content}</div>
        <div class="content-location">${item.location} · ${item.time}</div>
        <img class="content-image" src="${item.image}" alt="风景照片">
        <div class="content-actions">
            <button class="action-btn" onclick="likeContent(${item.id})">
                <i class="mdui-icon material-icons">thumb_up</i> ${item.likes}
            </button>
            <button class="action-btn" onclick="commentContent(${item.id})">
                <i class="mdui-icon material-icons">comment</i> 评论
            </button>
            <button class="action-btn" onclick="addFriend(${item.id})">
                <i class="mdui-icon material-icons">person_add</i> 加好友
            </button>
        </div>
    `;
    return card;
}

// 点赞功能
function likeContent(id) {
    const item = contentList.find(item => item.id === id);
    if (item) {
        item.likes += 1;
        saveContentToLocalStorage();
        renderContentList();
        mdui.snackbar({ message: "点赞成功！" });
    }
}

// 评论功能（模拟）
function commentContent(id) {
    const comment = prompt("请输入评论内容：");
    if (comment) {
        const item = contentList.find(item => item.id === id);
        if (item) {
            item.comments.push({
                user: "我",
                content: comment,
                time: new Date().toLocaleString()
            });
            saveContentToLocalStorage();
            mdui.snackbar({ message: "评论成功！" });
        }
    }
}

// 加好友功能（模拟）
function addFriend(id) {
    const item = contentList.find(item => item.id === id);
    if (item) {
        mdui.snackbar({ message: `已发送好友请求给${item.user.name}！` });
    }
}
