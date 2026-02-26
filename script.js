// Variables
var page = 1;
var blowing = false;
var strength = 0;
var audioCtx = null;
var analyser = null;
var interval = null;
var musicOn = false;

// Go to page
function goPage(n) {
    // Hide current
    document.getElementById('page' + page).classList.remove('active');
    
    // Stop stuff
    if (page === 1) {
        document.getElementById('music1').pause();
    }
    if (page === 2) {
        document.getElementById('music2').pause();
    }
    if (page === 3) {
        var v = document.getElementById('video');
        v.pause();
        v.currentTime = 0;
        v.muted = true;
        document.getElementById('tapScreen').classList.remove('hide');
        document.getElementById('endScreen').classList.add('hide');
        document.getElementById('soundBtn').classList.add('hide');
    }
    
    // Show new
    page = n;
    document.getElementById('page' + page).classList.add('active');
    
    // Start music if on
    if (musicOn) {
        if (page === 1) {
            document.getElementById('music1').play();
        }
        if (page === 2) {
            document.getElementById('music2').play();
        }
    }
}

// Toggle music
function toggleMusic() {
    musicOn = !musicOn;
    var btn = document.getElementById('musicBtn');
    
    if (musicOn) {
        btn.textContent = '🔊';
        if (page === 1) {
            document.getElementById('music1').play();
        } else if (page === 2) {
            document.getElementById('music2').play();
        }
    } else {
        btn.textContent = '🔇';
        document.getElementById('music1').pause();
        document.getElementById('music2').pause();
    }
}

// Start blowing
async function startBlow() {
    if (blowing) {
        stopBlow();
        return;
    }
    
    try {
        var stream = await navigator.mediaDevices.getUserMedia({audio: true});
        
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        var mic = audioCtx.createMediaStreamSource(stream);
        mic.connect(analyser);
        analyser.fftSize = 64;
        
        blowing = true;
        strength = 0;
        
        document.getElementById('blowBtn').classList.add('on');
        document.getElementById('blowBtn').textContent = '🌬️ Phook Raha Hai...';
        document.getElementById('progress').classList.add('show');
        document.getElementById('blowText').textContent = '🌬️ Aur jor se!';
        
        interval = setInterval(checkBlow, 100);
        
    } catch(e) {
        alert('Microphone allow karo!');
    }
}

function checkBlow() {
    if (!blowing) return;
    
    var data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    
    var sum = 0;
    for (var i = 0; i < data.length; i++) {
        sum += data[i];
    }
    var avg = sum / data.length;
    
    if (avg > 40) {
        strength += (avg - 40) * 0.4;
        var p = Math.min(100, Math.round(strength / 80 * 100));
        document.getElementById('bar').style.width = p + '%';
        document.getElementById('percent').textContent = p + '%';
        
        // Dim flames
        for (var i = 1; i <= 5; i++) {
            var f = document.getElementById('f' + i);
            f.style.opacity = Math.max(0.2, 1 - p/100);
        }
        
        if (strength >= 80) {
            blowOut();
        }
    } else {
        if (strength > 0) {
            strength = Math.max(0, strength - 2);
            var p = Math.round(strength / 80 * 100);
            document.getElementById('bar').style.width = p + '%';
            document.getElementById('percent').textContent = p + '%';
        }
    }
}

function blowOut() {
    stopBlow();
    
    for (var i = 1; i <= 5; i++) {
        document.getElementById('f' + i).classList.add('off');
    }
    
    document.getElementById('success').classList.add('show');
    document.getElementById('blowText').textContent = '✨ Wish Poori Hogi! ✨';
    document.getElementById('progress').classList.remove('show');
    document.getElementById('blowBtn').classList.add('hide');
    document.getElementById('next1').classList.remove('hide');
    
    confetti();
    
    // Enable music
    musicOn = true;
    document.getElementById('musicBtn').textContent = '🔊';
    document.getElementById('music1').play();
}

function stopBlow() {
    blowing = false;
    if (interval) clearInterval(interval);
    if (audioCtx) audioCtx.close();
    
    document.getElementById('blowBtn').classList.remove('on');
    document.getElementById('blowBtn').textContent = '🎤 Phook Maaro!';
}

// Confetti
function confetti() {
    var colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff69b4', '#a55eea'];
    
    for (var i = 0; i < 50; i++) {
        setTimeout(function() {
            var c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + 'vw';
            c.style.background = colors[Math.floor(Math.random() * colors.length)];
            c.style.width = (Math.random() * 8 + 5) + 'px';
            c.style.height = (Math.random() * 8 + 5) + 'px';
            c.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            document.body.appendChild(c);
            
            setTimeout(function() {
                c.remove();
            }, 3000);
        }, i * 50);
    }
}

// Video
function playVideo() {
    var v = document.getElementById('video');
    v.currentTime = 0;
    v.muted = false;
    v.volume = 1;
    
    v.play().then(function() {
        document.getElementById('tapScreen').classList.add('hide');
        document.getElementById('soundBtn').classList.remove('hide');
    }).catch(function() {
        alert('Video play nahi ho raha!');
    });
}

function replayVideo() {
    var v = document.getElementById('video');
    v.currentTime = 0;
    v.muted = false;
    v.play();
    document.getElementById('endScreen').classList.add('hide');
    document.getElementById('soundBtn').classList.remove('hide');
}

function toggleSound() {
    var v = document.getElementById('video');
    v.muted = !v.muted;
    document.getElementById('soundBtn').textContent = v.muted ? '🔇' : '🔊';
}

// Video end
document.addEventListener('DOMContentLoaded', function() {
    var v = document.getElementById('video');
    v.addEventListener('ended', function() {
        document.getElementById('endScreen').classList.remove('hide');
        document.getElementById('soundBtn').classList.add('hide');
    });
});
