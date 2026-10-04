document.addEventListener('DOMContentLoaded', () => {
    let allSpecimens = [];
    let currentView = 'grid';
    let currentGroupBy = 'none';
    let currentFilter = 'all';
    let searchQuery = '';
    let currentPage = 1;
    let expandedGroups = new Set();
    let groupPages = {};
    
    const ITEMS_PER_PAGE = 12;
    const COLLAPSE_THRESHOLD = 6;

    const container = document.getElementById('specimens-container');
    const searchInput = document.getElementById('search');
    const clearBtn = document.getElementById('clear-search');
    const groupBySelect = document.getElementById('group-by');
    const filterSelect = document.getElementById('filter-collection');
    const viewButtons = document.querySelectorAll('.view-btn');
    const resultCount = document.getElementById('result-count');
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalInfo = document.getElementById('modal-info');
    const modalClose = document.querySelector('.modal-close');
    const expandCollapseBtn = document.getElementById('expand-collapse-all');
    const paginationContainer = document.getElementById('pagination');

    async function loadData() {
        container.innerHTML = '<div class="loading">Loading specimens</div>';
        try {
            const response = await fetch('data/specimens.json');
            const data = await response.json();
            allSpecimens = [
                ...data.specimens,
                ...data.equipment,
                ...data.ammonoids
            ];
            render();
        } catch (error) {
            console.error('Failed to load specimens:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3>Failed to load data</h3>
                    <p>Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    function filterSpecimens() {
        return allSpecimens.filter(specimen => {
            if (currentFilter !== 'all' && specimen.collection !== currentFilter) {
                return false;
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const searchFields = [
                    specimen.name,
                    specimen.locality,
                    specimen.catalogueNumber,
                    specimen.note,
                    specimen.category,
                    specimen.suggestedGroup
                ].filter(Boolean).join(' ').toLowerCase();
                return searchFields.includes(query);
            }
            return true;
        });
    }

    function groupSpecimens(specimens) {
        if (currentGroupBy === 'none') {
            return null;
        }

        const groups = {};
        specimens.forEach(specimen => {
            let key = specimen[currentGroupBy] || 'Unknown';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(specimen);
        });

        const sortedGroups = {};
        Object.keys(groups).sort().forEach(key => {
            sortedGroups[key] = groups[key];
        });

        return sortedGroups;
    }

    function createSpecimenCard(specimen) {
        const card = document.createElement('div');
        card.className = 'specimen-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View details for ${specimen.name}`);

        const collectionClass = specimen.collection ? 
            `collection-${specimen.collection.toLowerCase()}` : '';

        card.innerHTML = `
            <img 
                class="specimen-image" 
                src="${specimen.imageUrl}" 
                alt="${specimen.name}"
                loading="lazy"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 75%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%2275%22/%3E%3Ctext x=%2250%22 y=%2240%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%228%22%3ENo image%3C/text%3E%3C/svg%3E'"
            >
            <div class="specimen-info">
                <h3 class="specimen-name">${specimen.name}</h3>
                ${specimen.locality ? `<p class="specimen-locality">${specimen.locality}</p>` : ''}
                <div class="specimen-meta">
                    ${specimen.catalogueNumber ? 
                        `<span class="specimen-tag">${specimen.catalogueNumber}</span>` : ''}
                    ${specimen.collection ? 
                        `<span class="specimen-tag ${collectionClass}">${specimen.collection}</span>` : ''}
                    ${specimen.suggestedGroup ? 
                        `<span class="specimen-tag suggested">${specimen.suggestedGroup}</span>` : ''}
                </div>
            </div>
        `;

        card.addEventListener('click', () => showModal(specimen));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showModal(specimen);
            }
        });

        return card;
    }

    function createPagination(totalItems, currentPg, onPageChange, groupKey = null) {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (totalPages <= 1) return null;

        const nav = document.createElement('nav');
        nav.className = 'pagination';
        nav.setAttribute('aria-label', 'Pagination');

        const prevDisabled = currentPg === 1;
        const nextDisabled = currentPg === totalPages;

        let pagesHtml = '';
        const maxVisible = 5;
        let startPage = Math.max(1, currentPg - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pagesHtml += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) pagesHtml += `<span class="page-ellipsis">…</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            pagesHtml += `<button class="page-btn ${i === currentPg ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pagesHtml += `<span class="page-ellipsis">…</span>`;
            pagesHtml += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        nav.innerHTML = `
            <button class="page-btn page-prev" data-page="${currentPg - 1}" ${prevDisabled ? 'disabled' : ''}>
                ← Prev
            </button>
            <div class="page-numbers">${pagesHtml}</div>
            <button class="page-btn page-next" data-page="${currentPg + 1}" ${nextDisabled ? 'disabled' : ''}>
                Next →
            </button>
        `;

        nav.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                onPageChange(page, groupKey);
            });
        });

        return nav;
    }

    function handleGlobalPageChange(page) {
        currentPage = page;
        render();
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function handleGroupPageChange(page, groupKey) {
        groupPages[groupKey] = page;
        render();
    }

    function toggleGroup(groupKey) {
        if (expandedGroups.has(groupKey)) {
            expandedGroups.delete(groupKey);
        } else {
            expandedGroups.add(groupKey);
            if (!groupPages[groupKey]) {
                groupPages[groupKey] = 1;
            }
        }
        render();
    }

    function expandAllGroups(grouped) {
        Object.keys(grouped).forEach(key => {
            expandedGroups.add(key);
            if (!groupPages[key]) groupPages[key] = 1;
        });
        render();
    }

    function collapseAllGroups() {
        expandedGroups.clear();
        render();
    }

    function updateExpandCollapseButton(grouped) {
        if (!grouped || currentGroupBy === 'none') {
            expandCollapseBtn.style.display = 'none';
            return;
        }

        expandCollapseBtn.style.display = 'inline-flex';
        const allExpanded = Object.keys(grouped).every(key => expandedGroups.has(key));
        
        if (allExpanded) {
            expandCollapseBtn.innerHTML = '<span class="btn-icon">−</span> Collapse All';
            expandCollapseBtn.onclick = collapseAllGroups;
        } else {
            expandCollapseBtn.innerHTML = '<span class="btn-icon">+</span> Expand All';
            expandCollapseBtn.onclick = () => expandAllGroups(grouped);
        }
    }

    function render() {
        const filtered = filterSpecimens();
        const grouped = groupSpecimens(filtered);

        const countText = filtered.length === allSpecimens.length 
            ? `${filtered.length} specimens`
            : `${filtered.length} of ${allSpecimens.length} specimens`;
        resultCount.textContent = countText;

        updateExpandCollapseButton(grouped);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>No specimens found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            paginationContainer.innerHTML = '';
            return;
        }

        container.innerHTML = '';
        const viewClass = currentView === 'grid' ? 'specimens-grid' : 'specimens-list';

        if (!grouped) {
            container.className = viewClass;
            
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
            if (currentPage > totalPages) currentPage = 1;
            
            const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIdx = startIdx + ITEMS_PER_PAGE;
            const pageItems = filtered.slice(startIdx, endIdx);

            pageItems.forEach(specimen => {
                container.appendChild(createSpecimenCard(specimen));
            });

            paginationContainer.innerHTML = '';
            const pagination = createPagination(filtered.length, currentPage, handleGlobalPageChange);
            if (pagination) {
                paginationContainer.appendChild(pagination);
            }
        } else {
            container.className = 'grouped-container';
            paginationContainer.innerHTML = '';

            Object.entries(grouped).forEach(([groupName, specimens]) => {
                const section = document.createElement('section');
                section.className = 'group-section';

                const isLongGroup = specimens.length > COLLAPSE_THRESHOLD;
                const isExpanded = expandedGroups.has(groupName);
                const isSuggested = currentGroupBy === 'suggestedGroup';

                const header = document.createElement('div');
                header.className = `group-header ${isLongGroup ? 'collapsible' : ''} ${isExpanded ? 'expanded' : ''}`;
                header.innerHTML = `
                    ${isLongGroup ? `<span class="collapse-icon">${isExpanded ? '−' : '+'}</span>` : ''}
                    <h3>${groupName}</h3>
                    <span class="group-count">${specimens.length}</span>
                    ${isSuggested ? '<span class="suggestion-warning">⚠️ suggested</span>' : ''}
                `;

                if (isLongGroup) {
                    header.addEventListener('click', () => toggleGroup(groupName));
                    header.style.cursor = 'pointer';
                }

                section.appendChild(header);

                if (!isLongGroup || isExpanded) {
                    const grid = document.createElement('div');
                    grid.className = viewClass;

                    let itemsToShow = specimens;
                    let groupPagination = null;

                    if (isLongGroup && isExpanded) {
                        const groupPage = groupPages[groupName] || 1;
                        const startIdx = (groupPage - 1) * ITEMS_PER_PAGE;
                        const endIdx = startIdx + ITEMS_PER_PAGE;
                        itemsToShow = specimens.slice(startIdx, endIdx);
                        
                        groupPagination = createPagination(
                            specimens.length, 
                            groupPage, 
                            handleGroupPageChange, 
                            groupName
                        );
                    }

                    itemsToShow.forEach(specimen => {
                        grid.appendChild(createSpecimenCard(specimen));
                    });

                    section.appendChild(grid);

                    if (groupPagination) {
                        section.appendChild(groupPagination);
                    }
                } else {
                    const preview = document.createElement('div');
                    preview.className = 'group-preview';
                    preview.innerHTML = `<span>Click to show ${specimens.length} items</span>`;
                    section.appendChild(preview);
                }

                container.appendChild(section);
            });
        }
    }

    function showModal(specimen) {
        modalImage.src = specimen.imageUrl;
        modalImage.alt = specimen.name;
        modalTitle.textContent = specimen.name;

        let infoHtml = '';

        const fields = [
            { key: 'catalogueNumber', label: 'Catalogue' },
            { key: 'collection', label: 'Collection' },
            { key: 'locality', label: 'Locality' },
            { key: 'chemicalFormula', label: 'Formula' },
            { key: 'category', label: 'Category' },
        ];

        fields.forEach(({ key, label }) => {
            if (specimen[key]) {
                infoHtml += `
                    <div class="modal-info-row">
                        <span class="modal-info-label">${label}</span>
                        <span class="modal-info-value">${specimen[key]}</span>
                    </div>
                `;
            }
        });

        if (specimen.note) {
            infoHtml += `
                <div class="modal-description">
                    <p>${specimen.note}</p>
                </div>
            `;
        }

        infoHtml += `
            <a href="${specimen.sourceUrl}" target="_blank" rel="noopener" class="modal-source-link">
                View source page ↗
            </a>
        `;

        if (specimen.suggestedGroup) {
            infoHtml += `
                <div class="modal-suggestion-note">
                    ⚠️ <strong>${specimen.suggestedGroup}</strong> — machine-suggested classification, not confirmed taxonomy
                </div>
            `;
        }

        modalInfo.innerHTML = infoHtml;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function resetAndRender() {
        currentPage = 1;
        groupPages = {};
        render();
    }

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        resetAndRender();
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        resetAndRender();
    });

    groupBySelect.addEventListener('change', (e) => {
        currentGroupBy = e.target.value;
        expandedGroups.clear();
        resetAndRender();
    });

    filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        resetAndRender();
    });

    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            render();
        });
    });

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    loadData();
});
