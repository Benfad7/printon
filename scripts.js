const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('upload');
const contextMenu = document.getElementById('context-menu');
const contextMoveForward = document.getElementById('context-move-forward');
const contextMoveBackward = document.getElementById('context-move-backward');
const layerMoveForward = document.getElementById('move-forward');
const layerMoveBackward = document.getElementById('move-backward');
const centerImage = document.getElementById('center-image');
const cutImage = document.getElementById('cut-image');
const uploadBox = document.getElementById('upload-box');
const uploadBlackStrip = document.querySelector('.black-strip-upload');
const blackStripAddText = document.querySelector('.black-strip-add-text');
const screen1 = document.getElementById('screen1');
const screen2 = document.getElementById('screen2');
const screen3 = document.getElementById('screen3');
const screen4 = document.getElementById('screen4');
const screen6 = document.getElementById('screen6');
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
let canvasStates = [];
let currentStateIndex = -1;
const MAX_STATES = 50;

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
    captureCanvasState();


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
      deselectAllObjects();
      isDragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = imgContainer.offsetLeft;
      startTop = imgContainer.offsetTop;
      img.style.cursor = 'grabbing';
      imgContainer.classList.add('selected');
      imgContainer.style.border = '2px solid #000';
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
    if (isDragging || isResizing) {
        captureCanvasState();
    }
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
document.addEventListener('click', function(event) {
    if (!event.target.closest('.image-container') &&
        !event.target.closest('.text-container') &&
        !event.target.closest('.white-square')) {
        if (deselectAllObjects()) {

        }
    }
});
document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    const clickedOnImage = event.target.closest('.image-container');
    const clickedOnText = event.target.closest('.text-container');
    const hasObjectsOnCanvas = canvas.querySelector('.image-container, .text-container') !== null;

    contextMenu.style.display = 'block';

    // Disable or enable menu items based on context
    const menuItems = contextMenu.querySelectorAll('.context-menu-item');
    menuItems.forEach(item => {
        if (item.id === 'paste-image') {
            // Always enable paste if there's copied data
            item.classList.toggle('disabled', !copiedImageData);
        } else if (item.id === 'cut-image') {
            // Disable cut option for text elements
            item.classList.toggle('disabled', clickedOnText || !hasObjectsOnCanvas);
        } else {
            item.classList.toggle('disabled', !(clickedOnImage || clickedOnText) || !hasObjectsOnCanvas);
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

    // Set the selected container
    selectedImageContainer = clickedOnImage || clickedOnText;
});


    imgContainer.addEventListener('mouseup', () => {
        if(!isCropping)
        {

        }
    });

    resizeHandle.addEventListener('mouseup', () => {

    });

    deleteHandle.addEventListener('click', () => {
        canvas.removeChild(imgContainer);

    });

  imgContainer.addEventListener('mouseenter', function() {
    if (!imgContainer.classList.contains('selected')) {
      imgContainer.style.border = '2px dashed #000';
    }
  });

  imgContainer.addEventListener('mouseleave', function() {
    if (!imgContainer.classList.contains('selected')) {
      imgContainer.style.border = '2px dashed transparent';
    }
  });

    imgContainer.addEventListener('click', function(event) {
        event.stopPropagation();
        if (!imgContainer.classList.contains('selected')) {
            deselectAllObjects();
            imgContainer.classList.add('selected');
            imgContainer.style.border = '2px solid #000';
            resizeHandle.style.display = 'block';
            deleteHandle.style.display = 'block';
        }

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


    });
}

document.addEventListener('click', function(event) {
  if (contextMenu.style.display === 'block') {
    contextMenu.style.display = 'none';
  }
});

centerImage.addEventListener('click', function() {
    if (selectedImageContainer && !this.classList.contains('disabled') && selectedImageContainer.classList.contains('image-container')) {
        const canvasRect = canvas.getBoundingClientRect();
        const imgRect = selectedImageContainer.getBoundingClientRect();

        // Calculate the new left position to center the image
        const newLeft = (canvasRect.width / 2) - (imgRect.width / 2);

        // Set the new position
        selectedImageContainer.style.left = `${newLeft}px`;

        // Update the center button state
        updateCenterButtonState(selectedImageContainer);

        // Hide the context menu
        contextMenu.style.display = 'none';

        // Capture the new state
        captureCanvasState();
    }
    if(selectedImageContainer && !this.classList.contains('disabled') && selectedImageContainer.classList.contains('text-container'))
    {
        const canvasRect = canvas.getBoundingClientRect();
        const imgRect = selectedImageContainer.getBoundingClientRect();

        // Calculate the new left position to center the image
        const newLeft = (canvasRect.width / 2)

        // Set the new position
        selectedImageContainer.style.left = `${newLeft}px`;

        // Update the center button state
        updateCenterButtonState(selectedImageContainer);

        // Hide the context menu
        contextMenu.style.display = 'none';

        // Capture the new state
        captureCanvasState();
    }

});
cutImage.addEventListener('click', function() {
    if (selectedImageContainer) {
        if (selectedImageContainer.classList.contains('image-container')) {
            startCropping();
        } else if (selectedImageContainer.classList.contains('text-container')) {
            // Handle text cutting (if needed)
        }
        contextMenu.style.display = 'none';
    }
});

