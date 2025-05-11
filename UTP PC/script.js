// Status aplikasi
let originalImage = null;
let processedImage = null;
let isOpenCvReady = false;
let isLoading = false;

// Elemen UI
const statusMessage = document.createElement('div');
statusMessage.className = 'status-message';
document.querySelector('.controls').prepend(statusMessage);

// Fungsi utama
function onOpenCvReady() {
    try {
        if (!window.cv) {
            showError('OpenCV gagal dimuat. Silakan refresh halaman.');
            return;
        }

        console.log('OpenCV.js siap, versi:', cv.version);
        isOpenCvReady = true;
        enableUI(true);
        showSuccess('Aplikasi siap digunakan. Silakan upload gambar.');

        // Setup event listeners
        setupEventListeners();
        
        // Load gambar contoh (opsional)
        // loadSampleImage();
    } catch (error) {
        showError('Error inisialisasi: ' + error.message);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Update value displays
    document.getElementById('brightness').addEventListener('input', function() {
        document.getElementById('brightnessValue').textContent = this.value;
    });
    
    document.getElementById('contrast').addEventListener('input', function() {
        document.getElementById('contrastValue').textContent = this.value;
    });
    
    document.getElementById('medianBlur').addEventListener('input', function() {
        document.getElementById('medianBlurValue').textContent = this.value;
    });
    
    document.getElementById('cannyThreshold1').addEventListener('input', function() {
        document.getElementById('cannyThreshold1Value').textContent = this.value;
    });
    
    document.getElementById('cannyThreshold2').addEventListener('input', function() {
        document.getElementById('cannyThreshold2Value').textContent = this.value;
    });
    
    // Button events
    document.getElementById('grayscaleBtn').addEventListener('click', applyGrayscale);
    document.getElementById('resetBtn').addEventListener('click', resetImage);
    document.getElementById('applyBrightnessContrast').addEventListener('click', applyBrightnessContrast);
    document.getElementById('applyMedianBtn').addEventListener('click', applyMedianBlur);
    document.getElementById('applyCannyBtn').addEventListener('click', applyCannyEdge);
    
    // File upload
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
}

// Fungsi untuk menangani upload gambar
function handleImageUpload(e) {
    try {
        const file = e.target.files[0];
        if (!file) {
            showError('Tidak ada file yang dipilih');
            return;
        }

        if (!file.type.match('image.*')) {
            showError('File harus berupa gambar');
            return;
        }

        showStatus('Memuat gambar...');
        isLoading = true;
        enableUI(false);

        const reader = new FileReader();
        
        reader.onerror = function(error) {
            showError('Gagal membaca file: ' + error);
            isLoading = false;
            enableUI(true);
        };

        reader.onload = function(event) {
            const img = new Image();
            
            img.onerror = function() {
                showError('Gagal memuat gambar');
                isLoading = false;
                enableUI(true);
            };
            
            img.onload = function() {
                try {
                    console.log('Gambar dimuat:', img.width + 'x' + img.height);
                    originalImage = img;
                    displayImage(originalImage, 'originalCanvas');
                    resetProcessedImage();
                    showSuccess('Gambar berhasil dimuat');
                    isLoading = false;
                    enableUI(true);
                } catch (error) {
                    showError('Error memproses gambar: ' + error.message);
                    isLoading = false;
                    enableUI(true);
                }
            };
            
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    } catch (error) {
        showError('Error saat upload: ' + error.message);
        isLoading = false;
        enableUI(true);
    }
}

// Fungsi untuk menampilkan gambar ke canvas
function displayImage(img, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        throw new Error('Canvas tidak ditemukan: ' + canvasId);
    }
    
    // Set canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Update dimensions display
    const dimensionsElement = canvasId === 'originalCanvas' 
        ? document.getElementById('originalDimensions') 
        : document.getElementById('processedDimensions');
    dimensionsElement.textContent = `${img.width} × ${img.height} px`;
    
    // Draw image
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.width, img.height);
}

// Fungsi reset gambar hasil
function resetProcessedImage() {
    if (!originalImage) return;
    
    const img = new Image();
    img.onload = function() {
        processedImage = img;
        displayImage(processedImage, 'processedCanvas');
    };
    img.src = originalImage.src;
}

// Fungsi reset ke gambar asli
function resetImage() {
    if (isLoading) return;
    resetProcessedImage();
    showStatus('Gambar direset ke versi asli');
}

// Fungsi grayscale
function applyGrayscale() {
    if (!originalImage || !isOpenCvReady || isLoading) return;
    
    try {
        showStatus('Memproses grayscale...');
        isLoading = true;
        enableUI(false);
        
        const src = cv.imread('originalCanvas');
        const dst = new cv.Mat();
        
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        cv.imshow('processedCanvas', dst);
        
        // Update dimensions
        document.getElementById('processedDimensions').textContent = 
            `${dst.cols} × ${dst.rows} px (Grayscale)`;
        
        src.delete();
        dst.delete();
        
        showSuccess('Grayscale berhasil diterapkan');
        isLoading = false;
        enableUI(true);
    } catch (error) {
        showError('Error grayscale: ' + error.message);
        isLoading = false;
        enableUI(true);
    }
}

