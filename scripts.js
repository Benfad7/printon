const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('upload');

let uploadedFiles = new Set();

fileInput.addEventListener('change', function(event) {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file && !uploadedFiles.has(file.name)) {
      uploadedFiles.add(file.name);
      const reader = new FileReader();
      reader.onload = function(e) {
        createImageContainer(e.target.result, file.name);
      }
      reader.readAsDataURL(file);
    }
  }
  fileInput.value = '';
});

function createImageContainer(src, fileName) {
  const imgContainer = document.createElement('div');
  imgContainer.classList.add('image-container');

  const img = document.createElement('img');
  img.src = src;

  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');

  const deleteHandle = document.createElement('div');
  deleteHandle.classList.add('delete-handle');

  imgContainer.appendChild(img);
  imgContainer.appendChild(resizeHandle);
  imgContainer.appendChild(deleteHandle);

  // Set initial position and size before adding to canvas
  imgContainer.style.position = 'absolute';
  imgContainer.style.visibility = 'hidden';
  canvas.appendChild(imgContainer);

  img.onload = function() {
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const startSize = 200; // Initial size in pixels

    if (aspectRatio > 1) {
      img.style.width = startSize + 'px';
      img.style.height = (startSize / aspectRatio) + 'px';
    } else {
      img.style.height = startSize + 'px';
      img.style.width = (startSize * aspectRatio) + 'px';
    }

    const containerRect = canvas.getBoundingClientRect();
    const imgRect = imgContainer.getBoundingClientRect();

    imgContainer.style.left = (containerRect.width / 2 - imgRect.width / 2) + 'px';
    imgContainer.style.top = (containerRect.height / 2 - imgRect.height / 2) + 'px';

    // Make the container visible after positioning
    imgContainer.style.visibility = 'visible';

    setupImageInteractions(imgContainer, img, resizeHandle, deleteHandle, fileName);
  }
}

function setupImageInteractions(imgContainer, img, resizeHandle, deleteHandle, fileName) {
  let isDragging = false;
  let isResizing = false;
  let startX, startY, startLeft, startTop, startWidth, startHeight;
  let aspectRatio = img.naturalWidth / img.naturalHeight;

  img.addEventListener('dragstart', function(event) {
    event.preventDefault();
  });

  imgContainer.addEventListener('mousedown', function(event) {
    if (event.target === img && !isResizing) {
      isDragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = imgContainer.offsetLeft;
      startTop = imgContainer.offsetTop;
      img.style.cursor = 'grabbing';
      imgContainer.classList.add('selected');
      resizeHandle.style.display = 'block';
      deleteHandle.style.display = 'block';
    }
    event.preventDefault();
  });

  document.addEventListener('mousemove', function(event) {
    if (isDragging && !isResizing) {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const newLeft = startLeft + dx;
      const newTop = startTop + dy;

      const maxX = canvas.clientWidth - imgContainer.offsetWidth;
      const maxY = canvas.clientHeight - imgContainer.offsetHeight;

      imgContainer.style.left = Math.max(0, Math.min(newLeft, maxX)) + 'px';
      imgContainer.style.top = Math.max(0, Math.min(newTop, maxY)) + 'px';
    } else if (isResizing && !isDragging) {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      let newWidth = startWidth + dx;
      let newHeight = startHeight + dy;

      if (newWidth / newHeight > aspectRatio) {
        newWidth = newHeight * aspectRatio;
      } else {
        newHeight = newWidth / aspectRatio;
      }

      const maxWidth = canvas.clientWidth - imgContainer.offsetLeft;
      const maxHeight = canvas.clientHeight - imgContainer.offsetTop;

      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / aspectRatio;
      }
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
      }

      if (newWidth < 50) {
        newWidth = 50;
        newHeight = newWidth / aspectRatio;
      }
      if (newHeight < 50) {
        newHeight = 50;
        newWidth = newHeight * aspectRatio;
      }

      img.style.width = newWidth + 'px';
      img.style.height = newHeight + 'px';
    }
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
    isResizing = false;
    img.style.cursor = 'grab';
  });

  resizeHandle.addEventListener('mousedown', function(event) {
    isResizing = true;
    isDragging = false;
    startX = event.clientX;
    startY = event.clientY;
    startWidth = img.offsetWidth;
    startHeight = img.offsetHeight;
    event.stopPropagation();
    event.preventDefault();
  });

  deleteHandle.addEventListener('click', function(event) {
    canvas.removeChild(imgContainer);
    uploadedFiles.delete(fileName);
  });

  document.addEventListener('click', function(event) {
    if (!imgContainer.contains(event.target)) {
      imgContainer.classList.remove('selected');
      resizeHandle.style.display = 'none';
      deleteHandle.style.display = 'none';
    }
  });
}