function showScreen(screenToShow) {
    [screen1, screen2, screen3, screen4, screen5, screen6].forEach(screen => screen.classList.remove('active'));
    screenToShow.classList.add('active');

    if (screenToShow === screen3 || screenToShow === screen5) {
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
  // Check if we're in screen2, screen3, screen4, or screen5
  if (screen2.classList.contains('active') || screen3.classList.contains('active') ||
      screen4.classList.contains('active') || screen5.classList.contains('active')|| screen6.classList.contains('active')) {

    // Check if the click is outside the white square and not on an image or text container
    if (!event.target.closest('.white-square') &&
        !event.target.closest('.image-container') &&
        !event.target.closest('.text-container')) {

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


    }
        captureCanvasState();

});document.getElementById('center-image-button').addEventListener('click', function() {
       if (selectedImageContainer && !this.classList.contains('disabled')) {
           const containerRect = canvas.getBoundingClientRect();
           const imgRect = selectedImageContainer.getBoundingClientRect();
           selectedImageContainer.style.left = (containerRect.width / 2 - imgRect.width / 2) + 'px';
           updateCenterButtonState(selectedImageContainer);

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

    }
        captureCanvasState();

}

function moveLayerBackward(imgContainer) {
    if (imgContainer.previousElementSibling) {
        canvas.insertBefore(imgContainer, imgContainer.previousElementSibling);
        updateLayerButtons(imgContainer);

    }
        captureCanvasState();

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

    }
        captureCanvasState();

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
    captureCanvasState();
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
        captureCanvasState(); // Capture the new state after deletion

        if (selectedImageContainer.classList.contains('text-container')) {
            const textElement = selectedImageContainer.querySelector('p');
            if (currentlyEditedTextElement === textElement) {
                currentlyEditedTextElement = null;
            }
        }

        selectedImageContainer = null;
        contextMenu.style.display = 'none';

        // Clear copied data if the deleted object was the copied one
        if (copiedImageData && copiedImageData.src === selectedImageContainer.querySelector('img, p').src) {
            copiedImageData = null;
            updatePasteButtonState();
        }

        updateCanvasState(); // Update UI elements
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
        if (selectedImageContainer.classList.contains('image-container')) {
            const img = selectedImageContainer.querySelector('img');
            copiedImageData = {
                type: 'image',
                src: img.src,
                originalSrc: img.getAttribute('data-original-src') || img.src,
                croppedSrc: img.getAttribute('data-cropped-src') || img.src,
                width: img.style.width,
                height: img.style.height,
                transform: img.style.transform
            };
        } else if (selectedImageContainer.classList.contains('text-container')) {
            const textElement = selectedImageContainer.querySelector('p');
            copiedImageData = {
                type: 'text',
                content: textElement.textContent,
                style: {
                    color: textElement.style.color,
                    fontFamily: textElement.style.fontFamily,
                    fontSize: textElement.style.fontSize,
                    transform: textElement.style.transform,
                    textShadow: textElement.style.textShadow
                },
                dataset: {
                    outlineColor: textElement.dataset.outlineColor,
                    outlineStrength: textElement.dataset.outlineStrength
                }
            };
        }
        contextMenu.style.display = 'none';
        updatePasteButtonState();
    }
});
pasteImage.addEventListener('click', function() {
    if (copiedImageData) {
        if (copiedImageData.type === 'image') {
            const imgContainer = document.createElement('div');
            imgContainer.classList.add('image-container');
            imgContainer.style.position = 'absolute';

            const img = document.createElement('img');
            img.src = copiedImageData.src;
            img.setAttribute('data-original-src', copiedImageData.originalSrc);
            img.setAttribute('data-cropped-src', copiedImageData.croppedSrc);
            img.style.width = copiedImageData.width;
            img.style.height = copiedImageData.height;
            img.style.transform = copiedImageData.transform;

            const resizeHandle = document.createElement('div');
            resizeHandle.classList.add('resize-handle');

            const deleteHandle = document.createElement('div');
            deleteHandle.classList.add('delete-handle');

            imgContainer.appendChild(img);
            imgContainer.appendChild(resizeHandle);
            imgContainer.appendChild(deleteHandle);

            // Set position (you might want to offset it slightly from the original)
            imgContainer.style.left = (parseFloat(selectedImageContainer.style.left) + 20) + 'px';
            imgContainer.style.top = (parseFloat(selectedImageContainer.style.top) + 20) + 'px';

            canvas.appendChild(imgContainer);

            setupImageInteractions(imgContainer, img, resizeHandle, deleteHandle, copiedImageData.originalSrc);

        } else if (copiedImageData.type === 'text') {
            const textContainer = document.createElement('div');
            textContainer.classList.add('text-container');
            textContainer.style.position = 'absolute';

            const textElement = document.createElement('p');
            textElement.textContent = copiedImageData.content;
            Object.assign(textElement.style, copiedImageData.style);
            Object.assign(textElement.dataset, copiedImageData.dataset);

            const resizeHandle = document.createElement('div');
            resizeHandle.classList.add('resize-handle');

            const deleteHandle = document.createElement('div');
            deleteHandle.classList.add('delete-handle');

            textContainer.appendChild(textElement);
            textContainer.appendChild(resizeHandle);
            textContainer.appendChild(deleteHandle);

            // Set position (you might want to offset it slightly from the original)
            textContainer.style.left = (parseFloat(selectedImageContainer.style.left) + 20) + 'px';
            textContainer.style.top = (parseFloat(selectedImageContainer.style.top) + 20) + 'px';

            canvas.appendChild(textContainer);

            setupTextInteractions(textContainer, textElement, resizeHandle, deleteHandle);
        }

        contextMenu.style.display = 'none';
        updatePasteButtonState();
        captureCanvasState();
    }
});function isImageCentered(imgContainer) {
    const containerRect = canvas.getBoundingClientRect();
    const imgRect = imgContainer.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const imageCenterX = imgRect.left - containerRect.left + imgRect.width / 2;

    // Allow for a small margin of error (e.g., 1 pixel)
    return Math.abs(centerX - imageCenterX) < 5;
}
function updateCenterButtonState(container) {
    const centerButton = document.getElementById('center-text-button') || document.getElementById('center-image-button');
        centerButton.querySelector('.button-text').classList.add('disabled');

}
function hasImagesOnCanvas() {
    return canvas.querySelector('.image-container, .text-container') !== null;
}
function updateCanvasState() {
    updatePasteButtonState();
    updateUndoRedoButtons();

    // Update other button states as needed
    const hasObjects = canvas.querySelector('.image-container, .text-container') !== null;
    const otherButtons = document.querySelectorAll('.custom-button:not(#undo-button):not(#redo-button)');
    otherButtons.forEach(button => {
        button.classList.toggle('disabled', !hasObjects);
    });

    // If there are no objects left, return to the main screen
    if (!hasObjects && !screen1.classList.contains('active')) {
        showScreen(screen1);
    }
}
window.addEventListener('load', () => {
    captureCanvasState(); // Capture initial empty state
});

