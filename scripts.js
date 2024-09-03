import { getCart, removeItemFromCart, getCartTotals, getCheckoutUrl } from 'backend/cart';
import wixStoresFrontend from 'wix-stores-frontend';
import wixLocationFrontend from 'wix-location-frontend';
import { cart } from 'wix-stores';
import { products } from "wix-stores.v2";
let itemIds = [];
const groupData = {};
const itemData = {};

let itemQuantities = [];
let currencySymbol = "₪";

$w.onReady(async function () {
    initializeCart();
    setupCheckoutButton();
});

function initializeCart() {
    populateCartItems();
    populateCartTotals();
}

function setupCheckoutButton() {
    $w("#checkoutButton").onClick(async () => {
        if ($w("#checkoutButton").enabled) {
            try {
                $w("#loader").show();

                const { checkoutUrl } = await getCheckoutUrl();
                console.log("checkout" + checkoutUrl);
                wixLocationFrontend.to(checkoutUrl);
            } catch (error) {
                $w("#loader").hide();

                console.error("Error navigating to checkout:", error);
                showError("Unable to proceed to checkout. Please try again.");
            }
        }
    });
}

async function populateCartItems() {
    try {
        const { lineItems } = await getCart();
        if (lineItems.length === 0) {
            $w("#checkoutButton").disable();

        }

        const groupedItems = groupItemsByNameAndPrintId(lineItems);
        $w("#lineItemsRepeater").data = groupedItems;
        $w("#lineItemsRepeater").onItemReady(($item, groupData) => setupCartItem($item, groupData));
        $w("#lineItemsRepeater").show();
    } catch (error) {
        console.error("Error populating cart items:", error);
        showError("Unable to load cart items. Please refresh the page.");
    }
}

function setupEditButton($item, groupData) {
    $item("#editButton").onClick(() => {

        const printItem = groupData.items.find(item => item.productName.original === "הדפסה");

        if (printItem) {
            const editData = {
                action: "editPrint",
                removeRow: printItem._id,
                printId: printItem.catalogReference.options.customTextFields["מזהה הדפסה"] || "", // Use the actual line item ID
            };

            // Navigate to the הכנת הדפס page with edit data
            const encodedEditData = encodeURIComponent(JSON.stringify(editData));
            wixLocationFrontend.to(`/הכנת-הדפס?editData=${encodedEditData}`);

        }
    });
}

function setupCartItem($item, groupData) {
    const regularItems = groupData.items.filter(item => item.productName.original !== "הדפסה");
    const printItem = groupData.items.find(item => item.productName.original === "הדפסה");

    // Check if the group is "ללא הדפסה"
    const isNoPrinting = regularItems.some(item =>
        item.catalogReference.options.options["מיקום הדפסה"] === "ללא הדפסה"
    );

    // Disable the edit button if it's "ללא הדפסה"
    if (isNoPrinting) {
        $item("#productOptions").text = "מיקום הדפסה: ללא הדפסה";

        $item("#firstImage").hide();
        $item("#text93").hide();

        $item("#secondImage").hide();
        $item("#firstText").hide();
        $item("#secondText").hide();
        $item("#editButton").hide();
    } else {
        setupEditButton($item, groupData);
    }

    updateItemDisplay($item, regularItems[0], groupData);
    if (printItem) {
        updatePrintItemDetails($item, printItem, groupData);
    }
    updateProductRows($item, regularItems, groupData._id, groupData);
    setupRemoveButton($item, groupData);
    setupAddProductForm($item, groupData);
}

function updateItemDisplay($item, regularItem, groupData) {
    $item("#productName").text = regularItem.productName.original;
    $item("#image").src = regularItem.image;
    $item("#price").text = regularItem.price.formattedAmount;
    $item("#totalPrice").text = `${currencySymbol} ${groupData.totalPrice.toFixed(2)}`;
}

function updatePrintItemDetails($item, printItem, groupData) {
    $item("#productOptions").text = convertProductOptionsToText(printItem, groupData);
    updateImagesAndTexts($item, printItem);
}

