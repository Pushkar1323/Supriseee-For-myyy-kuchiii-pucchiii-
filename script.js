// ============================================
// GLOBAL VARIABLES
// ============================================
let currentPage = 1;
let isBlowing = false;
let audioContext = null;
let analyser = null;
let blowCheckInterval = null;
let blowStrength = 0;
let blowRequired = 80; // Medium difficulty
let musicEnabled = false;
let heartsInterval = null;

// ============================================
// PAGE NAVIGATION
// ============================================
function goToPage(pageNum) {
    // Hide current page
    document.getElementById(`page${currentPage}`).classList.remove('active');
    
    // Stop current page effects
    stopPageEffects(currentPage);
    
    // Show new page
    currentPage = pageNum;
    document.getElementById(`page${currentPage}`).classList.add('active');
    
    // Start new page effects
    startPageEffects(currentPage);
}

function stopPageEffects(pageNum) {
    if (pageNum === 1) {
        // Stop page 1 audio
        const audio1 = document.getElementById('audio1');
        if (audio1) audio1.pause();
    }
    if (pageNum === 2) {
        // Stop hearts animation
        if (heartsInterval) {
            clearInterval(heartsInterval);
            heartsInterval = null;
        }
        // Stop page 2 audio
        const audio2 = document.getElementById('audio2');
        if (audio2) audio2.pause();
        // Clear hearts
        document.getElementById('heartsBg').innerHTML = '';
    }
    if (pageNum === 3) {
        // Stop video
        const video = document.getElementById('catVideo');
        if (video) video.pause();
    }
}

function startPageEffects(pageNum) {
    if (pageNum === 1) {
        // Play audio if music enabled
        if (musicEnabled) {
            const audio1 = document.getElementById('audio1');
            if (audio1) audio1.play();
        }
    }
    if (pageNum === 2) {
        // Start hearts animation
        startHeartsAnimation();
        // Play audio if music enabled
        if (musicEnabled) {
            const audio2 = document.getElementById('audio2');
            if (audio2) audio2.play();
        }
    }
    if (pageNum === 3) {
        // Play video
        const video = document.getElementById('catVideo');
        if (video) {
            video.currentTime = 0;
            video.play();
        }
    }
}

// ============================================
// HEARTS ANIMATION (PAGE 2)
// ============================================
function startHeartsAnimation() {
    const container = document.getElementById('heartsBg');
    const hearts = ['❤️', '💕', '💖', '💗', '💓', '💝', '💘', '💞', '💟', '🩷'];
    
    // Create initial hearts
    for (let i = 0; i < 15; i++) {
        setTimeout(() => createHeart(container, hearts), i * 200);
    }
    
    // Keep creating hearts
    heartsInterval = setInterval(() => {
        createHeart(container, hearts);
    }, 300);
}

function createHeart(container, hearts) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.fontSize = (Math.random() * 30 + 20) + 'px';
    heart.style.animationDuration = (Math.random() * 2 + 3) + 's';
    
    container.appendChild(heart);
    
    // Remove after animation
    setTimeout(() => {
        if (heart.parentNode) {
            heart.remove();
        }
    }, 5000);
}

// ============================================
// CANDLE BLOWING
// ============================================
async function startBlowing() {
    const blowBtn = document.getElementById('blowBtn');
    const progressContainer = document.getElementById('blowProgress');
    
    if (isBlowing) {
        stopBlowing();
        return;
    }
    
    try {
        // Request microphone
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            } 
        });
        
        // Setup audio analysis
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.3;
        
        // Reset values
        blowStrength = 0;
        isBlowing = true;
        
        // Update UI
        blowBtn.classList.add('listening');
        blowBtn.textContent = '🌬️ Phook Raha Hai...';
        progressContainer.classList.add('show');
        updateProgress(0);
        
        document.getElementById('blowInstruction').textContent = '🌬️ Aur jor se phook maaro!';
        
        // Start checking
        blowCheckInterval = setInterval(checkBlow, 100);
        
    } catch (err) {
        console.error('Microphone error:', err);
        alert('Microphone access chahiye! Please allow karo.');
    }
}

