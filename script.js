(() => {
    const STORAGE_KEY = "modkid-favorites";
    let activeCategory = "all";
    let savedOnly = false;

    function readFavorites() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function writeFavorites(favorites) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }

    function getCardData(card) {
        const title = card.querySelector("h3")?.textContent.trim();
        const image = card.querySelector(".catalog-image")?.getAttribute("src");
        const description = card.querySelector(".catalog-body p")?.textContent.trim() || "";
        const link = card.querySelector(".catalog-body a")?.getAttribute("href") || "#";
        const tag = card.querySelector(".card-tag")?.textContent.trim() || "МОД";
        const id = card.dataset.id || title?.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-");
        return id && title ? { id, title, image, description, link, tag } : null;
    }

    function refreshLikeButtons() {
        const favorites = new Set(readFavorites().map((item) => item.id));
        document.querySelectorAll(".catalog-card[data-id]").forEach((card) => {
            const button = card.querySelector(".like-btn");
            if (!button) return;
            const liked = favorites.has(card.dataset.id);
            button.classList.toggle("is-liked", liked);
            button.setAttribute("aria-pressed", String(liked));
            button.setAttribute("aria-label", liked ? "Прибрати зі збереженого" : "Додати до збереженого");
            button.textContent = liked ? "♥" : "♡";
        });
    }

    function displayFavorites() {
        const grid = document.getElementById("favorites-grid");
        if (!grid) return;
        const favorites = readFavorites();
        if (!favorites.length) {
            grid.innerHTML = '<p class="empty-favorites">Тут поки порожньо. Натисни ♡ на картці моду, щоб зберегти його.</p>';
            return;
        }
        grid.innerHTML = favorites.map((item) => `
            <article class="catalog-card favorite-card" data-id="${escapeHtml(item.id)}">
                ${item.image ? `<img class="catalog-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">` : ""}
                <div class="catalog-body">
                    <span class="card-tag">${escapeHtml(item.tag)}</span>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.description)}</p>
                    <div class="card-actions">
                        <a class="blue-button" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Відкрити</a>
                        <button class="like-btn is-liked" type="button" data-remove-favorite="${escapeHtml(item.id)}" aria-label="Прибрати зі збереженого" aria-pressed="true">♥</button>
                    </div>
                </div>
            </article>`).join("");
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[char]);
    }

    function toggleFavorite(card) {
        const item = getCardData(card);
        if (!item) return;
        const favorites = readFavorites();
        const exists = favorites.some((favorite) => favorite.id === item.id);
        writeFavorites(exists ? favorites.filter((favorite) => favorite.id !== item.id) : [...favorites, item]);
        refreshLikeButtons();
        applyCatalogControls();
    }

    function applyCatalogControls() {
        const grid = document.querySelector(".catalog-tools")?.nextElementSibling;
        const cards = [...document.querySelectorAll(".catalog-card[data-category]")];
        if (!cards.length) return;

        const query = document.getElementById("catalog-search")?.value.trim().toLocaleLowerCase("uk") || "";
        const sort = document.getElementById("catalog-sort")?.value || "name-asc";
        const favoriteIds = new Set(readFavorites().map((item) => item.id));
        cards.sort((first, second) => {
            const titleA = first.querySelector("h3")?.textContent.trim() || "";
            const titleB = second.querySelector("h3")?.textContent.trim() || "";
            const comparison = titleA.localeCompare(titleB, "uk", { sensitivity: "base" });
            return sort === "name-desc" ? -comparison : comparison;
        });

        let visibleCount = 0;
        cards.forEach((card) => {
            const text = `${card.querySelector("h3")?.textContent || ""} ${card.querySelector(".catalog-body p")?.textContent || ""} ${card.querySelector(".card-tag")?.textContent || ""}`.toLocaleLowerCase("uk");
            const matches = (activeCategory === "all" || card.dataset.category === activeCategory)
                && (!query || text.includes(query))
                && (!savedOnly || favoriteIds.has(card.dataset.id));
            card.hidden = !matches;
            if (matches) visibleCount += 1;
            grid?.append(card);
        });

        const count = document.querySelector(".catalog-count");
        if (count) count.textContent = `Знайдено: ${visibleCount}`;
        let emptyState = document.querySelector(".catalog-empty");
        if (!emptyState && grid) {
            emptyState = document.createElement("p");
            emptyState.className = "catalog-empty";
            emptyState.textContent = "Нічого не знайшлося. Спробуй змінити пошук або категорію.";
            grid.after(emptyState);
        }
        if (emptyState) emptyState.hidden = visibleCount !== 0;
        const savedButton = document.querySelector(".saved-filter");
        if (savedButton) {
            savedButton.classList.toggle("active", savedOnly);
            savedButton.setAttribute("aria-pressed", String(savedOnly));
            savedButton.textContent = savedOnly ? "♥ Показати всі" : "♡ Лише збережені";
        }
    }

    document.addEventListener("click", (event) => {
        const likeButton = event.target.closest(".like-btn");
        if (likeButton) {
            if (likeButton.dataset.removeFavorite) {
                writeFavorites(readFavorites().filter((item) => item.id !== likeButton.dataset.removeFavorite));
                displayFavorites();
            } else {
                const card = likeButton.closest(".catalog-card");
                if (card?.dataset.id) toggleFavorite(card);
            }
        }

        const filterButton = event.target.closest(".filter");
        if (filterButton) {
            activeCategory = filterButton.dataset.filter || filterButton.dataset.category || "all";
            document.querySelectorAll(".filter").forEach((button) => button.classList.toggle("active", button === filterButton));
            applyCatalogControls();
        }

        if (event.target.closest(".saved-filter")) {
            savedOnly = !savedOnly;
            applyCatalogControls();
        }
    });

    document.addEventListener("input", (event) => {
        if (event.target.matches("#catalog-search")) applyCatalogControls();
    });
    document.addEventListener("change", (event) => {
        if (event.target.matches("#catalog-sort")) applyCatalogControls();
    });

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll(".catalog-card").forEach((card) => {
            const title = card.querySelector("h3")?.textContent.trim();
            if (!card.dataset.id && title) {
                card.dataset.id = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
            }
            if (!card.querySelector(".like-btn")) {
                const link = card.querySelector(".catalog-body a");
                const actions = document.createElement("div");
                actions.className = "card-actions";
                if (link) actions.append(link);
                const button = document.createElement("button");
                button.className = "like-btn";
                button.type = "button";
                button.textContent = "♡";
                actions.append(button);
                card.querySelector(".catalog-body")?.append(actions);
            }
        });
        refreshLikeButtons();
        displayFavorites();
        applyCatalogControls();
    });
})();
