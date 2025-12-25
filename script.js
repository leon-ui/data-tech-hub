document.addEventListener('DOMContentLoaded', () => {
    console.log("Leon's Hub Loaded");

    // Navigation Logic
    // Navigation Logic
    const handleNavigation = (targetId) => {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.view-section');

        // Update Nav State (Sidebar)
        navItems.forEach(nav => {
            if (nav.getAttribute('data-target') === targetId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        // Update View State
        sections.forEach(section => {
            if (section.id === targetId) {
                section.style.display = 'block';
                // Scroll to top of section logic if needed
            } else {
                section.style.display = 'none';
            }
        });

        // Scroll to top of main content
        document.querySelector('.main-content').scrollTop = 0;

        // Animate Footer (Pop effect)
        const footer = document.querySelector('.site-footer');
        if (footer) {
            footer.style.animation = 'none';
            footer.offsetHeight; /* trigger reflow */
            footer.style.animation = 'fadeIn 0.4s ease';
        }
    };

    // Sidebar Clciks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            handleNavigation(targetId);
        });
    });

    // In-Page Navigation Triggers (e.g. from About Me to Shop)
    document.querySelectorAll('.nav-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = trigger.getAttribute('data-target');
            handleNavigation(targetId);
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
    // Generic Scroll Logic
    const setupHorizontalScroll = (containerClass, leftBtnClass, rightBtnClass) => {
        const slider = document.querySelector(containerClass);
        if (!slider) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        // Mouse Wheel
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            slider.scrollLeft += e.deltaY * 3;
        });

        // Buttons
        const leftBtn = document.querySelector(leftBtnClass);
        const rightBtn = document.querySelector(rightBtnClass);

        if (leftBtn && rightBtn) {
            leftBtn.addEventListener('click', () => {
                slider.scrollLeft -= 300;
            });
            rightBtn.addEventListener('click', () => {
                slider.scrollLeft += 300;
            });
        }

        // Drag to Scroll
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
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });
    };

    // Initialize Scroll Areas
    setupHorizontalScroll('.timeline-container', '.scroll-btn.left', '.scroll-btn.right');
    setupHorizontalScroll('.metaphor-container', '#metaphor-scroll-left', '#metaphor-scroll-right');
});
