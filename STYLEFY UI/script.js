// グローバル変数
let currentScreen = 'splash-screen';
let previousScreen = '';
let aiMessages = [];
let isAiTyping = false;
let trendingItems = [];
let userPreferences = {
    bodyType: 'straight', // straight, wave, natural
    colors: ['beige', 'navy', 'white', 'black'],
    style: 'elegant',
    budget: 'mid-range' // low, mid-range, high
};

// 定数
const AI_TYPING_DELAY = 1000;
const AI_RESPONSE_DELAY = 1500;
const MAX_FREE_AI_QUERIES = 5;
const SCRAPING_SOURCES = ['ZARA', 'H&M', 'UNIQLO', 'BEAMS', 'PLST'];

// 画面切り替え関数
function showScreen(screenId) {
    // 現在の画面を記録
    previousScreen = currentScreen;
    currentScreen = screenId;
    
    // 全ての画面を非表示にする
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 指定された画面を表示
    document.getElementById(screenId).classList.add('active');
    
    // ナビゲーションの状態を更新
    updateNavigation(screenId);
    
    // メニューバーの状態を更新
    updateMenuBar(screenId);
    
    // 画面に応じた特定の初期化
    initializeScreen(screenId);
    
    // スクロール位置をリセット
    document.getElementById(screenId).scrollTop = 0;
    
    // セッションストレージに現在の画面を保存
    sessionStorage.setItem('currentScreen', screenId);
}

// ナビゲーションの状態を更新
function updateNavigation(screenId) {
    // ナビゲーションアイテムのアクティブ状態をリセット
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 現在の画面に対応するナビゲーションアイテムをアクティブにする
    if (screenId === 'home-screen') {
        document.querySelector('.nav-item[data-screen="home-screen"]').classList.add('active');
    } else if (screenId === 'ai-stylist-screen') {
        document.querySelector('.nav-item[data-screen="ai-stylist-screen"]').classList.add('active');
    } else if (screenId === 'recommend-screen') {
        document.querySelector('.nav-item[data-screen="recommend-screen"]').classList.add('active');
    } else if (screenId === 'my-page-screen') {
        document.querySelector('.nav-item[data-screen="my-page-screen"]').classList.add('active');
    }
    
    // ナビゲーションバーの表示/非表示
    const navbar = document.getElementById('navbar');
    if (['home-screen', 'ai-stylist-screen', 'recommend-screen', 'my-page-screen'].includes(screenId)) {
        navbar.style.display = 'flex';
    } else {
        navbar.style.display = 'none';
    }
}

// メニューバーの状態を更新
function updateMenuBar(screenId) {
    const menuBar = document.getElementById('menu-bar');
    
    // スプラッシュ画面とウェルカム画面ではメニューバーを非表示
    if (['splash-screen', 'welcome-screen'].includes(screenId)) {
        menuBar.style.display = 'none';
    } else {
        menuBar.style.display = 'flex';
        
        // 特定の画面では透明にする
        if (['diagnosis-screen', 'result-screen'].includes(screenId)) {
            menuBar.classList.add('transparent');
        } else {
            menuBar.classList.remove('transparent');
        }
        
        // タイトルをカスタマイズ
        const logoElement = menuBar.querySelector('.logo');
        switch (screenId) {
            case 'home-screen':
                logoElement.textContent = 'STYLEFY';
                break;
            case 'ai-stylist-screen':
                logoElement.textContent = 'AIスタイリスト';
                break;
            case 'recommend-screen':
                logoElement.textContent = 'おすすめ';
                break;
            case 'my-page-screen':
                logoElement.textContent = 'マイページ';
                break;
            default:
                logoElement.textContent = 'STYLEFY';
        }
    }
}