// Fungsi brightness/contrast
function applyBrightnessContrast() {
    if (!originalImage || !isOpenCvReady || isLoading) return;
    
    try {
        showStatus('Memproses brightness/contrast...');
        isLoading = true;
        enableUI(false);
        
        const brightness = parseInt(document.getElementById('brightness').value);
        const contrast = parseInt(document.getElementById('contrast').value);
        
        const src = cv.imread('originalCanvas');
        const dst = new cv.Mat();
        
        const alpha = (contrast + 100) / 100;
        const beta = brightness;
        
        src.convertTo(dst, -1, alpha, beta);
        cv.imshow('processedCanvas', dst);
        
        // Update dimensions
        document.getElementById('processedDimensions').textContent = 
            `${dst.cols} × ${dst.rows} px (Brightness: ${brightness}, Contrast: ${contrast})`;
        
        src.delete();
        dst.delete();
        
        showSuccess('Brightness/contrast berhasil diterapkan');
        isLoading = false;
        enableUI(true);
    } catch (error) {
        showError('Error brightness/contrast: ' + error.message);
        isLoading = false;
        enableUI(true);
    }
}

// Fungsi filter median
function applyMedianBlur() {
    if (!originalImage || !isOpenCvReady || isLoading) return;
    
    try {
        showStatus('Memproses filter median...');
        isLoading = true;
        enableUI(false);
        
        const ksize = parseInt(document.getElementById('medianBlur').value);
        
        const src = cv.imread('originalCanvas');
        const dst = new cv.Mat();
        
        cv.medianBlur(src, dst, ksize);
        cv.imshow('processedCanvas', dst);
        
        // Update dimensions
        document.getElementById('processedDimensions').textContent = 
            `${dst.cols} × ${dst.rows} px (Median blur: ${ksize}×${ksize})`;
        
        src.delete();
        dst.delete();
        
        showSuccess('Filter median berhasil diterapkan');
        isLoading = false;
        enableUI(true);
    } catch (error) {
        showError('Error filter median: ' + error.message);
        isLoading = false;
        enableUI(true);
    }
}

// Fungsi deteksi tepi Canny
function applyCannyEdge() {
    if (!originalImage || !isOpenCvReady || isLoading) return;
    
    try {
        showStatus('Memproses deteksi tepi Canny...');
        isLoading = true;
        enableUI(false);
        
        const threshold1 = parseInt(document.getElementById('cannyThreshold1').value);
        const threshold2 = parseInt(document.getElementById('cannyThreshold2').value);
        
        const src = cv.imread('originalCanvas');
        const dst = new cv.Mat();
        const gray = new cv.Mat();
        const edges = new cv.Mat();
        
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.Canny(gray, edges, threshold1, threshold2);
        cv.cvtColor(edges, dst, cv.COLOR_GRAY2RGBA);
        cv.imshow('processedCanvas', dst);
        
        // Update dimensions
        document.getElementById('processedDimensions').textContent = 
            `${dst.cols} × ${dst.rows} px (Canny edge: ${threshold1}/${threshold2})`;
        
        src.delete();
        dst.delete();
        gray.delete();
        edges.delete();
        
        showSuccess('Deteksi tepi Canny berhasil diterapkan');
        isLoading = false;
        enableUI(true);
    } catch (error) {
        showError('Error deteksi tepi: ' + error.message);
        isLoading = false;
        enableUI(true);
    }
}

// Fungsi untuk enable/disable UI
function enableUI(enable) {
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input');
    
    buttons.forEach(btn => {
        btn.disabled = !enable || !originalImage;
    });
    
    inputs.forEach(input => {
        input.disabled = !enable;
    });
    
    // Khusus reset button selalu enabled jika ada gambar
    if (originalImage) {
        document.getElementById('resetBtn').disabled = false;
    }
}

// Fungsi untuk menampilkan pesan status
function showStatus(message) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    statusMessage.style.display = 'block';
}

function showSuccess(message) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message success';
    statusMessage.style.display = 'block';
    
    // Sembunyikan setelah 3 detik
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

function showError(message) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message error';
    statusMessage.style.display = 'block';
    
    // Tetap tampilkan error sampai user menutupnya
}

// Fallback jika OpenCV tidak terload
setTimeout(() => {
    if (!isOpenCvReady) {
        showError('OpenCV.js membutuhkan waktu lama untuk dimuat. Silakan refresh halaman atau cek koneksi internet.');
    }
}, 10000);

// Inisialisasi saat OpenCV siap
if (window.cv) {
    onOpenCvReady();
} else {
    window.onOpenCvReady = onOpenCvReady;
}

// Fungsi untuk load gambar contoh (opsional)
function loadSampleImage() {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
        originalImage = img;
        displayImage(originalImage, 'originalCanvas');
        resetProcessedImage();
        showSuccess('Gambar contoh berhasil dimuat');
        enableUI(true);
    };
    img.onerror = function() {
        showError('Gagal memuat gambar contoh');
    };
    img.src = 'https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png';
}