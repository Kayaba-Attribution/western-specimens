document.addEventListener('DOMContentLoaded', () => {
    let allSpecimens = [];
    let currentView = 'grid';
    let currentGroupBy = 'none';
    let currentFilter = 'all';
    let searchQuery = '';

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
            container.innerHTML = '<div class="no-results"><h3>Failed to load data</h3><p>Please try refreshing the page.</p></div>';
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
            return { 'All Specimens': specimens };
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
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 75%22%3E%3Crect fill=%22%23eee%22 width=%22100%22 height=%2275%22/%3E%3Ctext x=%2250%22 y=%2240%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2210%22%3ENo image%3C/text%3E%3C/svg%3E'"
            >
            <div class="specimen-info">
                <h3 class="specimen-name">${specimen.name}</h3>
                <p class="specimen-locality">${specimen.locality || 'Location not specified'}</p>
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

    function render() {
        const filtered = filterSpecimens();
        const grouped = groupSpecimens(filtered);

        resultCount.textContent = `Showing ${filtered.length} of ${allSpecimens.length} items`;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>No specimens found</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        container.className = currentView === 'grid' ? 'specimens-grid' : 'specimens-list';

        if (currentGroupBy === 'none') {
            filtered.forEach(specimen => {
                container.appendChild(createSpecimenCard(specimen));
            });
        } else {
            Object.entries(grouped).forEach(([groupName, specimens]) => {
                const section = document.createElement('section');
                section.className = 'group-section';

                const isSuggested = currentGroupBy === 'suggestedGroup';

                section.innerHTML = `
                    <div class="group-header">
                        <h3>${groupName}</h3>
                        <span class="group-count">${specimens.length}</span>
                        ${isSuggested ? '<span class="suggestion-warning">⚠️ Machine-suggested classification</span>' : ''}
                    </div>
                `;

                const grid = document.createElement('div');
                grid.className = currentView === 'grid' ? 'specimens-grid' : 'specimens-list';

                specimens.forEach(specimen => {
                    grid.appendChild(createSpecimenCard(specimen));
                });

                section.appendChild(grid);
                container.appendChild(section);
            });
        }
    }

    function showModal(specimen) {
        modalImage.src = specimen.imageUrl;
        modalImage.alt = specimen.name;
        modalTitle.textContent = specimen.name;

        let infoHtml = '';

        if (specimen.catalogueNumber) {
            infoHtml += `
                <div class="modal-info-row">
                    <div class="modal-info-label">Catalogue Number</div>
                    <div class="modal-info-value">${specimen.catalogueNumber}</div>
                </div>
            `;
        }

        if (specimen.collection) {
            infoHtml += `
                <div class="modal-info-row">
                    <div class="modal-info-label">Collection</div>
                    <div class="modal-info-value">${specimen.collection}</div>
                </div>
            `;
        }

        if (specimen.locality) {
            infoHtml += `
                <div class="modal-info-row">
                    <div class="modal-info-label">Locality</div>
                    <div class="modal-info-value">${specimen.locality}</div>
                </div>
            `;
        }

        if (specimen.chemicalFormula) {
            infoHtml += `
                <div class="modal-info-row">
                    <div class="modal-info-label">Chemical Formula</div>
                    <div class="modal-info-value">${specimen.chemicalFormula}</div>
                </div>
            `;
        }

        if (specimen.category) {
            infoHtml += `
                <div class="modal-info-row">
                    <div class="modal-info-label">Display Category</div>
                    <div class="modal-info-value">${specimen.category}</div>
                </div>
            `;
        }

        if (specimen.note) {
            infoHtml += `
                <div class="modal-info-row">
                    <div class="modal-info-label">Description</div>
                    <div class="modal-info-value">${specimen.note}</div>
                </div>
            `;
        }

        infoHtml += `
            <div class="modal-info-row">
                <div class="modal-info-label">Source</div>
                <div class="modal-info-value">
                    <a href="${specimen.sourceUrl}" target="_blank" rel="noopener">View original page ↗</a>
                </div>
            </div>
        `;

        if (specimen.suggestedGroup) {
            infoHtml += `
                <div class="modal-suggestion-note">
                    ⚠️ <strong>Suggested Classification:</strong> ${specimen.suggestedGroup}<br>
                    This grouping is machine-suggested based on mineral properties and should not be treated as confirmed taxonomy.
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

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        render();
    });

    groupBySelect.addEventListener('change', (e) => {
        currentGroupBy = e.target.value;
        render();
    });

    filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        render();
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
        if (e.target === modal) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    loadData();
});
