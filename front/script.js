// 菜单切换功能
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', function() {
    // 移除所有活动状态
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
    
    // 添加当前活动状态
    this.classList.add('active');
    const target = this.getAttribute('data-target');
    document.getElementById(`${target}Content`).classList.add('active');
    
    // 特殊处理：当切换到格栅地图时加载图片
    if (target === 'raster') {
      loadRasterImage();
    }
    // if (target === 'trajector' ) {
    //   setTimeout(() => {
    //     trajector_view.resize();
    //   }, 0);
    // }
  });
});

// 更新当前时间
function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', {hour12: false});
  const dateStr = now.toLocaleDateString('zh-CN');
  document.getElementById('mapLastUpdate').textContent = `${dateStr} ${timeStr}`;
}

// 初始化时间并每秒更新
updateTime();
setInterval(updateTime, 1000);

// 更新频率滑块事件
document.getElementById('freqSlider').addEventListener('input', function() {
  document.getElementById('freqValue').textContent = this.value + ' s';
});

// 清除数据按钮事件
document.getElementById('clearOutputBtn').addEventListener('click', function() {
  document.getElementById('dataOutput').innerHTML = '<div>[System] Data output cleared</div>';
});

// 控制按钮事件
document.getElementById('startBtn').addEventListener('click', function() {
  document.getElementById('systemStatus').className = 'status-indicator running';
  document.getElementById('systemStatus').querySelector('.indicator').className = 'indicator running';
  document.getElementById('systemStatus').querySelector('span').textContent = 'Monitoring in operation';
  
  document.getElementById('statusText').textContent = 'Monitoring in operation';
  document.getElementById('statusIndicator').style.backgroundColor = '#4caf50';
});

document.getElementById('pauseBtn').addEventListener('click', function() {
  document.getElementById('systemStatus').className = 'status-indicator paused';
  document.getElementById('systemStatus').querySelector('.indicator').className = 'indicator paused';
  document.getElementById('systemStatus').querySelector('span').textContent = 'Monitoring Paused';
  
  document.getElementById('statusText').textContent = 'Monitoring Paused';
  document.getElementById('statusIndicator').style.backgroundColor = '#f9a825';
});

document.getElementById('clearBtn').addEventListener('click', function() {
  if (confirm('Are you sure you want to clear all monitoring data? This operation is irreversible.')) {
    document.getElementById('dataOutput').innerHTML = '<div>[System] All monitoring data has been cleared</div>';
    document.getElementById('pointsCount').textContent = '0';
    document.getElementById('dataCount').textContent = '0';
  }
});

document.getElementById('addPointBtn').addEventListener('click', function() {
  const output = document.getElementById('dataOutput');
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', {hour12: false});
  
  const newEntry = document.createElement('div');
  newEntry.textContent = `[${time}] Manual update: 2 new monitoring points added`;
  output.insertBefore(newEntry, output.firstChild);
  
  // 更新统计
  const points = parseInt(document.getElementById('pointsCount').textContent) + 2;
  const dataCount = parseInt(document.getElementById('dataCount').textContent) + 2;
  document.getElementById('pointsCount').textContent = points;
  document.getElementById('dataCount').textContent = dataCount;
});