function reattachEventListeners() {
    const imageContainers = canvas.querySelectorAll('.image-container');
    imageContainers.forEach(container => {
        const img = container.querySelector('img');
        const resizeHandle = container.querySelector('.resize-handle');
        const deleteHandle = container.querySelector('.delete-handle');
        setupImageInteractions(container, img, resizeHandle, deleteHandle, img.getAttribute('data-original-src'));
    });

    const textContainers = canvas.querySelectorAll('.text-container');
    textContainers.forEach(container => {
        const textElement = container.querySelector('p');
        const resizeHandle = container.querySelector('.resize-handle');
        const deleteHandle = container.querySelector('.delete-handle');

        // Restore text properties
        const fontSize = container.getAttribute('data-font-size');
        const textContent = container.getAttribute('data-text-content');
        if (fontSize) textElement.style.fontSize = fontSize;
        if (textContent) textElement.textContent = textContent;

        // Apply text outline
        applyTextOutline(textElement);

        setupTextInteractions(container, textElement, resizeHandle, deleteHandle);
    });

    // Reattach event listeners for text editing screen
    const textColorPicker = document.getElementById('text-color-picker');
    const fontSelector = document.getElementById('font-selector');
    const editTextInput = document.getElementById('edit-text-input');
    const outlineColorPicker = document.getElementById('outline-color-picker');
    const outlineThicknessSelector = document.getElementById('outline-thickness-selector');
    const rotationSlider = document.getElementById('rotation-slider');

    textColorPicker.addEventListener('input', updateTextColor);
    fontSelector.addEventListener('change', updateTextFont);
    editTextInput.addEventListener('blur', updateTextContent);
    editTextInput.addEventListener('keypress', handleEnterKey);
    outlineColorPicker.addEventListener('input', updateTextOutline);
    outlineThicknessSelector.addEventListener('change', updateTextOutline);
    rotationSlider.addEventListener('input', updateTextRotation);

    // Reattach event listeners for shape options
    document.querySelectorAll('.shape-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.shape-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            currentTextShape = this.dataset.shape;
            const shapeSlider = document.getElementById('shape-slider');
            shapeSlider.disabled = (currentTextShape === 'normal');
            applyTextShape();
            captureCanvasState();
        });
    });

    document.getElementById('shape-slider').addEventListener('input', function() {
        currentShapeIntensity = this.value;
        if (currentTextShape !== 'normal') {
            applyTextShape();
            captureCanvasState();
        }
    });

    // Reattach other necessary event listeners
    // ...

    // Update undo/redo buttons
    updateUndoRedoButtons();
}
const undoButton = document.getElementById('undo-button');
const redoButton = document.getElementById('redo-button');



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
    const textToAdd = textInput.value;
    if (textToAdd.trim() !== '') {
        createTextObject(textToAdd);
        showScreen(screen1); // Return to the main screen after adding text
    }
});
let lastInputValue = '';

textInput.addEventListener('focus', function() {
    // Move the cursor to the end of the text
    this.selectionStart = this.selectionEnd = this.value.length;
});

textInput.addEventListener('input', function() {
    // Store the current value
    lastInputValue = this.value;
});

