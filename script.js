document.addEventListener("DOMContentLoaded", function () {
    const addMemoryBtn = document.getElementById("addMemory");
    const clearMemoriesBtn = document.getElementById("clearMemories");
    const modal = document.getElementById("memoryModal");
    const closeModal = document.querySelector(".close");
    const saveMemoryBtn = document.getElementById("saveMemory");
    const memoryGrid = document.getElementById("memoryGrid");
    const memoryTitle = document.getElementById("memoryTitle");
    const memoryText = document.getElementById("memoryText");
    const memoryImage = document.getElementById("memoryImage");

    let memories = JSON.parse(localStorage.getItem("memories")) || [];

    function renderMemories() {
        memoryGrid.innerHTML = "";
        const placedPositions = [];

        memories.forEach((memory, index) => {
            const memoryDiv = document.createElement("div");
            memoryDiv.classList.add("memory-item");

            // Generate a random rotation
            const randomRotate = Math.random() * 10 - 5; // Between -5° and 5°

            let randomX, randomY;
            let attempts = 0;
            let overlaps = false;

            do {
                // Generate random positions within a safe range
                randomX = Math.random() * 70; // Ensures no polaroids go off-screen
                randomY = Math.random() * 50;

                // Check for overlaps
                overlaps = placedPositions.some(pos =>
                    Math.abs(pos.x - randomX) < 15 && Math.abs(pos.y - randomY) < 15
                );

                attempts++;
            } while (overlaps && attempts < 50); // Try up to 50 times to find a non-overlapping spot

            // Store the position to avoid future overlaps
            placedPositions.push({ x: randomX, y: randomY });

            // Apply styles
            memoryDiv.style.transform = `rotate(${randomRotate}deg)`;
            memoryDiv.style.position = "absolute";
            memoryDiv.style.left = `${randomX}%`;
            memoryDiv.style.top = `${randomY}%`;

            // Create delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-memory");
            deleteBtn.innerHTML = "❌";
            deleteBtn.addEventListener("click", (event) => {
                event.stopPropagation(); // Prevent accidental modal opening
                memories.splice(index, 1); // Remove selected memory
                localStorage.setItem("memories", JSON.stringify(memories));
                renderMemories(); // Refresh memory grid
            });

            // Set inner content
            memoryDiv.innerHTML = `
                ${memory.image ? `<img src="${memory.image}" alt="Memory Image">` : ""}
                <h3>${memory.title}</h3>
                <p>${memory.text}</p>
            `;

            // Append delete button to memory div
            memoryDiv.appendChild(deleteBtn);
            memoryGrid.appendChild(memoryDiv);
        });
    }

    // Ensure the modal does NOT show when the site first loads
    modal.style.display = "none";

    // Open modal when clicking "Add Memory"
    addMemoryBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        modal.style.display = "block";
    });

    // Close modal when clicking the close button
    closeModal.addEventListener("click", (event) => {
        event.stopPropagation();
        modal.style.display = "none";
    });

    // Close modal when clicking outside of it
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // ✅ FIX: Save images as Base64 so they persist after exiting the site
    saveMemoryBtn.addEventListener("click", () => {
        const file = memoryImage.files[0];

        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = function () {
                const newMemory = {
                    title: memoryTitle.value,
                    text: memoryText.value,
                    image: reader.result // Save Base64 image
                };

                memories.push(newMemory);
                localStorage.setItem("memories", JSON.stringify(memories));
                renderMemories();
                modal.style.display = "none";

                // Clear input fields
                memoryTitle.value = "";
                memoryText.value = "";
                memoryImage.value = "";
            };
        } else {
            // Save text memory without an image
            const newMemory = {
                title: memoryTitle.value,
                text: memoryText.value,
                image: ""
            };

            memories.push(newMemory);
            localStorage.setItem("memories", JSON.stringify(memories));
            renderMemories();
            modal.style.display = "none";

            // Clear input fields
            memoryTitle.value = "";
            memoryText.value = "";
        }
    });

    // Clear all memories
    clearMemoriesBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete all memories?")) {
            localStorage.removeItem("memories");
            memories = [];
            renderMemories();
        }
    });

    // Render memories on page load (Fix: No auto-opening modal)
    renderMemories();
});
