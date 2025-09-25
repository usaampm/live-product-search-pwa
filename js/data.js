// PWA 版本 - 資料結構和全域變數
// data.js


// 🔑 後端 API URL（Worker 或 GAS 二選一）
const API_URL = "https://pwa-cors-proxy.usaampmintw.workers.dev";
// const API_URL = "https://script.google.com/macros/s/AKfycbxtbpn12nR40qiHcZUdhMC_2zaoTjvJFfTh-BAfVtY8T1VD9sK1KnjWbmUnKeehQ9I33Q/exec"; // 備用


// 全域變數
let searchCriteria = {
    brand: '',
    timeRange: '',
    gender: '',
    category: '',
    features: []
};


let rememberSettings = {
    brand: true,
    gender: true
};






// 模擬商品資料（之後會從 data/products.json 載入）
let productsData = [];


// 語音搜尋相關變數
let isRecording = false;
let recognition = null;


// 載入商品資料的函數
async function loadProductsData() {
    try {
        const response = await fetch('data/products.json');
        if (response.ok) {
            productsData = await response.json();
            console.log('商品資料載入成功', productsData.length, '個商品');
        } else {
            console.warn('商品資料檔案不存在，使用空資料');
            productsData = [];
        }
    } catch (error) {
        console.error('載入商品資料失敗:', error);
        productsData = [];
    }
}


// 在 data.js 最後面新增
async function loadBrandOptions() {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'getBrands' }),
      cache: 'no-store'
    });
   
    const result = await response.json();
    if (result.success) {
      const brandSelect = document.getElementById('brandSelect');


      // 新增這3行檢查
      if (!brandSelect) {
        console.error('找不到brandSelect元素');
        return;
      }


      brandSelect.innerHTML = '<option value="">-- 請選擇品牌 --</option>';
      result.brands.forEach(brand => {
        brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
      });
    }
  } catch (error) {
    console.error('載入品牌失敗:', error);
  }
}




async function loadCategoryOptions(brand) {
  // 檢查localStorage快取
  const cacheKey = `categories_${brand}`;
  const cached = localStorage.getItem(cacheKey);
 
  if (cached) {
    const categories = JSON.parse(cached);
    generateCategoryHTML(categories);
    console.log('從快取載入類別:', categories);
    return;
  }
 
  // 沒有快取就API載入並存入快取
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'getCategories', brand: brand }),
      cache: 'no-store'
    });
   
    const result = await response.json();
    if (result.success) {
      // 存入localStorage
      localStorage.setItem(cacheKey, JSON.stringify(result.categories));
     
      generateCategoryHTML(result.categories);
      console.log('從API載入並快取類別:', result.categories);
    } else {
      console.error('載入類別失敗:', result.error);
    }
  } catch (error) {
    console.error('載入類別API請求失敗:', error);
  }
}


function generateCategoryHTML(categories) {
  const container = document.querySelector('#step4 .category-groups');
  if (!container) return;
 
  container.innerHTML = '';
 
  Object.keys(categories).forEach(groupName => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'category-group';
   
    const titleDiv = document.createElement('div');
    titleDiv.className = 'group-title';
    titleDiv.textContent = groupName;
   
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options-grid';
   
    categories[groupName].forEach(item => {
      const optionBtn = document.createElement('div');
      optionBtn.className = 'option-btn';
      optionBtn.textContent = item;
      optionBtn.onclick = () => {
      selectOption(optionBtn, 'category', item);
      // 舅舅的家選擇類別後重新載入特色
      if (searchCriteria.brand === '舅舅的家') {
      loadFeatureOptions(searchCriteria.brand);
      }
    };
      optionsDiv.appendChild(optionBtn);
    });
   
    groupDiv.appendChild(titleDiv);
    groupDiv.appendChild(optionsDiv);
    container.appendChild(groupDiv);
  });


}


// 載入特色選項
async function loadFeatureOptions(brand) {
  if (!brand) return;
 
  // 檢查localStorage快取
  const cacheKey = `features_${brand}`;
  const cached = localStorage.getItem(cacheKey);
 
  if (cached) {
    const features = JSON.parse(cached);
    generateFeatureHTML(features);
    console.log('從快取載入特色:', features);
    return;
  }
 
  // 沒有快取就API載入並存入快取
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'getFeatures', brand: brand }),
      cache: 'no-store'
    });
   
    const result = await response.json();
    if (result.success) {
      // 存入localStorage
      localStorage.setItem(cacheKey, JSON.stringify(result.features));
     
      generateFeatureHTML(result.features);
      console.log('從API載入並快取特色:', result.features);
    } else {
      console.error('載入特色失敗:', result.error);
    }
  } catch (error) {
    console.error('載入特色API請求失敗:', error);
  }
}


function generateFeatureHTML(features) {
  const container = document.getElementById('featuresContainer');
  if (!container) return;
 
  // 舅舅的家特殊處理：只顯示選定類別的特色
  if (searchCriteria.brand === '舅舅的家' && searchCriteria.category) {
    const filteredFeatures = {};
    if (features[searchCriteria.category]) {
      filteredFeatures[searchCriteria.category] = features[searchCriteria.category];
    }
    features = filteredFeatures;
  }
 
  container.innerHTML = '';
 
  Object.keys(features).forEach(groupName => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'category-group';
   
    const titleDiv = document.createElement('div');
    titleDiv.className = 'group-title';
    titleDiv.textContent = groupName;
   
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options-grid';
   
    features[groupName].forEach(feature => {
      const optionBtn = document.createElement('div');
      optionBtn.className = 'option-btn';
      optionBtn.textContent = feature;
      optionBtn.onclick = () => selectFeature(optionBtn, feature);
      optionsDiv.appendChild(optionBtn);
    });
   
    groupDiv.appendChild(titleDiv);
    groupDiv.appendChild(optionsDiv);
    container.appendChild(groupDiv);
  });
}




// 初始化資料
document.addEventListener('DOMContentLoaded', function() {
    loadProductsData();
    loadBrandOptions(); // 新增：程式啟動時就載入品牌
});