textInput.addEventListener('blur', function() {
    // Restore the last input value when losing focus
    this.value = lastInputValue;
});
function createTextObject(text) {
   const textContainer = document.createElement('div');
    textContainer.classList.add('text-container');
    textContainer.style.position = 'absolute';
    textContainer.style.left = '50%';
    textContainer.style.top = '50%';
    textContainer.style.transform = 'translate(-50%, -50%)';
    textContainer.style.border = '2px dashed transparent';
    textContainer.style.boxSizing = 'border-box';
    textContainer.style.padding = '5px'; // Increased padding
    textContainer.style.cursor = 'pointer'; // Add this line to change cursor on hove

    const textElement = document.createElement('p');
    textElement.textContent = text;
    textElement.style.fontSize = '20px';
    textElement.style.color = 'black';
    textElement.style.margin = '0';
    textElement.style.padding = '0';
    textElement.style.cursor = 'move';
    textElement.style.userSelect = 'none';
    textElement.style.textShadow = 'none'; // Initialize with no outline
    textElement.dataset.outlineColor = '#000000';
    textElement.dataset.outlineStrength = '0';



    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('resize-handle');

    const deleteHandle = document.createElement('div');
    deleteHandle.classList.add('delete-handle');

    textContainer.appendChild(textElement);
    textContainer.appendChild(resizeHandle);
    textContainer.appendChild(deleteHandle);

   canvas.appendChild(textContainer);
    captureCanvasState();

    setupTextInteractions(textContainer, textElement, resizeHandle, deleteHandle);

}
function setupTextInteractions(textContainer, textElement, resizeHandle, deleteHandle) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop, startFontSize;
    let currentFontSize = parseInt(window.getComputedStyle(textElement).fontSize);
       textContainer.style.cursor = 'grab';
        textElement.style.cursor = 'grab';

 textContainer.addEventListener('mousedown', function(event) {
        if (!isResizing) {
            deselectAllObjects(); // Deselect all objects before selecting this one
            isDragging = true;
            startX = event.clientX;
            startY = event.clientY;
            startLeft = textContainer.offsetLeft;
            startTop = textContainer.offsetTop;
            textContainer.classList.add('selected');
            textContainer.style.border = '2px solid #000';
            resizeHandle.style.display = 'block';
            deleteHandle.style.display = 'block';
            textContainer.style.cursor = 'grabbing';
            textElement.style.cursor = 'grabbing';
        }
        event.preventDefault();
    });
  textContainer.addEventListener('click', function(event) {
        event.stopPropagation();
        if (!textContainer.classList.contains('selected')) {
            deselectAllObjects();
            textContainer.classList.add('selected');
            textContainer.style.border = '2px solid #000';
            resizeHandle.style.display = 'block';
            deleteHandle.style.display = 'block';
        }
        showTextEditScreen(textElement);

    });


    document.addEventListener('mousemove', function(event) {
        if (isDragging && !isResizing) {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;
            const canvasRect = canvas.getBoundingClientRect();
            const textRect = textContainer.getBoundingClientRect();

            // Calculate offsets based on object dimensions
            const leftOffset = -0.5 * textRect.width;
            const topOffset = -0.5 * textRect.height;
            const rightOffset = 0.5 * textRect.width - 4;
            const bottomOffset = 0.5 * textRect.height - 4;

            // Adjust boundaries to keep the text object within the canvas
            const minLeft = -leftOffset;
            const maxLeft = canvasRect.width - textRect.width + rightOffset;
            const minTop = -topOffset;
            const maxTop = canvasRect.height - textRect.height + bottomOffset;

            // Constrain the position
            newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
            newTop = Math.max(minTop, Math.min(newTop, maxTop));
      textContainer.style.left = newLeft + 'px';
            textContainer.style.top = newTop + 'px';
   } else if (isResizing && !isDragging) {
         const dx = event.clientX - startX;
         const dy = event.clientY - startY;

         // Calculate diagonal distance
         const diagonalDistance = Math.sqrt(dx * dx + dy * dy);

         // Determine direction (growing or shrinking)
         const direction = dx + dy > 0 ? 1 : -1;

         // Calculate new font size based on diagonal movement
         let newFontSize = Math.max(10, startFontSize + direction * diagonalDistance * 0.6);

         // Store the original width and height
         const originalWidth = textContainer.offsetWidth;
         const originalHeight = textContainer.offsetHeight;

         // Apply the new font size temporarily
         textElement.style.fontSize = newFontSize + 'px';

         // Get the updated rectangles
         const canvasRect = canvas.getBoundingClientRect();
         const textRect = textContainer.getBoundingClientRect();

         // Check all boundaries
         if (textRect.left < canvasRect.left ||
             textRect.right > canvasRect.right ||
             textRect.top < canvasRect.top ||
             textRect.bottom > canvasRect.bottom) {
             // If any boundary is exceeded, revert to the current font size
             textElement.style.fontSize = currentFontSize + 'px';
         } else {
             // If it doesn't exceed any boundary, update the current font size
             currentFontSize = newFontSize;
             textElement.style.fontSize = currentFontSize + 'px';

             // Calculate the change in size
             const deltaWidth = textContainer.offsetWidth - originalWidth;
             const deltaHeight = textContainer.offsetHeight - originalHeight;

             // Adjust the position to keep the top-left corner fixed
             textContainer.style.left = (startLeft) + 'px';
             textContainer.style.top = (startTop) + 'px';
         }
     }
 });
  document.addEventListener('mouseup', function() {
        if (isDragging || isResizing) {
            captureCanvasState();  // Capture state after moving or resizing
        }
        isDragging = false;
        isResizing = false;
        textContainer.style.cursor = 'grab';
        textElement.style.cursor = 'grab';
    });



resizeHandle.addEventListener('mousedown', function(event) {
    isResizing = true;
    isDragging = false;
    startX = event.clientX;
    startY = event.clientY;
    currentFontSize = parseInt(window.getComputedStyle(textElement).fontSize);
    startFontSize = currentFontSize;
    startLeft = textContainer.offsetLeft;
    startTop = textContainer.offsetTop;
    event.stopPropagation();
    event.preventDefault();
});
   deleteHandle.addEventListener('click', function() {
        canvas.removeChild(textContainer);
        captureCanvasState(); // Capture the new state after deletion

        // If this was the currently edited text element, reset it
        if (currentlyEditedTextElement === textElement) {
            currentlyEditedTextElement = null;
        }

        // If this was the selected container, reset it
        if (selectedImageContainer === textContainer) {
            selectedImageContainer = null;
        }

        // Return to the main screen if we're in the text editing screen
        if (screen5.classList.contains('active')) {
            showScreen(screen1);
        }

        updateCanvasState(); // Update UI elements
    });
    document.addEventListener('click', function(event) {
        if (!textContainer.contains(event.target) && !event.target.closest('.white-square')) {
            textContainer.classList.remove('selected');
            textContainer.style.border = '2px dashed transparent';
            resizeHandle.style.display = 'none';
            deleteHandle.style.display = 'none';
        }
    });
  textContainer.addEventListener('mouseenter', function() {
        if (!textContainer.classList.contains('selected')) {
            textContainer.style.border = '2px dashed #000';
            textContainer.style.cursor = 'grab';
        }
    });

    textContainer.addEventListener('mouseleave', function() {
        if (!textContainer.classList.contains('selected')) {
            textContainer.style.border = '2px dashed transparent';
            textContainer.style.cursor = 'default';
            textElement.style.cursor = 'default';
        }
    });

    // Prevent text selection
    textElement.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });
}
let currentlyEditedTextElement = null;
let currentOutlineColor = '#000000';
let currentOutlineThickness = 0;
let currentRotation = 0;

