// ============================================
// GLOBAL VARIABLES
// ============================================
var currentPage = 1;
var isBlowing = false;
var audioContext = null;
var analyser = null;
var blowCheckInterval = null;
var blowStrength = 0;
var blowRequired = 80;
var musicEnabled = false;
var heartsInterval = null;
var lastTouchEnd = 0;

// ============================================
// PAGE NAVIGATION
// ============================================
function goToPage(pageNum) {
    document.getElementById('page' + currentPage).classList.remove('active');
    stopPageEffects(currentPage);
    currentPage = pageNum;
    document.getElementById('page' + currentPage).classList.add('active');
    startPageEffects(currentPage);
}

function stopPageEffects(pageNum) {
    if (pageNum === 1) {
        var audio1 = document.getElementById('audio1');
        if (audio1) audio1.pause();
    }
    
    if (pageNum === 2) {
        if (heartsInterval) {
            clearInterval(heartsInterval);
            heartsInterval = null;
        }
        var audio2 = document.getElementById('audio2');
        if (audio2) audio2.pause();
        document.getElementById('heartsBg').innerHTML = '';
    }
    
    if (pageNum === 3) {
        var video = document.getElementById('catVideo');
        if (video) {
            video.pause();
            video.muted = true;
            video.currentTime = 0;
        }
        document.getElementById('unmuteOverlay').classList.remove('hidden');
        document.getElementById('soundToggle').classList.remove('show');
        document.getElementById('videoOverlay').classList.remove('show');
        document.getElementById('videoEndScreen').classList.remove('show');
    }
}

function startPageEffects(pageNum) {
    if (pageNum === 1) {
        if (musicEnabled) {
            var audio1 = document.getElementById('audio1');
            if (audio1) audio1.play().catch(function(e) {});
        }
    }
    
    if (pageNum === 2) {
        startHeartsAnimation();
        if (musicEnabled) {
            var audio2 = document.getElementById('audio2');
            if (audio2) audio2.play().catch(function(e) {});
        }
    }
    
    if (pageNum === 3) {
        var video = document.getElementById('catVideo');
        if (video) {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
        }
        document.getElementById('unmuteOverlay').classList.remove('hidden');
        document.getElementById('videoEndScreen').classList.remove('show');
    }
}

// ============================================
// VIDEO CONTROL (STARTS FROM BEGINNING, NO LOOP)
// ============================================
function playVideoWithSound() {
    var video = document.getElementById('catVideo');
    var overlay = document.getElementById('unmuteOverlay');
    var soundToggle = document.getElementById('soundToggle');
    var videoOverlay = document.getElementById('videoOverlay');
    var endScreen = document.getElementById('videoEndScreen');
    
    if (video) {
        // Reset to beginning
        video.currentTime = 0;
        
        // Unmute and set volume
        video.muted = false;
        video.volume = 1.0;
        
        // Hide end screen if visible
        endScreen.classList.remove('show');
        
        // Play video
        var playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise.then(function() {
                overlay.classList.add('hidden');
                soundToggle.classList.add('show');
                soundToggle.textContent = '🔊';
                videoOverlay.classList.add('show');
            }).catch(function(error) {
                console.log('Video play failed:', error);
                alert('Video play nahi ho raha. Please try again!');
            });
        }
    }
}

function replayVideo() {
    var video = document.getElementById('catVideo');
    var endScreen = document.getElementById('videoEndScreen');
    var soundToggle = document.getElementById('soundToggle');
    var videoOverlay = document.getElementById('videoOverlay');
    
    if (video) {
        video.currentTime = 0;
        video.muted = false;
        video.volume = 1.0;
        
        endScreen.classList.remove('show');
        soundToggle.classList.add('show');
        videoOverlay.classList.add('show');
        
        video.play().catch(function(e) {
            console.log('Replay failed:', e);
        });
    }
}

function toggleVideoSound() {
    var video = document.getElementById('catVideo');
    var soundToggle = document.getElementById('soundToggle');
    
    if (video) {
        video.muted = !video.muted;
        soundToggle.textContent = video.muted ? '🔇' : '🔊';
    }
}

// Video ended event
function setupVideoEndEvent() {
    var video = document.getElementById('catVideo');
    if (video) {
        video.addEventListener('ended', function() {
            var endScreen = document.getElementById('videoEndScreen');
            var soundToggle = document.getElementById('soundToggle');
            var videoOverlay = document.getElementById('videoOverlay');
            
            endScreen.classList.add('show');
            soundToggle.classList.remove('show');
            videoOverlay.classList.remove('show');
        });
    }
}

// ============================================
// HEARTS ANIMATION (PAGE 2)
// ============================================
function startHeartsAnimation() {
    var container = document.getElementById('heartsBg');
    var hearts = ['❤️', '💕', '💖', '💗', '💓', '💝', '💘', '💞', '💟', '🩷'];
    
    for (var i = 0; i < 15; i++) {
        (function(index) {
            setTimeout(function() {
                createHeart(container, hearts);
            }, index * 200);
        })(i);
    }
    
    heartsInterval = setInterval(function() {
        createHeart(container, hearts);
    }, 300);
}

