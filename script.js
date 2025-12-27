// Main Initialization Logic
const init = () => {
    console.log("Leon's Hub Loaded");


    // Navigation Logic
    // Navigation Logic
    const handleNavigation = (targetId) => {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.view-section');

        // Update Nav State (Sidebar)
        navItems.forEach(nav => {
            if (nav.getAttribute('data-target') === targetId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        // Update View State
        sections.forEach(section => {
            if (section.id === targetId) {
                section.style.display = 'block';
                // Scroll to top of section logic if needed
            } else {
                section.style.display = 'none';
            }
        });

        // Scroll to top of main content
        document.querySelector('.main-content').scrollTop = 0;

        // Animate Footer (Pop effect)
        const footer = document.querySelector('.site-footer');
        if (footer) {
            footer.style.animation = 'none';
            footer.offsetHeight; /* trigger reflow */
            footer.style.animation = 'fadeIn 0.4s ease';
            footer.style.animation = 'fadeIn 0.4s ease';
        }

        // Conditional Footer (Hide promo on Consulting page)
        const footerPromo = document.querySelector('.footer-promo');
        if (footerPromo) {
            if (targetId === 'consulting') {
                footerPromo.style.display = 'none';
            } else {
                footerPromo.style.display = 'block'; // Or 'block' based on layout, usually block for p tag
            }
        }
    };

    // Sidebar Clciks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            handleNavigation(targetId);
        });
    });

    // In-Page Navigation Triggers (e.g. from About Me to Shop)
    document.querySelectorAll('.nav-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            // Don't navigate if clicking on a button/input INSIDE a nav-trigger (like, comment, etc.)
            // But allow if the button itself IS the nav-trigger
            const clickedButton = e.target.closest('button');
            const clickedInput = e.target.closest('input');
            if ((clickedButton && clickedButton !== trigger) || clickedInput) {
                return;
            }
            e.preventDefault();
            const targetId = trigger.getAttribute('data-target');
            handleNavigation(targetId);
        });
    });

    // Content Filtering (Recycled logic adapted for new structure)
    const filterBtns = document.querySelectorAll('.filter-btn');
    const feedCards = document.querySelectorAll('.feed-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Only toggle active state if it's an actual filter button
            if (!btn.hasAttribute('data-filter')) return;

            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            feedCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    // Generic Scroll Logic
    const setupHorizontalScroll = (containerClass, leftBtnClass, rightBtnClass) => {
        const slider = document.querySelector(containerClass);
        if (!slider) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        // Mouse Wheel
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            slider.scrollLeft += e.deltaY * 3;
        });

        // Buttons
        const leftBtn = document.querySelector(leftBtnClass);
        const rightBtn = document.querySelector(rightBtnClass);

        if (leftBtn && rightBtn) {
            leftBtn.addEventListener('click', () => {
                slider.scrollLeft -= 300;
            });
            rightBtn.addEventListener('click', () => {
                slider.scrollLeft += 300;
            });
        }

        // Drag to Scroll
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });
    };

    // Initialize Scroll Areas
    setupHorizontalScroll('.timeline-container', '.scroll-btn.left', '.scroll-btn.right');
    setupHorizontalScroll('.metaphor-container', '#metaphor-scroll-left', '#metaphor-scroll-right');
    setupHorizontalScroll('.philosophy-grid', '#phil-scroll-left', '#phil-scroll-right');

    // Waitlist Form Logic
    const waitlistForm = document.getElementById('waitlist-form');
    const waitlistSuccess = document.getElementById('waitlist-success');
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCv21ALQDEoqOL1S1yANmhkcbzEMEIyopOIeZeGwGsRMvSXC1kQrPVeabAHm-PyjNo/exec';

    if (waitlistForm) {
        waitlistForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = waitlistForm.querySelector('button');
            const emailInput = waitlistForm.querySelector('input');
            const email = emailInput.value;
            const originalBtnText = btn.textContent;

            // Loading state
            btn.textContent = 'Joining...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            // Send data
            fetch(SCRIPT_URL, {
                method: 'POST',
                // Using URLSearchParams sends as application/x-www-form-urlencoded
                // This avoids some CORS preflight complications with Google Scripts
                body: new URLSearchParams({ email: email })
            })
                .then(response => {
                    // Determine success (Google Scripts sometimes return 200 even on logic error, 
                    // but network success is usually enough for this simple usage)
                    waitlistForm.style.display = 'none';
                    waitlistSuccess.style.display = 'block';
                    console.log('Waitlist success!', response);
                })
                .catch(error => {
                    console.error('Waitlist Error!', error);
                    btn.textContent = originalBtnText;
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    alert('Something went wrong. Please check your connection and try again.');
                });
        });
    }

    // --- Audio Duration Helper ---
    const getAudioDuration = (file) => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
                URL.revokeObjectURL(audio.src);
            };
            audio.onerror = () => {
                resolve(0); // Fallback if can't get duration
            };
            audio.src = URL.createObjectURL(file);
        });
    };

    // --- Audio Compression Helper ---
    // Extracts audio, converts to 8kHz mono 8-bit WAV (aggressively compressed for upload)
    const compressAudio = async (file, onProgress) => {
        return new Promise(async (resolve, reject) => {
            try {
                onProgress?.('Decoding audio...');

                // Create AudioContext for processing
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();

                // Read file as ArrayBuffer
                const arrayBuffer = await file.arrayBuffer();

                // Decode audio data
                onProgress?.('Processing audio...');
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Get original properties
                const length = audioBuffer.length;
                const sampleRate = audioBuffer.sampleRate;

                // Target: 8kHz mono (aggressive compression, still good for speech)
                const targetSampleRate = 8000;

                // Create offline context at 8kHz mono
                const offlineContext = new OfflineAudioContext(1, Math.ceil(length * (targetSampleRate / sampleRate)), targetSampleRate);

                // Create buffer source
                const source = offlineContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(offlineContext.destination);
                source.start(0);

                // Render resampled audio
                onProgress?.('Compressing audio...');
                const renderedBuffer = await offlineContext.startRendering();

                // Convert to 8-bit µ-law WAV (very small)
                const wavBlob = audioBufferToWav8bit(renderedBuffer);

                // Log compression stats
                const originalSize = file.size;
                const compressedSize = wavBlob.size;
                console.log(`Audio compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);

                audioContext.close();
                resolve(wavBlob);

            } catch (error) {
                console.error('Audio compression failed:', error);
                reject(error);
            }
        });
    };

    // Helper: Convert AudioBuffer to 8-bit WAV Blob (much smaller)
    const audioBufferToWav8bit = (buffer) => {
        const numChannels = 1;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 8;

        const bytesPerSample = 1;
        const blockAlign = numChannels * bytesPerSample;

        const data = buffer.getChannelData(0);
        const samples = data.length;
        const dataLength = samples * blockAlign;
        const bufferLength = 44 + dataLength;

        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, bufferLength - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        // Write audio data (8-bit unsigned)
        let offset = 44;
        for (let i = 0; i < samples; i++) {
            const sample = Math.max(-1, Math.min(1, data[i]));
            // Convert from [-1, 1] to [0, 255] for 8-bit unsigned
            view.setUint8(offset, Math.round((sample + 1) * 127.5));
            offset += 1;
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    };

    // --- Transcriber Logic ---
    const uploadArea = document.getElementById('upload-area');
    const audioInput = document.getElementById('audio-input');
    const fileInfo = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');
    const transcribeBtn = document.getElementById('transcribe-btn');
    const progressWrapper = document.getElementById('progress-wrapper');
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.querySelector('.progress-label');
    const resultArea = document.getElementById('result-area');
    const transcriptText = document.getElementById('transcript-text');

    let currentFile = null;
    let transcriber = null;

    // Handle File Selection
    if (uploadArea) {
        uploadArea.addEventListener('click', () => audioInput.click());

        audioInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0]);
        });

        // Drag & Drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#fff';
            uploadArea.style.background = 'rgba(255,255,255,0.1)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'transparent';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'transparent';

            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    const handleFile = (file) => {
        if (!file.type.startsWith('audio') && !file.type.startsWith('video')) {
            alert('Please upload an audio or video file.');
            return;
        }
        currentFile = file;
        fileNameDisplay.textContent = file.name;
        uploadArea.style.display = 'none';
        fileInfo.style.display = 'flex';
        transcribeBtn.disabled = false;
        resultArea.style.display = 'none'; // reset result
    };

    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            currentFile = null;
            audioInput.value = ''; // reset input
            fileInfo.style.display = 'none';
            uploadArea.style.display = 'block';
            transcribeBtn.disabled = true;
            progressWrapper.style.display = 'none';
        });
    }

    // Run Transcription
    if (transcribeBtn) {
        transcribeBtn.addEventListener('click', async () => {
            if (!currentFile) return;

            // Check audio duration (10 min limit for browser version)
            const MAX_DURATION_SECONDS = 600; // 10 minutes
            const audioDuration = await getAudioDuration(currentFile);

            if (audioDuration > MAX_DURATION_SECONDS) { // 10 minutes
                const minutes = Math.round(audioDuration / 60);
                alert(`This audio is ~${minutes} minutes long.\n\nThe browser version is strictly limited to 10 minutes.\n\n🚀 Download the Pro App for unlimited transcription!`);

                // Clear file
                currentFile = null; // Clear currentFile reference
                audioInput.value = ''; // Clear the file input element
                fileInfo.style.display = 'none';
                uploadArea.style.display = 'block';
                transcribeBtn.disabled = true;
                return;
            }
            transcribeBtn.style.display = 'none';
            progressWrapper.style.display = 'block';
            resultArea.style.display = 'none';
            transcriptText.value = '';

            try {
                progressLabel.textContent = 'Preparing audio...';
                progressFill.style.width = '30%';

                // Compress audio before upload (extracts audio from video, resamples to 16kHz mono)
                let audioToUpload;
                try {
                    audioToUpload = await compressAudio(currentFile, (status) => {
                        progressLabel.textContent = status;
                    });
                    progressLabel.textContent = 'Uploading compressed audio...';
                    progressFill.style.width = '50%';
                } catch (compressionError) {
                    console.warn('Compression failed, using original file:', compressionError);
                    audioToUpload = currentFile; // Fallback to original
                    progressLabel.textContent = 'Uploading original file...';
                }

                // Create FormData with compressed audio
                progressLabel.textContent = 'Uploading to server...';
                progressFill.style.width = '60%';

                // Convert blob to base64 for more reliable upload
                const arrayBuffer = await audioToUpload.arrayBuffer();
                const base64Audio = btoa(
                    new Uint8Array(arrayBuffer)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );

                console.log(`Total data: ${(base64Audio.length / 1024 / 1024).toFixed(2)}MB base64`);

                // CHUNKED UPLOAD: Split into 300KB chunks to avoid proxy limits
                const CHUNK_SIZE = 300 * 1024; // 300KB per chunk
                const totalChunks = Math.ceil(base64Audio.length / CHUNK_SIZE);
                const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

                console.log(`Uploading in ${totalChunks} chunks...`);

                for (let i = 0; i < totalChunks; i++) {
                    const start = i * CHUNK_SIZE;
                    const end = Math.min(start + CHUNK_SIZE, base64Audio.length);
                    const chunk = base64Audio.slice(start, end);

                    progressLabel.textContent = `Uploading chunk ${i + 1}/${totalChunks}...`;
                    progressFill.style.width = `${40 + (i / totalChunks) * 40}%`;

                    const chunkResponse = await fetch('/upload-chunk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            uploadId: uploadId,
                            chunkIndex: i,
                            totalChunks: totalChunks,
                            data: chunk
                        })
                    });

                    if (!chunkResponse.ok) {
                        throw new Error(`Failed to upload chunk ${i + 1}`);
                    }
                }

                // All chunks uploaded, now process
                progressLabel.textContent = 'Transcribing...';
                progressFill.style.width = '80%';

                const response = await fetch('/process-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uploadId: uploadId })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Server Error');
                }

                // Show Result area immediately
                progressWrapper.style.display = 'none';
                resultArea.style.display = 'block';
                transcribeBtn.style.display = 'none'; // Keep hidden until done
                transcriptText.value = ''; // Clear previous

                // Read Stream
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    transcriptText.value += chunk;
                    // Auto-scroll to bottom
                    transcriptText.scrollTop = transcriptText.scrollHeight;
                }

                transcribeBtn.style.display = 'block'; // Allow retry/new upload

            } catch (err) {
                console.error(err);
                alert('Transcription failed: ' + err.message);
                progressWrapper.style.display = 'none';
                transcribeBtn.style.display = 'block';
            }
        });
    }

    // Copy/Download Logic
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(transcriptText.value);
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy', 2000);
        });
    }
};

// Run Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// --- Like & Comment System (Firebase-based) ---

// Firebase Configuration - YOU NEED TO REPLACE THIS WITH YOUR OWN CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyD4meMgUpWj3FMeAgecyFcGCWAbG8h6o7U",
    authDomain: "leon-data-tech-hub.firebaseapp.com",
    databaseURL: "https://leon-data-tech-hub-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "leon-data-tech-hub",
    storageBucket: "leon-data-tech-hub.firebasestorage.app",
    messagingSenderId: "613286907872",
    appId: "1:613286907872:web:56195a9c256ba369b2a585",
    measurementId: "G-P49DSS1HGQ"
};

// Initialize Firebase
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    console.log("Firebase connected!");
} catch (e) {
    console.warn("Firebase not configured. Using localStorage fallback.", e);
}

// Load tool data from Firebase
function loadToolData() {
    if (!db) {
        // Fallback to localStorage if Firebase not configured
        loadLocalData();
        return;
    }

    // Listen for likes
    db.ref('tools/transcriber/likes').on('value', (snapshot) => {
        const likes = snapshot.val() || 0;
        const likeBtn = document.querySelector('.like-btn[data-tool="transcriber"]');
        if (likeBtn) {
            likeBtn.querySelector('.like-count').textContent = likes;
        }
    });

    // Check if current user liked (still use localStorage for this)
    const liked = localStorage.getItem('transcriber_liked') === 'true';
    const likeBtn = document.querySelector('.like-btn[data-tool="transcriber"]');
    if (likeBtn && liked) {
        likeBtn.classList.add('liked');
        likeBtn.querySelector('i').classList.remove('far');
        likeBtn.querySelector('i').classList.add('fas');
    }

    // Listen for comments
    db.ref('tools/transcriber/comments').on('value', (snapshot) => {
        const comments = snapshot.val() || [];
        const commentList = document.getElementById('transcriber-comment-list');
        const commentCount = document.getElementById('transcriber-comment-count');

        if (commentList) {
            commentList.innerHTML = ''; // Clear existing
            Object.values(comments).forEach(c => {
                const div = document.createElement('div');
                div.className = 'comment-item';
                div.textContent = c.text;
                commentList.appendChild(div);
            });
        }
        if (commentCount) {
            commentCount.textContent = Object.keys(comments).length;
        }
    });
}

// Fallback localStorage loader
function loadLocalData() {
    const likes = localStorage.getItem('transcriber_likes') || '0';
    const liked = localStorage.getItem('transcriber_liked') === 'true';
    const likeBtn = document.querySelector('.like-btn[data-tool="transcriber"]');
    if (likeBtn) {
        likeBtn.querySelector('.like-count').textContent = likes;
        if (liked) {
            likeBtn.classList.add('liked');
            likeBtn.querySelector('i').classList.remove('far');
            likeBtn.querySelector('i').classList.add('fas');
        }
    }

    const comments = JSON.parse(localStorage.getItem('transcriber_comments') || '[]');
    const commentList = document.getElementById('transcriber-comment-list');
    const commentCount = document.getElementById('transcriber-comment-count');
    if (commentList && comments.length > 0) {
        comments.forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.textContent = c;
            commentList.appendChild(div);
        });
    }
    if (commentCount) commentCount.textContent = comments.length;
}

// Toggle like (works with Firebase or localStorage)
function toggleLike(btn) {
    const tool = btn.dataset.tool;
    const countSpan = btn.querySelector('.like-count');
    let count = parseInt(countSpan.textContent);
    const isLiked = btn.classList.contains('liked');

    if (isLiked) {
        count--;
        btn.classList.remove('liked');
        btn.querySelector('i').classList.remove('fas');
        btn.querySelector('i').classList.add('far');
        localStorage.setItem(tool + '_liked', 'false');
    } else {
        count++;
        btn.classList.add('liked');
        btn.querySelector('i').classList.remove('far');
        btn.querySelector('i').classList.add('fas');
        localStorage.setItem(tool + '_liked', 'true');
    }

    countSpan.textContent = count;

    // Save to Firebase if available
    if (db) {
        db.ref('tools/' + tool + '/likes').set(count);
    } else {
        localStorage.setItem(tool + '_likes', count.toString());
    }
}

// Toggle comment section visibility
function toggleComments(tool) {
    const section = document.getElementById(tool + '-comments');
    if (section) {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
}

// Submit a new comment (works with Firebase or localStorage)
function submitComment(tool) {
    const input = document.getElementById(tool + '-comment-input');
    const list = document.getElementById(tool + '-comment-list');
    const countSpan = document.getElementById(tool + '-comment-count');

    if (!input || !input.value.trim()) return;

    const text = input.value.trim();

    // Add to DOM immediately
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.textContent = text;
    list.appendChild(div);

    // Update count
    const currentCount = parseInt(countSpan.textContent);
    countSpan.textContent = currentCount + 1;

    // Save to Firebase if available
    if (db) {
        db.ref('tools/' + tool + '/comments').push({ text: text, timestamp: Date.now() });
    } else {
        const comments = JSON.parse(localStorage.getItem(tool + '_comments') || '[]');
        comments.push(text);
        localStorage.setItem(tool + '_comments', JSON.stringify(comments));
    }

    // Clear input
    input.value = '';
}

// Load data when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadToolData);
} else {
    // Load reviews
    loadReviews('transcriber');
}

// --- REVIEW SYSTEM ---
// --- REVIEW & LIKE SYSTEM ---
let isLiked = false;

function initReviewSystem() {
    // Like Toggle Logic
    const likeToggle = document.getElementById('like-toggle');
    if (likeToggle) {
        likeToggle.addEventListener('click', () => {
            isLiked = !isLiked;
            updateLikeVisuals(isLiked);
        });
    }

    // Fix button persistent active state
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.blur(); // Remove focus after click
        });
    });
}

function updateLikeVisuals(liked) {
    const likeToggle = document.getElementById('like-toggle');
    if (!likeToggle) return;

    if (liked) {
        likeToggle.className = 'fas fa-heart';
        likeToggle.style.color = '#fff'; // White
    } else {
        likeToggle.className = 'far fa-heart';
        likeToggle.style.color = 'inherit';
    }
}

function submitReview(toolId) {
    const nameInput = document.getElementById('review-name');
    const textInput = document.getElementById('review-text');

    // Name and text are required, but Like is optional (can be false)
    if (!nameInput.value.trim() || !textInput.value.trim()) {
        alert('Please provide your name and a review text.');
        return;
    }

    const review = {
        name: nameInput.value.trim(),
        text: textInput.value.trim(),
        liked: isLiked, // Save the like status
        timestamp: Date.now()
    };

    if (db) {
        db.ref('tools/' + toolId + '/reviews').push(review);
    } else {
        // LocalStorage fallback for demo
        const reviews = JSON.parse(localStorage.getItem(toolId + '_reviews') || '[]');
        reviews.push(review);
        localStorage.setItem(toolId + '_reviews', JSON.stringify(reviews));
        loadReviews(toolId); // Manual reload for local
    }

    // If user Liked it, also increment global likes if separating logic, 
    // BUT here we will count likes dynamically from the reviews + simple likes.
    // For simplicity in this "App Store" model, "Likes" count = Count of reviews where liked=true.

    // Reset Form
    nameInput.value = '';
    textInput.value = '';
    isLiked = false;
    updateLikeVisuals(false);
    alert('Thanks for your review!');
}

function loadReviews(toolId) {
    const renderReviews = (reviewsObj) => {
        const list = document.getElementById('reviews-list');
        // if (!list) return; // Don't return early, we might need to update Shop stats even if list isn't visible

        const reviews = reviewsObj ? Object.values(reviewsObj) : [];

        // Calculate Stats
        const totalReviews = reviews.length;
        const totalLikes = reviews.filter(r => r.liked).length;

        // --- UPDATE TOOL PAGE HEADER ---
        const ratingCountEl = document.querySelector('.rating-count');
        if (ratingCountEl) {
            ratingCountEl.innerHTML = `<i class="far fa-heart"></i> ${totalLikes} &nbsp; <i class="far fa-comment"></i> ${totalReviews}`;
        }

        // --- UPDATE SHOP FEED CARD (SYNC) --- 
        const shopLikeCount = document.getElementById('shop-' + toolId + '-likes');
        const shopCommentCount = document.getElementById('shop-' + toolId + '-comments');

        if (shopLikeCount) shopLikeCount.textContent = totalLikes;
        if (shopCommentCount) shopCommentCount.textContent = totalReviews;

        // Render List (Only if on tool page)
        if (list) {
            if (totalReviews === 0) {
                list.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No reviews yet. Be the first!</p>';
                return;
            }

            list.innerHTML = '';
            // Sort by newest first
            reviews.sort((a, b) => b.timestamp - a.timestamp).forEach(review => {
                const item = document.createElement('div');
                item.className = 'review-item';
                // Show Heart if they liked it
                const icon = review.liked ? '❤️' : '💬';
                item.innerHTML = `
                    <div class="review-header">
                        <span class="reviewer">${escapeHtml(review.name)}</span>
                        <span class="review-stars" style="font-size: 1rem;">${icon}</span>
                    </div>
                    <p>"${escapeHtml(review.text)}"</p>
                    <small style="color: var(--text-muted); font-size: 0.7rem;">${new Date(review.timestamp).toLocaleDateString()}</small>
                `;
                list.appendChild(item);
            });
        }
    };

    if (db) {
        db.ref('tools/' + toolId + '/reviews').on('value', snapshot => {
            renderReviews(snapshot.val());
        });
    } else {
        const reviews = JSON.parse(localStorage.getItem(toolId + '_reviews') || '[]');
        renderReviews(reviews);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load data when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadToolData();
        initReviewSystem();

        // GLOBAL: Remove focus from ANY button after click to prevent persistent active state
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (btn) {
                // Warning: we need a slight delay for some actions, 
                // but usually immediate blur is fine for UI reset.
                setTimeout(() => btn.blur(), 100);
            }
        });
    });
} else {
    loadToolData();
    initReviewSystem();
}

