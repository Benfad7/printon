const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('upload');
const contextMenu = document.getElementById('context-menu');
const moveForward = document.getElementById('move-forward');
const moveBackward = document.getElementById('move-backward');
const centerImage = document.getElementById('center-image');
const cutImage = document.getElementById('cut-image');
const uploadBox = document.getElementById('upload-box');
const uploadBlackStrip = document.querySelector('.black-strip-upload');
const blackStripAddText = document.querySelector('.black-strip-add-text');
const screen1 = document.getElementById('screen1');
const screen2 = document.getElementById('screen2');
const screen3 = document.getElementById('screen3');
const screen4 = document.getElementById('screen4');
const blackStripOptions = document.querySelectorAll('.black-strip-option');
const closeButtons = document.querySelectorAll('.close-button');
const backgroundRemovalToggle = document.querySelector('.on-off-button input');

let selectedImageContainer = null;
let isBackgroundRemoved = false;

fileInput.addEventListener('change', handleFileSelection);

function handleFileSelection(event) {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        createImageContainer(e.target.result, file.name);
      }
      reader.readAsDataURL(file);
    }
  }
  event.target.value = ''; // Reset the file input
}

function createImageContainer(src, fileName) {
  const imgContainer = document.createElement('div');
  imgContainer.classList.add('image-container');
  imgContainer.setAttribute('data-background-removed', 'false');  imgContainer.classList.add('image-container');

  const img = document.createElement('img');
  img.src = src;
  img.setAttribute('data-original-src', src);  // Store the original source

  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');

  const deleteHandle = document.createElement('div');
  deleteHandle.classList.add('delete-handle');

  imgContainer.appendChild(img);
  imgContainer.appendChild(resizeHandle);
  imgContainer.appendChild(deleteHandle);

  imgContainer.style.position = 'absolute';
  imgContainer.style.visibility = 'hidden';
  canvas.appendChild(imgContainer);

  img.onload = function() {
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const startSize = 200;

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
  });

  document.addEventListener('click', function(event) {
    if (!imgContainer.contains(event.target) && !event.target.closest('.white-square')) {
      imgContainer.classList.remove('selected');
      resizeHandle.style.display = 'none';
      deleteHandle.style.display = 'none';
    }
  });

  imgContainer.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    selectedImageContainer = imgContainer;
    contextMenu.style.display = 'block';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
  });

imgContainer.addEventListener('click', function() {
    const imgWidth = img.offsetWidth;
    const imgHeight = img.offsetHeight;

    const sizeDisplay = document.getElementById('image-size');
    sizeDisplay.textContent = `${imgWidth}px x ${imgHeight}px`;

    showScreen(screen4);
    selectedImageContainer = imgContainer;

    // Set background removal toggle based on stored state
    const isBackgroundRemoved = imgContainer.getAttribute('data-background-removed') === 'true';
    backgroundRemovalToggle.checked = isBackgroundRemoved;
});}

document.addEventListener('click', function(event) {
  if (contextMenu.style.display === 'block') {
    contextMenu.style.display = 'none';
  }
});

moveForward.addEventListener('click', function() {
  if (selectedImageContainer) {
    canvas.appendChild(selectedImageContainer);
    contextMenu.style.display = 'none';
  }
});

moveBackward.addEventListener('click', function() {
  if (selectedImageContainer) {
    canvas.insertBefore(selectedImageContainer, canvas.firstChild.nextSibling);
    contextMenu.style.display = 'none';
  }
});

centerImage.addEventListener('click', function() {
  if (selectedImageContainer) {
    const containerRect = canvas.getBoundingClientRect();
    const imgRect = selectedImageContainer.getBoundingClientRect();
    selectedImageContainer.style.left = (containerRect.width / 2 - imgRect.width / 2) + 'px';
    contextMenu.style.display = 'none';
  }
});

