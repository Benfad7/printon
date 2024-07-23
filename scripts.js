const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('upload');
const contextMenu = document.getElementById('context-menu');
const contextMoveForward = document.getElementById('context-move-forward');
const contextMoveBackward = document.getElementById('context-move-backward');
const layerMoveForward = document.getElementById('move-forward');
const layerMoveBackward = document.getElementById('move-backward');
let undoStack = [];
let redoStack = [];
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
const copyImage = document.getElementById('copy-image');
const pasteImage = document.getElementById('paste-image');
let copiedImageData = null;
let selectedImageContainer = null;
let isBackgroundRemoved = false;
const cropButton = document.getElementById('crop-image');
let isCropping = false;
let cropHandles = [];
let cropOverlay, cropButtonBelow, cancelCropButton;
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
     canvas.appendChild(imgContainer);
      saveState();
      updateCanvasState();

  imgContainer.classList.add('image-container');
  imgContainer.setAttribute('data-background-removed', 'false');  imgContainer.classList.add('image-container');

  const img = document.createElement('img');
  img.src = src;
  img.setAttribute('data-original-src', src);  // Store the original source
  imgContainer.setAttribute('data-layer-state', 'default');

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
                  updateCenterButtonState(imgContainer);

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

        // Recalculate center option state
        const centerOption = document.getElementById('center-image');
        if (isImageCentered(imgContainer)) {
            centerOption.classList.add('disabled');
        } else {
            centerOption.classList.remove('disabled');
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
    canvas.removeChild(imgContainer);
  });

  document.addEventListener('click', function(event) {
    if (!imgContainer.contains(event.target) && !event.target.closest('.white-square')) {
      imgContainer.classList.remove('selected');
      resizeHandle.style.display = 'none';
      deleteHandle.style.display = 'none';
    }
  });

document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    const clickedOnImage = event.target.closest('.image-container');
    const hasImagesOnCanvas = canvas.querySelector('.image-container') !== null;

    contextMenu.style.display = 'block';

    // Disable or enable menu items based on context
    const menuItems = contextMenu.querySelectorAll('.context-menu-item');
    menuItems.forEach(item => {
        if (item.id === 'paste-image') {
            // Always enable paste if there's copied data
            item.classList.toggle('disabled', !copiedImageData);
        } else {
            item.classList.toggle('disabled', !clickedOnImage || !hasImagesOnCanvas);
        }
    });

    // Position the menu
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = event.pageX;
    let top = event.pageY;

    if (left + menuWidth > windowWidth) {
        left = windowWidth - menuWidth;
    }

    if (top + menuHeight > windowHeight) {
        top = windowHeight - menuHeight;
    }

    contextMenu.style.left = left + 'px';
    contextMenu.style.top = top + 'px';

    // Set the selected image container
    selectedImageContainer = clickedOnImage;
});



    imgContainer.addEventListener('mouseup', () => {
        if(!isCropping)
        {
        saveState();
        updateCanvasState();
        }
    });

    resizeHandle.addEventListener('mouseup', () => {
        saveState();
        updateCanvasState();
    });

    deleteHandle.addEventListener('click', () => {
        canvas.removeChild(imgContainer);
        saveState();
        updateCanvasState();
    });
imgContainer.addEventListener('click', function() {
    const imgWidth = img.offsetWidth;
    const imgHeight = img.offsetHeight;

    const sizeDisplay = document.getElementById('image-size');
    sizeDisplay.textContent = `${imgWidth}px x ${imgHeight}px`;

    showScreen(screen4);
    selectedImageContainer = imgContainer;
        updateLayerButtons(selectedImageContainer);



    // Set background removal toggle based on stored state
    const isBackgroundRemoved = imgContainer.getAttribute('data-background-removed') === 'true';
    backgroundRemovalToggle.checked = isBackgroundRemoved;
});}

document.addEventListener('click', function(event) {
  if (contextMenu.style.display === 'block') {
    contextMenu.style.display = 'none';
  }
});


centerImage.addEventListener('click', function() {
    if (selectedImageContainer && !this.classList.contains('disabled')) {
        const containerRect = canvas.getBoundingClientRect();
        const imgRect = selectedImageContainer.getBoundingClientRect();
        selectedImageContainer.style.left = (containerRect.width / 2 - imgRect.width / 2) + 'px';
        contextMenu.style.display = 'none';
    }
});
cutImage.addEventListener('click', function() {
  if (selectedImageContainer) {
    startCropping();
    contextMenu.style.display = 'none';
  }
});

