document.addEventListener('DOMContentLoaded', () => {
    console.log("Leon's Hub Loaded");

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = item.getAttribute('data-target');

            // Update Nav State
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update View State
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.style.display = 'block';
                    // Trigger reflow/animation if needed
                } else {
                    section.style.display = 'none';
                }
            });

            // Scroll to top of main content
            document.querySelector('.main-content').scrollTop = 0;
        });
    });

    // Content Filtering (Recycled logic adapted for new structure)
    const filterBtns = document.querySelectorAll('.filter-btn');
    const feedCards = document.querySelectorAll('.feed-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            feedCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});
