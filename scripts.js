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
    let currentScreen = 'default';
    let SfrontImageURL = "", SbackImageURL = "";
    let SfrontImageURLGraphic = "", SbackImageURLGraphic = "";
    let availableSizes = [];
        let selectedType1;
        let printComment1;
    let selectedColors = [];
    let previousScreen = null;

    let currentPrintId = null;

    let hasAddedToCart = false;


    let currentlySelectedColor = '';
        let availableColors = [];
        let colorQuantities = {};
    let savedDescriptions = [];
    const MAX_SAVED_DESCRIPTIONS = 30;
    let savedDesigns = [];
    const MAX_SAVED_DESIGNS = 30;
    let existingPrintIds = new Set();
    let isEditMode = false;
    let currentEditPrintId = null;
    let isEditingExisting = false;
    let currentEditingPrintId = null;
    let sizeScreen;
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
    let copiedObjectData = null;
    let currentCanvas = document.getElementById('front-canvas');
    const frontCanvas = document.getElementById('front-canvas');

    const backCanvas = document.getElementById('back-canvas');
    const frontButton = document.getElementById('front-button');
    const backButton = document.getElementById('back-button');
    let frontCanvasStates = [];
    let backCanvasStates = [];
    let frontCurrentStateIndex = -1;
    let backCurrentStateIndex = -1;
    document.addEventListener('contextmenu', function(event) {
      event.preventDefault();
        const clickedOnImage = event.target.closest('.image-container');
        const clickedOnText = event.target.closest('.text-container');
        const hasObjectsOnCanvas = currentCanvas.querySelector('.image-container, .text-container') !== null;

        contextMenu.style.display = 'block';

        // Disable or enable menu items based on context
        const menuItems = contextMenu.querySelectorAll('.context-menu-item');
        menuItems.forEach(item => {
            if (item.id === 'paste-image') {
                // Always enable paste if there's copied data
        item.classList.toggle('disabled', !copiedObjectData);
            } else if (item.id === 'cut-image') {
                // Disable cut option for text elements
        item.classList.toggle('disabled', !clickedOnImage);
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
    document.querySelector('.cloud-upload').addEventListener('click', function(event) {
       if (screen1.classList.contains('active')) {
        event.preventDefault(); // Prevent the default file upload behavior
        }
        showScreen(screen2); // Show the second screen
    });


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
        currentCanvas.appendChild(imgContainer);
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
      currentCanvas.appendChild(imgContainer);

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

        const containerRect = currentCanvas.getBoundingClientRect();
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

    imgContainer.addEventListener('dragstart', function(event) {
        event.preventDefault();
    });

    imgContainer.addEventListener('mousedown', startDragging);
    imgContainer.addEventListener('touchstart', startDragging);

    function startDragging(event) {
        if (event.target === img && !isResizing) {
            deselectAllObjects();
            isDragging = true;
            imgContainer.classList.add('selected');
            startX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            startY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
            startLeft = imgContainer.offsetLeft;
            startTop = imgContainer.offsetTop;
            img.style.cursor = 'grabbing';
            imgContainer.style.border = '2px solid #000';
            resizeHandle.style.display = 'block';
            deleteHandle.style.display = 'block';
        }
        event.preventDefault();
    }

    function drag(event) {
        if (isDragging && !isResizing) {
            const clientX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            const clientY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
            const dx = clientX - startX;
            const dy = clientY - startY;
            const newLeft = startLeft + dx;
            const newTop = startTop + dy;

            const maxX = currentCanvas.clientWidth - imgContainer.offsetWidth;
            const maxY = currentCanvas.clientHeight - imgContainer.offsetHeight;

            imgContainer.style.left = Math.max(0, Math.min(newLeft, maxX)) + 'px';
            imgContainer.style.top = Math.max(0, Math.min(newTop, maxY)) + 'px';
            updateCenterButtonState(imgContainer);
        } else if (isResizing) {
            const clientX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            const clientY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
            const dx = clientX - startX;
            const dy = clientY - startY;

            let newWidth = startWidth + dx;
            let newHeight = startHeight + dy;

            if (newWidth / newHeight > aspectRatio) {
                newWidth = newHeight * aspectRatio;
            } else {
                newHeight = newWidth / aspectRatio;
            }

            const maxWidth = currentCanvas.clientWidth - imgContainer.offsetLeft;
            const maxHeight = currentCanvas.clientHeight - imgContainer.offsetTop;

            newWidth = Math.min(newWidth, maxWidth);
            newHeight = Math.min(newHeight, maxHeight);

            newWidth = Math.max(newWidth, 50);
            newHeight = Math.max(newHeight, 50);

            img.style.width = newWidth + 'px';
            img.style.height = newHeight + 'px';
        }
    }

    function endDragging() {
        if (isDragging || isResizing) {
            captureCanvasState();
        }
        isDragging = false;
        isResizing = false;
        img.style.cursor = 'grab';

        const centerOption = document.getElementById('center-image');
        if (isImageCentered(imgContainer)) {
            centerOption.classList.add('disabled');
        } else {
            centerOption.classList.remove('disabled');
        }
    }

    resizeHandle.addEventListener('mousedown', startResizing);
    resizeHandle.addEventListener('touchstart', startResizing);

    function startResizing(event) {
        isResizing = true;
        isDragging = false;
        startX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
        startY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;
        event.stopPropagation();
        event.preventDefault();
    }

    deleteHandle.addEventListener('click', deleteImage);
    deleteHandle.addEventListener('touchend', deleteImage);

    function deleteImage(event) {
        currentCanvas.removeChild(imgContainer);
        captureCanvasState();
        event.stopPropagation();
    }

    imgContainer.addEventListener('mouseenter', showBorder);
    imgContainer.addEventListener('mouseleave', hideBorder);

    function showBorder() {
        if (!imgContainer.classList.contains('selected')) {
            imgContainer.style.border = '2px dashed #000';
        }
    }

    function hideBorder() {
        if (!imgContainer.classList.contains('selected')) {
            imgContainer.style.border = 'none';
        }
    }

    imgContainer.addEventListener('click', selectImage);
    imgContainer.addEventListener('touchend', selectImage);

    function selectImage(event) {
        event.stopPropagation();
        deselectAllObjects();
        imgContainer.classList.add('selected');
        imgContainer.style.border = '2px solid #000';
        resizeHandle.style.display = 'block';
        deleteHandle.style.display = 'block';

        const imgWidth = img.offsetWidth;
        const imgHeight = img.offsetHeight;

        const sizeDisplay = document.getElementById('image-size');
        sizeDisplay.textContent = `${imgWidth}px x ${imgHeight}px`;

        showScreen(screen4);
        selectedImageContainer = imgContainer;
        updateLayerButtons(selectedImageContainer);

        const isBackgroundRemoved = imgContainer.getAttribute('data-background-removed') === 'true';
        backgroundRemovalToggle.checked = isBackgroundRemoved;
    }

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);

    document.addEventListener('mouseup', endDragging);
    document.addEventListener('touchend', endDragging);
} document.addEventListener('click', function(event) {
      if (contextMenu.style.display === 'block') {
        contextMenu.style.display = 'none';
      }
    });

    centerImage.addEventListener('click', function() {
        if (selectedImageContainer && !this.classList.contains('disabled') && selectedImageContainer.classList.contains('image-container')) {
            const canvasRect = currentCanvas.getBoundingClientRect();
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
            const canvasRect = currentCanvas.getBoundingClientRect();
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
        if (screenToShow.id === 'design-screen') {
            showDesignScreen();
        } else {
            [screen1, screen2, screen3, screen4, screen5, screen6].forEach(screen => screen.classList.remove('active'));
            screenToShow.classList.add('active');
        }

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
        const activeScreen = document.querySelector('#design-screen .white-square .screen.active');
        if (activeScreen &&
            (activeScreen.id === 'screen2' || activeScreen.id === 'screen3' ||
             activeScreen.id === 'screen4' || activeScreen.id === 'screen5' || activeScreen.id === 'screen6')) {
            if (!event.target.closest('.white-square') &&
                !event.target.closest('.image-container') &&
                !event.target.closest('.text-container')) {
                showScreen('screen1');
                document.querySelectorAll('.black-strip-option').forEach(option => {
                    option.classList.remove('clicked');
                });
            }
        }
    });
    function removeBackground(imgElement) {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = imgElement.naturalWidth;
        tempCanvas.height = imgElement.naturalHeight;
        ctx.drawImage(imgElement, 0, 0);

        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
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
        return tempCanvas.toDataURL();
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
               const containerRect = currentCanvas.getBoundingClientRect();
               const imgRect = selectedImageContainer.getBoundingClientRect();
               selectedImageContainer.style.left = (containerRect.width / 2 - imgRect.width / 2) + 'px';
               updateCenterButtonState(selectedImageContainer);

           }
       });
    const layerControl = document.getElementById('layer-control');
    function updateLayerButtons(imgContainer) {
        const layerState = imgContainer.getAttribute('data-layer-state');
        const isTopLayer = imgContainer === currentCanvas.lastElementChild;
        const isBottomLayer = imgContainer === currentCanvas.firstElementChild;

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
            currentCanvas.insertBefore(imgContainer.nextElementSibling, imgContainer);
            updateLayerButtons(imgContainer);

        }
            captureCanvasState();

    }

    function moveLayerBackward(imgContainer) {
        if (imgContainer.previousElementSibling) {
            currentCanvas.insertBefore(imgContainer, imgContainer.previousElementSibling);
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
            currentCanvas.appendChild(clonedContainer);

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
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;

        // Draw the cropped portion of the image onto the canvas, scaling it to fit
        ctx.drawImage(img,
            cropX, cropY, cropWidth, cropHeight,  // Source rectangle
            0, 0, tempCanvas.width, tempCanvas.height);   // Destination rectangle (full canvas)

        // Update the image source with the new canvas content
        img.src = tempCanvas.toDataURL();

        // Store the cropped image data
        img.setAttribute('data-cropped-src', tempCanvas.toDataURL());

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
            currentCanvas.removeChild(selectedImageContainer);
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
        const contextPasteItem = contextMenu.querySelector('#paste-image');

        if (copiedObjectData) {
            pasteButton.classList.remove('disabled');
            contextPasteItem.classList.remove('disabled');
        } else {
            pasteButton.classList.add('disabled');
            contextPasteItem.classList.add('disabled');
        }

        // Update other context menu items based on whether there are objects on the canvas
        const hasObjects = currentCanvas.querySelector('.image-container, .text-container') !== null;
        const otherMenuItems = contextMenu.querySelectorAll('.context-menu-item:not(#paste-image)');
        otherMenuItems.forEach(item => {
            item.classList.toggle('disabled', !hasObjects);
        });
    }

    updatePasteButtonState();


    copyImage.addEventListener('click', function() {
        if (selectedImageContainer) {
            copiedObjectData = selectedImageContainer.cloneNode(true);
            contextMenu.style.display = 'none';
            updatePasteButtonState();
        }
    });

    pasteImage.addEventListener('click', function() {
        if (copiedObjectData) {
            const clonedContainer = copiedObjectData.cloneNode(true);

            // Reset the position of the cloned container
            clonedContainer.style.left = (parseFloat(clonedContainer.style.left) + 20) + 'px';
            clonedContainer.style.top = (parseFloat(clonedContainer.style.top) + 20) + 'px';

            // Ensure unique ids for the cloned elements if needed
            clonedContainer.id = '';
            const innerElement = clonedContainer.querySelector('img, p');
            if (innerElement) innerElement.id = '';

            // Add the cloned container to the canvas
            currentCanvas.appendChild(clonedContainer);

            // Setup interactions for the cloned object
            if (clonedContainer.classList.contains('image-container')) {
                setupImageInteractions(
                    clonedContainer,
                    clonedContainer.querySelector('img'),
                    clonedContainer.querySelector('.resize-handle'),
                    clonedContainer.querySelector('.delete-handle'),
                    clonedContainer.querySelector('img').getAttribute('data-original-src')
                );
            } else if (clonedContainer.classList.contains('text-container')) {
                setupTextInteractions(
                    clonedContainer,
                    clonedContainer.querySelector('p'),
                    clonedContainer.querySelector('.resize-handle'),
                    clonedContainer.querySelector('.delete-handle')
                );
            }

            // Update layer buttons
            updateLayerButtons(clonedContainer);

            // Set the cloned container as the selected container
            selectedImageContainer = clonedContainer;

           contextMenu.style.display = 'none';
            updatePasteButtonState();
            captureCanvasState();
        }
    });function isImageCentered(imgContainer) {
        const containerRect = currentCanvas.getBoundingClientRect();
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
        return currentCanvas.querySelector('.image-container, .text-container') !== null;
    }

    function updateCanvasState() {
        updatePasteButtonState();
        updateUndoRedoButtons();

        // If there are no objects left, return to the main screen
        if (!hasObjectsOnCanvas() && !screen1.classList.contains('active')) {
            showScreen(screen1);
        }
    }

    function reattachEventListeners() {
        [frontCanvas, backCanvas].forEach(canvas => {
            // Reattach event listeners for image containers
            const imageContainers = canvas.querySelectorAll('.image-container');
            imageContainers.forEach(container => {
                const img = container.querySelector('img');
                const resizeHandle = container.querySelector('.resize-handle');
                const deleteHandle = container.querySelector('.delete-handle');
                setupImageInteractions(container, img, resizeHandle, deleteHandle, img.getAttribute('data-original-src'));
            });

            // Reattach event listeners for text containers
            const textContainers = canvas.querySelectorAll('.text-container');
            textContainers.forEach(container => {
                const textElement = container.querySelector('p');
                const resizeHandle = container.querySelector('.resize-handle');
                const deleteHandle = container.querySelector('.delete-handle');
                setupTextInteractions(container, textElement, resizeHandle, deleteHandle);
            });

            // Ensure the canvas is clickable
            canvas.addEventListener('click', handleCanvasClick);
        });

        // Reattach other necessary event listeners
        document.getElementById('upload').addEventListener('change', handleFileSelection);
     document.querySelector('.add-text').addEventListener('click', function() {
            showScreen(screen3); // Assuming screen3 is your text input screen
        });    document.getElementById('add-to-design-button').addEventListener('click', addTextToDesign);

        // Update undo/redo buttons
        updateUndoRedoButtons();

    }
    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');



    // Get references to the elements
    const addTextButton = document.querySelector('.add-text');
    const textInput = document.getElementById('text-input');
    const addToDesignButton = document.getElementById('add-to-design-button');
function addTextToDesign() {
    const textToAdd = textInput.value;
    if (textToAdd.trim() !== '') {
        createTextObject(textToAdd);
        showScreen(screen1); // Return to the main screen after adding text
    }
}
textInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default form submission
        addTextToDesign();
    }
});
    // Add event listener for the "Add Text" button on the first screen
    addTextButton.addEventListener('click', function() {
        showScreen(screen3);
        setClickedOption(blackStripAddText);
            document.getElementById('text-input').focus();

    });

    // Clear the input field when showing screen3

    // For now, we'll just log the entered text when the "Add To Design" button is clicked