function showScreen(screenToShow) {
    [screen1, screen2, screen3, screen4].forEach(screen => screen.classList.remove('active'));
    screenToShow.classList.add('active');

    if (screenToShow === screen3) {
        textInput.value = ''; // Clear the input field
    }
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
                // Use the cropped source if available, otherwise fall back to the original source
                img.src = img.getAttribute('data-cropped-src') || img.getAttribute('data-original-src') || img.src;
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
         saveState();
                updateCanvasState();
    }
});document.getElementById('center-image-button').addEventListener('click', function() {
       if (selectedImageContainer && !this.classList.contains('disabled')) {
           const containerRect = canvas.getBoundingClientRect();
           const imgRect = selectedImageContainer.getBoundingClientRect();
           selectedImageContainer.style.left = (containerRect.width / 2 - imgRect.width / 2) + 'px';
           updateCenterButtonState(selectedImageContainer);
                saveState();
                   updateCanvasState();
       }
   });
const layerControl = document.getElementById('layer-control');
function updateLayerButtons(imgContainer) {
    const layerState = imgContainer.getAttribute('data-layer-state');
    const isTopLayer = imgContainer === canvas.lastElementChild;
    const isBottomLayer = imgContainer === canvas.firstElementChild;

    if (isTopLayer) {
        layerMoveForward.classList.remove('active');
        layerMoveBackward.classList.add('active');
    } else if (isBottomLayer) {
        layerMoveForward.classList.add('active');
        layerMoveBackward.classList.remove('active');
    } else {
        // Middle layer
        layerMoveForward.classList.add('active');
        layerMoveBackward.classList.add('active');
    }
}

function moveLayerForward(imgContainer) {
    if (imgContainer.nextElementSibling) {
        canvas.insertBefore(imgContainer.nextElementSibling, imgContainer);
        updateLayerButtons(imgContainer);
        saveState();
        updateCanvasState();
    }
}

function moveLayerBackward(imgContainer) {
    if (imgContainer.previousElementSibling) {
        canvas.insertBefore(imgContainer, imgContainer.previousElementSibling);
        updateLayerButtons(imgContainer);
        saveState();
        updateCanvasState();
    }
}

contextMoveForward.addEventListener('click', function() {
    if (selectedImageContainer) {
        moveLayerForward(selectedImageContainer) ;
    }
});

contextMoveBackward.addEventListener('click', function() {
    if (selectedImageContainer) {
        moveLayerBackward(selectedImageContainer);
    }
});

layerMoveForward.addEventListener('click', function() {
    if (selectedImageContainer && this.classList.contains('active')) {
        moveLayerForward(selectedImageContainer);
    }
});

layerMoveBackward.addEventListener('click', function() {
    if (selectedImageContainer && this.classList.contains('active')) {
        moveLayerBackward(selectedImageContainer);
    }
});

const flipHorizontal = document.getElementById('flip-horizontal');
const flipVertical = document.getElementById('flip-vertical');

function toggleTransform(img, transform) {
    const currentTransform = img.style.transform || '';
    if (currentTransform.includes(transform)) {
        img.style.transform = currentTransform.replace(transform, '');
    } else {
        img.style.transform = currentTransform + ' ' + transform;
    }
    saveState();
    updateCanvasState();
}

flipHorizontal.addEventListener('click', function() {
  if (selectedImageContainer) {
    const img = selectedImageContainer.querySelector('img');
    toggleTransform(img, 'scaleX(-1)');
  }
});

flipVertical.addEventListener('click', function() {
  if (selectedImageContainer) {
    const img = selectedImageContainer.querySelector('img');
    toggleTransform(img, 'scaleY(-1)');
  }
});

const duplicateButton = document.getElementById('duplicate-image');

duplicateButton.addEventListener('click', function() {
    if (selectedImageContainer) {
        const originalImg = selectedImageContainer.querySelector('img');
        const clonedContainer = selectedImageContainer.cloneNode(true);
        const clonedImg = clonedContainer.querySelector('img');

        // Reset the position of the cloned container
        clonedContainer.style.left = (parseFloat(selectedImageContainer.style.left) + 20) + 'px';
        clonedContainer.style.top = (parseFloat(selectedImageContainer.style.top) + 20) + 'px';

        // Ensure unique ids for the cloned elements if needed
        clonedContainer.id = '';
        clonedImg.id = '';

        // Add the cloned container to the canvas
        canvas.appendChild(clonedContainer);

        // Setup interactions for the cloned image
        setupImageInteractions(clonedContainer, clonedImg,
            clonedContainer.querySelector('.resize-handle'),
            clonedContainer.querySelector('.delete-handle'),
            originalImg.getAttribute('data-original-src'));

        // Update layer buttons
        updateLayerButtons(clonedContainer);

        // Set the cloned container as the selected container
        selectedImageContainer = clonedContainer;
                saveState();
                updateCanvasState();
    }
});



