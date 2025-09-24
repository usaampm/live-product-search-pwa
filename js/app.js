// PWA 版本 - 介面互動邏輯
// app.js


// 主選單功能
async function startStepSearch() {
    console.log('開始逐步搜尋');
    hideAllContainers();
    document.getElementById('stepSearch').style.display = 'block';
    document.getElementById('stepSearch').classList.add('active');
    document.getElementById('fixedNextBtn').style.display = 'block';  // 加這行
   
    loadMemorySettings();
   
    let targetStep = 1;
    if (searchCriteria.brand) {
        targetStep = 2;
        if (searchCriteria.timeRange) {
            targetStep = 3;
            if (searchCriteria.gender) {
                targetStep = 4;
            }
        }
    }
   
    showStep(targetStep);
   
    // 先載入品牌選項，再恢復之前的選擇
    await loadBrandOptions();
    restorePreviousSelections();
}


function restorePreviousSelections() {
    // 恢復品牌選擇
    if (searchCriteria.brand && document.getElementById('rememberBrand').checked) {
        document.getElementById('brandSelect').value = searchCriteria.brand;
        document.getElementById('step1Next').disabled = false;
    }
   
    // 恢復性別選擇
    if (searchCriteria.gender && document.getElementById('rememberGender').checked) {
        const genderButtons = document.querySelectorAll('#step3 .option-btn');
        genderButtons.forEach(btn => {
            if (btn.textContent === searchCriteria.gender) {
                btn.classList.add('selected');
            }
        });
        document.getElementById('step3Next').disabled = false;
    }
}


function startVoiceSearch() {
    console.log('開始語音搜尋');
    hideAllContainers();
    document.getElementById('voiceSearch').style.display = 'block';
    document.getElementById('voiceSearch').classList.add('active');
}


// 在 app.js 中替換 startAISearch 函數
function showManual() {
    // 使用最新的Google Apps Script網址
    const manualUrl = 'https://script.google.com/macros/s/AKfycby8p5Vbmx032Slcl0flIZ_XVhnZuaRN3SMa5Cn1GTI8A37LWbywh5joqU7ee2iCCXZgAw/exec?action=manual';
    window.open(manualUrl, '_blank');
}


function backToMenu() {
    console.log('返回主選單');
    hideAllContainers();
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('fixedNextBtn').style.display = 'none';  // 加這行
    updateCurrentSettingsDisplay(); // 更新設定顯示
}




// 清除本地快取功能
function clearLocalCache() {
    // 清除所有品牌的類別和特色快取
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('categories_') || key.startsWith('features_')) {
            localStorage.removeItem(key);
        }
    });
    alert('快取已清除，下次選擇品牌時將重新載入最新資料');
}


function hideAllContainers() {
    const containers = ['mainMenu', 'stepSearch', 'voiceSearch', 'aiSearch', 'searchResults', 'loading'];
    containers.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
            element.classList.remove('active');
        }
    });
}


// 步驟導航
 function showStep(stepNumber) {
    const steps = document.querySelectorAll('.step-content');
    steps.forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
    });
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.style.display = 'block';
        targetStep.classList.add('active');
    }

    // 控制固定按鈕
    const fixedBtn = document.getElementById('fixedNextBtn');
    if (fixedBtn) {
        if (stepNumber === 5) {
            fixedBtn.style.display = 'block';
            fixedBtn.textContent = '開始搜尋';
            fixedBtn.onclick = () => searchProducts();
            fixedBtn.disabled = false;
        } else {
            fixedBtn.style.display = 'none';
        }
    }
}

function checkStepCompletion(stepNumber) {
    const fixedBtn = document.getElementById('fixedNextBtn');
    if (!fixedBtn) return;
    
    let isCompleted = false;
    
    if (stepNumber === 1) {
        isCompleted = !!searchCriteria.brand;
    } else if (stepNumber === 2) {
        isCompleted = !!searchCriteria.timeRange;
    } else if (stepNumber === 3) {
        isCompleted = !!searchCriteria.gender;
    } else if (stepNumber === 4) {
        isCompleted = !!searchCriteria.category;
    }
    
    fixedBtn.disabled = !isCompleted;
}


function nextStep(stepNumber) {
    showStep(stepNumber);
}


function prevStep(stepNumber) {
    showStep(stepNumber);
}


// 選項選擇
function selectOption(element, type, value) {
    // 移除同類型的其他選中狀態
    const container = element.closest('.options-grid, .category-groups');
    const siblings = container.querySelectorAll('.option-btn');
    siblings.forEach(btn => btn.classList.remove('selected'));
   
    // 選中當前選項
    element.classList.add('selected');
    searchCriteria[type] = value;
   
    // 新增：更新摘要顯示
    updateSelectionSummary();
   
    // 啟用固定按鈕
    checkStepCompletion(getCurrentStep());
    
    // 自動跳到下一步（步驟1-4）
    const currentStep = getCurrentStep();
    if (currentStep < 5) {
        setTimeout(() => {
            nextStep(currentStep + 1);
        }, 500);
    }
}


function selectFeature(element, feature) {
    element.classList.toggle('selected');
    const index = searchCriteria.features.indexOf(feature);
    if (index > -1) {
        searchCriteria.features.splice(index, 1);
    } else {
        searchCriteria.features.push(feature);
    }
   
    // 加入這行：更新摘要顯示
    updateSelectionSummary();
   
    // 確保搜尋按鈕永遠可用（不管有沒有選特色）
    const fixedBtn = document.getElementById('fixedNextBtn');
    if (fixedBtn && getCurrentStep() === 5) {
    fixedBtn.disabled = false;
    }
}


