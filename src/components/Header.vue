<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useContentStore } from '../stores/content';

const { t, locale } = useI18n();
const contentStore = useContentStore();
const isMenuOpen = ref(false);

watch(isMenuOpen, (val) => {
    if (val) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});

const logoUrl = computed(() => contentStore.settings?.logo_url || '/images/meandme_logo.svg');

const instagramUrl = computed(() => {
    const link = contentStore.settings?.social_links?.find(l => l.platform === 'instagram');
    return link ? link.url : 'https://www.instagram.com/meandme_official/';
});

const facebookUrl = computed(() => {
    const link = contentStore.settings?.social_links?.find(l => l.platform === 'facebook');
    return link ? link.url : 'https://www.facebook.com/meandmepotsdam';
});

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};

const toggleLanguage = () => {
    locale.value = locale.value === 'de' ? 'en' : 'de';
};

const navItems = [
    { key: 'collection', hash: '/#collection' },
    { key: 'brands', hash: '/#brands' },
    { key: 'stores', hash: '/#stores' },
    { key: 'contact', hash: '/#contact' },
    { key: 'inspiration', hash: '/#inspiration' },
    { key: 'about', hash: '/#about' }
];
</script>

<template>
    <header class="header-glass">
        <div class="header-inner">
            <div class="logo">
                <a href="/#collection">
                    <img :src="logoUrl" alt="me&me logo">
                </a>
            </div>

            <nav class="nav-desktop">
                <ul class="nav-list">
                    <li v-for="item in navItems" :key="item.key">
                        <a :href="item.hash">{{ t(`header.${item.key}`) }}</a>
                    </li>
                </ul>
            </nav>

            <div class="header-actions">
                <button class="lang-toggle" @click="toggleLanguage">
                    {{ locale.toUpperCase() }}
                </button>

                <div class="social-links desktop-only">
                    <a :href="facebookUrl" target="_blank" rel="noopener noreferrer">
                        <img src="/images/facebook.svg" alt="Facebook">
                    </a>
                    <a :href="instagramUrl" target="_blank" rel="noopener noreferrer">
                        <img src="/images/instagram.svg" alt="Instagram">
                    </a>
                </div>

                <button class="menu-toggle" @click="toggleMenu" aria-label="Menu">
                    <svg viewBox="0 0 24 24" class="hamburger-icon">
                        <rect y="4" width="24" height="1.5" rx="0.75" />
                        <rect y="11" width="24" height="1.5" rx="0.75" />
                        <rect y="18" width="24" height="1.5" rx="0.75" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Mobile Menu Overlay (Teleported to body to avoid stacking issues) -->
        <Teleport to="body">
            <div class="mobile-menu-overlay" v-if="isMenuOpen" @click="toggleMenu">
                <nav class="mobile-nav" @click.stop>
                    <div class="mobile-nav-header">
                        <button class="close-btn" @click="toggleMenu" aria-label="Close">
                            <svg viewBox="0 0 24 24" class="close-icon">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>

                    <ul class="mobile-nav-list">
                        <li v-for="item in navItems" :key="item.key">
                            <a :href="item.hash" @click="toggleMenu">{{ t(`header.${item.key}`) }}</a>
                        </li>
                    </ul>

                    <div class="mobile-nav-footer">
                        <div class="social-links mobile-large-socials">
                            <a :href="facebookUrl" target="_blank" rel="noopener noreferrer">
                                <img src="/images/facebook.svg" alt="Facebook">
                            </a>
                            <a :href="instagramUrl" target="_blank" rel="noopener noreferrer">
                                <img src="/images/instagram.svg" alt="Instagram">
                            </a>
                        </div>
                    </div>
                </nav>
            </div>
        </Teleport>
    </header>
</template>

<style scoped>
.header-glass {
    height: 100px; /* Consistent height */
}

.header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center; /* Vertical centering for all items */
    height: 100%;
}

.nav-list {
    display: flex;
    gap: 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
    align-items: center;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.logo img {
    height: 70px;
    display: block;
}

.lang-toggle {
    background: none;
    border: 1px solid var(--text-color);
    color: var(--text-color);
    padding: 0.3rem 0.6rem;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 2px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.social-links {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.social-links img {
    height: 24px;
    display: block;
    transition: opacity 0.3s ease;
}

.social-links.desktop-only {
    display: flex;
}

.menu-toggle {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: var(--text-color);
    outline: none;
    -webkit-tap-highlight-color: transparent;
}

.menu-toggle:focus {
    outline: none;
}

.hamburger-icon {
    width: 28px;
    height: 28px;
    fill: currentColor;
}

@media (max-width: 1024px) {
    .nav-desktop, .social-links.desktop-only { display: none; }
    .menu-toggle { display: flex; }
    .header-glass { height: 80px; }
    .logo img { height: 50px; }
}

/* Mobile Menu Overlay */
.mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #deefef !important;
    opacity: 1 !important;
    z-index: 999999 !important;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* No scrolling */
}

.mobile-nav {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    height: 100%; /* Fill viewport */
}

.mobile-nav-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
}

.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.8rem;
    color: #575756 !important;
    outline: none;
    -webkit-tap-highlight-color: transparent;
}

.close-btn:focus {
    outline: none;
}

.close-icon {
    width: 32px;
    height: 32px;
    fill: currentColor;
}

.mobile-nav-list {
    list-style: none;
    padding: 0;
    margin: 2rem 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
}

.mobile-nav-list li a {
    font-family: 'Playfair Display', serif !important;
    font-size: 1.8rem !important;
    text-transform: uppercase;
    color: #575756 !important;
    letter-spacing: 0.1em;
    display: block;
}

.mobile-nav-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding-bottom: 4rem;
}

.mobile-large-socials {
    gap: 3rem !important; /* Wider gap for easier tapping */
}

.mobile-large-socials img {
    height: 32px !important; /* Larger icons for mobile usability */
    width: 32px !important;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