addToDesignButton.addEventListener('click', addTextToDesign);
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
        textElement.dataset.outlineStrength = '1'; // Set default to '1' which corresponds to 'דק'



        const resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle');

        const deleteHandle = document.createElement('div');
        deleteHandle.classList.add('delete-handle');

        textContainer.appendChild(textElement);
        textContainer.appendChild(resizeHandle);
        textContainer.appendChild(deleteHandle);

       currentCanvas.appendChild(textContainer);
        captureCanvasState();

        setupTextInteractions(textContainer, textElement, resizeHandle, deleteHandle);
            applyTextOutline(textElement); // Apply the default outline


    }




function setupTextInteractions(textContainer, textElement, resizeHandle, deleteHandle) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop, startFontSize;
    let currentFontSize = parseInt(window.getComputedStyle(textElement).fontSize);
    textContainer.style.cursor = 'grab';
    textElement.style.cursor = 'grab';

    textContainer.addEventListener('mousedown', startDragging);
    textContainer.addEventListener('touchstart', startDragging);

    function startDragging(event) {
        if (!isResizing) {
            deselectAllObjects();
            isDragging = true;
            startX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            startY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
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
    }

    function drag(event) {
        if (isDragging && !isResizing) {
            const clientX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            const clientY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
            const dx = clientX - startX;
            const dy = clientY - startY;
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;
            const canvasRect = currentCanvas.getBoundingClientRect();
            const textRect = textContainer.getBoundingClientRect();

            const leftOffset = -0.5 * textRect.width;
            const topOffset = -0.5 * textRect.height;
            const rightOffset = 0.5 * textRect.width - 4;
            const bottomOffset = 0.5 * textRect.height - 4;

            const minLeft = -leftOffset;
            const maxLeft = canvasRect.width - textRect.width + rightOffset;
            const minTop = -topOffset;
            const maxTop = canvasRect.height - textRect.height + bottomOffset;

            newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
            newTop = Math.max(minTop, Math.min(newTop, maxTop));
            textContainer.style.left = newLeft + 'px';
            textContainer.style.top = newTop + 'px';
        } else if (isResizing) {
            const clientX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            const clientY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
            const dx = clientX - startX;
            const dy = clientY - startY;

            const diagonalDistance = Math.sqrt(dx * dx + dy * dy);
            const direction = dx + dy > 0 ? 1 : -1;
            let newFontSize = Math.max(10, startFontSize + direction * diagonalDistance * 0.6);

            const originalWidth = textContainer.offsetWidth;
            const originalHeight = textContainer.offsetHeight;

            textElement.style.fontSize = newFontSize + 'px';

            const canvasRect = currentCanvas.getBoundingClientRect();
            const textRect = textContainer.getBoundingClientRect();

            if (textRect.left < canvasRect.left ||
                textRect.right > canvasRect.right ||
                textRect.top < canvasRect.top ||
                textRect.bottom > canvasRect.bottom) {
                textElement.style.fontSize = currentFontSize + 'px';
            } else {
                currentFontSize = newFontSize;
                textElement.style.fontSize = currentFontSize + 'px';

                const deltaWidth = textContainer.offsetWidth - originalWidth;
                const deltaHeight = textContainer.offsetHeight - originalHeight;

                textContainer.style.left = (startLeft) + 'px';
                textContainer.style.top = (startTop) + 'px';
            }
        }
    }

    function endDragging() {
        if (isDragging || isResizing) {
            captureCanvasState();
        }
        isDragging = false;
        isResizing = false;
        textContainer.style.cursor = 'grab';
        textElement.style.cursor = 'grab';
    }

    resizeHandle.addEventListener('mousedown', startResizing);
    resizeHandle.addEventListener('touchstart', startResizing);

    function startResizing(event) {
        isResizing = true;
        isDragging = false;
        startX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
        startY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
        currentFontSize = parseInt(window.getComputedStyle(textElement).fontSize);
        startFontSize = currentFontSize;
        startLeft = textContainer.offsetLeft;
        startTop = textContainer.offsetTop;
        event.stopPropagation();
        event.preventDefault();
    }

    deleteHandle.addEventListener('click', deleteText);
    deleteHandle.addEventListener('touchend', deleteText);

    function deleteText() {
        currentCanvas.removeChild(textContainer);
        captureCanvasState();

        if (currentlyEditedTextElement === textElement) {
            currentlyEditedTextElement = null;
        }

        if (selectedImageContainer === textContainer) {
            selectedImageContainer = null;
        }

        if (screen5.classList.contains('active')) {
            showScreen(screen1);
        }

        updateCanvasState();
    }

    textContainer.addEventListener('mouseenter', showBorder);
    textContainer.addEventListener('mouseleave', hideBorder);

    function showBorder() {
        if (!textContainer.classList.contains('selected')) {
            textContainer.style.border = '2px dashed #000';
            textContainer.style.cursor = 'grab';
        }
    }

    function hideBorder() {
        if (!textContainer.classList.contains('selected')) {
            textContainer.style.border = 'none';
            textContainer.style.cursor = 'default';
            textElement.style.cursor = 'default';
        }
    }

    textContainer.addEventListener('click', selectText);
    textContainer.addEventListener('touchend', selectText);

    function selectText(event) {
        event.stopPropagation();
        deselectAllObjects();
        textContainer.classList.add('selected');
        textContainer.style.border = '2px solid #000';
        resizeHandle.style.display = 'block';
        deleteHandle.style.display = 'block';
        showTextEditScreen(textElement);
    }

    textElement.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);

    document.addEventListener('mouseup', endDragging);
    document.addEventListener('touchend', endDragging);
} let currentlyEditedTextElement = null;
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
        outlineThicknessSelector.value = textElement.dataset.outlineStrength || '1';
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
            const emStrength = outlineStrength / 300; // Convert 0-5 range to 0-0.25em
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
        const canvasRect = currentCanvas.getBoundingClientRect();
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
    const allObjects = currentCanvas.querySelectorAll('.image-container, .text-container');
    allObjects.forEach(obj => {
        obj.classList.remove('selected');
        obj.style.border = 'none';
        const resizeHandle = obj.querySelector('.resize-handle');
        const deleteHandle = obj.querySelector('.delete-handle');
        if (resizeHandle) resizeHandle.style.display = 'none';
        if (deleteHandle) deleteHandle.style.display = 'none';
    });
}
    currentCanvas.addEventListener('click', function(event) {
        // Check if the click is directly on the canvas and not on any object
        if (event.target === currentCanvas) {
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
            currentCanvas.appendChild(clonedContainer);

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
            html: currentCanvas.innerHTML,
            objects: Array.from(currentCanvas.children).map(child => ({
                rect: child.getBoundingClientRect(),
                style: child.getAttribute('style'),
                innerHTML: child.innerHTML
            }))
        };

        if (currentCanvas === frontCanvas) {
            if (frontCurrentStateIndex < frontCanvasStates.length - 1) {
                frontCanvasStates = frontCanvasStates.slice(0, frontCurrentStateIndex + 1);
            }
            frontCanvasStates.push(state);
            frontCurrentStateIndex++;
        } else {
            if (backCurrentStateIndex < backCanvasStates.length - 1) {
                backCanvasStates = backCanvasStates.slice(0, backCurrentStateIndex + 1);
            }
            backCanvasStates.push(state);
            backCurrentStateIndex++;
        }

        updateUndoRedoButtons();
    }

    // Function to apply a captured state to the canvas
    function applyCanvasState(state) {
        currentCanvas.innerHTML = state.html;
        state.objects.forEach((obj, index) => {
            const child = currentCanvas.children[index];
            child.setAttribute('style', obj.style);
        });
        reattachEventListeners();
    }

    // Undo function
    function undo() {
        if (currentCanvas === frontCanvas && frontCurrentStateIndex > 0) {
            frontCurrentStateIndex--;
            applyCanvasState(frontCanvasStates[frontCurrentStateIndex]);
        } else if (currentCanvas === backCanvas && backCurrentStateIndex > 0) {
            backCurrentStateIndex--;
            applyCanvasState(backCanvasStates[backCurrentStateIndex]);
        }
        updateUndoRedoButtons();
    }

    function redo() {
        if (currentCanvas === frontCanvas && frontCurrentStateIndex < frontCanvasStates.length - 1) {
            frontCurrentStateIndex++;
            applyCanvasState(frontCanvasStates[frontCurrentStateIndex]);
        } else if (currentCanvas === backCanvas && backCurrentStateIndex < backCanvasStates.length - 1) {
            backCurrentStateIndex++;
            applyCanvasState(backCanvasStates[backCurrentStateIndex]);
        }
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        const undoButton = document.getElementById('undo-button');
        const redoButton = document.getElementById('redo-button');

        if (currentCanvas === frontCanvas) {
            undoButton.classList.toggle('disabled', frontCurrentStateIndex <= 0);
            redoButton.classList.toggle('disabled', frontCurrentStateIndex >= frontCanvasStates.length - 1);
        } else {
            undoButton.classList.toggle('disabled', backCurrentStateIndex <= 0);
            redoButton.classList.toggle('disabled', backCurrentStateIndex >= backCanvasStates.length - 1);
        }
    }

    // Event listeners for undo and redo buttons
    document.getElementById('undo-button').addEventListener('click', undo);
    document.getElementById('redo-button').addEventListener('click', redo);
    document.addEventListener('DOMContentLoaded', function() {
        const frontButton = document.getElementById('front-button');
        const backButton = document.getElementById('back-button');

        frontButton.addEventListener('click', function() {
            switchCanvas(frontCanvas);
        });

        backButton.addEventListener('click', function() {
            switchCanvas(backCanvas);
        });

        // Set initial background
        updateBackgroundAndButtons();
    });
    function switchCanvas(newCanvas) {
        currentCanvas.style.display = 'none';
        newCanvas.style.display = 'block';
        currentCanvas = newCanvas;
        updateBackgroundAndButtons();
        updateCanvasState();
        reattachEventListeners();
    }



    document.addEventListener('DOMContentLoaded', function() {
        const goBackButton = document.getElementById('go-back-button');

        const designMyselfButton = document.getElementById('design-myself');
        designMyselfButton.addEventListener('click', function() {
            showDesignScreen();
            // Ensure the main-container is visible and sized correctly
            document.querySelector('.main-container').style.display = 'flex';
            document.querySelector('.main-container').style.height = '100vh';
        });
        goBackButton.addEventListener('click', function() {

            showDefaultScreen();
        });
        // Show the default screen initially
        showDefaultScreen();
        // Show the default screen initially
        showDefaultScreen();
        const getPriceButton = document.getElementById('get-price-button');

    });

function captureDivToImageURL(div) {
    // Store the original display style
    const originalDisplay = div.style.display;

    // Make the div visible temporarily if it's hidden
    if (originalDisplay === 'none') {
        div.style.display = 'block';
    }

    // Remove selection and hover effects
    const selectedElements = div.querySelectorAll('.selected, .image-container:hover, .text-container:hover');
    selectedElements.forEach(el => {
        el.classList.remove('selected');
        el.style.border = 'none';
    });

    return html2canvas(div, {
        backgroundColor: null, // This ensures our custom background is used
        scale: 2, // Increase resolution
        logging: false, // Disable logging
        useCORS: true // Try to load images from other domains
    }).then(renderedCanvas => {
        // Restore the original display style
        div.style.display = originalDisplay;

        // Restore selection and hover effects
        selectedElements.forEach(el => {
            el.classList.add('selected');
            el.style.border = '2px solid #000';
        });

        // Find the bounding box of non-transparent pixels
        const ctx = renderedCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, renderedCanvas.width, renderedCanvas.height);
        const bounds = findContentBounds(imageData);

        // Crop the canvas to the content
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = bounds.width;
        croppedCanvas.height = bounds.height;
        const croppedCtx = croppedCanvas.getContext('2d');

        // Draw background
        croppedCtx.fillStyle = currentlySelectedColor && currentlySelectedColor !== 'לבן'
            ? getColorHex(currentlySelectedColor)
            : '#FFFFFF';
        croppedCtx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);

        // Draw cropped content
        croppedCtx.drawImage(renderedCanvas,
            bounds.left, bounds.top, bounds.width, bounds.height,
            0, 0, bounds.width, bounds.height
        );

        return croppedCanvas.toDataURL('image/png');
    });
}