function updateProductRows($item, regularItems, groupId, groupData) {
    // Clear existing row data for this group
    Object.keys(itemData).forEach(key => {
        if (key.startsWith(groupId)) {
            delete itemData[key];
        }
    });

    regularItems.forEach((item, index) => {
        const rowIndex = index + 1;
        const rowPrefix = `row${rowIndex}`;
        const uniqueItemId = `${groupId}-${rowIndex}`;

        itemData[uniqueItemId] = {
            id: item._id,
            quantity: item.quantity,
            rowIndex: rowIndex
        };

        updateRowDisplay($item, rowPrefix, item);
        setupQuantityControls($item, rowPrefix, uniqueItemId, groupData);

        $item(`#${rowPrefix}`).expand();
        $item(`#${rowPrefix}`).show();
    });

    hideUnusedRows($item, regularItems.length);
}

function updateRowDisplay($item, rowPrefix, item) {
    $item(`#${rowPrefix}Color`).text = item.catalogReference.options.options["צבע"] || "N/A";
    $item(`#${rowPrefix}Size`).text = item.catalogReference.options.options["מידה"] || "N/A";
    $item(`#${rowPrefix}Quantity`).text = item.quantity.toString();
    $item(`#${rowPrefix}Total`).text = `${currencySymbol} ${item.quantity * item.price.amount}`;

}

function setupQuantityControls($item, rowPrefix, uniqueItemId, groupData) {
    const plusButton = $item(`#${rowPrefix}Plus`);
    const minusButton = $item(`#${rowPrefix}Minus`);
    const removeButton = $item(`#${rowPrefix}Remove`);

    if (!plusButton.__hasClickHandler) {
        plusButton.onClick(() => {
            itemData[uniqueItemId].quantity++;
            updateItemQuantity(uniqueItemId);
        });
        plusButton.__hasClickHandler = true;
    }

    if (!minusButton.__hasClickHandler) {
        minusButton.onClick(() => {
            itemData[uniqueItemId].quantity = Math.max(itemData[uniqueItemId].quantity - 1, 1);
            updateItemQuantity(uniqueItemId);
        });
        minusButton.__hasClickHandler = true;
    }
    if (!removeButton.__hasClickHandler) {
        removeButton.onClick(async () => {
            $w("#loader").show();
            const fullGroupId = uniqueItemId.split('-').slice(0, 5).join('-');
            const itemsInGroup = Object.keys(itemData).filter(key => key.startsWith(fullGroupId));
            if (itemsInGroup.length === 1) {
                $w("#loader").show();
                await removeGroupFromCart(groupData.items);
                await renderCart();
            } else {
                // Not the last item, proceed with removal
                await removeItemFromCart(itemData[uniqueItemId].id);
                delete itemData[uniqueItemId];
                await renderCart();
            }
        });
        removeButton.__hasClickHandler = true;
    }

    // Update the displayed quantity
    $item(`#${rowPrefix}Quantity`).text = itemData[uniqueItemId].quantity.toString();
}

function resetItemArrays() {
    itemIds = [];
    itemQuantities = [];
}

function hideUnusedRows($item, usedRowsCount) {
    for (let i = usedRowsCount + 1; i <= 12; i++) {
        $item(`#row${i}`).collapse();
        $item(`#row${i}`).hide();
    }
}

async function updateItemQuantity(uniqueItemId) {
    try {
        $w("#loader").show();
        const { id, quantity } = itemData[uniqueItemId];
        const cartLineItemId = parseInt(id.split('-').pop(), 16);
        await cart.updateLineItemQuantity(cartLineItemId, quantity);
        await renderCart();
    } catch (error) {
        console.error("Error updating item quantity:", error);
        showError("Failed to update quantity. Please try again.");
    } finally {
        $w("#loader").hide();
    }
}

