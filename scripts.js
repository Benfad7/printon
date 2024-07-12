const canvas = document.getElementById('canvas');
const imgContainer = document.getElementById('image-container');
const img = document.getElementById('image');
const resizeHandle = document.getElementById('resize-handle');
const deleteHandle = document.createElement('div');
deleteHandle.classList.add('delete-handle');
imgContainer.appendChild(deleteHandle);

const fileInput = document.getElementById('upload');
let isDragging = false;
let isResizing = false;
let startX, startY, startLeft, startTop, startWidth, startHeight;
let aspectRatio;

fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      img.src = e.target.result;
      imgContainer.style.display = 'block';

      img.onload = function() {
        aspectRatio = img.naturalWidth / img.naturalHeight;
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
      }
    }
    reader.readAsDataURL(file);
  }
});

img.addEventListener('dragstart', function(event) {
  event.preventDefault();
});
imgContainer.addEventListener('click', function(event) {
  if (event.target === img) {
    imgContainer.classList.add('selected');
    resizeHandle.style.display = 'block';
    deleteHandle.style.display = 'block';
  }
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

document.addEventListener('click', function(event) {
  if (!imgContainer.contains(event.target)) {
    imgContainer.classList.remove('selected');
       resizeHandle.style.display = 'none';
        deleteHandle.style.display = 'none';
  }
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
  imgContainer.style.display = 'none';
  img.src = '';
  fileInput.value = '';
});