function findContentBounds(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = imageData.data[(y * width + x) * 4 + 3];
            if (alpha !== 0) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    // Add padding
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);

    return {
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}    function getColorHex(colorName) {
        const colorMap = {
            'שחור': '#000000',
            'כחול כהה': '#0e0b22',
            'כחול': '#232fc4',
            'תכלת': '#aaf0ff',
            'אפור': '#a8a8a8',
            'שמנת': '#dbc49e',
            'ירוק כהה': '#03342a',
            'ירוק זית': '#3f4223',
            'ירוק': '#5bd137',
            'בורדו': '#990707',
            'אדום': '#ff0000',
            'ורוד': '#ffd2f8',
            'סגול': '#64347b',
            'צהוב': '#c7d824',
            'כתום': '#dd630a'

        };
        return colorMap[colorName] || '#FFFFFF'; // Default to white if color not found
    }
    function showDefaultScreen() {
        hasAddedToCart = false;

        currentScreen = 'default';
        document.getElementById('default-screen').style.display = 'flex';
        document.getElementById('previous-designs-screen').style.display = 'none';
        const defaultScreen = document.getElementById('default-screen');
        defaultScreen.style.display = 'flex';
        document.getElementById('design-screen').style.display = 'none';
        document.getElementById('next-step-screen').style.display = 'none';
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = 'white';

        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.display = 'none';
            mainContainer.style.height = 'auto';
        }

        // Display saved designs
        displaySavedDesigns();
    }

    function showDesignScreen() {
        hasAddedToCart = false;

        setBackgroundImages(currentlySelectedColor);
        currentScreen = 'design';
        document.getElementById('default-screen').style.display = 'none';
        document.getElementById('size-selection-screen').style.display = 'none';
        document.getElementById('next-step-screen').style.display = 'none';
        document.getElementById('previous-designs-screen').style.display = 'none';
        document.getElementById('design-screen').style.display = 'flex';

        // Ensure the main-container is visible and sized correctly
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.display = 'flex';
            mainContainer.style.height = '100vh';
        }

        showScreen('screen1');
        if (isEditMode) {
            hideGoBackButton();
        }

        // Make sure the front canvas is displayed
        frontCanvas.style.display = 'block';
        backCanvas.style.display = 'none';
        currentCanvas = frontCanvas;

        // Set the correct background
        updateBackgroundAndButtons();

        // Update UI elements
        updateUndoRedoButtons();

        // Reattach event listeners
        reattachEventListeners();
    }
    function updateBackgroundAndButtons() {
        const frontButton = document.getElementById('front-button');
        const backButton = document.getElementById('back-button');
        const mainContainer = document.getElementById('main-container');

        const frontBackground = getBackgroundUrl(true, currentlySelectedColor);
        const backBackground = getBackgroundUrl(false, currentlySelectedColor);

        if (currentCanvas === frontCanvas) {
            mainContainer.style.backgroundImage = `url('${frontBackground}')`;
            frontButton.classList.add('selected');
            backButton.classList.remove('selected');
        } else {
            mainContainer.style.backgroundImage = `url('${backBackground}')`;
            backButton.classList.add('selected');
            frontButton.classList.remove('selected');
        }

        // Update the data-background attributes
        frontButton.setAttribute('data-background', frontBackground);
        backButton.setAttribute('data-background', backBackground);
    }
    function updateFrontBackButtons() {
        const frontButton = document.getElementById('front-button');
        const backButton = document.getElementById('back-button');

        frontButton.classList.toggle('selected', currentCanvas === frontCanvas);
        backButton.classList.toggle('selected', currentCanvas === backCanvas);
    }
    // Update the showScreen function
    function showScreen(screenToShow) {
        // First, make sure we're in the design screen
        if (document.getElementById('default-screen').style.display !== 'none') {
            showDesignScreen();
        }

        // Hide all screens within the white square
        document.querySelectorAll('#design-screen .white-square .screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show the requested screen
        if (typeof screenToShow === 'string') {
            screenToShow = document.getElementById(screenToShow);
        }
        screenToShow.classList.add('active');

        // Special handling for screen1
        if (screenToShow.id === 'screen1') {
            document.querySelectorAll('.black-strip-option').forEach(option => {
                option.classList.remove('clicked');
            });
        }

        // Clear input fields for specific screens
        if (screenToShow.id === 'screen3' || screenToShow.id === 'screen5') {
            const textInput = screenToShow.querySelector('.text-input');
            if (textInput) {
                textInput.value = '';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        const getPriceButton = document.getElementById('get-price-button');
        const backToDesignButton = document.getElementById('back-to-design');
        const proceedToNextButton = document.getElementById('proceed-to-next');
        const commentTextarea = document.getElementById('comment');
        const noPrintsButton = document.getElementById('no-prints');
        const graphicButton = document.getElementById('choose-image');

        // Load saved comment when the page loads
        const savedComment = localStorage.getItem('userComment');
        if (savedComment) {
            commentTextarea.value = savedComment;
        }
        noPrintsButton.addEventListener('click', function() {
            sizeScreen = "noPrints";
            document.getElementById('default-screen').style.display = 'none';
            document.getElementById('size-selection-screen').style.display = 'flex';
            initializeSizeSelectionScreen;
        });
       graphicButton.addEventListener('click', function() {
            sizeScreen = "graphic";
            document.getElementById('default-screen').style.display = 'none';
            document.getElementById('image-upload-screen').style.display = 'flex';
        });
        // Save comment whenever it changes
        commentTextarea.addEventListener('input', function() {
            localStorage.setItem('userComment', this.value);
        });

    getPriceButton.addEventListener('click', function() {
        // Deselect all objects
        deselectAllObjects();

        Promise.all([
            captureDivToImageURL(document.getElementById('front-canvas')),
            captureDivToImageURL(document.getElementById('back-canvas'))
        ]).then(([frontImageURL, backImageURL]) => {
            SfrontImageURL = frontImageURL;
            SbackImageURL = backImageURL;
            showNextStepScreen();
        });
    });

        backToDesignButton.addEventListener('click', function() {
            hideNextStepScreen();
            showDesignScreen();
        });

        proceedToNextButton.addEventListener('click', function() {
        });
            loadSavedDesigns();
        displaySavedDesigns();

    });

    function showNextStepScreen() {
        currentScreen = 'nextStep';
        document.getElementById('design-screen').style.display = 'none';
        const nextStepScreen = document.getElementById('next-step-screen');
        nextStepScreen.style.display = 'flex';

        document.getElementById('front-preview').src = SfrontImageURL;
        document.getElementById('back-preview').src = SbackImageURL;

        const commentTextarea = document.getElementById('comment');

        if (isEditMode) {
            document.querySelector('#next-step-screen h1').textContent = 'האם אתה בטוח שאתה רוצה לשנות את ההדפסה?';
            document.getElementById('proceed-to-next').textContent = 'ערוך הדפסה';

            // Load the saved comment for the current design
            const currentDesign = savedDesigns.find(d => d.printId === currentEditPrintId);
            if (currentDesign && currentDesign.comment) {
                commentTextarea.value = currentDesign.comment;
            } else {
                commentTextarea.value = '';
            }
        } else {
            document.querySelector('#next-step-screen h1').textContent = 'הוספת הערה לעיצוב';
            document.getElementById('proceed-to-next').textContent = 'המשך לשלב הבא';

            // Load the saved comment from localStorage
            const savedComment = localStorage.getItem('userComment');
            if (savedComment) {
                commentTextarea.value = savedComment;
            } else {
                commentTextarea.value = '';
            }
        }
    }
    function hideNextStepScreen() {
        document.getElementById('next-step-screen').style.display = 'none';
        if (!isEditMode) {
            showDesignScreen();
        }
    }
    // Function to clear saved comment (use when needed, e.g., after order completion)
    function clearSavedComment() {
        localStorage.removeItem('userComment');
        document.getElementById('comment').value = '';
    }

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const sizeRowsContainer = document.getElementById('size-rows');
    const totalQuantityElement = document.getElementById('total-quantity');


    function initializeSizeSelectionScreen() {
        selectedColors = [selectedColor];
        currentlySelectedColor = selectedColor;
        colorQuantities = { [selectedColor]: {} };
        updateColorButtons();
        updateSizeRows();
        updateAddColorButton();
    }
    function setupColorDropdown(remainingColors) {
        const dropdown = document.getElementById('color-dropdown');
        dropdown.innerHTML = '';
        remainingColors.forEach(color => {
            const option = document.createElement('div');
            option.className = 'color-option';
            option.textContent = color;
            option.onclick = () => addColor(color);
            dropdown.appendChild(option);
        });
    }

    function updateColorButtons() {
        const container = document.getElementById('color-buttons');
        container.innerHTML = '';
        selectedColors.forEach(color => {
            const button = document.createElement('button');
            button.className = 'color-button';
            if (color === currentlySelectedColor) {
                button.classList.add('selected');
            }
            button.innerHTML = `
                ${color}
                ${color !== selectedColors[0] ? '<span class="remove-color">&times;</span>' : ''}
            `;
            button.onclick = (e) => {
                if (e.target.classList.contains('remove-color')) {
                    removeColor(color);
                } else {
                    selectColor(color);
                }
            };
            container.appendChild(button);
        });
    }
    function selectColor(color) {
        currentlySelectedColor = color;
        updateColorButtons();
        updateSizeRows();
        updateBackgroundAndButtons(); // Add this line
    }

    function updateSizeRows() {
        const container = document.getElementById('size-rows');
        container.innerHTML = '';
        availableSizes.forEach(size => {
            container.appendChild(createSizeRow(currentlySelectedColor, size));
        });
        updateTotal();
    }

    function createColorSizeContainer(color) {
        const colorContainer = document.createElement('div');
        colorContainer.className = 'color-container';
        colorContainer.innerHTML = `
            <h3>צבע: ${color}</h3>
            <div class="size-rows"></div>
        `;
        const sizeRows = colorContainer.querySelector('.size-rows');
        availableSizes.forEach(size => {
            sizeRows.appendChild(createSizeRow(color, size));
        });
        return colorContainer;
    }


    function createSizeRow(color, size) {
        const row = document.createElement('div');
        row.className = 'size-row';
        const quantity = colorQuantities[color]?.[size] || 0;
        row.innerHTML = `
            <span class="size-label">${size}</span>
            <div class="quantity-control">
                <button class="quantity-btn minus" onclick="changeQuantity('${color}', '${size}', -1)">-</button>
                <input type="number" class="quantity-input" id="${color}-${size}-quantity" value="${quantity}" min="0" onchange="updateQuantity('${color}', '${size}')">
                <button class="quantity-btn plus" onclick="changeQuantity('${color}', '${size}', 1)">+</button>
            </div>
        `;
        return row;
    }


    function updateQuantity(color, size) {
        const input = document.getElementById(`${color}-${size}-quantity`);
        const quantity = parseInt(input.value) || 0;
        if (!colorQuantities[color]) {
            colorQuantities[color] = {};
        }
        colorQuantities[color][size] = quantity;
        updateTotal();
    }
    function changeQuantity(color, size, change) {
        const input = document.getElementById(`${color}-${size}-quantity`);
        const newValue = Math.max(0, parseInt(input.value) + change);
        input.value = newValue;
        updateQuantity(color, size);
    }


    function updateTotal() {
        let total = 0;
        Object.values(colorQuantities).forEach(sizes => {
            Object.values(sizes).forEach(quantity => {
                total += quantity;
            });
        });
        document.getElementById('total-quantity').textContent = total;
    }


    document.getElementById('add-color-button').addEventListener('click', function() {
        document.getElementById('color-dropdown').classList.toggle('show');
    });
    window.onclick = function(event) {
        if (!event.target.matches('.add-color-button')) {
            const dropdowns = document.getElementsByClassName("color-dropdown");
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    }

    function goBack() {
        if (isEditingExisting) {
            // If editing an existing design/description, go back to the appropriate screen
            document.getElementById('size-selection-screen').style.display = 'none';
            if (previousScreen === 'previous-designs') {
                showPreviousDesignsScreen();
            } else if (previousScreen === 'previous-descriptions') {
                showPreviousDescriptionsScreen();
            }
            // Reset editing state
            isEditingExisting = false;
            currentEditingPrintId = null;
            previousScreen = null;
        } else {
            if (sizeScreen === "designPrints" || sizeScreen === "graphicPage") {
                if (hasAddedToCart) {
                    // User has added to cart, so we can return to the default screen
                    if (currentPrintId) {
                        existingPrintIds.add(currentPrintId);
                        currentPrintId = null; // Reset the currentPrintId
                    }
                    document.getElementById('size-selection-screen').style.display = 'none';
                    document.getElementById('default-screen').style.display = 'flex';
                    try{
                                    resetGraphicScreen();

                    }
                    catch{
                    }
                    // Reset design screen
                    resetDesignScreen();

                    // Reset graphic screen

                    // Reset sizeScreen
                    sizeScreen = null;

                    // Reset the hasAddedToCart flag
                    hasAddedToCart = false;
                } else {
                    document.getElementById('size-selection-screen').style.display = 'none';

                    // User hasn't added to cart, so we go back to the previous screen
                    if (sizeScreen === "designPrints") {
                        showNextStepScreen();
                    } else if (sizeScreen === "graphicPage") {
                        showGraphicScreen();
                    }
                }
            } else if (sizeScreen === "noPrints") {
                document.getElementById('size-selection-screen').style.display = 'none';
                document.getElementById('default-screen').style.display = 'flex';
            }
        }
    }
    function resetDesignScreen() {
        // Clear front and back canvases
        frontCanvas.innerHTML = '<!-- Front canvas content -->';
        backCanvas.innerHTML = '<!-- Back canvas content -->';

        // Reset canvas states
        frontCanvasStates = [];
        backCanvasStates = [];
        frontCurrentStateIndex = -1;
        backCurrentStateIndex = -1;

        // Capture initial empty state for both canvases
        captureCanvasState();
        switchCanvas(frontCanvas); // Switch to front canvas
        captureCanvasState();

        // Clear comment
        document.getElementById('comment').value = '';

        // Reset image URLs
        SfrontImageURL = '';
        SbackImageURL = '';

        // Reset any other design-related variables
        selectedImageContainer = null;
        currentlyEditedTextElement = null;

        // Update UI elements
        updateUndoRedoButtons();
    }

    function resetGraphicScreen() {
        // Reset print type selection
        document.getElementById('print-type').value = '';

        // Clear print comment
        document.getElementById('print-comment').value = '';

        // Reset file inputs and their UI
        resetUploadField('front-upload');
        resetUploadField('back-upload');

        // Hide file upload containers
        document.getElementById('optional-upload-title').style.display = 'none';
        document.getElementById('file-upload-container').style.display = 'none';

        // Reset image URLs
        SfrontImageURLGraphic = '';
        SbackImageURLGraphic = '';

        // Reset other variables
        selectedType1 = '';
        printComment1 = '';

        // Update file upload visibility
        updateFileUploadVisibility();
    }
    function showColorPicker(colors) {
        const picker = document.createElement('div');
        picker.className = 'color-picker';
        colors.forEach(color => {
            const option = document.createElement('div');
            option.className = 'color-option';
            option.textContent = color;
            option.onclick = () => {
                addColor(color);
                document.body.removeChild(picker);
            };
            picker.appendChild(option);
        });
        document.body.appendChild(picker);
    }
    function addColor(color) {
        if (!selectedColors.includes(color)) {
            selectedColors.push(color);
            colorQuantities[color] = {};
            currentlySelectedColor = color;
            updateColorButtons();
            updateSizeRows();
            updateAddColorButton();
        }
        document.getElementById('color-dropdown').classList.remove('show');
    }
    function updateAddColorButton() {
        const addColorButton = document.getElementById('add-color-button');
        const remainingColors = availableColors.filter(color => !selectedColors.includes(color));

        if (remainingColors.length === 0) {
            addColorButton.style.display = 'none';
        } else {
            addColorButton.style.display = 'flex';
            setupColorDropdown(remainingColors);
        }
    }
    function removeColor(color) {
        const index = selectedColors.indexOf(color);
        if (index > 0) {  // Prevent removing the first color
            selectedColors.splice(index, 1);
            delete colorQuantities[color];
            if (currentlySelectedColor === color) {
                currentlySelectedColor = selectedColors[0];
            }
            updateColorButtons();
            updateSizeRows();
            updateAddColorButton();
        }
    }
    function addToCart() {
        let totalQuantity = 0;
        Object.values(colorQuantities).forEach(sizes => {
            Object.values(sizes).forEach(quantity => {
                totalQuantity += quantity;
            });
        });

        if (totalQuantity === 0) {
            alert('יש לבחור לפחות מוצר אחד כדי להוסיף לעגלה');
            return;
        }

        let kind = sizeScreen === "noPrints" ? "ללא הדפסה" :
                     sizeScreen === "designPrints" ? "מקדימה ומאחורה" : selectedType1;

        // Use the existing printId if available, otherwise generate a new one
        if (!currentPrintId) {
            currentPrintId = generatePrintId();
        }

        const selectedSizes = {};
        Object.entries(colorQuantities).forEach(([color, sizes]) => {
            selectedSizes[color] = {};
            Object.entries(sizes).forEach(([size, quantity]) => {
                if (quantity > 0) {
                    selectedSizes[color][size] = quantity;
                }
            });
        });

        let printType;
        if (sizeScreen === "graphicPage") {
            printType = selectedType1;
        } else if (sizeScreen === "designPrints") {
            const frontContent = frontCanvas.innerHTML.trim();
            const backContent = backCanvas.innerHTML.trim();
            const hasFrontContent = frontContent !== "<!-- Front canvas content -->";
            const hasBackContent = backContent !== "<!-- Back canvas content -->";

            if (hasFrontContent && hasBackContent) {
                printType = "מקדימה ומאחורה";
            } else if (hasFrontContent) {
                printType = "מקדימה";
            } else if (hasBackContent) {
                printType = "מאחורה";
            } else {
                printType = "ללא הדפסה";
            }
            console.log("מיקום " + printType);
            kind = printType;
        } else {
            printType = "ללא הדפסה";
        }

        let printId = isEditingExisting ? currentEditingPrintId : (currentPrintId || generatePrintId());
        if (kind === "ללא הדפסה")
        {
            printId = "00000";
        }
        const message = {
            action: "addToCart",
            printId: printId,
            sizes: selectedSizes,
            frontImage: sizeScreen === "graphicPage" ? SfrontImageURLGraphic : SfrontImageURL,
            backImage: sizeScreen === "graphicPage" ? SbackImageURLGraphic : SbackImageURL,
            comment: sizeScreen === "graphicPage" ? printComment1 : document.getElementById('comment').value,
            kind: kind
        };

        console.log('Message being sent to parent:', message);
        window.parent.postMessage(message, "*");

        // Update the currentPrintId
        if (kind ==! "ללא הדפסה")
        {
    currentPrintId = printId;    }
        hasAddedToCart = true;

        // Only save the design or description if it's not already saved
        if (sizeScreen === "graphicPage" && !savedDescriptions.some(d => d.printId === currentPrintId)) {
            saveDescription(currentPrintId);
        } else if (sizeScreen === "designPrints" && !savedDesigns.some(d => d.printId === currentPrintId)) {
            saveDesign(currentPrintId);
        }

        // Reset editing state
        isEditingExisting = false;
        currentEditingPrintId = null;
    }
    // Call this function when showing the size selection screen
    function showSizeSelectionScreen() {
        document.getElementById('next-step-screen').style.display = 'none';
        document.getElementById('previous-designs-screen').style.display = 'none';
        document.getElementById('previous-descriptions-screen').style.display = 'none';
        document.getElementById('size-selection-screen').style.display = 'flex';
        initializeSizeSelectionScreen();

        const headerElement = document.querySelector('#size-selection-screen h1');
        const addToCartButton = document.getElementById('add-to-cart-button');

        if (isEditingExisting) {

            headerElement.textContent = 'עריכת מידות להדפסה קיימת';
            addToCartButton.textContent = 'עדכן עגלה';
        } else {
            headerElement.textContent = 'בחירת מידות';
            addToCartButton.textContent = 'הוסף לעגלה';
        }
    }

    function goBackToPreviousScreen() {
        document.getElementById('size-selection-screen').style.display = 'none';
        if (previousScreen === 'previous-designs') {
            showPreviousDesignsScreen();
        } else if (previousScreen === 'previous-descriptions') {
            showPreviousDescriptionsScreen();
        }
        // Reset variables
        isEditingExisting = false;
        currentEditingPrintId = null;
        previousScreen = null;
    }
    document.getElementById('proceed-to-next').addEventListener('click', function() {
        const frontContent = frontCanvas.innerHTML.trim();
        const backContent = backCanvas.innerHTML.trim();
        const hasFrontContent = frontContent !== "<!-- Front canvas content -->";
        const hasBackContent = backContent !== "<!-- Back canvas content -->";

        if (!hasFrontContent && !hasBackContent) {
            alert("יש להוסיף הדפסה מקדימה או מאחורה");
            return;
        }

        let printType;
        if (hasFrontContent && hasBackContent) {
            printType = "מקדימה ומאחורה";
        } else if (hasFrontContent) {
            printType = "מקדימה";
        } else if (hasBackContent) {
            printType = "מאחורה";
        } else {
            printType = "ללא הדפסה";
        }

        if (isEditMode) {
            saveDesign(currentEditPrintId);
            // Send finishEdit message to parent with the determined printType
            window.parent.postMessage({
                action: "finishEdit",
                printId: currentEditPrintId,
                kind: printType,
                comment: document.getElementById('comment').value,
                frontImage: SfrontImageURL,
                backImage: SbackImageURL
            }, "*");

            alert('עיצוב עודכן בהצלחה');
        } else {
            sizeScreen = "designPrints";
            showSizeSelectionScreen();
        }
    });
    window.addEventListener('message', function(event) {
        if (event.data.action === "setProductData") {
            const productId = event.data.productId;
            selectedColor = event.data.selectedColor;
            availableSizes = event.data.availableSizes;
            availableColors = event.data.availableColors;
            existingPrintIds = new Set(event.data.existingPrintIds);
            initializeSizeSelectionScreen();
        }
    else if (event.data.action === "editPrint") {
        let found = false;
        isEditMode = true;
        currentEditPrintId = event.data.printId;
        console.log("Editing print with ID: " + currentEditPrintId);

        // Check for saved designs
        let savedDesign = null;
        try {
            savedDesign = savedDesigns.find(design => design.printId.toString() === currentEditPrintId.toString());
        } catch (error) {
            console.error("Error finding saved design:", error);
        }
        if (savedDesign) {
            console.log("Found matching saved design");
            loadDesign(currentEditPrintId);
            showDesignScreen();
            hideGoBackButton();
            found = true;
                    document.getElementById('size-selection-screen').style.display = 'none';

        }

        // Check for saved descriptions
        if (!found) {
            console.log("Checking saved descriptions");
            const savedDescription = savedDescriptions.find(desc => desc.printId.toString() === currentEditPrintId.toString());
            if (savedDescription) {
                console.log("Found matching saved description:", savedDescription);
                loadDescription(currentEditPrintId);
                showGraphicScreen();
                found = true;
            }
        }

        if (!found) {
            console.log("No matching design or description found for printId: " + currentEditPrintId);
            isEditMode = false;
            currentEditPrintId = null;
            showDefaultScreen();
        }
    }
    });

    function hideGoBackButton() {
        const goBackButton = document.getElementById('go-back-button');
        if (goBackButton) {
            goBackButton.style.display = 'none';
        }
    }

    function showGraphicScreen() {
        hasAddedToCart = false;
        console.log("Showing graphic screen");
        document.getElementById('default-screen').style.display = 'none';
        document.getElementById('design-screen').style.display = 'none';
        document.getElementById('previous-descriptions-screen').style.display = 'none';
        document.getElementById('image-upload-screen').style.display = 'flex';

        const titleElement = document.querySelector('#image-upload-screen .upload-title');
        const proceedButton = document.getElementById('proceed-to-size-selection');

        if (isEditMode) {
            hideGoBackButton();
            // Hide or disable any other back buttons in the graphic screen
            document.getElementById('back-to-default').style.display = 'none';

            // Change title for edit mode
            titleElement.textContent = 'עריכת תיאור הדפסה';

            // Change button text for edit mode
            proceedButton.textContent = 'סיום עריכה';
        } else {
            // Reset to default title and button text
            titleElement.textContent = 'תיאור הדפסה';
            proceedButton.textContent = 'המשך לבחירת מידות';
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        const backToDefaultButton = document.getElementById('back-to-default');
        const proceedToSizeSelectionButton = document.getElementById('proceed-to-size-selection');
        const printTypeSelect = document.getElementById('print-type');
        const frontUpload = document.getElementById('front-upload');
        const backUpload = document.getElementById('back-upload');
        const frontFileInput = document.getElementById('front-file');
        const backFileInput = document.getElementById('back-file');
        const printCommentTextarea = document.getElementById('print-comment');
       const optionalUploadTitle = document.getElementById('optional-upload-title');
        const fileUploadContainer = document.getElementById('file-upload-container');
        backToDefaultButton.addEventListener('click', function() {
            document.getElementById('image-upload-screen').style.display = 'none';
            document.getElementById('default-screen').style.display = 'flex';
        });

        proceedToSizeSelectionButton.addEventListener('click', proceedToSizeSelection);

       printTypeSelect.addEventListener('change', function() {
            if (this.value) {
                optionalUploadTitle.style.display = 'block';
                fileUploadContainer.style.display = 'block';

                // Show/hide appropriate upload buttons based on selection
                if (this.value === 'front' || this.value === 'both') {
                    frontUpload.style.display = 'block';
                } else {
                    frontUpload.style.display = 'none';
                }

                if (this.value === 'back' || this.value === 'both') {
                    backUpload.style.display = 'block';
                } else {
                    backUpload.style.display = 'none';
                }
            } else {
                optionalUploadTitle.style.display = 'none';
                fileUploadContainer.style.display = 'none';
                frontUpload.style.display = 'none';
                backUpload.style.display = 'none';
            }
        });
        frontFileInput.addEventListener('change', handleFileUpload);
        backFileInput.addEventListener('change', handleFileUpload);

        updateFileUploadVisibility();
    });

    function updateFileUploadVisibility() {
        const selectedType = document.getElementById('print-type').value;
        const frontUpload = document.getElementById('front-upload');
        const backUpload = document.getElementById('back-upload');

        frontUpload.style.display = (selectedType === 'front' || selectedType === 'both') ? 'block' : 'none';
        backUpload.style.display = (selectedType === 'back' || selectedType === 'both') ? 'block' : 'none';

        document.getElementById('optional-upload-title').style.display = selectedType ? 'block' : 'none';
        document.getElementById('file-upload-container').style.display = selectedType ? 'block' : 'none';
    }
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Image = e.target.result;
                if (event.target.id === 'front-file') {
                    SfrontImageURLGraphic = base64Image;
                    console.log('Front image uploaded');
                } else if (event.target.id === 'back-file') {
                    SbackImageURLGraphic = base64Image;
                    console.log('Back image uploaded');
                }
            };
            reader.readAsDataURL(file);
        }
    }
    function proceedToSizeSelection() {
        selectedType1 = document.getElementById('print-type').value;
        printComment1 = document.getElementById('print-comment').value;

        if (!selectedType1) {
            alert('אנא בחר סוג הדפסה');
            return;
        }

        if (selectedType1 === "front") {
            selectedType1 = "מקדימה";
        } else if (selectedType1 === "back") {
            selectedType1 = "מאחורה";
        } else if (selectedType1 === "both") {
            selectedType1 = "מקדימה ומאחורה";
        }

        if (printComment1 == "") {
            alert('אנא תאר את ההדפסה שלך');
            return;
        }

        if (isEditMode) {
            saveDescription(currentEditPrintId);
            // Send finishEdit message to parent
            window.parent.postMessage({
                action: "finishEdit",
                printId: currentEditPrintId,
                kind: selectedType1,
                comment: printComment1,
                frontImage: SfrontImageURLGraphic,
                backImage: SbackImageURLGraphic
            }, "*");
        } else {
            sizeScreen = "graphicPage";
            localStorage.setItem('printComment', printComment1);
            console.log('Proceeding to size selection');
            console.log('Print type:', selectedType1);
            console.log('Comment:', printComment1);
            document.getElementById('image-upload-screen').style.display = 'none';
            document.getElementById('size-selection-screen').style.display = 'flex';
            initializeSizeSelectionScreen();
        }
    }
    document.querySelectorAll('.file-upload input[type="file"]').forEach(input => {
        input.addEventListener('change', function(e) {
            const fileName = e.target.files[0].name;
            const fileNameElement = this.nextElementSibling;
            const removeButton = fileNameElement.nextElementSibling;

            fileNameElement.textContent = fileName;
            removeButton.style.display = 'block';
            this.previousElementSibling.textContent = 'קובץ הועלה';
        });
    });


    document.querySelectorAll('.remove-file').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling.previousElementSibling;
            const fileNameElement = this.previousElementSibling;
            input.value = '';
            fileNameElement.textContent = '';
            this.style.display = 'none';

            if (input.id === 'front-file') {
                input.previousElementSibling.textContent = 'העלאת קובץ לחזית';
                SfrontImageURLGraphic = "";
            } else if (input.id === 'back-file') {
                input.previousElementSibling.textContent = 'העלאת קובץ לגב';
                SbackImageURLGraphic = "";
            }
        });
    });


    // Add this function to save a design
    function saveDesign(printId) {
        const comment = document.getElementById('comment').value;

        // Determine printType based on canvas contents
        let printType;
        const frontContent = frontCanvas.innerHTML.trim();
        const backContent = backCanvas.innerHTML.trim();
        console.log("frontContent " + frontCanvas.innerHTML.trim());
        const hasFrontContent = frontContent !== "<!-- Front canvas content -->";
        const hasBackContent = backContent !== "<!-- Back canvas content -->";

        if (hasFrontContent && hasBackContent) {
            printType = "מקדימה ומאחורה";
        } else if (hasFrontContent) {
            printType = "מקדימה";
        } else if (hasBackContent) {
            printType = "מאחורה";
        } else {
            printType = "ללא הדפסה"; // No print
        }

        const design = {
            printId: printId,
            timestamp: new Date().toISOString(),
            frontCanvas: frontCanvas.innerHTML,
            backCanvas: backCanvas.innerHTML,
            hasContent: hasFrontContent || hasBackContent,
            comment: comment,
            printType: printType,
            frontImage: SfrontImageURL,
            backImage: SbackImageURL
        };

        const existingIndex = savedDesigns.findIndex(d => d.printId === printId);
        if (existingIndex !== -1) {
            // Update existing design
            savedDesigns[existingIndex] = design;
        } else {
            // Add new design
            savedDesigns.unshift(design);
            if (savedDesigns.length > MAX_SAVED_DESIGNS) {
                savedDesigns.pop();
            }
        }
        localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
        console.log('Design saved:', savedDesigns);
    }

    function loadSavedDesigns() {
        const savedDesignsJSON = localStorage.getItem('savedDesigns');
        if (savedDesignsJSON) {
            savedDesigns = JSON.parse(savedDesignsJSON);
            console.log('Loaded saved designs:', savedDesigns);
        } else {
            console.log('No saved designs found in localStorage');
        }
    }


    // Add this function to create a preview image from canvas HTML
    async function generatePreviewImage(canvasHTML) {
        return new Promise((resolve) => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = canvasHTML;
            const canvas = tempDiv.querySelector('.canvas') || tempDiv;
            html2canvas(canvas, {
                width: canvas.offsetWidth || 300,
                height: canvas.offsetHeight || 300,
                scale: 1
            }).then(renderedCanvas => {
                resolve(renderedCanvas.toDataURL());
            }).catch(error => {
                console.error('Error generating preview:', error);
                resolve(''); // Return an empty string if there's an error
            });
        });
    }
    function displaySavedDesigns() {
        const container = document.getElementById('previous-designs-container');
        container.innerHTML = '';

        const filteredDesigns = savedDesigns.filter(design => existingPrintIds.has(design.printId.toString()));

        if (filteredDesigns.length === 0) {
            container.innerHTML = '<p class="no-designs-message">!אין עיצובים שמורים. התחל לעצב כדי לראות את העיצובים שלך כאן</p>';
            return;
        }

        for (let i = 0; i < filteredDesigns.length; i++) {
            const design = filteredDesigns[i];
            const designItem = document.createElement('div');
            designItem.className = 'design-item';

            const date = new Date(design.timestamp);
            const formattedDate = `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;

            // Truncate comment if it's too long
            const truncatedComment = design.comment && design.comment.length > 50
                ? design.comment.substring(0, 50) + '...'
                : design.comment || 'ללא הערה';

            designItem.innerHTML = `
                <div class="design-info">
                    <div class="design-title">עיצוב ${i + 1}</div>
                    <div class="design-date">${formattedDate}</div>
                    <div class="design-comment"><strong>הערה:</strong> ${truncatedComment}</div>
                    <div class="design-type">סוג הדפסה: ${design.printType}</div>
                </div>
                <div class="design-images">
                    ${design.frontImage ? `<img src="${design.frontImage}" alt="Front Design" class="design-preview-image">` : ''}
                    ${design.backImage ? `<img src="${design.backImage}" alt="Back Design" class="design-preview-image">` : ''}
                </div>
            `;

            designItem.onclick = () => loadDesign(design.printId);
            container.appendChild(designItem);
        }
    }
    function loadDesign(printId) {
        const design = savedDesigns.find(d => d.printId === printId);
        if (design) {
            console.log('Loading design:', design);

            // Load the design content
            if (design.frontCanvas) {
                frontCanvas.innerHTML = design.frontCanvas;
            }
            if (design.backCanvas) {
                backCanvas.innerHTML = design.backCanvas;
            }

            // Load the saved comment
            if (design.comment) {
                document.getElementById('comment').value = design.comment;
            }

            isEditingExisting = true;
            currentEditingPrintId = design.printId;
            currentPrintId = design.printId;
            sizeScreen = "designPrints";
            previousScreen = 'previous-designs';


                if (!isEditMode)
                {
                            showSizeSelectionScreen();
                }
        }
    }
    document.addEventListener('DOMContentLoaded', function() {
        const previousDesignsButton = document.getElementById('previous-designs');
        if (previousDesignsButton) {
            previousDesignsButton.addEventListener('click', showPreviousDesignsScreen);
        } else {
            console.error('Previous designs button not found');
        }
    });
    function showPreviousDesignsScreen() {
        console.log('Showing previous designs screen');
        document.getElementById('default-screen').style.display = 'none';
        document.getElementById('design-screen').style.display = 'none';
        const previousDesignsScreen = document.getElementById('previous-designs-screen');
        if (previousDesignsScreen) {
            previousDesignsScreen.style.display = 'flex';
            displaySavedDesigns();
        } else {
            console.error('Previous designs screen not found');
        }
    }
    function handleCanvasClick(event) {
        if (event.target === currentCanvas) {
            deselectAllObjects();
            showScreen('screen1');
        }
    }document.getElementById('return-from-previous-designs').addEventListener('click', function() {
         document.getElementById('previous-designs-screen').style.display = 'none';
         document.getElementById('default-screen').style.display = 'flex';
                         isEditingExisting = false;
                         currentEditingPrintId = null;
                         currentPrintId = null
     });

    document.getElementById('previous-descriptions').addEventListener('click', showPreviousDescriptionsScreen);

    function showPreviousDescriptionsScreen() {
        document.getElementById('default-screen').style.display = 'none';
        document.getElementById('previous-descriptions-screen').style.display = 'flex';
        displaySavedDescriptions();
    }

    document.getElementById('return-from-previous-descriptions').addEventListener('click', function() {
        document.getElementById('previous-descriptions-screen').style.display = 'none';
        document.getElementById('default-screen').style.display = 'flex';
                        isEditingExisting = false;
                        currentEditingPrintId = null;
                        currentPrintId = null
    });
    function saveDescription(printId) {
        const description = {
            printId: printId,
            timestamp: new Date().toISOString(),
            comment: printComment1,
            printType: selectedType1,
            frontImage: SfrontImageURLGraphic,
            backImage: SbackImageURLGraphic
        };

        const existingIndex = savedDescriptions.findIndex(d => d.printId === printId);
        if (existingIndex !== -1) {
            // Update existing description
            savedDescriptions[existingIndex] = description;
        } else {
            // Add new description
            savedDescriptions.unshift(description);
            if (savedDescriptions.length > MAX_SAVED_DESCRIPTIONS) {
                savedDescriptions.pop();
            }
        }
        localStorage.setItem('savedDescriptions', JSON.stringify(savedDescriptions));
        console.log('Saved descriptions:', savedDescriptions);
    }


    function loadSavedDescriptions() {
        const savedDescriptionsJSON = localStorage.getItem('savedDescriptions');
        if (savedDescriptionsJSON) {
            savedDescriptions = JSON.parse(savedDescriptionsJSON);
            console.log('Loaded saved descriptions:', savedDescriptions);
        } else {
            console.log('No saved descriptions found in localStorage');
        }
    }

    function displaySavedDescriptions() {
        console.log('Displaying saved descriptions:', savedDescriptions);
        const container = document.getElementById('previous-descriptions-container');
        container.innerHTML = '';

        const filteredDescriptions = savedDescriptions.filter(description => existingPrintIds.has(description.printId.toString()));

        if (filteredDescriptions.length === 0) {
            container.innerHTML = '<p class="no-designs-message">!אין תיאורים שמורים. תאר הדפסה כדי לראות את התיאורים שלך כאן</p>';
            return;
        }

        for (let i = 0; i < filteredDescriptions.length; i++) {
            const description = filteredDescriptions[i];
            const descriptionItem = document.createElement('div');
            descriptionItem.className = 'description-item';

            const date = new Date(description.timestamp);
            const formattedDate = `${date.toLocaleTimeString()}, ${date.toLocaleDateString()}`;
            descriptionItem.innerHTML = `
                <div class="description-info">
                    <div class="description-title">תיאור ${i + 1}</div>
                    <div class="description-date">${formattedDate}</div>
                    <div class="description-type">סוג הדפסה: ${description.printType}</div>
                    <div class="description-comment"><strong>הערה:</strong> ${description.comment}</div>
                </div>
            `;

            if (description.frontImage || description.backImage) {
                const imagesContainer = document.createElement('div');
                imagesContainer.className = 'description-images';
                if (description.frontImage) {
                    const frontImg = document.createElement('img');
                    frontImg.src = description.frontImage;
                    frontImg.alt = 'Front Image';
                    imagesContainer.appendChild(frontImg);
                }
                if (description.backImage) {
                    const backImg = document.createElement('img');
                    backImg.src = description.backImage;
                    backImg.alt = 'Back Image';
                    imagesContainer.appendChild(backImg);
                }
                descriptionItem.appendChild(imagesContainer);
            }

          descriptionItem.onclick = function() {
                console.log('Description clicked:', description.printId);
                loadDescription(description.printId);
            };
            container.appendChild(descriptionItem);
        }
    }

    function loadDescription(printId) {
        console.log("Loading description for printId:", printId);
        const description = savedDescriptions.find(d => d.printId.toString() === printId.toString());
        if (description) {
            console.log("Description found:", description);

            // Set the global variables
            selectedType1 = description.printType;
            printComment1 = description.comment;
            SfrontImageURLGraphic = description.frontImage || '';
            SbackImageURLGraphic = description.backImage || '';

            // Update the UI elements
            document.getElementById('print-type').value = convertPrintTypeToValue(description.printType);
            document.getElementById('print-comment').value = description.comment;

            // Update file upload UI
            updateFileUploadUI('front-upload', !!description.frontImage);
            updateFileUploadUI('back-upload', !!description.backImage);

            // Show/hide upload fields based on print type
            updateFileUploadVisibility();

            isEditingExisting = true;
            currentEditingPrintId = description.printId;
            currentPrintId = description.printId;
            sizeScreen = "graphicPage";
            previousScreen = 'previous-descriptions';

            // Show the graphic screen with loaded data
                if (!isEditMode)
                {
                            showSizeSelectionScreen();
                }    } else {
            console.log("No description found for printId:", printId);
        }
    }

    function convertPrintTypeToValue(printType) {
        switch(printType) {
            case "מקדימה": return "front";
            case "מאחורה": return "back";
            case "מקדימה ומאחורה": return "both";
            default: return "";
        }
    }

    function updateFileUploadUI(uploadId, fileUploaded) {
        const uploadElement = document.getElementById(uploadId);
        if (uploadElement) {
            const fileNameElement = uploadElement.querySelector('.file-name');
            const labelElement = uploadElement.querySelector('label');
            const removeButton = uploadElement.querySelector('.remove-file');

            if (fileUploaded) {
                fileNameElement.textContent = 'קובץ הועלה';
                labelElement.textContent = 'קובץ הועלה';
                removeButton.style.display = 'block';
            } else {
                resetUploadField(uploadId);
            }
        }
    }
    function resetUploadField(fieldId) {
        const uploadField = document.getElementById(fieldId);
        uploadField.querySelector('input[type="file"]').value = '';
        uploadField.querySelector('.file-name').textContent = '';
        uploadField.querySelector('label').textContent = fieldId === 'front-upload' ? 'העלאת קובץ לחזית' : 'העלאת קובץ לגב';
        uploadField.querySelector('.remove-file').style.display = 'none';
    }
    document.getElementById('print-type').addEventListener('change', updateFileUploadVisibility);
    document.getElementById('previous-designs').addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent triggering the parent button's click event
        showPreviousDesignsScreen();
    });

    document.getElementById('previous-descriptions').addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent triggering the parent button's click event
        showPreviousDescriptionsScreen();
    });
    function getBackgroundUrl(isFront, color) {
        const defaultFront = 'https://static.wixstatic.com/media/529f52_e3653644757e47b7b601eb7f9e14d873~mv2.png';
        const defaultBack = 'https://static.wixstatic.com/media/529f52_1aec0ffcd1914b1eb5a3e5d8ba69c104~mv2.png';

        switch(color) {
            case 'שחור':
                return isFront ? 'https://static.wixstatic.com/media/529f52_34e6923c3c7b447ea3285a518e019fd4~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_675acf44180141fc947670f1f983cd0d~mv2.png';
            case 'כחול כהה':
                return isFront ? 'https://static.wixstatic.com/media/529f52_f41b5fc66a2c48e382c9b6a0c372e102~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_14d3117f397943e59cf69fa2287be63e~mv2.png';
            case 'כחול':
                return isFront ? 'https://static.wixstatic.com/media/529f52_4ca53e39739f4e94ac0f51abda04e602~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_b65628ac340b45a6bfb627443d7b24f1~mv2.png';
            case 'תכלת':
                return isFront ? 'https://static.wixstatic.com/media/529f52_07ebb6230be9477f9d4ed84904e2caeb~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_05cf8c47f4b244b4acfbc5a318276ec3~mv2.png';
            case 'אפור':
                return isFront ? 'https://static.wixstatic.com/media/529f52_b926906a390a4028b402a37beaed1600~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_a6c15bbffcab420294bdba5b9fdc7eb1~mv2.png';
            case 'שמנת':
                return isFront ? 'https://static.wixstatic.com/media/529f52_6d897e2d2c354403be60d2fb2effdc67~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_a52cad7e126d405f829583c7305c12ea~mv2.png';
            case 'ירוק כהה':
                return isFront ? 'https://static.wixstatic.com/media/529f52_122736c9625d4f269a8802bb839fb565~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_b955a34075424ede87665e2fd28d6f6d~mv2.png';
            case 'ירוק זית':
                return isFront ? 'https://static.wixstatic.com/media/529f52_83b716789c9145558863b4c18befb477~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_b04de4e217c14d2da80dddd1c04a3e4f~mv2.png';
            case 'ירוק':
                return isFront ? 'https://static.wixstatic.com/media/529f52_032b26d949704faca4c941652720e69e~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_6591a286a8d14354a2a09c7178da8c22~mv2.png';
            case 'בורדו':
                return isFront ? 'https://static.wixstatic.com/media/529f52_a6f3bc1a871243ed998fa18135c93fac~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_feb83d700b4148f2b0c600a85b1f723b~mv2.png';
            case 'אדום':
                return isFront ? 'https://static.wixstatic.com/media/529f52_b9e42cbe81204d4ea5446767c6b66e59~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_a76232e5ff2642afb9d0315a4b83df62~mv2.png';
            case 'ורוד':
                return isFront ? 'https://static.wixstatic.com/media/529f52_41dfbe6e86ba4f6094d2678fc570484d~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_50659eadf79a43aa9047d0f3f3c5911b~mv2.png';
            case 'סגול':
                return isFront ? 'https://static.wixstatic.com/media/529f52_7c39c23a9bb0451294873c2b97ac7a91~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_58bd69f6f55746bcaa62e1f434ac92d2~mv2.png';
            case 'צהוב':
                return isFront ? 'https://static.wixstatic.com/media/529f52_5229a63028784b37a857d9211aab1366~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_216c283b4d194349ab30c5a64051e20e~mv2.png';
            case 'כתום':
                return isFront ? 'https://static.wixstatic.com/media/529f52_5b239f68697e4f7ca91c959e4f5db762~mv2.png' :
                                'https://static.wixstatic.com/media/529f52_dbea44b40fd840749da1a18bb4193d59~mv2.png';
            default:
                return isFront ? defaultFront : defaultBack;
        }
    }
    function setBackgroundImages(color) {
        const frontButton = document.getElementById('front-button');
        const backButton = document.getElementById('back-button');

        const frontImage = frontButton.querySelector('.cropped-image');
        const backImage = backButton.querySelector('.cropped-image');

        frontImage.style.backgroundImage = `url('${getBackgroundUrl(true, color)}')`;
        backImage.style.backgroundImage = `url('${getBackgroundUrl(false, color)}')`;

        frontButton.setAttribute('data-background', getBackgroundUrl(true, color));
        backButton.setAttribute('data-background', getBackgroundUrl(false, color));
    }
    function generatePrintId() {
        return Math.floor(10000 + Math.random() * 90000).toString();
    }


    function testEditPrint(printId) {
        const testEvent = {
            data: {
                action: "editPrint",
                printId: printId
            }
        };

        // Simulate the message event
        window.dispatchEvent(new MessageEvent('message', { data: testEvent.data }));
    }

    document.getElementById('back-to-design').addEventListener('click', function() {
        if (!isEditMode) {
            hideNextStepScreen();
            showDesignScreen();
        }
        // If in edit mode, do nothing or show a message that going back is not allowed
    });
    window.addEventListener('load', () => {

        const productId = "77c43bdc-9344-0207-bd68-e3c65f5aba44";
        selectedColor = "תכלת";
        availableSizes = ["S", "M", "L", "XL", "XXL", "XXXXL"];
       availableColors =  ["שחור", "לבן", "נייבי", "אפור", "אדום", "ירוק זית"];
        existingPrintIds = new Set(["17471", "60922","30209","71167"]);

        loadSavedDesigns();
        loadSavedDescriptions();
       // testEditPrint("f11839");

        initializeSizeSelectionScreen();
            updateBackgroundAndButtons(); // Add this line

        captureCanvasState(); // Capture initial empty state for back canvas
        captureCanvasState(); // Capture initial empty state for front canvas


    })
currentCanvas.addEventListener('mousedown', function(event) {
    if (event.target === currentCanvas) {
        deselectAllObjects();
    }
});

currentCanvas.addEventListener('touchstart', function(event) {
    if (event.target === currentCanvas) {
        deselectAllObjects();
    }
});