function setupRemoveButton($item, groupData) {
    $item("#removeFromCartButton").onClick(async () => {
        $w("#loader").show();
        await removeGroupFromCart(groupData.items);
        await renderCart();
    });
}
async function setupAddProductForm($item, groupData) {
    try {
        const regularItem = groupData.items.find(item => item.productName.original !== "הדפסה") || groupData.items[0];
        const productId = regularItem.catalogReference.catalogItemId;
        const { product } = await products.getProduct(productId);

        setupDropdowns($item, product.productOptions);
        const addButton = $item("#confirmAddProduct");

        if (!addButton.__hasClickHandler) {
            addButton.__hasClickHandler = true;
            addButton.onClick(() => addNewProduct($item, groupData));
        }
    } catch (error) {
        console.error("Error setting up add product form:", error);
    }
}

function setupDropdowns($item, productOptions) {
    const colorOptions = getOptionChoices(productOptions, "צבע");
    const sizeOptions = getOptionChoices(productOptions, "מידה");

    $item("#colorDropdown").options = colorOptions;
    $item("#sizeDropdown").options = sizeOptions;
}

function getOptionChoices(productOptions, optionName) {
    const option = productOptions.find(opt => opt.name === optionName);
    return option ? option.choices.map(choice => ({ label: choice.description || choice.value, value: choice.description || choice.value })) : [];
}

async function addNewProduct($item, groupData) {
    const color = $item("#colorDropdown").value;
    const size = $item("#sizeDropdown").value;
    const quantity = Number($item("#quantityInput").value);

    if (!validateProductInput(color, size, quantity)) {
        $item("#errorMessage").text = "בבקשה מלא את כל השדות";
        $item("#errorMessage").show();
        return;
    }

    try {
        $w("#loader").show();

        const regularItem = groupData.items.find(item => item.productName.original !== "הדפסה");
        const productId = regularItem.catalogReference.catalogItemId;
        const printId = regularItem.catalogReference.options.customTextFields["מזהה הדפסה"];
        const kind = regularItem.catalogReference.options.options["מיקום הדפסה"];

        const products = [{
            productId,
            quantity,
            options: {
                choices: { "צבע": color, "מידה": size, "מיקום הדפסה": kind },
                customTextFields: [{ title: "מזהה הדפסה", value: printId }]
            },
        }];

        await cart.addProducts(products);
        await renderCart();
        // resetAddProductForm($item);
    } catch (error) {
        $w("#loader").hide();

        console.error("Error adding product to cart:", error);
        $item("#errorMessage").text = "Error adding product to cart. Please try again.";
        $item("#errorMessage").show();
    }
}

function validateProductInput(color, size, quantity) {
    return color && size && quantity > 0;
}

function resetAddProductForm($item) {
    $item("#addProductButton").label = "Add Product";
    $item("#colorDropdown").value = "";
    $item("#sizeDropdown").value = "";
    $item("#quantityInput").value = "";
    $item("#errorMessage").hide();
    $item("#addProductForm").collapse();
    $item("#addProductForm").hide();
}

async function renderCart() {
    try {
        $w("#loader").show();
        const cart = await getCart();
        if (!cart || !cart.lineItems || cart.lineItems.length === 0) {
            $w("#checkoutButton").disable();
            $w("#lineItemsRepeater").hide();
            await populateCartTotals();
        } else {
            const groupedItems = groupItemsByNameAndPrintId(cart.lineItems);
            $w("#lineItemsRepeater").data = groupedItems;
            $w("#lineItemsRepeater").forEachItem(($item, groupData, index) => {
                setupCartItem($item, groupData);
            });
            $w("#lineItemsRepeater").show();
            await populateCartTotals();
        }

    } catch (error) {
        console.error("Error rendering cart:", error);
        showError("Unable to update cart. Please refresh the page.");
    } finally {
        $w("#loader").hide();
    }
}