function showTextEditScreen(textElement) {
    showScreen(screen5);

    currentlyEditedTextElement = textElement;
    const editTextInput = document.getElementById('edit-text-input');
    const textColorPicker = document.getElementById('text-color-picker');
    const fontSelector = document.getElementById('font-selector');
    const outlineColorPicker = document.getElementById('outline-color-picker');
    const outlineThicknessSelector = document.getElementById('outline-thickness-selector');

    // Set text content
    editTextInput.value = textElement.textContent;

    // Set text color
    const computedStyle = window.getComputedStyle(textElement);
    const currentColor = computedStyle.color;
    textColorPicker.value = rgbToHex(currentColor);

    // Set font
    const currentFont = computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '');
    for (let i = 0; i < fontSelector.options.length; i++) {
        if (fontSelector.options[i].value === currentFont) {
            fontSelector.selectedIndex = i;
            break;
        }
    }

    // Set outline properties
    outlineColorPicker.value = textElement.dataset.outlineColor || '#000000';
    outlineThicknessSelector.value = textElement.dataset.outlineStrength || '0';

    // Remove existing event listeners
    textColorPicker.removeEventListener('input', updateTextColor);
    fontSelector.removeEventListener('change', updateTextFont);
    editTextInput.removeEventListener('blur', updateTextContent);
    editTextInput.removeEventListener('keypress', handleEnterKey);
    outlineColorPicker.removeEventListener('input', updateTextOutline);
    outlineThicknessSelector.removeEventListener('change', updateTextOutline);

    // Add new event listeners
    textColorPicker.addEventListener('input', updateTextColor);
    fontSelector.addEventListener('change', updateTextFont);
    editTextInput.addEventListener('blur', updateTextContent);
    editTextInput.addEventListener('keypress', handleEnterKey);
    outlineColorPicker.addEventListener('input', updateTextOutline);
    outlineThicknessSelector.addEventListener('change', updateTextOutline);

    // Set text shape properties
    currentTextShape = textElement.className.match(/\bshape-(\S+)/) ?
        textElement.className.match(/\bshape-(\S+)/)[1] : 'normal';
    currentShapeIntensity = textElement.style.getPropertyValue('--shape-intensity') || 75;

        currentRotation = textElement.style.transform ?
            parseInt(textElement.style.transform.match(/rotate\(([-\d]+)deg\)/)[1]) || 0 : 0;
        document.getElementById('rotation-slider').value = currentRotation;
        document.getElementById('rotation-value').textContent = currentRotation + '°';
            document.getElementById('rotation-slider').addEventListener('input', updateTextRotation);


    document.getElementById('text-shape-button').textContent =
        currentTextShape === 'normal' ? 'רגיל' : currentTextShape;

    // Prevent clicks within the white square from closing the screen
    screen5.querySelector('.white-square').addEventListener('click', function(event) {
        event.stopPropagation();
    });
    // Update layer buttons
    updateLayerButtons(currentlyEditedTextElement.parentNode);

    // Update center button state
    updateCenterButtonState(currentlyEditedTextElement.parentNode);

    // Update flip buttons state
    updateFlipButtonsState(currentlyEditedTextElement);
}

// Helper function to convert RGB to HEX
function rgbToHex(rgb) {
    // Choose correct separator
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    // Turn "rgb(r,g,b)" into [r,g,b]
    rgb = rgb.substr(4).split(")")[0].split(sep);

    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
}

function updateTextColor() {
    if (currentlyEditedTextElement) {
        currentlyEditedTextElement.style.color = this.value;
        captureCanvasState();
    }
}

function updateTextFont() {
    if (currentlyEditedTextElement) {
        currentlyEditedTextElement.style.fontFamily = this.value;
        captureCanvasState();
    }
}

function updateTextContent() {
    if (currentlyEditedTextElement) {
        currentlyEditedTextElement.textContent = this.value;
        captureCanvasState();
    }
}

function handleEnterKey(event) {
    if (event.key === 'Enter' && currentlyEditedTextElement) {
        currentlyEditedTextElement.textContent = this.value;

        showScreen(screen1); // Return to main screen
    }
}
let currentTextShape = 'normal';
let currentShapeIntensity = 75;

document.getElementById('text-shape-button').addEventListener('click', showTextShapeScreen);

function showTextShapeScreen() {
    showScreen(document.getElementById('screen6'));
    document.querySelector(`.shape-option[data-shape="${currentTextShape}"]`).classList.add('selected');
    const shapeSlider = document.getElementById('shape-slider');
    shapeSlider.value = currentShapeIntensity;
    shapeSlider.disabled = (currentTextShape === 'normal');
}

document.querySelectorAll('.shape-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.shape-option').forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        currentTextShape = this.dataset.shape;
        const shapeSlider = document.getElementById('shape-slider');
        shapeSlider.disabled = (currentTextShape === 'normal');
        applyTextShape();
    });
});

document.getElementById('shape-slider').addEventListener('input', function() {
    currentShapeIntensity = this.value;
    if (currentTextShape !== 'normal') {
        applyTextShape();
    }
});
document.getElementById('remove-shape-button').addEventListener('click', function() {
    currentTextShape = 'normal';
    currentShapeIntensity = 50;
    document.getElementById('shape-slider').value = 50;
    applyTextShape();
    document.querySelectorAll('.shape-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.shape-option[data-shape="normal"]').classList.add('selected');
});