cropButton.addEventListener('click', function() {
    if (selectedImageContainer) {
        if (!isCropping) {
            startCropping();
        } else {
            finishCropping();
        }
    }
});
let originalZIndex;
let originalPosition;

function startCropping() {
    document.addEventListener('mousedown', handleOutsideClick);

    isCropping = true;
    cropButton.classList.add('active');

    // Bring the image to the front
    originalZIndex = selectedImageContainer.style.zIndex;
    originalPosition = {
        left: selectedImageContainer.style.left,
        top: selectedImageContainer.style.top
    };
    selectedImageContainer.style.zIndex = '1000';

    const img = selectedImageContainer.querySelector('img');
    const imgRect = img.getBoundingClientRect();

    // Create crop overlay
    cropOverlay = document.createElement('div');
    cropOverlay.className = 'crop-overlay';
    cropOverlay.style.position = 'absolute';
    cropOverlay.style.top = '0';
    cropOverlay.style.left = '0';
    cropOverlay.style.right = '0';
    cropOverlay.style.bottom = '0';
    cropOverlay.style.border = '2px solid #fff';
    selectedImageContainer.appendChild(cropOverlay);

    // Create crop handles
    const handlePositions = ['nw', 'ne', 'se', 'sw'];
    handlePositions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `crop-handle ${pos}`;
        cropOverlay.appendChild(handle);
        cropHandles.push(handle);

        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startRect = cropOverlay.getBoundingClientRect();

            const mousemove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                let newTop = startRect.top - imgRect.top + (pos.includes('n') ? deltaY : 0);
                let newBottom = imgRect.bottom - startRect.bottom - (pos.includes('s') ? deltaY : 0);
                let newLeft = startRect.left - imgRect.left + (pos.includes('w') ? deltaX : 0);
                let newRight = imgRect.right - startRect.right - (pos.includes('e') ? deltaX : 0);

                // Ensure crop area stays within image bounds
                newTop = Math.max(0, Math.min(newTop, imgRect.height - 10));
                newBottom = Math.max(0, Math.min(newBottom, imgRect.height - 10));
                newLeft = Math.max(0, Math.min(newLeft, imgRect.width - 10));
                newRight = Math.max(0, Math.min(newRight, imgRect.width - 10));

                cropOverlay.style.top = `${newTop}px`;
                cropOverlay.style.bottom = `${newBottom}px`;
                cropOverlay.style.left = `${newLeft}px`;
                cropOverlay.style.right = `${newRight}px`;
            };

            const mouseup = () => {
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
            };

            document.addEventListener('mousemove', mousemove);
            document.addEventListener('mouseup', mouseup);
        });
    });

    // Create crop button below the image
  // Create crop button below the image
    // Create crop button below the image
const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'absolute';
buttonContainer.style.top = '100%';
buttonContainer.style.left = '0';
buttonContainer.style.right = '0';
buttonContainer.style.display = 'flex';
buttonContainer.style.justifyContent = 'center';
buttonContainer.style.alignItems = 'center';
buttonContainer.style.marginTop = '20px';

// Create crop (done) button
cropButtonBelow = createButton('חתוך', 'fa-check');
cropButtonBelow.style.marginLeft = '100px'; // Position on the left

// Create cancel button
cancelCropButton = createButton('בטל', 'fa-times');
cancelCropButton.style.marginRight = '100px'; // P osition on the right

// Add buttons to the container
buttonContainer.appendChild(cropButtonBelow);
buttonContainer.appendChild(cancelCropButton);

// Add the container to the image container
selectedImageContainer.appendChild(buttonContainer);

cropButtonBelow.querySelector('button').addEventListener('click', finishCropping);
cancelCropButton.querySelector('button').addEventListener('click', cancelCropping);
    }

function createButton(text, iconClass) {
    const button = document.createElement('div');
    button.className = 'button-group';
    button.style.display = 'flex';
    button.style.flexDirection = 'column';
    button.style.alignItems = 'center';
    button.innerHTML = `
        <div class="button-container">
            <button class="custom-button">
                <i class="fa-solid ${iconClass}"></i>
            </button>
        </div>
        <span class="button-text">${text}</span>
    `;
    return button;
}

