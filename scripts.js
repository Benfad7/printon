const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('upload');

let imageCount = 0;

fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      addNewImage(e.target.result);
    }
    reader.readAsDataURL(file);
  }
});

function addNewImage(src) {
  imageCount++;
  const imgContainer = document.createElement('div');
  imgContainer.classList.add('image-container');
  imgContainer.id = `image-container-${imageCount}`;

  const img = document.createElement('img');
  img.src = src;
  img.id = `image-${imageCount}`;

  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');

  const deleteHandle = document.createElement('div');
  deleteHandle.classList.add('delete-handle');

  imgContainer.appendChild(img);
  imgContainer.appendChild(resizeHandle);
  imgContainer.appendChild(deleteHandle);
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

    imgContainer.style.left = (Math.random() * (containerRect.width - imgRect.width)) + 'px';
    imgContainer.style.top = (Math.random() * (containerRect.height - imgRect.height)) + 'px';
    imgContainer.style.display = 'block';

    setupImageHandlers(imgContainer, img, resizeHandle, deleteHandle);
  }
}

function setupImageHandlers(imgContainer, img, resizeHandle, deleteHandle) {
  let isDragging = false;
  let isResizing = false;
  let startX, startY, startLeft, startTop, startWidth, startHeight;
  let aspectRatio = img.naturalWidth / img.naturalHeight;

  img.addEventListener('dragstart', function(event) {
    event.preventDefault();
  });

  imgContainer.addEventListener('click', function(event) {
    if (event.target === img) {
      selectImage(imgContainer);
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
      selectImage(imgContainer);
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
  });
}

function selectImage(selectedContainer) {
  document.querySelectorAll('.image-container').forEach(container => {
    container.classList.remove('selected');
    container.querySelector('.resize-handle').style.display = 'none';
    container.querySelector('.delete-handle').style.display = 'none';
  });

  selectedContainer.classList.add('selected');
  selectedContainer.querySelector('.resize-handle').style.display = 'block';
  selectedContainer.querySelector('.delete-handle').style.display = 'block';
}

document.addEventListener('click', function(event) {
  if (!event.target.closest('.image-container')) {
    document.querySelectorAll('.image-container').forEach(container => {
      container.classList.remove('selected');
      container.querySelector('.resize-handle').style.display = 'none';
      container.querySelector('.delete-handle').style.display = 'none';
    });
  }
});