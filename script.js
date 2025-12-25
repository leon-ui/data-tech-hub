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
    // Timeline Drag to Scroll
    const slider = document.querySelector('.timeline-container');
    let isDown = false;
    let startX;
    let scrollLeft;

    if (slider) {
        // Mouse Wheel Scroll
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            slider.scrollLeft += e.deltaY * 3;
        });

        // Arrow Button Logic
        const leftBtn = document.querySelector('.scroll-btn.left');
        const rightBtn = document.querySelector('.scroll-btn.right');

        if (leftBtn && rightBtn) {
            leftBtn.addEventListener('click', () => {
                slider.scrollLeft -= 300;
            });

            rightBtn.addEventListener('click', () => {
                slider.scrollLeft += 300;
            });
        }

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Scroll-fast
            slider.scrollLeft = scrollLeft - walk;
        });
    }
});