function createHeart(container, hearts) {
    if (!container) return;
    
    var heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.fontSize = (Math.random() * 30 + 20) + 'px';
    heart.style.animationDuration = (Math.random() * 2 + 3) + 's';
    
    container.appendChild(heart);
    
    setTimeout(function() {
        if (heart.parentNode) {
            heart.remove();
        }
    }, 5000);
}

// ============================================
// CANDLE BLOWING
// ============================================
async function startBlowing() {
    var blowBtn = document.getElementById('blowBtn');
    var progressContainer = document.getElementById('blowProgress');
    
    if (isBlowing) {
        stopBlowing();
        return;
    }
    
    try {
        var stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            } 
        });
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        var microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.3;
        
        blowStrength = 0;
        isBlowing = true;
        
        blowBtn.classList.add('listening');
        blowBtn.textContent = '🌬️ Phook Raha Hai...';
        progressContainer.classList.add('show');
        updateProgress(0);
        
        document.getElementById('blowInstruction').textContent = '🌬️ Aur jor se phook maaro!';
        
        blowCheckInterval = setInterval(checkBlow, 100);
        
    } catch (err) {
        console.error('Microphone error:', err);
        alert('Microphone access chahiye! Please allow karo.');
    }
}

function checkBlow() {
    if (!isBlowing || !analyser) return;
    
    var dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    var sum = 0;
    for (var i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    var average = sum / dataArray.length;
    
    if (average > 40) {
        var intensity = (average - 40) * 0.35;
        blowStrength += intensity;
        
        var progress = Math.min(100, Math.round((blowStrength / blowRequired) * 100));
        updateProgress(progress);
        updateFlames(progress);
        
        if (blowStrength >= blowRequired) {
            blowOutCandles();
        }
    } else {
        if (blowStrength > 0) {
            blowStrength = Math.max(0, blowStrength - 2);
            var progress = Math.round((blowStrength / blowRequired) * 100);
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
    var flames = document.querySelectorAll('.flame');
    flames.forEach(function(flame) {
        if (!flame.classList.contains('blown')) {
            var opacity = Math.max(0.2, 1 - (progress / 120));
            var scale = Math.max(0.3, 1 - (progress / 140));
            flame.style.opacity = opacity;
            flame.style.transform = 'translateX(-50%) scale(' + scale + ')';
        }
    });
}

function blowOutCandles() {
    stopBlowing();
    
    for (var i = 1; i <= 5; i++) {
        var flame = document.getElementById('flame' + i);
        if (flame) {
            flame.classList.add('blown');
            flame.style.opacity = '';
            flame.style.transform = '';
        }
    }
    
    document.getElementById('successMsg').classList.add('show');
    document.getElementById('blowInstruction').textContent = '✨ Wish Zaroor Poori Hogi! ✨';
    document.getElementById('blowProgress').classList.remove('show');
    document.getElementById('blowBtn').style.display = 'none';
    document.getElementById('nextBtn1').classList.add('show');
    
    createConfetti();
    enableMusic();
}

function stopBlowing() {
    isBlowing = false;
    
    if (blowCheckInterval) {
        clearInterval(blowCheckInterval);
        blowCheckInterval = null;
    }
    
    if (audioContext) {
        audioContext.close().catch(function(e) {});
        audioContext = null;
    }
    
    var blowBtn = document.getElementById('blowBtn');
    if (blowBtn) {
        blowBtn.classList.remove('listening');
        blowBtn.textContent = '🎤 Phook Maaro!';
    }
    
    var flames = document.querySelectorAll('.flame');
    flames.forEach(function(flame) {
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
    var colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff69b4', '#a55eea', '#26de81', '#fd79a8'];
    
    for (var i = 0; i < 80; i++) {
        (function(index) {
            setTimeout(function() {
                var confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.width = (Math.random() * 10 + 5) + 'px';
                confetti.style.height = (Math.random() * 10 + 5) + 'px';
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                
                document.body.appendChild(confetti);
                
                setTimeout(function() {
                    if (confetti.parentNode) {
                        confetti.remove();
                    }
                }, 4000);
            }, index * 30);
        })(i);
    }
}

// ============================================
// MUSIC CONTROL
// ============================================
function enableMusic() {
    musicEnabled = true;
    document.getElementById('musicToggle').textContent = '🔊';
    
    var audio1 = document.getElementById('audio1');
    if (audio1 && currentPage === 1) {
        audio1.play().catch(function(e) {
            console.log('Audio play failed:', e);
        });
    }
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    var btn = document.getElementById('musicToggle');
    
    if (musicEnabled) {
        btn.textContent = '🔊';
        if (currentPage === 1) {
            document.getElementById('audio1').play().catch(function(e) {});
        } else if (currentPage === 2) {
            document.getElementById('audio2').play().catch(function(e) {});
        }
    } else {
        btn.textContent = '🔇';
        document.getElementById('audio1').pause();
        document.getElementById('audio2').pause();
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎂 Happy Birthday Appu! Website Ready!');
    
    // Setup video end event
    setupVideoEndEvent();
    
    // Prevent double tap zoom
    document.addEventListener('touchend', function(event) {
        var now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});