document.getElementById('done-shape-button').addEventListener('click', function() {
    showScreen(document.getElementById('screen5')); // Go back to the text edit screen
});
function applyTextShape() {
    if (currentlyEditedTextElement) {
        currentlyEditedTextElement.className = currentlyEditedTextElement.className.replace(/\bshape-\S+/g, '');
        currentlyEditedTextElement.classList.add(`shape-${currentTextShape}`);

        const intensity = currentTextShape === 'normal' ? 50 : currentShapeIntensity;
        const isRtl = isRTL(currentlyEditedTextElement.textContent);

        // Clear any existing spans
        currentlyEditedTextElement.innerHTML = currentlyEditedTextElement.textContent;

        if (currentTextShape !== 'normal') {
            const chars = currentlyEditedTextElement.textContent.split('');
            currentlyEditedTextElement.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

            applyShapeToSpans(currentlyEditedTextElement, currentTextShape, intensity, isRtl);
        }

        document.getElementById('text-shape-button').textContent =
            currentTextShape === 'normal' ? 'רגיל' : currentTextShape;

        setupTextInteractions(
            currentlyEditedTextElement.parentNode,
            currentlyEditedTextElement,
            currentlyEditedTextElement.parentNode.querySelector('.resize-handle'),
            currentlyEditedTextElement.parentNode.querySelector('.delete-handle')
        );

    }
    applyTextRotation();
        captureCanvasState();

}
function applyShapeToSpans(element, shape, intensity, isRtl) {
    const spans = Array.from(element.children);
    const totalSpans = spans.length;
    const normalizedIntensity = (intensity - 50) / 50;

    element.style.display = 'flex';
    element.style.flexDirection = isRtl ? 'row-reverse' : 'row';
    element.style.justifyContent = 'center';

    spans.forEach((span, index) => {
        const progress = index / (totalSpans - 1);
        let transform = '';

        switch(shape) {
            case 'curve':
            case 'arch':
                transform = `translateY(${Math.sin(progress * Math.PI) * normalizedIntensity * -50}px)`;
                break;
            case 'bridge':
                transform = `translateY(${Math.sin(progress * Math.PI) * normalizedIntensity * 50}px)`;
                break;
            case 'valley':
                transform = `translateY(${Math.abs(progress - 0.5) * 2 * normalizedIntensity * 50}px)`;
                break;
            case 'pinch':
                transform = `scale(${1 - Math.abs(progress - 0.5) * normalizedIntensity})`;
                break;
            case 'bulge':
                transform = `scale(${1 + Math.sin(progress * Math.PI) * normalizedIntensity})`;
                break;
            case 'perspective':
                const scale = 1 + (progress - 0.5) * normalizedIntensity;
                const y = (progress - 0.5) * normalizedIntensity * 50;
                transform = `scale(${scale}) translateY(${y}px)`;
                break;
            case 'pointed':
                transform = `translateY(${Math.abs(progress - 0.5) * 2 * normalizedIntensity * -50}px)`;
                break;
            case 'downward':
                transform = `translateY(${progress * normalizedIntensity * 50}px)`;
                break;
            case 'upward':
                transform = `translateY(${(1 - progress) * normalizedIntensity * 50}px)`;
                break;
            case 'cone':
                transform = `scale(${1 + progress * normalizedIntensity})`;
                break;
        }

        span.style.transform = transform;
    });
}
function updateTextOutline() {
    if (currentlyEditedTextElement) {
        const outlineColor = document.getElementById('outline-color-picker').value;
        const outlineStrength = document.getElementById('outline-thickness-selector').value;

        currentlyEditedTextElement.dataset.outlineColor = outlineColor;
        currentlyEditedTextElement.dataset.outlineStrength = outlineStrength;

   applyTextOutline(currentlyEditedTextElement);
        captureCanvasState();
    }
}
function applyTextOutline(textElement) {
    const outlineColor = textElement.dataset.outlineColor;
    const outlineStrength = parseFloat(textElement.dataset.outlineStrength);

    if (outlineStrength > 0) {
        const emStrength = outlineStrength / 200; // Convert 0-5 range to 0-0.25em
        const shadows = [];
        for (let x = -3; x <= 3; x++) {
            for (let y = -3; y <= 3; y++) {
                if (x !== 0 || y !== 0) {
                    shadows.push(`${x * emStrength}em ${y * emStrength}em 0 ${outlineColor}`);
                }
            }
        }
        textElement.style.textShadow = shadows.join(', ');
    } else {
        textElement.style.textShadow = 'none';
    }
}
function applyNormalShape(element) {
    element.style.transform = `rotate(${currentRotation}deg)`;
    Array.from(element.children).forEach(span => {
        span.style.transform = 'none';
    });
}
function applyCurveShape(element, intensity, widthFactor = 1, isRtl) {
    const text = element.textContent;
    const chars = isRtl ? text.split('').reverse() : text.split('');

    element.style.display = 'inline-block';
    element.style.whiteSpace = 'nowrap';

    if (element.children.length !== chars.length) {
        element.innerHTML = chars.map(char => `<span style="display: inline-block; position: relative;">${char}</span>`).join('');
    }

    const totalWidth = element.offsetWidth;
    const charWidth = totalWidth / chars.length / 7;
    const normalizedIntensity = (intensity - 50) / 50;

    Array.from(element.children).forEach((span, index) => {
        const adjustedIndex = isRtl ? chars.length - 1 - index : index;
        const offsetPercentage = ((adjustedIndex / (chars.length - 1) - 0.5) * 2 * widthFactor);
        const y = (offsetPercentage * offsetPercentage) * normalizedIntensity * 1;
        const rotation = offsetPercentage * normalizedIntensity * 25;

        const compressionFactor = 1 - (Math.abs(y)) * 0.5;
        const x = (adjustedIndex - (chars.length - 1) / 2) * charWidth * compressionFactor / 7;

        span.style.transform = `translate(${x}px, ${y}em) rotate(${rotation}deg)`;
    });
}
function applyArchShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? (chars.length - 1 - index) / (chars.length - 1) : index / (chars.length - 1);
        const y = Math.sin(progress * Math.PI) * normalizedIntensity * -50;
        span.style.transform = `translateY(${y}px)`;
    });
}

function applyBridgeShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? 1 - (index / (chars.length - 1)) : index / (chars.length - 1);
        const y = Math.sin(progress * Math.PI) * normalizedIntensity * 50;
        span.style.transform = `translateY(${y}px)`;
    });
}
function applyValleyShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? 1 - (index / (chars.length - 1)) : index / (chars.length - 1);
        const y = Math.abs(progress - 0.5) * 2 * normalizedIntensity * 50;
        span.style.transform = `translateY(${y}px)`;
    });
}
function applyPinchShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? 1 - (index / (chars.length - 1)) : index / (chars.length - 1);
        const scale = 1 - Math.abs(progress - 0.5) * normalizedIntensity;
        span.style.transform = `scale(${scale})`;
    });
}
function applyBulgeShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? 1 - (index / (chars.length - 1)) : index / (chars.length - 1);
        const scale = 1 + Math.sin(progress * Math.PI) * normalizedIntensity;
        span.style.transform = `scale(${scale})`;
    });
}
function applyPerspectiveShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? 1 - (index / (chars.length - 1)) : index / (chars.length - 1);
        const scale = 1 + (progress - 0.5) * normalizedIntensity;
        const y = (progress - 0.5) * normalizedIntensity * 50;
        span.style.transform = `scale(${scale}) translateY(${y}px)`;
    });
}

function applyPointedShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? 1 - (index / (chars.length - 1)) : index / (chars.length - 1);
        const y = Math.abs(progress - 0.5) * 2 * normalizedIntensity * -50;
        span.style.transform = `translateY(${y}px)`;
    });
}
function applyDownwardShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? 1 - (index / (chars.length - 1)) : index / (chars.length - 1);
        const y = progress * normalizedIntensity * 50;
        span.style.transform = `translateY(${y}px)`;
    });
}
function applyUpwardShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? 1 - (index / (chars.length - 1)) : index / (chars.length - 1);
        const y = (1 - progress) * normalizedIntensity * 50;
        span.style.transform = `translateY(${y}px)`;
    });
}

function applyConeShape(element, intensity, isRtl) {
    const chars = element.textContent.split('');
    element.innerHTML = chars.map(char => `<span style="display: inline-block;">${char}</span>`).join('');

    const normalizedIntensity = (intensity - 50) / 50;
    Array.from(element.children).forEach((span, index) => {
        const progress = isRtl ? 1 - (index / (chars.length - 1)) : index / (chars.length - 1);
        const scale = 1 + progress * normalizedIntensity;
        span.style.transform = `scale(${scale})`;
    });
}
function applyPreviewShapes() {
     const curveOption = document.querySelector('.shape-option[data-shape="curve"] span');
     const archOption = document.querySelector('.shape-option[data-shape="arch"] span');

     if (curveOption) {
         const text = curveOption.textContent;
         curveOption.innerHTML = text.split('').map((char, i) =>
             `<span style="display:inline-block; transform: translateY(${Math.sin((i / (text.length - 1)) * Math.PI) * -10}px);">${char}</span>`
         ).join('');
     }

     if (archOption) {
         const text = archOption.textContent;
         archOption.innerHTML = text.split('').map((char, i) =>
             `<span style="display:inline-block; transform: translateY(${Math.sin((i / (text.length - 1)) * Math.PI) * 10}px);">${char}</span>`
         ).join('');
     }
 }

 // Call this function after the DOM is loaded
 document.addEventListener('DOMContentLoaded', applyPreviewShapes);
function updateTextRotation() {
    if (currentlyEditedTextElement) {
        let rotation = parseInt(this.value);

        // Snap to zero if within 5 degrees


        currentRotation = rotation;
        document.getElementById('rotation-value').textContent = currentRotation + '°';
        applyTextRotation();

    }
     applyTextRotation();
        captureCanvasState();

}

function resetRotation() {
    if (currentlyEditedTextElement) {
        currentRotation = 0;
        document.getElementById('rotation-slider').value = 0;
        document.getElementById('rotation-value').textContent = '0°';
        applyTextRotation();

    }
}

// Add these event listeners
document.getElementById('rotation-slider').addEventListener('input', updateTextRotation);
document.getElementById('reset-rotation').addEventListener('click', resetRotation);

function applyTextRotation() {
    if (currentlyEditedTextElement) {
        let currentTransform = currentlyEditedTextElement.style.transform || '';
        currentTransform = currentTransform.replace(/\s*rotate\([^)]*\)/, '');
        currentlyEditedTextElement.style.transform = `${currentTransform} rotate(${currentRotation}deg)`.trim();

        // If the shape is normal, apply rotation directly to the element
        if (currentTextShape === 'normal') {
            currentlyEditedTextElement.style.transform = `rotate(${currentRotation}deg)`;
        } else {
            // For other shapes, maintain the existing transform and add rotation
            let shapeTransform = currentlyEditedTextElement.style.transform || '';
            shapeTransform = shapeTransform.replace(/\s*rotate\([^)]*\)/, '');
            currentlyEditedTextElement.style.transform = `${shapeTransform} rotate(${currentRotation}deg)`.trim();
        }
    }
}
function centerObject(container) {
    const canvasRect = canvas.getBoundingClientRect();
    const objRect = container.getBoundingClientRect();

    // Calculate the horizontal center of the canvas
    const canvasCenterX = canvasRect.width / 2;

    // Calculate the offset to center the object horizontally
    const offsetX = objRect.width / 2;

    // Set the new horizontal position
    const newLeft = canvasCenterX;
    container.style.left = `${newLeft}px`;

    // If it's a text container, we need to adjust for any transform
    if (container.classList.contains('text-container')) {
        const textElement = container.querySelector('p');
        const computedStyle = window.getComputedStyle(textElement);
        const transform = computedStyle.transform;

        if (transform && transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            const additionalOffsetX = matrix.m41 / 2;
            container.style.left = `${newLeft - additionalOffsetX}px`;
        }
    }
    captureCanvasState();


}
function isRTL(text) {
    const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return rtlChars.test(text.trim()[0]);
}
function deselectAllObjects() {
    let wasAnythingDeselected = false;
    const allObjects = canvas.querySelectorAll('.image-container, .text-container');
    allObjects.forEach(obj => {
        if (obj.classList.contains('selected')) {
            wasAnythingDeselected = true;
        }
        obj.classList.remove('selected');
        obj.style.border = '2px dashed transparent';
        const resizeHandle = obj.querySelector('.resize-handle');
        const deleteHandle = obj.querySelector('.delete-handle');
        if (resizeHandle) resizeHandle.style.display = 'none';
        if (deleteHandle) deleteHandle.style.display = 'none';
    });
    return wasAnythingDeselected;
}function deselectAllObjects() {
     let wasAnythingDeselected = false;
     const allObjects = canvas.querySelectorAll('.image-container, .text-container');
     allObjects.forEach(obj => {
         if (obj.classList.contains('selected')) {
             wasAnythingDeselected = true;
         }
         obj.classList.remove('selected');
         obj.style.border = '2px dashed transparent';
         const resizeHandle = obj.querySelector('.resize-handle');
         const deleteHandle = obj.querySelector('.delete-handle');
         if (resizeHandle) resizeHandle.style.display = 'none';
         if (deleteHandle) deleteHandle.style.display = 'none';
     });
     return wasAnythingDeselected;
 }