// 加载Geoscene地图
require(
[
  "geoscene/Map",
  "geoscene/views/MapView",
  "geoscene/Graphic",
  "geoscene/layers/GraphicsLayer",
  "geoscene/widgets/ScaleBar"
], function(Map, MapView, Graphic, GraphicsLayer, ScaleBar) 

{
  // 初始化地图
  const map = new Map({
    basemap: "tianditu-vector"
  });

  

  const view = new MapView({
    map: map,
    center: [116.407526, 39.904030], // 北京中心坐标
    zoom: 10,
    container: "viewDiv",
    popup: {
      autoOpenEnabled: false,
      dockEnabled: true,
      dockOptions: {
        buttonEnabled: true,
        breakpoint: false
      }
    }
    });

  


  // 添加比例尺
  const scaleBar = new ScaleBar({
      view: view
    });
    view.ui.add(scaleBar, "bottom-left");
  const graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  // 图形图层
  const trajectormap = new Map({
    basemap: "tianditu-vector"
  });

  // 添加轨迹图层
  const trajector_view = new MapView({
    map: trajectormap,
    center: [116.407526, 39.904030], // 北京中心坐标
    zoom: 10,
    container: "trajectorDiv",
    popup: {
      autoOpenEnabled: false,
      dockEnabled: true,
      dockOptions: {
        buttonEnabled: true,
        breakpoint: false
      }
    }
  });
  const trajectory_graphicsLayer = new GraphicsLayer();

 
// 使用单色段插值绘制轨迹
function drawTrajectory(points) {
  trajectory_graphicsLayer.removeAll();
  
  if (points.length < 2) {
    return;
  }
  
  // 检查是否有PM2.5数据
  const hasPmData = points[0].hasOwnProperty('pm25');
  
  // 如果没有PM2.5数据，使用固定蓝色
  if (!hasPmData) {
    drawSimpleTrajectory(points);
    return;
  }
  
  // 找出最大和最小PM2.5值
  let minPm = Number.MAX_VALUE;
  let maxPm = Number.MIN_VALUE;
  
  points.forEach(point => {
    const pm = point.pm25;
    if (pm < minPm) minPm = pm;
    if (pm > maxPm) maxPm = pm;
  });
  
  // 创建轨迹线段
  for (let i = 0; i < points.length - 1; i++) {
    const startPoint = points[i];
    const endPoint = points[i + 1];
    
    // 计算两个点的PM2.5平均值
    const avgPm = (startPoint.pm25 + endPoint.pm25) / 2;
    
    // 获取单色渐变颜色（浓度越大颜色越深）
    const color = getMonochromeColor(avgPm, minPm, maxPm);
    
    // 创建线段
    const polyline = {
      type: "polyline",
      paths: [
        [startPoint.longitude, startPoint.latitude],
        [endPoint.longitude, endPoint.latitude]
      ]
    };
    
    const simpleLineSymbol = {
      type: "simple-line",
      color: color,
      width: 5
    };
    
    trajectory_graphicsLayer.add(new Graphic({
      geometry: polyline,
      symbol: simpleLineSymbol
    }));
  }
  
  trajectormap.add(trajectory_graphicsLayer);
}

// 获取单色渐变颜色（浓度越大颜色越深）
function getMonochromeColor(pmValue, minPm, maxPm) {
  // 计算归一化的PM2.5值 (0-1范围)
  const normalized = (pmValue - minPm) / (maxPm - minPm);
  
  // 使用蓝色系：浓度越大蓝色越深
  const baseColor = [0, 0, 255]; // 蓝色
  
  // 计算颜色深度因子 (0.3-1.0范围)
  const depthFactor = 0.3 + (0.7 * normalized);
  
  // 应用深度因子
  const r = Math.round(baseColor[0] * depthFactor);
  const g = Math.round(baseColor[1] * depthFactor);
  const b = Math.round(baseColor[2] * depthFactor);
  
  return [r, g, b, 1];
}

// 简单轨迹绘制（无PM2.5数据时使用）
function drawSimpleTrajectory(points) {
  for (let i = 0; i < points.length - 1; i++) {
    const startPoint = points[i];
    const endPoint = points[i + 1];
    
    const polyline = {
      type: "polyline",
      paths: [
        [startPoint.longitude, startPoint.latitude],
        [endPoint.longitude, endPoint.latitude]
      ]
    };
    
    const simpleLineSymbol = {
      type: "simple-line",
      color: [0, 0, 255, 1], // 固定蓝色
      width: 5
    };
    
    trajectory_graphicsLayer.add(new Graphic({
      geometry: polyline,
      symbol: simpleLineSymbol
    }));
  }
  
  trajectormap.add(trajectory_graphicsLayer);
}



  function loadTrajectoryData() {
  fetch(`http://localhost:5000/trajector?vehicle=${vehicleId}`)
    .then(response => response.json())
    .then(data => {
      if (data.status === "success") {
        setApiStatus("success", "Track data acquisition successful");
        if (data.data && data.data.length > 0) {
          // 传递完整点数据而不是仅坐标
          console.log("Trajectory data:", data.data);
          drawTrajectory(data.data);
          
        } else {
          setApiStatus("error", "Track data is empty");
        }
      } else {
        setApiStatus("error", "Failed to obtain trajectory data: " + data.message);
      }
    })
    .catch(error => {
      console.error('Requesting trajectory data failed:', error);
      setApiStatus("error", "Track data request failed:" + error.message);
    });
}

  // 根据 PM2.5 值返回颜色
  function getColorByPm(pmValue) {
    if (pmValue <= 35) return [46, 204, 113];   // 绿色 - 良好
    else if (pmValue <= 75) return [241, 196, 15]; // 黄色 - 轻度污染
    else if (pmValue <= 115) return [230, 126, 34]; // 橙色 - 中度污染
    else return [231, 76, 60];                 // 红色 - 重度污染
  }
  
  function getStatusClass(pmValue) {
    if (pmValue <= 35) return " Good";
    else if (pmValue <= 75) return " Slight pollution";
    else if (pmValue <= 115) return " Moderate pollution";
    else return " Severe pollution";
  }
  
  function getStatusClassColor(pmValue) {
    if (pmValue <= 35) return "status-good";
    else if (pmValue <= 75) return "status-moderate";
    else if (pmValue <= 115) return "status-unhealthy";
    else return "status-hazardous";
  }

  // DOM元素
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const clearBtn = document.getElementById("clearBtn");
  const addPointBtn = document.getElementById("addPointBtn");
  const clearOutputBtn = document.getElementById("clearOutputBtn");
  const freqSlider = document.getElementById("freqSlider");
  const freqValue = document.getElementById("freqValue");
  const statusIndicator = document.getElementById("statusIndicator");
  const statusText = document.getElementById("statusText");
  const mapLastUpdate = document.getElementById("mapLastUpdate");
  const lastUpdate = document.getElementById("lastUpdate");
  const pointsCount = document.getElementById("pointsCount");
  const dataCount = document.getElementById("dataCount");
  const uptime = document.getElementById("uptime");
  const dataOutput = document.getElementById("dataOutput");
  const apiIndicator = document.getElementById("apiIndicator");
  const apiStatusText = document.getElementById("apiStatusText");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const devicesGrid = document.getElementById("devicesGrid");
  const trajectoryFilter = document.getElementById("loadTrajectoryBtn");
  // 格栅地图相关元素
  const refreshRasterBtn = document.getElementById("refreshRasterBtn");
  const loadTrajectoryBtn = document.getElementById("loadTrajectoryBtn");
  const clearTrajectoryBtn = document.getElementById("clearTrajectoryBtn");
  const rasterLastUpdate = document.getElementById("rasterLastUpdate");
  const maxPm25 = document.getElementById("maxPm25");
  const avgPm25 = document.getElementById("avgPm25");
  const coverageArea = document.getElementById("coverageArea");
  const rasterLoadingOverlay = document.getElementById("rasterLoadingOverlay");
  const rasterImage = document.getElementById("rasterImage");
  const vehicleId = document.getElementById("trajectoryFilter");
  const refreshChartBtn = document.getElementById("refreshChartBtn");
  const refreshRankBtn = document.getElementById("refreshRankBtn");
  // 系统状态
  let isMonitoring = true;
  let updateInterval;
  let dataCounter = 0;
  let startTime = new Date();
  let minPm25 = 1000;
  let receivedData = [];
  const MAX_DATA_OUTPUT = 20;
  const MAX_POINTS = 50;
  let updateFrequency = 5000; // 默认5秒更新频率
  
  // 存储所有监测点
  let monitoringPoints = [];
  
  // 更新地图上的点
 function updatePoint() {
  setApiStatus("loading", " Requesting data...");
  
  // 向后端发送请求获取数据
  fetch('http://localhost:5000/data')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.status === "success") {
        setApiStatus("success", ` Successfully obtained ${data.sampled} data points`);
        
        // 处理所有返回的数据点
        data.data.forEach(point => {
          processDataPoint({
            pm25: point.pm25,
            longitude: point.longitude,
            latitude: point.latitude,
            sensor_id: point.sensor_id
          });
        });
      } else {
        setApiStatus("error", `Data acquisition failed: ${data.message || 'Unknown error'}`);
      }
    })
    .catch(error => {
      console.error('Request failed:', error);
      setApiStatus("error", `API request failed: ${error.message}`);
    });
}
  
  // 处理数据点
  function processDataPoint(dataPoint) {
    const pmValue = dataPoint.pm25;
    const lon = dataPoint.longitude;
    const lat = dataPoint.latitude;
    const sensorId = dataPoint.sensor_id;
    
    // 生成监测点名称
    let pointName = `Equipment #${sensorId}`;
    
    // 检查是否已存在相同传感器ID的点
    let existingPoint = monitoringPoints.find(p => p.sensorId === sensorId);
    
    if (existingPoint) {
      // 更新现有点
      pointName = existingPoint.name;
      existingPoint.lon = lon;
      existingPoint.lat = lat;
      existingPoint.pm25 = pmValue;
      existingPoint.lastUpdate = new Date();
      
      // 移除旧的图形
      const oldGraphic = graphicsLayer.graphics.find(g => 
        g.attributes && g.attributes.sensorId === sensorId
      );
      if (oldGraphic) {
        graphicsLayer.remove(oldGraphic);
      }
    } else {
      // 添加新点（最多50个点）
      if (monitoringPoints.length < MAX_POINTS) {
        monitoringPoints.push({
          name: pointName,
          lon: lon,
          lat: lat,
          pm25: pmValue,
          sensorId: sensorId,
          lastUpdate: new Date()
        });
      } else {
        // 如果超过50个点，则更新最旧的点
        const oldestPoint = monitoringPoints.reduce((oldest, point) => 
          point.lastUpdate < oldest.lastUpdate ? point : oldest
        );
        oldestPoint.name = pointName;
        oldestPoint.lon = lon;
        oldestPoint.lat = lat;
        oldestPoint.pm25 = pmValue;
        oldestPoint.lastUpdate = new Date();
        existingPoint = oldestPoint;
      }
    }
    
    // 更新最低PM2.5值
    if (pmValue < minPm25) minPm25 = pmValue;
    
    // 获取当前时间
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('zh-CN', {hour12: false});
    const dateLabel = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // 创建点图形
    const pointGraphic = new Graphic({
      geometry: {
        type: "point",
        longitude: lon,
        latitude: lat
      },
      attributes: {
        time: dateLabel,
        pm25: pmValue,
        location: pointName,
        status: getStatusClass(pmValue),
        sensorId: sensorId
      },
      symbol: {
        type: "simple-marker",
        color: getColorByPm(pmValue),
        size: 12,
        outline: {
          color: [255, 255, 255],
          width: 2
        }
      },
      popupTemplate: {
        title: "{location} - PM2.5 Monitoring points",
        content: `
          <div class="popup-content">
            <div class="popup-header">
              <div style="width: 40px; height: 40px; border-radius: 8px; 
                          background: rgb(${getColorByPm(pmValue).join(',')});"></div>
              <div>
                <h2 style="margin: 0; font-size: 20px;">${pointName}</h2>
                <p style="margin: 5px 0; color: #7f8c8d;">${dateLabel}</p>
              </div>
            </div>
            
            <div class="popup-pm25">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>PM2.5 Value:</span>
                <strong style="font-size: 24px;"> ${pmValue} μg/m³</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Air quality: </span>
                <strong style="color: rgb(${getColorByPm(pmValue).join(',')}); 
                        font-size: 18px;">${getStatusClass(pmValue)}</strong>
              </div>
            </div>
            
            <div class="popup-advice">
              <h3 style="margin-top: 0; color: #1a73e8;">Health tips</h3>
              <p>
                ${pmValue <= 35 ? 'Excellent air quality, suitable for outdoor activities' : 
                  pmValue <= 75 ? 'Air quality is good, sensitive people should reduce outdoor activities' : 
                  pmValue <= 115 ? 'Air pollution is serious, it is recommended to reduce outdoor activities' : 
                  'Air pollution is serious, avoid outdoor activities'}
              </p>
            </div>
          </div>
        `
      }
    });

    // 添加图形到图层
    graphicsLayer.add(pointGraphic);

    // 更新UI
    dataCounter++;
    lastUpdate.textContent = timeLabel;
    pointsCount.textContent = monitoringPoints.length;
    dataCount.textContent = dataCounter;
    
    // 计算平均PM2.5
    const totalPm25 = monitoringPoints.reduce((sum, point) => sum + point.pm25, 0);
    const averagePm25 = monitoringPoints.length > 0 ? Math.round(totalPm25 / monitoringPoints.length) : 0;
    
    // 更新运行时间
    const elapsed = Math.floor((new Date() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    uptime.textContent = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    // 更新接收数据文本框
    const dataEntry = `[${timeLabel}] ${pointName} | Longitude: ${lon.toFixed(4)} | Latitude: ${lat.toFixed(4)} | PM2.5: ${pmValue} μg/m³ | ${getStatusClass(pmValue)}`;
    receivedData.push(dataEntry);
    
    // 限制显示的数据条数
    if (receivedData.length > MAX_DATA_OUTPUT) {
      receivedData.shift();
    }
    
    // 更新文本框内容
    dataOutput.innerHTML = receivedData.map(entry => 
      `<div class="data-entry">${entry}</div>`
    ).join('');
    
    // 自动滚动到底部
    dataOutput.scrollTop = dataOutput.scrollHeight;
    
    // 更新设备管理面板
    updateDevicesGrid();
  }
  
  // 更新设备管理面板
  function updateDevicesGrid() {
    devicesGrid.innerHTML = '';
    
    monitoringPoints.forEach(device => {
      const deviceCard = document.createElement('div');
      deviceCard.className = 'device-card';
      
      const statusClass = getStatusClassColor(device.pm25);
      const lastUpdateTime = device.lastUpdate.toLocaleTimeString('zh-CN', {hour12: false});
      const elapsed = Math.floor((new Date() - device.lastUpdate) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      const uptimeStr = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      
      deviceCard.innerHTML = `
        <div class="device-header">
          <div class="device-id">Equipment #${device.sensorId}</div>
          <div class="device-status">Online</div>
        </div>
        <div class="device-info">
          <div class="info-item">
            <span class="info-label">PM2.5 value</span>
            <span class="info-value">${device.pm25} <small>μg/m³</small></span>
          </div>
          <div class="info-item">
            <span class="info-label">Air quality</span>
            <span class="info-value ${statusClass}">${getStatusClass(device.pm25)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Last updated</span>
            <span class="info-value">${lastUpdateTime}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Run time</span>
            <span class="info-value">${uptimeStr}</span>
          </div>
        </div>
        <div class="device-location">
          <i class="fas fa-map-marker-alt"></i> Longitude: ${device.lon.toFixed(4)}, Latitude: ${device.lat.toFixed(4)}
        </div>
        <div class="device-actions">
          <button class="action-btn details-btn" onclick="showDeviceDetails(${device.sensorId})">
            <i class="fas fa-info-circle"></i> Details
          </button>
          <button class="action-btn track-btn" onclick="showHistory(${device.sensorId})">
            <i class="fas fa-history"></i> History
          </button>
        </div>
      `;
      
      devicesGrid.appendChild(deviceCard);
    });
  }
  
  // 设置API状态
  function setApiStatus(status, message) {
    apiStatusText.textContent = message;
    
    switch (status) {
      case "success":
        apiIndicator.style.backgroundColor = "#4caf50";
        break;
      case "error":
        apiIndicator.style.backgroundColor = "#e53935";
        break;
      case "loading":
        apiIndicator.style.backgroundColor = "#f9a825";
        break;
    }
  }

  // 鼠标悬浮事件显示弹窗
  let hoverTimeout;
  let currentPopup = null;
  
  view.on("pointer-move", function(event) {
    view.hitTest(event).then(function(response) {
      // 清除之前的定时器
      clearTimeout(hoverTimeout);
      
      // 如果有当前弹窗，先关闭
      if (currentPopup) {
        view.popup.close();
        currentPopup = null;
      }
      
      if (response.results.length > 0) {
        const graphic = response.results[0].graphic;
        if (graphic) {
          // 设置延迟显示弹窗，避免鼠标快速移动时频繁触发
          hoverTimeout = setTimeout(() => {
            const sensorId = graphic.attributes.sensorId;
            
            // 打开弹窗
            view.openPopup({
              features: [graphic],
              location: graphic.geometry,
              updateLocationEnabled: false
            });
            
            currentPopup = graphic;
          }, 300); // 300毫秒延迟
        }
      }
    });
  });
  
  // 鼠标移出地图时关闭所有弹窗
  view.container.addEventListener("mouseleave", function() {
    clearTimeout(hoverTimeout);
    view.popup.close();
    currentPopup = null;
  });

  // 控制按钮事件
  startBtn.addEventListener("click", startMonitoring);
  pauseBtn.addEventListener("click", pauseMonitoring);
  clearBtn.addEventListener("click", clearData);
  addPointBtn.addEventListener("click", updatePoint);
  clearOutputBtn.addEventListener("click", clearOutput);
  
  // 频率滑块事件
  freqSlider.addEventListener("input", function() {
    updateFrequency = this.value * 1000;
    freqValue.textContent = this.value + " s";
    
    if (isMonitoring) {
      clearInterval(updateInterval);
      updateInterval = setInterval(updatePoint, updateFrequency);
    }
  });

  // 开始监测
  function startMonitoring() {
    if (!isMonitoring) {
      isMonitoring = true;
      updatePoint(); // 立即获取一次数据
      updateInterval = setInterval(updatePoint, updateFrequency);
      statusIndicator.style.backgroundColor = "#4caf50";
      statusText.textContent = "Monitoring in operation";
      startBtn.disabled = true;
      pauseBtn.disabled = false;
    }
  }

  // 暂停监测
  function pauseMonitoring() {
    if (isMonitoring) {
      isMonitoring = false;
      clearInterval(updateInterval);
      statusIndicator.style.backgroundColor = "#f9a825";
      statusText.textContent = "监测已暂停";
      startBtn.disabled = false;
      pauseBtn.disabled = true;
    }
  }

  // 清除数据
  function clearData() {
    if (confirm('Are you sure you want to clear all monitoring data? This operation is irreversible.')) {
      graphicsLayer.removeAll();
      monitoringPoints = [];
      dataCounter = 0;
      minPm25 = 1000;
      pointsCount.textContent = "0";
      dataCount.textContent = "0";
      startTime = new Date();
      uptime.textContent = "00:00:00";
      devicesGrid.innerHTML = '';
      clearOutput();
    }
  }

  // 清除输出数据
  function clearOutput() {
    receivedData = [];
    dataOutput.innerHTML = "<div>[System] Data output cleared</div>";
  }
  
  // 格栅地图功能
  function loadRasterImage() {
    // 显示加载指示器
    rasterLoadingOverlay.style.display = "flex";
    

    setTimeout(() => {

      // 加载格栅图像
      rasterImage.src = `http://localhost:5000/raster`;
      
      
      // 更新最后更新时间
      const now = new Date();
      rasterLastUpdate.textContent = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
    
      
      // 隐藏加载指示器
      rasterLoadingOverlay.style.display = "none";
      
      // 添加到数据输出
      const time = now.toLocaleTimeString('zh-CN', {hour12: false});
      const output = document.getElementById("dataOutput");
      const newEntry = document.createElement('div');
      newEntry.textContent = `[${time}] Grid map updated`;
      output.insertBefore(newEntry, output.firstChild);
    }, 200);


  }
  
  
  
  // 刷新格栅数据按钮事件
  refreshRasterBtn.addEventListener('click', function() {
    loadRasterImage();
  });

  loadTrajectoryBtn.addEventListener('click', function() {
    
    loadTrajectoryData();
  });

  clearTrajectoryBtn.addEventListener('click', function() {
    trajectory_graphicsLayer.removeAll();
  });
  
  
  // 地图加载完成时隐藏加载指示器
  view.when(() => {
    document.getElementById('loadingOverlay').style.display = 'none';
    startMonitoring();
  }).catch(err => {
    console.error("Map loading failed:", err);
    document.getElementById('loadingOverlay').innerHTML = "<div style='text-align:center;color:#e53935;'>Map loading failed, please refresh the page</div>";
  });
  
  
  // 全局函数供按钮调用
  window.showDeviceDetails = function(sensorId) {
    const device = monitoringPoints.find(d => d.sensorId === sensorId);
    if (device) {
      alert(`Equipment #${sensorId} Details\n\nPM2.5 value: ${device.pm25} μg/m³\nAir quality : ${getStatusClass(device.pm25)}\nLocation: Longitude ${device.lon.toFixed(4)}, Latitude ${device.lat.toFixed(4)}`);
    }
  };
  
  window.showHistory = function(sensorId) {
    const device = monitoringPoints.find(d => d.sensorId === sensorId);
    if (device) {
      alert(`Equipment #${sensorId} Historical data\n\nLast location: Longitude ${device.lon.toFixed(4)}, Latitude ${device.lat.toFixed(4)}\nLast updated: ${device.lastUpdate.toLocaleString()}`);
    }
  };

const chartDom = document.getElementById('chartContainer');
const rankDom = document.getElementById('rankContainer');
let myChart ;
let rankChart;

refreshChartBtn.addEventListener('click', function() {
  loadChart();  
} );

refreshRankBtn.addEventListener('click', function() {
  loadRank();
} );

function loadRank() {
  if (rankChart) {
    rankChart.dispose();
  }   
  rankChart = echarts.init(rankDom);
  
  // 获取数据并绘制图表
  fetch('http://localhost:5000/rank')
    .then(response => {
      if (!response.ok) {
        throw new Error('Abnormal network response');
      }
      return response.json();
    })
    .then(data => {
      // 检查数据是否为空
      if (!data || data.length === 0) {
        throw new Error('No ranking data was obtained');
      }
      
      // 按排名排序（升序）
      data.sort((a, b) => b.rank - a.rank);
      
      // 准备图表数据
      const deviceIDs = data.map(item => `ID ${item.deviceID}`);
      const averages = data.map(item => item.average);
      
      // 根据浓度值设置颜色
      const colors = data.map(item => {
        if (item.average < 35) return '#4CAF50'; // 优 - 绿色
        if (item.average < 75) return '#FFC107'; // 良 - 黄色
        if (item.average < 115) return '#FF9800'; // 轻度污染 - 橙色
        return '#F44336'; // 重度污染 - 红色
      });
      
      // 配置图表选项
      const option = {
        title: {
          text: 'Equipment PM2.5 concentration ranking',
          left: 'center',
          textStyle: {
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            const item = data[params[0].dataIndex];
            return `
              <div><b>Equipment ${item.deviceID}</b></div>
              <div>Rank: ${item.rank}</div>
              <div>PM2.5 average concentration: ${item.average.toFixed(1)} μg/m³</div>
            `;
          },
          backgroundColor: 'rgba(50,50,50,0.9)',
          borderColor: '#333',
          textStyle: {
            color: '#fff'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '8%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: 'Ave',
          nameLocation: 'end',
          nameTextStyle: {
            padding: [10, 0, 0, 0]
          },
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        yAxis: {
          type: 'category',
          data: deviceIDs,
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          axisLabel: {
            fontSize: 14
          },
          axisTick: {
            show: false
          }
        },
        series: [
          {
            name: 'PM2.5 concentration',
            type: 'bar',
            data: averages,
            itemStyle: {
              color: function(params) {
                return colors[params.dataIndex];
              },
              borderRadius: [0, 8, 8, 0]
            },
            label: {
              show: true,
              position: 'right',
              formatter: '{c} μg/m³',
              fontWeight: 'bold',
              fontSize: 13
            },
            barWidth: '60%',
            emphasis: {
              itemStyle: {
                shadowBlur: 15,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              }
            }
          }
        ],
        // dataZoom: [
        //   {
        //     type: 'slider',
        //     show: true,
        //     yAxisIndex: 0,
        //     filterMode: 'filter',
        //     start: 0,
        //     end: 100,
        //     bottom: '3%',
        //     height: 350,
        //     handleSize: 20
        //   }
        // ]
      };
      
      // 使用配置项显示图表
      rankChart.setOption(option);
      
      // 窗口大小变化时自适应
      window.addEventListener('resize', function() {
        rankChart.resize();
      });
    })
    .catch(error => {
      console.error('Failed to obtain ranking data:', error);
      rankChart.hideLoading();
      // 显示错误信息
      rankDom.innerHTML = `<div class="loading">Data loading failed: ${error.message}</div>`;
    });
}
             
    
    
          
         

 

                          
        


// 初始化图表

function loadChart() {
  if (myChart) {myChart.dispose();}
  
  myChart = echarts.init(chartDom);
// 获取数据并绘制图表
  fetch('http://localhost:5000/line')
      .then(response => {
          if (!response.ok) {
              throw new Error('网络响应异常');
          }
          return response.json();
      })
      .then(data => {
          // 处理数据：分离时间和PM2.5值
          const timeData = data.map(item => item.time);
          const pm25Data = data.map(item => item.pm25);
          const longitudeData = data.map(item => item.longitude);
          const latitudeData = data.map(item => item.latitude);
          // 隐藏加载动画
          myChart.hideLoading();
          
          // 配置图表选项
          const option = {
              title: {
                  text: 'PM2.5 Concentration trend',
                  left: 'center',
                  textStyle: {
                      fontSize: 18,
                      fontWeight: 'bold'
                  }
              },
              tooltip: {
                  trigger: 'axis',
                  formatter: function(params) {
                      return `Time: ${params[0].name}<br/>PM2.5: ${params[0].value} μg/m³
                      <br/>Location: (${longitudeData[params[0].dataIndex].toFixed(4)}, ${latitudeData[params[0].dataIndex].toFixed(4)})`;
                  },
                  backgroundColor: 'rgba(50,50,50,0.7)',
                  borderColor: '#333',
                  textStyle: {
                      color: '#fff'
                  }
              },
              legend: {
                  data: ['PM2.5 Concentration'],
                  bottom: 10
              },
              grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '15%',
                  top: '15%',
                  containLabel: true
              },
              xAxis: {
                  type: 'category',
                  data: timeData,
                  name: 'Time',
                  axisLine: {
                      lineStyle: {
                          color: '#666'
                      }
                  },
                  axisLabel: {
                      rotate: 60, // 旋转45度防止重叠
                      interval: Math.ceil(timeData.length / 10) // 显示部分标签
                  }
              },
              yAxis: {
                  type: 'value',
                  name: 'Concentration (μg/m³)',
                  nameLocation: 'end',
                  nameTextStyle: {
                      padding: [0, 0, 0, 30] // 调整位置
                  },
                  axisLine: {
                      lineStyle: {
                          color: '#666'
                      }
                  },
                  splitLine: {
                      lineStyle: {
                          type: 'dashed'
                      }
                  }
              },
              series: [
                  {
                      name: 'PM2.5 Concentration',
                      type: 'line',
                      data: pm25Data,
                      smooth: true, // 平滑曲线
                      symbol: 'circle', // 数据点显示为圆点
                      symbolSize: 6,
                      lineStyle: {
                          width: 3,
                          color: '#5470c6'
                      },
                      itemStyle: {
                          color: '#5470c6'
                      },
                      areaStyle: {
                          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                              { offset: 0, color: 'rgba(84, 112, 198, 0.5)' },
                              { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
                          ])
                      },
                      markPoint: {
                          data: [
                              { type: 'max', name: '最大值' },
                              { type: 'min', name: '最小值' }
                          ]
                      },
                      markLine: {
                          data: [
                              { type: 'average', name: '平均值' }
                          ],
                          lineStyle: {
                              color: '#91cc75'
                          }
                      }
                  }
              ],
              dataZoom: [
                  {
                      type: 'inside', // 内置型数据区域缩放组件
                      start: 0, // 初始显示范围
                      end: 100
                  },
                  {
                      type: 'slider', // 滑动条型数据区域缩放组件
                      show: true,
                      start: 0,
                      end: 100,
                      bottom: '3%'
                  }
              ],
              toolbox: {
                  feature: {
                      saveAsImage: { title: '保存图片' },
                      dataView: { title: '数据视图' },
                      restore: { title: '重置' }
                  },
                  right: 20
              }
          };
          
          // 使用配置项显示图表
          myChart.setOption(option);
          
          // 窗口大小变化时自适应
          window.addEventListener('resize', function() {
              myChart.resize();
          });
      })
      .catch(error => {
          console.error('Failed to obtain data:', error);
          myChart.hideLoading();
          chartDom.innerHTML = `<div class="loading">Data loading failed: ${error.message}</div>`;
      });
}



loadChart(); // 初始加载图表
loadRank(); // 初始加载排行榜
loadRasterImage(); // 初始加载格栅地图
updatePoint(); // 初始获取数据点
// 定时更新数据点
updateInterval = setInterval(updatePoint, updateFrequency);



}
);
