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

    let db;

    const dbRequest = indexedDB.open("MemoryDB", 1);

    dbRequest.onupgradeneeded = function (event) {
        db = event.target.result;
        db.createObjectStore("memories", { keyPath: "id", autoIncrement: true });
    };

    dbRequest.onsuccess = function (event) {
        db = event.target.result;
        console.log("IndexedDB opened successfully");
        renderMemories();
    };

    dbRequest.onerror = function () {
        console.error("Error opening IndexedDB.");
    };

    function renderMemories() {
        if (!db) {
            console.warn("IndexedDB not initialized yet, skipping render.");
            return;
        }

        memoryGrid.innerHTML = "";
        const placedPositions = [];

        const transaction = db.transaction(["memories"], "readonly");
        const objectStore = transaction.objectStore("memories");
        const request = objectStore.getAll();

        request.onsuccess = function () {
            const memories = request.result;

            memories.forEach((memory) => {
                const memoryDiv = document.createElement("div");
                memoryDiv.classList.add("memory-item");

                const randomRotate = Math.random() * 10 - 5;
                let randomX, randomY;
                let attempts = 0;
                let overlaps = false;

                do {
                    randomX = Math.random() * 90;
                    randomY = Math.random() * 50;

                    overlaps = placedPositions.some(pos =>
                        Math.abs(pos.x - randomX) < 15 && Math.abs(pos.y - randomY) < 15
                    );

                    attempts++;
                } while (overlaps && attempts < 50);

                placedPositions.push({ x: randomX, y: randomY });

                memoryDiv.style.transform = `rotate(${randomRotate}deg)`;
                memoryDiv.style.position = "absolute";
                memoryDiv.style.left = `${randomX}%`;
                memoryDiv.style.top = `${randomY}%`;

                const deleteBtn = document.createElement("button");
                deleteBtn.classList.add("delete-memory");
                deleteBtn.innerHTML = "❌";
                deleteBtn.addEventListener("click", (event) => {
                    event.stopPropagation();
                    deleteFromIndexedDB(memory.id);
                });

                memoryDiv.innerHTML = `
                    ${memory.image ? `<img src="${memory.image}" alt="Memory Image">` : ""}
                    <h3>${memory.title}</h3>
                    <p>${memory.text}</p>
                `;

                memoryDiv.appendChild(deleteBtn);
                memoryGrid.appendChild(memoryDiv);
            });
        };
    }

    function saveToIndexedDB(memory) {
        const transaction = db.transaction(["memories"], "readwrite");
        const objectStore = transaction.objectStore("memories");
        const request = objectStore.add(memory);

        request.onsuccess = function () {
            renderMemories();
        };
    }

    function deleteFromIndexedDB(id) {
        const transaction = db.transaction(["memories"], "readwrite");
        const objectStore = transaction.objectStore("memories");
        const request = objectStore.delete(id);

        request.onsuccess = function () {
            renderMemories();
        };
    }

    function clearIndexedDB() {
        const transaction = db.transaction(["memories"], "readwrite");
        const objectStore = transaction.objectStore("memories");
        objectStore.clear();

        transaction.oncomplete = function () {
            renderMemories();
        };
    }

    modal.style.display = "none";

    addMemoryBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        modal.style.display = "block";
    });

    closeModal.addEventListener("click", (event) => {
        event.stopPropagation();
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    saveMemoryBtn.addEventListener("click", () => {
        const file = memoryImage.files[0];

        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = function () {
                const newMemory = {
                    title: memoryTitle.value,
                    text: memoryText.value,
                    image: reader.result
                };

                saveToIndexedDB(newMemory);
                modal.style.display = "none";

                memoryTitle.value = "";
                memoryText.value = "";
                memoryImage.value = "";
            };
        } else {
            const newMemory = {
                title: memoryTitle.value,
                text: memoryText.value,
                image: ""
            };

            saveToIndexedDB(newMemory);
            modal.style.display = "none";

            memoryTitle.value = "";
            memoryText.value = "";
        }
    });

    clearMemoriesBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete all memories?")) {
            clearIndexedDB();
        }
    });
});