function groupItemsByNameAndPrintId(lineItems) {
    const groupedItems = {};
    const printItems = {};
    const printIdGroups = {};

    lineItems.forEach(item => {
        const printId = item.catalogReference.options.customTextFields["מזהה הדפסה"];
        const productName = item.productName.original;

        if (productName === "הדפסה" && printId !== "00000") {
            // Store print items separately, except for "00000"
            printItems[printId] = item;
        } else {
            // Group non-print items by product name and printId
            const key = `${productName}-${printId}`;
            if (!groupedItems[key]) {
                groupedItems[key] = {
                    _id: item._id,
                    items: [],
                    totalPrice: 0,
                    productName: productName,
                    printId: printId,
                    keepOriginalPrice: false, // Initialize this flag
                    isDefaultPrint: printId === "00000" // Flag for default print
                };
            }
            groupedItems[key].items.push(item);
            groupedItems[key].totalPrice += item.quantity * item.price.amount;

            // Keep track of groups for each printId
            if (!printIdGroups[printId]) {
                printIdGroups[printId] = [];
            }
            printIdGroups[printId].push(key);
        }
    });

    // Assign keepOriginalPrice flag to one group for each printId
    Object.values(printIdGroups).forEach(groups => {
        if (groups.length > 0 && groups[0].split('-')[1] !== "00000") {
            // Choose a random group to keep the original price, except for "00000"
            const randomIndex = Math.floor(Math.random() * groups.length);
            groupedItems[groups[randomIndex]].keepOriginalPrice = true;
        }
    });

    // Add print items to their respective groups
    Object.values(groupedItems).forEach(group => {
        if (!group.isDefaultPrint) {
            const printItem = printItems[group.printId];
            if (printItem) {
                group.items.push(printItem);
                group.totalPrice += printItem.quantity * printItem.price.amount;
            }
        }
    });

    return Object.values(groupedItems);
}

function convertProductOptionsToText(product, groupData) {
    const { options } = product.catalogReference.options;
    let optionsText = Object.entries(options).map(([key, value]) => `${key}: ${value}`).join("\n");

    const printItem = groupData.items.find(item => item.productName.original === "הדפסה");
    if (printItem) {
        if (groupData.keepOriginalPrice) {
            optionsText += `\nמחיר הכנה להדפסה: ${currencySymbol}${printItem.price.amount}`;
        } else {
            optionsText += `\nמחיר הכנה להדפסה: ${currencySymbol}0`;
        }
    }

    return optionsText;
}

function updateImagesAndTexts($item, itemData) {
    const printLocation = itemData.catalogReference.options.options["מיקום הדפסה"];
    const imageConfigs = {
        'מקדימה': { first: 'הדפסה_מקדימה', second: null },
        'מאחורה': { first: 'הדפסה_מאחורה', second: null },
        'ללא הדפסה': { first: null, second: null },
        'מקדימה ומאחורה': { first: 'הדפסה_מקדימה', second: 'הדפסה_מאחורה' }
    };

    const config = imageConfigs[printLocation] || { first: null, second: null };
    updateImage($item, "#firstImage", "#firstText", config.first, itemData, "מקדימה");
    updateImage($item, "#secondImage", "#secondText", config.second, itemData, "מאחורה");
}

function updateImage($item, imageSelector, textSelector, imageField, itemData, text) {
    if (imageField) {
        ``
        $item(imageSelector).src = itemData.catalogReference.options.customTextFields[imageField];
        $item(textSelector).text = text;
        $item(imageSelector).show();
        $item(textSelector).show();
        $item(imageSelector).onClick(() => {
            wixLocationFrontend.to(itemData.catalogReference.options.customTextFields[imageField]);
        });
    } else {
        $item(imageSelector).hide();
        $item(textSelector).hide();
    }
}

async function removeGroupFromCart(items) {
    try {

        for (const item of items) {
            await removeItemFromCart(item._id);
        }
    } catch (error) {
        console.error("Error removing group from cart:", error);
        showError("Failed to remove items from cart. Please try again.");
    }
}

async function populateCartTotals() {
    try {
        const { priceSummary, cart } = await getCartTotals();
        $w("#subtotal").text = priceSummary.subtotal.formattedAmount;
        const couponDiscount = cart.appliedDiscounts.find(discount => discount.coupon?.code);
        // You can add more logic here to display coupon discount if needed
    } catch (error) {
        console.error("Error populating cart totals:", error);
        showError("Unable to update cart totals. Please refresh the page.");
    }
}

function showError(message) {
    // Implement this function to show error messages to the user
    // For example, you could use a Wix UI element to display the message
    console.error(message);
}