function finishCropping() {
    if (!cropOverlay) return;

    const img = selectedImageContainer.querySelector('img');
    const imgRect = img.getBoundingClientRect();
    const cropRect = cropOverlay.getBoundingClientRect();

    // Calculate crop dimensions relative to the original image
    const cropX = (cropRect.left - imgRect.left) / imgRect.width * img.naturalWidth;
    const cropY = (cropRect.top - imgRect.top) / imgRect.height * img.naturalHeight;
    const cropWidth = cropRect.width / imgRect.width * img.naturalWidth;
    const cropHeight = cropRect.height / imgRect.height * img.naturalHeight;

    // Create a canvas with the same dimensions as the current image display size
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the cropped portion of the image onto the canvas, scaling it to fit
    ctx.drawImage(img,
        cropX, cropY, cropWidth, cropHeight,  // Source rectangle
        0, 0, canvas.width, canvas.height);   // Destination rectangle (full canvas)

    // Update the image source with the new canvas content
    img.src = canvas.toDataURL();

    // Store the cropped image data
    img.setAttribute('data-cropped-src', canvas.toDataURL());

    // Restore original z-index
    selectedImageContainer.style.zIndex = originalZIndex;

    cleanupCropping();

}
function cancelCropping() {
    // Restore original position and z-index
    selectedImageContainer.style.zIndex = originalZIndex;
    selectedImageContainer.style.left = originalPosition.left;
    selectedImageContainer.style.top = originalPosition.top;

    cleanupCropping();
    }

function cleanupCropping() {
    isCropping = false;
    cropButton.classList.remove('active');

    // Remove crop overlay and the button container
    if (cropOverlay) selectedImageContainer.removeChild(cropOverlay);
    const buttonContainer = selectedImageContainer.querySelector('div[style*="position: absolute"]');
    if (buttonContainer) selectedImageContainer.removeChild(buttonContainer);
    cropHandles = [];
    cropOverlay = null;
    cropButtonBelow = null;
    cancelCropButton = null;
    document.removeEventListener('mousedown', handleOutsideClick);
}
function handleOutsideClick(event) {
    if (isCropping && selectedImageContainer && !selectedImageContainer.contains(event.target)) {
        cancelCropping();
    }
}
const deleteImage = document.getElementById('delete-image');

deleteImage.addEventListener('click', function() {
    if (selectedImageContainer) {
        canvas.removeChild(selectedImageContainer);
        selectedImageContainer = null;
        contextMenu.style.display = 'none';

        // Clear copied data if the deleted image was the copied one
        if (copiedImageData && copiedImageData.src === selectedImageContainer.querySelector('img').src) {
            copiedImageData = null;
            updatePasteButtonState();
        }
    }
});


function updatePasteButtonState() {
 const pasteButton = document.getElementById('paste-image');
    pasteButton.classList.toggle('disabled', !copiedImageData);
        const contextPasteItem = contextMenu.querySelector('#paste-image');

    if (copiedImageData) {
        pasteButton.classList.remove('disabled');
        contextPasteItem.classList.remove('disabled');
    } else {
        pasteButton.classList.add('disabled');
        contextPasteItem.classList.add('disabled');
    }

    // Update other context menu items based on whether there are images on the canvas
    const hasImages = hasImagesOnCanvas();
    const otherMenuItems = contextMenu.querySelectorAll('.context-menu-item:not(#paste-image)');
    otherMenuItems.forEach(item => {
        item.classList.toggle('disabled', !hasImages);
    });
}
updatePasteButtonState();

