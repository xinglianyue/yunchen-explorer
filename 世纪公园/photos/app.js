class PhotoUploader {
    constructor() {
        this.photos = [];
        this.selectedFiles = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPhotos();
        this.renderGallery();
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const weekSelect = document.getElementById('weekSelect');
        const photoDesc = document.getElementById('photoDesc');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        weekSelect.addEventListener('change', () => this.loadPhotos());
        photoDesc.addEventListener('input', () => this.updateDescPreview());

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                this.removePreviewItem(e.target.dataset.index);
            } else if (e.target.classList.contains('gallery-item')) {
                this.openModal(e.target.dataset.photoId);
            } else if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.addFiles(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        const files = Array.from(event.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        this.addFiles(files);
    }

    addFiles(files) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoItem = {
                    id: Date.now() + Math.random(),
                    file: file,
                    url: e.target.result,
                    week: document.getElementById('weekSelect').value,
                    desc: document.getElementById('photoDesc').value || '未命名照片'
                };
                this.selectedFiles.push(photoItem);
                this.renderPreview();
            };
            reader.readAsDataURL(file);
        });
    }

    renderPreview() {
        const previewGrid = document.getElementById('previewGrid');
        
        if (this.selectedFiles.length === 0) {
            previewGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🖼️</div>
                    <p>还没有选择照片</p>
                </div>
            `;
            return;
        }

        previewGrid.innerHTML = this.selectedFiles.map((item, index) => `
            <div class="preview-item">
                <img src="${item.url}" alt="预览照片">
                <button class="delete-btn" data-index="${index}">×</button>
            </div>
        `).join('');

        if (!document.querySelector('.upload-btn-container')) {
            const uploadBtnContainer = document.createElement('div');
            uploadBtnContainer.className = 'upload-btn-container';
            uploadBtnContainer.innerHTML = `
                <button class="upload-btn" onclick="photoUploader.savePhotos()">保存照片</button>
            `;
            document.querySelector('.preview-section').appendChild(uploadBtnContainer);
        }
    }

    removePreviewItem(index) {
        this.selectedFiles.splice(index, 1);
        this.renderPreview();
    }

    updateDescPreview() {
        const desc = document.getElementById('photoDesc').value;
        if (this.selectedFiles.length > 0) {
            this.selectedFiles[this.selectedFiles.length - 1].desc = desc || '未命名照片';
        }
    }

    savePhotos() {
        if (this.selectedFiles.length === 0) {
            this.showToast('请先选择照片');
            return;
        }

        this.selectedFiles.forEach(item => {
            const photoData = {
                id: item.id,
                week: item.week,
                desc: item.desc,
                url: item.url,
                timestamp: new Date().toISOString()
            };
            this.photos.push(photoData);
        });

        this.saveToLocalStorage();
        this.selectedFiles = [];
        this.renderPreview();
        this.renderGallery();
        document.getElementById('photoDesc').value = '';
        this.showToast(`成功保存 ${this.selectedFiles.length > 0 ? this.selectedFiles.length : this.photos.length} 张照片！`);
    }

    saveToLocalStorage() {
        localStorage.setItem('parkPhotos', JSON.stringify(this.photos));
    }

    loadPhotos() {
        const stored = localStorage.getItem('parkPhotos');
        if (stored) {
            this.photos = JSON.parse(stored);
        }
    }

    renderGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        const selectedWeek = document.getElementById('weekSelect').value;
        
        const filteredPhotos = selectedWeek === 'all' 
            ? this.photos 
            : this.photos.filter(p => p.week === selectedWeek);

        if (filteredPhotos.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📷</div>
                    <p>这个周次还没有照片，快去上传吧！</p>
                </div>
            `;
            return;
        }

        const weekNames = {
            week1: '第1周',
            week2: '第2周',
            week3: '第3周',
            week4: '第4周',
            week5: '第5周',
            week6: '第6周',
            week7: '第7周',
            week8: '第8周'
        };

        galleryGrid.innerHTML = filteredPhotos.map(photo => `
            <div class="gallery-item" data-photo-id="${photo.id}">
                <img src="${photo.url}" alt="${photo.desc}">
                <div class="photo-info-overlay">
                    <div class="photo-week">${weekNames[photo.week] || photo.week}</div>
                    <div class="photo-desc">${photo.desc}</div>
                </div>
            </div>
        `).join('');
    }

    openModal(photoId) {
        const photo = this.photos.find(p => p.id == photoId);
        if (!photo) return;

        let modal = document.getElementById('photoModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'photoModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <img src="" alt="">
                </div>
                <button class="modal-close">×</button>
            `;
            document.body.appendChild(modal);
        }

        modal.querySelector('img').src = photo.url;
        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('photoModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 15px 30px;
                border-radius: 8px;
                z-index: 2000;
                font-size: 1rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }

    getWeekPhotos(week) {
        return this.photos.filter(p => p.week === week);
    }

    getTotalPhotos() {
        return this.photos.length;
    }
}

const photoUploader = new PhotoUploader();