function checkBlow() {
    if (!isBlowing || !analyser) return;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    // Medium threshold - need decent blow
    if (average > 35) {
        // Add to strength based on blow intensity
        const intensity = (average - 35) * 0.4;
        blowStrength += intensity;
        
        // Update progress
        const progress = Math.min(100, Math.round((blowStrength / blowRequired) * 100));
        updateProgress(progress);
        
        // Update flames visually
        updateFlames(progress);
        
        // Check if done
        if (blowStrength >= blowRequired) {
            blowOutCandles();
        }
    } else {
        // Slowly decrease when not blowing
        if (blowStrength > 0) {
            blowStrength = Math.max(0, blowStrength - 2);
            const progress = Math.round((blowStrength / blowRequired) * 100);
            updateProgress(progress);
            updateFlames(progress);
        }
    }
}

function updateProgress(percent) {
    document.getElementById('progressBar').style.width = percent + '%';
    document.getElementById('progressText').textContent = percent + '%';
}

function updateFlames(progress) {
    const flames = document.querySelectorAll('.flame');
    flames.forEach(flame => {
        if (!flame.classList.contains('blown')) {
            const opacity = Math.max(0.2, 1 - (progress / 120));
            const scale = Math.max(0.3, 1 - (progress / 140));
            flame.style.opacity = opacity;
            flame.style.transform = `translateX(-50%) scale(${scale})`;
        }
    });
}

function blowOutCandles() {
    // Stop checking
    stopBlowing();
    
    // Blow all flames
    for (let i = 1; i <= 5; i++) {
        const flame = document.getElementById(`flame${i}`);
        if (flame) {
            flame.classList.add('blown');
            flame.style.opacity = '';
            flame.style.transform = '';
        }
    }
    
    // Show success
    document.getElementById('successMsg').classList.add('show');
    document.getElementById('blowInstruction').textContent = '✨ Wish Zaroor Poori Hogi! ✨';
    document.getElementById('blowProgress').classList.remove('show');
    document.getElementById('blowBtn').style.display = 'none';
    
    // Show next button
    document.getElementById('nextBtn1').classList.add('show');
    
    // Create confetti
    createConfetti();
    
    // Enable music
    enableMusic();
}

function stopBlowing() {
    isBlowing = false;
    
    if (blowCheckInterval) {
        clearInterval(blowCheckInterval);
        blowCheckInterval = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    const blowBtn = document.getElementById('blowBtn');
    blowBtn.classList.remove('listening');
    blowBtn.textContent = '🎤 Phook Maaro!';
    
    // Reset flames if not blown
    const flames = document.querySelectorAll('.flame');
    flames.forEach(flame => {
        if (!flame.classList.contains('blown')) {
            flame.style.opacity = '';
            flame.style.transform = '';
        }
    });
}

// ============================================
// CONFETTI
// ============================================
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff69b4', '#a55eea', '#26de81', '#fd79a8'];
    
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = (Math.random() * 10 + 5) + 'px';
            confetti.style.height = (Math.random() * 10 + 5) + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }
}

// ============================================
// MUSIC CONTROL
// ============================================
function enableMusic() {
    musicEnabled = true;
    document.getElementById('musicToggle').textContent = '🔊';
    
    const audio1 = document.getElementById('audio1');
    if (audio1 && currentPage === 1) {
        audio1.play().catch(e => console.log('Audio play failed:', e));
    }
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    const btn = document.getElementById('musicToggle');
    
    if (musicEnabled) {
        btn.textContent = '🔊';
        // Play current page audio
        if (currentPage === 1) {
            document.getElementById('audio1').play().catch(e => {});
        } else if (currentPage === 2) {
            document.getElementById('audio2').play().catch(e => {});
        }
    } else {
        btn.textContent = '🔇';
        // Pause all audio
        document.getElementById('audio1').pause();
        document.getElementById('audio2').pause();
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Page 1 is already active
    console.log('Birthday Website Ready! 🎂');
});