copyImage.addEventListener('click', function() {
    if (selectedImageContainer) {
        const img = selectedImageContainer.querySelector('img');
        copiedImageData = {
            src: img.src,
            originalSrc: img.getAttribute('data-original-src') || img.src,
            croppedSrc: img.getAttribute('data-cropped-src') || img.src,
            width: img.style.width,
            height: img.style.height,
            transform: img.style.transform
        };
        contextMenu.style.display = 'none';
        updatePasteButtonState();
                updateCanvasState();

    }
});
pasteImage.addEventListener('click', function() {
    if (copiedImageData) {
        const newContainer = document.createElement('div');
        newContainer.classList.add('image-container');
        newContainer.style.position = 'absolute';

        // Set position in the center of the canvas if no image is selected
        if (!selectedImageContainer) {
            const canvasRect = canvas.getBoundingClientRect();
            newContainer.style.left = (canvasRect.width / 2 - parseInt(copiedImageData.width) / 2) + 'px';
            newContainer.style.top = (canvasRect.height / 2 - parseInt(copiedImageData.height) / 2) + 'px';
        } else {
            // Set position near the original image if one is selected
            const originalLeft = parseFloat(selectedImageContainer.style.left) || 0;
            const originalTop = parseFloat(selectedImageContainer.style.top) || 0;
            newContainer.style.left = (originalLeft + 20) + 'px';
            newContainer.style.top = (originalTop + 20) + 'px';
        }

        const newImg = document.createElement('img');
        newImg.src = copiedImageData.src;
        newImg.setAttribute('data-original-src', copiedImageData.originalSrc);
        newImg.setAttribute('data-cropped-src', copiedImageData.croppedSrc);
        newImg.style.width = copiedImageData.width;
        newImg.style.height = copiedImageData.height;
        newImg.style.transform = copiedImageData.transform;

        const resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle');

        const deleteHandle = document.createElement('div');
        deleteHandle.classList.add('delete-handle');

        newContainer.appendChild(newImg);
        newContainer.appendChild(resizeHandle);
        newContainer.appendChild(deleteHandle);

        canvas.appendChild(newContainer);

        setupImageInteractions(newContainer, newImg, resizeHandle, deleteHandle, 'Pasted Image');
        selectedImageContainer = newContainer;
        updateLayerButtons(newContainer);

        contextMenu.style.display = 'none';
        updatePasteButtonState();
                saveState();
                updateCanvasState();
    }
});
function isImageCentered(imgContainer) {
    const containerRect = canvas.getBoundingClientRect();
    const imgRect = imgContainer.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const imageCenterX = imgRect.left - containerRect.left + imgRect.width / 2;

    // Allow for a small margin of error (e.g., 1 pixel)
    return Math.abs(centerX - imageCenterX) < 5;
}
function updateCenterButtonState(imgContainer) {
    const centerButton = document.getElementById('center-image-button');
    if (isImageCentered(imgContainer)) {
        centerButton.classList.add('disabled');
        centerButton.querySelector('.button-text').classList.add('disabled');
    } else {
        centerButton.classList.remove('disabled');
        centerButton.querySelector('.button-text').classList.remove('disabled');
    }
}
function hasImagesOnCanvas() {
    return canvas.querySelector('.image-container') !== null;
}

function updateCanvasState() {
    updatePasteButtonState();
    undoButton.classList.toggle('disabled', undoStack.length <= 1);
    redoButton.classList.toggle('disabled', redoStack.length === 0);

    // Update other button states as needed
    const hasImages = canvas.querySelector('.image-container') !== null;
    const otherButtons = document.querySelectorAll('.custom-button:not(#undo-button):not(#redo-button)');
    otherButtons.forEach(button => {
        button.classList.toggle('disabled', !hasImages);
    });
}
function saveState() {
    const state = canvas.innerHTML;
    undoStack.push(state);
    redoStack = [];
    updateCanvasState();
}
function undo() {
    if (undoStack.length > 1) { // Keep at least one state in the stack
        const currentState = undoStack.pop();
        redoStack.push(currentState);
        canvas.innerHTML = undoStack[undoStack.length - 1];
        reattachEventListeners();
        updateCanvasState();
    }
}

function redo() {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        canvas.innerHTML = nextState;
        reattachEventListeners();
        updateCanvasState();
    }
}

function reattachEventListeners() {
    const imageContainers = canvas.querySelectorAll('.image-container');
    imageContainers.forEach(container => {
        const img = container.querySelector('img');
        const resizeHandle = container.querySelector('.resize-handle');
        const deleteHandle = container.querySelector('.delete-handle');
        setupImageInteractions(container, img, resizeHandle, deleteHandle, img.getAttribute('data-original-src'));
    });
}

const undoButton = document.getElementById('undo-button');
const redoButton = document.getElementById('redo-button');

undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);
window.addEventListener('load', () => {
    saveState(); // Save initial empty state
    updateCanvasState();
});

// Get references to the elements
const addTextButton = document.querySelector('.add-text');
const textInput = document.getElementById('text-input');
const addToDesignButton = document.getElementById('add-to-design-button');

// Add event listener for the "Add Text" button on the first screen
addTextButton.addEventListener('click', function() {
    showScreen(screen3);
    setClickedOption(blackStripAddText);
});

// Clear the input field when showing screen3

// For now, we'll just log the entered text when the "Add To Design" button is clicked
addToDesignButton.addEventListener('click', function() {
    console.log('Text to add:', textInput.value);
    // The actual functionality to add the text to the design will be implemented later
});
document.getElementById('text-input').addEventListener('focus', function() {
    this.value = '';
});