cutImage.addEventListener('click', function() {
  if (selectedImageContainer) {
    const img = selectedImageContainer.querySelector('img');
    const imgWidth = img.offsetWidth;
    const imgHeight = img.offsetHeight;
    const cutRatio = 0.2; // Example: Cut 20% of each side

    // Calculate new dimensions
    const newWidth = imgWidth * (1 - 2 * cutRatio);
    const newHeight = imgHeight * (1 - 2 * cutRatio);

    // Calculate new position
    const containerRect = canvas.getBoundingClientRect();
    const imgRect = selectedImageContainer.getBoundingClientRect();
    const newLeft = imgRect.left + imgWidth * cutRatio;
    const newTop = imgRect.top + imgHeight * cutRatio;

    // Apply new size and position
    img.style.width = newWidth + 'px';
    img.style.height = newHeight + 'px';
    selectedImageContainer.style.left = newLeft + 'px';
    selectedImageContainer.style.top = newTop + 'px';

    contextMenu.style.display = 'none';
  }
});

function showScreen(screenToShow) {
  [screen1, screen2, screen3, screen4].forEach(screen => screen.classList.remove('active'));
  screenToShow.classList.add('active');
}

function setClickedOption(clickedOption) {
  blackStripOptions.forEach(option => option.classList.remove('clicked'));
  clickedOption.classList.add('clicked');
}

uploadBlackStrip.addEventListener('click', function(event) {
  event.preventDefault();
  showScreen(screen2);
  setClickedOption(this);
});

blackStripAddText.addEventListener('click', function() {
  showScreen(screen3);
  setClickedOption(this);
});

// Close button functionality
closeButtons.forEach(button => {
  button.addEventListener('click', function() {
    showScreen(screen1);
    blackStripOptions.forEach(option => option.classList.remove('clicked'));
  });
});

// Upload box click handler
uploadBox.addEventListener('click', function() {
  fileInput.click();
});

const mainContainer = document.getElementById('main-container');

mainContainer.addEventListener('click', function(event) {
  // Check if we're in screen2 or screen3
  if (screen2.classList.contains('active') || screen3.classList.contains('active') || screen4.classList.contains('active')) {
    // Check if the click is outside the white square
    if (!event.target.closest('.white-square') && !event.target.closest('.image-container')) {
      showScreen(screen1);
      blackStripOptions.forEach(option => option.classList.remove('clicked'));
    }
  }
});

// Background removal functionality
function removeBackground(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    ctx.drawImage(imgElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // This is a simple background removal. In a real scenario, you'd use a more sophisticated AI service.
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // If the pixel is light (close to white), make it transparent
        if (r > 200 && g > 200 && b > 200) {
            data[i + 3] = 0; // Set alpha to 0
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

backgroundRemovalToggle.addEventListener('change', function() {
    if (selectedImageContainer) {
        const img = selectedImageContainer.querySelector('img');
        const isBackgroundRemoved = selectedImageContainer.getAttribute('data-background-removed') === 'true';

        // Save the current position and dimensions
        const savedLeft = selectedImageContainer.style.left;
        const savedTop = selectedImageContainer.style.top;
        const savedWidth = img.style.width;
        const savedHeight = img.style.height;

        // Temporarily remove the onload event handler
        const originalOnload = img.onload;
        img.onload = null;

        if (this.checked) {
            if (!isBackgroundRemoved) {
                const newSrc = removeBackground(img);
                img.src = newSrc;
                selectedImageContainer.setAttribute('data-background-removed', 'true');
            }
        } else {
            if (isBackgroundRemoved) {
                img.src = img.getAttribute('data-original-src');
                selectedImageContainer.setAttribute('data-background-removed', 'false');
            }
        }

        // Apply saved styles after the image has been updated
        setTimeout(() => {
            selectedImageContainer.style.left = savedLeft;
            selectedImageContainer.style.top = savedTop;
            img.style.width = savedWidth;
            img.style.height = savedHeight;

            // Restore the onload event handler
            img.onload = originalOnload;
        }, 50);
    }
});

// Add this after your existing event listeners
document.getElementById('center-image-button').addEventListener('click', function() {
  if (selectedImageContainer) {
    const containerRect = canvas.getBoundingClientRect();
    const imgRect = selectedImageContainer.getBoundingClientRect();
    selectedImageContainer.style.left = (containerRect.width / 2 - imgRect.width / 2) + 'px';
    selectedImageContainer.style.top = (containerRect.height / 2 - imgRect.height / 2) + 'px';
    contextMenu.style.display = 'none';
  }
});
