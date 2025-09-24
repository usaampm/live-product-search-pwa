// PWA 版本 - 搜尋邏輯
// search.js




async function searchProducts() {
  console.log('=== PWA API 搜尋開始 ===', searchCriteria);




  if (!searchCriteria.brand || !searchCriteria.timeRange || !searchCriteria.gender) {
    alert('請完成必要的選擇');
    return;
  }




  showLoading();
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ criteria: searchCriteria }),
      cache: 'no-store'
    });




    // 最快路徑：直接 .json()；僅在偶發解析失敗時靜默略過
let result;
try {
  result = await response.json();
} catch (e) {
  console.debug('⚠️ JSON 噪音略過:', e?.message || e);
  hideLoading();
  return; // 不打擾使用者、不中斷流程
}




    if (result.success) {
      showResults(result.results || []);
    } else {
      alert('搜尋失敗：' + (result.error || '未知錯誤')); 
    }
  } catch (err) {
    alert('搜尋發生錯誤：' + err.message);
  } finally {
    hideLoading();
  }
}



// 語音搜尋處理
async function processVoiceInput(text) {
    console.log('處理語音搜尋:', text);
    showLoading();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'processVoiceSearch', voiceText: text }),
            cache: 'no-store'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
    // 顯示除錯資訊
    if (result.criteria && result.criteria.debugInfo) {
        alert('除錯: ' + result.criteria.debugInfo);
    }
    showResults(result.results || []);
} else {
    alert('語音搜尋失敗：' + (result.error || '未知錯誤'));
}
    } catch (error) {
        hideLoading();
        alert('語音搜尋發生錯誤：' + error.message);
    }
}




// 解析語音輸入（移植自 Google Apps Script）
function parseVoiceInput(voiceText) {
    const text = voiceText.toLowerCase();
    const criteria = {
        features: []
    };
   
    // 品牌識別
    if (text.includes('哥倫比亞') || text.includes('columbia')) {
        criteria.brand = '哥倫比亞';
    } else if (text.includes('北臉') || text.includes('north face')) {
        criteria.brand = '北臉';
    } else if (text.includes('nike') || text.includes('耐克')) {
        criteria.brand = 'Nike';
    }
   
    // 性別識別
    if (text.includes('男') && !text.includes('女')) {
        criteria.gender = '男';
    } else if (text.includes('女') && !text.includes('男')) {
        criteria.gender = '女';
    } else if (text.includes('青年')) {
        criteria.gender = '青年';
    } else if (text.includes('兒童')) {
        criteria.gender = '兒童';
    }
   
    // 類別識別
    const categoryMap = {
        '短t': '短T', '長t': '長T', '短袖': '短T', '長袖': '長T',
        '帽t': '帽T', '外套': '外套', '短褲': '短褲', '長褲': '長褲',
        '洋裝': '洋裝'
    };
   
    for (const [key, value] of Object.entries(categoryMap)) {
        if (text.includes(key)) {
            criteria.category = value;
            break;
        }
    }
   
    // 時間範圍識別
    if (text.includes('最近') || text.includes('新的')) {
        criteria.timeRange = 'recent';
    } else if (text.includes('經典') || text.includes('經典款')) {
        criteria.timeRange = 'classic';
    } else if (text.includes('之前') || text.includes('過期')) {
        criteria.timeRange = 'previous';
    } else if (text.includes('很久') || text.includes('歷史')) {
        criteria.timeRange = 'history';
    } else {
        criteria.timeRange = 'all';
    }
   
    // 特徵識別
    const features = ['冰點', '防曬', '速乾', '涼感', '防風', '透氣', '輕量', '運動', '登山'];
    features.forEach(feature => {
        if (text.includes(feature)) {
            criteria.features.push(feature);
        }
    });
   
    return criteria;
}




// AI 搜尋功能（暫時保持原樣，未來可擴展）
function aiSearch() {
    const input = document.querySelector('.ai-input').value.trim();
    if (!input) {
        alert('請輸入查詢內容');
        return;
    }
   
    alert('AI搜尋功能開發中...\n\n在 PWA 版本中，您可以：\n1. 使用逐步搜尋功能\n2. 使用語音搜尋功能\n3. 未來會整合本地 AI 模型');
}




// 系統健康檢查（PWA 版本）
function systemHealthCheck() {
    showLoading();
   
    setTimeout(() => {
        hideLoading();
       
        const status = {
            後端API: '✅ 使用遠端資料庫',  // 改這行
            語音功能: ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? '✅ 支援' : '❌ 不支援',
            本地儲存: typeof(Storage) !== 'undefined' ? '✅ 支援' : '❌ 不支援',
            PWA功能: 'serviceWorker' in navigator ? '✅ 支援' : '❌ 不支援'
        };
       
        const statusText = Object.entries(status)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
       
        alert(`🔍 直播商品查找系統 PWA 版本\n\n系統狀態：\n${statusText}`);
    }, 500);
}