canvas.addEventListener('click', function(event) {
    // Check if the click is directly on the canvas and not on any object
    if (event.target === canvas) {
        deselectAllObjects();
        showScreen(screen1); // Return to the main screen
    }
});
// Center text
// Center text
document.getElementById('center-text-button').addEventListener('click', function() {
    if (currentlyEditedTextElement) {
        centerObject(currentlyEditedTextElement.parentNode);
        updateCenterButtonState(currentlyEditedTextElement.parentNode);
    }
});



// Layer control for text
document.getElementById('move-text-forward').addEventListener('click', function() {
    if (currentlyEditedTextElement) {
        moveLayerForward(currentlyEditedTextElement.parentNode);
    }
});

document.getElementById('move-text-backward').addEventListener('click', function() {
    if (currentlyEditedTextElement) {
        moveLayerBackward(currentlyEditedTextElement.parentNode);
    }
});

// Flip text
document.getElementById('flip-text-horizontal').addEventListener('click', function() {
    if (currentlyEditedTextElement) {
        toggleTransform(currentlyEditedTextElement, 'scaleX(-1)');
    }
});

document.getElementById('flip-text-vertical').addEventListener('click', function() {
    if (currentlyEditedTextElement) {
        toggleTransform(currentlyEditedTextElement, 'scaleY(-1)');
    }
});

// Duplicate text
document.getElementById('duplicate-text').addEventListener('click', function() {
    if (currentlyEditedTextElement) {
        const originalContainer = currentlyEditedTextElement.parentNode;
        const clonedContainer = originalContainer.cloneNode(true);
        const clonedTextElement = clonedContainer.querySelector('p');

        // Reset the position of the cloned container
        clonedContainer.style.left = (parseFloat(originalContainer.style.left) + 20) + 'px';
        clonedContainer.style.top = (parseFloat(originalContainer.style.top) + 20) + 'px';

        // Ensure unique ids for the cloned elements if needed
        clonedContainer.id = '';
        clonedTextElement.id = '';

        // Add the cloned container to the canvas
        canvas.appendChild(clonedContainer);

        // Setup interactions for the cloned text
        setupTextInteractions(clonedContainer, clonedTextElement,
            clonedContainer.querySelector('.resize-handle'),
            clonedContainer.querySelector('.delete-handle'));

        // Update layer buttons
        updateLayerButtons(clonedContainer);

        // Set the cloned container as the selected container
        selectedImageContainer = clonedContainer;
        currentlyEditedTextElement = clonedTextElement;


    }
});
function updateFlipButtonsState(element) {
    const transform = element.style.transform || '';
    const horizontalFlipButton = document.getElementById('flip-text-horizontal');
    const verticalFlipButton = document.getElementById('flip-text-vertical');

    horizontalFlipButton.classList.toggle('active', transform.includes('scaleX(-1)'));
    verticalFlipButton.classList.toggle('active', transform.includes('scaleY(-1)'));
}

function toggleTransform(element, transform) {
    let currentTransform = element.style.transform || '';
    if (currentTransform.includes(transform)) {
        currentTransform = currentTransform.replace(transform, '');
    } else {
        currentTransform += ` ${transform}`;
    }
    element.style.transform = currentTransform.trim();
    updateFlipButtonsState(element);
        captureCanvasState();

}
// Function to capture the current state of the canvas
function captureCanvasState() {
    const state = {
        html: canvas.innerHTML,
        objects: Array.from(canvas.children).map(child => ({
            rect: child.getBoundingClientRect(),
            style: child.getAttribute('style'),
            innerHTML: child.innerHTML
        }))
    };

    if (currentStateIndex < canvasStates.length - 1) {
        canvasStates = canvasStates.slice(0, currentStateIndex + 1);
    }

    canvasStates.push(state);
    currentStateIndex++;

    if (canvasStates.length > MAX_STATES) {
        canvasStates.shift();
        currentStateIndex--;
    }

    updateUndoRedoButtons();
}

// Function to apply a captured state to the canvas
function applyCanvasState(state) {
    canvas.innerHTML = state.html;
    state.objects.forEach((obj, index) => {
        const child = canvas.children[index];
        child.setAttribute('style', obj.style);
    });
    reattachEventListeners();
}

// Undo function
function undo() {
    if (currentStateIndex > 0) {
        currentStateIndex--;
        applyCanvasState(canvasStates[currentStateIndex]);
        updateUndoRedoButtons();
    }
}

// Redo function
function redo() {
    if (currentStateIndex < canvasStates.length - 1) {
        currentStateIndex++;
        applyCanvasState(canvasStates[currentStateIndex]);
        updateUndoRedoButtons();
    }
}

// Update undo/redo buttons
function updateUndoRedoButtons() {
    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');

    undoButton.classList.toggle('disabled', currentStateIndex <= 0);
    redoButton.classList.toggle('disabled', currentStateIndex >= canvasStates.length - 1);
}

// Event listeners for undo and redo buttons
document.getElementById('undo-button').addEventListener('click', undo);
document.getElementById('redo-button').addEventListener('click', redo);