// 各画面の初期化
function initializeScreen(screenId) {
    switch (screenId) {
        case 'ai-stylist-screen':
            if (aiMessages.length === 0) {
                // 初期メッセージを追加
                addAiMessage("こんにちは、Aikoさん。骨格ストレートタイプに合わせたスタイリングのお手伝いをします。どのようなコーディネートをお探しですか？");
            }
            
            // スクロール位置を最下部に
            setTimeout(() => {
                const messagesContainer = document.getElementById('ai-messages');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
            break;
            
        case 'recommend-screen':
            // サジェスト用のトレンドアイテムをロード
            if (trendingItems.length === 0) {
                fetchTrendingItems();
            }
            break;
    }
}

// 戻る処理
function goBack() {
    if (previousScreen) {
        showScreen(previousScreen);
    }
}

// モーダルを開く
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

// モーダルを閉じる
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// AI機能関連 -----------------------------------------------

// AIメッセージを追加
function addAiMessage(message) {
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    aiMessages.push({
        sender: 'ai',
        message: message,
        time: timeStr
    });
    
    updateAiMessages();
}

// ユーザーメッセージを追加
function addUserMessage(message) {
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    aiMessages.push({
        sender: 'user',
        message: message,
        time: timeStr
    });
    
    updateAiMessages();
    
    // AIの応答を生成
    generateAiResponse(message);
}

// AIメッセージを表示更新
function updateAiMessages() {
    const messagesContainer = document.getElementById('ai-messages');
    messagesContainer.innerHTML = '';
    
    aiMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender}`;
        messageDiv.innerHTML = `
            ${msg.message}
            <div class="message-time">${msg.time}</div>
        `;
        messagesContainer.appendChild(messageDiv);
    });
    
    // タイピングインディケーターを追加
    if (isAiTyping) {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
    }
    
    // スクロール位置を最下部に
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// AIの応答を生成
function generateAiResponse(userMessage) {
    // タイピング状態を表示
    isAiTyping = true;
    updateAiMessages();
    
    // 実際のAPIコールの代わりに、簡易的な応答生成
    setTimeout(() => {
        isAiTyping = false;
        
        let response;
        const lowerUserMessage = userMessage.toLowerCase();
        
        if (lowerUserMessage.includes('おすすめ') || lowerUserMessage.includes('教えて')) {
            response = `骨格ストレートさんには、以下のアイテムがおすすめです：

1. テーラードジャケット - 肩のラインをすっきり見せ、縦長シルエットを強調
2. ストレートパンツ - 縦ラインを生かした美脚効果
3. ハリのある素材のシャツ - 直線的なラインを美しく見せます

他にも気になることがあればお気軽にどうぞ！`;
        } else if (lowerUserMessage.includes('春') || lowerUserMessage.includes('コーデ')) {
            response = `春のコーディネートについてですね。骨格ストレートさんには以下のような組み合わせがおすすめです：

- ライトベージュのトレンチコート + 白シャツ + デニム
- 薄手のニット + ストレートスカート + フラットシューズ
- テーラードジャケット + シルクブラウス + スリムパンツ

縦のラインを強調するスタイリングが特に魅力的に映りますよ。`;
        } else if (lowerUserMessage.includes('色') || lowerUserMessage.includes('カラー')) {
            response = `骨格ストレートさんに似合う色は、コントラストのはっきりした色調が魅力的です：

- モノトーン（黒・白・グレー）
- ネイビー
- ボルドー
- カーキ
- ベージュ

シンプルな色味でも、メリハリのある着こなしができるのが特徴です。何か具体的なコーディネートについて知りたいですか？`;
        } else {
            response = "なるほど、詳しく教えていただきありがとうございます。骨格ストレートタイプの方は縦のラインを強調するスタイリングが魅力的です。他に何かお手伝いできることはありますか？";
        }
        
        // サジェスト機能 - 関連するアイテムをスクレイピングしたかのように表示
        setTimeout(() => {
            // 特定のキーワードに反応して商品提案
            if (lowerUserMessage.includes('コート') || lowerUserMessage.includes('ジャケット') || lowerUserMessage.includes('アウター')) {
                updateProductSuggestions('アウター', 'コート・ジャケット');
            } else if (lowerUserMessage.includes('スカート') || lowerUserMessage.includes('パンツ') || lowerUserMessage.includes('ボトムス')) {
                updateProductSuggestions('ボトムス', 'スカート・パンツ');
            } else if (lowerUserMessage.includes('ニット') || lowerUserMessage.includes('ブラウス') || lowerUserMessage.includes('シャツ')) {
                updateProductSuggestions('トップス', 'ブラウス・ニット');
            } else {
                // デフォルトは全般的なおすすめ
                updateProductSuggestions('コーディネート', '骨格ストレート向け');
            }
        }, 500);
        
        addAiMessage(response);
    }, AI_RESPONSE_DELAY);
}

// 商品提案を更新
function updateProductSuggestions(category, subtitle) {
    const suggestTitle = document.querySelector('.suggest-title');
    const suggestSubtitle = document.querySelector('.suggest-subtitle');
    
    if (suggestTitle && suggestSubtitle) {
        suggestTitle.textContent = `${category}のおすすめ`;
        suggestSubtitle.textContent = `骨格ストレート × ${subtitle}`;
    }
}

// トレンドアイテムをフェッチ（Web Scraping APIを模倣）
function fetchTrendingItems() {
    // 実際のスクレイピング処理の代わりに、モックデータを使用
    console.log('Fetching trending items from:', SCRAPING_SOURCES.join(', '));
    
    // モックデータ
    trendingItems = [
        {
            name: 'オーバーサイズジャケット',
            price: '¥19,800',
            source: 'ZARA',
            imageUrl: 'images/ベージュテーラードコート.png',
            matchPercentage: 92
        },
        {
            name: 'リネンブレンドシャツ',
            price: '¥4,990',
            source: 'UNIQLO',
            imageUrl: 'images/シンプルニット.png',
            matchPercentage: 97
        },
        {
            name: 'テーパードパンツ',
            price: '¥12,800',
            source: 'BEAMS',
            imageUrl: 'images/カジュアルデニム.png',
            matchPercentage: 95
        },
        {
            name: 'トレンチコート',
            price: '¥25,900',
            source: 'H&M',
            imageUrl: 'images/トレンチコート.png',
            matchPercentage: 93
        }
    ];
    
    // 画面にトレンドアイテムを表示
    displayTrendingItems();
}

// トレンドアイテムを表示
function displayTrendingItems() {
    const trendingContainer = document.querySelector('.trending-items');
    if (!trendingContainer) return;
    
    let html = '';
    trendingItems.forEach(item => {
        html += `
            <div class="trending-item">
                <div class="trending-item-badge">${item.source}</div>
                <img src="${item.imageUrl}" class="trending-item-img">
                <div class="trending-item-content">
                    <div class="trending-item-title">${item.name}</div>
                    <div class="trending-item-price">${item.price}</div>
                    <div class="trending-item-match">${item.matchPercentage}% マッチ</div>
                </div>
            </div>
        `;
    });
    
    trendingContainer.innerHTML = html;
}

// ページの読み込み時に実行
document.addEventListener('DOMContentLoaded', function() {
    // 3秒後にウェルカム画面に自動遷移
    setTimeout(function() {
        showScreen('welcome-screen');
    }, 3000);
    
    // ナビゲーションアイテムに切り替え機能を設定
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const screenId = this.getAttribute('data-screen');
            showScreen(screenId);
        });
    });
    
    // メニューバーのボタンにイベントを設定
    document.getElementById('search-btn').addEventListener('click', function() {
        showScreen('search-screen');
    });
    
    document.getElementById('notification-btn').addEventListener('click', function() {
        // 通知モーダルを表示
        alert('通知機能は近日公開予定です');
    });
    
    document.getElementById('cart-btn').addEventListener('click', function() {
        // カート画面に遷移
        alert('カート機能は近日公開予定です');
    });
    
    // 骨格診断をはじめるボタン
    document.querySelector('#welcome-screen .btn-primary').addEventListener('click', function() {
        showScreen('diagnosis-screen');
    });
    
    // 骨格診断の「次へ」ボタン
    document.querySelector('#diagnosis-screen .btn-primary').addEventListener('click', function() {
        showScreen('result-screen');
    });
    
    // 診断結果からアカウント登録へ
    document.querySelector('#result-screen .btn-primary').addEventListener('click', function() {
        showScreen('signup-screen');
    });
    
    // アカウント登録からホーム画面へ
    document.querySelector('#signup-screen .btn-primary').addEventListener('click', function() {
        showScreen('home-screen');
    });
    
    // 戻るボタン
    document.querySelectorAll('.btn-icon .fa-arrow-left').forEach(function(backButton) {
        backButton.parentElement.addEventListener('click', goBack);
    });
    
    // AIスタイリスト入力フィールド
    const aiInput = document.getElementById('ai-input');
    const aiSendBtn = document.getElementById('ai-send-btn');
    
    if (aiInput && aiSendBtn) {
        // 送信ボタンのクリックイベント
        aiSendBtn.addEventListener('click', function() {
            const message = aiInput.value.trim();
            if (message) {
                addUserMessage(message);
                aiInput.value = '';
            }
        });
        
        // Enterキーの押下イベント
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const message = aiInput.value.trim();
                if (message) {
                    addUserMessage(message);
                    aiInput.value = '';
                }
                e.preventDefault();
            }
        });
    }
    
    // ファイルアップロードイベントの設定
    setupFileUpload();
}); 