// 固定按鈕功能
function setupFixedButton() {
    const fixedBtn = document.getElementById('fixedNextBtn');
   
    // 監聽所有選擇事件
    document.addEventListener('change', updateFixedButton);
    document.addEventListener('click', updateFixedButton);
   
    function updateFixedButton() {
        const currentStep = document.querySelector('.step-content.active');
        if (!currentStep) return;
       
        const stepId = currentStep.id;
        let isValid = false;
        let nextAction = null;
       
        if (stepId === 'step1') {
            isValid = searchCriteria.brand;
            nextAction = () => nextStep(2);
            fixedBtn.textContent = '下一步：時間範圍';
        } else if (stepId === 'step2') {
            isValid = searchCriteria.timeRange;
            nextAction = () => nextStep(3);
            fixedBtn.textContent = '下一步：性別';
        } else if (stepId === 'step3') {
            isValid = searchCriteria.gender;
            nextAction = () => nextStep(4);
            fixedBtn.textContent = '下一步：類別';
        } else if (stepId === 'step4') {
            isValid = searchCriteria.category;
            nextAction = () => nextStep(5);
            fixedBtn.textContent = '下一步：特色';
        } else if (stepId === 'step5') {
            isValid = true;  // 步驟5永遠啟用
            nextAction = () => searchProducts();
            fixedBtn.textContent = '開始搜尋';
        }
       
        if (isValid) {
            fixedBtn.classList.add('enabled');
            fixedBtn.onclick = nextAction;
        } else {
            fixedBtn.classList.remove('enabled');
            fixedBtn.onclick = null;
        }
    }
}




// === 以下是新增的記憶功能，全部加在 search.js 最後面 ===




// 記憶功能管理
const MEMORY_KEYS = {
    brand: 'remembered_brand',
    timeRange: 'remembered_timeRange',
    gender: 'remembered_gender'
};




// 儲存記憶設定
function saveMemorySettings() {
    if (document.getElementById('rememberBrand')?.checked && searchCriteria.brand) {
        localStorage.setItem(MEMORY_KEYS.brand, searchCriteria.brand);
    }
    if (document.getElementById('rememberTimeRange')?.checked && searchCriteria.timeRange) {
        localStorage.setItem(MEMORY_KEYS.timeRange, searchCriteria.timeRange);
    }
    if (document.getElementById('rememberGender')?.checked && searchCriteria.gender) {
        localStorage.setItem(MEMORY_KEYS.gender, searchCriteria.gender);
    }
    updateCurrentSettingsDisplay();
}




// 載入記憶設定
function loadMemorySettings() {
    const rememberedBrand = localStorage.getItem(MEMORY_KEYS.brand);
    const rememberedTimeRange = localStorage.getItem(MEMORY_KEYS.timeRange);
    const rememberedGender = localStorage.getItem(MEMORY_KEYS.gender);
   
    if (rememberedBrand) {
        searchCriteria.brand = rememberedBrand;
        const brandSelect = document.getElementById('brandSelect');
        if (brandSelect) brandSelect.value = rememberedBrand;
    }
    if (rememberedTimeRange) searchCriteria.timeRange = rememberedTimeRange;
    if (rememberedGender) searchCriteria.gender = rememberedGender;
   
    updateCurrentSettingsDisplay();
}




// 更新主選單的設定顯示
function updateCurrentSettingsDisplay() {
    const currentSettings = document.getElementById('currentSettings');
    const settingsDisplay = document.getElementById('settingsDisplay');
   
    const rememberedBrand = localStorage.getItem(MEMORY_KEYS.brand);
    const rememberedTimeRange = localStorage.getItem(MEMORY_KEYS.timeRange);
    const rememberedGender = localStorage.getItem(MEMORY_KEYS.gender);
   
    if (rememberedBrand || rememberedTimeRange || rememberedGender) {
        let displayText = '';
        if (rememberedBrand) displayText += `品牌: ${rememberedBrand}  `;
        if (rememberedTimeRange) displayText += `時間: ${getTimeRangeText(rememberedTimeRange)}  `;
        if (rememberedGender) displayText += `性別: ${rememberedGender}`;
       
        settingsDisplay.textContent = displayText;
        currentSettings.style.display = 'block';
    } else {
        currentSettings.style.display = 'none';
    }
}




// 時間範圍文字轉換
function getTimeRangeText(value) {
    const map = {
        'recent': '主要商品',
        'previous': '過期商品',
        'history': '歷史商品',
        'classic': '經典商品',
        'all': '全部搜尋'
    };
    return map[value] || value;
}




// 頁面載入時執行
document.addEventListener('DOMContentLoaded', function() {
    setupFixedButton();
    loadMemorySettings();
   
    // 新增：設置品牌選擇事件
    setupBrandSelection();
});




// 新增這個函數
function setupBrandSelection() {
    const brandSelect = document.getElementById('brandSelect');
    if (brandSelect) {
        brandSelect.addEventListener('change', function() {
            searchCriteria.brand = this.value;
            updateSelectionSummary(); // 加入這行
            const nextBtn = document.getElementById('step1Next');
            if (nextBtn) {
                nextBtn.disabled = !this.value;
            }
        });
       
        // 檢查記憶設定中的品牌
        if (searchCriteria.brand) {
            brandSelect.value = searchCriteria.brand;
            const nextBtn = document.getElementById('step1Next');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }
    }
}