function getCurrentStep() {
    const activeStep = document.querySelector('.step-content.active');
    return activeStep ? parseInt(activeStep.id.replace('step', '')) : 1;
}





// 完整的手機語音測試版本 - 替換你app.js中的startRecording函數

function startRecording() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('iOS不支援語音識別');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onresult = function(event) {
        let result = '';
        for (let i = 0; i < event.results.length; i++) {
            result += event.results[i][0].transcript;
        }
        // 立即顯示識別結果
        document.getElementById('voiceResult').innerHTML = `識別中：${result}`;
        document.getElementById('voiceResult').style.display = 'block';
    };
    
    recognition.onerror = function(event) {
        alert('錯誤：' + event.error);
    };
    
    recognition.start();
    
    // 3秒後自動停止，避免aborted
    setTimeout(() => {
        recognition.stop();
    }, 3000);
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
    }
    isRecording = false;
    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = '🎤';
    alert('錄音已停止');
}

// 也修改HTML中的按鈕事件，改成點擊而不是按住
// 在你的HTML中找到語音按鈕，把：
// onmousedown="startRecording()" onmouseup="stopRecording()"
// 改成：
// onclick="toggleRecording()"

function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}



// 顯示載入中
function showLoading() {
    hideAllContainers();
    document.getElementById('loading').style.display = 'block';
}


// 隱藏載入中
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}


// 顯示搜尋結果
function showResults(results) {
    hideAllContainers();
    document.getElementById('searchResults').style.display = 'block';
   
    const resultsList = document.getElementById('resultsList');
    if (!results || results.length === 0) {
        resultsList.innerHTML = '<div class="result-item"><div class="result-name">沒有找到符合條件的商品</div></div>';
        return;
    }
   
    resultsList.innerHTML = results.map(item => {
        // 處理銷售歷史顯示
        const saleHistoryHtml = item.saleHistory && item.saleHistory.length > 1
    ? `<div class="sale-history">
         <div class="sale-history-title"><strong>銷售歷史：</strong></div>
         ${item.saleHistory.map(sale =>
           `<div class="sale-record-line">${sale.date} - $${sale.price}</div>`
         ).join('')}
       </div>`
            : `<div class="sale-history">
     <strong>日期：</strong>${item.saleHistory && item.saleHistory[0] ? item.saleHistory[0].date : (item.liveDate || 'N/A')}
     <strong>價格：</strong>${item.saleHistory && item.saleHistory[0] ? item.saleHistory[0].price : (item.price || 'N/A')}      
   </div>`;
       
        return `
            <div class="merged-result-item">
                <div class="result-header">
                    <div class="result-name">${item.name || '未知商品'}</div>
                    <div class="result-meta">${item.brand || 'N/A'} | ${item.gender || 'N/A'} | ${item.type || 'N/A'}</div>
                </div>
                <div class="result-details">
                    <div class="product-sizes"><strong>尺碼：</strong>${item.sizes || 'N/A'}</div>
                    ${saleHistoryHtml}
                    <div class="product-features"><strong>特色：</strong>${item.sellingPoints || '無特色說明'}</div>
                    ${item.relevanceScore ? `<div class="relevance-score">相關度：${item.relevanceScore.toFixed(1)}%</div>` : ''}
                </div>
                ${item.imageUrl ?
                  `<div class="product-image">
                     <img src="${item.imageUrl}" alt="${item.name}" onclick="showLargeImage('${item.imageUrl}')" style="max-width: 100px; cursor: pointer;">
                   </div>`
                  : ''}
            </div>
        `;
    }).join('');
}


function showLargeImage(imageUrl) {
    window.open(imageUrl, '_blank');
}


function updateSelectionSummary() {
    const summaryDiv = document.getElementById('selectionSummary');
    const summaryContent = document.getElementById('summaryContent');
   
    if (!summaryDiv || !summaryContent) return;
   
    const selected = [];
    if (searchCriteria.brand) selected.push(searchCriteria.brand);
    if (searchCriteria.timeRange) selected.push(getTimeRangeText(searchCriteria.timeRange));
    if (searchCriteria.gender) selected.push(searchCriteria.gender);
    if (searchCriteria.category) selected.push(searchCriteria.category);
   
    // 加入特色顯示
    if (searchCriteria.features && searchCriteria.features.length > 0) {
        const featuresText = searchCriteria.features.length > 2
            ? `${searchCriteria.features.slice(0, 2).join('、')}等${searchCriteria.features.length}項`
            : searchCriteria.features.join('、');
        selected.push(`特色：${featuresText}`);
    }
   
    if (selected.length > 0) {
        summaryContent.textContent = selected.join(' → ');
        summaryDiv.style.display = 'block';
    } else {
        summaryDiv.style.display = 'none';
    }
}

function selectBrand(brand) {
    searchCriteria.brand = brand;
    if (brand) {
        loadCategoryOptions(brand);
        loadFeatureOptions(brand);
        checkStepCompletion(1);
        
        // 自動跳到下一步
        setTimeout(() => {
            nextStep(2);
        }, 500);
    }
    updateSelectionSummary();
}

function processVoiceText() {
    const text = document.getElementById('voiceTextInput').value.trim();
    if (text) {
        document.getElementById('voiceTextInput').value = '';
        processVoiceInput(text);
    } else {
        alert('請先用鍵盤語音輸入功能說話');
    }
}




